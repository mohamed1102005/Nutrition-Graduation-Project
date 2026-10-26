import type { ReactNode } from 'react'

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  // taste-skill-ignore
  return <div className={`bg-white border border-line rounded-2xl ${className}`}>{children}</div>
}
