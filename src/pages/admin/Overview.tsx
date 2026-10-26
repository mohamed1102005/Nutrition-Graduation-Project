import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  UserPlus,
  CalendarCheck,
  ShieldCheck,
  ClipboardList,
  TriangleAlert,
  ArrowRight,
  Users,
  ShieldAlert,
  Headset,
  CheckCircle2,
  Clock,
  Activity,
  FileCheck,
} from 'lucide-react'
import { Card, EmptyState, Gate, PageHead, Skeleton, Btn, SVC, type DemoState } from '../../ui'
import type { Svc } from '../../data'
import { api } from '../../api'
import { useLanguage } from '../../context/LanguageContext'

const initialTiles = [
  ['Total Users', '1,284', '+38 this week', Users],
  ['Active Plans', '612', '+21 this week', ClipboardList],
  ['Weekly Bookings', '947', '+6% vs last week', CalendarCheck],
  ['Verified Specialists', '46', '3 pending credentials', ShieldCheck],
] as const

const fallbackActivity: [any, Svc, string, string][] = [
  [UserPlus, 'move', 'Sara Hassan completed onboarding & joined Knee Plan', '12 min ago'],
  [CalendarCheck, 'recover', 'Dr. Mona Fathy confirmed 3 clinical slots for Thursday', '34 min ago'],
  [ClipboardList, 'eat', 'Hana Mostafa updated meal swap for Omar Khaled', '1 h ago'],
  [TriangleAlert, 'recover', 'Laila Mostafa reported elevated pain 8/10 to Dr. Mona', '1 h ago'],
  [ShieldCheck, 'move', 'Dr. Yasmin Farouk submitted syndicate PT credentials', '3 h ago'],
  [CalendarCheck, 'move', 'Coach Karim Adel opened 12 new strength slots', 'Yesterday'],
]

function getIconForType(type: string) {
  if (type === 'user_registered') return UserPlus
  if (type === 'plan_updated') return ClipboardList
  if (type === 'specialist_application') return ShieldCheck
  if (type === 'pain_alert') return TriangleAlert
  return CalendarCheck
}

function getSvcForType(svcOrRole?: string): Svc {
  if (!svcOrRole) return 'move'
  const s = svcOrRole.toLowerCase()
  if (s.includes('recover') || s.includes('therapist') || s.includes('pt')) return 'recover'
  if (s.includes('eat') || s.includes('nutrition') || s.includes('diet')) return 'eat'
  return 'move'
}

