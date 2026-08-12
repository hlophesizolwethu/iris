export type { Database } from './database.types'
import type { Database } from './database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Scan = Database['public']['Tables']['scans']['Row']
export type ScanInsert = Database['public']['Tables']['scans']['Insert']
export type Finding = Database['public']['Tables']['findings']['Row']
export type FindingInsert = Database['public']['Tables']['findings']['Insert']
export type MfaChecklistProgress = Database['public']['Tables']['mfa_checklist_progress']['Row']
export type HygieneCheck = Database['public']['Tables']['hygiene_checks']['Row']
export type Lead = Database['public']['Tables']['leads']['Row']

export interface AuthUser {
  id: string
  email: string
}

export type ScanTargetType = 'domain' | 'email' | 'phone' | 'social_profile'
export type SocialPlatform = 'linkedin' | 'github' | 'x' | 'instagram' | 'facebook' | 'youtube' | 'bluesky' | 'mastodon'
export type RemediationProvenance = 'local' | 'groq' | 'unavailable'

export interface ScanTarget {
  type: ScanTargetType
  value: string
  platform?: SocialPlatform
}

export interface RemediationStep {
  id: string
  title: string
  instruction: string
  evidence: string
  priority: 'now' | 'next' | 'later'
}

export interface RemediationGuide {
  provenance: RemediationProvenance
  title: string
  summary: string
  steps: RemediationStep[]
  limitations: string[]
}

export interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

// --- Scan engine domain types ------------------------------------------------

export type EmailProvider =
  | 'google_workspace'
  | 'microsoft_365'
  | 'zoho'
  | 'self_hosted'
  | 'unknown'

export interface DnsFindings {
  domainExists: boolean
  resolvedAddresses: string[]
  https: { reachable: boolean; status: number | null; tls: boolean; headers: string[] }
  provider: EmailProvider
  mxRecords: string[]
  spf: { present: boolean; record: string | null; valid: boolean }
  dkim: { present: boolean; selectorsChecked: string[] }
  dmarc: { present: boolean; record: string | null; policy: 'none' | 'quarantine' | 'reject' | null }
}

export interface RiskScoreBreakdown {
  total: number // 0-100, lower is worse
  byCategory: Record<Finding['category'], number>
}

export interface MfaGuideStep {
  key: string
  title: string
  description: string
  externalUrl: string
}

export interface MfaGuide {
  provider: EmailProvider
  displayName: string
  steps: MfaGuideStep[]
}
