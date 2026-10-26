import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  Plus,
  TrendingDown,
  Dumbbell,
  HeartPulse,
  Scale,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'
import {
  Btn,
  Card,
  Dialog,
  EmptyState,
  Field,
  Gate,
  inputCls,
  PageHead,
  PainChip,
  Segment,
  Skeleton,
  type DemoState,
} from '../../ui'

export const labels = ['28 Jul', '4 Aug', '11 Aug', '18 Aug', '25 Aug', '1 Sep', '8 Sep', '15 Sep', '22 Sep', '29 Sep', '6 Oct', '13 Oct']
const baseWeight = [76.4, 76.1, 75.9, 75.8, 75.2, 75.0, 74.6, 74.5, 74.1, 73.6, 73.2, 72.8]
const baseWorkouts = [1, 2, 2, 3, 2, 3, 3, 4, 3, 4, 4, 3]
const basePain = [6, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 3]

import { LineChart } from '@/components/charts/LineChart'
import { BarChart } from '@/components/charts/BarChart'
import { api } from '../../api'

export { LineChart, BarChart }

export default function Progress() {
  const [range, setRange] = useState('8 weeks')
  const [state, setState] = useState<DemoState>('loaded')
  const [open, setOpen] = useState(false)
  const [weight, setWeight] = useState(baseWeight)
  const [pain, setPain] = useState(basePain)
  const [workouts, setWorkouts] = useState(baseWorkouts)
  const [chartLabels, setChartLabels] = useState(labels)
  const [safeLimit, setSafeLimit] = useState(4)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ w: '', done: 'Yes', pain: '', note: '' })
  const [err, setErr] = useState<Record<string, string>>({})

  const rangeParam = range === '4 weeks' ? '4w' : range === '8 weeks' ? '8w' : 'all'

  const loadProgress = async () => {
    try {
      const res = await api.getProgress(rangeParam)
      if (res) {
        if (res.safeLimit !== undefined) setSafeLimit(res.safeLimit)

        // Process weight logs
        if (Array.isArray(res.weight) && res.weight.length > 0) {
          const wVals = res.weight.map((x) => x.value)
          const wDates = res.weight.map((x) => {
            const d = new Date(x.date)
            return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
          })
          setWeight(wVals)
          setChartLabels(wDates)
        }

        // Process pain logs
        if (Array.isArray(res.pain) && res.pain.length > 0) {
          setPain(res.pain.map((x) => x.value))
        }

        // Process workouts
        if (Array.isArray(res.workoutsPerWeek) && res.workoutsPerWeek.length > 0) {
          setWorkouts(res.workoutsPerWeek.map((x) => x.count))
        }
      }
    } catch (e) {
      console.error('Failed to load progress from API:', e)
    }
  }

  useEffect(() => {
    loadProgress()
  }, [rangeParam])

  const k = range === '4 weeks' ? 4 : range === '8 weeks' ? 8 : 12
  const sl = <T,>(a: T[]) => a.slice(Math.max(0, a.length - k))
  const L = sl(chartLabels)
  const wt = sl(weight)
  const wk = sl(workouts)
  const pn = sl(pain)

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const v: Record<string, string> = {}
    const w = Number(form.w)
    if (!form.w || isNaN(w) || w < 30 || w > 250) v.w = 'Enter your weight in kg, between 30 and 250.'
    if (form.pain === '' || Number(form.pain) < 0 || Number(form.pain) > 10) v.pain = 'Choose a pain level from 0 to 10.'
    setErr(v)
    if (Object.keys(v).length) return

    try {
      await api.logProgress({
        weightKg: w,
        workoutDone: form.done === 'Yes',
        painLevel: Number(form.pain),
        note: form.note || undefined,
      })
      await loadProgress()
      setOpen(false)
      setToast(Number(form.pain) > 4 ? 'Entry recorded. Pain is elevated (>4/10) — Dr. Mona Fathy was automatically notified.' : 'Entry recorded. Your clinical recovery metrics are updated.')
      setForm({ w: '', done: 'Yes', pain: '', note: '' })
    } catch (error: any) {
      console.error('Failed to save progress entry:', error)
      alert(error.message || 'Failed to save progress entry.')
    }
  }

  const delta = wt.length >= 2 ? (wt[wt.length - 1] - wt[0]).toFixed(1) : '0.0'
  const minW = wt.length > 0 ? Math.floor(Math.min(...wt)) - 1 : 70
  const maxW = wt.length > 0 ? Math.ceil(Math.max(...wt)) + 1 : 78
  const stepW = Math.max(1, Math.round((maxW - minW) / 4))
  const ticksW = [minW, minW + stepW, minW + stepW * 2, minW + stepW * 3, maxW]
  const currentPain = pn[pn.length - 1] ?? 3
  const targetWorkoutsMet = wk.filter((x) => x >= 4).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded-full bg-ink text-white tracking-wider">
              Health Analytics
            </span>
            <span className="text-xs text-ink-2 font-medium">Synchronized Daily Log</span>
          </div>
          <h1 className="h-display text-[26px] sm:text-[32px] text-ink leading-tight tracking-tight">
            Progress & Recovery Trends
          </h1>
          <p className="text-sm text-ink-2 max-w-2xl mt-1">
            Tracking the relationship between body weight, training volume adherence, and patellar joint pain reduction.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Btn onClick={() => setOpen(true)} className="gap-2">
            <Plus size={16} aria-hidden /> Log Daily Vitals
          </Btn>
        </div>
      </div>

      {toast && (
        <div role="status" className="rounded-xl bg-ok-tint border border-ok/30 p-4 text-xs font-bold text-[#1d6b3d] flex items-center gap-2.5">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Metric Highlight Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Weight Stat */}
        <Card className="p-5 bg-white border border-line">
          <div className="flex items-center justify-between text-xs font-semibold text-ink-2 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Scale size={14} /> Current Weight</span>
            <span className="text-ok font-bold">Trend Down</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="num text-[32px] font-bold text-ink leading-none">{wt[wt.length - 1]}</span>
            <span className="text-sm text-ink-2 font-medium">kg</span>
          </div>
          <p className="text-xs text-ink-2 mt-1">
            <strong className="text-ink num font-semibold">{Number(delta) > 0 ? `+${delta}` : delta} kg</strong> net change over {range}
          </p>
        </Card>

        {/* Knee Pain Stat */}
        <Card className="p-5 bg-white border border-line">
          <div className="flex items-center justify-between text-xs font-semibold text-ink-2 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><HeartPulse size={14} /> Joint Symptom Score</span>
            <span className="text-ok font-bold">Protected</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="num text-[32px] font-bold text-ink leading-none">{currentPain}</span>
            <span className="text-sm text-ink-2 font-medium">/ 10</span>
          </div>
          <p className="text-xs text-ink-2 mt-1">
            Safe ceiling: <strong className="text-ink num font-semibold">{safeLimit}/10</strong> (Dr. Mona Protocol)
          </p>
        </Card>

        {/* Adherence Stat */}
        <Card className="p-5 bg-white border border-line">
          <div className="flex items-center justify-between text-xs font-semibold text-ink-2 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Dumbbell size={14} /> Target Consistency</span>
            <span className="text-ink font-bold num">{Math.round((targetWorkoutsMet / wk.length) * 100)}%</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="num text-[32px] font-bold text-ink leading-none">{targetWorkoutsMet}</span>
            <span className="text-sm text-ink-2 font-medium">of {wk.length} weeks on target</span>
          </div>
          <p className="text-xs text-ink-2 mt-1">
            Target: 4 structured sessions weekly
          </p>
        </Card>
      </div>

      {/* Range Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Segment
          label="Time Range"
          options={['4 weeks', '8 weeks', 'All']}
          value={range}
          onChange={setRange}
        />
        <span className="text-xs font-semibold text-ink-2 bg-paper px-3 py-1.5 rounded-lg border border-line">
          Reporting Window: <strong className="text-ink">{L[0]} — {L[L.length - 1]}</strong>
        </span>
      </div>

      <Gate
        state={state}
        retry={() => setState('loaded')}
        skeleton={<div className="grid gap-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-64" />)}</div>}
        empty={
          <Card className="p-8">
            <EmptyState
              title="No entries recorded yet"
              text="Log your weight and knee pain to generate your clinical trend lines."
              action={<Btn onClick={() => setOpen(true)}>Log Today's Entry</Btn>}
            />
          </Card>
        }
      >
        <div className="grid gap-6">
          {/* Main Weight Chart */}
          <Card className="p-6 bg-white border border-line space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingDown size={18} className="text-ink-2" aria-hidden />
                  <h2 className="font-bold text-[18px] text-ink">Body Mass Trajectory</h2>
                </div>
                <p className="text-xs text-ink-2">Calculated from calibrated morning weigh-ins</p>
              </div>
              <div className="text-right">
                <span className="num font-bold text-[22px] text-ink">
                  {Number(delta) > 0 ? `+${delta}` : delta} kg
                </span>
                <span className="text-xs text-ink-2 block">since {L[0]}</span>
              </div>
            </div>

            <LineChart
              labels={L}
              data={wt}
              min={minW}
              max={maxW}
              ticks={ticksW}
              unit="kg"
              color="#14161A"
              desc={`Weight trend from ${wt[0]} to ${wt[wt.length - 1]} kg.`}
            />
          </Card>

          {/* 2-Column Grid: Workouts vs Pain */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Workouts Bar Chart */}
            <Card className="p-6 bg-white border border-line space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div>
                  <div className="flex items-center gap-2">
                    <Dumbbell size={18} className="text-ink-2" aria-hidden />
                    <h2 className="font-bold text-[17px] text-ink">Training Volume (Sessions / Wk)</h2>
                  </div>
                  <p className="text-xs text-ink-2">Prescribed volume: 4 sessions weekly</p>
                </div>
                <span className="text-xs font-bold text-ok bg-ok-tint px-2.5 py-1 rounded-full">
                  Target Met: {targetWorkoutsMet} / {wk.length}
                </span>
              </div>

              <BarChart labels={L} data={wk} target={4} />
            </Card>

            {/* Knee Pain Symptom Line Chart */}
            <Card className="p-6 bg-white border border-line space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div>
                  <div className="flex items-center gap-2">
                    <HeartPulse size={18} className="text-ink-2" aria-hidden />
                    <h2 className="font-bold text-[17px] text-ink">Knee Joint Symptom Trajectory</h2>
                  </div>
                  <p className="text-xs text-ink-2">Hard safety threshold set at {safeLimit}/10</p>
                </div>
                <PainChip n={currentPain} />
              </div>

              <LineChart
                labels={L}
                data={pn}
                min={0}
                max={10}
                ticks={[0, 2, 4, 6, 8, 10]}
                unit="/10"
                color="#14161A"
                safeBelow={safeLimit}
                desc={`Knee pain scale tracked from ${pn[0]} down to ${currentPain} out of 10.`}
              />
            </Card>
          </div>
        </div>
      </Gate>

      {/* Log Today Modal */}
      <Dialog open={open} onClose={() => setOpen(false)} title="Log Today's Health Vitals" side>
        <form onSubmit={save} noValidate className="space-y-5">
          <Field label="Body Weight (kg)" error={err.w} helper="Weigh yourself after waking and prior to breakfast">
            {(p) => (
              <input
                {...p}
                inputMode="decimal"
                placeholder="72.6"
                className={`${inputCls} num text-base`}
                value={form.w}
                onChange={(e) => setForm({ ...form, w: e.target.value })}
              />
            )}
          </Field>

          <div>
            <label className="text-xs uppercase font-bold text-ink-2 tracking-wider block mb-2">
              Did you complete your scheduled workout?
            </label>
            <Segment
              label="Workout done"
              options={['Yes', 'No', 'Rest day']}
              value={form.done}
              onChange={(v) => setForm({ ...form, done: v })}
            />
          </div>

          <div>
            <label className="text-xs uppercase font-bold text-ink-2 tracking-wider block mb-2" id="pain-lbl">
              Knee Joint Discomfort (0 to 10 Scale)
            </label>
            <div role="radiogroup" aria-labelledby="pain-lbl" className="grid grid-cols-6 gap-2">
              {Array.from({ length: 11 }, (_, i) => {
                const isSelected = form.pain === String(i)
                const isSevere = i > 4
                return (
                  <button
                    type="button"
                    key={i}
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setForm({ ...form, pain: String(i) })}
                    className={`min-h-12 rounded-xl border font-bold text-sm cursor-pointer num transition ${
                      isSelected
                        ? 'bg-ink text-white border-ink shadow-sm'
                        : isSevere
                        ? 'bg-warn-tint/40 border-warn-tint hover:border-ink/40 text-ink'
                        : 'bg-white border-line hover:border-ink text-ink'
                    }`}
                  >
                    {i}
                  </button>
                )
              })}
            </div>

            {err.pain && <p role="alert" className="text-bad font-semibold text-xs mt-2">{err.pain}</p>}

            {Number(form.pain) > 4 && form.pain !== '' && (
              <div className="mt-3 rounded-xl bg-warn-tint border border-warn/30 p-3 text-xs text-[#7a5200] leading-relaxed">
                <strong className="block font-bold">Pain Above Safe Threshold ({form.pain}/10):</strong>
                Pause active quad loading today. Dr. Mona Fathy will be alerted immediately upon submission.
              </div>
            )}
          </div>

          <Field label="Clinical Observation or Notes (Optional)" helper="Any swelling, sleep quality notes, or muscle tightness">
            {(p) => (
              <textarea
                {...p}
                rows={3}
                placeholder="e.g. Mild tightness in right patellar tendon after morning stairs..."
                className={`${inputCls} h-auto py-3 text-sm leading-relaxed`}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            )}
          </Field>

          <div className="flex gap-3 justify-end pt-3 border-t border-line">
            <Btn type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Btn>
            <Btn type="submit">Submit Daily Log</Btn>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
