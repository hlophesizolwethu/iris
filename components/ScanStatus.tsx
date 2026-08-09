'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ScanStatus({ scanId }: { scanId: string }) {
  const router = useRouter()
  const [message, setMessage] = useState('Scan in progress…')

  useEffect(() => {
    let active = true
    const poll = async () => {
      const response = await fetch(`/api/scan/${scanId}`, { cache: 'no-store' })
      if (!active || !response.ok) return
      const scan = await response.json()
      if (scan.status === 'complete') {
        router.refresh()
        return
      }
      if (scan.status === 'failed') {
        setMessage('This scan failed. Please try again.')
        return
      }
      setTimeout(poll, 2500)
    }
    void poll()
    return () => { active = false }
  }, [router, scanId])

  return <p className="text-neutral-400">{message}</p>
}
