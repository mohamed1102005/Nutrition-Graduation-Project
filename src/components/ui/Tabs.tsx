import type { ReactNode } from 'react'

// A segmented track: the track is one tone step off the ground, the selected tab is a white pill.
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { id: T; label: string; icon?: ReactNode }[]
  value: T
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex flex-wrap gap-1 p-1 rounded-full bg-ink/[0.06]">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`min-h-10 px-5 rounded-full font-semibold text-[15px] inline-flex items-center gap-2 cursor-pointer transition-[background-color,color] ${
            value === t.id ? 'bg-white text-ink ring-1 ring-line' : 'text-ink-2 hover:text-ink'
          }`}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  )
}
