interface ScoreBadgeProps {
  score: number
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400 border-emerald-500'
  if (score >= 50) return 'text-amber-400 border-amber-500'
  return 'text-red-400 border-red-500'
}

export default function ScoreBadge({ score }: ScoreBadgeProps) {
  return (
    <div
      className={`flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 ${scoreColor(score)}`}
    >
      <span className="text-3xl font-bold">{score}</span>
      <span className="text-xs uppercase tracking-wide text-neutral-500">/ 100</span>
    </div>
  )
}
