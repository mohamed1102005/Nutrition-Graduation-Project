import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="text-center py-12 px-6">
      <Inbox size={24} className="mx-auto mb-3 text-ink-2" aria-hidden />
      <p className="h-display text-[20px]">{title}</p>
      <p className="text-ink-2 mt-2 max-w-sm mx-auto">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
