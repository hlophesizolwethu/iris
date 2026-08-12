import { generateText, Output } from 'ai'
import { gateway } from '@ai-sdk/gateway'
import { z } from 'zod'
import type { Finding, RemediationGuide } from '@packages/types'

const guideSchema = z.object({
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(500),
  steps: z.array(z.object({
    id: z.string().min(1).max(80),
    title: z.string().min(1).max(140),
    instruction: z.string().min(1).max(700),
    evidence: z.string().min(1).max(700),
    priority: z.enum(['now', 'next', 'later']),
  })).max(12),
  limitations: z.array(z.string().min(1).max(300)).max(6),
})

export async function buildGroqRemediation(
  findings: Pick<Finding, 'id' | 'title' | 'description' | 'severity'>[],
): Promise<RemediationGuide | null> {
  if (!process.env.AI_GATEWAY_API_KEY || findings.length === 0) return null
  try {
    const { output } = await generateText({
      model: gateway('groq/llama-3.3-70b-versatile'),
      output: Output.object({ schema: guideSchema }),
      system: 'You are IRIS remediation assistant. Use only the supplied verified scan evidence. Never invent findings, systems, providers, vulnerabilities, or completed fixes. Give concise, safe, actionable guidance. Preserve evidence verbatim where useful. If evidence is insufficient, say so in limitations.',
      prompt: JSON.stringify({ findings }),
    })
    if (!output) return null
    return {
      provenance: 'groq',
      title: output.title,
      summary: output.summary,
      steps: output.steps,
      limitations: output.limitations,
    }
  } catch {
    return null
  }
}
