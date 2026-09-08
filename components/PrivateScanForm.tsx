'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type ScanType = 'domain' | 'email' | 'phone' | 'social_profile'
type Platform = 'linkedin' | 'github' | 'x' | 'instagram' | 'facebook' | 'youtube' | 'bluesky' | 'mastodon'

const types = [
  ['domain', 'Domain', 'yourcompany.com'],
  ['email', 'Email', 'name@company.com'],
  ['phone', 'Phone', '+268 76 648 871'],
  ['social_profile', 'Social profile', 'https://bsky.app/profile/...'],
] as const
const platforms: Platform[] = ['github', 'bluesky', 'mastodon', 'linkedin', 'x', 'instagram', 'facebook', 'youtube']

export default function PrivateScanForm() {
  const router = useRouter()
  const [type, setType] = useState<ScanType>('domain')
  const [platform, setPlatform] = useState<Platform>('github')
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setSubmitting(true)
    try {
      const response = await fetch('/api/scan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ accessLevel: 'extended', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Maputo', target: { type, value, ...(type === 'social_profile' ? { platform } : {}) } }) })
      const data = await response.json()
      if (!response.ok) { setError(data.error ?? 'We could not start that scan.'); return }
      router.push(`/scan/${data.scanId}`)
    } catch { setError('The scan service could not be reached. Please try again.') } finally { setSubmitting(false) }
  }
  return <main className="min-h-screen bg-[var(--iris-white)]"><header className="border-b bg-white/90"><div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5"><Link href="/dashboard" className="flex items-center gap-3"><img src="/iris-logo.png" alt="IRIS" className="h-10 w-10 rounded-xl" /><span className="font-mono text-sm font-bold tracking-[0.22em] text-[var(--iris-navy)]">IRIS</span></Link><Link href="/dashboard" className="text-sm font-bold text-[var(--iris-blue)]">Back to workspace</Link></div></header><section className="mx-auto max-w-5xl px-6 py-12"><p className="iris-kicker">Private extended scan</p><h1 className="mt-3 max-w-2xl text-4xl font-black tracking-tight text-[var(--iris-navy)]">Go deeper, with your history intact.</h1><p className="mt-4 max-w-2xl leading-7 text-[var(--iris-muted)]">This scan is connected to your account and will be saved in your private workspace. IRIS only reports evidence it can verify.</p><form onSubmit={submit} className="iris-panel mt-10 max-w-2xl p-6 sm:p-8"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{types.map(([key, label]) => <button key={key} type="button" onClick={() => setType(key)} className={`rounded-xl border px-3 py-3 text-sm font-bold ${type === key ? 'border-blue-500 bg-blue-50 text-blue-700' : 'bg-white text-slate-600'}`}>{label}</button>)}</div>{type === 'social_profile' && <label className="mt-6 block text-sm font-bold text-[var(--iris-navy)]">Platform<select value={platform} onChange={(event) => setPlatform(event.target.value as Platform)} className="mt-2 w-full rounded-xl border bg-white px-4 py-3 font-normal"><option value="github">GitHub</option><option value="bluesky">Bluesky</option><option value="mastodon">Mastodon</option><option value="linkedin">LinkedIn</option><option value="x">X</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="youtube">YouTube</option></select></label>}<label className="mt-6 block text-sm font-bold text-[var(--iris-navy)]">{types.find(([key]) => key === type)?.[1]}<input required value={value} onChange={(event) => setValue(event.target.value)} placeholder={types.find(([key]) => key === type)?.[2]} className="mt-2 w-full rounded-xl border bg-white px-4 py-3 font-normal outline-none focus:border-blue-500" /></label>{error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}<p className="mt-2 font-semibold">Need help? Contact MetaPhoenix Tech at <a className="underline" href="mailto:info@metaphoenixsec.com">info@metaphoenixsec.com</a> or <a className="underline" href="tel:+26876648871">+268 76648871</a>.</p></div>}<button disabled={submitting} className="mt-6 w-full rounded-xl bg-[var(--iris-blue)] px-5 py-3.5 font-bold text-white disabled:opacity-60">{submitting ? 'Verifying evidence…' : 'Start private scan'}</button></form></section></main>
}
