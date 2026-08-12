import { createHash } from 'node:crypto'
import type { ScanTarget, ScanTargetType, SocialPlatform } from '@packages/types'

const DOMAIN = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})+$/i
const EMAIL = /^(?=.{6,254}$)(?!.*\.\.)[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i
const PHONE = /^\+[1-9]\d{7,14}$/
const PLATFORMS: SocialPlatform[] = ['linkedin', 'github', 'x', 'instagram', 'facebook', 'youtube', 'bluesky', 'mastodon']

export function normalizeTarget(input: unknown): ScanTarget | null {
  if (!input || typeof input !== 'object') return null
  const value = typeof (input as { value?: unknown }).value === 'string' ? (input as { value: string }).value.trim() : ''
  const type = (input as { type?: unknown }).type as ScanTargetType
  const platform = (input as { platform?: unknown }).platform as SocialPlatform | undefined
  if (!value || !['domain', 'email', 'phone', 'social_profile'].includes(type)) return null
  if (type === 'domain') {
    const domain = value.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/\.$/, '')
    return DOMAIN.test(domain) ? { type, value: domain } : null
  }
  if (type === 'email') return EMAIL.test(value) ? { type, value: value.toLowerCase() } : null
  if (type === 'phone') return PHONE.test(value.replace(/[\s()-]/g, '')) ? { type, value: value.replace(/[\s()-]/g, '') } : null
  if (!platform || !PLATFORMS.includes(platform) || value.length > 300) return null
  return { type, value, platform }
}

export function fingerprintTarget(target: ScanTarget): string {
  return createHash('sha256').update(`${target.type}:${target.platform ?? ''}:${target.value}`).digest('hex')
}

export function publicTargetLabel(target: ScanTarget): string {
  if (target.type === 'email') {
    const [name, domain] = target.value.split('@')
    return `${name.slice(0, 2)}•••@${domain}`
  }
  if (target.type === 'phone') return `${target.value.slice(0, 3)}••••${target.value.slice(-2)}`
  if (target.type === 'social_profile') return `${target.platform} profile`
  return target.value
}
