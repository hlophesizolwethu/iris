import type { FindingInsert } from '@packages/types'

type CertificateRecord = { name_value?: string }

export async function runCertificateTransparencyCheck(domain: string, scanId: string): Promise<FindingInsert[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(`https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!response.ok) return []
    const records = (await response.json()) as CertificateRecord[]
    const names = new Set<string>()
    for (const record of records) {
      for (const rawName of (record.name_value ?? '').split('\n')) {
        const name = rawName.trim().toLowerCase().replace(/^\*\./, '')
        if (name && name !== domain && name.endsWith(`.${domain}`)) names.add(name)
      }
    }
    if (names.size === 0) return []
    const listed = [...names].sort().slice(0, 12)
    return [{
      scan_id: scanId,
      category: 'subdomain_exposure',
      severity: 'info',
      title: `${names.size} certificate-listed subdomain${names.size === 1 ? '' : 's'} found`,
      description: `Certificate Transparency logs publicly list ${names.size} hostname${names.size === 1 ? '' : 's'} under this domain. This is verified certificate evidence, not proof that every hostname is currently online. Examples: ${listed.join(', ')}${names.size > listed.length ? ', and more.' : '.'}`,
      weight: 0,
    }]
  } catch {
    return []
  } finally {
    clearTimeout(timeout)
  }
}

export const certificateTransparencySource = 'https://crt.sh/'
