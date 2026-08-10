import Link from 'next/link'

export default function SignUpSuccessPage() {
  return (
    <main className="iris-grid flex min-h-screen items-center justify-center px-6 py-12">
      <section className="iris-panel iris-glow w-full max-w-lg p-8 text-center sm:p-12">
        <Link href="/" className="mx-auto flex w-fit items-center gap-3" aria-label="IRIS home">
          <img src="/iris-logo.png" alt="IRIS shield and eye logo" className="h-11 w-11 rounded-xl" />
          <span className="text-sm font-black tracking-[0.24em] text-[var(--iris-navy)]">IRIS</span>
        </Link>
        <p className="iris-kicker mt-10">Account created</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--iris-navy)] sm:text-4xl">You can sign in now.</h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-[var(--iris-muted)]">
          Your IRIS workspace is ready. Go back to sign in and start with a quick check. No email confirmation step is required here.
        </p>
        <Link href="/auth/login" className="mt-8 inline-flex rounded-2xl bg-[var(--iris-blue)] px-6 py-3.5 font-bold text-white transition hover:bg-[var(--iris-navy)]">
          Back to sign in
        </Link>
        <p className="mt-5 text-sm text-[var(--iris-muted)]">
          Need a public check first? <Link href="/" className="font-bold text-blue-600 hover:text-[var(--iris-navy)]">Run one without an account</Link>
        </p>
      </section>
    </main>
  )
}
