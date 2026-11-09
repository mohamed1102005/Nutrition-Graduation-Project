import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, Link, useOutletContext } from 'react-router'
import { Bell, CalendarDays, ClipboardList, House, LineChart, Menu, Sparkles, Users, X, LogOut, Settings, UserRound, LayoutDashboard, ShieldCheck, Contact, Coins, ReceiptText, CreditCard, Clock, Headset, Building2 } from 'lucide-react'
import { Btn, Card, EmptyState, Wordmark } from '../ui'
import { LanguageToggle } from '../components/ui/LanguageToggle'
import { SupportModal } from '../components/support/SupportModal'
import { useLanguage } from '../context/LanguageContext'
import WaitingForApproval from './specialist/WaitingForApproval'

import { RoleOnly, type Role, type RoleContextType } from '@/components/auth/RoleOnly'
export { RoleOnly, type Role }

type Ctx = RoleContextType
export const useRole = () => useOutletContext<Ctx>().role

const getNavItems = (t: (key: string, fallback?: string) => string, isOrgMember = false) => ({
  Client: isOrgMember
    ? [
        { to: '/app/today', label: t('nav.today'), Icon: House },
        { to: '/app/my-specialists', label: t('nav.my_specialists', 'My Specialists'), Icon: Users },
        { to: '/app/bookings', label: t('nav.bookings'), Icon: CalendarDays },
        { to: '/app/plan', label: t('nav.plan'), Icon: ClipboardList },
        { to: '/app/progress', label: t('nav.progress'), Icon: LineChart },
        { to: '/app/ai-plan', label: t('nav.ai_plan'), Icon: Sparkles },
      ]
    : [
        { to: '/app/today', label: t('nav.today'), Icon: House },
        { to: '/app/specialists', label: t('nav.specialists'), Icon: Users },
        { to: '/app/my-specialists', label: t('nav.my_specialists', 'My Specialists'), Icon: Contact },
        { to: '/app/bookings', label: t('nav.bookings'), Icon: CalendarDays },
        { to: '/app/plan', label: t('nav.plan'), Icon: ClipboardList },
        { to: '/app/progress', label: t('nav.progress'), Icon: LineChart },
        { to: '/app/ai-plan', label: t('nav.ai_plan'), Icon: Sparkles },
      ],
  Specialist: [
    { to: '/app/today', label: t('nav.today'), Icon: House },
    { to: '/app/clients', label: t('nav.clients'), Icon: Contact },
    { to: '/app/schedule', label: t('nav.schedule'), Icon: CalendarDays },
  ],
  Admin: [
    { to: '/app/overview', label: t('nav.overview'), Icon: LayoutDashboard },
    { to: '/app/users', label: t('nav.users'), Icon: Users },
    { to: '/app/approvals', label: t('nav.approvals'), Icon: ShieldCheck },
    { to: '/app/admin/support', label: t('nav.support'), Icon: Headset },
  ],
  Finance: [
    { to: '/app/finance/overview', label: t('nav.overview'), Icon: LayoutDashboard },
    { to: '/app/finance/transactions', label: t('nav.ledger'), Icon: ReceiptText },
    { to: '/app/finance/payouts', label: t('nav.payouts'), Icon: Coins },
    { to: '/app/finance/subscriptions', label: t('nav.subscriptions'), Icon: CreditCard },
  ],
  OrgAdmin: [
    { to: '/app/org', label: t('nav.dashboard', 'Dashboard'), Icon: LayoutDashboard },
    { to: '/app/org/members', label: t('nav.members', 'Members'), Icon: Users },
    { to: '/app/org/specialists', label: t('nav.specialists', 'Specialists'), Icon: Contact },
  ],
})

import { api, IS_DEMO_MODE, getStoredUser, getToken, removeToken } from '../api'

type DemoAccountKey = 'Client' | 'OrgMember' | 'Specialist' | 'Admin' | 'Finance' | 'OrgAdmin'

const DEMO_ACCOUNTS: Record<DemoAccountKey, { label: string; email: string; pass: string; role: Role }> = {
  Client: { label: 'Client (Sara)', email: 'sara@demo.com', pass: 'demo1234', role: 'Client' },
  OrgMember: { label: 'Org member', email: 'member1@apex.com', pass: 'demo1234', role: 'Client' },
  Specialist: { label: 'Specialist', email: 'mona@demo.com', pass: 'demo1234', role: 'Specialist' },
  Admin: { label: 'Admin', email: 'admin@demo.com', pass: 'demo1234', role: 'Admin' },
  Finance: { label: 'Finance', email: 'finance@demo.com', pass: 'demo1234', role: 'Finance' },
  OrgAdmin: { label: 'Org admin', email: 'admin@apex.com', pass: 'demo1234', role: 'OrgAdmin' },
}

