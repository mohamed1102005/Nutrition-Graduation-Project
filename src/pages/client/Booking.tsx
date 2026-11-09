import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, ArrowRight, Check, MessageSquare, Video, Info } from 'lucide-react'
import { Avatar, Btn, Card, EmptyState, SVC, Skeleton, Tag } from '../../ui'
import { egp, type Svc } from '../../data'
import { api } from '../../api'
import { useLanguage } from '../../context/LanguageContext'

const steps = ['Package', 'Date and time', 'Review']
const TZ = 'Africa/Cairo'
const CHAT_DISCOUNT = 0.6 // chat check-ins cost 60% of a video session (same rule as the server)

function getInitials(name = '') {
  return name
    .replace(/^(Dr\.|Coach)\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

// Everything is shown in Cairo time, whatever the visitor's own time zone is.
const cairo = (iso: string) => {
  const d = new Date(iso)
  const part = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { timeZone: TZ, ...opts }).format(d)
  const [dd, mm, yyyy] = part({ day: '2-digit', month: '2-digit', year: 'numeric' }).split('/')
  return {
    key: `${yyyy}-${mm}-${dd}`,
    weekday: part({ weekday: 'short' }),
    day: Number(dd),
    month: part({ month: 'short' }),
    time: new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true }).format(d),
  }
}

type PackageOption = { id: string; packageId?: number; name: string; n: number; price: number; note: string }

