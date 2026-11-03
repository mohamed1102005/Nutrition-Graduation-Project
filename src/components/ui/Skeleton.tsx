// A flat grey bar at the size of the value it stands in for. No shimmer or pulse.
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-ink/[0.07] rounded-xl ${className}`} aria-hidden />
}
