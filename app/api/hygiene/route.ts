import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const quizScore = Number(body?.quizScore)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !Number.isInteger(quizScore) || quizScore < 0 || quizScore > 100) {
    return NextResponse.json({ error: 'Enter a valid email and quiz score.' }, { status: 400 })
  }

  const emailHash = createHash('sha256').update(email).digest('hex')
  const supabase = createSupabaseServiceRoleClient()
  const { data, error } = await supabase.from('hygiene_checks').insert({
    email_hash: emailHash,
    quiz_score: quizScore,
    breach_count: 0,
    hygiene_score: quizScore,
  }).select('id, quiz_score, hygiene_score, breach_count').single()

  if (error || !data) return NextResponse.json({ error: 'Could not save your check.' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
