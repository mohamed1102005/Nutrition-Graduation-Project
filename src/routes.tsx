import { lazy, Suspense, type ComponentType } from 'react'
import { createBrowserRouter, Navigate, useRouteError, isRouteErrorResponse } from 'react-router'
import { NotFoundState, Btn, Card } from './ui'
import { RoleOnly } from './components/auth/RoleOnly'
import { RequireAuth } from './components/auth/RequireAuth'
export { RequireAuth }

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[40vh] p-8">
    <div className="size-8 rounded-full border-2 border-line border-t-ink animate-spin" role="status" aria-label="Loading page" />
  </div>
)

const load = <T extends ComponentType<any>>(
  factory: () => Promise<{ default: T } | { [key: string]: T }>,
  namedExport?: string
) => {
  const LazyComp = lazy(async () => {
    const mod = await factory()
    const Component = namedExport ? (mod as any)[namedExport] : ((mod as any).default || mod)
    return { default: Component }
  })
  return function LazyPageWrapper(props: any) {
    return (
      <Suspense fallback={<PageFallback />}>
        <LazyComp {...props} />
      </Suspense>
    )
  }
}

// Lazy loaded page components
const Landing = load(() => import('./pages/Landing'))
const Login = load(() => import('./pages/Auth'), 'Login')
const Signup = load(() => import('./pages/Auth'), 'Signup')
const JoinOrg = load(() => import('./pages/Auth'), 'JoinOrg')
const RegisterOrg = load(() => import('./pages/Auth'), 'RegisterOrg')
const Onboarding = load(() => import('./pages/Onboarding'))
const Shell = load(() => import('./pages/Shell'))
const Today = load(() => import('./pages/AppPages'), 'Today')
const SpecialistsList = load(() => import('./pages/client/Specialists'), 'SpecialistsList')
const SpecialistProfile = load(() => import('./pages/client/Specialists'), 'SpecialistProfile')
const MySpecialists = load(() => import('./pages/client/MySpecialists'))
const Booking = load(() => import('./pages/client/Booking'))
const Bookings = load(() => import('./pages/client/Bookings'))
const Checkout = load(() => import('./pages/client/Checkout'))
const Plan = load(() => import('./pages/client/Plan'))
const Progress = load(() => import('./pages/client/Progress'))
const AiPlan = load(() => import('./pages/client/AiPlan'))
const Session = load(() => import('./pages/client/Session'))
const Clients = load(() => import('./pages/specialist/Clients'))
const ClientDetail = load(() => import('./pages/specialist/ClientDetail'))
const Schedule = load(() => import('./pages/specialist/Schedule'))
const Overview = load(() => import('./pages/admin/Overview'))
const Users = load(() => import('./pages/admin/Users'))
const Approvals = load(() => import('./pages/admin/Approvals'))
const AdminSupport = load(() => import('./pages/admin/Support'))
const FinanceOverview = load(() => import('./pages/finance/Overview'))
const FinanceTransactions = load(() => import('./pages/finance/Transactions'))
const FinancePayouts = load(() => import('./pages/finance/Payouts'))
const FinanceSubscriptions = load(() => import('./pages/finance/Subscriptions'))
const OrgDashboard = load(() => import('./pages/org/Dashboard'))
const OrgMembers = load(() => import('./pages/org/Members'))
const OrgSpecialists = load(() => import('./pages/org/Specialists'))

const NotFound = () => <NotFoundState full />
const only = (role: 'Client' | 'Specialist' | 'Admin' | 'Finance' | 'OrgAdmin', C: ComponentType<any>) => () => <RoleOnly role={role}><C /></RoleOnly>

export function RouteErrorBoundary() {
  const error = useRouteError()
  const msg = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
    ? error.message
    : 'An unexpected application error occurred'

  return (
    <div className="min-h-screen bg-paper grid place-items-center p-6 text-center">
      <Card className="max-w-md w-full p-8">
        <div className="size-12 rounded-2xl bg-danger-tint text-danger grid place-items-center mx-auto mb-4 font-bold text-xl">
          !
        </div>
        <h2 className="text-xl font-bold text-ink">Something went wrong</h2>
        <p className="text-ink-2 text-sm mt-2 mb-6">
          {msg}
        </p>
        <div className="flex gap-3 justify-center">
          <Btn variant="secondary" onClick={() => window.location.reload()}>
            Try again
          </Btn>
          <Btn to="/app">
            Back to dashboard
          </Btn>
        </div>
      </Card>
    </div>
  )
}

export const router = createBrowserRouter([
  { path: '/', Component: Landing },
  { path: '/login', Component: Login },
  { path: '/signup', Component: Signup },
  { path: '/join', Component: JoinOrg },
  { path: '/register-org', Component: RegisterOrg },
  {
    path: '/onboarding',
    element: (
      <RequireAuth>
        <Onboarding />
      </RequireAuth>
    ),
  },
  {
    path: '/app',
    ErrorBoundary: RouteErrorBoundary,
    element: (
      <RequireAuth>
        <Shell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="today" replace /> },
      { path: 'today', Component: Today },
      { path: 'specialists', Component: only('Client', SpecialistsList) },
      { path: 'my-specialists', Component: only('Client', MySpecialists) },
      { path: 'specialists/:id', Component: only('Client', SpecialistProfile) },
      { path: 'specialists/:id/book', Component: only('Client', Booking) },
      { path: 'bookings', Component: only('Client', Bookings) },
      { path: 'bookings/checkout', Component: only('Client', Checkout) },
      { path: 'plan', Component: only('Client', Plan) },
      { path: 'progress', Component: only('Client', Progress) },
      { path: 'ai-plan', Component: only('Client', AiPlan) },
      { path: 'clients', Component: only('Specialist', Clients) },
      { path: 'clients/:id', Component: only('Specialist', ClientDetail) },
      { path: 'schedule', Component: only('Specialist', Schedule) },
      { path: 'overview', Component: only('Admin', Overview) },
      { path: 'users', Component: only('Admin', Users) },
      { path: 'approvals', Component: only('Admin', Approvals) },
      { path: 'admin/support', Component: only('Admin', AdminSupport) },
      { path: 'support', Component: only('Admin', AdminSupport) },
      { path: 'finance/overview', Component: only('Finance', FinanceOverview) },
      { path: 'finance/transactions', Component: only('Finance', FinanceTransactions) },
      { path: 'finance/payouts', Component: only('Finance', FinancePayouts) },
      { path: 'finance/subscriptions', Component: only('Finance', FinanceSubscriptions) },
      // Org admin portal routes
      { path: 'org', Component: only('OrgAdmin', OrgDashboard) },
      { path: 'org/members', Component: only('OrgAdmin', OrgMembers) },
      { path: 'org/specialists', Component: only('OrgAdmin', OrgSpecialists) },
    ],
  },
  {
    path: '/session',
    element: (
      <RequireAuth>
        <Session />
      </RequireAuth>
    ),
  },
  { path: '*', Component: NotFound },
])
