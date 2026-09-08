'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function AuthNav() {
  const [signedIn, setSignedIn] = useState(false)
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return

    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session?.user)))
    return () => listener.subscription.unsubscribe()
  }, [])
  return signedIn ? <><Link href="/dashboard" className="rounded-full px-4 py-2 transition hover:bg-blue-50 hover:text-blue-700">Workspace</Link><Link href="/auth/sign-out" className="rounded-full border border-[var(--iris-line)] px-5 py-2.5 text-[var(--iris-navy)] transition hover:border-blue-600 hover:bg-white">Sign out</Link></> : <><Link href="/auth/login" className="rounded-full px-4 py-2 transition hover:bg-blue-50 hover:text-blue-700">Sign in</Link><Link href="/auth/sign-up" className="rounded-full bg-[var(--iris-navy)] px-5 py-2.5 text-white shadow-lg shadow-slate-900/10 transition hover:bg-blue-700">Create account</Link></>
}
