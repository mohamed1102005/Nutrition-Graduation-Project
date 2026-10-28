import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Check,
  Flame,
  Play,
  Video,
  CalendarClock,
  Dumbbell,
  Quote,
  Activity,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  UserCheck,
} from 'lucide-react'
import { Avatar, Btn, Card, Dialog, PainChip, Skeleton, SVC } from '../../ui'
import type { Svc } from '../../data'
import { api, getStoredUser } from '../../api'
import { useLanguage } from '../../context/LanguageContext'

const fallbackPlan: { id: string; svc: Svc; time: string; title: string; meta: string; action: string }[] = [
  { id: 'a', svc: 'eat', time: '2:00 PM', title: 'Lunch: Grilled chicken with rice', meta: '620 kcal · 42 g protein', action: 'Swap meal' },
  { id: 'b', svc: 'move', time: '6:00 PM', title: 'Lower body, knee-safe progression', meta: '45 min · 5 exercises', action: 'Preview routine' },
  { id: 'c', svc: 'recover', time: '9:00 PM', title: 'Knee mobility & joint decompression', meta: '10 min · 3 exercises', action: 'Watch demo' },
]

function formatTime12(t: string) {
  if (!t) return '12:00 PM'
  if (t.includes('AM') || t.includes('PM')) return t
  const [h, m] = t.split(':').map(Number)
  if (isNaN(h)) return t
  const hr = h % 12 || 12
  const ampm = h < 12 ? 'AM' : 'PM'
  return `${hr}:${String(m || 0).padStart(2, '0')} ${ampm}`
}

function getActionLabel(svc: Svc) {
  if (svc === 'eat') return 'Swap meal'
  if (svc === 'move') return 'Preview'
  return 'Watch demo'
}

