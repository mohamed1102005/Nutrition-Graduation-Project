import { cloneElement, isValidElement, useId, type ReactNode } from 'react'
import { CircleAlert } from 'lucide-react'

export function Field({
  label,
  helper,
  error,
  children,
}: {
  label: string
  helper?: string
  error?: string
  children: ReactNode | ((p: { id: string; 'aria-describedby': string; 'aria-invalid': boolean }) => ReactNode)
}) {
  const id = useId()
  const d = `${id}-d`

  const renderChild = () => {
    if (typeof children === 'function') {
      return children({ id, 'aria-describedby': d, 'aria-invalid': !!error })
    }
    if (isValidElement(children)) {
      return cloneElement(children as React.ReactElement<any>, {
        id: (children.props as any)?.id || id,
        'aria-describedby': d,
        'aria-invalid': !!error,
      })
    }
    return children
  }

  return (
    <div>
      <label htmlFor={id} className="block text-[14px] font-semibold mb-2">
        {label}
      </label>
      {renderChild()}
      {(error || helper) && (
        <p id={d} className={`mt-2 text-[14px] leading-5 ${error ? 'text-bad font-semibold flex gap-1.5 items-start' : 'text-ink-2'}`}>
          {error ? (
            <>
              <CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden />
              {error}
            </>
          ) : (
            helper
          )}
        </p>
      )}
    </div>
  )
}