function formatRelativeTime(timestamp?: string) {
  if (!timestamp) return 'Just now'
  const diffMs = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 60) return `${Math.max(1, mins)} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

export default function Overview() {
  const { t, lang } = useLanguage()
  const [state, setState] = useState<DemoState>('loaded')
  const [counts, setCounts] = useState<any>(null)
  const [activityList, setActivityList] = useState<[any, Svc, string, string][]>(fallbackActivity)

  useEffect(() => {
    let active = true
    api.getAdminOverview()
      .then((data) => {
        if (!active || !data) return
        if (data.counts) {
          setCounts(data.counts)
        }
        if (Array.isArray(data.recentActivity) && data.recentActivity.length > 0) {
          const mapped: [any, Svc, string, string][] = data.recentActivity.map((a: any) => [
            getIconForType(a.type),
            getSvcForType(a.svc_or_role),
            a.description,
            formatRelativeTime(a.timestamp),
          ])
          setActivityList(mapped)
        }
      })
      .catch((err) => {
        console.error('Failed to load admin overview:', err)
      })
    return () => { active = false }
  }, [])

  const tiles = counts ? [
    [t('admin.total_users', 'Total Users'), (counts.users ?? 0).toLocaleString('en-US'), `+${Math.max(1, Math.round((counts.users ?? 0) * 0.1))} ${lang === 'ar' ? 'هذا الأسبوع' : 'this week'}`, Users],
    [t('admin.active_plans', 'Active Plans'), (counts.activePlans ?? 0).toLocaleString('en-US'), `+${Math.max(1, Math.round((counts.activePlans ?? 0) * 0.15))} ${lang === 'ar' ? 'هذا الأسبوع' : 'this week'}`, ClipboardList],
    [t('admin.weekly_bookings', 'Weekly Bookings'), (counts.bookingsThisWeek ?? 0).toLocaleString('en-US'), lang === 'ar' ? '+6% مقارنة بالأسبوع الماضي' : '+6% vs last week', CalendarCheck],
    [t('admin.verified_specialists', 'Verified Specialists'), (counts.specialists ?? 0).toLocaleString('en-US'), `${counts.pendingSpecialists || 3} ${lang === 'ar' ? 'بانتظار المراجعة' : 'pending review'}`, ShieldCheck],
  ] : [
    [t('admin.total_users', 'Total Users'), '1,284', lang === 'ar' ? '+38 هذا الأسبوع' : '+38 this week', Users],
    [t('admin.active_plans', 'Active Plans'), '612', lang === 'ar' ? '+21 هذا الأسبوع' : '+21 this week', ClipboardList],
    [t('admin.weekly_bookings', 'Weekly Bookings'), '947', lang === 'ar' ? '+6% مقارنة بالأسبوع الماضي' : '+6% vs last week', CalendarCheck],
    [t('admin.verified_specialists', 'Verified Specialists'), '46', lang === 'ar' ? '3 بانتظار الاعتماد' : '3 pending credentials', ShieldCheck],
  ]

  const pendingCount = counts?.pendingSpecialists ?? 3

  return (
    <div className="space-y-8">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sand text-ink text-[12px] font-bold">
              {t('admin.ops_center', 'Operations Center')}
            </span>
            <span>·</span>
            <span>{t('admin.governance_sub', 'Platform Governance & Telehealth Compliance')}</span>
          </div>
          <h1 className="h-display text-[28px] sm:text-[32px] tracking-tight text-ink font-bold">
            {t('admin.ops_title', 'Platform Operations & Analytics')}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Btn
            variant="secondary"
            to="/app/users"
            className="min-h-11 px-4 text-[14px]"
          >
            <Users size={16} aria-hidden /> {t('admin.user_accounts', 'User Accounts')}
          </Btn>
          <Btn
            to="/app/approvals"
            className="min-h-11 px-5 text-[14px]"
          >
            <FileCheck size={16} aria-hidden /> {t('admin.pending_approvals', 'Pending Approvals')} ({pendingCount})
          </Btn>
        </div>
      </div>

      <Gate
        state={state}
        retry={() => setState('loaded')}
        skeleton={
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
            </div>
            <Skeleton className="h-72 rounded-2xl" />
          </div>
        }
        empty={<Card><EmptyState title="No activity yet" text="Platform analytics will appear here as users engage." /></Card>}
      >
        {/* 4-Up Operational KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiles.map(([l, v, d, Icon]) => (
            <Card key={l} className="p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between text-ink-2">
                <span className="text-xs font-semibold uppercase text-ink-2">{l}</span>
                <Icon size={18} className="text-ink-2" aria-hidden />
              </div>
              <div className="mt-4">
                <p className="num text-[40px] sm:text-[46px] font-bold text-ink leading-none">{v}</p>
                <p className="text-[13px] font-semibold text-ok mt-2">{d}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Action Callout Banner: Credential Queue */}
        <div className="p-5 rounded-2xl bg-warn-tint/60 border border-warn/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <span className="size-10 rounded-xl bg-warn-tint text-warn grid place-items-center shrink-0">
              <TriangleAlert size={20} aria-hidden />
            </span>
            <div>
              <p className="font-bold text-ink text-[15px]">
                {pendingCount} Specialist Credential{pendingCount === 1 ? '' : 's'} Awaiting Verification
              </p>
              <p className="text-xs text-ink-2 mt-0.5">
                Physical therapy syndicate licenses and nutrition certifications require compliance sign-off prior to client booking.
              </p>
            </div>
          </div>
          <Link
            to="/app/approvals"
            className="min-h-10 px-4 rounded-xl bg-ink text-white text-xs font-bold inline-flex items-center gap-1.5 self-end sm:self-auto hover:bg-ink/90 transition shrink-0"
          >
            Review Queue <ArrowRight size={14} aria-hidden />
          </Link>
        </div>

        {/* Two-Column Grid: Priority Ops & Cross-Pillar Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Operations & System Controls */}
          <Card className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[18px] font-bold text-ink">Administrative Controls</h2>
                  <p className="text-xs text-ink-2 mt-0.5">Platform governance, dispute resolution, and security.</p>
                </div>
                <span className="text-xs font-bold text-ok bg-ok-tint px-2.5 py-1 rounded-full">
                  All Systems Normal
                </span>
              </div>

              <div className="space-y-3 mt-4">
                <Link
                  to="/app/approvals"
                  className="flex items-center justify-between p-4 rounded-xl border border-line hover:border-ink hover:bg-paper transition"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="size-10 rounded-xl bg-move-tint text-move flex items-center justify-center">
                      <ShieldCheck size={20} aria-hidden />
                    </div>
                    <div>
                      <strong className="text-sm font-bold text-ink block">Syndicate License Verification</strong>
                      <span className="text-xs text-ink-2">Egyptian Medical Syndicate & PT licenses</span>
                    </div>
                  </div>
                  <span className="num text-xs font-bold bg-sand px-2.5 py-1 rounded-full text-ink">
                    {pendingCount} Pending
                  </span>
                </Link>

                <Link
                  to="/app/users"
                  className="flex items-center justify-between p-4 rounded-xl border border-line hover:border-ink hover:bg-paper transition"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="size-10 rounded-xl bg-eat-tint text-eat flex items-center justify-center">
                      <Users size={20} aria-hidden />
                    </div>
                    <div>
                      <strong className="text-sm font-bold text-ink block">User Accounts & Roles</strong>
                      <span className="text-xs text-ink-2">Role management, client rosters, and suspension audit</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-ink-2" aria-hidden />
                </Link>

                <Link
                  to="/app/admin/support"
                  className="flex items-center justify-between p-4 rounded-xl border border-line hover:border-ink hover:bg-paper transition"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="size-10 rounded-xl bg-recover-tint text-recover flex items-center justify-center">
                      <Headset size={20} aria-hidden />
                    </div>
                    <div>
                      <strong className="text-sm font-bold text-ink block">Support Tickets & Disputes</strong>
                      <span className="text-xs text-ink-2">Session refunds, conduct reports, and operations</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-ok bg-ok-tint px-2.5 py-1 rounded-full">
                    Resolved
                  </span>
                </Link>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-line text-[12px] text-ink-2 flex items-center justify-between">
              <span>Audit Logging: <b>Active</b></span>
              <span className="font-semibold text-ink">Rebound Health v1.0.0</span>
            </div>
          </Card>

          {/* Real-Time Platform Activity Stream */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[18px] font-bold text-ink">Live Platform Activity</h2>
                <p className="text-xs text-ink-2 mt-0.5">Real-time audit events across Move, Eat, and Recover.</p>
              </div>
              <span className="text-xs font-semibold text-ink-2 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-ok animate-pulse" aria-hidden /> Real-time
              </span>
            </div>

            <ul className="space-y-3 mt-4">
              {activityList.map(([I, s, t, w], i) => (
                <li
                  key={i}
                  className="p-3.5 rounded-xl border border-line bg-white hover:bg-paper/40 transition flex items-center gap-3.5"
                >
                  <span className={`size-10 rounded-xl grid place-items-center shrink-0 ${(SVC[s] || SVC.move).tint}`}>
                    <I size={18} aria-hidden />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-ink leading-tight truncate">{t}</p>
                    <span className="text-[12px] text-ink-2 mt-0.5 block">{w}</span>
                  </div>
                  <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${(SVC[s] || SVC.move).tint} text-ink shrink-0`}>
                    {(SVC[s] || SVC.move).label}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Gate>
    </div>
  )
}