export default function ClientToday() {
  const { t, isRtl } = useLanguage()
  const nav = useNavigate()
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState(() => getStoredUser()?.name || '')
  const [dashboard, setDashboard] = useState<any>(null)
  const [done, setDone] = useState<string[]>([])
  const [pain, setPain] = useState(3)
  const [draft, setDraft] = useState(3)
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    let active = true
    api.getTodayDashboard()
      .then((data) => {
        if (!active) return
        setDashboard(data)
        if (data.user?.name) setUserName(data.user.name)
        if (data.summary?.latestPain !== undefined && data.summary.latestPain !== null) {
          setPain(data.summary.latestPain)
          setDraft(data.summary.latestPain)
        }
        if (Array.isArray(data.plan)) {
          const completedIds = data.plan
            .filter((p: any) => p.status === 'done')
            .map((p: any) => String(p.itemId))
          setDone(completedIds)
        }
      })
      .catch((err) => {
        console.error('Failed to load today dashboard:', err)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  const toggleItem = async (itemId: string | number) => {
    const sId = String(itemId)
    const isDone = done.includes(sId)
    const nextStatus = isDone ? 'pending' : 'done'

    // Optimistic update
    setDone((prev) => (isDone ? prev.filter((x) => x !== sId) : [...prev, sId]))

    const numId = Number(itemId)
    if (!isNaN(numId)) {
      try {
        const todayStr = dashboard?.date || new Date().toISOString().slice(0, 10)
        await api.setCompletion(numId, todayStr, nextStatus)
      } catch (err) {
        console.error('Failed to update completion status:', err)
        // Revert on failure
        setDone((prev) => (isDone ? [...prev, sId] : prev.filter((x) => x !== sId)))
      }
    }
  }

  const saveCheckin = async () => {
    try {
      const todayStr = dashboard?.date || new Date().toISOString().slice(0, 10)
      await api.logProgress({ painLevel: draft, date: todayStr })
      setPain(draft)
      setOpen(false)
      setToast('Check-in saved. Dr. Mona & Coach Karim have been notified.')
      setTimeout(() => setToast(''), 4500)
    } catch (err: any) {
      console.error('Failed to log checkin:', err)
      alert(err.message || 'Failed to save check-in')
    }
  }

  const workoutsThisWeek = dashboard?.summary?.workoutsThisWeek ?? 3
  const workoutsTarget = dashboard?.summary?.workoutsTarget ?? 4
  const streak = dashboard?.summary?.streakDays ?? 5
  const currentWeek = dashboard?.weekOfProgram?.current ?? 3
  const totalWeeks = dashboard?.weekOfProgram?.total ?? 8

  // Format today's plan items
  const items = (dashboard?.plan && dashboard.plan.length > 0)
    ? dashboard.plan.map((p: any) => ({
        id: String(p.itemId),
        svc: (p.service as Svc) || 'move',
        time: formatTime12(p.time),
        title: p.title,
        meta: p.meta,
        action: getActionLabel((p.service as Svc) || 'move'),
      }))
    : fallbackPlan

  // Next session info
  const nextSession = dashboard?.nextSession
  const sessionName = nextSession?.specialist?.name || 'Dr. Mona Fathy, PT'
  const sessionSvc: Svc = nextSession?.specialist?.type === 'trainer' ? 'move' : nextSession?.specialist?.type === 'nutritionist' ? 'eat' : 'recover'
  const sessionInitials = sessionName.replace(/^(Dr\.|Coach)\s+/i, '').split(/\s+/).slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join('') || 'MF'
  const sessionWhen = nextSession?.startsAt
    ? `${new Date(nextSession.startsAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · ${new Date(nextSession.startsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
    : 'Thu 16 Oct · 6:30 PM'
  const rescheduleUrl = nextSession
    ? `/app/specialists/${nextSession.specialist.id}/book?reschedule=${nextSession.bookingId}`
    : '/app/specialists/mona/book?reschedule=1'

  // Latest specialist note
  const latestNote = dashboard?.latestNote
  const noteFrom = latestNote?.from || 'Dr. Mona Fathy, PT'
  const noteBody = latestNote?.body || "Good news on the knee. Keep box squats at 60 degrees one more week, then we test a little deeper on Thursday. If today's pain climbs above 4, skip the squats and do the mobility only."
  const noteDate = latestNote?.createdAt
    ? `Sent ${new Date(latestNote.createdAt).toLocaleDateString('en-GB', { weekday: 'long', hour: 'numeric', minute: '2-digit', hour12: true })}`
    : 'Monday, 9:12 PM'

  const completedCount = items.filter((p: any) => done.includes(p.id)).length

  return (
    <div>
      {/* Top Header & Immediate Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sand text-ink text-[12px] font-bold">
              {t('plan.week_of', 'Week {cur} of {total}').replace('{cur}', String(currentWeek)).replace('{total}', String(totalWeeks))}
            </span>
            <span>·</span>
            <span>{t('today.active_protocol', 'Active Care Protocol')}</span>
          </div>
          <h2 className="h-display text-[28px] sm:text-[32px] tracking-tight text-ink">
            {t('today.badge', 'Today')} · {t('today.title', "Today's Health & Training Dashboard")}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Btn
            variant="secondary"
            onClick={() => { setDraft(pain); setOpen(true) }}
            className="min-h-11 px-4 text-[14px]"
          >
            <Activity size={17} className="text-recover" aria-hidden /> {t('progress.log_vitals', 'Log check-in')}
          </Btn>
          <Btn
            onClick={() => nav('/session')}
            className="min-h-11 px-5 text-[14px]"
          >
            <Play size={16} fill="currentColor" aria-hidden /> {t('today.start_session', "Start today's workout")}
          </Btn>
        </div>
      </div>

      {/* Status Toast */}
      {toast && (
        <div role="status" className="mb-6 rounded-2xl bg-ok-tint text-ok font-semibold px-4 py-3 flex gap-2.5 items-center border border-ok/20">
          <Check size={18} aria-hidden />
          <span>{toast}</span>
        </div>
      )}

      {/* Unified Metrics Row (Clean, Neutral Flat Surface, Color on Data Only) */}
      <Card className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-line mb-8">
        {/* Metric 1: Workouts This Week */}
        <div className="p-6">
          <div className="flex items-center justify-between text-ink-2 text-[13px] font-semibold uppercase tracking-wider">
            <span>{t('today.metric_workouts_title', 'Workouts this week')}</span>
            <Dumbbell size={16} className="text-move" aria-hidden />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="num text-[44px] font-bold text-ink leading-none">{workoutsThisWeek}</span>
            <span className="text-[20px] font-semibold text-ink-2">/ {workoutsTarget}</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 mt-3.5" aria-label={`${workoutsThisWeek} of ${workoutsTarget} workouts completed`}>
            {Array.from({ length: workoutsTarget }).map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-colors ${
                  i < workoutsThisWeek ? 'bg-move' : 'bg-line'
                }`}
              />
            ))}
          </div>
          <p className="text-[13px] text-ink-2 mt-2.5">
            {workoutsTarget - workoutsThisWeek > 0
              ? `${workoutsTarget - workoutsThisWeek} ${t('today.metric_workouts_remaining', 'session remaining before Sunday.')}`
              : t('today.metric_target_achieved', 'Weekly target achieved! Outstanding adherence.')}
          </p>
        </div>

        {/* Metric 2: Consistency Streak */}
        <div className="p-6">
          <div className="flex items-center justify-between text-ink-2 text-[13px] font-semibold uppercase tracking-wider">
            <span>{t('today.metric_streak_title', 'Daily habit streak')}</span>
            <Flame size={16} className="text-warn" aria-hidden />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="num text-[44px] font-bold text-ink leading-none">{streak}</span>
            <span className="text-[16px] font-semibold text-ink-2">{t('today.metric_days_active', 'days active')}</span>
          </div>
          <div className="mt-3.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-warn-tint text-warn text-[12px] font-bold">
              <Flame size={12} aria-hidden /> {t('today.metric_streak_active', 'Streak Active')}
            </span>
            <span className="text-[13px] text-ink-2 font-medium">{t('today.metric_best', 'Best:')} {Math.max(streak, 9)} {t('common.days', 'days')}</span>
          </div>
          <p className="text-[13px] text-ink-2 mt-2.5">
            {t('today.metric_streak_msg', 'Daily logs build stable recovery patterns.')}
          </p>
        </div>

        {/* Metric 3: Joint Pain Status */}
        <div className="p-6">
          <div className="flex items-center justify-between text-ink-2 text-[13px] font-semibold uppercase tracking-wider">
            <span>{t('today.metric_joint_title', 'Knee joint status')}</span>
            <Activity size={16} className="text-recover" aria-hidden />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <PainChip n={pain} />
            <button
              type="button"
              onClick={() => { setDraft(pain); setOpen(true) }}
              className="text-[13px] font-bold text-ink underline underline-offset-4 hover:text-ink-2 cursor-pointer"
            >
              {t('common.details', 'Update')}
            </button>
          </div>
          <div className="mt-3.5 flex items-center gap-2 text-[13px] text-ink-2">
            <ShieldCheck size={16} className="text-ok shrink-0" aria-hidden />
            <span>{t('today.metric_joint_sub', 'Safety threshold: 4/10. Swaps to mobility if higher.')}</span>
          </div>
          <p className="text-[13px] text-ink-2 mt-2.5">
            {t('today.metric_joint_doc', 'Monitored by Dr. Mona Fathy, PT.')}
          </p>
        </div>
      </Card>

      {/* Main Content Grid: Schedule (Left) & Care Team Context (Right) */}
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-8 items-start">
        {/* Left Column: Today's Plan Timeline */}
        <section aria-labelledby="plan-heading">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 id="plan-heading" className="h-display text-[22px] tracking-tight">
                {t('today.care_plan_header', "Today's Care Plan")}
              </h3>
              <p className="text-[13px] text-ink-2 mt-0.5">
                {completedCount} {t('onboarding.of', 'of')} {items.length} {t('today.completed_of', 'completed')}
              </p>
            </div>
            <span className="text-[13px] font-semibold text-ink-2">
              {t('today.all_aligned', 'All 3 specialists aligned')}
            </span>
          </div>

          <div className="space-y-3">
            {loading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
            ) : (
              items.map((p: any) => {
                const s = SVC[p.svc as Svc] || SVC.move
                const d = done.includes(p.id)
                return (
                  <div
                    key={p.id}
                    className={`bg-white rounded-2xl border border-line p-5 transition ${
                      d ? 'bg-paper/70 opacity-75' : 'hover:border-ink/30'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox Trigger */}
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={d}
                        aria-label={`Mark "${p.title}" as ${d ? 'incomplete' : 'complete'}`}
                        onClick={() => toggleItem(p.id)}
                        className={`size-7 rounded-lg border-2 mt-0.5 grid place-items-center cursor-pointer transition shrink-0 ${
                          d
                            ? 'bg-ink border-ink text-white'
                            : 'border-line hover:border-ink bg-white'
                        }`}
                      >
                        {d && <Check size={16} strokeWidth={3} />}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-bold ${s.tint} text-ink`}>
                            <s.Icon size={12} strokeWidth={2.4} aria-hidden />
                            {s.label}
                          </span>
                          <span className="text-[13px] font-semibold text-ink-2 num">{p.time}</span>
                          {d && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ok bg-ok-tint px-2 py-0.5 rounded-full">
                              {t('common.completed', 'Completed')}
                            </span>
                          )}
                        </div>
                        <h4 className={`text-[17px] font-bold text-ink leading-snug ${d ? 'line-through text-ink-2' : ''}`}>
                          {p.title}
                        </h4>
                        <p className="text-[14px] text-ink-2 mt-1">{p.meta}</p>
                      </div>

                      {/* Action Button */}
                      <div className="shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (p.svc === 'move') nav('/session')
                            else if (p.svc === 'eat') nav('/app/plan')
                            else nav('/app/plan')
                          }}
                          className="min-h-10 px-3.5 rounded-xl border border-line bg-paper hover:bg-sand/60 text-ink text-[13px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
                        >
                          {p.action} <ChevronRight size={14} className="text-ink-2" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* Right Column: Specialist Consultation & Chart Notes */}
        <aside className="space-y-4">
          {/* Card 1: Next Video Consultation */}
          <Card className="p-6">
            <div className="flex items-center justify-between text-ink-2 text-[13px] font-semibold uppercase tracking-wider mb-3">
              <span>{t('today.next_consultation', 'Next consultation')}</span>
              <span className="text-[12px] font-bold text-move bg-move-tint px-2.5 py-0.5 rounded-full">
                {t('today.video_call', 'Video Call')}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Avatar initials={sessionInitials} svc={sessionSvc} />
              <div>
                <p className="font-bold text-[17px] text-ink">{sessionName}</p>
                <p className="text-[13px] text-ink-2 font-medium flex items-center gap-1.5 mt-0.5">
                  <Clock size={14} aria-hidden /> {sessionWhen}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <Btn
                variant="primary"
                onClick={() => nav('/session')}
                className="min-h-11 px-3 text-[14px]"
              >
                <Video size={16} aria-hidden /> {t('today.join_call', 'Join call')}
              </Btn>
              <Btn
                variant="secondary"
                onClick={() => nav(rescheduleUrl)}
                className="min-h-11 px-3 text-[14px]"
              >
                <CalendarClock size={16} aria-hidden /> {t('today.reschedule', 'Reschedule')}
              </Btn>
            </div>
          </Card>

          {/* Card 2: Clinical Chart Note from PT */}
          <Card className="p-6 border-l-4 border-l-recover">
            <div className="flex items-center justify-between text-[13px] text-ink-2 font-semibold mb-3">
              <span className="flex items-center gap-1.5 font-bold text-ink">
                <Quote size={14} className="text-recover" aria-hidden /> {t('today.clinical_note', 'Clinical note')}
              </span>
              <span>{noteDate}</span>
            </div>
            <p className="text-[15px] leading-relaxed text-ink font-medium">
              "{noteBody}"
            </p>
            <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-[12px] text-ink-2">
              <span className="font-semibold">{noteFrom}</span>
              <span className="inline-flex items-center gap-1 text-ok font-semibold">
                <UserCheck size={13} aria-hidden /> {t('today.cross_shared', 'Cross-shared with team')}
              </span>
            </div>
          </Card>

          {/* Card 3: Upcoming Program Forecast */}
          <Card className="p-5 flex items-center gap-4 bg-sand/30">
            <span className="size-11 rounded-xl bg-move-tint text-move grid place-items-center shrink-0">
              <Dumbbell size={20} aria-hidden />
            </span>
            <div>
              <p className="text-[13px] text-ink-2 font-semibold uppercase">{t('today.coming_up', 'Coming up next')}</p>
              <p className="text-[15px] font-bold text-ink">Thursday · Upper Body Pull & Posterior Chain</p>
            </div>
          </Card>
        </aside>
      </div>

      {/* Ergonomic Pain Check-in Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} title={t('today.dialog_title', 'Log knee joint check-in')}>
        <p className="text-[14px] text-ink-2 mb-5">
          {t('today.dialog_sub', "Report your current knee discomfort level so your team can fine-tune today's load.")}
        </p>

        <label htmlFor="pain-slider" className="text-[14px] font-semibold text-ink block mb-2">
          {t('today.dialog_discomfort', 'Discomfort level (0–10 scale)')}
        </label>
        
        <div className="bg-paper rounded-2xl p-4 border border-line mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-bold text-ink-2">{t('today.dialog_rating', 'Current rating:')}</span>
            <PainChip n={draft} />
          </div>
          <input
            id="pain-slider"
            type="range"
            min={0}
            max={10}
            value={draft}
            onChange={(e) => setDraft(+e.target.value)}
            className="w-full h-11 accent-ink cursor-pointer"
            aria-valuetext={`${draft} out of 10`}
          />
          <div className="flex justify-between text-[12px] text-ink-2 font-semibold">
            <span>{t('today.rating_pain_free', '0 · Pain-free')}</span>
            <span>{t('today.rating_threshold', '4 · Threshold')}</span>
            <span>{t('today.rating_severe', '10 · Severe pain')}</span>
          </div>
        </div>

        {/* Clinical Advisory */}
        <div className={`p-4 rounded-xl text-[13px] font-medium flex gap-3 items-start ${
          draft <= 3
            ? 'bg-ok-tint text-ok'
            : draft <= 6
            ? 'bg-warn-tint text-warn'
            : 'bg-bad-tint text-bad'
        }`}>
          <ShieldCheck size={18} className="shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="font-bold">
              {draft <= 3
                ? t('today.adv_safe_title', 'Safe for loaded squats')
                : draft <= 6
                ? t('today.adv_warn_title', 'Limit flexion to 60°')
                : t('today.adv_bad_title', 'Rest recommended')}
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed">
              {draft <= 3
                ? t('today.adv_safe_desc', 'Proceed with the scheduled 60° box squats and full protein lunch.')
                : draft <= 6
                ? t('today.adv_warn_desc', 'Squats will be modified to knee-friendly isometric holds and mobility drills.')
                : t('today.adv_bad_desc', 'Dr. Mona will be flagged immediately. Skip squats and focus on passive knee decompression.')}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Btn variant="secondary" onClick={() => setOpen(false)}>
            {t('common.cancel', 'Cancel')}
          </Btn>
          <Btn onClick={saveCheckin}>
            {t('today.confirm_checkin', 'Confirm check-in')}
          </Btn>
        </div>
      </Dialog>
    </div>
  )
}
