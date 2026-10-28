import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

export function Dialog({
  open,
  onClose,
  title,
  children,
  side = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  side?: boolean
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  let isRtl = false
  let closeAria = 'Close'
  try {
    const lang = useLanguage()
    isRtl = lang.isRtl
    closeAria = lang.t('common.close', 'Close')
  } catch {
    // Rendered outside of LanguageProvider context
  }

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    const timer = setTimeout(() => {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      focusable?.[0]?.focus()
    }, 50)

    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timer)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={`fixed inset-0 z-50 bg-ink/40 flex ${side ? 'justify-end' : 'items-center justify-center p-5'}`} onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white shadow-[0_16px_48px_rgba(20,22,26,0.25)] overflow-y-auto ${
          side ? 'w-full max-w-[440px] h-full p-6' : 'rounded-2xl p-6 max-w-md w-full max-h-full'
        }`}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="h-display text-[24px]" style={{ letterSpacing: '-0.02em' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label={closeAria}
            className={`size-11 -mt-2 ${isRtl ? '-ml-2' : '-mr-2'} grid place-items-center rounded-xl hover:bg-ink/5 cursor-pointer shrink-0`}
          >
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
