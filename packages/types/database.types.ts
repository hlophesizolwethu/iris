// This file is a placeholder. Once the Supabase project exists, regenerate with:
//
//   supabase gen types typescript --project-id <YOUR_PROJECT_ID> > packages/types/database.types.ts
//
// Do not hand-edit table shapes here long-term — this stub only exists so the
// rest of the codebase has something to import against before the project is
// linked. It mirrors supabase/migrations/001_initial.sql.

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          role: 'user' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          role?: 'user' | 'admin'
        }
        Update: {
          display_name?: string | null
          role?: 'user' | 'admin'
        }
      }
      scans: {
        Row: {
          id: string
          owner_id: string | null
          domain: string
          status: 'queued' | 'running' | 'complete' | 'failed'
          risk_score: number | null
          mail_provider: 'google_workspace' | 'microsoft_365' | 'zoho' | 'self_hosted' | 'unknown' | null
          requested_by_ip: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          owner_id?: string | null
          domain: string
          status?: 'queued' | 'running' | 'complete' | 'failed'
          requested_by_ip?: string | null
        }
        Update: {
          status?: 'queued' | 'running' | 'complete' | 'failed'
          risk_score?: number | null
          mail_provider?: 'google_workspace' | 'microsoft_365' | 'zoho' | 'self_hosted' | 'unknown' | null
          completed_at?: string | null
        }
      }
      findings: {
        Row: {
          id: string
          scan_id: string
          category:
            | 'subdomain_exposure'
            | 'open_port'
            | 'ssl_tls'
            | 'dns_misconfig'
            | 'credential_leak'
            | 'email_auth'
            | 'mfa_readiness'
          severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
          title: string
          description: string
          weight: number
          created_at: string
        }
        Insert: {
          id?: string
          scan_id: string
          category:
            | 'subdomain_exposure'
            | 'open_port'
            | 'ssl_tls'
            | 'dns_misconfig'
            | 'credential_leak'
            | 'email_auth'
            | 'mfa_readiness'
          severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
          title: string
          description: string
          weight?: number
        }
        Update: Record<string, never>
      }
      mfa_checklist_progress: {
        Row: {
          id: string
          scan_id: string
          step_key: string
          completed: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          scan_id: string
          step_key: string
          completed?: boolean
        }
        Update: {
          completed?: boolean
        }
      }
      hygiene_checks: {
        Row: {
          id: string
          email_hash: string
          breach_count: number
          quiz_score: number | null
          hygiene_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          email_hash: string
          breach_count?: number
          quiz_score?: number | null
          hygiene_score?: number | null
        }
        Update: Record<string, never>
      }
      leads: {
        Row: {
          id: string
          scan_id: string | null
          contact_email: string
          organisation: string | null
          risk_score: number | null
          status: 'new' | 'contacted' | 'qualified' | 'converted' | 'dismissed'
          created_at: string
        }
        Insert: {
          id?: string
          scan_id?: string | null
          contact_email: string
          organisation?: string | null
          risk_score?: number | null
          status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'dismissed'
        }
        Update: {
          status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'dismissed'
        }
      }
    }
  }
}
