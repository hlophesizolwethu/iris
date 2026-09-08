import Link from 'next/link'

export function SiteFooter() {
  return <footer className="border-t border-[var(--iris-line)] bg-white/70"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 text-sm text-[var(--iris-muted)] sm:flex-row sm:items-center sm:justify-between lg:px-10"><p>IRIS identity-risk intelligence.</p><div className="flex flex-wrap items-center gap-x-5 gap-y-2"><Link href="/privacy" className="transition hover:text-[var(--iris-blue)]">Privacy</Link><Link href="/terms" className="transition hover:text-[var(--iris-blue)]">Terms</Link><a href="https://metaphoenixsec.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--iris-navy)] transition hover:text-[var(--iris-blue)]">Powered by MetaPhoenix Tech<span className="sr-only"> (opens in a new tab)</span></a></div></div></footer>
}
