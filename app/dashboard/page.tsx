import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/dashboard')
  const { data: scans } = await supabase.from('scans').select('id, domain, status, risk_score, created_at').eq('owner_id', user.id).order('created_at', { ascending: false }).limit(12)
  const recentScans = (scans ?? []) as Array<{ id: string; domain: string; status: string; risk_score: number | null; created_at: string }>
  return <main className="mx-auto max-w-6xl px-6 py-12"><header className="flex flex-wrap items-end justify-between gap-5"><div><Link href="/" className="font-mono text-xs uppercase tracking-[0.25em] text-amber-400">IRIS</Link><h1 className="mt-5 text-4xl font-semibold">Security workspace</h1><p className="mt-3 text-slate-400">Your private scan history and remediation queue.</p></div><div className="flex gap-3"><Link href="/" className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-slate-950">New scan</Link><a href="/auth/sign-out" className="rounded-lg border border-slate-700 px-4 py-2 font-semibold">Sign out</a></div></header><section className="mt-12 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60"><div className="border-b border-slate-800 px-5 py-4"><h2 className="font-semibold">Recent scans</h2></div>{recentScans.length ? <div className="divide-y divide-slate-800">{recentScans.map(scan => <Link key={scan.id} href={`/scan/${scan.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 transition hover:bg-slate-900"><div><p className="font-mono text-sm text-slate-200">{scan.domain}</p><p className="mt-1 text-xs text-slate-500">{new Date(scan.created_at).toLocaleString()}</p></div><div className="flex items-center gap-4 text-sm"><span className="capitalize text-slate-400">{scan.status}</span>{scan.risk_score !== null && <span className="font-mono text-amber-300">{scan.risk_score}/100</span>}</div></Link>)}</div> : <div className="px-5 py-12 text-center text-slate-400">No scans yet. Start with an authorized domain scan.</div>}</section></main>
}
