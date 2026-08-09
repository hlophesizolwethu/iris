'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError(null)
    const { error } = await createSupabaseBrowserClient().auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.code === 'invalid_credentials' ? 'Invalid email or password.' : 'Unable to sign in. Please try again.'); return }
    router.push('/dashboard')
  }
  return <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-16"><section className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 p-8 shadow-2xl"><p className="font-mono text-xs uppercase tracking-[0.25em] text-amber-400">IRIS / secure access</p><h1 className="mt-5 text-3xl font-semibold">Sign in to your workspace</h1><p className="mt-3 leading-7 text-slate-400">Review saved scans, track remediation, and manage your security posture.</p><form onSubmit={submit} className="mt-8 flex flex-col gap-5"><label className="flex flex-col gap-2 text-sm text-slate-300">Email<input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none focus:border-amber-400" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label><label className="flex flex-col gap-2 text-sm text-slate-300">Password<input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none focus:border-amber-400" type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>{error && <p role="alert" className="text-sm text-rose-300">{error}</p>}<button disabled={loading} className="rounded-lg bg-amber-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">{loading ? 'Signing in…' : 'Sign in'}</button></form><p className="mt-6 text-sm text-slate-400">New to IRIS? <Link className="text-amber-300 underline" href="/auth/sign-up">Create an account</Link></p></section></main>
}
