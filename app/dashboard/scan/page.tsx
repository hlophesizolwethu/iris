import { redirect } from 'next/navigation'
import PrivateScanForm from '@/components/PrivateScanForm'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function PrivateScanPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/dashboard/scan')
  return <PrivateScanForm />
}
