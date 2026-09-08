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

function findingFor(scanId: string, item: SocialResearch['findings'][number]): FindingInsert {
  const category = item.kind === 'credential_like' ? 'credential_leak' : 'subdomain_exposure'
  const weight = item.confidence < 0.75 ? 0 : item.severity === 'high' ? 25 : item.severity === 'medium' ? 12 : 4
  return { scan_id: scanId, category, severity: item.severity, title: item.title, description: `${item.description} AI confidence: ${Math.round(item.confidence * 100)}%.`, weight }
}

export async function runAiSocialCheck(target: ScanTarget, scanId: string): Promise<ProviderCheckResult> {
  if (target.type !== 'social_profile') throw new Error('PROVIDER_NOT_CONFIGURED')

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
        prompt: `Research this public social profile: platform=${target.platform}; profile reference=${target.value}. Start with the exact URL, then search the platform and exact handle or page identifier. Return a useful summary even when the page is private or blocked: set found=false, explain access limits in limitations, and describe only what is directly supported by public snippets or linked public pages. Never invent a name, bio, activity, audience, or security finding. Identify both profile intelligence and security exposure. Search only public web pages, use bounded research. A credential-like string means a public token/password/private key pattern; redact its value and never reproduce secrets. Every populated summary field must be supported by a source URL.`,
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
  const profile = result.profile.found || result.profile.displayName || result.profile.bio || result.profile.activity || result.profile.audience
    ? result.profile
    : { ...result.profile, found: false, confidence: 0 }
  const limitations = result.limitations.length ? result.limitations : ['Only publicly accessible web evidence was reviewed. Facebook may restrict profile content to signed-in users or privacy-approved audiences.']
  const sources = result.sources.length ? result.sources : [{ url: canonicalTarget, observation: 'The submitted public profile URL was evaluated, but no additional publicly verifiable profile details were returned.', observedAt: searchedAt, confidence: 0.35 }]
  const findings = result.findings.filter((item) => item.confidence >= 0.6).map((item) => findingFor(scanId, item))
  return {
    provider: `ai_gateway_${usedModel.replace('/', '_')}`,
    findings,
    evidence: {
      mode: 'public_web_search',
      platform: target.platform,
      target: canonicalTarget,
      profile,
      findings: result.findings,
      sources,
      limitations,
      searchedAt,
    },
  }
}
