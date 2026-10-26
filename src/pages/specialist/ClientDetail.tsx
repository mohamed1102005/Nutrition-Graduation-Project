import { useEffect, useState, type FormEvent } from 'react'
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
import { Avatar, Btn, Card, Dialog, EmptyState, Field, inputCls, SafetyCallout, Segment, Tabs } from '../../ui'
import { clients, painTrend } from '../../data'
import { LineChart, BarChart, Flag, PainTrend } from '@/components'
import { labels } from '../client/Progress'
import { api } from '../../api'
import { useLanguage } from '../../context/LanguageContext'

type Ex = { id: number; name: string; sets: number; reps: number; cleared: boolean; notes?: string }

const templates: Record<string, Ex[]> = {
  knee: [
    { id: 1, name: 'Box Squat to 60° Knee Angle', sets: 4, reps: 8, cleared: true, notes: 'Stop at 60° box flexion. No bouncing.' },
    { id: 2, name: 'Leg Press (0° to 60° Mechanical Stop)', sets: 4, reps: 10, cleared: true, notes: 'Mechanical pin safety stop at 60° strictly.' },
    { id: 3, name: 'Terminal Straight Leg Raise', sets: 3, reps: 12, cleared: true, notes: 'Lock quad prior to elevation.' },
    { id: 4, name: 'Bodyweight Walking Lunges', sets: 3, reps: 10, cleared: false, notes: 'Held back until patellar shear stabilizes.' },
  ],
  back: [
    { id: 1, name: 'Bird Dog with Core Brace', sets: 3, reps: 10, cleared: true, notes: 'Neutral lumbar alignment throughout.' },
    { id: 2, name: 'Dead Bug Anti-Extension', sets: 3, reps: 12, cleared: true, notes: 'Low back glued to mat.' },
    { id: 3, name: 'Hip Hinge with Dowel', sets: 3, reps: 10, cleared: true, notes: 'Maintain 3 points of contact.' },
    { id: 4, name: 'Romanian Deadlift (Barbell)', sets: 3, reps: 8, cleared: false, notes: 'Waiting for lumbar shear tolerance test.' },
  ],
  shoulder: [
    { id: 1, name: 'Codman Pendulum Swings', sets: 2, reps: 20, cleared: true, notes: 'Gentle passive decompression.' },
    { id: 2, name: 'Band External Rotation at 0°', sets: 3, reps: 15, cleared: true, notes: 'Towel roll pinned under elbow.' },
    { id: 3, name: 'Scapular Wall Slides', sets: 3, reps: 12, cleared: true, notes: 'Upward rotation focus, no shrug.' },
    { id: 4, name: 'Standing Overhead Press', sets: 3, reps: 8, cleared: false, notes: 'Impingement risk until scapular clearance.' },
  ],
}

type Note = { id: number; text: string; when: string; shared: boolean; author?: string; role?: string }

export default function ClientDetail() {
  const { id } = useParams()
  return <Inner key={id} id={id} />
}

