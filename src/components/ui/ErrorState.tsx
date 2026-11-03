import { CircleAlert, RefreshCw } from 'lucide-react'
import { Btn } from './Btn'

export function ErrorState({
  onRetry,
  title = 'We could not load this',
  text = 'Check your connection and try again. Nothing was lost.',
}: {
  onRetry: () => void
  title?: string
  text?: string
}) {
  return (
    <div role="alert" className="text-center py-12 px-6">
      <CircleAlert size={24} className="mx-auto mb-3 text-bad" aria-hidden />
      <p className="h-display text-[20px]">{title}</p>
      <p className="text-ink-2 mt-2 max-w-sm mx-auto">{text}</p>
      <div className="mt-5">
        <Btn variant="secondary" onClick={onRetry}>
          <RefreshCw size={18} aria-hidden /> Try again
        </Btn>
      </div>
    </div>
  )
}
