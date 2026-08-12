import type { Finding, FindingInsert, DnsFindings, RiskScoreBreakdown } from '@packages/types'

// Phase 1 scoring: a transparent, weighted rules engine — deliberately not
// an ML model. Every finding's weight is visible in the report copy so a
// user can see exactly why their score is what it is. See IRIS Technical
// Spec, Section 7, for why this stays rule-based until real outcome data
// exists to justify a learned model.

const MAX_SCORE = 100

const SEVERITY_WEIGHT: Record<Finding['severity'], number> = {
  info: 0,
  low: 3,
  medium: 8,
  high: 15,
  critical: 25,
}

export function findingsFromDnsChecks(scanId: string, dnsFindings: DnsFindings): FindingInsert[] {
  const findings: FindingInsert[] = []

  if (!dnsFindings.spf.present) {
    findings.push({
      scan_id: scanId,
      category: 'email_auth',
      severity: 'high',
      title: 'No SPF record found',
      description:
        'This domain has no SPF (Sender Policy Framework) record, making it easier for attackers to send email that appears to come from you.',
      weight: SEVERITY_WEIGHT.high,
    })
  } else if (!dnsFindings.spf.valid) {
    findings.push({
      scan_id: scanId,
      category: 'email_auth',
      severity: 'medium',
      title: 'SPF record present but may be misconfigured',
      description:
        'An SPF record exists but does not end with a clear enforcement mechanism (-all or ~all), which weakens its protection.',
      weight: SEVERITY_WEIGHT.medium,
    })
  }

  if (!dnsFindings.dmarc.present) {
    findings.push({
      scan_id: scanId,
      category: 'email_auth',
      severity: 'high',
      title: 'No DMARC record found',
      description:
        'Without DMARC, there is no policy telling receiving mail servers what to do with email that fails authentication — this is one of the most common gaps attackers exploit for spoofing.',
      weight: SEVERITY_WEIGHT.high,
    })
  } else if (dnsFindings.dmarc.policy === 'none') {
    findings.push({
      scan_id: scanId,
      category: 'email_auth',
      severity: 'medium',
      title: 'DMARC policy set to "none"',
      description:
        'A DMARC record exists but is in monitoring-only mode and does not actually block spoofed email. Consider moving to "quarantine" or "reject" once reports look clean.',
      weight: SEVERITY_WEIGHT.medium,
    })
  }

  if (!dnsFindings.dkim.present) {
    findings.push({
      scan_id: scanId,
      category: 'email_auth',
      severity: 'medium',
      title: 'No DKIM record found at common selectors',
      description:
        'No DKIM signature configuration was found at the selectors IRIS checks by default. This is inconclusive if your provider uses a custom selector — but if DKIM truly is not configured, it should be.',
      weight: SEVERITY_WEIGHT.medium,
    })
  }

  if (!dnsFindings.https.reachable) {
    findings.push({
      scan_id: scanId,
      category: 'ssl_tls',
      severity: 'high',
      title: 'HTTPS endpoint could not be verified',
      description: 'DNS resolves, but IRIS could not establish an HTTPS response within the verification window. This may indicate missing HTTPS, an unavailable origin, or a network policy blocking the check.',
      weight: SEVERITY_WEIGHT.high,
    })
  } else {
    const missingHeaders = ['strict-transport-security', 'content-security-policy', 'x-content-type-options'].filter((header) => !dnsFindings.https.headers.includes(header))
    if (missingHeaders.length) {
      findings.push({
        scan_id: scanId,
        category: 'ssl_tls',
        severity: 'medium',
        title: 'Important security headers are missing',
        description: `The verified HTTPS response did not include: ${missingHeaders.join(', ')}. These headers reduce downgrade, injection, and content-sniffing risk, but this result reflects only the response IRIS could inspect.`,
        weight: SEVERITY_WEIGHT.medium,
      })
    }
  }

  if (dnsFindings.provider === 'unknown') {
    findings.push({
      scan_id: scanId,
      category: 'mfa_readiness',
      severity: 'low',
      title: 'Email provider could not be identified',
      description:
        'IRIS could not determine your email provider from MX records, so it cannot offer a provider-specific MFA setup guide. You can still follow the generic MFA checklist.',
      weight: SEVERITY_WEIGHT.low,
    })
  } else {
    findings.push({
      scan_id: scanId,
      category: 'mfa_readiness',
      severity: 'info',
      title: `Email provider identified: ${dnsFindings.provider.replace('_', ' ')}`,
      description:
        'IRIS has a guided MFA setup walkthrough available for this provider — see the MFA Readiness section of your report.',
      weight: SEVERITY_WEIGHT.info,
    })
  }

  return findings
}

export function computeRiskScore(findings: Pick<Finding, 'category' | 'weight'>[]): RiskScoreBreakdown {
  const byCategory: RiskScoreBreakdown['byCategory'] = {
    subdomain_exposure: 0,
    open_port: 0,
    ssl_tls: 0,
    dns_misconfig: 0,
    credential_leak: 0,
    email_auth: 0,
    mfa_readiness: 0,
  }

  for (const finding of findings) {
    byCategory[finding.category] += finding.weight
  }

  const totalDeductions = Object.values(byCategory).reduce((sum, v) => sum + v, 0)
  const total = Math.max(0, Math.min(MAX_SCORE, MAX_SCORE - totalDeductions))

  return { total, byCategory }
}
