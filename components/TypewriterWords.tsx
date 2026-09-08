'use client'

import { useEffect, useState } from 'react'

export function TypewriterWords({ word }: { word: string }) {
  const [visible, setVisible] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const delay = deleting ? 90 : visible === word.length ? 1800 : 145
    const timer = window.setTimeout(() => {
      if (!deleting && visible < word.length) setVisible((current) => current + 1)
      else if (!deleting) setDeleting(true)
      else if (visible > 0) setVisible((current) => current - 1)
      else {
        setDeleting(false)
        setDeleting(false)
      }
    }, delay)
    return () => window.clearTimeout(timer)
  }, [deleting, visible, word])

  return <span className="inline-flex min-w-[7ch]" aria-label={word}>{word.slice(0, visible)}<span className="ml-1 inline-block h-[0.82em] w-[0.08em] translate-y-[0.08em] bg-blue-600 motion-safe:animate-pulse" aria-hidden="true" /></span>
}
