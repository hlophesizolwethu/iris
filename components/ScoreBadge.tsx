interface ScoreBadgeProps { score: number }

function scoreColor(score: number) {
  const hue = Math.max(0, Math.min(120, Math.round((score / 100) * 120)))
  return { text: `hsl(${hue} 72% 38%)`, ring: `conic-gradient(hsl(${hue} 72% 42%) ${score * 3.6}deg, #e7eef7 ${score * 3.6}deg)` }
}

export default function ScoreBadge({ score }: ScoreBadgeProps) {
  const colors = scoreColor(score)
  return (
    <div className="relative flex size-36 shrink-0 items-center justify-center rounded-full p-2 shadow-[0_15px_45px_rgba(22,135,255,.16)] transition-[background] duration-700 sm:size-40" style={{ background: colors.ring }} aria-label={`Safety score ${score} out of 100`}>
      <div className="flex size-full flex-col items-center justify-center rounded-full bg-white"><span className="text-4xl font-black tracking-tight transition-colors duration-700" style={{ color: colors.text }}>{score}</span><span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">risk score</span></div>
    </div>
  )
}
