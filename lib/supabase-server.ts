import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@packages/types/database.types'

// Use inside Server Components / Route Handlers — respects the caller's
// session and RLS policies. Never has elevated privileges.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as never)
            )
          } catch {
            // Called from a Server Component with no request context to
            // write to — safe to ignore if middleware refreshes sessions.
          }
        },
      },
    }
  )
}

// Service-role client — bypasses RLS. ONLY use inside the scan worker
// (Route Handlers/Edge Functions that write scan results), never expose to
// the browser, never import into a Client Component.
export function createSupabaseServiceRoleClient(): any {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !apiKey) throw new Error('SUPABASE_NOT_CONFIGURED')

  return createClient<Database>(supabaseUrl, apiKey, { auth: { persistSession: false } })
}
