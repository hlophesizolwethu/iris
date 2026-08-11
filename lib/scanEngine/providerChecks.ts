import type { FindingInsert, ScanTarget } from '@/packages/types'

export type ProviderCheckResult = { findings: Omit<FindingInsert, 'scan_id'>[]; provider: string; evidence: Record<string, unknown> }

async function jsonRequest(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(9000), cache: 'no-store' })
  if (!response.ok) throw new Error(`PROVIDER_${response.status}`)
  return response.json() as Promise<Record<string, unknown>>
}

export async function runPhoneCheck(value: string): Promise<ProviderCheckResult> {
  const apiKey = process.env.ABSTRACT_API_KEY
  if (!apiKey) throw new Error('PROVIDER_NOT_CONFIGURED')
  const data = await jsonRequest(`https://phoneintelligence.abstractapi.com/v1/?api_key=${encodeURIComponent(apiKey)}&phone=${encodeURIComponent(value)}`)
  const valid = data.valid === true
  const findings: ProviderCheckResult['findings'] = []
  if (!valid) findings.push({ category: 'credential_leak', severity: 'high', title: 'Phone number failed validation', description: 'Abstract API could not verify this as a valid phone number. This is a provider response, not a breach finding.', weight: 25 })
  return { provider: 'abstract_phone_validation', evidence: { valid, country: data.country, carrier: data.carrier, type: data.type }, findings }
}

export async function runEmailCheck(value: string): Promise<ProviderCheckResult> {
  const key = process.env.Intelligence_x_key
  if (!key) throw new Error('PROVIDER_NOT_CONFIGURED')
  const data = await jsonRequest('https://2.intelx.io/intelligent/search', { method: 'POST', headers: { 'x-key': key, 'content-type': 'application/json' }, body: JSON.stringify({ term: value, maxresults: 10, media: 0 }) })
  const records = Array.isArray(data.records) ? data.records.length : 0
  const findings: ProviderCheckResult['findings'] = records > 0 ? [{ category: 'credential_leak', severity: 'high', title: 'Email appeared in provider search results', description: `Intelligence X returned ${records} matching record reference(s). Review the provider evidence before taking action; IRIS does not infer the source or validity of those records.`, weight: 35 }] : []
  return { provider: 'intelligence_x', evidence: { records }, findings }
}

export async function runBlueskyCheck(value: string): Promise<ProviderCheckResult> {
  const handle = value.replace(/^https?:\/\/bsky\.app\/profile\//, '').replace(/^@/, '').split('/')[0]
  const data = await jsonRequest(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(handle)}`)
  return { provider: 'bluesky_public_api', evidence: { handle: data.handle, did: data.did, followers: data.followersCount }, findings: [] }
}

export async function runProviderCheck(target: ScanTarget): Promise<ProviderCheckResult> {
  if (target.type === 'phone') return runPhoneCheck(target.value)
  if (target.type === 'email') return runEmailCheck(target.value)
  if (target.type === 'social_profile' && target.platform === 'bluesky') return runBlueskyCheck(target.value)
  throw new Error('PROVIDER_NOT_CONFIGURED')
}
