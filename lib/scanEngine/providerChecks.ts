import dns from 'node:dns/promises'
import type { FindingInsert, ScanTarget } from '@/packages/types'
import { runAiSocialCheck } from './aiSocialScan'

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
  let mxRecords: string[]
  try {
    mxRecords = (await dns.resolveMx(domain)).sort((a, b) => a.priority - b.priority).map((record) => record.exchange)
  } catch {
    throw new Error('EMAIL_DOMAIN_NOT_DELIVERABLE')
  }
  if (mxRecords.length === 0) throw new Error('EMAIL_DOMAIN_NOT_DELIVERABLE')
  const apiKey = process.env.ABSTRACT_EMAIL_API_KEY
  if (!apiKey) throw new Error('EMAIL_PROVIDER_NOT_CONFIGURED')
  let validation: Record<string, unknown>
  try {
    validation = await jsonRequest(`https://emailvalidation.abstractapi.com/v1/?api_key=${encodeURIComponent(apiKey)}&email=${encodeURIComponent(value)}&auto_correct=false`)
  } catch (error) {
    if (error instanceof Error && error.message === 'PROVIDER_401') throw new Error('EMAIL_PROVIDER_UNAUTHORIZED')
    throw error
  }
  const deliverability = validation.deliverability as string | undefined
  const formatValid = (validation.is_valid_format as { value?: boolean } | undefined)?.value === true
  const mxFound = (validation.is_mx_found as { value?: boolean } | undefined)?.value === true
  const smtpValid = (validation.is_smtp_valid as { value?: boolean } | undefined)?.value === true
  if (!formatValid || !mxFound || deliverability === 'UNDELIVERABLE' || (deliverability !== 'DELIVERABLE' && !smtpValid)) throw new Error('EMAIL_NOT_DELIVERABLE')
  const response = await fetch(`https://api.xposedornot.com/v1/check-email/${encodeURIComponent(value)}`, { signal: AbortSignal.timeout(9000), cache: 'no-store' })
  if (response.status === 404) return { provider: 'xposedornot', evidence: { breached: false, source: 'https://xposedornot.com/' }, findings: [] }
  if (!response.ok) throw new Error(`PROVIDER_${response.status}`)
  const data = await response.json() as { breaches?: string[][] }
  const breaches = Array.isArray(data.breaches) ? data.breaches : []
  const count = breaches.length
  const findings: ProviderCheckResult['findings'] = count > 0 ? [{ category: 'credential_leak', severity: 'high', title: 'Email found in known breach data', description: `XposedOrNot reported ${count} breach source(s) for this address. Change reused passwords and review the named breach sources before taking action.`, weight: 35 }] : []
  return { provider: 'xposedornot+abstract_email_validation', evidence: { domainDeliverable: true, mailboxVerified: true, deliverability, formatValid, mxFound, smtpValid, mxRecords, breached: count > 0, breachCount: count, source: 'https://emailvalidation.abstractapi.com/' }, findings }
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
