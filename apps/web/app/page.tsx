'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        return
      }

      router.push(`/scan/${data.scanId}`)
    } catch {
      setError('Could not reach the scan service. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-amber-500">
        MetaPhoenix Tech
      </p>
      <h1 className="text-5xl font-bold tracking-tight">IRIS</h1>
      <p className="mt-2 text-lg text-amber-400">Identity Risk & Intelligence Shield</p>
      <p className="mt-6 max-w-xl text-neutral-400">
        Free, live exposure scanning. See what an attacker sees about your domain \u2014 email
        security, MFA readiness, and more \u2014 with a guided path to fix what you find.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 flex w-full max-w-md gap-2">
        <input
          type="text"
          required
          placeholder="yourcompany.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-4 py-3 text-neutral-100 placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-amber-500 px-6 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400 disabled:opacity-50"
        >
          {submitting ? 'Scanning\u2026' : 'Scan for free'}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <p className="mt-6 text-xs text-neutral-600">
        Only scan domains you own or are authorised to test. IRIS never requests your login
        credentials.
      </p>
    </main>
  )
}
