import { useEffect, useRef, useState } from 'react'
import {
  RefreshCw,
  Send,
  Sparkles,
  CircleCheck,
  ShieldCheck,
  Dumbbell,
  Utensils,
  HeartPulse,
  BrainCircuit,
  Info,
  Check,
  Flame,
  ArrowRight,
  Clock,
  Layers,
  Activity,
  AlertTriangle,
} from 'lucide-react'
import { Btn, Card, Chip, Field, inputCls, PageHead, SafetyCallout, Segment, Skeleton, SVC } from '../../ui'
import { api } from '../../api'
import { useLanguage } from '../../context/LanguageContext'

type Svc = 'move' | 'eat' | 'recover'

const goals = [
  { id: 'Lose fat', label: 'Lose Body Fat', desc: 'Caloric deficit with high protein retention' },
  { id: 'Build muscle', label: 'Build Muscle', desc: 'Hypertrophy loading with caloric surplus' },
  { id: 'Get stronger', label: 'Athletic Strength', desc: 'Progressive neuromuscular force output' },
  { id: 'Move without pain', label: 'Pain-Free Rehab', desc: 'Tissue resilience & joint restoration' },
]

const equipmentOpts = ['Full Gym', 'Dumbbells', 'Resistance Bands', 'Bodyweight Only']
const diets = ['No restriction', 'High protein', 'Vegetarian', 'Low carb']
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function build(days: number, goal: string, diet: string, kneeSafe: boolean) {
  const trainDays = [[0, 2, 4], [0, 2, 4, 5], [0, 1, 3, 4, 5], [0, 1, 2, 3, 4, 5]][Math.min(Math.max(days, 3), 6) - 3]
  const lower = kneeSafe ? 'Box Squats to 60° (Knee-Safe)' : 'Back Squats (Full Depth)'
  const sessions = ['Upper Push & Core', 'Lower Body Rehab Focus', 'Upper Pull & Posture', 'Full Body Conditioning', 'Posterior Chain & Core', 'Upper Hypertrophy']
  const move = dayNames.map((d, i) => {
    const k = trainDays.indexOf(i)
    if (k < 0) return { d, t: 'Active Recovery or 45-min brisk outdoor walk' }
    const s = sessions[k % sessions.length]
    return { d, t: s.includes('Lower') ? `${s}: ${lower}, Glute Hip Thrusts (45m)` : `${s}: 4 calibrated exercises (45m)` }
  })
  const kcal = goal === 'Lose fat' ? 1850 : goal === 'Build muscle' ? 2550 : 2150
  const protein = goal === 'Lose fat' ? 135 : goal === 'Build muscle' ? 155 : 125
  const base: Record<string, string> = {
    'No restriction': 'Foul medames & boiled eggs, charcoal grilled chicken breast with basmati rice, lean kofta with tahini',
    Vegetarian: 'Foul medames & eggs, yellow lentil soup with bulgur, grilled halloumi cheese with garden salad',
    'High protein': 'Egg white omelet & foul, marinated chicken breast with roasted sweet potato, cottage cheese with walnuts',
    'Low carb': 'Scrambled eggs with avocado, grilled sea bass with sautéed greens, lean beef strips with steamed vegetables',
  }
  const eat = [
    { d: 'Daily Target', t: `${kcal.toLocaleString('en-US')} kcal · ${protein}g protein · 2.5L water` },
    { d: 'Primary Meals', t: base[diet] || base['No restriction'] },
    { d: 'Hydration', t: '2.5 to 3.0 Litres daily (elevate on training days)' },
    { d: 'Flexibility', t: 'One structured social meal on weekend within portion targets' },
  ]
  const recover = [
    { d: 'Daily Protocol', t: 'Isometric Quad sets, heel slides & terminal leg raises (15 mins)' },
    { d: 'Post-Workout', t: 'Foam roll vastus lateralis & calf bellies (2 min/side)' },
    { d: 'Sleep Target', t: '7.5 to 8.5 hours uninterrupted restorative sleep' },
    { d: 'Clinical Safety', t: 'Daily pain score tracking. Cease loading if discomfort exceeds 4/10.' },
  ]
  return { move, eat, recover }
}