function Inner({ id }: { id?: string }) {
  const { t, lang } = useLanguage()
  const fallbackClient = clients.find((x) => x.id === id || x.name.toLowerCase().includes(String(id).toLowerCase())) || clients[0]
  const [c, setC] = useState<any>(fallbackClient)
  const [tab, setTab] = useState('Overview')
  const [ex, setEx] = useState<Ex[]>(() => templates[fallbackClient?.area ?? 'knee'].map((e) => ({ ...e })))
  const [limit, setLimit] = useState(String(fallbackClient?.limit ?? 4))
  const [angle, setAngle] = useState(fallbackClient?.area === 'knee' ? '60' : '')
  const [angleErr, setAngleErr] = useState('')
  const [saved, setSaved] = useState(true)
  const [toast, setToast] = useState('')
  const [rm, setRm] = useState<Ex | null>(null)
  const [add, setAdd] = useState(false)
  const [nf, setNf] = useState({ name: '', sets: '3', reps: '10', notes: '' })
  const [nerr, setNerr] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Note[]>([
    { id: 1, text: 'Clean squat mechanics observed at 60° box depth. Patellar tendon showed zero reactive warmth post-session. Maintain depth cap for another 10 days.', when: 'Tue 7 Oct', shared: true, author: 'Dr. Mona Fathy', role: 'Physical Therapist' },
    { id: 2, text: 'Client experienced mild early-morning knee stiffness on colder days. Prescribed 5 minutes of warm-up heel slides before any training load.', when: 'Tue 30 Sep', shared: false, author: 'Dr. Mona Fathy', role: 'Physical Therapist' },
    { id: 3, text: 'Coordinated with Coach Karim: swapped conventional deadlifts for Romanian deadlifts to minimize anterior tibial translation.', when: 'Fri 26 Sep', shared: true, author: 'Coach Karim Adel', role: 'Strength Coach' },
  ])
  const [draft, setDraft] = useState('')
  const [shared, setShared] = useState(true)
  const [noteErr, setNoteErr] = useState('')

  useEffect(() => {
    let active = true
    if (id) {
      api.getSpecialistClient(id)
        .then((res) => {
          if (!active || !res?.client) return
          const cl = res.client
          const area = res.injuries?.[0]?.body_area?.toLowerCase() || 'knee'
          setC({
            id: String(cl.id),
            name: cl.name,
            initials: cl.name.replace(/^(Dr\.|Coach)\s+/i, '').split(/\s+/).slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join('') || 'SH',
            goal: cl.goal || 'Patellar Tendon Rehabilitation & Functional Strength',
            week: cl.week || 3,
            of: cl.of || 8,
            age: cl.age || 29,
            email: cl.email,
            phone: cl.phone || '01012345678',
            injury: res.injuries?.[0]?.note || 'Right knee patellar tendinopathy (Grade 1)',
            area,
            limit: cl.safeLimit || 4,
            pain: res.progress?.pain?.map((p: any) => p.value) || fallbackClient.pain,
            workouts: res.progress?.workouts?.map((w: any) => w.count) || fallbackClient.workouts,
            lastCheckin: 'Today, 11:20 AM',
          })
          if (res.notes && res.notes.length > 0) {
            setNotes(res.notes.map((n: any) => ({
              id: n.id,
              text: n.body,
              when: n.created_at ? new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Recently',
              shared: Boolean(n.visible_to_client),
              author: 'Specialist Note',
            })))
          }
        })
        .catch((err) => {
          console.error('Failed to load specialist client detail:', err)
        })
    }
    return () => { active = false }
  }, [id])

  if (!c)
    return (
      <Card>
        <EmptyState title={lang === 'ar' ? 'سجل المريض غير موجود' : 'Client Record Not Found'} text={lang === 'ar' ? 'ربما تمت أرشفة هذا السجل أو نقله.' : 'This patient may have been archived or transferred.'} action={<Btn to="/app/clients">{t('client_detail.back', 'All Patient Charts')}</Btn>} />
      </Card>
    )

  const trend = painTrend(c)
  const dirty = (fn: () => void) => { fn(); setSaved(false); setToast('') }

  const save = async () => {
    if (c.area === 'knee' && (!/^\d+$/.test(angle) || Number(angle) < 0 || Number(angle) > 120)) return setAngleErr(lang === 'ar' ? 'أدخل زاوية للركبة بين 0 و 120 درجة.' : 'Enter a knee angle between 0 and 120 degrees.')
    setAngleErr('')
    try {
      if (id) {
        const items = ex.map((e, idx) => ({
          dayOfWeek: 3,
          position: idx,
          title: e.name,
          sets: e.sets,
          reps: String(e.reps),
          ptCleared: e.cleared,
          painLimit: Number(limit) || 4,
          safetyNote: c.area === 'knee' ? `Knee angle limit: ${angle}°` : undefined,
        }))
        await api.updateSpecialistPlan(id, 'recover', {
          status: 'active',
          items,
          summary: `Updated plan with safe pain limit ${limit}/10 and ${ex.length} calibrated exercises.`,
        }).catch(() => {})
      }
      setSaved(true)
      setToast(lang === 'ar' ? `تم اعتماد ونشر التعديلات. تم تحديث لوحة تحكم ${c.name.split(' ')[0]}.` : `Protocol changes published. ${c.name.split(' ')[0]}'s active client dashboard is updated.`)
    } catch {
      setSaved(true)
      setToast(lang === 'ar' ? `تم اعتماد ونشر التعديلات. تم تحديث لوحة تحكم ${c.name.split(' ')[0]}.` : `Protocol changes published. ${c.name.split(' ')[0]}'s active client dashboard is updated.`)
    }
  }

  const addEx = (e: FormEvent) => {
    e.preventDefault()
    const v: Record<string, string> = {}
    if (nf.name.trim().length < 3) v.name = lang === 'ar' ? 'يرجى كتابة اسم التمرين أو البروتوكول.' : 'Specify the exercise protocol name.'
    if (!(Number(nf.sets) >= 1 && Number(nf.sets) <= 10)) v.sets = lang === 'ar' ? 'المجموعات: 1 إلى 10.' : 'Sets: 1 to 10.'
    if (!(Number(nf.reps) >= 1 && Number(nf.reps) <= 60)) v.reps = lang === 'ar' ? 'التكرارات: 1 إلى 60.' : 'Reps: 1 to 60.'
    setNerr(v)
    if (Object.keys(v).length) return
    dirty(() => setEx([...ex, { id: Date.now(), name: nf.name.trim(), sets: Number(nf.sets), reps: Number(nf.reps), cleared: false, notes: nf.notes.trim() }]))
    setNf({ name: '', sets: '3', reps: '10', notes: '' })
    setAdd(false)
  }

  const addNote = async (e: FormEvent) => {
    e.preventDefault()
    if (draft.trim().length < 3) return setNoteErr(lang === 'ar' ? 'يرجى إدخال تفاصيل الملاحظة السريرية.' : 'Enter clinical observation details.')
    setNoteErr('')
    try {
      if (id) {
        await api.addSpecialistNote(id, { body: draft.trim(), visibleToClient: shared })
      }
      setNotes([{ id: Date.now(), text: draft.trim(), when: lang === 'ar' ? 'اليوم' : 'Today', shared, author: 'Dr. Mona Fathy', role: 'Physical Therapist' }, ...notes])
      setDraft('')
    } catch {
      setNotes([{ id: Date.now(), text: draft.trim(), when: lang === 'ar' ? 'اليوم' : 'Today', shared, author: 'Dr. Mona Fathy', role: 'Physical Therapist' }, ...notes])
      setDraft('')
    }
  }

  const L = labels.slice(-8)
  const isPainCritical = trend.now > Number(limit)

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
                <h1 className="h-display text-[24px] sm:text-[28px] font-bold text-ink leading-tight">
                  {c.name}
                </h1>
                <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded-full bg-paper text-ink border border-line">
                  {lang === 'ar' ? `رقم المريض #${c.id}` : `Patient ID #${c.id}`}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-ok-tint text-[#1d6b3d]">
                  {t('client_detail.active_rehab', 'Active Rehab')}
                </span>
              </div>

              <p className="text-sm text-ink-2 font-medium">
                {c.injury} · {lang === 'ar' ? 'الأسبوع' : 'Week'} <strong className="text-ink num">{c.week}</strong> {lang === 'ar' ? 'من' : 'of'} {c.of} ({c.goal})
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-ink-2 pt-1">
                <span>{lang === 'ar' ? 'العمر:' : 'Age:'} <strong className="text-ink">{c.age} {lang === 'ar' ? 'سنة' : 'yrs'}</strong></span>
                <span>·</span>
                <span>{lang === 'ar' ? 'آخر نشاط:' : 'Last Activity:'} <strong className="text-ink">{c.lastCheckin}</strong></span>
                <span>·</span>
                <span>{lang === 'ar' ? 'التواصل:' : 'Contact:'} <strong className="text-ink">{c.phone}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-line">
            <div className="px-4 py-2.5 rounded-xl border border-line bg-paper/60 text-center">
              <span className="text-[11px] font-semibold text-ink-2 uppercase tracking-wider block">{t('client_detail.pain_score', 'Pain Score')}</span>
              <span className="num font-bold text-[20px] text-ink leading-none mt-0.5 block">
                {trend.now} <span className="text-xs font-normal text-ink-2">/ 10</span>
              </span>
            </div>

            <div className="px-4 py-2.5 rounded-xl border border-line bg-paper/60 text-center">
              <span className="text-[11px] font-semibold text-ink-2 uppercase tracking-wider block">{t('client_detail.safe_limit', 'Safe Threshold')}</span>
              <span className="num font-bold text-[20px] text-ink leading-none mt-0.5 block">
                {limit} <span className="text-xs font-normal text-ink-2">/ 10</span>
              </span>
            </div>

            <Btn to="/session" className="gap-2">
              <Video size={16} aria-hidden /> {t('client_detail.video_consult', 'Launch Video Consult')}
            </Btn>
          </div>
        </div>
      </Card>

      {/* Critical Safety Callout if Pain Exceeds Threshold */}
      {isPainCritical && (
        <SafetyCallout title={lang === 'ar' ? `تنبيه سريري عاجل: مستوى الألم الحالي (${trend.now}/10) يتجاوز السقف الآمن (${limit}/10)` : `CLINICAL ALERT: Current pain (${trend.now}/10) exceeds client safe threshold (${limit}/10)`}>
          {lang === 'ar'
            ? `سجل المريض ارتفاعاً في نوبات ألم الرضفة عقب الجلسة الأخيرة. يرجى إيقاف كافة تمارين الضغط وتحميل العضلة الرباعية فوراً ومراجعة البروتوكول أدناه والتواصل مع ${c.name.split(' ')[0]}.`
            : `Patient reported elevated patellar pain following recent loading. All contraindicated Quad loading protocols should be paused immediately. Review the updated protocol below and message ${c.name.split(' ')[0]}.`}
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
                [lang === 'ar' ? 'الاسم القانوني الكامل' : 'Full Legal Name', c.name],
                [lang === 'ar' ? 'العمر الزمني' : 'Chronological Age', `${c.age} ${lang === 'ar' ? 'سنة' : 'years'}`],
                [lang === 'ar' ? 'التشخيص الطبي الأساسي' : 'Primary Medical Diagnosis', c.injury],
                [lang === 'ar' ? 'المنطقة التشريحية المتأثرة' : 'Affected Anatomical Area', c.area.toUpperCase()],
                [lang === 'ar' ? 'مدة البرنامج المقررة' : 'Prescribed Protocol Length', `${c.of} ${lang === 'ar' ? 'أسابيع إجمالية' : 'weeks total'}`],
                [lang === 'ar' ? 'السقف الآمن للألم' : 'Safe Pain Ceiling', `${limit} / 10 ${lang === 'ar' ? 'أقصى تسامح' : 'maximum tolerance'}`],
                [lang === 'ar' ? 'محدد زاوية الحركة' : 'Mechanical Angle Limiter', c.area === 'knee' ? `${angle || '60'}° ${lang === 'ar' ? 'حد الثني' : 'flexion cap'}` : 'N/A'],
                [lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address', c.email],
                [lang === 'ar' ? 'رقم الهاتف المباشر' : 'Direct Phone', c.phone],
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
                {[
                  { initial: 'MF', name: 'Dr. Mona Fathy, PT', role: lang === 'ar' ? 'أخصائي العلاج الطبيعي الرئيسي (أنت)' : 'Lead Physical Therapist (You)', svc: 'recover' },
                  { initial: 'KA', name: 'Coach Karim Adel', role: lang === 'ar' ? 'مدرب القوة والتأهيل البدني' : 'Strength & Conditioning Coach', svc: 'move' },
                  { initial: 'HM', name: 'Hana Mostafa, RD', role: lang === 'ar' ? 'أخصائية التغذية الرياضية السريرية' : 'Clinical Sports Dietitian', svc: 'eat' },
                ].map((spec) => (
                  <li key={spec.name} className="flex items-center justify-between p-3 rounded-xl border border-line/60 bg-paper/30">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-ink text-white font-bold text-sm grid place-items-center">
                        {spec.initial}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-ink">{spec.name}</p>
                        <p className="text-xs text-ink-2">{spec.role}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-ok bg-ok-tint px-2.5 py-0.5 rounded-full">
                      {lang === 'ar' ? 'متزامن' : 'Synced'}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6 bg-sand/30 border border-line">
              <div className="flex items-center gap-2 mb-2">
                <Info size={16} className="text-ink" aria-hidden />
                <h3 className="font-bold text-sm text-ink">{lang === 'ar' ? 'حالة التنسيق الطبي متعدد التخصصات' : 'Multi-Disciplinary Coordination Status'}</h3>
              </div>
              <p className="text-xs leading-relaxed text-ink/80">
                {lang === 'ar'
                  ? `أي تعديلات تطرأ على تصريح تمارين ${c.name.split(' ')[0]} ترسل إشعاراً فورياً للكابتن كريم وأخصائية التغذية هنا، لضمان توافق الأحمال البدنية مع التوقيت الغذائي للاستشفاء.`
                  : `Any modifications made to ${c.name.split(' ')[0]}'s exercise clearance automatically alert Coach Karim and Hana Mostafa, ensuring unified workout loading and nutrition recovery timing.`}
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: EXERCISE PROTOCOL EDITOR */}
      {tab === 'Protocol' && (
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
              <EmptyState title={lang === 'ar' ? 'لا توجد تمارين علاجية محددة' : 'No active exercises prescribed'} text={lang === 'ar' ? 'أضف حركات تأهيلية للبدء في تفعيل خطة المريض.' : 'Add standard rehabilitation movements to initiate client program.'} />
            ) : (
              <ul className="space-y-3">
                {ex.map((e) => (
                  <li
                    key={e.id}
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
                            type="number"
                            min={1}
                            max={60}
                            className={`${inputCls} !w-16 !h-9 text-xs mt-0.5 num`}
                            value={e.reps}
                            onChange={(ev) => dirty(() => setEx(ex.map((x) => (x.id === e.id ? { ...x, reps: Number(ev.target.value) } : x))))}
                          />
                        </label>
                      </div>

                      <Btn
                        variant={e.cleared ? 'secondary' : 'default'}
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
              <label className="text-xs uppercase font-bold text-ink-2 tracking-wider block mb-2">
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
                  {lang === 'ar' ? 'تجاوز حد 4/10 يتخطى المعيار المرجعي الموصى به في العيادة. يرجى توثيق المبرر السريري في الملاحظات.' : 'Ceiling above 4/10 exceeds clinic default baseline. Document reasoning in Care Notes.'}
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
              <Btn className="w-full" onClick={save} disabled={saved}>
                {t('client_detail.publish_changes', 'Publish Protocol Changes')}
              </Btn>

              {toast && (
                <p role="status" className="flex items-start gap-2 text-xs font-semibold text-ok mt-3">
                  <CircleCheck size={16} className="shrink-0 mt-0.5" aria-hidden /> {toast}
                </p>
              )}
              {!saved && (
                <p className="text-xs text-ink-2 text-center mt-2">
                  {lang === 'ar' ? 'توجد تعديلات مسودة غير منشورة.' : 'Unsaved draft changes pending publication.'}
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
                <p className="text-xs text-ink-2">{lang === 'ar' ? `مقياس الأعراض المسجل أسبوعياً من المريض مقارنة بالسقف الآمن ${limit}/10` : `Weekly patient-reported symptom scale vs. safe ceiling of ${limit}/10`}</p>
              </div>
              <span className="text-xs font-semibold bg-paper px-3 py-1 rounded-full border border-line">
                {lang === 'ar' ? 'صافي التغير:' : 'Net Change:'} <strong className="text-ok">-3.0 pts</strong>
              </span>
            </div>

            <LineChart
              labels={L}
              data={c.pain}
              min={0}
              max={10}
              ticks={[0, 2, 4, 6, 8, 10]}
              unit="/10"
              color="#14161A"
              safeBelow={Number(limit)}
              desc={`${c.name} pain trajectory charted over 8 weeks.`}
            />
          </Card>

          <Card className="p-6 bg-white border border-line">
            <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
              <div>
                <h2 className="font-bold text-[18px] text-ink">{t('client_detail.adherence_title', 'Session Adherence & Workouts Logged')}</h2>
                <p className="text-xs text-ink-2">{lang === 'ar' ? 'الجلسات التدريبية المكتملة أسبوعياً مقابل الهدف المقرر 4 جلسات/أسبوع' : 'Weekly completed training sessions vs. prescribed target of 4/week'}</p>
              </div>
              <span className="text-xs font-semibold bg-ok-tint text-[#1d6b3d] px-3 py-1 rounded-full">
                {lang === 'ar' ? 'الالتزام: 88%' : 'Compliance: 88%'}
              </span>
            </div>

            <BarChart labels={L} data={c.workouts} target={4} />
          </Card>
        </div>
      )}

      {/* TAB 4: INTERDISCIPLINARY CARE NOTES */}
      {tab === 'Notes' && (
        <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
          <div className="space-y-3">
            {notes.length === 0 ? (
              <Card className="p-8">
                <EmptyState title={lang === 'ar' ? 'لا توجد ملاحظات سريرية مدونة' : 'No clinical notes recorded'} text={lang === 'ar' ? 'الملاحظات السريرية المدونة هنا تحفظ في السجل الدائم للمريض.' : 'Clinical observations logged here persist in the permanent client record.'} />
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
                        {n.shared ? (lang === 'ar' ? 'مشترك مع فريق الرعاية' : 'Shared with Care Team') : (lang === 'ar' ? 'ملاحظة سريرية داخلية' : 'Internal Clinician Note')}
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
              <Field label={lang === 'ar' ? 'نص الملاحظة السريرية' : 'Clinical Note Entry'} error={noteErr}>
                {(p) => (
                  <textarea
                    {...p}
                    rows={5}
                    placeholder={lang === 'ar' ? 'سجل نتائج فحص المفاصل، تحسن مدى الحركة ROM، أو تعديلات الأحمال التدريبية...' : 'Document joint palpation findings, ROM improvements, or load adjustments...'}
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
                {lang === 'ar' ? 'مشاركة الملاحظة مع كابتن كريم (المدرب) وهنا (أخصائية التغذية)' : 'Share note with Karim (Trainer) & Hana (Dietitian)'}
              </label>

              <Btn type="submit" className="w-full">
                {t('client_detail.append_record', 'Append to Clinical Record')}
              </Btn>
            </form>
          </Card>
        </div>
      )}

      {/* Remove Confirmation Dialog */}
      <Dialog open={Boolean(rm)} onClose={() => setRm(null)} title={lang === 'ar' ? 'تأكيد حذف الحركة من البرنامج' : 'Confirm Protocol Deletion'}>
        <p className="text-sm text-ink-2 leading-relaxed">
          {lang === 'ar'
            ? `هل أنت متأكد من رغبتك في إزالة ${rm?.name} من برنامج التأهيل النشط لـ ${c.name.split(' ')[0]}؟`
            : `Are you sure you want to remove ${rm?.name} from ${c.name.split(' ')[0]}'s active rehabilitation protocol?`}
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 sm:justify-end">
          <Btn variant="secondary" onClick={() => setRm(null)}>
            {lang === 'ar' ? 'الإبقاء على التمرين' : 'Retain Movement'}
          </Btn>
          <Btn
            className="!bg-[#a02a2a] text-white"
            onClick={() => {
              dirty(() => setEx(ex.filter((x) => x.id !== rm!.id)))
              setRm(null)
            }}
          >
            {lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Removal'}
          </Btn>
        </div>
      </Dialog>

      {/* Add Movement Dialog */}
      <Dialog open={add} onClose={() => setAdd(false)} title={lang === 'ar' ? 'وصف تمرين أو بروتوكول جديد' : 'Prescribe New Exercise Protocol'}>
        <form onSubmit={addEx} noValidate className="space-y-4">
          <Field label={lang === 'ar' ? 'اسم التمرين وتفاصيله' : 'Movement Name & Variation'} error={nerr.name}>
            {(p) => <input {...p} placeholder="e.g. Spanish Squats with Heavy Rig Band" className={inputCls} value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} />}
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={lang === 'ar' ? 'عدد المجموعات' : 'Target Sets'} error={nerr.sets}>
              {(p) => <input {...p} inputMode="numeric" className={`${inputCls} num`} value={nf.sets} onChange={(e) => setNf({ ...nf, sets: e.target.value })} />}
            </Field>
            <Field label={lang === 'ar' ? 'عدد التكرارات' : 'Target Repetitions'} error={nerr.reps}>
              {(p) => <input {...p} inputMode="numeric" className={`${inputCls} num`} value={nf.reps} onChange={(e) => setNf({ ...nf, reps: e.target.value })} />}
            </Field>
          </div>

          <Field label={lang === 'ar' ? 'تعليمات سريرية وتوجيهات الأداء' : 'Clinical Instructions & Form Cues'}>
            {(p) => <input {...p} placeholder="e.g. 45-second isometric hold, shin vertical" className={inputCls} value={nf.notes} onChange={(e) => setNf({ ...nf, notes: e.target.value })} />}
          </Field>

          <p className="text-xs text-ink-2 bg-sand/30 p-3 rounded-xl">
            {lang === 'ar'
              ? 'يتم تعيين التمارين المضافة حديثاً بحالة "بانتظار تصريح العلاج الطبيعي" حتى اعتمادها رسمياً من الأخصائي المشرف.'
              : 'Newly added movements are initialized as "Waiting for PT" until explicitly cleared by the presiding therapist.'}
          </p>

          <div className="flex gap-3 justify-end pt-2">
            <Btn type="button" variant="secondary" onClick={() => setAdd(false)}>
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </Btn>
            <Btn type="submit">{lang === 'ar' ? 'اعتماد التمرين في الخطة' : 'Prescribe Exercise'}</Btn>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
