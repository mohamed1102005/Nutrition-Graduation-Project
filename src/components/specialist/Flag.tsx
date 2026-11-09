import { TriangleAlert, CircleCheck } from 'lucide-react'

export function Flag({ c }: { c: any }) {
  const isOver = Boolean(c.flagged)
  return isOver ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-bad-tint text-[#a02a2a] px-3 h-8 font-bold text-[14px] whitespace-nowrap">
      <TriangleAlert size={16} aria-hidden /> Above safe limit
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-tint text-[#1d6b3d] px-3 h-8 font-bold text-[14px] whitespace-nowrap">
      <CircleCheck size={16} aria-hidden /> Within limit
    </span>
  )
}
