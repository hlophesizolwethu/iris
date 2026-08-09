import { NextResponse } from 'next/server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase-server'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: 'Invalid scan id' }, { status: 400 })

  const supabase = createSupabaseServiceRoleClient()
  const { data: scan, error } = await supabase
    .from('scans')
    .select('id, domain, status, risk_score, mail_provider, created_at, completed_at, error_code')
    .eq('id', id)
    .single()

  if (error || !scan) return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
  return NextResponse.json(scan, { headers: { 'Cache-Control': 'no-store' } })
}
