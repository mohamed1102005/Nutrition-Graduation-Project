import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  ChevronDown,
  ShieldCheck,
  Clock,
  RefreshCw,
  Link2,
  Hourglass,
  Dumbbell,
  Utensils,
  HeartPulse,
  CheckCircle2,
  Circle,
  Play,
  Flame,
  AlertTriangle,
  Info,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { Btn, Card, EmptyState, Gate, SafetyCallout, SVC, Skeleton, Tabs, type DemoState } from '../../ui'
import { api } from '../../api'
import { useLanguage } from '../../context/LanguageContext'

type Svc = 'move' | 'eat' | 'recover'
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

type Ex = { name: string; sets: string; tempo: string; rest: string; how: string; cleared: boolean }

const initialMove: Record<string, { title: string; focus: string; duration: string; ex: Ex[] } | null> = {
  Mon: {
    title: 'Upper Push & Core Stability',
    focus: 'Chest, Shoulders, Triceps',
    duration: '45 mins',
    ex: [
      { name: 'Dumbbell Bench Press', sets: '4 × 8', tempo: '3-1-1', rest: '90s', how: 'Feet flat, shoulder blades pinched into the pad. Lower dumbbells under control for 3 seconds, drive up smoothly without locking out.', cleared: true },
      { name: 'Seated Dumbbell Shoulder Press', sets: '3 × 10', tempo: '2-0-1', rest: '75s', how: 'Back supported upright. Press straight overhead, keep elbows angled roughly 30° in front of the coronal plane.', cleared: true },
      { name: 'Cable Triceps Pushdown', sets: '3 × 12', tempo: '2-0-2', rest: '60s', how: 'Elbows pinned firmly at ribs. Only forearms pivot. Squeeze triceps at full extension.', cleared: true },
    ],
  },
  Tue: null,
  Wed: {
    title: 'Lower Body (Knee-Safe Protocol)',
    focus: 'Hamstrings, Glutes, Safe Quad Load',
    duration: '50 mins',
    ex: [
      { name: 'Box Squat to 60° Knee Angle', sets: '4 × 8', tempo: '3-1-1', rest: '90s', how: 'Sit back onto calibrated bench/box at 60° flexion. Soft touch, pause 1 second, drive heels through floor. Never bounce.', cleared: true },
      { name: 'Romanian Deadlift (Dumbbell/Barbell)', sets: '3 × 10', tempo: '3-0-1', rest: '90s', how: 'Soft knee unlock, hinge deeply at hips with flat spine. Stop at mid-shin when hamstrings reach maximal tension.', cleared: true },
      { name: 'Glute-Biased Hip Thrust', sets: '3 × 12', tempo: '2-1-1', rest: '75s', how: 'Upper back anchored across bench. Drive through heels, full hip extension at top with posterior pelvic tilt.', cleared: true },
      { name: 'Bodyweight Walking Lunges', sets: '3 × 10', tempo: 'Controlled', rest: '60s', how: 'Restricted knee flexion. Held back until Dr. Mona clears patellar shear tolerance.', cleared: false },
    ],
  },
  Thu: {
    title: 'Upper Pull & Postural Health',
    focus: 'Lats, Rhomboids, Biceps',
    duration: '45 mins',
    ex: [
      { name: 'Lat Pulldown (Neutral Grip)', sets: '4 × 10', tempo: '2-1-2', rest: '75s', how: 'Drive elbows downward toward pockets. Chest elevated, squeeze lats firmly at collarbone level.', cleared: true },
      { name: 'Seated Cable Row', sets: '3 × 10', tempo: '2-1-2', rest: '75s', how: 'Maintain neutral spine. Retract scapulae first, pull handle to navel with full back contraction.', cleared: true },
      { name: 'Incline Dumbbell Curl', sets: '3 × 12', tempo: '2-0-2', rest: '60s', how: 'Arms hang perpendicular to floor on inclined bench. Strict bicep contraction, 2 second eccentric descent.', cleared: true },
    ],
  },
  Fri: null,
  Sat: {
    title: 'Posterior Chain & Core Anti-Extension',
    focus: 'Leg Press Limit, Glutes, Trunk',
    duration: '40 mins',
    ex: [
      { name: 'Leg Press (0° to 60° Mechanical Stop)', sets: '4 × 10', tempo: '3-0-1', rest: '90s', how: 'Pin mechanical safety stop strictly at 60°. Push through midfoot and heel, avoiding knee hyperextension.', cleared: true },
      { name: 'Elevated Glute Bridge', sets: '3 × 15', tempo: '2-1-1', rest: '60s', how: 'Heels tucked close to glutes. Squeeze at summit for 1 full second, maintaining rib-to-pelvis brace.', cleared: true },
      { name: 'Hollow Body Anti-Extension Plank', sets: '3 × 40s', tempo: 'Hold', rest: '45s', how: 'Forearms on floor, ribs pulled down toward pelvis, glutes clenched, deep diaphragmatic breathing.', cleared: true },
    ],
  },
  Sun: null,
}

