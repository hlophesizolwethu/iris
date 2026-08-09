import type { Finding, RemediationGuide } from '@packages/types'

export function buildLocalRemediation(findings: Pick<Finding, 'id' | 'title' | 'description' | 'severity'>[]): RemediationGuide {
  const actionable = findings.filter((finding) => finding.severity !== 'info')
  const steps = actionable.map((finding, index) => ({
    id: finding.id,
    title: finding.title,
    instruction: remediationInstruction(finding.title),
    evidence: finding.description,
    priority: index < 2 ? 'now' as const : index < 4 ? 'next' as const : 'later' as const,
  }))
  return {
    provenance: 'local',
    title: steps.length ? 'Your clearest path forward' : 'No verified fixes required',
    summary: steps.length ? `IRIS found ${steps.length} verified issue${steps.length === 1 ? '' : 's'} with a concrete next step.` : 'The available checks did not identify a verified issue requiring remediation.',
    steps,
    limitations: ['This guide uses only evidence collected by the completed scan.', 'It does not test private systems or confirm that a fix has been deployed.'],
  }
}

function remediationInstruction(title: string): string {
  const lower = title.toLowerCase()
  if (lower.includes('spf')) return 'Publish or correct one SPF TXT record for this domain. Include every approved sender and finish with an explicit ~all or -all policy.'
  if (lower.includes('dmarc')) return 'Publish a DMARC TXT record at _dmarc with rua reporting. Start with p=none while reviewing reports, then move toward quarantine or reject.'
  if (lower.includes('dkim')) return 'Enable DKIM in your mail provider, publish its selector record, and send a test message to confirm signing.'
  if (lower.includes('mfa')) return 'Enable phishing-resistant MFA for administrator and mailbox accounts first, then require it for all users.'
  return 'Review this finding with the system owner, apply the smallest safe configuration change, and rerun the scan to verify it.'
}
