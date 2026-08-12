import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabase-server'
import { runDnsChecks } from '@/lib/scanEngine/dnsChecks'
import { findingsFromDnsChecks, computeRiskScore } from '@/lib/scanEngine/riskScore'
import { buildLocalRemediation } from '@/lib/scanEngine/remediation'
import { buildGroqRemediation } from '@/lib/scanEngine/groqRemediation'
import { fingerprintTarget, normalizeTarget } from '@/lib/scanEngine/targets'
import { scanRateLimit } from '@/lib/rate-limit'
import { runProviderCheck } from '@/lib/scanEngine/providerChecks'
import { runCertificateTransparencyCheck } from '@/lib/scanEngine/certificateTransparency'

function clientKey(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}

export async function POST(request: NextRequest) {
  const key = clientKey(request)
  const limit = scanRateLimit(key)
  if (!limit.allowed) return NextResponse.json({ error: 'Too many scan requests. Please try again shortly.' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } })
  const body = await request.json().catch(() => null)
  const target = normalizeTarget(body?.target ?? { type: 'domain', value: body?.domain })
  if (!target) return NextResponse.json({ error: 'Enter a valid target. Phone numbers must use international format.' }, { status: 400 })
  const userClient = await createSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  const requestedExtended = body?.accessLevel === 'extended'
  const accessLevel = user ? 'extended' : 'quick'
  if (requestedExtended && !user) return NextResponse.json({ error: 'Your private scan session expired. Sign in again to keep this scan in your workspace.' }, { status: 401 })
  const ownerId = user?.id ?? null
  const supabase = createSupabaseServiceRoleClient()
  const { data: scan, error: insertError } = await supabase.from('scans').insert({
    owner_id: ownerId,
    domain: target.type === 'domain' ? target.value : null,
    target_type: target.type,
    target_platform: target.platform ?? null,
    target_fingerprint: fingerprintTarget(target),
    access_level: accessLevel,
    status: 'running',
    requested_by_ip: key === 'unknown' ? null : key,
  }).select().single()
  if (insertError || !scan) return NextResponse.json({ error: 'Could not start scan' }, { status: 500 })
  try {
    let findings: Awaited<ReturnType<typeof findingsFromDnsChecks>> = []
    let mailProvider = null
    let evidence: Record<string, unknown> = {}
    if (target.type === 'domain') {
      const dnsFindings = await runDnsChecks(target.value)
      findings = findingsFromDnsChecks(scan.id, dnsFindings)
      const certificateFindings = await runCertificateTransparencyCheck(target.value, scan.id)
      findings = [...findings, ...certificateFindings]
      mailProvider = dnsFindings.provider
      evidence = { ...dnsFindings, certificateTransparency: { source: 'https://crt.sh/', findings: certificateFindings.length } }
    } else {
      const providerResult = await runProviderCheck(target)
      findings = providerResult.findings.map((finding) => ({ ...finding, scan_id: scan.id })) as Awaited<ReturnType<typeof findingsFromDnsChecks>>
      evidence = { provider: providerResult.provider, ...providerResult.evidence }
      mailProvider = null
    }
    if (findings.length) {
      const { error } = await supabase.from('findings').insert(findings)
      if (error) throw error
    }
    const localGuide = buildLocalRemediation(findings as never)
    const groqGuide = await buildGroqRemediation(findings as never)
    const guide = groqGuide ?? localGuide
    const total = computeRiskScore(findings as never).total
    const { error: updateError } = await supabase.from('scans').update({ status: 'complete', risk_score: total, mail_provider: mailProvider, remediation_provenance: groqGuide ? 'groq' : localGuide ? 'local' : 'unavailable', remediation_guide: guide, completed_at: new Date().toISOString() }).eq('id', scan.id)
    if (updateError) throw updateError
    return NextResponse.json({ scanId: scan.id, riskScore: total }, { status: 201 })
  } catch (error) {
    const notFound = error instanceof Error && error.name === 'DOMAIN_NOT_FOUND'
    const providerUnavailable = error instanceof Error && (error.message === 'PROVIDER_NOT_CONFIGURED' || error.message.startsWith('PROVIDER_'))
    const errorCode = notFound ? 'DOMAIN_NOT_FOUND' : providerUnavailable ? 'PROVIDER_UNAVAILABLE' : 'SCAN_EXECUTION_FAILED'
    await supabase.from('scans').update({ status: 'failed', error_code: errorCode }).eq('id', scan.id)
    const message = notFound
      ? 'We could not find that domain in DNS. No risk score was generated.'
      : providerUnavailable
        ? 'This scan could not be verified because its evidence provider is unavailable or not configured. No risk score was generated.'
        : 'Scan failed, please try again'
    return NextResponse.json({ error: message }, { status: notFound ? 404 : providerUnavailable ? 503 : 502 })
  }
}
