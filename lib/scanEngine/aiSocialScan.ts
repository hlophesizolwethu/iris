import { generateText, Output } from 'ai'
import { gateway } from '@ai-sdk/gateway'
import { z } from 'zod'
import type { FindingInsert, ScanTarget } from '@/packages/types'
import type { ProviderCheckResult } from './providerChecks'

const sourceSchema = z.object({
  url: z.string().url(),
  observation: z.string().max(500),
  observedAt: z.string(),
  confidence: z.number().min(0).max(1),
})

const socialResearchSchema = z.object({
  profile: z.object({
    found: z.boolean(),
    displayName: z.string().nullable(),
    bio: z.string().nullable(),
    location: z.string().nullable(),
    activity: z.string().nullable(),
    audience: z.string().nullable(),
    linkedSites: z.array(z.string().url()),
    identitySignals: z.array(z.string()),
    confidence: z.number().min(0).max(1),
  }),
  findings: z.array(z.object({
    kind: z.enum(['public_contact', 'suspicious_link', 'credential_like', 'impersonation', 'risky_hygiene']),
    severity: z.enum(['low', 'medium', 'high']),
    title: z.string().max(140),
    description: z.string().max(800),
    confidence: z.number().min(0).max(1),
    sources: z.array(sourceSchema),
  })),
  sources: z.array(sourceSchema),
  limitations: z.array(z.string().max(300)),
})

type SocialResearch = z.infer<typeof socialResearchSchema>

const MODELS = ['perplexity/sonar', 'perplexity/sonar-pro'] as const

type PublicPageProbe = {
  requestedUrl: string
  finalUrl: string
  status: number | null
  outcome: 'public_metadata' | 'login_wall' | 'blocked' | 'not_found' | 'request_failed'
  title: string | null
  description: string | null
  canonicalUrl: string | null
  observedAt: string
}

function extractMeta(html: string, name: string) {
  const match = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*)["']`, 'i'))
  return match?.[1]?.replace(/&amp;/g, '&').trim() || null
}

async function probePublicPage(url: string): Promise<PublicPageProbe> {
  const observedAt = new Date().toISOString()
  try {
    const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(9000), cache: 'no-store', headers: { accept: 'text/html,application/xhtml+xml' } })
    const html = (await response.text()).slice(0, 300_000)
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() || null
    const description = extractMeta(html, 'description') || extractMeta(html, 'og:description')
    const canonicalUrl = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] || null
    const finalUrl = response.url || url
    const loginWall = /login|log in|sign in|checkpoint/i.test(finalUrl) || /log in to facebook|log in to instagram|sign in to linkedin/i.test(`${title ?? ''} ${description ?? ''}`)
    const outcome = response.status === 404 ? 'not_found' : response.status === 401 || response.status === 403 ? 'blocked' : loginWall ? 'login_wall' : response.ok && (title || description || canonicalUrl) ? 'public_metadata' : 'blocked'
    return { requestedUrl: url, finalUrl, status: response.status, outcome, title, description, canonicalUrl, observedAt }
  } catch {
    return { requestedUrl: url, finalUrl: url, status: null, outcome: 'request_failed', title: null, description: null, canonicalUrl: null, observedAt }
  }
}

function findingFor(scanId: string, item: SocialResearch['findings'][number]): FindingInsert {
  const category = item.kind === 'credential_like' ? 'credential_leak' : 'subdomain_exposure'
  const weight = item.confidence < 0.75 ? 0 : item.severity === 'high' ? 25 : item.severity === 'medium' ? 12 : 4
  return { scan_id: scanId, category, severity: item.severity, title: item.title, description: `${item.description} AI confidence: ${Math.round(item.confidence * 100)}%.`, weight }
}

