import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Ban } from 'lucide-react'
import { Btn, Card, Dialog, Gate, PageHead, Skeleton, SVC, type DemoState } from '../../ui'
import { api } from '../../api'
import { useLanguage } from '../../context/LanguageContext'

// Every cell of the grid is one 30-minute slot. A slot only exists in the
// database once the specialist opens it, so "Closed" cells have no slot yet.
type Cell = { id: number; booked: boolean; booking?: { id: number; status: string; client: { id: number; name: string }; topic: string } }

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const FIRST = 8 * 60
const rows = Array.from({ length: 28 }, (_, i) => FIRST + i * 30) // 08:00 to 21:30
const hm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const t12 = (m: number) => {
  const h = Math.floor(m / 60)
  return `${h % 12 || 12}:${String(m % 60).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

// Monday 00:00 (local time) of the week that is `offset` weeks from now.
function weekStart(offset: number) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7)
  return d
}
const dayDate = (start: Date, d: number) => {
  const x = new Date(start)
  x.setDate(x.getDate() + d)
  return x
}
const slotStart = (start: Date, d: number, m: number) => {
  const x = dayDate(start, d)
  x.setHours(Math.floor(m / 60), m % 60, 0, 0)
  return x
}

export default function Schedule() {
  const { t } = useLanguage()
  const [week, setWeek] = useState(0)
  const [day, setDay] = useState(() => (new Date().getDay() + 6) % 7)
  const [cells, setCells] = useState<Record<string, Cell>>({})
  const [pick, setPick] = useState<{ d: number; m: number } | null>(null)
  const [state, setState] = useState<DemoState>('loading')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const start = weekStart(week)
  const key = (d: number, m: number) => `${d}-${hm(m)}`
  const dateLabel = (d: number) => dayDate(start, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const isPast = (d: number, m: number) => slotStart(start, d, m).getTime() <= Date.now()

  const load = useCallback(() => {
    setState('loading')
    const from = start.toISOString()
    const to = dayDate(start, 7).toISOString()
    api
      .getSpecialistSchedule({ from, to })
      .then((res) => {
        const map: Record<string, Cell> = {}
        res.slots.forEach((s: any) => {
          const dt = new Date(s.startsAt)
          const d = (dt.getDay() + 6) % 7
          const k = `${d}-${hm(dt.getHours() * 60 + dt.getMinutes())}`
          map[k] = {
            id: s.id,
            booked: s.isBooked,
            booking: s.booking
              ? { id: s.booking.id, status: s.booking.status, client: s.booking.client, topic: s.booking.notes || s.booking.sessionType }
              : undefined,
          }
        })
        setCells(map)
        setState('loaded')
      })
      .catch(() => setState('error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week])

  useEffect(load, [load])

  const run = async (action: () => Promise<unknown>, done: string) => {
    setBusy(true)
    try {
      await action()
      setMsg(done)
      setPick(null)
      load()
    } catch (err: any) {
      setMsg(err?.message || t('schedule.action_failed', 'Something went wrong. Please try again.'))
      setPick(null)
    } finally {
      setBusy(false)
    }
  }

  const openCount = Object.values(cells).filter((c) => !c.booked).length
  const bookedCount = Object.values(cells).filter((c) => c.booking && c.booking.status !== 'completed').length
  const doneCount = Object.values(cells).filter((c) => c.booking?.status === 'completed').length

  const booked = SVC.recover
  const cell = (d: number, m: number) => {
    const c = cells[key(d, m)]
    const past = isPast(d, m)
    const base = 'w-full min-h-11 h-full rounded-lg text-left px-2 text-[13px] leading-4 font-semibold flex flex-col justify-center cursor-pointer'
    const label = `${dayNames[d]} ${t12(m)}`

    if (c?.booking) {
      const done = c.booking.status === 'completed'
      return (
        <button onClick={() => setPick({ d, m })} className={`${base} ${done ? 'bg-sand text-ink-2' : booked.tint} border-l-4`} style={{ borderLeftColor: done ? '#9a9a9a' : booked.hex }} aria-label={`${label}: ${c.booking.client.name}`}>
          <span className="truncate">{c.booking.client.name}</span>
        </button>
      )
    }
    if (c) {
      return (
        <button onClick={() => setPick({ d, m })} disabled={past} className={`${base} border border-dashed border-ink/30 text-ink-2 hover:border-ink hover:bg-white disabled:opacity-40 disabled:cursor-default`} aria-label={`${label}: ${t('schedule.slot_open', 'Open slot')}`}>
          {t('schedule.open', 'Open')}
        </button>
      )
    }
    if (past) return <div className="w-full h-full min-h-11 rounded-lg bg-sand/50" aria-hidden />
    return (
      <button onClick={() => setPick({ d, m })} className={`${base} bg-sand/60 text-ink-2 items-start hover:bg-sand`} aria-label={`${label}: ${t('schedule.closed', 'Closed')}`}>
        <span className="inline-flex items-center gap-1"><Ban size={12} aria-hidden /> {t('schedule.closed', 'Closed')}</span>
      </button>
    )
  }

  const pc = pick ? cells[key(pick.d, pick.m)] : undefined
  const pb = pc?.booking
  const pickStart = pick ? slotStart(start, pick.d, pick.m) : null
  const pickStarted = pickStart ? pickStart.getTime() <= Date.now() : false

  return (
    <div>
      <PageHead
        title={t('schedule.title', 'Schedule')}
        sub={t('schedule.sub', 'Week of {date}. {count} open slots.').replace('{date}', dateLabel(0)).replace('{count}', String(openCount))}
      />
      {msg && <p role="status" className="mb-4 rounded-xl bg-sand font-semibold px-4 py-3">{msg}</p>}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="inline-flex items-center gap-1">
          <button aria-label="Previous week" onClick={() => setWeek(week - 1)} className="size-11 rounded-xl border border-line bg-white grid place-items-center cursor-pointer"><ChevronLeft size={20} /></button>
          <button onClick={() => setWeek(0)} className="min-h-11 px-4 rounded-xl border border-line bg-white font-bold cursor-pointer">{t('schedule.this_week', 'This week')}</button>
          <button aria-label="Next week" onClick={() => setWeek(week + 1)} className="size-11 rounded-xl border border-line bg-white grid place-items-center cursor-pointer"><ChevronRight size={20} /></button>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-[14px]" aria-label="Legend">
          <li className="inline-flex items-center gap-2"><span className={`size-4 rounded ${booked.bg}`} aria-hidden /> {t('schedule.legend_booked', 'Booked')} ({bookedCount})</li>
          <li className="inline-flex items-center gap-2"><span className="size-4 rounded bg-sand border border-line" aria-hidden /> {t('schedule.legend_completed', 'Completed')} ({doneCount})</li>
          <li className="inline-flex items-center gap-2"><span className="size-4 rounded border border-dashed border-ink/50" aria-hidden /> {t('schedule.open', 'Open')} ({openCount})</li>
        </ul>
      </div>

      <Gate state={state} retry={load} skeleton={<Skeleton className="h-[520px]" />} empty={<Skeleton className="h-[520px]" />}>
        <Card className="hidden md:block overflow-x-auto">
          <div className="min-w-[860px] grid grid-cols-[64px_repeat(7,1fr)]">
            <div className="border-b border-line" />
            {dayNames.map((n, d) => {
              const today = week === 0 && d === (new Date().getDay() + 6) % 7
              return (
                <div key={n} className={`px-2 py-3 text-center border-b border-line ${today ? 'bg-ink text-white' : ''}`}>
                  <p className="text-[13px] font-semibold">{n}</p>
                  <p className="num text-[20px]">{dayDate(start, d).getDate()}</p>
                </div>
              )
            })}
            {rows.map((m) => (
              <div key={m} className="contents">
                <div className="text-[13px] text-ink-2 num px-2 pt-1 text-right border-r border-line h-12">{m % 60 === 0 ? t12(m) : ''}</div>
                {dayNames.map((_, d) => (
                  <div key={d} className={`p-0.5 h-12 ${m % 60 === 0 ? 'border-t border-line' : ''}`}>{cell(d, m)}</div>
                ))}
              </div>
            ))}
          </div>
        </Card>

        <div className="md:hidden">
          <div role="radiogroup" aria-label="Day" className="grid grid-cols-7 gap-1.5 mb-4">
            {dayNames.map((n, d) => (
              <button key={n} role="radio" aria-checked={day === d} onClick={() => setDay(d)} className={`min-h-14 rounded-xl border flex flex-col items-center justify-center cursor-pointer ${day === d ? 'bg-ink text-white border-ink' : 'bg-white border-line'}`}>
                <span className="text-[13px] font-semibold">{n}</span>
                <span className="num text-[18px]">{dayDate(start, d).getDate()}</span>
              </button>
            ))}
          </div>
          <Card className="p-3">
            <p className="font-bold px-1 pb-2">{dayNames[day]} {dateLabel(day)}</p>
            <ul className="space-y-1.5">
              {rows.filter((m) => !isPast(day, m) || cells[key(day, m)]).map((m) => (
                <li key={m} className="grid grid-cols-[72px_1fr] gap-2 items-stretch">
                  <span className="num text-[13px] text-ink-2 pt-3">{t12(m)}</span>
                  <div className="min-h-12">{cell(day, m)}</div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Gate>

      <Dialog
        open={!!pick}
        onClose={() => setPick(null)}
        title={pb ? t('schedule.kind_rehab', 'Client session') : pc ? t('schedule.slot_open', 'Open slot') : t('schedule.slot_blocked', 'Closed time')}
      >
        {pick && pickStart && (
          <>
            <p className="font-semibold">{dayNames[pick.d]} {dateLabel(pick.d)}, {t12(pick.m)} {t('schedule.to', 'to')} {t12(pick.m + 30)}</p>
            {pb ? (
              <>
                <p className="mt-2">{pb.client.name}</p>
                <p className="text-ink-2">{pb.topic}</p>
                {pb.status === 'completed' && <p className="mt-2 font-semibold">{t('schedule.completed', 'This session is completed.')}</p>}
                <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 sm:justify-end">
                  <Btn variant="secondary" onClick={() => setPick(null)}>{t('common.close', 'Close')}</Btn>
                  {pb.status === 'confirmed' && !pickStarted && (
                    <Btn variant="secondary" disabled={busy} onClick={() => run(() => api.specialistCancelBooking(pb.id), t('schedule.cancelled_msg', 'Session cancelled. The client was notified.'))}>
                      {t('schedule.cancel_session', 'Cancel session')}
                    </Btn>
                  )}
                  {pb.status === 'confirmed' && pickStarted && (
                    <Btn disabled={busy} onClick={() => run(() => api.completeBooking(pb.id), t('schedule.completed_msg', 'Session marked as completed.'))}>
                      {t('schedule.mark_complete', 'Mark complete')}
                    </Btn>
                  )}
                  <Btn to={`/app/clients/${pb.client.id}`}>{t('schedule.open_client', 'Open client')}</Btn>
                </div>
              </>
            ) : pc ? (
              <>
                <p className="text-ink-2 mt-2">{t('schedule.open_desc', 'Nobody has booked this time. Block it if you are not available.')}</p>
                <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 sm:justify-end">
                  <Btn variant="secondary" onClick={() => setPick(null)}>{t('schedule.leave_open', 'Leave open')}</Btn>
                  <Btn disabled={busy} onClick={() => run(() => api.blockSlot(pc.id), t('schedule.slot_blocked_msg', 'Slot blocked. Clients cannot book it.'))}>
                    {t('schedule.block_time_btn', 'Block this time')}
                  </Btn>
                </div>
              </>
            ) : (
              <>
                <p className="text-ink-2 mt-2">{t('schedule.blocked_desc', 'Clients cannot book this time.')}</p>
                <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 sm:justify-end">
                  <Btn variant="secondary" onClick={() => setPick(null)}>{t('schedule.keep_blocked', 'Keep closed')}</Btn>
                  <Btn disabled={busy} onClick={() => run(() => api.openSlot(pickStart.toISOString()), t('schedule.slot_opened_msg', 'Slot opened. Clients can book it now.'))}>
                    {t('schedule.open_slot_btn', 'Open this slot')}
                  </Btn>
                </div>
              </>
            )}
          </>
        )}
      </Dialog>
    </div>
  )
}
