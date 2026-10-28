export type SegmentOption = string | { val: string; label: string }

export function Segment({
  options,
  value,
  onChange,
  label,
}: {
  options: SegmentOption[]
  value: string
  onChange: (v: string) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((item) => {
        const val = typeof item === 'string' ? item : item.val
        const lbl = typeof item === 'string' ? item : item.label
        return (
          <button
            key={val}
            type="button"
            role="radio"
            aria-checked={value === val}
            onClick={() => onChange(val)}
            className={`min-h-11 min-w-11 px-4 rounded-xl border font-semibold cursor-pointer ${
              value === val ? 'bg-ink text-white border-ink' : 'bg-white border-ink/25 hover:border-ink'
            }`}
          >
            {lbl}
          </button>
        )
      })}
    </div>
  )
}
