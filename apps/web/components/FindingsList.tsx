import type { Finding } from '@packages/types'

const SEVERITY_STYLES: Record<Finding['severity'], string> = {
  critical: 'border-red-500 text-red-400',
  high: 'border-orange-500 text-orange-400',
  medium: 'border-amber-500 text-amber-400',
  low: 'border-sky-500 text-sky-400',
  info: 'border-neutral-600 text-neutral-400',
}

export default function FindingsList({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) {
    return <p className="text-neutral-500">No findings recorded for this scan.</p>
  }

  return (
    <ul className="space-y-3">
      {findings.map((finding) => (
        <li
          key={finding.id}
          className={`rounded-md border-l-4 bg-neutral-900 p-4 ${SEVERITY_STYLES[finding.severity]}`}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-neutral-100">{finding.title}</h3>
            <span className="text-xs uppercase tracking-wide">{finding.severity}</span>
          </div>
          <p className="mt-1 text-sm text-neutral-400">{finding.description}</p>
        </li>
      ))}
    </ul>
  )
}