type Meal = { name: string; what: string; kcal: number; p: number; c: number; f: number; timing: string }

const defaultMealSets: Meal[][] = [
  [
    { name: 'Breakfast', what: 'Foul medames with olive oil, 2 soft-boiled eggs, half baladi bread, fresh arugula salad', kcal: 430, p: 26, c: 46, f: 15, timing: '08:30 AM' },
    { name: 'Lunch', what: 'Charcoal-grilled chicken breast 160g, steamed Egyptian rice 130g, molokhia soup', kcal: 620, p: 48, c: 60, f: 16, timing: '02:00 PM' },
    { name: 'Afternoon Fuel', what: 'High-protein Greek yogurt, chopped raw walnuts (20g), 1 fresh banana, cinnamon', kcal: 290, p: 20, c: 28, f: 10, timing: '05:15 PM' },
    { name: 'Dinner', what: 'Lean minced kofta 130g, tahini garlic dip, garden vegetable salad, warm whole-grain pita half', kcal: 510, p: 38, c: 36, f: 22, timing: '08:45 PM' },
  ],
  [
    { name: 'Breakfast', what: 'Rolled oats cooked with whole milk, fresh dates, sliced almonds, organic honey drizzle', kcal: 410, p: 22, c: 54, f: 13, timing: '08:30 AM' },
    { name: 'Lunch', what: 'Pan-seared Nile tilapia fillet 190g, spiced brown bulgur, oven-roasted zucchini & peppers', kcal: 590, p: 46, c: 56, f: 14, timing: '02:00 PM' },
    { name: 'Afternoon Fuel', what: 'Strained artisanal labneh with crisp cucumber rounds, fresh mint, whole wheat crispbread', kcal: 250, p: 15, c: 24, f: 9, timing: '05:15 PM' },
    { name: 'Dinner', what: 'Hearty yellow lentil soup, flaked tuna salad with lemon and olive oil, 1 slice toasted sourdough', kcal: 490, p: 36, c: 44, f: 14, timing: '08:45 PM' },
  ],
]

const swaps: Record<string, { title: string; kcal: number; p: number; c: number; f: number }> = {
  Breakfast: { title: 'Shakshuka with 2 poached eggs, diced bell peppers, feta crumbles & half baladi bread', kcal: 420, p: 24, c: 42, f: 16 },
  Lunch: { title: 'Charbroiled turkey breast escalope 160g, toasted freekeh pilaf & crisp green garden salad', kcal: 590, p: 45, c: 54, f: 14 },
  'Afternoon Fuel': { title: 'Low-fat cottage cheese (Gouda/Arish) with diced plum tomatoes, olive oil & chia seeds', kcal: 260, p: 22, c: 18, f: 8 },
  Dinner: { title: 'Grilled chicken shish tawook skewers 150g, roasted tomatoes, garlic toum & roasted baby potatoes', kcal: 500, p: 40, c: 34, f: 18 },
}

