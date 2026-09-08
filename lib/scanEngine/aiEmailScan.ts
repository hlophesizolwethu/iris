import { generateText, Output } from 'ai'
import { gateway } from '@ai-sdk/gateway'
import { z } from 'zod'
import type { FindingInsert } from '@/packages/types'

const emailResearchSchema = z.object({
  breaches: z.array(z.object({ name: z.string().max(160), date: z.string().nullable(), exposedData: z.array(z.string().max(80)), source: z.string().url(), confidence: z.number().min(0).max(1) })),
  sources: z.array(z.object({ url: z.string().url(), observation: z.string().max(500), confidence: z.number().min(0).max(1) })),
  limitations: z.array(z.string().max(300)),
})

type EmailResearch = z.infer<typeof emailResearchSchema>

function maskedEmail(email: string) {
  const [local, domain] = email.split('@')
  return `${local.slice(0, 2)}•••@${domain}`
}

export async function runAiEmailResearch(email: string, scanId: string) {
  const model = 'perplexity/sonar'
  const response = await generateText({
    model: gateway(model),
    output: Output.object({ schema: emailResearchSchema }),
    temperature: 0,
    maxOutputTokens: 2200,
    system: 'You are a defensive public-web breach-intelligence analyst. Search only publicly accessible sources for an authorized email exposure check. You do not have private Have I Been Pwned access. Never log in, buy data, reveal passwords, reproduce secrets, or claim complete breach coverage. Only report a breach when a public source directly names the supplied email or clearly documents the exposure. Every breach must cite its source URL. Treat unknown as unknown.',
    prompt: `Research publicly available breach disclosures for this authorized email: ${email}. Search exact email matches and reputable public breach reports, security advisories, and indexed disclosure pages. Do not infer a breach from the domain alone. Return structured evidence only. The UI-safe identifier is ${maskedEmail(email)}.`,
    abortSignal: AbortSignal.timeout(45000),
  })
  const result = response.output as EmailResearch
  const breaches = Array.from(new Map(result.breaches.map((breach) => [breach.name.toLowerCase(), breach])).values())
  const findings: Omit<FindingInsert, 'scan_id'>[] = breaches.filter((breach) => breach.confidence >= 0.75).length ? [{ category: 'credential_leak', severity: 'high', title: 'Email appeared in public breach disclosures', description: `Public sources identified ${breaches.length} possible breach disclosure(s) for this address. Review the named sources, change reused passwords, and enable MFA. AI confidence is based on cited public evidence; this is not a complete HIBP lookup.`, weight: 35 }] : []
  return { provider: `ai_gateway_${model.replace('/', '_')}`, findings, evidence: { mode: 'public_web_breach_research', email: maskedEmail(email), breaches, sources: result.sources, limitations: Array.from(new Set(['This is public-web research and not a direct Have I Been Pwned database query; coverage is incomplete.', ...result.limitations])), scanId } }
}