function RoleSwitch({
  activeKey,
  onSelect,
}: {
  activeKey: DemoAccountKey
  onSelect: (key: DemoAccountKey) => void
}) {
  if (!IS_DEMO_MODE) return null
  return (
    <div>
      <p className="label text-ink-2 mb-2">Demo role</p>
      <div role="radiogroup" aria-label="Demo role" className="grid grid-cols-2 gap-1 p-1 bg-ink/[0.06] rounded-2xl">
        {(Object.keys(DEMO_ACCOUNTS) as DemoAccountKey[]).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={activeKey === k}
            onClick={() => onSelect(k)}
            className={`min-h-10 px-2 rounded-xl text-[12px] font-semibold cursor-pointer transition-colors truncate ${
              activeKey === k ? 'bg-white text-ink ring-1 ring-line' : 'text-ink-2 hover:text-ink'
            }`}
            title={DEMO_ACCOUNTS[k].label}
          >
            {DEMO_ACCOUNTS[k].label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Pop({ open, onClose, children, className = '' }: { open: boolean; onClose: () => void; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && onClose()
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('mousedown', h)
    document.addEventListener('keydown', k)
    return () => {
      document.removeEventListener('mousedown', h)
      document.removeEventListener('keydown', k)
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div ref={ref} className={`absolute right-0 top-14 bg-white border border-line rounded-xl shadow-[0_12px_32px_rgba(20,22,26,0.14)] z-50 ${className}`}>
      {children}
    </div>
  )
}

const roleFromUser = (u: any): Role => {
  if (u?.role === 'org_admin') return 'OrgAdmin'
  if (u?.role === 'admin') return 'Admin'
  if (u?.role === 'finance') return 'Finance'
  if (u?.role === 'specialist') return 'Specialist'
  return 'Client'
}

const DEMO_USERS: Record<Role, { id: number; name: string; email: string; role: string }> = {
  Client: { id: 1, name: 'Sara Hassan', email: 'sara@demo.com', role: 'client' },
  Specialist: { id: 2, name: 'Dr. Mona Fathy', email: 'mona@demo.com', role: 'specialist' },
  Admin: { id: 3, name: 'Admin team', email: 'admin@demo.com', role: 'admin' },
  Finance: { id: 4, name: 'Tamer Fahmy', email: 'finance@demo.com', role: 'finance' },
  OrgAdmin: { id: 10, name: 'Apex Admin', email: 'admin@apex.com', role: 'org_admin' },
}

export default function Shell() {
  const { t, isRtl } = useLanguage()
  const [currentUser, setCurrentUser] = useState<any>(getStoredUser())
  const [role, setRole] = useState<Role>(roleFromUser(getStoredUser()))
  const isOrgMember = Boolean(currentUser?.organizationId || currentUser?.organization)
  const navs = getNavItems(t, isOrgMember)
  const allNav = [
    ...navs.Client,
    ...navs.Specialist.slice(1),
    ...navs.Admin,
    ...navs.Finance,
    ...navs.OrgAdmin,
  ]

  const [bell, setBell] = useState(false)
  const [menu, setMenu] = useState(false)
  const [moreOpen, setMore] = useState(false)
  const [supportModalOpen, setSupportModalOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unread, setUnread] = useState(0)
  const loc = useLocation()
  const go = useNavigate()

  const loadNotifications = () => {
    if (!getToken()) return
    api.getNotifications()
      .then((res) => { setNotifications(res.notifications); setUnread(res.unreadCount) })
      .catch(() => {})
  }
  useEffect(() => {
    loadNotifications()
    const timer = setInterval(loadNotifications, 60000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  const markAllRead = () => {
    api.markAllNotificationsRead().then(loadNotifications).catch(() => {})
  }
  const openNotification = (n: any) => {
    if (!n.read) api.markNotificationRead(n.id).then(loadNotifications).catch(() => {})
    setBell(false)
    if (n.link) go(n.link)
  }
  const timeAgo = (iso: string) => {
    const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
    if (mins < 1) return t('nav.just_now', 'Just now')
    if (mins < 60) return `${mins} min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} h`
    return `${Math.floor(hrs / 24)} d`
  }
  const isSpecialistPending =
    role === 'Specialist' &&
    currentUser?.role === 'specialist' &&
    currentUser?.approvalStatus !== 'approved'

  const items = isSpecialistPending
    ? [{ to: '/app/today', label: t('nav.approval_status', 'Approval Status'), Icon: Clock }]
    : navs[role] || navs.Client
  const title = isSpecialistPending
    ? t('nav.verification_title', 'Specialist Verification')
    : ([...allNav].sort((x, y) => y.to.length - x.to.length).find((n) => loc.pathname.startsWith(n.to))?.label ?? 'Rebound')
  const home = (r: Role) => {
    if (r === 'OrgAdmin') return '/app/org'
    if (r === 'Admin') return '/app/overview'
    if (r === 'Finance') return '/app/finance/overview'
    return '/app/today'
  }

  // Derive demo account key
  const activeDemoKey: DemoAccountKey =
    currentUser?.email === 'admin@apex.com'
      ? 'OrgAdmin'
      : currentUser?.email === 'member1@apex.com'
      ? 'OrgMember'
      : role === 'Admin'
      ? 'Admin'
      : role === 'Finance'
      ? 'Finance'
      : role === 'Specialist'
      ? 'Specialist'
      : 'Client'

  const changeRoleByKey = async (key: DemoAccountKey) => {
    const acc = DEMO_ACCOUNTS[key]
    if (IS_DEMO_MODE) {
      try {
        const res = await api.login(acc.email, acc.pass)
        setCurrentUser(res.user)
      } catch {
        setCurrentUser(DEMO_USERS[acc.role])
      }
    } else {
      setCurrentUser(DEMO_USERS[acc.role])
    }
    setRole(acc.role)
    go(home(acc.role))
  }

  const changeRole = async (r: Role) => {
    if (r === 'OrgAdmin') {
      await changeRoleByKey('OrgAdmin')
    } else {
      await changeRoleByKey(r as DemoAccountKey)
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken()
      if (token) {
        try {
          const user = await api.getMe()
          setCurrentUser(user)
          setRole(roleFromUser(user))
          return
        } catch {
          removeToken()
        }
      }
      if (IS_DEMO_MODE) {
        try {
          const res = await api.login('sara@demo.com', 'demo1234')
          setCurrentUser(res.user)
          setRole(roleFromUser(res.user))
        } catch {
          const initialRole = role || 'Client'
          setCurrentUser(DEMO_USERS[initialRole])
          setRole(initialRole)
        }
      } else {
        go('/login', { replace: true })
      }
    }
    initAuth()
  }, [])

  const name = currentUser?.name || (role === 'Client' ? 'Sara Hassan' : role === 'Specialist' ? 'Dr. Mona Fathy' : role === 'Finance' ? 'Tamer Fahmy' : 'Admin team')
  const initials =
    name
      .replace(/^(Dr\.|Coach)\s+/i, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w: string) => w[0]?.toUpperCase())
      .join('') || (role === 'Specialist' ? 'MF' : role === 'Finance' ? 'TF' : role === 'Admin' ? 'AD' : 'SH')

  useEffect(() => {
    setMore(false)
  }, [loc.pathname])

  return (
    <div className="min-h-screen bg-paper">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-ink focus:text-white focus:rounded-lg focus:font-bold"
      >
        Skip to main content
      </a>
      <aside className={`hidden lg:flex fixed inset-y-0 ${isRtl ? 'right-0 border-l' : 'left-0 border-r'} w-[248px] bg-paper border-line flex-col p-4 z-30`}>
        <Link to={home(role)} className="px-3 h-12 flex items-center" aria-label="Rebound">
          <Wordmark />
        </Link>
        <nav className="mt-6 flex flex-col gap-0.5" aria-label="App">
          {items.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/app/org'}
              className={({ isActive }) => `min-h-11 px-3 rounded-xl flex items-center gap-3 text-[15px] font-semibold transition-colors ${isActive ? 'bg-ink/[0.07] text-ink' : 'text-ink-2 hover:bg-ink/[0.04] hover:text-ink'}`}
            >
              <Icon size={18} aria-hidden /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto">
          <RoleSwitch activeKey={activeDemoKey} onSelect={changeRoleByKey} />
        </div>
      </aside>

      <div className={isRtl ? 'lg:pr-[248px]' : 'lg:pl-[248px]'}>
        <header className="sticky top-0 z-20 bg-paper border-b border-line h-16 px-5 lg:px-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={home(role)} className="lg:hidden" aria-label="Rebound">
              <span className="flex gap-[3px] items-end h-6" aria-hidden>
                <span className="w-[7px] h-6 rounded-full bg-move" />
                <span className="w-[7px] h-4 rounded-full bg-eat" />
                <span className="w-[7px] h-5 rounded-full bg-recover" />
              </span>
            </Link>
            <h1 className="h-display text-[22px] lg:text-[24px]">
              {title}
            </h1>
            {currentUser?.organization?.name && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 h-7 rounded-full bg-ink/[0.06] text-[13px] font-semibold text-ink">
                <Building2 size={14} className="text-ink-2" aria-hidden />
                {currentUser.organization.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 relative">
            <LanguageToggle />
            <button
              onClick={() => setSupportModalOpen(true)}
              title={t('support.modal_title')}
              aria-label={t('support.modal_title')}
              className="relative size-11 grid place-items-center rounded-full hover:bg-ink/[0.06] cursor-pointer text-ink transition-colors"
            >
              <Headset size={20} />
            </button>
            <button
              onClick={() => { setBell(!bell); setMenu(false) }}
              aria-label={unread > 0 ? `Notifications, ${unread} new` : 'Notifications'}
              aria-expanded={bell}
              className="relative size-11 grid place-items-center rounded-full hover:bg-ink/[0.06] cursor-pointer transition-colors"
            >
              <Bell size={20} />
              {unread > 0 && <span className="absolute top-0.5 end-0.5 grid size-5 place-items-center rounded-full border-2 border-paper bg-ink text-[11px] font-bold leading-none text-white">{unread > 9 ? '9+' : unread}</span>}
            </button>
            <button
              onClick={() => { setMenu(!menu); setBell(false) }}
              aria-label="Profile menu"
              aria-expanded={menu}
              className="hidden size-11 place-items-center rounded-full bg-sand font-display font-extrabold text-[14px] cursor-pointer lg:grid"
            >
              {initials}
            </button>
            <button
              onClick={() => { setMore(!moreOpen); setBell(false) }}
              aria-label={moreOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={moreOpen}
              className="grid size-11 place-items-center rounded-full hover:bg-ink/[0.06] cursor-pointer lg:hidden"
            >
              {moreOpen ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
            </button>
            <Pop open={bell} onClose={() => setBell(false)} className={`w-[320px] max-w-[calc(100vw-40px)] p-2 ${isRtl ? 'left-0 right-auto' : 'right-0'}`}>
              <div className="flex items-center justify-between px-3 pt-2 pb-1">
                <p className="font-bold">{t('nav.notifications')}</p>
                {unread > 0 && (
                  <button className="text-[14px] font-semibold underline underline-offset-4 cursor-pointer" onClick={markAllRead}>
                    {t('nav.mark_all_read', 'Mark all read')}
                  </button>
                )}
              </div>
              {notifications.length === 0 && <p className="px-3 py-4 text-[15px] text-ink-2">{t('nav.no_notifications', 'You are all caught up.')}</p>}
              {notifications.map((n) => (
                <button
                  key={n.id}
                  className={`w-full text-start px-3 py-3 rounded-xl hover:bg-ink/[0.04] cursor-pointer ${n.read ? '' : 'bg-ink/[0.03]'}`}
                  onClick={() => { openNotification(n) }}
                >
                  <p className="text-[15px] font-semibold flex items-center gap-2">
                    {!n.read && <span className="size-2 rounded-full bg-ink shrink-0" aria-hidden />}
                    {n.title}
                  </p>
                  {n.body && <p className="text-[14px] text-ink-2">{n.body}</p>}
                  <p className="text-[13px] text-ink-2 mt-0.5">{timeAgo(n.createdAt)}</p>
                </button>
              ))}
            </Pop>
            <Pop open={menu} onClose={() => setMenu(false)} className={`w-[240px] p-2 ${isRtl ? 'left-0 right-auto' : 'right-0'}`}>
              <div className="px-3 py-2 border-b border-line mb-1">
                <p className="font-bold">{name}</p>
                <p className="text-[14px] text-ink-2">{role}</p>
              </div>
              {[
                [UserRound, t('nav.profile')],
                [Settings, t('nav.settings')],
              ].map(([I, l]) => {
                const Icon = I as typeof Settings
                return (
                  <button key={l as string} className="w-full min-h-11 px-3 rounded-xl flex items-center gap-3 font-semibold hover:bg-paper cursor-pointer" onClick={() => { setMenu(false); go('/app/account') }}>
                    <Icon size={18} aria-hidden /> {l as string}
                  </button>
                )
              })}
              <button
                className="w-full min-h-11 px-3 rounded-xl flex items-center gap-3 font-semibold hover:bg-ink/[0.04] cursor-pointer"
                onClick={() => {
                  setMenu(false)
                  setSupportModalOpen(true)
                }}
              >
                <Headset size={18} aria-hidden /> {t('support.modal_title')}
              </button>
              <button className="w-full min-h-11 px-3 rounded-xl flex items-center gap-3 font-semibold hover:bg-paper cursor-pointer" onClick={() => { api.logout(); go('/login') }}>
                <LogOut size={18} aria-hidden /> {t('nav.logout')}
              </button>
            </Pop>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="px-5 lg:px-10 py-8 pb-12 max-w-[1200px] outline-none">
          {isSpecialistPending ? (
            <WaitingForApproval
              user={currentUser}
              onApproved={async () => {
                const refreshed = await api.getMe()
                setCurrentUser(refreshed)
              }}
            />
          ) : (
            <Outlet context={{ role, setRole: changeRole }} />
          )}
        </main>
      </div>

      {moreOpen && (
        <div className="fixed inset-0 z-40 bg-ink/50 lg:hidden" onClick={() => setMore(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.menu', 'Navigation menu')}
            className={`absolute inset-y-0 ${isRtl ? 'left-0' : 'right-0'} flex w-[min(88vw,360px)] flex-col overflow-y-auto bg-white p-5`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line pb-4">
              <p className="h-display text-[24px]">{t('nav.menu')}</p>
              <div className="flex items-center gap-2">
                <LanguageToggle variant="pill" />
                <button onClick={() => setMore(false)} aria-label={t('common.close', 'Close')} className="size-11 grid place-items-center rounded-full hover:bg-ink/5 cursor-pointer">
                  <X size={22} aria-hidden />
                </button>
              </div>
            </div>

            <div className="my-5 flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sand font-display font-extrabold">{initials}</span>
              <div className="min-w-0">
                <p className="truncate font-bold">{name}</p>
                <p className="text-[14px] text-ink-2">{role}</p>
              </div>
            </div>

            <nav className="flex flex-col gap-1" aria-label="Mobile app">
              {items.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/app/org'}
                  onClick={() => setMore(false)}
                  className={({ isActive }) => `min-h-12 rounded-xl px-4 flex items-center gap-3 font-semibold ${isActive ? 'bg-ink/[0.07] text-ink' : 'text-ink-2 hover:bg-ink/[0.04]'}`}
                >
                  <Icon size={20} aria-hidden /> {label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-5 border-t border-line pt-3">
              <button className="w-full min-h-12 px-4 rounded-xl flex items-center gap-3 font-semibold hover:bg-paper cursor-pointer" onClick={() => { setMore(false); go('/app/account') }}>
                <UserRound size={20} aria-hidden /> {t('nav.profile')}
              </button>
              <button className="w-full min-h-12 px-4 rounded-xl flex items-center gap-3 font-semibold hover:bg-paper cursor-pointer" onClick={() => { setMore(false); go('/app/account') }}>
                <Settings size={20} aria-hidden /> {t('nav.settings')}
              </button>
              <button
                className="w-full min-h-12 px-4 rounded-xl flex items-center gap-3 font-semibold hover:bg-ink/[0.04] cursor-pointer"
                onClick={() => {
                  setMore(false)
                  setSupportModalOpen(true)
                }}
              >
                <Headset size={20} aria-hidden /> {t('support.modal_title')}
              </button>
            </div>

            <div className="mt-auto pt-6">
              <RoleSwitch activeKey={activeDemoKey} onSelect={changeRoleByKey} />
              <button className="mt-4 w-full min-h-12 px-4 rounded-xl flex items-center gap-3 font-semibold hover:bg-paper cursor-pointer" onClick={() => { api.logout(); go('/login') }}>
                <LogOut size={20} aria-hidden /> {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>
      )}

      <SupportModal
        open={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
      />
    </div>
  )
}