export async function runAiSocialCheck(target: ScanTarget, scanId: string): Promise<ProviderCheckResult> {
  if (target.type !== 'social_profile') throw new Error('PROVIDER_NOT_CONFIGURED')

  const publicPage = await probePublicPage(target.value)
  let result: SocialResearch | null = null
  let usedModel: (typeof MODELS)[number] | null = null
  let lastError: unknown

  for (const model of MODELS) {
    try {
      const response = await generateText({
        model: gateway(model),
        output: Output.object({ schema: socialResearchSchema }),
        temperature: 0,
        maxOutputTokens: 3500,
        system: 'You are a passive public-web research analyst for an authorized security scan. Use web search to inspect only public pages for the supplied social profile. Never log in, bypass controls, collect credentials, infer sensitive identity, or claim a breach without direct evidence. Treat unknown as unknown. Every claim must cite a source URL and observation timestamp. Return only the requested structured object.',
        prompt: `Research this public social profile: platform=${target.platform}; profile reference=${target.value}. Start with the exact URL, then search the platform and exact handle or page identifier. Here is a deterministic direct-page probe: ${JSON.stringify(publicPage)}. Use it as evidence, but do not treat a login wall, blocked request, missing metadata, generic help page, or unresolved profile as a security finding. Return a useful summary even when the page is private or blocked: set found=false, explain the access outcome in limitations, and describe only what is directly supported by public snippets or linked public pages. Never invent a name, bio, activity, audience, or security finding. Only emit findings for concrete evidence of public contact exposure, suspicious links, credential-like material, impersonation, or risky hygiene; never emit a finding whose only claim is that the profile could not be resolved. Search only public web pages, use bounded research. A credential-like string means a public token/password/private key pattern; redact its value and never reproduce secrets. Every populated summary field and finding must be supported by a source URL.`,
        abortSignal: AbortSignal.timeout(45000),
      })
      result = response.output
      usedModel = model
      break
    } catch (error) {
      lastError = error
      console.error('[v0] AI social scan model failed', { model, error: error instanceof Error ? error.message : String(error) })
    }
  }

  if (!result || !usedModel) {
    throw new Error(`PROVIDER_AI_UNAVAILABLE:${lastError instanceof Error ? lastError.message : 'unknown'}`)
  }

  const searchedAt = new Date().toISOString()
  const canonicalTarget = target.value
  const profile = {
    ...result.profile,
    found: result.profile.found || Boolean(publicPage.title || publicPage.description),
    displayName: result.profile.displayName || publicPage.title,
    bio: result.profile.bio || publicPage.description,
    activity: result.profile.activity || (publicPage.outcome === 'public_metadata' ? 'A public profile page responded with readable metadata.' : null),
    audience: result.profile.audience || (publicPage.outcome === 'login_wall' ? 'Audience-restricted or sign-in-gated profile.' : null),
    identitySignals: result.profile.identitySignals.length ? result.profile.identitySignals : [
      publicPage.outcome === 'public_metadata' ? 'The submitted profile URL returned public page metadata.' : 'No identity signal was verified from accessible public evidence.',
    ],
    confidence: result.profile.confidence || (publicPage.title || publicPage.description ? 0.65 : 0),
  }
  const accessLimitation = publicPage.outcome === 'login_wall' ? 'The public page redirected to a sign-in wall; private or audience-restricted content was not inspected.' : publicPage.outcome === 'blocked' ? 'The public page blocked automated access; no bypass or sign-in was attempted.' : publicPage.outcome === 'not_found' ? 'The submitted public page returned not found.' : publicPage.outcome === 'request_failed' ? 'The submitted public page could not be fetched during this scan.' : 'Only publicly accessible web evidence was reviewed.'
  const limitations = Array.from(new Set([accessLimitation, ...result.limitations]))
  const probeSource = { url: publicPage.finalUrl || canonicalTarget, observation: `Direct page probe: ${publicPage.outcome}${publicPage.title ? `; title: ${publicPage.title}` : ''}${publicPage.description ? `; description: ${publicPage.description}` : ''}.`, observedAt: publicPage.observedAt, confidence: publicPage.outcome === 'public_metadata' ? 0.9 : 0.85 }
  const sources = Array.from(new Map([probeSource, ...result.sources].map((source) => [source.url, source])).values())
  const findings = result.findings.filter((item) => item.confidence >= 0.6 && !/not resolv|could not|cannot|unable|no public|no reliable|not found|login wall|sign[- ]?in/i.test(`${item.title} ${item.description}`)).map((item) => findingFor(scanId, item))
  return {
    provider: `ai_gateway_${usedModel.replace('/', '_')}`,
    findings,
    evidence: {
      mode: 'public_web_search',
      platform: target.platform,
      target: canonicalTarget,
      publicPage,
      profile,
      findings: result.findings,
      sources,
      limitations,
      searchedAt,
    },
  }
}
