import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Mic, MicOff, Video, VideoOff, MonitorUp, MessageSquare, PhoneOff, Clock, ArrowLeft, Plus } from 'lucide-react'
import { Wordmark, SVC, inputCls, Btn, EmptyState, Skeleton } from '../../ui'
import { useLanguage } from '../../context/LanguageContext'
import { api, getStoredUser } from '../../api'

type Svc = 'move' | 'eat' | 'recover'
type Note = { svc: Svc; by: string; text: string }

const typeSvc = (type?: string): Svc => (type === 'trainer' ? 'move' : type === 'nutritionist' ? 'eat' : 'recover')
const initials = (name = '') =>
  name.replace(/^(Dr\.|Coach)\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?'
const pad = (n: number) => String(n).padStart(2, '0')

export default function Session() {
  const { t } = useLanguage()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const me = getStoredUser()
  const isSpecialist = me?.role === 'specialist'

  const [session, setSession] = useState<any>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'none'>('loading')
  const [sec, setSec] = useState(0) // seconds since the session started (negative = not started yet)
  const [mic, setMic] = useState(true)
  const [cam, setCam] = useState(true)
  const [share, setShare] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [draft, setDraft] = useState('')
  const [confirmEnd, setConfirmEnd] = useState(false)

  // Find the booking: ?booking=ID, otherwise this user's next upcoming one.
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        let id: string | number | null = params.get('booking')
        if (!id) {
          if (isSpecialist) {
            const res = await api.getSpecialistSchedule({ from: new Date(Date.now() - 3600000).toISOString() })
            id = res.slots.find((s: any) => s.booking?.status === 'confirmed')?.booking?.id ?? null
          } else {
            const res = await api.getBookings('upcoming')
            id = res.bookings[0]?.id ?? null
          }
        }
        if (!id) {
          if (active) setLoadState('none')
          return
        }
        const res = await api.getBookingSession(id)
        if (!active) return
        setSession(res.session)
        setNotes(
          res.session.notes
            ? [{ svc: typeSvc(res.session.specialist?.type), by: res.session.client?.name || '', text: res.session.notes }]
            : []
        )
        setLoadState('ready')
      } catch {
        if (active) setLoadState('none')
      }
    })()
    return () => {
      active = false
    }
  }, [params, isSpecialist])

  useEffect(() => {
    if (!session?.startsAt) return
    const tick = () => setSec(Math.floor((Date.now() - new Date(session.startsAt).getTime()) / 1000))
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [session])

  const ctl = (on: boolean, danger = false) =>
    `size-14 rounded-full grid place-items-center cursor-pointer transition ${danger ? 'bg-[#a02a2a] text-white' : on ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-white text-ink'}`

  if (loadState === 'loading') {
    return (
      <div className="min-h-screen bg-paper p-6">
        <Skeleton className="h-[420px]" />
      </div>
    )
  }

  if (loadState === 'none' || !session) {
    return (
      <div className="min-h-screen bg-paper grid place-items-center p-6">
        <EmptyState
          title={t('session.none_title', 'No upcoming session')}
          text={t('session.none_text', 'Book a session to join a call with your specialist.')}
          action={<Btn to="/app/today">{t('session.back_today', 'Back to Today')}</Btn>}
        />
      </div>
    )
  }

  const other = isSpecialist ? session.client : session.specialist
  const otherName: string = other?.name || ''
  const otherSvc = typeSvc(session.specialist?.type)
  const started = sec >= 0
  const clock = `${sec < 0 ? '-' : ''}${pad(Math.floor(Math.abs(sec) / 60))}:${pad(Math.abs(sec) % 60)}`
  const kind = session.sessionType === 'chat' ? 'Chat' : 'Video call'

  return (
    <div className="min-h-screen bg-paper lg:h-[100dvh] lg:overflow-hidden flex flex-col">
      <header className="h-16 shrink-0 px-5 lg:px-8 flex items-center justify-between border-b border-line bg-paper">
        <div className="flex items-center gap-4">
          <Link to="/app/today" className="size-11 grid place-items-center rounded-xl hover:bg-ink/5" aria-label="Back to Today"><ArrowLeft size={20} /></Link>
          <Wordmark className="hidden sm:inline-flex" />
        </div>
        <p className="text-[14px] text-ink-2">{otherName} · {kind}</p>
      </header>

      <div className="flex-1 min-h-0 grid lg:grid-cols-[1fr_380px] gap-5 p-5 lg:p-6">
        <section aria-label="Video call" className="relative rounded-[28px] bg-ink text-white min-h-[420px] lg:min-h-0 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 h-8 text-[14px] font-semibold">
              <span className={`size-2 rounded-full ${started ? 'bg-ok' : 'bg-warn'}`} aria-hidden /> {started ? 'Connected' : 'Waiting to start'}
            </span>
            <span className="inline-flex items-center gap-2 text-[14px] font-semibold"><Clock size={16} aria-hidden /> <span className="num">{clock}</span></span>
          </div>
          <div className="flex-1 grid place-items-center">
            <div className="text-center">
              <div className={`mx-auto size-32 sm:size-40 rounded-[36px] ${SVC[otherSvc].bg} grid place-items-center h-display text-[48px] sm:text-[60px] text-ink`}>{initials(otherName)}</div>
              <p className="h-display text-[24px] mt-5" style={{ letterSpacing: '-0.02em' }}>{otherName}</p>
              <p className="text-white/70 text-[15px]">{share ? 'You are sharing your screen' : started ? 'In the session' : 'The session has not started yet'}</p>
            </div>
          </div>
          <div className="absolute right-4 top-16 w-28 sm:w-36 aspect-[4/3] rounded-2xl bg-[#2a2e35] border border-white/15 grid place-items-center">
            {cam ? <span className="size-12 rounded-xl bg-move grid place-items-center font-display font-extrabold text-ink">{initials(me?.name)}</span> : <span className="text-[13px] text-white/70 flex items-center gap-1"><VideoOff size={14} aria-hidden /> Camera off</span>}
            <span className="absolute bottom-1.5 left-2 text-[13px] font-semibold">You</span>
          </div>
          <div className="p-5 flex flex-wrap justify-center items-center gap-3 sm:gap-4">
            <button className={ctl(mic)} aria-pressed={!mic} aria-label={mic ? 'Mute microphone' : 'Unmute microphone'} onClick={() => setMic(!mic)}>{mic ? <Mic size={22} /> : <MicOff size={22} />}</button>
            <button className={ctl(cam)} aria-pressed={!cam} aria-label={cam ? 'Turn camera off' : 'Turn camera on'} onClick={() => setCam(!cam)}>{cam ? <Video size={22} /> : <VideoOff size={22} />}</button>
            <button className={ctl(!share)} aria-pressed={share} aria-label={share ? 'Stop sharing screen' : 'Share screen'} onClick={() => setShare(!share)}><MonitorUp size={22} /></button>
            <button className={ctl(true)} aria-label="Open chat"><MessageSquare size={22} /></button>
            <button className={ctl(true, true)} aria-label="Leave session" onClick={() => setConfirmEnd(true)}><PhoneOff size={22} /></button>
          </div>
          {confirmEnd && (
            <div role="alertdialog" aria-label="Leave session" className="absolute inset-0 bg-ink/80 grid place-items-center p-5">
              <div className="bg-white text-ink rounded-2xl p-6 max-w-sm w-full">
                <p className="h-display text-[22px]">Leave the session?</p>
                <p className="text-ink-2 mt-2">You can rejoin until the session time is up.</p>
                <div className="flex gap-3 mt-5 justify-end">
                  <Btn variant="secondary" onClick={() => setConfirmEnd(false)}>Stay</Btn>
                  <Btn onClick={() => nav('/app/today')}>Leave</Btn>
                </div>
              </div>
            </div>
          )}
        </section>

        <aside className="bg-white border border-line rounded-[28px] p-5 flex flex-col min-h-0">
          <div className={`${SVC[otherSvc].tint} rounded-2xl p-4 flex items-baseline justify-between`}>
            <div>
              <p className="label">{started ? 'Session time' : 'Starts in'}</p>
              <p className="num text-[36px] leading-none mt-1">{clock}</p>
            </div>
            <p className="text-[14px] font-semibold">of <span className="num">30:00</span></p>
          </div>
          <h2 className="h-display text-[20px] mt-5" style={{ letterSpacing: '-0.02em' }}>{t('session.shared_notes', 'Shared plan notes')}</h2>
          <ul className="mt-3 space-y-2 flex-1 overflow-y-auto min-h-[160px]">
            {notes.length === 0 && <li className="text-ink-2 text-[15px]">{t('session.no_notes', 'No notes for this session yet.')}</li>}
            {notes.map((n, i) => (
              <li key={i} className={`${SVC[n.svc].tint} rounded-xl p-3`}>
                <p className="label">{n.by}</p>
                <p className="text-[15px] leading-6">{n.text}</p>
              </li>
            ))}
          </ul>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (draft.trim()) {
                setNotes([...notes, { svc: 'move', by: 'You', text: draft.trim() }])
                setDraft('')
              }
            }}
          >
            <input aria-label="Add a note" placeholder="Add a note for your team" className={inputCls} value={draft} onChange={(e) => setDraft(e.target.value)} />
            <button className="size-12 shrink-0 rounded-xl bg-ink text-white grid place-items-center cursor-pointer" aria-label="Add note"><Plus size={20} /></button>
          </form>
        </aside>
      </div>
    </div>
  )
}
