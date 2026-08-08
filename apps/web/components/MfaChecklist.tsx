'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { MfaGuide } from '@packages/types'

interface MfaChecklistProps {
  scanId: string
  guide: MfaGuide
  initiallyCompleted: string[]
}

export default function MfaChecklist({ scanId, guide, initiallyCompleted }: MfaChecklistProps) {
  const [completed, setCompleted] = useState<Set<string>>(new Set(initiallyCompleted))
  const supabase = createSupabaseBrowserClient()

  async function toggleStep(stepKey: string) {
    const nowCompleted = !completed.has(stepKey)
    const next = new Set(completed)
    nowCompleted ? next.add(stepKey) : next.delete(stepKey)
    setCompleted(next)

    // IRIS only ever writes a boolean "did the user follow this step" flag —
    // never any account data, never credentials.
    await (supabase.from('mfa_checklist_progress') as any).upsert(
      { scan_id: scanId, step_key: stepKey, completed: nowCompleted },
      { onConflict: 'scan_id,step_key' }
    )
  }

  const progress = Math.round((completed.size / guide.steps.length) * 100)

  return (
    <div className="rounded-md border border-neutral-800 bg-neutral-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-neutral-100">
          MFA setup guide \u2014 {guide.displayName}
        </h3>
        <span className="text-sm text-amber-400">{progress}% complete</span>
      </div>

      <ul className="space-y-3">
        {guide.steps.map((step) => (
          <li key={step.key} className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={completed.has(step.key)}
              onChange={() => toggleStep(step.key)}
              className="mt-1 h-4 w-4 accent-amber-500"
            />
            <div>
              <p className="font-medium text-neutral-200">{step.title}</p>
              <p className="text-sm text-neutral-400">{step.description}</p>
              <a
                href={step.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm text-amber-400 hover:underline"
              >
                Open in {guide.displayName} \u2192
              </a>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-neutral-600">
        IRIS never asks for your password or login \u2014 each link takes you directly to the
        provider\u2019s own official settings page.
      </p>
    </div>
  )
}
