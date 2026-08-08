'use client'

import { FormEvent, useState } from 'react'

export default function HygienePage() {
  const [email, setEmail] = useState('')
  const [score, setScore] = useState(50)
  const [result, setResult] = useState<number | null>(null)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const response = await fetch('/api/hygiene', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, quizScore: score }) })
    const data = await response.json()
    if (!response.ok) { setError(data.error ?? 'Could not complete check.'); return }
    setResult(data.hygiene_score)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <a href="/" className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-500">IRIS</a>
      <h1 className="mt-8 text-4xl font-bold tracking-tight">Personal cyber hygiene check</h1>
      <p className="mt-4 leading-7 text-neutral-400">Get a private readiness score from a short self-assessment. IRIS stores only a one-way hash of your email.</p>
      {result === null ? (
        <form onSubmit={submit} className="mt-10 flex flex-col gap-6">
          <label className="flex flex-col gap-2 text-sm text-neutral-300">Email for your result
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-md border border-neutral-700 bg-neutral-900 px-4 py-3 text-neutral-100" placeholder="you@company.com" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-neutral-300">Self-assessment score: <span className="text-2xl font-semibold text-amber-400">{score}%</span>
            <input type="range" min="0" max="100" value={score} onChange={(event) => setScore(Number(event.target.value))} className="accent-amber-500" />
          </label>
          <button className="rounded-md bg-amber-500 px-5 py-3 font-semibold text-neutral-950 hover:bg-amber-400" type="submit">Get my score</button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>
      ) : <section className="mt-10 rounded-md border border-amber-800/40 bg-amber-950/20 p-6"><p className="text-sm uppercase tracking-widest text-amber-400">Your hygiene score</p><p className="mt-3 text-6xl font-bold">{result}<span className="text-2xl text-neutral-500">/100</span></p><p className="mt-4 text-neutral-400">Use this score as a starting point. Turn on MFA, use a password manager, and review account recovery methods.</p><a className="mt-6 inline-block text-amber-400 hover:underline" href="/">Run a business scan →</a></section>}
    </main>
  )
}
