import dns from 'node:dns/promises'
import type { FindingInsert, ScanTarget } from '@/packages/types'
import { runAiSocialCheck } from './aiSocialScan'
import { runAiEmailResearch } from './aiEmailScan'

export type ProviderCheckResult = { findings: Omit<FindingInsert, 'scan_id'>[]; provider: string; evidence: Record<string, unknown> }

async function jsonRequest(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(9000), cache: 'no-store' })
  if (!response.ok) throw new Error(`PROVIDER_${response.status}`)
  return response.json() as Promise<Record<string, unknown>>
}

export async function runPhoneCheck(value: string): Promise<ProviderCheckResult> {
  const apiKey = process.env.ABSTRACT_PHONE_API_KEY ?? process.env.ABSTRACT_API_KEY
  if (!apiKey) throw new Error('PROVIDER_NOT_CONFIGURED')
  const data = await jsonRequest(`https://phoneintelligence.abstractapi.com/v1/?api_key=${encodeURIComponent(apiKey)}&phone=${encodeURIComponent(value)}`)
  const valid = data.valid === true
  const findings: ProviderCheckResult['findings'] = []
  if (!valid) findings.push({ category: 'credential_leak', severity: 'low', title: 'Phone number could not be validated', description: 'Abstract API could not verify this number as valid. This is a data-quality or formatting signal, not evidence of compromise or a breach.', weight: 0 })
  return { provider: 'abstract_phone_intelligence', evidence: { valid, lineType: data.type, carrier: data.carrier, mcc: data.mcc, mnc: data.mnc, international: data.international_format, national: data.national_format, country: data.country, countryCode: data.country_code, source: 'https://app.abstractapi.com/api/phone-intelligence/test' }, findings }
}

export async function runEmailCheck(value: string): Promise<ProviderCheckResult> {
  const domain = value.split('@')[1]
  let mxRecords: string[] = []
  let mxStatus = 'unavailable'
  try {
    mxRecords = (await dns.resolveMx(domain)).sort((a, b) => a.priority - b.priority).map((record) => record.exchange)
    mxStatus = mxRecords.length ? 'verified' : 'not_found'
  } catch {
    mxStatus = 'unavailable'
  }
  const apiKey = process.env.ABSTRACT_EMAIL_API_KEY
  let validation: Record<string, unknown> | null = null
  let validationStatus = 'not_configured'
  if (apiKey) {
    try {
      validation = await jsonRequest(`https://emailvalidation.abstractapi.com/v1/?api_key=${encodeURIComponent(apiKey)}&email=${encodeURIComponent(value)}&auto_correct=false`)
      validationStatus = 'verified'
    } catch (error) {
      if (error instanceof Error && error.message === 'PROVIDER_401') validationStatus = 'unauthorized'
      else validationStatus = 'unavailable'
    }
  }
  const deliverability = validation?.deliverability as string | undefined
  const formatValid = validation ? (validation.is_valid_format as { value?: boolean } | undefined)?.value === true : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  const mxFound = validation ? (validation.is_mx_found as { value?: boolean } | undefined)?.value === true : mxRecords.length > 0
  const smtpValid = validation ? (validation.is_smtp_valid as { value?: boolean } | undefined)?.value === true : true
  const deliverabilityWarning = validation?.deliverability === 'UNDELIVERABLE' || (validation && !formatValid)
  let xposedBreaches: string[][] = []
  let xposedStatus = 'unavailable'
  try {
    const response = await fetch(`https://api.xposedornot.com/v1/check-email/${encodeURIComponent(value)}`, { signal: AbortSignal.timeout(9000), cache: 'no-store' })
    if (response.status === 404) xposedStatus = 'clean'
    else if (response.ok) { const data = await response.json() as { breaches?: string[][] }; xposedBreaches = Array.isArray(data.breaches) ? data.breaches : []; xposedStatus = xposedBreaches.length ? 'breached' : 'clean' }
  } catch { xposedStatus = 'unavailable' }
  let ai: Awaited<ReturnType<typeof runAiEmailResearch>> | null = null
  try { ai = await runAiEmailResearch(value, '') } catch (error) { console.error('[v0] AI email research unavailable', error instanceof Error ? error.message : String(error)) }
  const breachNames = Array.from(new Set([...xposedBreaches.map((item) => item[0]).filter(Boolean), ...((ai?.evidence.breaches as { name: string }[] | undefined) ?? []).map((item) => item.name)]))
  const findings: ProviderCheckResult['findings'] = breachNames.length ? [{ category: 'credential_leak', severity: 'high', title: 'Email found in breach intelligence', description: `${breachNames.length} breach source(s) were identified across available evidence. Change reused passwords and review the named sources before taking action.`, weight: 35 }] : ai?.findings ?? []
  findings.push({ category: 'credential_leak', severity: 'info', title: 'Email identity and format checked', description: formatValid ? 'The address has a valid email format. This confirms syntax only; it does not prove mailbox ownership.' : 'The address format requires review before breach evidence can be interpreted.', weight: 0 })
  findings.push({ category: 'credential_leak', severity: mxStatus === 'verified' ? 'info' : 'low', title: mxStatus === 'verified' ? 'Receiving mail domain identified' : 'Receiving mail domain could not be verified', description: mxStatus === 'verified' ? `MX records were found for ${domain}.` : 'DNS/MX verification was unavailable or returned no records during this scan.', weight: 0 })
  findings.push({ category: 'credential_leak', severity: 'info', title: `Breach provider status: ${xposedStatus}`, description: xposedStatus === 'clean' ? 'The available XposedOrNot endpoint returned no matching breach records.' : xposedStatus === 'breached' ? 'The available breach endpoint returned matching evidence.' : 'The breach endpoint was unavailable; this is a coverage limitation, not a clean result.', weight: 0 })
  findings.push({ category: 'credential_leak', severity: 'info', title: 'AI public-web research completed', description: ai ? `AI reviewed public breach disclosures and returned ${Array.isArray(ai.evidence.sources) ? ai.evidence.sources.length : 0} cited source(s). This is not a complete HIBP lookup.` : 'AI public-web research was unavailable for this scan.', weight: 0 })
  return { provider: `xposedornot${ai ? `+${ai.provider}` : ''}`, evidence: { domainDeliverable: mxStatus === 'verified', mxStatus, mailboxVerified: validationStatus === 'verified', validationStatus, deliverability, deliverabilityWarning, formatValid, mxFound, smtpValid, mxRecords, xposedStatus, breachNames, ai: ai?.evidence ?? { mode: 'public_web_breach_research', status: 'unavailable', limitations: ['AI public-web research was unavailable for this scan.'] }, breached: breachNames.length > 0, source: 'https://xposedornot.com/' }, findings }
}

