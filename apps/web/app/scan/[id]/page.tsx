import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getMfaGuide } from '@/lib/mfa/providerGuides'
import ScoreBadge from '@/components/ScoreBadge'
import FindingsList from '@/components/FindingsList'
import MfaChecklist from '@/components/MfaChecklist'
import type { EmailProvider } from '@packages/types'

interface ScanReportPageProps {
  params: Promise<{ id: string }>
}

export default async function ScanReportPage({ params }: ScanReportPageProps) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: scan } = await supabase.from('scans').select().eq('id', id).single()
  if (!scan) notFound()

  const { data: findings } = await supabase
    .from('findings')
    .select()
    .eq('scan_id', id)
    .order('created_at', { ascending: true })

  const { data: mfaProgress } = await supabase
    .from('mfa_checklist_progress')
    .select()
    .eq('scan_id', id)

  const provider: EmailProvider = scan.mail_provider ?? 'unknown'
  const mfaGuide = getMfaGuide(provider)

  const completedSteps = (mfaProgress ?? []).filter((p) => p.completed).map((p) => p.step_key)

  if (scan.status !== 'complete') {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-neutral-400">
          {scan.status === 'failed' ? 'This scan failed. Please try again.' : 'Scan in progress\u2026'}
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center gap-6">
        <ScoreBadge score={scan.risk_score ?? 0} />
        <div>
          <h1 className="text-2xl font-bold">{scan.domain}</h1>
          <p className="text-neutral-500">
            Scanned {new Date(scan.completed_at ?? scan.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-neutral-200">Findings</h2>
        <FindingsList findings={findings ?? []} />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-neutral-200">MFA Readiness</h2>
        <MfaChecklist scanId={scan.id} guide={mfaGuide} initiallyCompleted={completedSteps} />
      </section>

      <section className="mt-10 rounded-md border border-amber-800/40 bg-amber-950/20 p-5">
        <h2 className="font-semibold text-amber-400">Want this monitored continuously?</h2>
        <p className="mt-1 text-sm text-neutral-400">
          AegisAgent watches for exactly these issues around the clock and can enforce MFA
          policy automatically. IRIS is a snapshot \u2014 AegisAgent is the always-on version.
        </p>
        <a
          href="/contact"
          className="mt-3 inline-block rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-amber-400"
        >
          Talk to us
        </a>
      </section>
    </main>
  )
}
