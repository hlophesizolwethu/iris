import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase-server'
import { runDnsChecks } from '@/lib/scanEngine/dnsChecks'
import { findingsFromDnsChecks, computeRiskScore } from '@/lib/scanEngine/riskScore'
import { scanRateLimit } from '@/lib/rate-limit'

const DOMAIN_PATTERN = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})+$/i

function normaliseDomain(input: unknown): string | null {
  if (typeof input !== 'string' || input.length > 255) return null
  const domain = input.trim().toLowerCase().replace(/\.$/, '')
  return DOMAIN_PATTERN.test(domain) ? domain : null
}

function clientKey(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}

export async function POST(request: NextRequest) {
  const key = clientKey(request)
  const limit = scanRateLimit(key)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many scan requests. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    )
  }

  const body = await request.json().catch(() => null)
  const domain = normaliseDomain(body?.domain)
  if (!domain) {
    return NextResponse.json({ error: 'Please provide a valid domain, e.g. example.com' }, { status: 400 })
  }

  const supabase = createSupabaseServiceRoleClient()
  const { data: scan, error: insertError } = await supabase
    .from('scans')
    .insert({ domain, status: 'running', requested_by_ip: key === 'unknown' ? null : key })
    .select()
    .single()

  if (insertError || !scan) {
    return NextResponse.json({ error: 'Could not start scan' }, { status: 500 })
  }

  try {
    const dnsFindings = await runDnsChecks(domain)
    const findingsToInsert = findingsFromDnsChecks(scan.id, dnsFindings)
    const { data: insertedFindings, error: findingsError } = await supabase.from('findings').insert(findingsToInsert).select()
    if (findingsError) throw findingsError

    const { total } = computeRiskScore(insertedFindings ?? [])
    const { error: updateError } = await supabase.from('scans').update({
      status: 'complete',
      risk_score: total,
      mail_provider: dnsFindings.provider,
      completed_at: new Date().toISOString(),
    }).eq('id', scan.id)
    if (updateError) throw updateError

    return NextResponse.json({ scanId: scan.id, riskScore: total }, { status: 201 })
  } catch {
    await supabase.from('scans').update({ status: 'failed', error_code: 'SCAN_EXECUTION_FAILED' }).eq('id', scan.id)
    return NextResponse.json({ error: 'Scan failed, please try again' }, { status: 502 })
  }
}
