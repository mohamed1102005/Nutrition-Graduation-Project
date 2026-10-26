import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import {
  Building2,
  Copy,
  Check,
  Users,
  UserCheck,
  UserMinus,
  Activity,
  ArrowRight,
  ShieldCheck,
  Dumbbell,
  RefreshCw,
} from 'lucide-react'
import { Card, PageHead, Skeleton, Btn, SVC } from '../../ui'
import { api } from '../../api'
import { useLanguage } from '../../context/LanguageContext'

/**
 * OrgAdmin Dashboard (/app/org)
 *
 * Operational executive dashboard for enterprise & club wellness managers:
 * - Organization credentials & invite code distribution
 * - Seat utilization & capacity metrics
 * - Aggregate engagement metrics (active members, specialist assignments)
 * - Cross-pillar care distribution (Move, Eat, Recover)
 *
 * Clinical Privacy Rule:
 * Org admins never see medical diagnoses, client profiles, injuries, or personal notes.
 * Only aggregate usage metrics and assignment linkages are surfaced.
 */
export default function OrgDashboard() {
  const { t, lang } = useLanguage()
  const [info, setInfo] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [infoRes, statsRes] = await Promise.all([
        api.getOrgInfo(),
        api.getOrgStats(),
      ])

      const orgData = infoRes?.organization || infoRes
      setInfo(orgData)
      setStats(statsRes)
    } catch (err: any) {
      console.error('Failed to load organization dashboard:', err)
      setError(err?.message || 'Could not load organization metrics. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const copyInviteCode = async () => {
    if (!info?.inviteCode) return
    try {
      await navigator.clipboard.writeText(info.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback if clipboard API is restricted
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHead title="Organization Dashboard" sub="Loading corporate wellness analytics..." />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHead title="Organization Dashboard" sub="Operational metrics & capacity" />
        <Card className="p-8 text-center border-bad/30 bg-bad-tint/30">
          <div className="size-12 rounded-full bg-bad-tint text-bad flex items-center justify-center mx-auto mb-4">
            <RefreshCw size={24} />
          </div>
          <h2 className="text-lg font-bold text-ink">Failed to load organization metrics</h2>
          <p className="text-sm text-ink-2 mt-1 mb-6 max-w-md mx-auto">{error}</p>
          <Btn onClick={loadData}>Try again</Btn>
        </Card>
      </div>
    )
  }

  const seatsUsed = stats?.seatsUsed ?? info?.seatsUsed ?? 0
  const seatLimit = stats?.seatLimit ?? info?.seatLimit ?? 1
  const seatsRemaining = stats?.seatsRemaining ?? info?.seatsRemaining ?? Math.max(0, seatLimit - seatsUsed)
  const occupancyPercent = Math.min(100, Math.round((seatsUsed / seatLimit) * 100))

  const moveCount = stats?.assignmentsByField?.move ?? 0
  const eatCount = stats?.assignmentsByField?.eat ?? 0
  const recoverCount = stats?.assignmentsByField?.recover ?? 0
  const totalAssignments = moveCount + eatCount + recoverCount

  return (
    <div className="space-y-8">
      {/* Header with Title and Team Code */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-sand text-ink">
              <Building2 size={24} aria-hidden />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="h-display text-2xl sm:text-3xl font-bold text-ink">
                  {info?.name || t('org.title', 'Organization Dashboard')}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-sand text-[11px] font-bold uppercase text-ink">
                  {info?.type || (lang === 'ar' ? 'مؤسسي' : 'Enterprise')}
                </span>
              </div>
              <p className="text-sm text-ink-2 mt-0.5">
                {t('org.sub', 'Sponsored health & recovery roster for your members and athletes.')}
              </p>
            </div>
          </div>
        </div>

        {/* Invite Code Widget (Flat, High Craft) */}
        <div className="flex items-center gap-3 bg-white border border-line p-2.5 px-4 rounded-2xl">
          <div>
            <span className="text-[11px] font-semibold text-ink-2 block">
              {t('org.invite_code', 'Team Invite Code')}
            </span>
            <span className="font-mono text-base font-bold tracking-widest text-ink">
              {info?.inviteCode || '--------'}
            </span>
          </div>
          <Btn
            variant="secondary"
            onClick={copyInviteCode}
            className="text-xs min-h-9 px-3 gap-1.5 shrink-0"
            aria-label="Copy team invite code"
          >
            {copied ? (
              <>
                <Check size={14} className="text-ok" aria-hidden /> {t('org.copied', 'Copied')}
              </>
            ) : (
              <>
                <Copy size={14} aria-hidden /> {t('org.copy', 'Copy')}
              </>
            )}
          </Btn>
        </div>
      </div>

      {/* Share Notification Banner */}
      <div className="p-4 rounded-2xl bg-paper border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
        <div className="flex items-start sm:items-center gap-3">
          <ShieldCheck size={20} className="text-ok shrink-0 mt-0.5 sm:mt-0" aria-hidden />
          <p className="text-ink-2">
            {lang === 'ar' ? (
              <>شارك الرمز <strong className="font-mono text-ink font-bold px-1.5 py-0.5 rounded bg-sand/80">{info?.inviteCode}</strong> مع فريقك للانضمام عبر <strong className="text-ink">/join</strong> بتغطية مؤسسية 100%.</>
            ) : (
              <>Share code <strong className="font-mono text-ink font-bold px-1.5 py-0.5 rounded bg-sand/80">{info?.inviteCode}</strong> with your team. Members join via <strong className="text-ink">/join</strong> with 100% corporate coverage.</>
            )}
          </p>
        </div>
        <Link
          to="/app/org/members"
          className="font-bold text-ink underline underline-offset-4 text-xs whitespace-nowrap self-end sm:self-auto hover:text-ink-2"
        >
          {t('org.view_roster', 'View member roster')} &rarr;
        </Link>
      </div>

      {/* Seat Capacity Overview Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-base font-bold text-ink">{t('org.capacity_title', 'Sponsored Seat Capacity')}</h2>
            <p className="text-xs text-ink-2 mt-0.5">
              {t('org.capacity_sub', 'Active corporate seats occupied by onboarded members.')}
            </p>
          </div>
          <div className="text-right rtl:text-left">
            <span className="num text-2xl font-bold text-ink">
              {seatsUsed}
            </span>
            <span className="text-sm font-semibold text-ink-2"> / {seatLimit} {lang === 'ar' ? 'مقعد' : 'seats'}</span>
          </div>
        </div>

        {/* Capacity Progress Bar */}
        <div className="w-full h-3 rounded-full bg-paper overflow-hidden border border-line">
          <div
            className={`h-full transition-[width] duration-500 rounded-full ${
              occupancyPercent >= 95
                ? 'bg-bad'
                : occupancyPercent >= 80
                ? 'bg-warn'
                : 'bg-ink'
            }`}
            style={{ width: `${occupancyPercent}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-xs text-ink-2 mt-2.5 font-medium">
          <span>{occupancyPercent}% {lang === 'ar' ? 'من السعة مستغلة' : 'capacity utilized'}</span>
          <span className="font-bold text-ink">{seatsRemaining} {lang === 'ar' ? 'مقعد متاح' : 'seats available'}</span>
        </div>
      </Card>

      {/* Operational 4-Up KPI Grid (Flat, Data-Forward) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Members */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-2 mb-3">
            <span className="text-xs font-semibold uppercase text-ink-2">Total Members</span>
            <Users size={18} className="text-ink-2" aria-hidden />
          </div>
          <div>
            <span className="num text-3xl font-bold text-ink">
              {stats?.totalMembers ?? 0}
            </span>
            <p className="text-xs text-ink-2 mt-1">Enrolled accounts</p>
          </div>
        </Card>

        {/* Members With Care Team */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-2 mb-3">
            <span className="text-xs font-semibold uppercase text-ink-2">Assigned</span>
            <UserCheck size={18} className="text-move" aria-hidden />
          </div>
          <div>
            <span className="num text-3xl font-bold text-ink">
              {stats?.membersWithAssignment ?? 0}
            </span>
            <p className="text-xs text-ink-2 mt-1">Paired with specialist</p>
          </div>
        </Card>

        {/* Members Pending Match */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-2 mb-3">
            <span className="text-xs font-semibold uppercase text-ink-2">Unassigned</span>
            <UserMinus size={18} className="text-warn" aria-hidden />
          </div>
          <div>
            <span className="num text-3xl font-bold text-ink">
              {stats?.membersWithoutAssignment ?? 0}
            </span>
            <p className="text-xs text-ink-2 mt-1">Awaiting specialist pairing</p>
          </div>
        </Card>

        {/* Active Members (Last 7 Days) */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-2 mb-3">
            <span className="text-xs font-semibold uppercase text-ink-2">7d Active</span>
            <Activity size={18} className="text-ok" aria-hidden />
          </div>
          <div>
            <span className="num text-3xl font-bold text-ink">
              {stats?.activeMembersLast7Days ?? 0}
            </span>
            <p className="text-xs text-ink-2 mt-1">Logged activity this week</p>
          </div>
        </Card>
      </div>

      {/* Breakdown Row: Pillar Assignments & Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Care Specialization Breakdown */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-ink">Assignments by Care Pillar</h2>
              <p className="text-xs text-ink-2 mt-0.5">
                Specialist distribution across Move, Eat, and Recover
              </p>
            </div>
            <span className="text-xs font-bold bg-sand px-2.5 py-1 rounded-full text-ink num">
              {totalAssignments} Active Links
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {/* Move Pillar */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-semibold flex items-center gap-2 text-ink">
                  <span className="size-2 rounded-full bg-move" aria-hidden />
                  Move (Strength & Conditioning)
                </span>
                <span className="num font-bold text-ink">{moveCount}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-paper overflow-hidden border border-line">
                <div
                  className="h-full bg-move rounded-full transition-[width] duration-500"
                  style={{
                    width: totalAssignments > 0 ? `${(moveCount / totalAssignments) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>

            {/* Eat Pillar */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-semibold flex items-center gap-2 text-ink">
                  <span className="size-2 rounded-full bg-eat" aria-hidden />
                  Eat (Clinical Nutrition)
                </span>
                <span className="num font-bold text-ink">{eatCount}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-paper overflow-hidden border border-line">
                <div
                  className="h-full bg-eat rounded-full transition-[width] duration-500"
                  style={{
                    width: totalAssignments > 0 ? `${(eatCount / totalAssignments) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>

            {/* Recover Pillar */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-semibold flex items-center gap-2 text-ink">
                  <span className="size-2 rounded-full bg-recover" aria-hidden />
                  Recover (Physical Therapy & Rehab)
                </span>
                <span className="num font-bold text-ink">{recoverCount}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-paper overflow-hidden border border-line">
                <div
                  className="h-full bg-recover rounded-full transition-[width] duration-500"
                  style={{
                    width: totalAssignments > 0 ? `${(recoverCount / totalAssignments) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Operational Roster Shortcuts */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-ink">Organization Operations</h2>
            <p className="text-xs text-ink-2 mt-0.5 mb-5">
              Direct access to your corporate team and health specialists.
            </p>

            <div className="space-y-3">
              <Link
                to="/app/org/members"
                className="flex items-center justify-between p-4 rounded-xl border border-line hover:border-ink hover:bg-paper transition"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-move-tint text-move flex items-center justify-center">
                    <Users size={18} aria-hidden />
                  </div>
                  <div>
                    <strong className="text-sm font-bold text-ink block">Member Roster</strong>
                    <span className="text-xs text-ink-2">Manage member accounts and specialist pairings</span>
                  </div>
                </div>
                <ArrowRight size={16} className="text-ink-2" aria-hidden />
              </Link>

              <Link
                to="/app/org/specialists"
                className="flex items-center justify-between p-4 rounded-xl border border-line hover:border-ink hover:bg-paper transition"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-recover-tint text-recover flex items-center justify-center">
                    <Dumbbell size={18} aria-hidden />
                  </div>
                  <div>
                    <strong className="text-sm font-bold text-ink block">Dedicated Specialists</strong>
                    <span className="text-xs text-ink-2">View therapists and trainers assigned to your club</span>
                  </div>
                </div>
                <ArrowRight size={16} className="text-ink-2" aria-hidden />
              </Link>
            </div>
          </div>

          {/* Privacy Footnote */}
          <div className="mt-6 pt-4 border-t border-line text-[12px] text-ink-2 flex items-center gap-2">
            <ShieldCheck size={15} className="shrink-0 text-ok" aria-hidden />
            <span>
              Clinical privacy protection: Individual medical details, injury history, and chat logs remain confidential between member and physician.
            </span>
          </div>
        </Card>
      </div>
    </div>
  )
}
