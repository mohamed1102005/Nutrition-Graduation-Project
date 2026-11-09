import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

export function PainTrend({ c }: { c: any }) {
  const t = c.painTrend ?? { now: 0, delta: 0, dir: 'flat' }
  const I = t.dir === 'up' ? ArrowUp : t.dir === 'down' ? ArrowDown : Minus
  const cls = t.dir === 'up' ? 'text-bad' : t.dir === 'down' ? 'text-ok' : 'text-ink-2'
  const word = t.dir === 'up' ? `up ${t.delta}` : t.dir === 'down' ? `down ${-t.delta}` : 'no change'
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap" title={`Pain ${t.now} out of 10, ${word} since last week`}>
      <I size={16} className={cls} aria-hidden />
      <span className="num text-[18px]">{t.now}</span>
      <span className={`text-[13px] font-semibold ${cls}`}>{word}</span>
    </span>
  )
}
