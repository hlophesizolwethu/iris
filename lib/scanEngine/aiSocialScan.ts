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

const MODEL = 'perplexity/sonar'

function findingFor(scanId: string, item: SocialResearch['findings'][number]): FindingInsert {
  const category = item.kind === 'credential_like' ? 'credential_leak' : 'subdomain_exposure'
  const weight = item.confidence < 0.75 ? 0 : item.severity === 'high' ? 25 : item.severity === 'medium' ? 12 : 4
  return { scan_id: scanId, category, severity: item.severity, title: item.title, description: `${item.description} AI confidence: ${Math.round(item.confidence * 100)}%.`, weight }
}

export async function runAiSocialCheck(target: ScanTarget, scanId: string): Promise<ProviderCheckResult> {
  if (target.type !== 'social_profile') throw new Error('PROVIDER_NOT_CONFIGURED')

  let result: SocialResearch
  try {
    const response = await generateText({
      model: gateway(MODEL),
      output: Output.object({ schema: socialResearchSchema }),
      maxOutputTokens: 3500,
      system: 'You are a passive public-web research analyst for an authorized security scan. Use web search to inspect only public pages for the supplied social profile. Never log in, bypass controls, collect credentials, infer sensitive identity, or claim a breach without direct evidence. Treat unknown as unknown. Every claim must cite a source URL and observation timestamp. Return only the requested structured object.',
      prompt: `Research this public social profile: platform=${target.platform}; profile reference=${target.value}. Identify both profile intelligence and security exposure. Search only public web pages, use bounded research, and do not guess if the profile is not found. A credential-like string means a public token/password/private key pattern; redact its value and never reproduce secrets.`,
      abortSignal: AbortSignal.timeout(25000),
    })
    result = response.output
  } catch {
    throw new Error('PROVIDER_AI_UNAVAILABLE')
  }

  const findings = result.findings.filter((item) => item.confidence >= 0.6).map((item) => findingFor(scanId, item))
  return {
    provider: `ai_gateway_${MODEL.replace('/', '_')}`,
    findings,
    evidence: {
      mode: 'public_web_search',
      platform: target.platform,
      target: target.value,
      profile: result.profile,
      findings: result.findings,
      sources: result.sources,
      limitations: result.limitations,
      searchedAt: new Date().toISOString(),
    },
  }
}
