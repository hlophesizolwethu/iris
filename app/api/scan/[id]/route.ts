import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabase-server'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: 'Invalid scan id' }, { status: 400 })

  const server = await createSupabaseServerClient()
  const { data: { user } } = await server.auth.getUser()
  const supabase = createSupabaseServiceRoleClient()
  const { data: scan, error } = await supabase
    .from('scans')
    .select('id, owner_id, domain, target_type, target_platform, access_level, status, risk_score, mail_provider, remediation_provenance, remediation_guide, created_at, completed_at, error_code')
    .eq('id', id)
    .single()

  if (error || !scan) return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
  if (scan.access_level === 'extended' && scan.owner_id !== user?.id) return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
  const { owner_id: _ownerId, ...publicScan } = scan
  return NextResponse.json(publicScan, { headers: { 'Cache-Control': 'no-store' } })
}
