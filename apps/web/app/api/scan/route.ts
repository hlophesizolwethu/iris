import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase-server'
import { runDnsChecks } from '@/lib/scanEngine/dnsChecks'
import { findingsFromDnsChecks, computeRiskScore } from '@/lib/scanEngine/riskScore'

const DOMAIN_PATTERN = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})+$/i

function isValidDomain(input: string): boolean {
  return DOMAIN_PATTERN.test(input.trim())
}

// Rate limiting note: production deployment should sit behind an edge rate
// limiter (e.g. Vercel's built-in or Upstash) keyed on IP — omitted here as
// infra config rather than application code, but required before launch
// per Section 8 of the spec (abuse prevention).
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const domain: string | undefined = body?.domain

  if (!domain || !isValidDomain(domain)) {
    return NextResponse.json({ error: 'Please provide a valid domain, e.g. example.com' }, { status: 400 })
  }

  const supabase = createSupabaseServiceRoleClient()
  const requestedByIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null

  const { data: scan, error: insertError } = await supabase
    .from('scans')
    .insert({ domain: domain.toLowerCase().trim(), status: 'running', requested_by_ip: requestedByIp })
    .select()
    .single()

  if (insertError || !scan) {
    return NextResponse.json({ error: 'Could not start scan' }, { status: 500 })
  }

  try {
    // Phase 1 pipeline: DNS/email-auth/MFA-readiness checks run synchronously
    // since they resolve in well under a second. Subdomain enumeration, port
    // scanning, and breach lookups are heavier and should move to a queued
    // background job (see Section 6 of the spec) rather than block this
    // request — left as a follow-up so Phase 1 ships with real signal now.
    const dnsFindings = await runDnsChecks(scan.domain)
    const findingsToInsert = findingsFromDnsChecks(scan.id, dnsFindings)

    const { data: insertedFindings, error: findingsError } = await supabase
      .from('findings')
      .insert(findingsToInsert)
      .select()

    if (findingsError) {
      throw findingsError
    }

    const { total } = computeRiskScore(insertedFindings ?? [])

    await supabase
      .from('scans')
      .update({
        status: 'complete',
        risk_score: total,
        mail_provider: dnsFindings.provider,
        completed_at: new Date().toISOString(),
      })
      .eq('id', scan.id)

    return NextResponse.json({ scanId: scan.id, riskScore: total })
  } catch (err) {
    await supabase.from('scans').update({ status: 'failed' }).eq('id', scan.id)
    return NextResponse.json({ error: 'Scan failed, please try again' }, { status: 500 })
  }
}
