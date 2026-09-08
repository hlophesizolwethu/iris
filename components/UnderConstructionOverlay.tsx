'use client'

export function UnderConstructionOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden rounded-[inherit] bg-[rgba(7,17,31,0.58)] p-6 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="under-construction-title">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/20 bg-[rgba(11,27,53,0.94)] p-8 text-center text-white shadow-2xl shadow-slate-950/30">
        <div className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-cyan-300/20 blur-2xl motion-safe:animate-pulse" />
        <div className="relative">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-cyan-200/30 bg-cyan-300/10">
            <span className="size-3 rounded-full bg-cyan-300 shadow-[0_0_24px_rgba(103,232,249,0.9)] motion-safe:animate-pulse" aria-hidden="true" />
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">IRIS platform update</p>
          <h2 id="under-construction-title" className="mt-3 text-2xl font-black tracking-tight">Authentication is under construction.</h2>
          <p className="mt-4 text-sm leading-6 text-slate-300">We&apos;re tightening the secure workspace before opening access. Login and account creation are temporarily paused.</p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400" aria-live="polite"><span className="size-1.5 rounded-full bg-cyan-300 motion-safe:animate-bounce" aria-hidden="true" /><span className="[animation-delay:150ms] motion-safe:animate-pulse">Preparing a better sign-in experience</span></div>
        </div>
      </div>
    </div>
  )
}
