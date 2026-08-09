import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServiceRoleClient } from '@/lib/supabase-server'
import { getMfaGuide } from '@/lib/mfa/providerGuides'
import ScoreBadge from '@/components/ScoreBadge'
import FindingsList from '@/components/FindingsList'
import MfaChecklist from '@/components/MfaChecklist'
import ScanStatus from '@/components/ScanStatus'
import type { EmailProvider } from '@packages/types'

interface ScanReportPageProps { params: Promise<{ id: string }> }

export default async function ScanReportPage({ params }: ScanReportPageProps) {
  const { id } = await params
  const supabase = createSupabaseServiceRoleClient()
  const { data: scan } = await supabase.from('scans').select().eq('id', id).single()
  if (!scan) notFound()
  const { data: findings } = await supabase.from('findings').select().eq('scan_id', id).order('created_at', { ascending: true })
  const { data: mfaProgress } = await supabase.from('mfa_checklist_progress').select().eq('scan_id', id)
  const provider: EmailProvider = scan.mail_provider ?? 'unknown'
  const completedSteps = (mfaProgress ?? []).filter((p: { completed: boolean }) => p.completed).map((p: { step_key: string }) => p.step_key)
  if (scan.status !== 'complete') return <main className="min-h-screen bg-[var(--iris-white)] px-6 py-20"><div className="mx-auto max-w-2xl text-center"><Link href="/" className="text-sm font-bold tracking-[0.2em] text-blue-600">IRIS</Link><div className="iris-panel mt-12 p-10"><p className="iris-kicker">Posture scan</p><div className="mt-5 text-slate-600">{scan.status === 'failed' ? 'This scan failed. Please try again.' : <ScanStatus scanId={scan.id} />}</div></div></div></main>
  const mfaGuide = getMfaGuide(provider)
  return <main className="min-h-screen bg-[var(--iris-white)]"><header className="border-b border-[var(--iris-line)] bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"><Link href="/" className="text-sm font-black tracking-[0.24em] text-[var(--iris-navy)]">IRIS</Link><Link href="/" className="text-sm font-semibold text-blue-600 hover:text-[var(--iris-navy)]">New scan</Link></div></header><div className="mx-auto max-w-6xl px-6 py-12 lg:py-16"><div className="flex flex-col gap-8 rounded-3xl bg-[var(--iris-navy)] p-7 text-white sm:p-10 lg:flex-row lg:items-center"><ScoreBadge score={scan.risk_score ?? 0} /><div><p className="iris-kicker !text-cyan-300">Security posture report</p><h1 className="mt-3 break-all text-3xl font-black tracking-tight sm:text-4xl">{scan.domain}</h1><p className="mt-3 text-sm text-slate-300">Scanned {new Date(scan.completed_at ?? scan.created_at).toLocaleString()}</p></div></div><section className="mt-12"><div className="mb-5 flex items-end justify-between"><div><p className="iris-kicker">What needs attention</p><h2 className="mt-2 text-2xl font-black text-[var(--iris-navy)]">Prioritized findings</h2></div><span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">{findings?.length ?? 0} signals</span></div><FindingsList findings={findings ?? []} /></section><section className="mt-12"><p className="iris-kicker">Build resilience</p><h2 className="mt-2 mb-5 text-2xl font-black text-[var(--iris-navy)]">MFA readiness</h2><MfaChecklist scanId={scan.id} guide={mfaGuide} initiallyCompleted={completedSteps} /></section><section className="mt-12 rounded-3xl border border-blue-100 bg-blue-50 p-7 sm:p-9"><p className="iris-kicker">Keep your signal strong</p><h2 className="mt-2 text-xl font-black text-[var(--iris-navy)]">Want this monitored continuously?</h2><p className="mt-2 max-w-2xl leading-7 text-slate-600">IRIS is a snapshot. Talk with the MetaPhoenix Security team about building an always-on path around the issues you found.</p><Link href="/" className="mt-5 inline-flex rounded-xl bg-[var(--iris-navy)] px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">Run another scan</Link></section></div></main>
}
