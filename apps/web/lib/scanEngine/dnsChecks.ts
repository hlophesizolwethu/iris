import { promises as dns } from 'node:dns'
import type { DnsFindings, EmailProvider } from '@packages/types'

// All checks here are passive DNS lookups. No credentials are ever
// requested, transmitted, or stored — see IRIS Technical Spec, Section 8.

function detectProvider(mxRecords: string[]): EmailProvider {
  const joined = mxRecords.join(' ').toLowerCase()
  if (joined.includes('google.com') || joined.includes('googlemail.com')) {
    return 'google_workspace'
  }
  if (joined.includes('outlook.com') || joined.includes('protection.outlook.com')) {
    return 'microsoft_365'
  }
  if (joined.includes('zoho.com') || joined.includes('zohomail.com')) {
    return 'zoho'
  }
  if (mxRecords.length > 0) {
    return 'self_hosted'
  }
  return 'unknown'
}

async function getMxRecords(domain: string): Promise<string[]> {
  try {
    const records = await dns.resolveMx(domain)
    return records.sort((a, b) => a.priority - b.priority).map((r) => r.exchange)
  } catch {
    return []
  }
}

async function getSpf(domain: string): Promise<DnsFindings['spf']> {
  try {
    const txtRecords = await dns.resolveTxt(domain)
    const flat = txtRecords.map((parts) => parts.join(''))
    const spfRecord = flat.find((r) => r.startsWith('v=spf1')) ?? null
    return {
      present: spfRecord !== null,
      record: spfRecord,
      // Minimal validity heuristic: has a terminating "all" mechanism.
      valid: spfRecord !== null && /[-~?]all\b/.test(spfRecord),
    }
  } catch {
    return { present: false, record: null, valid: false }
  }
}

async function getDkim(domain: string): Promise<DnsFindings['dkim']> {
  // DKIM selectors are provider-specific and not discoverable without prior
  // knowledge. We probe the common default selectors for the major
  // providers; absence of a hit is inconclusive, not proof DKIM is unset —
  // the report copy must reflect that nuance rather than overclaiming.
  const commonSelectors = ['google', 'selector1', 'selector2', 'zoho', 'default']
  const checked: string[] = []
  let present = false

  for (const selector of commonSelectors) {
    checked.push(selector)
    try {
      const records = await dns.resolveTxt(`${selector}._domainkey.${domain}`)
      if (records.length > 0) {
        present = true
        break
      }
    } catch {
      // Selector not found — expected for most, continue.
    }
  }

  return { present, selectorsChecked: checked }
}

async function getDmarc(domain: string): Promise<DnsFindings['dmarc']> {
  try {
    const txtRecords = await dns.resolveTxt(`_dmarc.${domain}`)
    const flat = txtRecords.map((parts) => parts.join(''))
    const dmarcRecord = flat.find((r) => r.startsWith('v=DMARC1')) ?? null
    if (!dmarcRecord) {
      return { present: false, record: null, policy: null }
    }
    const policyMatch = dmarcRecord.match(/p=(none|quarantine|reject)/)
    return {
      present: true,
      record: dmarcRecord,
      policy: (policyMatch?.[1] as 'none' | 'quarantine' | 'reject') ?? null,
    }
  } catch {
    return { present: false, record: null, policy: null }
  }
}

export async function runDnsChecks(domain: string): Promise<DnsFindings> {
  const mxRecords = await getMxRecords(domain)
  const [spf, dkim, dmarc] = await Promise.all([
    getSpf(domain),
    getDkim(domain),
    getDmarc(domain),
  ])

  return {
    provider: detectProvider(mxRecords),
    mxRecords,
    spf,
    dkim,
    dmarc,
  }
}
