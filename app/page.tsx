'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthNav from '@/components/AuthNav'
import { TypewriterWords } from '@/components/TypewriterWords'

type ScanType = 'domain' | 'email' | 'phone' | 'social_profile'
type Platform = 'linkedin' | 'github' | 'x' | 'instagram' | 'facebook' | 'youtube'

const scanTypes: { type: ScanType; label: string; icon: string; placeholder: string }[] = [
  { type: 'domain', label: 'Domain', icon: '◈', placeholder: 'yourcompany.com' },
  { type: 'email', label: 'Email', icon: '@', placeholder: 'name@company.com' },
  { type: 'phone', label: 'Phone', icon: '⌕', placeholder: '+1 555 123 4567' },
  { type: 'social_profile', label: 'Social', icon: '◎', placeholder: 'https://...' },
]
const platforms: { value: Platform; label: string; glyph: string }[] = [
  { value: 'linkedin', label: 'LinkedIn', glyph: 'in' }, { value: 'github', label: 'GitHub', glyph: '⌘' },
  { value: 'x', label: 'X', glyph: '𝕏' }, { value: 'instagram', label: 'Instagram', glyph: '◎' },
  { value: 'facebook', label: 'Facebook', glyph: 'f' }, { value: 'youtube', label: 'YouTube', glyph: '▶' },
]

export default function HomePage() {
  const router = useRouter()
  const [type, setType] = useState<ScanType>('domain')
  const [platform, setPlatform] = useState<Platform>('linkedin')
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setSubmitting(true)
    try {
      const res = await fetch('/api/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: { type, value, ...(type === 'social_profile' ? { platform } : {}) } }) })
      const data = await res.json(); if (!res.ok) { setError(data.error ?? 'Enter a valid email address, domain, international phone number, or supported social profile. No scan or score was created.'); return }; router.push(`/scan/${data.scanId}`)
    } catch { setError('Could not reach the scan service. Please try again.') } finally { setSubmitting(false) }
  }
  const selected = scanTypes.find((item) => item.type === type) ?? scanTypes[0]
  return <main className="min-h-screen overflow-hidden bg-[var(--iris-white)]"><div className="iris-grid absolute inset-x-0 top-0 -z-0 h-[34rem] opacity-70" /><header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10"><Link href="/" className="flex items-center gap-3" aria-label="IRIS home"><Image src="/iris-logo.png" alt="IRIS shield and eye logo" width={44} height={44} className="rounded-xl" priority /><span className="text-sm font-extrabold tracking-[0.26em] text-[var(--iris-navy)]">IRIS</span></Link><nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex"><Link href="/hygiene" className="transition hover:text-blue-600">Personal check</Link><AuthNav /></nav></header><section className="relative z-10 mx-auto grid max-w-7xl gap-14 px-6 pb-20 pt-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-20"><div><p className="iris-kicker">Security clarity for modern teams</p><h1 className="mt-5 max-w-3xl text-balance text-5xl font-black leading-[0.98] tracking-[-0.055em] text-[var(--iris-navy)] sm:text-6xl lg:text-7xl">Check every <span className="text-blue-600"><TypewriterWords word="Signal" /></span>.<br /><span className="text-blue-600">Fix what <TypewriterWords word="matters" />.</span></h1><p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">IRIS checks domains, inboxes, phone numbers and public profiles using evidence it can verify — then gives you a simple path forward.</p><div className="mt-8 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500"><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-cyan-400" />Public quick checks</span><span>Signup unlocks extended coverage</span></div></div><div className="iris-panel iris-glow relative overflow-hidden p-2"><div className="rounded-[1.35rem] bg-[var(--iris-navy)] p-7 text-white sm:p-9"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Choose a signal</p><h2 className="mt-3 text-2xl font-bold tracking-tight">Run a quick check</h2></div><Image src="/iris-logo.png" alt="" width={42} height={42} className="rounded-xl" /></div><div className="mt-7 grid grid-cols-4 gap-2" role="tablist" aria-label="Scan type"><div className="col-span-4 grid grid-cols-4 gap-2">{scanTypes.map((item) => <button key={item.type} type="button" role="tab" aria-selected={type === item.type} onClick={() => { setType(item.type); setValue('') }} className={`rounded-xl border px-2 py-3 text-center transition ${type === item.type ? 'border-cyan-300 bg-cyan-300/15 text-cyan-200' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/30'}`}><span className="block text-xl font-bold">{item.icon}</span><span className="mt-1 block text-[10px] font-bold uppercase tracking-wider">{item.label}</span></button>)}</div></div>{type === 'social_profile' && <div className="mt-4 flex gap-2" aria-label="Social platform"><span className="sr-only">Select a social platform</span>{platforms.map((item) => <button key={item.value} type="button" title={item.label} aria-label={item.label} onClick={() => setPlatform(item.value)} className={`flex size-9 items-center justify-center rounded-full border text-sm font-black transition ${platform === item.value ? 'border-cyan-300 bg-cyan-300 text-[var(--iris-ink)]' : 'border-white/15 bg-white/5 text-slate-300 hover:border-cyan-300'}`}>{item.glyph}</button>)}</div>}<form onSubmit={handleSubmit} className="mt-5"><label htmlFor="target" className="sr-only">{selected.label} to scan</label><div className="flex flex-col gap-3 sm:flex-row"><input id="target" type="text" required placeholder={selected.placeholder} value={value} onChange={(e) => setValue(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-3.5 text-white outline-none placeholder:text-slate-400 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30" /><button type="submit" disabled={submitting} className="rounded-xl bg-[var(--iris-blue)] px-6 py-3.5 font-bold text-white transition hover:bg-cyan-400 hover:text-[var(--iris-ink)] disabled:cursor-wait disabled:opacity-60">{submitting ? 'Checking…' : 'Check for free'}</button></div></form>{error && <p className="mt-4 text-sm text-rose-300" role="alert">{error}</p>}<p className="mt-5 text-xs leading-5 text-slate-400">Only scan targets you own or are authorised to test. Sensitive targets are fingerprinted and never placed in report URLs.</p></div></div></section><section className="relative z-10 border-y border-[var(--iris-line)] bg-white/70"><div className="mx-auto grid max-w-7xl gap-px px-6 lg:grid-cols-3 lg:px-10">{[['Evidence first','No invented breach hits, scores or AI advice.'],['Clear next steps','Verified findings become simple remediation steps.'],['More with an account','Signup unlocks extended checks and saved history.']].map(([title, text]) => <div key={title} className="py-7 lg:px-6 lg:first:pl-0"><h3 className="font-bold text-[var(--iris-navy)]">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{text}</p></div>)}</div></section><footer className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-10"><p>IRIS · Identity Risk & Intelligence Shield</p><div className="flex gap-5"><Link href="/privacy" className="hover:text-blue-600">Privacy</Link><Link href="/terms" className="hover:text-blue-600">Terms</Link></div></footer></main>
}
