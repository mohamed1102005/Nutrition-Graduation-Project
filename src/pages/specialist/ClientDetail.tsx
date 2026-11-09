import { Fragment, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import {
  ArrowLeft,
  Plus,
  ShieldCheck,
  Hourglass,
  Trash2,
  CircleCheck,
  Mail,
  Phone,
  Users,
  AlertTriangle,
  Activity,
  HeartPulse,
  Dumbbell,
  FileText,
  Sliders,
  Calendar,
  Video,
  CheckCircle2,
  Lock,
  Eye,
  Info,
} from 'lucide-react'
import { Avatar, Btn, Card, Dialog, EmptyState, Field, inputCls, SafetyCallout, Segment, Skeleton, Tabs } from '../../ui'
import { LineChart, BarChart, Flag, PainTrend } from '@/components'
import { api, getStoredUser } from '../../api'
import { useLanguage } from '../../context/LanguageContext'

// One prescribed exercise. `raw` keeps the original database row so fields the
// editor does not show (tempo, rest, time of day ...) survive a save.
type Ex = { id: number; name: string; sets: number; reps: string; cleared: boolean; notes?: string; day: number; raw?: any }
type Note = { id: number; text: string; when: string; shared: boolean; author?: string; role?: string }
type Svc = 'move' | 'eat' | 'recover'

const TYPE_SVC: Record<string, Svc> = { trainer: 'move', nutritionist: 'eat', physical_therapist: 'recover' }
const TYPE_ROLE: Record<string, string> = { trainer: 'Trainer', nutritionist: 'Dietitian', physical_therapist: 'Physical Therapist' }
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const initialsOf = (name = '') =>
  name.replace(/^(Dr\.|Coach)\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?'
const goalLabel = (g?: string) => (g ? g.replace(/_/g, ' ').replace(/^./, (m) => m.toUpperCase()) : '')
const shortDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '')
const itemToEx = (it: any): Ex => ({
  id: it.id,
  name: it.title,
  sets: it.sets ?? 3,
  reps: it.reps ?? '10',
  cleared: Boolean(it.pt_cleared),
  notes: it.instructions || it.safety_note || '',
  day: it.day_of_week,
  raw: it,
})

// Build the 8-week chart series from the client's daily progress logs.
function buildCharts(logs: any[], target: number) {
  const monday = new Date()
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const labels: string[] = []
  const workouts: number[] = []
  const pain: number[] = []
  const painLabels: string[] = []
  for (let i = 7; i >= 0; i--) {
    const from = new Date(monday)
    from.setDate(from.getDate() - i * 7)
    const to = new Date(from)
    to.setDate(to.getDate() + 7)
    const inWeek = logs.filter((l) => l.date >= iso(from) && l.date < iso(to))
    const label = from.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    labels.push(label)
    workouts.push(inWeek.filter((l) => l.workout_done).length)
    const lastPain = [...inWeek].reverse().find((l) => l.pain_level !== null && l.pain_level !== undefined)
    if (lastPain) {
      pain.push(lastPain.pain_level)
      painLabels.push(label)
    }
  }
  const planned = target * 8
  const done = workouts.reduce((a, w) => a + Math.min(w, target), 0)
  return { labels, workouts, pain, painLabels, compliance: planned ? Math.round((done / planned) * 100) : 0 }
}

export default function ClientDetail() {
  const { id } = useParams()
  return <Inner key={id} id={id} />
}

function Inner({ id }: { id?: string }) {
  const { t, lang } = useLanguage()
  const me = getStoredUser()
  const myService: Svc = TYPE_SVC[me?.type] ?? 'recover'
  const canEditExercises = myService !== 'eat'

  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading')
  const [c, setC] = useState<any>(null)
  const [careTeam, setCareTeam] = useState<any[]>([])
  const [myPlan, setMyPlan] = useState<any>(null)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [tab, setTab] = useState('Overview')
  const [ex, setEx] = useState<Ex[]>([])
  const [limit, setLimit] = useState('4')
  const [angle, setAngle] = useState('')
  const [angleErr, setAngleErr] = useState('')
  const [saved, setSaved] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [saveErr, setSaveErr] = useState('')
  const [rm, setRm] = useState<Ex | null>(null)
  const [add, setAdd] = useState(false)
  const [nf, setNf] = useState({ name: '', sets: '3', reps: '10', notes: '', day: '1' })
  const [nerr, setNerr] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Note[]>([])
  const [draft, setDraft] = useState('')
  const [shared, setShared] = useState(true)
  const [noteErr, setNoteErr] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    if (!id) return
    setLoad('loading')
    Promise.all([
      api.getSpecialistClient(id),
      api.getSpecialistSchedule({ from: new Date(Date.now() - 3600000).toISOString() }).catch(() => ({ slots: [] as any[] })),
    ])
      .then(([res, sched]) => {
        if (!active) return
        const cl = res.client
        const inj = res.injuries?.[0]
        const logs: any[] = res.progress?.logs ?? []
        const lastLog = logs.length ? logs[logs.length - 1].date : ''
        const target = cl.daysPerWeek || 4
        const charts = buildCharts(logs, target)
        const plan =
          res.plans.find((p: any) => p.service === myService && p.status === 'active') ??
          res.plans.find((p: any) => p.service === myService && p.status === 'draft') ??
          null
        const exercises: Ex[] = plan ? plan.items.map(itemToEx) : []
        const angleMatch = exercises.map((e) => /(\d+)\s*°/.exec(e.raw?.safety_note ?? '')).find(Boolean)
        const safeLimit = res.progress?.safeLimit ?? 4

        setC({
          id: cl.id,
          name: cl.name,
          initials: cl.initials || initialsOf(cl.name),
          goal: goalLabel(cl.goal),
          week: cl.week,
          of: cl.of,
          age: cl.age,
          email: cl.email,
          phone: cl.phone,
          injury: inj ? `${goalLabel(inj.body_area)}${inj.note ? ` · ${inj.note}` : ''}` : '',
          area: (inj?.body_area || '').toLowerCase(),
          painTrend: res.progress?.painTrend ?? { now: 0, delta: 0, dir: 'flat' },
          flagged: Boolean(res.progress?.flagged),
          lastCheckin: lastLog ? shortDate(lastLog) : '—',
          target,
          charts,
        })
        setCareTeam(res.careTeam ?? [])
        setMyPlan(plan)
        setEx(exercises)
        setLimit(String(safeLimit))
        setAngle(angleMatch ? angleMatch[1] : '')
        setSaved(true)
        setNotes(
          (res.notes ?? []).map((n: any) => ({
            id: n.id,
            text: n.body,
            when: shortDate(n.created_at),
            shared: Boolean(n.visible_to_client),
            author: n.author_name,
            role: TYPE_ROLE[(res.careTeam ?? []).find((m: any) => m.id === n.author_id)?.type] ?? undefined,
          }))
        )
        const next = (sched.slots ?? []).find((s: any) => s.booking?.status === 'confirmed' && s.booking.client?.id === cl.id)
        setSessionId(next?.booking?.id ?? null)
        setLoad('ready')
      })
      .catch((err) => {
        console.error('Failed to load specialist client detail:', err)
        if (active) setLoad('error')
      })
    return () => { active = false }
  }, [id, reloadKey, myService])

  if (load === 'loading') return <Skeleton className="h-[480px]" />

  if (load === 'error' || !c)
    return (
      <Card>
        <EmptyState title={t('client_detail.t_client_record_not_found', 'Client Record Not Found')} text={t('client_detail.t_this_client_may_have_been_archived', 'This client may have been archived or is no longer in your care team.')} action={<Btn to="/app/clients">{t('client_detail.back', 'All Patient Charts')}</Btn>} />
      </Card>
    )

  const trend = c.painTrend
  const dirty = (fn: () => void) => { fn(); setSaved(false); setToast(''); setSaveErr('') }

  const save = async () => {
    if (c.area === 'knee' && myService === 'recover' && angle !== '' && (!/^\d+$/.test(angle) || Number(angle) > 120)) {
      return setAngleErr(t('client_detail.t_enter_a_knee_angle_between_0', 'Enter a knee angle between 0 and 120 degrees.'))
    }
    setAngleErr('')
    setSaving(true)
    setSaveErr('')
    try {
      const items = ex.map((e, idx) => {
        const hasAngle = /°/.test(e.raw?.safety_note ?? '')
        return {
          dayOfWeek: e.day,
          position: idx,
          timeOfDay: e.raw?.time_of_day ?? null,
          title: e.name,
          instructions: e.notes || null,
          sets: e.sets,
          reps: e.reps,
          tempo: e.raw?.tempo ?? null,
          restSec: e.raw?.rest_sec ?? null,
          durationMin: e.raw?.duration_min ?? null,
          painLimit: Number(limit),
          ptCleared: e.cleared,
          safetyNote: hasAngle && angle !== '' ? `Knee angle limit: ${angle}°` : e.raw?.safety_note ?? null,
        }
      })
      // Publishing creates a fresh active plan and archives the old one, so the client's check-off history is kept.
      await api.updateSpecialistPlan(c.id, myService, {
        status: 'active',
        title: myPlan?.title,
        summary: myPlan?.summary ?? null,
        items,
      })
      setToast(t('client_detail.t_protocol_published_s_plan_is_updated', 'Protocol published. {p1}\'s plan is updated.').replace('{p1}', String(c.name.split(' ')[0])))
      setReloadKey((k) => k + 1)
    } catch (err: any) {
      setSaveErr(err?.message || (t('client_detail.t_could_not_publish_the_changes_please', 'Could not publish the changes. Please try again.')))
    } finally {
      setSaving(false)
    }
  }

  const addEx = (e: FormEvent) => {
    e.preventDefault()
    const v: Record<string, string> = {}
    if (nf.name.trim().length < 3) v.name = t('client_detail.t_specify_the_exercise_protocol_name', 'Specify the exercise protocol name.')
    if (!(Number(nf.sets) >= 1 && Number(nf.sets) <= 10)) v.sets = t('client_detail.t_sets_1_to_10', 'Sets: 1 to 10.')
    if (!(Number(nf.reps) >= 1 && Number(nf.reps) <= 60)) v.reps = t('client_detail.t_reps_1_to_60', 'Reps: 1 to 60.')
    setNerr(v)
    if (Object.keys(v).length) return
    dirty(() => setEx([...ex, { id: -Date.now(), name: nf.name.trim(), sets: Number(nf.sets), reps: String(Number(nf.reps)), cleared: false, notes: nf.notes.trim(), day: Number(nf.day) }]))
    setNf({ name: '', sets: '3', reps: '10', notes: '', day: '1' })
    setAdd(false)
  }

  const addNote = async (e: FormEvent) => {
    e.preventDefault()
    if (draft.trim().length < 3) return setNoteErr(t('client_detail.t_enter_clinical_observation_details', 'Enter clinical observation details.'))
    setNoteErr('')
    try {
      const res = await api.addSpecialistNote(c.id, { body: draft.trim(), visibleToClient: shared })
      const n = res.note
      setNotes([{ id: n.id, text: n.body, when: shortDate(n.createdAt), shared: n.visibleToClient, author: n.authorName, role: TYPE_ROLE[me?.type] }, ...notes])
      setDraft('')
    } catch (err: any) {
      setNoteErr(err?.message || (t('client_detail.t_could_not_save_the_note_please', 'Could not save the note. Please try again.')))
    }
  }

  const L = c.charts.labels
  const isPainCritical = c.flagged
  const netChange = c.charts.pain.length > 1 ? c.charts.pain[c.charts.pain.length - 1] - c.charts.pain[0] : 0

  return (
    <div className="space-y-6">
      {/* Back to Client Directory */}
      <div>
        <Link
          to="/app/clients"
          className="inline-flex items-center gap-2 text-sm font-bold text-ink-2 hover:text-ink transition cursor-pointer"
        >
          <ArrowLeft size={16} aria-hidden /> {t('client_detail.back', 'All Patient Charts')}
        </Link>
      </div>

      {/* Clinical Patient Summary Header */}
      <Card className="p-6 bg-white border border-line">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="size-16 rounded-2xl bg-recover-tint text-[#3b2d60] font-bold text-xl grid place-items-center shrink-0 border border-line">
              {c.initials}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="h-display text-[22px] sm:text-[24px] text-ink leading-tight">
                  {c.name}
                </h2>
                <span className="text-xs capitalize font-bold px-2.5 py-0.5 rounded-full bg-paper text-ink border border-line">
                  {t('client_detail.t_patient_id', 'Patient ID #{p1}').replace('{p1}', String(c.id))}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-ok-tint text-[#1d6b3d]">
                  {t('client_detail.active_rehab', 'Active Rehab')}
                </span>
              </div>

              <p className="text-sm text-ink-2 font-medium">
                {c.injury ? `${c.injury} · ` : ''}{t('client_detail.t_week', 'Week')} <strong className="text-ink num">{c.week}</strong> {t('client_detail.t_of', 'of')} {c.of}{c.goal ? ` (${c.goal})` : ''}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-ink-2 pt-1">
                <span>{t('client_detail.t_age', 'Age:')} <strong className="text-ink">{c.age ? `${c.age} ${t('client_detail.t_yrs', 'yrs')}` : '—'}</strong></span>
                <span>·</span>
                <span>{t('client_detail.t_last_activity', 'Last Activity:')} <strong className="text-ink">{c.lastCheckin}</strong></span>
                <span>·</span>
                <span>{t('client_detail.t_contact', 'Contact:')} <strong className="text-ink">{c.phone || c.email}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-line">
            <div className="px-4 py-2.5 rounded-xl border border-line bg-paper/60 text-center">
              <span className="text-[12px] font-semibold text-ink-2 block">{t('client_detail.pain_score', 'Pain Score')}</span>
              <span className="num font-bold text-[20px] text-ink leading-none mt-0.5 block">
                {trend.now} <span className="text-xs font-normal text-ink-2">/ 10</span>
              </span>
            </div>

            <div className="px-4 py-2.5 rounded-xl border border-line bg-paper/60 text-center">
              <span className="text-[12px] font-semibold text-ink-2 block">{t('client_detail.safe_limit', 'Safe Threshold')}</span>
              <span className="num font-bold text-[20px] text-ink leading-none mt-0.5 block">
                {limit} <span className="text-xs font-normal text-ink-2">/ 10</span>
              </span>
            </div>

            {sessionId && (
              <Btn to={`/session?booking=${sessionId}`} className="gap-2">
                <Video size={16} aria-hidden /> {t('client_detail.video_consult', 'Launch Video Consult')}
              </Btn>
            )}
          </div>
        </div>
      </Card>

      {/* Critical Safety Callout if Pain Exceeds Threshold */}
      {isPainCritical && (
        <SafetyCallout title={t('client_detail.t_clinical_alert_current_pain_10_exceeds', 'CLINICAL ALERT: Current pain ({p1}/10) exceeds client safe threshold ({p2}/10)').replace('{p1}', String(trend.now)).replace('{p2}', String(limit))}>
          {t('client_detail.t_reported_pain_above_the_safe_limit', '{p1} reported pain above the safe limit. Review the protocol below and consider pausing loaded movements before you contact them.').replace('{p1}', String(c.name.split(' ')[0]))}
        </SafetyCallout>
      )}

      {/* Clinical Section Tabs */}
      <Tabs
        label="Clinical Chart Sections"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'Overview', label: t('client_detail.tab_overview', 'Patient Vitals & Care Team') },
          { id: 'Protocol', label: t('client_detail.tab_protocol', 'Exercise Prescription (EHR Editor)') },
          { id: 'Progress', label: t('client_detail.tab_progress', 'Longitudinal Recovery Curves') },
          { id: 'Notes', label: `${t('client_detail.tab_notes', 'Interdisciplinary Notes')} (${notes.length})` },
        ]}
      />

      {/* TAB 1: PATIENT VITALS & CARE TEAM */}
      {tab === 'Overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 bg-white border border-line space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-line">
              <Activity size={18} className="text-ink-2" aria-hidden />
              <h2 className="font-bold text-[17px] text-ink">{t('client_detail.vitals_title', 'Clinical Profile & Intake Vitals')}</h2>
            </div>

            <dl className="divide-y divide-line/60 text-sm">
              {[
                [t('client_detail.t_full_legal_name', 'Full Legal Name'), c.name],
                [t('client_detail.t_chronological_age', 'Chronological Age'), c.age ? `${c.age} ${t('client_detail.t_years', 'years')}` : '—'],
                [t('client_detail.t_primary_medical_diagnosis', 'Primary Medical Diagnosis'), c.injury || '—'],
                [t('client_detail.t_affected_anatomical_area', 'Affected Anatomical Area'), c.area ? c.area.toUpperCase() : '—'],
                [t('client_detail.t_prescribed_protocol_length', 'Prescribed Protocol Length'), `${c.of} ${t('client_detail.t_weeks_total', 'weeks total')}`],
                [t('client_detail.t_safe_pain_ceiling', 'Safe Pain Ceiling'), `${limit} / 10 ${t('client_detail.t_maximum_tolerance', 'maximum tolerance')}`],
                [t('client_detail.t_mechanical_angle_limiter', 'Mechanical Angle Limiter'), c.area === 'knee' && angle ? `${angle}° ${t('client_detail.t_flexion_cap', 'flexion cap')}` : 'N/A'],
                [t('client_detail.t_email_address', 'Email Address'), c.email],
                [t('client_detail.t_direct_phone', 'Direct Phone'), c.phone || '—'],
              ].map(([k, v]) => (
                <div key={k} className="py-2.5 flex items-center justify-between gap-4">
                  <dt className="text-ink-2 font-medium">{k}</dt>
                  <dd className="font-semibold text-ink text-right rtl:text-left num">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <div className="space-y-4">
            <Card className="p-6 bg-white border border-line">
              <div className="flex items-center gap-2 pb-2 border-b border-line mb-4">
                <Users size={18} className="text-ink-2" aria-hidden />
                <h2 className="font-bold text-[17px] text-ink">{t('client_detail.care_team_title', 'Interdisciplinary Care Team')}</h2>
              </div>

              <ul className="space-y-3">
                {careTeam.map((m: any) => (
                  <li key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-line/60 bg-paper/30">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-ink text-white font-bold text-sm grid place-items-center">
                        {initialsOf(m.name)}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-ink">{m.name}{m.id === me?.id ? (t('client_detail.t_you', ' (You)')) : ''}</p>
                        <p className="text-xs text-ink-2">{TYPE_ROLE[m.type] ?? m.type}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6 bg-sand/30 border border-line">
              <div className="flex items-center gap-2 mb-2">
                <Info size={16} className="text-ink" aria-hidden />
                <h3 className="font-bold text-sm text-ink">{t('client_detail.t_how_your_changes_reach_the_client', 'How your changes reach the client')}</h3>
              </div>
              <p className="text-xs leading-relaxed text-ink/80">
                {t('client_detail.t_publishing_a_protocol_updates_s_plan', 'Publishing a protocol updates {p1}\'s plan straight away and sends them a notification. Notes marked visible to the client appear on their Today page.').replace('{p1}', String(c.name.split(' ')[0]))}
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: EXERCISE PROTOCOL EDITOR */}
      {tab === 'Protocol' && !canEditExercises && (
        <Card className="p-8">
          <EmptyState
            title={t('client_detail.t_meal_plan_editing_is_not_available', 'Meal plan editing is not available here yet')}
            text={t('client_detail.t_the_protocol_editor_currently_supports_exercises', 'The protocol editor currently supports exercises only. You can still leave the client notes from the Notes tab.')}
          />
        </Card>
      )}
      {tab === 'Protocol' && canEditExercises && (
        <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
          <Card className="p-6 bg-white border border-line space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
              <div>
                <h2 className="font-bold text-[18px] text-ink">{t('client_detail.protocols_title', 'Prescribed Exercise Protocols')}</h2>
                <p className="text-xs text-ink-2">{t('client_detail.protocols_sub', 'Control clinical clearance, set volumes, and movement depth')}</p>
              </div>
              <Btn variant="secondary" className="gap-2 shrink-0" onClick={() => setAdd(true)}>
                <Plus size={16} aria-hidden /> {t('client_detail.add_movement', 'Add New Movement')}
              </Btn>
            </div>

            {ex.length === 0 ? (
              <EmptyState title={t('client_detail.t_no_active_exercises_prescribed', 'No active exercises prescribed')} text={t('client_detail.t_add_standard_rehabilitation_movements_to_initiate', 'Add standard rehabilitation movements to initiate client program.')} />
            ) : (
              <ul className="space-y-3">
                {/* A plan is stored day by day, so group the movements under their day. */}
                {[...ex].sort((a, b) => a.day - b.day).map((e, i, arr) => (
                  <Fragment key={e.id}>
                  {(i === 0 || arr[i - 1].day !== e.day) && (
                    <li className="pt-3 text-xs font-bold uppercase tracking-wide text-ink-2" aria-hidden>{DAY_NAMES[e.day - 1] ?? `Day ${e.day}`}</li>
                  )}
                  <li
                    className="p-4 rounded-xl border border-line bg-paper/20 hover:bg-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[15px] text-ink">{e.name}</h3>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            e.cleared ? 'bg-ok-tint text-[#1d6b3d]' : 'bg-warn-tint text-[#7a5200]'
                          }`}
                        >
                          {e.cleared ? <ShieldCheck size={12} aria-hidden /> : <Hourglass size={12} aria-hidden />}
                          {e.cleared ? t('client_detail.cleared', 'Cleared for Load') : t('client_detail.awaiting', 'Held / Awaiting Clearance')}
                        </span>
                      </div>
                      {e.notes && <p className="text-xs text-ink-2 mt-1">{e.notes}</p>}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-ink-2 font-medium">
                          {t('client_detail.sets', 'Sets')}
                          <input
                            type="number"
                            min={1}
                            max={10}
                            className={`${inputCls} !w-16 !h-9 text-xs mt-0.5 num`}
                            value={e.sets}
                            onChange={(ev) => dirty(() => setEx(ex.map((x) => (x.id === e.id ? { ...x, sets: Number(ev.target.value) } : x))))}
                          />
                        </label>
                        <label className="text-xs text-ink-2 font-medium">
                          {t('client_detail.reps', 'Reps')}
                          <input
                            className={`${inputCls} !w-20 !h-9 text-xs mt-0.5 num`}
                            value={e.reps}
                            maxLength={12}
                            onChange={(ev) => dirty(() => setEx(ex.map((x) => (x.id === e.id ? { ...x, reps: ev.target.value } : x))))}
                          />
                        </label>
                      </div>

                      <Btn
                        variant={e.cleared ? 'secondary' : 'primary'}
                        className="!h-9 text-xs px-3"
                        onClick={() => dirty(() => setEx(ex.map((x) => (x.id === e.id ? { ...x, cleared: !x.cleared } : x))))}
                      >
                        {e.cleared ? t('client_detail.pause', 'Pause') : t('client_detail.clear', 'Clear')}
                      </Btn>

                      <button
                        type="button"
                        aria-label={`Remove ${e.name}`}
                        onClick={() => setRm(e)}
                        className="size-9 rounded-lg hover:bg-bad-tint text-bad grid place-items-center transition cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                  </Fragment>
                ))}
              </ul>
            )}
          </Card>

          {/* Clinical Limits Configurator */}
          <Card className="p-6 bg-white border border-line space-y-5 lg:sticky lg:top-24">
            <div className="flex items-center gap-2 pb-2 border-b border-line">
              <Sliders size={18} className="text-ink-2" aria-hidden />
              <h2 className="font-bold text-[17px] text-ink">{t('client_detail.tolerances_title', 'Safety Tolerances & Limits')}</h2>
            </div>

            <div>
              <label className="text-xs font-bold text-ink-2 block mb-2">
                {t('client_detail.pain_threshold', 'Safe Pain Threshold (Out of 10)')}
              </label>
              <Segment
                label="Safe pain limit"
                options={['2', '3', '4', '5']}
                value={limit}
                onChange={(v) => dirty(() => setLimit(v))}
              />
              {Number(limit) > 4 && (
                <p className="mt-2.5 rounded-xl bg-warn-tint p-3 text-xs leading-relaxed text-[#7a5200]">
                  {t('client_detail.t_ceiling_above_4_10_exceeds_clinic', 'Ceiling above 4/10 exceeds clinic default baseline. Document reasoning in Care Notes.')}
                </p>
              )}
            </div>

            {c.area === 'knee' && (
              <Field label={t('client_detail.knee_angle', 'Maximum Knee Flexion Cap (Degrees)')} helper={t('client_detail.knee_angle_sub', 'All squatting & leg pressing must stay within this angle')} error={angleErr}>
                {(p) => (
                  <input
                    {...p}
                    inputMode="numeric"
                    className={`${inputCls} num`}
                    value={angle}
                    onChange={(e) => dirty(() => setAngle(e.target.value.replace(/\D/g, '').slice(0, 3)))}
                  />
                )}
              </Field>
            )}

            <div className="pt-2">
              <Btn className="w-full" onClick={save} disabled={saved || saving}>
                {t('client_detail.publish_changes', 'Publish Protocol Changes')}
              </Btn>

              {toast && (
                <p role="status" className="flex items-start gap-2 text-xs font-semibold text-ok mt-3">
                  <CircleCheck size={16} className="shrink-0 mt-0.5" aria-hidden /> {toast}
                </p>
              )}
              {saveErr && <p role="alert" className="text-xs font-semibold text-bad mt-3">{saveErr}</p>}
              {!saved && (
                <p className="text-xs text-ink-2 text-center mt-2">
                  {t('client_detail.t_unsaved_draft_changes_pending_publication', 'Unsaved draft changes pending publication.')}
                </p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: LONGITUDINAL RECOVERY CURVES */}
      {tab === 'Progress' && (
        <div className="grid gap-6">
          <Card className="p-6 bg-white border border-line">
            <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
              <div>
                <h2 className="font-bold text-[18px] text-ink">{t('client_detail.pain_trajectory', 'Pain Trajectory Over Time (Last 8 Weeks)')}</h2>
                <p className="text-xs text-ink-2">{t('client_detail.t_weekly_patient_reported_symptom_scale_vs', 'Weekly patient-reported symptom scale vs. safe ceiling of {p1}/10').replace('{p1}', String(limit))}</p>
              </div>
              <span className="text-xs font-semibold bg-paper px-3 py-1 rounded-full border border-line">
                {t('client_detail.t_net_change', 'Net Change:')} <strong className={netChange > 0 ? 'text-bad' : 'text-ok'}>{netChange > 0 ? '+' : ''}{netChange} pts</strong>
              </span>
            </div>

            {c.charts.pain.length === 0 ? (
              <p className="text-ink-2 text-sm py-8 text-center">{t('client_detail.t_no_pain_check_ins_logged_yet', 'No pain check-ins logged yet.')}</p>
            ) : <LineChart
              labels={c.charts.painLabels}
              data={c.charts.pain}
              min={0}
              max={10}
              ticks={[0, 2, 4, 6, 8, 10]}
              unit="/10"
              color="#14161A"
              safeBelow={Number(limit)}
              desc={`${c.name} pain trajectory charted over 8 weeks.`}
            />}
          </Card>

          <Card className="p-6 bg-white border border-line">
            <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
              <div>
                <h2 className="font-bold text-[18px] text-ink">{t('client_detail.adherence_title', 'Session Adherence & Workouts Logged')}</h2>
                <p className="text-xs text-ink-2">{t('client_detail.t_weekly_completed_training_sessions_vs_prescribed', 'Weekly completed training sessions vs. prescribed target of {p1}/week').replace('{p1}', String(c.target))}</p>
              </div>
              <span className="text-xs font-semibold bg-ok-tint text-[#1d6b3d] px-3 py-1 rounded-full">
                {t('client_detail.t_compliance', 'Compliance: {p1}%').replace('{p1}', String(c.charts.compliance))}
              </span>
            </div>

            <BarChart labels={L} data={c.charts.workouts} target={c.target} />
          </Card>
        </div>
      )}

      {/* TAB 4: INTERDISCIPLINARY CARE NOTES */}
      {tab === 'Notes' && (
        <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
          <div className="space-y-3">
            {notes.length === 0 ? (
              <Card className="p-8">
                <EmptyState title={t('client_detail.t_no_clinical_notes_recorded', 'No clinical notes recorded')} text={t('client_detail.t_clinical_observations_logged_here_persist_in', 'Clinical observations logged here persist in the permanent client record.')} />
              </Card>
            ) : (
              notes.map((n) => (
                <Card key={n.id} className="p-5 bg-white border border-line space-y-2">
                  <div className="flex items-center justify-between gap-3 text-xs text-ink-2 border-b border-line/60 pb-2">
                    <span className="font-bold text-ink flex items-center gap-1.5">
                      {n.author || 'Clinical Specialist'} · {n.role || 'Care Team'}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        {n.shared ? <Eye size={12} /> : <Lock size={12} />}
                        {n.shared ? (t('client_detail.t_visible_to_client', 'Visible to client')) : (t('client_detail.t_internal_note', 'Internal note'))}
                      </span>
                      <span>·</span>
                      <span>{n.when}</span>
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-ink/90 pt-1">{n.text}</p>
                </Card>
              ))
            )}
          </div>

          <Card className="p-6 bg-white border border-line space-y-4 lg:sticky lg:top-24">
            <h2 className="font-bold text-[17px] text-ink pb-2 border-b border-line">{t('client_detail.log_observation', 'Log Clinical Observation')}</h2>
            <form onSubmit={addNote} noValidate className="space-y-4">
              <Field label={t('client_detail.t_clinical_note_entry', 'Clinical Note Entry')} error={noteErr}>
                {(p) => (
                  <textarea
                    {...p}
                    rows={5}
                    placeholder={t('client_detail.t_document_joint_palpation_findings_rom_improvements', 'Document joint palpation findings, ROM improvements, or load adjustments...')}
                    className={`${inputCls} h-auto py-3 text-sm leading-relaxed`}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                )}
              </Field>

              <label className="flex items-center gap-2.5 text-xs font-semibold text-ink cursor-pointer">
                <input
                  type="checkbox"
                  className="size-4 rounded accent-ink"
                  checked={shared}
                  onChange={(e) => setShared(e.target.checked)}
                />
                {t('client_detail.t_make_this_note_visible_to_the', 'Make this note visible to the client')}
              </label>

              <Btn type="submit" className="w-full">
                {t('client_detail.append_record', 'Append to Clinical Record')}
              </Btn>
            </form>
          </Card>
        </div>
      )}

      {/* Remove Confirmation Dialog */}
      <Dialog open={Boolean(rm)} onClose={() => setRm(null)} title={t('client_detail.t_confirm_protocol_deletion', 'Confirm Protocol Deletion')}>
        <p className="text-sm text-ink-2 leading-relaxed">
          {t('client_detail.t_are_you_sure_you_want_to', 'Are you sure you want to remove {p1} from {p2}\'s active rehabilitation protocol?').replace('{p1}', String(rm?.name)).replace('{p2}', String(c.name.split(' ')[0]))}
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 sm:justify-end">
          <Btn variant="secondary" onClick={() => setRm(null)}>
            {t('client_detail.t_retain_movement', 'Retain Movement')}
          </Btn>
          <Btn
            className="!bg-[#a02a2a] text-white"
            onClick={() => {
              dirty(() => setEx(ex.filter((x) => x.id !== rm!.id)))
              setRm(null)
            }}
          >
            {t('client_detail.t_confirm_removal', 'Confirm Removal')}
          </Btn>
        </div>
      </Dialog>

      {/* Add Movement Dialog */}
      <Dialog open={add} onClose={() => setAdd(false)} title={t('client_detail.t_prescribe_new_exercise_protocol', 'Prescribe New Exercise Protocol')}>
        <form onSubmit={addEx} noValidate className="space-y-4">
          <Field label={t('client_detail.t_movement_name_variation', 'Movement Name & Variation')} error={nerr.name}>
            {(p) => <input {...p} placeholder="e.g. Spanish Squats with Heavy Rig Band" className={inputCls} value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} />}
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t('client_detail.t_target_sets', 'Target Sets')} error={nerr.sets}>
              {(p) => <input {...p} inputMode="numeric" className={`${inputCls} num`} value={nf.sets} onChange={(e) => setNf({ ...nf, sets: e.target.value })} />}
            </Field>
            <Field label={t('client_detail.t_target_repetitions', 'Target Repetitions')} error={nerr.reps}>
              {(p) => <input {...p} inputMode="numeric" className={`${inputCls} num`} value={nf.reps} onChange={(e) => setNf({ ...nf, reps: e.target.value })} />}
            </Field>
          </div>

          <Field label={t('client_detail.t_day_of_the_week', 'Day of the week')}>
            {(p) => (
              <select {...p} className={inputCls} value={nf.day} onChange={(e) => setNf({ ...nf, day: e.target.value })}>
                {DAY_NAMES.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
              </select>
            )}
          </Field>

          <Field label={t('client_detail.t_clinical_instructions_form_cues', 'Clinical Instructions & Form Cues')}>
            {(p) => <input {...p} placeholder="e.g. 45-second isometric hold, shin vertical" className={inputCls} value={nf.notes} onChange={(e) => setNf({ ...nf, notes: e.target.value })} />}
          </Field>

          <p className="text-xs text-ink-2 bg-sand/30 p-3 rounded-xl">
            {t('client_detail.t_newly_added_movements_are_initialized_as', 'Newly added movements are initialized as "Waiting for PT" until explicitly cleared by the presiding therapist.')}
          </p>

          <div className="flex gap-3 justify-end pt-2">
            <Btn type="button" variant="secondary" onClick={() => setAdd(false)}>
              {t('client_detail.t_cancel', 'Cancel')}
            </Btn>
            <Btn type="submit">{t('client_detail.t_prescribe_exercise', 'Prescribe Exercise')}</Btn>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