const defaultRec: Ex[] = [
  { name: 'Isometric Quad Sets', sets: '3 × 15', tempo: '5s hold', rest: '30s', how: 'Supine on mat with straight leg. Fire quadriceps hard, pressing the knee popliteal space flat against floor. Hold 5 full seconds.', cleared: true },
  { name: 'Straight Leg Raise (Terminal Extension)', sets: '3 × 12', tempo: '2-1-2', rest: '30s', how: 'Lock quad firmly before elevating. Lift foot 25cm off mat smoothly. Lower with zero momentum.', cleared: true },
  { name: 'Controlled Heel Slides', sets: '2 × 15', tempo: 'Slow', rest: '30s', how: 'Slide heel smoothly toward pelvis up to comfortable 60° flexion. Gentle tension only, never cross into joint ache.', cleared: true },
  { name: 'Targeted Foam Rolling (Vastus Lateralis & Calves)', sets: '2 min/side', tempo: 'Slow sweep', rest: 'None', how: 'Roll mid-belly of muscle tissue. Pause 20s over trigger hotspots. Never apply direct pressure across patella or joint line.', cleared: true },
]

function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = Math.min(100, Math.round((value / target) * 100))
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline text-[12px]">
        <span className="font-semibold text-ink-2">{label}</span>
        <span className="font-bold text-ink num">
          {value}g <span className="text-ink-2 font-normal">/ {target}g</span>
        </span>
      </div>
      <div className="h-1.5 w-full bg-paper rounded-full overflow-hidden border border-line/60">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function ExerciseCard({
  e,
  index,
  completed,
  onToggleComplete,
  svc,
}: {
  e: Ex
  index: number
  completed: boolean
  onToggleComplete: () => void
  svc: Svc
}) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${
        completed
          ? 'bg-paper/40 border-line/50 opacity-80'
          : 'bg-white border-line hover:border-ink/30 shadow-[0_2px_8px_rgba(0,0,0,0.02)]'
      }`}
    >
      <div className="p-4 sm:p-5 flex items-start gap-3.5">
        <button
          type="button"
          onClick={onToggleComplete}
          aria-label={completed ? `Mark ${e.name} incomplete` : `Mark ${e.name} complete`}
          className={`mt-0.5 size-7 rounded-xl flex items-center justify-center shrink-0 transition cursor-pointer ${
            completed
              ? 'bg-ok text-white'
              : 'border-2 border-line hover:border-ink text-transparent hover:text-ink-2'
          }`}
        >
          {completed ? <CheckCircle2 size={18} strokeWidth={2.5} /> : <Circle size={14} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="num text-xs font-bold text-ink-2 bg-paper px-2 py-0.5 rounded-md border border-line">
              #{index + 1}
            </span>
            <h3 className={`font-bold text-[16px] text-ink leading-tight ${completed ? 'line-through text-ink-2' : ''}`}>
              {e.name}
            </h3>

            {svc !== 'eat' && (
              e.cleared ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-ok-tint text-[#1d6b3d] px-2.5 py-0.5 text-[11px] font-bold tracking-tight">
                  <ShieldCheck size={12} aria-hidden /> Cleared
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-warn-tint text-[#7a5200] px-2.5 py-0.5 text-[11px] font-bold tracking-tight">
                  <Hourglass size={12} aria-hidden /> Waiting for PT
                </span>
              )
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-[13px] text-ink-2">
            <span className="font-semibold text-ink num">
              {e.sets}
            </span>
            <span className="size-1 rounded-full bg-line" aria-hidden />
            <span>
              Tempo: <strong className="text-ink font-semibold">{e.tempo}</strong>
            </span>
            <span className="size-1 rounded-full bg-line" aria-hidden />
            <span>
              Rest: <strong className="text-ink font-semibold">{e.rest}</strong>
            </span>
          </div>

          {open && (
            <div className="mt-3.5 pt-3.5 border-t border-line text-[14px] leading-relaxed text-ink-2 bg-sand/30 p-3.5 rounded-xl">
              <p className="font-medium text-ink mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <Info size={13} className="text-ink-2" aria-hidden /> Execution & Form Cues
              </p>
              <p>{e.how}</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? 'Hide details' : 'Show details'}
          className="size-8 rounded-lg hover:bg-paper grid place-items-center text-ink-2 transition shrink-0 cursor-pointer"
        >
          <ChevronDown size={18} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  )
}

function MealCard({
  m,
  index,
  swapped,
  onToggleSwap,
}: {
  m: Meal
  index: number
  swapped: boolean
  onToggleSwap: () => void
}) {
  const currentMeal = swapped && swaps[m.name] ? swaps[m.name] : m
  const isAlt = swapped && swaps[m.name]

  return (
    <div className="bg-white rounded-2xl border border-line p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition hover:border-ink/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-ink-2 tracking-wider">{m.name}</span>
            <span className="text-xs text-ink-2 font-medium">· {m.timing}</span>
            {isAlt && (
              <span className="rounded-full bg-eat-tint text-[#24583b] px-2 py-0.5 text-[11px] font-bold">
                Swapped Choice
              </span>
            )}
          </div>
          <h3 className="font-bold text-[17px] text-ink mt-1">
            {isAlt ? currentMeal.title : m.what}
          </h3>
        </div>

        <div className="text-right shrink-0">
          <span className="num font-bold text-[20px] text-ink leading-tight block">
            {currentMeal.kcal}
          </span>
          <span className="text-[11px] uppercase font-semibold text-ink-2 tracking-wider">
            kcal
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 pt-3.5 border-t border-line/60 bg-paper/50 -mx-5 -mb-5 p-4 rounded-b-2xl">
        <div className="text-center">
          <span className="text-[11px] font-semibold text-ink-2 uppercase block">Protein</span>
          <span className="num font-bold text-[15px] text-ink">{currentMeal.p}g</span>
        </div>
        <div className="text-center border-x border-line/60">
          <span className="text-[11px] font-semibold text-ink-2 uppercase block">Carbs</span>
          <span className="num font-bold text-[15px] text-ink">{currentMeal.c}g</span>
        </div>
        <div className="text-center">
          <span className="text-[11px] font-semibold text-ink-2 uppercase block">Fats</span>
          <span className="num font-bold text-[15px] text-ink">{currentMeal.f}g</span>
        </div>
      </div>

      {swaps[m.name] && (
        <div className="mt-4 pt-1">
          <button
            type="button"
            onClick={onToggleSwap}
            className="text-[13px] font-bold text-ink hover:underline inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={13} className={isAlt ? 'rotate-180 text-ok' : ''} aria-hidden />
            {isAlt ? 'Reset to primary recommendation' : 'View approved swap alternative'}
          </button>
        </div>
      )}
    </div>
  )
}

function CareTeamBadge({
  service,
  authorName,
  authorRole,
  avatarInitial,
}: {
  service: Svc
  authorName: string
  authorRole: string
  avatarInitial: string
}) {
  const S = SVC[service]
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-line bg-white shadow-xs">
      <div className={`size-10 rounded-xl ${S.bg} text-white grid place-items-center font-bold text-sm shrink-0`}>
        {avatarInitial}
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase font-semibold text-ink-2 tracking-wider">{S.label} Specialist</p>
        <p className="font-bold text-[14px] text-ink truncate">{authorName}</p>
        <p className="text-[12px] text-ink-2 truncate">{authorRole}</p>
      </div>
    </div>
  )
}

export default function Plan() {
  const { t, isRtl } = useLanguage()
  const [tab, setTab] = useState<Svc>('move')
  const [day, setDay] = useState('Wed')
  const [state, setState] = useState<DemoState>('loaded')
  const [plansData, setPlansData] = useState<any[]>([])
  const [programInfo, setProgramInfo] = useState<{ week: number; total: number }>({ week: 3, total: 8 })
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({})
  const [swappedMeals, setSwappedMeals] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let active = true
    Promise.all([
      api.getPlans().catch(() => ({ plans: [] })),
      api.getProfile().catch(() => ({ profile: {} })),
    ]).then(([plansRes, profRes]) => {
      if (!active) return
      if (plansRes?.plans) {
        setPlansData(plansRes.plans)
      }
      if (profRes?.profile) {
        const p = profRes.profile
        const total = p.program_weeks || p.programWeeks || 8
        let cur = 1
        if (p.plan_start_date || p.planStartDate) {
          const start = new Date(p.plan_start_date || p.planStartDate)
          const diffDays = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24))
          cur = Math.max(1, Math.min(total, Math.floor(diffDays / 7) + 1))
        }
        setProgramInfo({ week: cur, total })
      }
    })
    return () => { active = false }
  }, [])

  // Process plans from API
  const movePlan = plansData.find((p) => p.service === 'move')
  const eatPlan = plansData.find((p) => p.service === 'eat')
  const recoverPlan = plansData.find((p) => p.service === 'recover')

  // Move plan by day
  const moveByDay: Record<string, { title: string; focus: string; duration: string; ex: Ex[] } | null> = { ...initialMove }
  if (movePlan && Array.isArray(movePlan.days)) {
    dayNames.forEach((dName, idx) => {
      const dayNum = idx + 1
      const dayData = movePlan.days.find((d: any) => d.dayOfWeek === dayNum)
      if (dayData && dayData.items && dayData.items.length > 0) {
        const firstTitle = dayData.items[0]?.title || ''
        const title = firstTitle.toLowerCase().includes('squat') ? 'Lower, knee-safe' : firstTitle.toLowerCase().includes('lat') ? 'Upper pull' : 'Upper push'
        moveByDay[dName] = {
          title: dayData.items[0]?.categoryTitle || title,
          focus: 'Targeted strength protocol',
          duration: '45 mins',
          ex: dayData.items.map((it: any) => ({
            name: it.title,
            sets: it.sets ? `${it.sets} × ${it.reps || 10}` : '3 × 10',
            tempo: it.tempo || '2-0-1',
            rest: it.restSec ? `${it.restSec}s` : '60s',
            how: it.instructions || it.safetyNote || 'Follow proper form and tempo.',
            cleared: it.ptCleared !== false,
          })),
        }
      } else {
        moveByDay[dName] = null
      }
    })
  }

  // Eat plan by day
  const dayIndex = dayNames.indexOf(day)
  let meals: Meal[] = defaultMealSets[dayIndex % 2]
  let totalKcal = 1850
  let totalProtein = 132
  let totalCarbs = 162
  let totalFat = 63

  if (eatPlan && Array.isArray(eatPlan.days)) {
    const dayNum = dayIndex + 1
    const dayData = eatPlan.days.find((d: any) => d.dayOfWeek === dayNum)
    if (dayData && dayData.items && dayData.items.length > 0) {
      meals = dayData.items.map((it: any) => ({
        name: it.mealType || 'Meal',
        what: it.title,
        kcal: it.kcal || 450,
        p: it.proteinG || 30,
        c: it.carbsG || 45,
        f: it.fatG || 15,
        timing: 'Scheduled Meal',
      }))
      totalKcal = meals.reduce((sum, m) => sum + m.kcal, 0)
      totalProtein = meals.reduce((sum, m) => sum + m.p, 0)
      totalCarbs = meals.reduce((sum, m) => sum + m.c, 0)
      totalFat = meals.reduce((sum, m) => sum + m.f, 0)
    }
  }

  // Recover plan items
  let recExercises: Ex[] = defaultRec
  if (recoverPlan && Array.isArray(recoverPlan.days)) {
    const allRecoverItems: any[] = []
    recoverPlan.days.forEach((d: any) => {
      if (Array.isArray(d.items)) {
        d.items.forEach((it: any) => {
          if (!allRecoverItems.some((x) => x.title === it.title)) {
            allRecoverItems.push(it)
          }
        })
      }
    })
    if (allRecoverItems.length > 0) {
      recExercises = allRecoverItems.map((it: any) => ({
        name: it.title,
        sets: it.sets ? `${it.sets} × ${it.reps || 15}` : '2 × 15',
        tempo: it.tempo || 'Slow',
        rest: it.restSec ? `${it.restSec}s` : '30s',
        how: it.instructions || 'Perform with controlled tempo and pain within limits.',
        cleared: it.ptCleared !== false,
      }))
    }
  }

  const currentMoveWorkout = moveByDay[day]
  const coordinationSummary = movePlan?.summary || "Squats are strictly limited to 60° knee flexion by Dr. Mona Fathy (PT). Coach Karim calibrated all lower movements to box squats, and Hana increased dietary leucine & protein to accelerate knee tendon collagen synthesis."

  const toggleComplete = (id: string) => {
    setCompletedItems((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleSwap = (mealName: string) => {
    setSwappedMeals((prev) => ({ ...prev, [mealName]: !prev[mealName] }))
  }

  const totalExercises = currentMoveWorkout ? currentMoveWorkout.ex.length : 0
  const completedCount = currentMoveWorkout
    ? currentMoveWorkout.ex.filter((_, idx) => completedItems[`${day}-${idx}`]).length
    : 0

  return (
    <div className="space-y-6">
      {/* Top Protocol Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="num font-bold text-xs bg-ink text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {t('plan.active_protocol', 'Active Protocol')}
            </span>
            <span className="text-sm font-semibold text-ink-2">
              {t('plan.week_of', 'Week {cur} of {total}').replace('{cur}', String(programInfo.week)).replace('{total}', String(programInfo.total))}
            </span>
          </div>
          <h1 className="h-display text-[26px] sm:text-[32px] text-ink leading-tight tracking-tight">
            {t('plan.title', 'Integrated Health & Performance Plan')}
          </h1>
          <p className="text-ink-2 text-sm max-w-2xl mt-1">
            {t('plan.subtitle', 'Coordinated care managed in real-time by your designated trainer, clinical dietitian, and physical therapist.')}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Btn to="/session" className="gap-2">
            <Play size={16} fill="currentColor" aria-hidden /> {t('plan.launch_session', "Launch Today's Session")}
          </Btn>
        </div>
      </div>

      {/* Multi-Disciplinary Care Sync Banner */}
      <div className="rounded-2xl border border-line bg-sand/30 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-line/60 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="size-8 rounded-xl bg-ink text-white grid place-items-center shrink-0">
              <Link2 size={16} aria-hidden />
            </span>
            <div>
              <h2 className="font-bold text-[16px] text-ink">{t('plan.sync_title', 'Synchronized Clinical Team Alignment')}</h2>
              <p className="text-xs text-ink-2">{t('plan.sync_subtitle', "All three specialists review and calibrate each other's protocol changes")}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ok bg-ok-tint px-3 py-1 rounded-full w-fit">
            <ShieldCheck size={14} aria-hidden /> {t('plan.verified', 'Care Plan 100% Verified')}
          </span>
        </div>

        <p className="text-[14px] leading-relaxed text-ink/90 font-medium max-w-4xl">
          "{coordinationSummary}"
        </p>

        <div className="grid sm:grid-cols-3 gap-3 pt-1">
          <CareTeamBadge service="move" authorName="Coach Karim Adel" authorRole="Strength & Conditioning" avatarInitial="KA" />
          <CareTeamBadge service="eat" authorName="Hana Mostafa, RD" authorRole="Clinical Sports Dietitian" avatarInitial="HM" />
          <CareTeamBadge service="recover" authorName="Dr. Mona Fathy, PT" authorRole="Senior Physical Therapist" avatarInitial="MF" />
        </div>
      </div>

      {/* Service Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <Tabs
          label="Plan Category"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'move', label: t('plan.tab_move', 'Move · Strength & Conditioning'), icon: <Dumbbell size={15} aria-hidden /> },
            { id: 'eat', label: t('plan.tab_eat', 'Eat · Nutrition & Fueling'), icon: <Utensils size={15} aria-hidden /> },
            { id: 'recover', label: t('plan.tab_recover', 'Recover · Physical Therapy'), icon: <HeartPulse size={15} aria-hidden /> },
          ]}
        />

        {tab === 'move' && currentMoveWorkout && (
          <div className="text-sm font-semibold text-ink-2">
            {t('plan.completed_stat', 'Completed: {count} / {total} exercises').replace('{count}', String(completedCount)).replace('{total}', String(totalExercises))}
          </div>
        )}
      </div>

      <Gate
        state={state}
        retry={() => setState('loaded')}
        skeleton={<div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div>}
        empty={
          <Card className="p-8">
            <EmptyState
              title="No active protocol published"
              text="Your specialist team is configuring your weekly schedule."
              action={<Btn to="/app/specialists">Browse Care Team</Btn>}
            />
          </Card>
        }
      >
        {/* Day Selector for Move & Eat tabs */}
        {tab !== 'recover' && (
          <div className="space-y-2">
            <div role="radiogroup" aria-label="Training Days" className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {dayNames.map((d) => {
                const isSelected = day === d
                const isTrainingDay = tab === 'move' ? Boolean(moveByDay[d]) : true
                return (
                  <button
                    key={d}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setDay(d)}
                    className={`min-h-14 p-2 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                      isSelected
                        ? 'bg-ink text-white border-ink shadow-sm'
                        : 'bg-white border-line hover:border-ink/40 text-ink'
                    }`}
                  >
                    <span className="text-[11px] uppercase tracking-wider font-semibold opacity-80">{d}</span>
                    <span className={`size-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : isTrainingDay ? 'bg-ink' : 'bg-line'}`} />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* MOVE TAB */}
        {tab === 'move' && (
          <div className="space-y-4">
            {currentMoveWorkout ? (
              <div className="space-y-4">
                <Card className="p-5 sm:p-6 bg-white border border-line">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-2 mb-1">
                        <Calendar size={13} aria-hidden /> {day}'s Training Session · {currentMoveWorkout.duration}
                      </div>
                      <h2 className="h-display text-[22px] sm:text-[24px] font-bold text-ink">
                        {currentMoveWorkout.title}
                      </h2>
                      <p className="text-sm text-ink-2 mt-0.5">
                        Focus: <strong className="text-ink font-semibold">{currentMoveWorkout.focus}</strong>
                      </p>
                    </div>

                    <Btn to="/session" variant="secondary" className="gap-2 shrink-0">
                      <Play size={14} fill="currentColor" aria-hidden /> Enter Guided Session
                    </Btn>
                  </div>
                </Card>

                <div className="space-y-3">
                  {currentMoveWorkout.ex.map((e, idx) => (
                    <ExerciseCard
                      key={e.name}
                      e={e}
                      index={idx}
                      completed={Boolean(completedItems[`${day}-${idx}`])}
                      onToggleComplete={() => toggleComplete(`${day}-${idx}`)}
                      svc="move"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <Card className="p-12 text-center">
                <div className="size-12 rounded-2xl bg-sand text-ink grid place-items-center mx-auto mb-3">
                  <Sparkles size={22} aria-hidden />
                </div>
                <h3 className="h-display text-[20px] font-bold text-ink">{t('plan.rest_day_title', 'Scheduled Rest & Regeneration Day')}</h3>
                <p className="text-ink-2 text-sm max-w-md mx-auto mt-2">
                  {t('plan.rest_day_desc', 'Recovery is where tissue remodeling and strength gains occur. Aim for 7,000 brisk steps, adequate hydration, and prioritize 8 hours of sleep.')}
                </p>
                <div className="mt-5">
                  <Btn variant="secondary" onClick={() => setTab('recover')}>
                    {t('plan.tab_recover', 'View Active Rehab Protocols')}
                  </Btn>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* EAT TAB */}
        {tab === 'eat' && (
          <div className="space-y-5">
            {/* Macro Summary Dashboard */}
            <Card className="p-5 sm:p-6 bg-white border-line">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <span className="text-xs uppercase font-bold text-ink-2 tracking-wider">
                    {day}'s Nutritional Blueprint
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="num font-bold text-[32px] text-ink leading-none">
                      {totalKcal.toLocaleString('en-US')}
                    </span>
                    <span className="text-ink-2 text-sm font-semibold">kcal total budget</span>
                  </div>
                  <p className="text-xs text-ink-2 mt-1">
                    Prescribed by Hana Mostafa, RD based on your training load & joint recovery needs.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 max-w-lg">
                  <MacroBar label="Protein" value={totalProtein} target={130} color="#14161A" />
                  <MacroBar label="Carbohydrates" value={totalCarbs} target={170} color="#D97706" />
                  <MacroBar label="Healthy Fats" value={totalFat} target={65} color="#059669" />
                </div>
              </div>
            </Card>

            {/* Meals List */}
            <div className="grid md:grid-cols-2 gap-4">
              {meals.map((m, idx) => (
                <MealCard
                  key={m.name}
                  m={m}
                  index={idx}
                  swapped={Boolean(swappedMeals[m.name])}
                  onToggleSwap={() => toggleSwap(m.name)}
                />
              ))}
            </div>
          </div>
        )}

        {/* RECOVER TAB */}
        {tab === 'recover' && (
          <div className="space-y-5">
            <SafetyCallout title={t('plan.rehab_callout_title', 'Knee Rehabilitation & Joint Safety Protocol')}>
              {t('plan.rehab_callout_desc', 'Dr. Mona Fathy has established a hard 4/10 pain threshold. If patellar ache exceeds 4/10, immediately pause Quad Sets and heel slides, apply ice for 15 minutes, and submit a log via your daily progress tracker.')}
            </SafetyCallout>

            <Card className="p-5 sm:p-6 bg-white border-line">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ok mb-1">
                    <ShieldCheck size={14} aria-hidden /> {t('plan.pt_routine', 'Daily Physical Therapy Routine')}
                  </div>
                  <h2 className="h-display text-[22px] sm:text-[24px] font-bold text-ink">
                    Patellar Tendon Loading & Mobility
                  </h2>
                  <p className="text-sm text-ink-2 mt-0.5">
                    {t('plan.pt_desc', 'Perform daily on both limbs, ideally 30 minutes prior to training or in the late afternoon.')}
                  </p>
                </div>

                <Btn to="/session" className="gap-2 shrink-0">
                  <Play size={14} fill="currentColor" aria-hidden /> {t('plan.enter_session', 'Start Guided Routine')}
                </Btn>
              </div>
            </Card>

            <div className="space-y-3">
              {recExercises.map((e, idx) => (
                <ExerciseCard
                  key={e.name}
                  e={e}
                  index={idx}
                  completed={Boolean(completedItems[`rec-${idx}`])}
                  onToggleComplete={() => toggleComplete(`rec-${idx}`)}
                  svc="recover"
                />
              ))}
            </div>
          </div>
        )}
      </Gate>
    </div>
  )
}
