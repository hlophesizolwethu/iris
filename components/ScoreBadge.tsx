interface ScoreBadgeProps { score: number }

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 50) return 'text-amber-600'
  return 'text-rose-600'
}

export default function ScoreBadge({ score }: ScoreBadgeProps) {
  return (
    <div className="relative flex size-36 shrink-0 items-center justify-center rounded-full bg-[conic-gradient(var(--iris-blue)_0deg,var(--iris-cyan)_180deg,#e7eef7_180deg)] p-2 shadow-[0_15px_45px_rgba(22,135,255,.16)] sm:size-40">
      <div className="flex size-full flex-col items-center justify-center rounded-full bg-white"><span className={`text-4xl font-black tracking-tight ${scoreColor(score)}`}>{score}</span><span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">risk score</span></div>
    </div>
  )
}
