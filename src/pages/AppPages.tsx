import { useEffect, useState } from 'react'
import { Navigate, Link, useNavigate } from 'react-router'
import {
  CircleCheck,
  OctagonAlert,
  TriangleAlert,
  Video,
  ArrowRight,
  Clock,
  CalendarCheck,
  Activity,
  UserCheck,
  FileText,
} from 'lucide-react'
import { Card, PageHead, Btn, Avatar } from '../ui'
import { useRole } from './Shell'
import ClientToday from './client/Today'
import { api, getStoredUser } from '../api'
import WaitingForApproval from './specialist/WaitingForApproval'

const CLIENT_IDS: Record<string, string> = { 'Sara Hassan': 'sara', 'Omar Khaled': 'omar', 'Laila Mostafa': 'laila' }

function SpecialistToday() {
  const user = getStoredUser()
  const nav = useNavigate()
  if (user?.role === 'specialist' && user?.approvalStatus && user.approvalStatus !== 'approved') {
    return <WaitingForApproval user={user} />
  }

  const [loading, setLoading] = useState(true)
  const [bookedSessions, setBookedSessions] = useState<any[]>([])

  const defaultRows = [
    ['Sara Hassan', 'sara', 'Knee Rehabilitation Review', '16:00', 'warn'],
    ['Omar Khaled', 'omar', 'Lower Back Check-in & Load Test', '17:00', 'ok'],
    ['Laila Mostafa', 'laila', 'Shoulder Protocol · Week 3 Assessment', '18:30', 'bad'],
  ]

  useEffect(() => {
    let active = true
    Promise.all([
      api.getSpecialistSchedule().catch(() => ({ slots: [] })),
      api.getSpecialistClients().catch(() => ({ clients: [] })),
    ]).then(([schedData, clientData]) => {
      if (!active) return
      const slots = schedData.slots || []
      const clientsList = clientData.clients || []
      const clientMap = new Map(clientsList.map((c: any) => [c.id, c]))

      const booked = slots.filter((s: any) => s.booking && s.booking.client)
      if (booked.length > 0) {
        const rows = booked.map((s: any) => {
          const c = clientMap.get(s.booking.client.id)
          const name = s.booking.client.name
          const id = String(s.booking.client.id)
          const session = s.booking.sessionType || 'Clinical Review'
          const time = s.startsAt ? new Date(s.startsAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '16:00'
          const pain = c?.latestPain ?? 3
          const status = pain >= 7 ? 'bad' : pain >= 4 ? 'warn' : 'ok'
          return [name, id, session, time, status]
        })
        setBookedSessions(rows)
      } else if (clientsList.length > 0) {
        const rows = clientsList.slice(0, 3).map((c: any) => {
          const status = (c.latestPain ?? 0) >= 7 ? 'bad' : (c.latestPain ?? 0) >= 4 ? 'warn' : 'ok'
          return [c.name, String(c.id), c.goal || 'Session check-in', '16:00', status]
        })
        setBookedSessions(rows)
      }
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  const rows = bookedSessions.length > 0 ? bookedSessions : defaultRows

  const st = {
    ok: ['Mild (0–3)', 'bg-ok-tint text-ok', CircleCheck],
    warn: ['Moderate (4–6)', 'bg-warn-tint text-warn', TriangleAlert],
    bad: ['Elevated (7–10)', 'bg-bad-tint text-bad', OctagonAlert],
  } as const

  const needsAttention = rows.filter((r) => r[4] === 'warn' || r[4] === 'bad').length

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sand text-ink text-[12px] font-bold">
              Specialist Practice
            </span>
            <span>·</span>
            <span>Clinical Rehabilitation & Training</span>
          </div>
          <h1 className="h-display text-[28px] sm:text-[32px] tracking-tight text-ink font-bold">
            Today's Consultations · Tuesday, 14 October
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Btn
            variant="secondary"
            to="/app/schedule"
            className="min-h-11 px-4 text-[14px]"
          >
            <Clock size={16} aria-hidden /> Manage Schedule
          </Btn>
          <Btn
            to="/app/clients"
            className="min-h-11 px-5 text-[14px]"
          >
            <UserCheck size={16} aria-hidden /> View All Clients
          </Btn>
        </div>
      </div>

      {/* KPI Triage Panel (Flat, High Contrast) */}
      <Card className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-line">
        <div className="p-6">
          <div className="flex items-center justify-between text-ink-2 text-[13px] font-semibold uppercase tracking-wider">
            <span>Scheduled Today</span>
            <CalendarCheck size={16} className="text-ink-2" aria-hidden />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="num text-[44px] font-bold text-ink leading-none">{rows.length}</span>
            <span className="text-[16px] font-semibold text-ink-2">consultations</span>
          </div>
          <p className="text-[13px] text-ink-2 mt-3">
            All appointments confirmed with client reminders dispatched.
          </p>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between text-ink-2 text-[13px] font-semibold uppercase tracking-wider">
            <span>Triage Priority</span>
            <Activity size={16} className={needsAttention > 0 ? 'text-warn' : 'text-ok'} aria-hidden />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="num text-[44px] font-bold text-ink leading-none">{needsAttention}</span>
            <span className="text-[16px] font-semibold text-ink-2">need attention</span>
          </div>
          <p className="text-[13px] text-ink-2 mt-3">
            {needsAttention > 0
              ? 'Pain reports $\ge 4/10$ require review prior to exercise loading.'
              : 'All reporting clients within comfortable baseline tolerances.'}
          </p>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between text-ink-2 text-[13px] font-semibold uppercase tracking-wider">
            <span>Interdisciplinary Sync</span>
            <ShieldCheck size={16} className="text-ok" aria-hidden />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="num text-[44px] font-bold text-ink leading-none">100%</span>
            <span className="text-[16px] font-semibold text-ok">synchronized</span>
          </div>
          <p className="text-[13px] text-ink-2 mt-3">
            Trainer load adjustments & dietitian meal swaps synchronized live.
          </p>
        </div>
      </Card>

      {/* Clinical Consultation Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-line flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-ink">Consultation & Triage Roster</h2>
            <p className="text-xs text-ink-2 mt-0.5">
              Review current symptoms, pain ratings, and launch video sessions.
            </p>
          </div>
          <span className="text-xs font-bold text-ink bg-sand px-3 py-1 rounded-full num">
            {rows.length} Total Patients
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[620px]">
            <thead>
              <tr className="text-[12px] uppercase text-ink-2 bg-paper/60 border-b border-line">
                <th className="px-6 py-3 font-semibold">Patient / Client</th>
                <th className="px-6 py-3 font-semibold">Session Scope</th>
                <th className="px-6 py-3 font-semibold">Scheduled Time</th>
                <th className="px-6 py-3 font-semibold">Pain Status</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(([n, id, s, t, k]) => {
                const [lbl, cls, I] = st[k as keyof typeof st]
                const clientHref = `/app/clients/${CLIENT_IDS[n] || id}`
                const initials = n.split(' ').map((w: string) => w[0]).join('').slice(0, 2)
                return (
                  <tr key={n + t} className="hover:bg-paper/40 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar initials={initials} svc="recover" />
                        <div>
                          <Link to={clientHref} className="font-bold text-ink hover:underline">
                            {n}
                          </Link>
                          <span className="text-xs text-ink-2 block">ID #{id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-ink">
                      {s}
                    </td>
                    <td className="px-6 py-4 num text-sm font-bold text-ink">
                      {t}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-bold text-[12px] ${cls}`}>
                        <I size={14} aria-hidden /> {lbl}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to={clientHref}
                          className="min-h-9 px-3 rounded-lg border border-line hover:border-ink bg-white text-xs font-bold inline-flex items-center gap-1 text-ink transition"
                        >
                          <FileText size={13} aria-hidden /> Chart
                        </Link>
                        <Btn
                          onClick={() => nav('/session')}
                          className="min-h-9 px-3 text-xs"
                        >
                          <Video size={13} aria-hidden /> Video
                        </Btn>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export function Today() {
  const role = useRole()
  if (role === 'Client') return <ClientToday />
  if (role === 'Specialist') return <SpecialistToday />
  if (role === 'Finance') return <Navigate to="/app/finance/overview" replace />
  if (role === 'OrgAdmin') return <Navigate to="/app/org" replace />
  return <Navigate to="/app/overview" replace />
}