export async function runGitHubCheck(value: string): Promise<ProviderCheckResult> {
  const username = value.replace(/^https?:\/\/github\.com\//, '').replace(/^@/, '').split('/')[0]
  const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers: { accept: 'application/vnd.github+json', 'user-agent': 'IRIS-security-scanner' }, signal: AbortSignal.timeout(9000), cache: 'no-store' })
  if (response.status === 404) return { provider: 'github_public_api', evidence: { found: false, username, source: 'https://docs.github.com/en/rest/users/users' }, findings: [] }
  if (!response.ok) throw new Error(`PROVIDER_${response.status}`)
  const data = await response.json() as { login?: string; id?: number; public_repos?: number; created_at?: string }
  return { provider: 'github_public_api', evidence: { found: true, username: data.login, id: data.id, publicRepos: data.public_repos, createdAt: data.created_at, source: 'https://docs.github.com/en/rest/users/users' }, findings: [] }
}

export async function runBlueskyCheck(value: string): Promise<ProviderCheckResult> {
  const handle = value.replace(/^https?:\/\/bsky\.app\/profile\//, '').replace(/^@/, '').split('/')[0]
  const response = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(handle)}`, { signal: AbortSignal.timeout(9000), cache: 'no-store' })
  if (response.status === 400 || response.status === 404) return { provider: 'bluesky_public_api', evidence: { found: false, handle, source: 'https://docs.bsky.app/' }, findings: [] }
  if (!response.ok) throw new Error(`PROVIDER_${response.status}`)
  const data = await response.json() as { handle?: string; did?: string; followersCount?: number }
  return { provider: 'bluesky_public_api', evidence: { found: true, handle: data.handle, did: data.did, followers: data.followersCount, source: 'https://docs.bsky.app/' }, findings: [] }
}

export async function runProviderCheck(target: ScanTarget, scanId = ''): Promise<ProviderCheckResult> {
  if (target.type === 'phone') return runPhoneCheck(target.value)
  if (target.type === 'email') return runEmailCheck(target.value)
  if (target.type === 'social_profile') return runAiSocialCheck(target, scanId)
  throw new Error('PROVIDER_NOT_CONFIGURED')
}
