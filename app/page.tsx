'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const capabilities = [
  ['Email security', 'SPF, DKIM and DMARC signals surfaced clearly.'],
  ['MFA readiness', 'Provider-aware steps that turn findings into action.'],
  ['Priority findings', 'A concise view of what deserves attention first.'],
]

export default function HomePage() {
  const router = useRouter()
  const [domain, setDomain] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'We could not start that scan.'); return }
      router.push(`/scan/${data.scanId}`)
    } catch { setError('Could not reach the scan service. Please try again.') }
    finally { setSubmitting(false) }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--iris-white)]">
      <div className="iris-grid absolute inset-x-0 top-0 -z-0 h-[34rem] opacity-70" />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="IRIS home">
          <Image src="/iris-logo.png" alt="IRIS shield and eye logo" width={44} height={44} className="rounded-xl" priority />
          <span className="text-sm font-extrabold tracking-[0.26em] text-[var(--iris-navy)]">IRIS</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
          <Link href="/hygiene" className="transition hover:text-blue-600">Personal check</Link>
          <Link href="/auth/login" className="transition hover:text-blue-600">Sign in</Link>
          <Link href="/auth/sign-up" className="rounded-full bg-[var(--iris-navy)] px-5 py-2.5 text-white transition hover:bg-blue-700">Create account</Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-14 px-6 pb-20 pt-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-20">
        <div>
          <p className="iris-kicker">Security clarity for modern teams</p>
          <h1 className="mt-5 max-w-3xl text-balance text-5xl font-black leading-[0.98] tracking-[-0.055em] text-[var(--iris-navy)] sm:text-6xl lg:text-7xl">See your exposure.<br /><span className="text-blue-600">Strengthen your signal.</span></h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">IRIS gives you a fast, readable view of the security posture around your business domain — then shows you where to start.</p>
          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500"><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-cyan-400" />Passive and permission-aware</span><span>Built for action, not alarm</span></div>
        </div>

        <div className="iris-panel iris-glow relative overflow-hidden p-2">
          <div className="rounded-[1.35rem] bg-[var(--iris-navy)] p-7 text-white sm:p-9">
            <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Start with a domain</p><h2 className="mt-3 text-2xl font-bold tracking-tight">Run your first posture scan</h2></div><div className="rounded-2xl border border-white/10 bg-white/10 p-3"><Image src="/iris-logo.png" alt="" width={34} height={34} className="rounded-lg" /></div></div>
            <form onSubmit={handleSubmit} className="mt-8">
              <label htmlFor="domain" className="sr-only">Business domain</label>
              <div className="flex flex-col gap-3 sm:flex-row"><input id="domain" type="text" required placeholder="yourcompany.com" value={domain} onChange={(e) => setDomain(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-3.5 text-white outline-none placeholder:text-slate-400 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30" /><button type="submit" disabled={submitting} className="rounded-xl bg-[var(--iris-blue)] px-6 py-3.5 font-bold text-white transition hover:bg-cyan-400 hover:text-[var(--iris-ink)] disabled:cursor-wait disabled:opacity-60">{submitting ? 'Scanning…' : 'Scan for free'}</button></div>
            </form>
            {error && <p className="mt-4 text-sm text-rose-300" role="alert">{error}</p>}
            <p className="mt-5 text-xs leading-5 text-slate-400">Only scan domains you own or are authorised to test. IRIS never requests login credentials.</p>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-[var(--iris-line)] bg-white/70"><div className="mx-auto grid max-w-7xl gap-px px-6 lg:grid-cols-3 lg:px-10">{capabilities.map(([title, text], index) => <div key={title} className="flex gap-4 py-7 lg:px-6 lg:first:pl-0"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-black text-blue-600">0{index + 1}</span><div><h3 className="font-bold text-[var(--iris-navy)]">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{text}</p></div></div>)}</div></section>
      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-10"><p>IRIS · Identity Risk & Intelligence Shield</p><div className="flex gap-5"><Link href="/privacy" className="hover:text-blue-600">Privacy</Link><Link href="/terms" className="hover:text-blue-600">Terms</Link></div></footer>
    </main>
  )
}
