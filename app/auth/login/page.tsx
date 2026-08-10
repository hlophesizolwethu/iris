'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function LoginPage() {
  const router = useRouter()
  const next = '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError(null)
    const { error } = await createSupabaseBrowserClient().auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.code === 'invalid_credentials' ? 'Invalid email or password.' : error.message.toLowerCase().includes('confirm') ? 'Confirm your email before signing in.' : 'Unable to sign in right now. Please try again.'); return }
    router.replace(next); router.refresh()
  }
  return <main className="iris-grid flex min-h-screen items-center justify-center px-6 py-12"><section className="iris-panel iris-glow w-full max-w-md p-8 sm:p-10"><Link href="/" className="flex items-center gap-3"><img src="/iris-logo.png" alt="IRIS" className="h-10 w-10 rounded-xl" /><span className="font-mono text-sm font-bold tracking-[0.22em] text-[var(--iris-navy)]">IRIS</span></Link><p className="iris-kicker mt-10">Secure workspace</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--iris-navy)]">Welcome back.</h1><p className="mt-3 leading-6 text-[var(--iris-muted)]">Sign in to review private scans and continue your remediation work.</p><form onSubmit={submit} className="mt-8 flex flex-col gap-5"><label className="flex flex-col gap-2 text-sm font-semibold text-[var(--iris-navy)]">Email<input className="rounded-2xl border bg-[var(--iris-white)] px-4 py-3.5 text-[var(--iris-ink)] outline-none transition focus:border-[var(--iris-blue)] focus:ring-4 focus:ring-blue-100" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></label><label className="flex flex-col gap-2 text-sm font-semibold text-[var(--iris-navy)]">Password<input className="rounded-2xl border bg-[var(--iris-white)] px-4 py-3.5 text-[var(--iris-ink)] outline-none transition focus:border-[var(--iris-blue)] focus:ring-4 focus:ring-blue-100" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label>{error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<button disabled={loading} className="rounded-2xl bg-[var(--iris-blue)] px-4 py-3.5 font-bold text-white transition hover:bg-[var(--iris-navy)] disabled:cursor-wait disabled:opacity-60">{loading ? 'Checking access…' : 'Sign in securely'}</button></form><p className="mt-7 text-sm text-[var(--iris-muted)]">New to IRIS? <Link className="font-bold text-[var(--iris-blue)] hover:underline" href={`/auth/sign-up?next=${encodeURIComponent(next)}`}>Create an account</Link></p><Link href="/" className="mt-5 block text-sm text-[var(--iris-muted)] hover:text-[var(--iris-navy)]">Continue with a public quick scan</Link></section></main>
}