export default function Booking() {
  const { t } = useLanguage()
  const { id } = useParams()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const [spData, setSpData] = useState<any>(null)
  const [serverSlots, setServerSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const resched = sp.get('reschedule') === '1' || Boolean(sp.get('reschedule') && sp.get('reschedule') !== '0')
  const reschedBookingId = sp.get('bookingId') || sp.get('booking_id') || (sp.get('reschedule') && sp.get('reschedule') !== '1' ? sp.get('reschedule') : null) || undefined

  const [step, setStep] = useState(resched ? 1 : 0)
  const [pkg, setPkg] = useState('single')
  const [type, setType] = useState('Video call')
  const [dayKey, setDayKey] = useState<string | null>(null)
  const [slotId, setSlotId] = useState<number | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!id) return
    Promise.all([api.getSpecialist(id), api.getSpecialistSlots(id)])
      .then(([sRes, slotsRes]) => {
        setSpData(sRes.specialist)
        const slots = slotsRes.slots || []
        setServerSlots(slots)
        // ?slotId= comes from the "next available" chips on the profile page.
        const wanted = Number(sp.get('slotId'))
        const pre = slots.find((x: any) => x.id === wanted)
        if (pre) {
          setDayKey(cairo(pre.startsAt).key)
          setSlotId(pre.id)
        }
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const days = useMemo(() => {
    const map = new Map<string, { key: string; weekday: string; day: number; month: string; slots: { id: number; time: string }[] }>()
    serverSlots.forEach((sl) => {
      const c = cairo(sl.startsAt)
      if (!map.has(c.key)) map.set(c.key, { key: c.key, weekday: c.weekday, day: c.day, month: c.month, slots: [] })
      map.get(c.key)!.slots.push({ id: sl.id, time: c.time })
    })
    return [...map.values()].slice(0, 14)
  }, [serverSlots])

  useEffect(() => {
    if (!dayKey && days.length) setDayKey(days[0].key)
  }, [days, dayKey])

  if (loading) return <Skeleton className="h-[420px]" />

  if (!spData || failed)
    return (
      <Card>
        <EmptyState title="We couldn't find that specialist" text="Go back and choose someone from the list." action={<Btn to="/app/specialists">Back to specialists</Btn>} />
      </Card>
    )

  const rate: number = spData.rateEgp || 0
  const s = {
    id: spData.id,
    name: spData.name,
    initials: getInitials(spData.name),
    svc: (spData.service || (spData.type === 'physical_therapist' ? 'recover' : spData.type === 'nutritionist' ? 'eat' : 'move')) as Svc,
    role: spData.type === 'physical_therapist' ? 'Physical therapist' : spData.type === 'nutritionist' ? 'Dietitian' : 'Personal trainer',
  }

  // "Single session" is always offered; the rest are the specialist's real packages.
  const options: PackageOption[] = [
    { id: 'single', name: 'Single session', n: 1, price: rate, note: 'One 30 minute session. Good for a first chat or a one-off question.' },
    ...((spData.packages || []) as any[]).filter((p) => p.sessionsCount > 1).map((p) => ({
      id: String(p.id),
      packageId: p.id as number,
      name: p.name as string,
      n: p.sessionsCount as number,
      price: p.priceEgp as number,
      note: (p.description as string) || `${p.sessionsCount} sessions with ${s.name}.`,
    })),
  ]
  const pk = options.find((p) => p.id === pkg) ?? options[0]
  // The server only discounts chat for single sessions, so the total shown must follow the same rule.
  const total = !pk.packageId && type !== 'Video call' ? Math.round(pk.price * CHAT_DISCOUNT) : pk.price

  const day = days.find((d) => d.key === dayKey)
  const chosen = serverSlots.find((x) => x.id === slotId)
  const when = chosen ? (() => { const c = cairo(chosen.startsAt); return `${c.weekday} ${c.day} ${c.month}, ${c.time}` })() : null

  const next = () => {
    if (step === 1 && !chosen) return setErr('Choose a time to continue.')
    setErr('')
    setStep(step + 1)
  }

  const confirm = () =>
    nav('/app/bookings/checkout', {
      state: {
        spId: s.id,
        spName: s.name,
        pkg: pk.name,
        packageId: pk.packageId,
        n: pk.n,
        type,
        when,
        total,
        resched,
        bookingId: reschedBookingId,
        slotId: chosen?.id,
      },
    })

  return (
    <div>
      <button onClick={() => (step > 0 && !(resched && step === 1) ? setStep(step - 1) : nav(-1))} className="inline-flex items-center gap-2 min-h-11 font-semibold mb-2 cursor-pointer">
        <ArrowLeft size={18} aria-hidden /> Back
      </button>
      <div className="mb-8" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step + 1} aria-label={`Step ${step + 1} of 3`}>
        <p className="font-semibold text-[15px] mb-3">
          Step {step + 1} of 3: {steps[step]}
        </p>
        <div className="flex gap-2 max-w-xl">
          {steps.map((label, i) => (
            <span key={label} className={`h-2 flex-1 rounded-full ${i <= step ? 'bg-ink' : 'bg-line'}`} />
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
        <div>
          {step === 0 && (
            <div>
              <h2 className="h-display text-[28px]" style={{ letterSpacing: '-0.025em' }}>{t('booking.choose_package', 'Choose a package')}</h2>
              <div role="radiogroup" aria-label="Package" className="grid gap-3 mt-5">
                {options.map((p) => (
                  <button
                    key={p.id}
                    role="radio"
                    aria-checked={pkg === p.id}
                    onClick={() => setPkg(p.id)}
                    className={`text-left rounded-2xl p-5 bg-white border-2 flex gap-4 items-start cursor-pointer ${pkg === p.id ? 'border-ink' : 'border-line hover:border-ink/40'}`}
                  >
                    <span className={`mt-1 size-6 rounded-full border-2 border-ink grid place-items-center shrink-0 ${pkg === p.id ? 'bg-ink text-white' : ''}`}>{pkg === p.id && <Check size={14} strokeWidth={3} />}</span>
                    <span className="flex-1">
                      <span className="font-bold block">{p.name}</span>
                      <span className="text-[15px] text-ink-2 block">{p.note}</span>
                    </span>
                    <span className="text-right shrink-0">
                      <span className="num text-[22px] block">{p.price.toLocaleString('en-US')}</span>
                      <span className="text-[13px] text-ink-2">EGP</span>
                    </span>
                  </button>
                ))}
              </div>
              <h3 className="font-bold mt-8 mb-3">Session type</h3>
              <div role="radiogroup" aria-label="Session type" className="grid sm:grid-cols-2 gap-3">
                {[
                  ['Video call', Video, '30 minutes, live with your specialist.'],
                  ['Chat check-in', MessageSquare, 'Send updates in the app. Reply within 4 hours. 40% cheaper on single sessions.'],
                ].map(([label, I, d]) => {
                  const Icon = I as typeof Video
                  return (
                    <button
                      key={label as string}
                      role="radio"
                      aria-checked={type === label}
                      onClick={() => setType(label as string)}
                      className={`text-left rounded-2xl p-5 bg-white border-2 cursor-pointer ${type === label ? 'border-ink' : 'border-line hover:border-ink/40'}`}
                    >
                      <span className="flex items-center gap-2 font-bold"><Icon size={20} aria-hidden /> {label as string}{type === label && <Check size={18} className="ml-auto" aria-hidden />}</span>
                      <span className="text-[15px] text-ink-2 block mt-1">{d as string}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="h-display text-[28px]" style={{ letterSpacing: '-0.025em' }}>
                {resched ? t('booking.pick_new_time', 'Pick a new time') : t('booking.pick_date_time', 'Pick a date and time')}
              </h2>
              <p className="text-ink-2 mt-1 flex items-center gap-2"><Info size={16} aria-hidden /> All times are Cairo time.</p>
              {days.length === 0 ? (
                <p className="text-ink-2 mt-6">{s.name} has no free times right now. Check back soon or choose someone else.</p>
              ) : (
                <>
                  <div role="radiogroup" aria-label="Date" className="mt-5 grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {days.map((d) => (
                      <button
                        key={d.key}
                        role="radio"
                        aria-checked={dayKey === d.key}
                        aria-label={`${d.weekday} ${d.day} ${d.month}`}
                        onClick={() => { setDayKey(d.key); setSlotId(null) }}
                        className={`min-h-[72px] rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer ${dayKey === d.key ? 'bg-ink text-white border-ink' : 'bg-white border-line hover:border-ink/40'}`}
                      >
                        <span className="text-[13px] font-semibold">{d.weekday}</span>
                        <span className="num text-[22px]">{d.day}</span>
                        <span className="text-[11px] opacity-70">{d.month}</span>
                      </button>
                    ))}
                  </div>
                  {day && (
                    <>
                      <h3 className="font-bold mt-8 mb-3">Free times on {day.weekday} {day.day} {day.month}</h3>
                      <div role="radiogroup" aria-label="Time" className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {day.slots.map((sl) => (
                          <button
                            key={sl.id}
                            role="radio"
                            aria-checked={slotId === sl.id}
                            onClick={() => { setSlotId(sl.id); setErr('') }}
                            className={`min-h-12 rounded-xl border font-bold cursor-pointer ${slotId === sl.id ? 'bg-ink text-white border-ink' : 'bg-white border-ink/25 hover:border-ink'}`}
                          >
                            {sl.time}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
              {err && <p role="alert" className="text-[#a02a2a] font-semibold text-[14px] mt-3">{err}</p>}
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="h-display text-[28px]" style={{ letterSpacing: '-0.025em' }}>{t('booking.review_confirm', 'Review and confirm')}</h2>
              <Card className="mt-5 divide-y divide-line">
                {[
                  ['Specialist', s.name],
                  ['Package', `${pk.name} (${pk.n} ${pk.n === 1 ? 'session' : 'sessions'})`],
                  ['Type', type],
                  ['First session', `${when}, Cairo time`],
                ].map(([k, v]) => (
                  <div key={k} className="p-4 flex justify-between gap-4">
                    <span className="text-ink-2">{k}</span>
                    <span className="font-bold text-right">{v}</span>
                  </div>
                ))}
              </Card>
              <p className="text-[15px] text-ink-2 mt-4 max-w-lg">Free cancellation up to 12 hours before. After that the session cannot be cancelled online.</p>
            </div>
          )}

          <div className="flex justify-between mt-10 gap-3">
            {step > 0 && !(resched && step === 1) ? (
              <Btn variant="secondary" onClick={() => setStep(step - 1)}><ArrowLeft size={18} aria-hidden /> Back</Btn>
            ) : <span />}
            {step < 2 ? (
              <Btn onClick={next}>Continue <ArrowRight size={18} aria-hidden /></Btn>
            ) : (
              <Btn onClick={confirm}>{resched ? 'Confirm new time' : 'Continue to payment'} <ArrowRight size={18} aria-hidden /></Btn>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24">
          <Card className="p-6">
            <p className="label text-ink-2">Your booking</p>
            <div className="flex items-center gap-3 mt-3">
              <Avatar initials={s.initials} svc={s.svc} />
              <div>
                <p className="font-bold leading-5">{s.name}</p>
                <Tag svc={s.svc}>{s.role}</Tag>
              </div>
            </div>
            <dl className="mt-5 space-y-3 text-[15px]">
              <div className="flex justify-between gap-3"><dt className="text-ink-2">Package</dt><dd className="font-semibold text-right">{pk.name}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink-2">Type</dt><dd className="font-semibold">{type}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink-2">When</dt><dd className="font-semibold text-right">{when ?? 'Not chosen yet'}</dd></div>
            </dl>
            <div className={`mt-5 rounded-xl p-4 flex items-baseline justify-between ${(SVC[s.svc] || SVC.move).tint}`}>
              <span className="font-semibold">Total</span>
              <span className="num text-[28px]">{egp(total)}</span>
            </div>
          </Card>
          <Link to="/app/specialists" className="inline-flex min-h-11 items-center mt-3 text-[15px] font-semibold underline underline-offset-4">Choose someone else</Link>
        </aside>
      </div>
    </div>
  )
}
