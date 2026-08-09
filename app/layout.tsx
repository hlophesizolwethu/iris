import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'IRIS | Identity Risk & Intelligence Shield',
  description: 'A clear, actionable security posture scan for your business domain.',
  icons: { icon: '/iris-logo.png', apple: '/iris-logo.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-[#f7fbff]">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