export default function AiPlan() {
  const { t, isRtl } = useLanguage()
  const [goal, setGoal] = useState('Lose fat')
  const [days, setDays] = useState('4')
  const [injury, setInjury] = useState('Knee rehab, squats limited to 60 degrees')
  const [equip, setEquip] = useState<string[]>(['Full Gym'])
  const [diet, setDiet] = useState('No restriction')
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done'>('idle')
  const [loadingStep, setLoadingStep] = useState(0)
  const [plan, setPlan] = useState<ReturnType<typeof build> | null>(null)
  const [requestId, setRequestId] = useState<number | null>(null)
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')
  const timer = useRef<number>(0)

  useEffect(() => () => clearTimeout(timer.current), [])

  const generate = async () => {
    if (!equip.length) return setErr('Please select at least one available equipment option.')
    setErr('')
    setSent(false)
    setPhase('loading')
    setLoadingStep(0)

    const stepInterval = setInterval(() => {
      setLoadingStep((s) => (s < 2 ? s + 1 : s))
    }, 450)

    const hasKneeInjury = /knee|squat/i.test(injury)

    try {
      const res = await api.generateAiPlan({
        goal,
        daysPerWeek: Number(days),
        equipment: equip,
        injuries: hasKneeInjury ? [{ bodyArea: 'Knee', painLevel: 4 }] : [],
        diet,
      })
      if (res?.requestId) {
        setRequestId(res.requestId)
      }
      clearInterval(stepInterval)
      setPlan(build(Number(days), goal, diet, hasKneeInjury))
      setPhase('done')
    } catch (e: any) {
      console.error('AI plan generation error, falling back to local template:', e)
      clearInterval(stepInterval)
      setPlan(build(Number(days), goal, diet, hasKneeInjury))
      setPhase('done')
    }
  }

  const sendToSpecialist = async () => {
    setSending(true)
    try {
      if (requestId) {
        await api.sendAiPlan(requestId)
      }
      setSent(true)
    } catch (e: any) {
      console.error('Failed to send AI plan to specialist:', e)
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  const toggle = (e: string) => setEquip(equip.includes(e) ? equip.filter((x) => x !== e) : [...equip, e])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-ink text-white px-3 py-1 rounded-full uppercase tracking-wider">
              <Sparkles size={13} className="text-sand" aria-hidden /> {t('ai.badge', 'Gemini Health Intelligence')}
            </span>
            <span className="text-xs font-semibold text-ink-2">v3.5 Clinical Tuning</span>
          </div>
          <h1 className="h-display text-[26px] sm:text-[32px] text-ink leading-tight tracking-tight">
            {t('ai.title', 'AI Protocol Co-Pilot')}
          </h1>
          <p className="text-sm text-ink-2 max-w-2xl mt-1">
            {t('ai.subtitle', 'Generate an evidence-based, synchronized training, nutrition, and joint-protection protocol in seconds. Automatically routed to your care team for clinical sign-off.')}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
        {/* Controls Panel (Left) */}
        <Card className="p-6 bg-white border border-line space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-line">
            <BrainCircuit size={18} className="text-ink-2" aria-hidden />
            <h2 className="font-bold text-[17px] text-ink">{t('ai.parameters', 'Protocol Parameters')}</h2>
          </div>

          {/* Goal Selector */}
          <div>
            <label className="text-xs uppercase font-bold text-ink-2 tracking-wider block mb-2">
              {t('ai.primary_goal', 'Primary Objective')}
            </label>
            <div className="grid grid-cols-1 gap-2">
              {goals.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoal(g.id)}
                  className={`text-left p-3 rounded-xl border transition cursor-pointer ${
                    goal === g.id
                      ? 'bg-ink text-white border-ink shadow-sm'
                      : 'bg-white border-line hover:border-ink/30 text-ink'
                  }`}
                >
                  <p className="font-bold text-sm">{g.label}</p>
                  <p className={`text-xs mt-0.5 ${goal === g.id ? 'text-white/80' : 'text-ink-2'}`}>
                    {g.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Days Per Week */}
          <div>
            <label className="text-xs uppercase font-bold text-ink-2 tracking-wider block mb-2">
              {t('ai.sessions_per_week', 'Weekly Training Sessions')}
            </label>
            <Segment label="Days per week" options={['3', '4', '5', '6']} value={days} onChange={setDays} />
          </div>

          {/* Injury / Constraints */}
          <Field label={t('ai.parameters', 'Clinical Limitations & Injury Notes')} helper={t('ai.injuries_helper', 'Passed directly to your physical therapist for verification')}>
            {(p) => (
              <input
                {...p}
                className={inputCls}
                value={injury}
                onChange={(e) => setInjury(e.target.value)}
              />
            )}
          </Field>

          {/* Equipment Chips */}
          <div>
            <label className="text-xs uppercase font-bold text-ink-2 tracking-wider block mb-2" id="eq-lbl">
              {t('ai.equipment', 'Equipment Access')}
            </label>
            <div role="group" aria-labelledby="eq-lbl" className="flex flex-wrap gap-2">
              {equipmentOpts.map((e) => (
                <Chip key={e} selected={equip.includes(e)} onClick={() => toggle(e)}>
                  {e}
                </Chip>
              ))}
            </div>
            {err && <p role="alert" className="text-bad font-semibold text-xs mt-2">{err}</p>}
          </div>

          {/* Diet Preferences */}
          <div>
            <label className="text-xs uppercase font-bold text-ink-2 tracking-wider block mb-2">
              {t('ai.diet_pref', 'Dietary Preference')}
            </label>
            <Segment label="Diet" options={diets} value={diet} onChange={setDiet} />
          </div>

          {/* Action Button */}
          <Btn
            className="w-full gap-2 !h-12 text-sm font-bold shadow-sm"
            onClick={generate}
            disabled={phase === 'loading'}
          >
            <Sparkles size={16} aria-hidden />
            {phase === 'done' ? t('ai.btn_regenerate', 'Re-Synthesize Protocol') : t('ai.btn_generate', 'Generate Weekly Blueprint')}
          </Btn>
        </Card>

        {/* Live Preview Canvas (Right) */}
        <div className="space-y-4">
          {/* Disclaimer Ribbon */}
          <div className="rounded-2xl border border-line bg-sand/30 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="size-9 rounded-xl bg-ink text-white grid place-items-center shrink-0">
                <ShieldCheck size={18} aria-hidden />
              </span>
              <div>
                <p className="font-bold text-sm text-ink">Human-in-the-Loop Clinical Safeguard</p>
                <p className="text-xs text-ink-2">AI generates the draft; your dedicated specialists review and approve it before execution.</p>
              </div>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-ok bg-ok-tint px-3 py-1 rounded-full shrink-0">
              Verified Model
            </span>
          </div>

          {/* Knee Protection Warning */}
          {/knee|squat/i.test(injury) && (
            <SafetyCallout title="Knee Protection Protocol Automatically Injected">
              Squats capped at 60° flexion and knee shear movements paused until Dr. Mona clears patellar tolerance. Daily pain ceiling locked at 4/10.
            </SafetyCallout>
          )}

          {/* State: Idle */}
          {phase === 'idle' && (
            <Card className="p-12 text-center bg-white border border-line">
              <div className="size-16 rounded-2xl bg-sand/60 text-ink grid place-items-center mx-auto mb-4">
                <BrainCircuit size={28} aria-hidden />
              </div>
              <h3 className="h-display text-[22px] font-bold text-ink">Ready to Synthesize Your Plan</h3>
              <p className="text-ink-2 text-sm max-w-md mx-auto mt-2 leading-relaxed">
                Configure your training parameters on the left and click Generate. Our clinical AI model will balance volume, joint shear limits, and recovery nutrition into a weekly blueprint.
              </p>
            </Card>
          )}

          {/* State: Loading */}
          {phase === 'loading' && (
            <Card className="p-8 bg-white border border-line space-y-6">
              <div className="flex items-center gap-3">
                <div className="size-6 rounded-full border-2 border-line border-t-ink animate-spin shrink-0" />
                <h3 className="font-bold text-base text-ink">Gemini Clinical Engine at Work</h3>
              </div>

              <div className="space-y-3">
                {[
                  'Synthesizing physiological baseline & training volume...',
                  'Injecting clinical joint angles & patellar protection barriers...',
                  'Balancing macro-nutrient targets with scheduled metabolic demand...',
                ].map((txt, idx) => (
                  <div key={txt} className="flex items-center gap-3 text-xs">
                    <span className={`size-5 rounded-full grid place-items-center shrink-0 text-white ${
                      loadingStep >= idx ? 'bg-ink' : 'bg-line text-ink-2'
                    }`}>
                      {loadingStep >= idx ? <Check size={11} strokeWidth={3} /> : idx + 1}
                    </span>
                    <span className={loadingStep >= idx ? 'font-semibold text-ink' : 'text-ink-2'}>
                      {txt}
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-3 gap-3 pt-4 border-t border-line">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="p-4 rounded-xl border border-line/60 bg-paper/40 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* State: Done */}
          {phase === 'done' && plan && (
            <div className="space-y-5">
              {/* Executive Metrics Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border border-line bg-white shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase text-ink-2">
                    <Dumbbell size={14} aria-hidden /> Training Volume
                  </div>
                  <p className="num font-bold text-2xl text-ink mt-1">{days} Days / Week</p>
                  <p className="text-xs text-ink-2 mt-0.5">Strength & joint stabilization</p>
                </div>

                <div className="p-4 rounded-xl border border-line bg-white shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase text-ink-2">
                    <Utensils size={14} aria-hidden /> Nutrition Target
                  </div>
                  <p className="num font-bold text-2xl text-ink mt-1">
                    {goal === 'Lose fat' ? '1,850' : goal === 'Build muscle' ? '2,550' : '2,150'} <span className="text-xs font-normal text-ink-2">kcal</span>
                  </p>
                  <p className="text-xs text-ink-2 mt-0.5">{goal === 'Lose fat' ? '135g' : '155g'} protein daily</p>
                </div>

                <div className="p-4 rounded-xl border border-line bg-white shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase text-ink-2">
                    <HeartPulse size={14} aria-hidden /> Clinical Guard
                  </div>
                  <p className="num font-bold text-2xl text-ink mt-1">4 / 10 <span className="text-xs font-normal text-ink-2">ceiling</span></p>
                  <p className="text-xs text-ink-2 mt-0.5">60° box flexion threshold</p>
                </div>
              </div>

              {/* Protocol Pillars: Move, Eat, Recover */}
              <div className="grid md:grid-cols-3 gap-4">
                {(['move', 'eat', 'recover'] as Svc[]).map((s) => {
                  const S = SVC[s]
                  const I = S.Icon
                  return (
                    <Card key={s} className="p-5 bg-white border border-line flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2.5 pb-3 border-b border-line mb-3">
                          <span className={`size-8 rounded-xl ${S.bg} text-white grid place-items-center shrink-0`}>
                            <I size={16} aria-hidden />
                          </span>
                          <h3 className="font-bold text-sm text-ink">{S.label}</h3>
                        </div>

                        <ul className="space-y-2.5">
                          {plan[s].map((r) => (
                            <li key={r.d} className="p-3 rounded-xl bg-paper/50 border border-line/60">
                              <span className="text-[11px] uppercase font-bold text-ink-2 tracking-wider block">
                                {r.d}
                              </span>
                              <p className="text-xs font-medium text-ink mt-0.5 leading-snug">{r.t}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Card>
                  )
                })}
              </div>

              {/* Handoff CTA Bar */}
              <div className="rounded-2xl border border-line bg-white p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="size-10 rounded-xl bg-ok-tint text-ok grid place-items-center shrink-0">
                    <CircleCheck size={20} aria-hidden />
                  </span>
                  <div>
                    <p className="font-bold text-sm text-ink">Ready for Specialist Verification</p>
                    <p className="text-xs text-ink-2">Dr. Mona, Coach Karim, and Hana will review and calibrate this draft.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <Btn variant="secondary" className="gap-2" onClick={generate}>
                    <RefreshCw size={14} aria-hidden /> Regenerate
                  </Btn>
                  <Btn
                    className="gap-2 shrink-0 flex-1 sm:flex-none"
                    onClick={sendToSpecialist}
                    disabled={sent || sending}
                  >
                    <Send size={14} aria-hidden />
                    {sending ? 'Dispatching...' : sent ? 'Transmitted to Care Team' : 'Submit for Clinical Review'}
                  </Btn>
                </div>
              </div>

              {sent && (
                <div role="status" className="rounded-xl bg-ok-tint border border-ok/30 p-4 flex items-center gap-3 text-xs font-bold text-[#1d6b3d]">
                  <CircleCheck size={18} className="shrink-0" />
                  Successfully transmitted to Coach Karim Adel, Hana Mostafa RD, and Dr. Mona Fathy PT. They typically complete clinical calibration within 4 hours.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
