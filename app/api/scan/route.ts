import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabase-server'
import { runDnsChecks } from '@/lib/scanEngine/dnsChecks'
import { findingsFromDnsChecks, computeRiskScore } from '@/lib/scanEngine/riskScore'
import { buildLocalRemediation } from '@/lib/scanEngine/remediation'
import { buildGroqRemediation } from '@/lib/scanEngine/groqRemediation'
import { fingerprintTarget, normalizeTarget } from '@/lib/scanEngine/targets'
import { scanRateLimit } from '@/lib/rate-limit'

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
  const accessLevel = body?.accessLevel === 'extended' ? 'extended' : 'quick'
  let ownerId: string | null = null
  if (accessLevel === 'extended') {
    const userClient = await createSupabaseServerClient()
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Create an account to unlock extended scans.' }, { status: 401 })
    ownerId = user.id
  }
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
    if (target.type === 'domain') {
      const dnsFindings = await runDnsChecks(target.value)
      findings = findingsFromDnsChecks(scan.id, dnsFindings)
      mailProvider = dnsFindings.provider
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
  } catch {
    await supabase.from('scans').update({ status: 'failed', error_code: 'SCAN_EXECUTION_FAILED' }).eq('id', scan.id)
    return NextResponse.json({ error: 'Scan failed, please try again' }, { status: 502 })
  }
}
