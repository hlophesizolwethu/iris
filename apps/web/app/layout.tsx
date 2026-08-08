import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'IRIS \u2014 Identity Risk & Intelligence Shield',
  description:
    'Free, live exposure scanning and MFA readiness guidance from MetaPhoenix Tech. See what an attacker sees \u2014 and fix it.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">{children}</body>
    </html>
  )
}
