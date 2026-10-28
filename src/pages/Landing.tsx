import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Check, ChevronDown, Menu, X, TriangleAlert, ShieldCheck } from 'lucide-react'
import { Btn, Card, Tag, SVC, Wordmark, Tabs, Avatar, StarRating, LanguageToggle } from '../ui'
import { specialists, week, type Svc } from '../data'
import { useLanguage } from '../context/LanguageContext'

const wrap = 'mx-auto max-w-[1280px] px-5 lg:px-10'

function Header() {
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()
  const navLinks = [
    [t('landing.nav_how', 'How it works'), '#how'],
    [t('landing.nav_services', 'Services'), '#services'],
    [t('landing.nav_specialists', 'Specialists'), '#specialists'],
    [t('landing.nav_pricing', 'Pricing'), '#pricing'],
  ]
  return (
    <header className="sticky top-0 z-40 bg-paper border-b border-line">
      <div className={`${wrap} h-[72px] flex items-center justify-between`}>
        <Link to="/" aria-label="Rebound home">
          <Wordmark />
        </Link>
        <nav className="hidden lg:flex gap-8" aria-label="Main">
          {navLinks.map(([l, h]) => (
            <a key={h} href={h} className="font-semibold text-[15px] py-3 hover:underline underline-offset-8 decoration-2">
              {l}
            </a>
          ))}
        </nav>
        <div className="hidden lg:flex items-center gap-3">
          <LanguageToggle />
          <Btn variant="ghost" to="/login">
            {t('landing.login', 'Log in')}
          </Btn>
          <Btn to="/signup">{t('landing.start_assessment', 'Start assessment')}</Btn>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageToggle variant="pill" />
          <button
            className="size-11 grid place-items-center rounded-xl border border-line bg-white cursor-pointer"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-line bg-paper px-5 pb-5 pt-2 flex flex-col">
          {navLinks.map(([l, h]) => (
            <a key={h} href={h} onClick={() => setOpen(false)} className="min-h-12 flex items-center font-semibold border-b border-line">
              {l}
            </a>
          ))}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Btn variant="secondary" to="/login">
              {t('landing.login', 'Log in')}
            </Btn>
            <Btn to="/signup">{t('landing.start_assessment', 'Start assessment')}</Btn>
          </div>
        </div>
      )}
    </header>
  )
}

function PlanCard({ svc, time, title, meta, offset }: { svc: Svc; time: string; title: string; meta: string; offset: string }) {
  const s = SVC[svc]
  return (
    <div className={`${s.bg} rounded-2xl p-5 border-2 border-sand relative ${offset} text-ink`}>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 label uppercase tracking-wider">
          <s.Icon size={18} strokeWidth={2.4} aria-hidden /> {s.label}
        </span>
        <span className="num text-[20px]">{time}</span>
      </div>
      <p className="h-display text-[28px] mt-3" style={{ letterSpacing: '-0.03em' }}>
        {title}
      </p>
      <p className="text-[15px] font-medium mt-1">{meta}</p>
    </div>
  )
}

function Hero() {
  const { t, isRtl } = useLanguage()
  const mark = (c: string, text: string) => <span className={`${c} px-2 -mx-1 rounded-xl box-decoration-clone`}>{text}</span>
  return (
    <section className={`${wrap} pt-10 lg:pt-16 pb-16 lg:pb-24 grid xl:grid-cols-[1.25fr_1fr] gap-12 xl:gap-12 items-center`}>
      <div>
        <h1 className="h-display text-[44px] sm:text-[60px] xl:text-[72px] leading-[1.04]" style={{ fontStretch: '100%' }}>
          {isRtl ? (
            <>
              جدول {mark('bg-move-tint', t('landing.hero_workouts', 'تمارينك'))}، {mark('bg-eat-tint', t('landing.hero_meals', 'وجباتك'))} و{mark('bg-recover-tint', t('landing.hero_recovery', 'استشفاءك'))}، بتخطيط أخصائيين يتواصلون معاً.
            </>
          ) : (
            <>
              Your {mark('bg-move-tint', t('landing.hero_workouts', 'workouts'))}, {mark('bg-eat-tint', t('landing.hero_meals', 'meals'))} and {mark('bg-recover-tint', t('landing.hero_recovery', 'recovery'))}, planned by people who talk to each other.
            </>
          )}
        </h1>
        <p className="mt-6 text-[18px] leading-7 text-ink-2 max-w-[560px]">
          {t('landing.hero_sub', 'One plan, three specialists. Your trainer, dietitian and physical therapist share notes, so a sore knee changes your lunch and your squats on the same day.')}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Btn to="/signup" className="h-14 px-8 text-[17px]">
            {t('landing.hero_cta', 'Start free assessment')} <ArrowRight size={20} className={isRtl ? 'rotate-180' : ''} aria-hidden />
          </Btn>
          <a href="#how" className="font-bold underline underline-offset-4 decoration-2 min-h-11 inline-flex items-center">
            {t('landing.hero_how_btn', 'See how it works')}
          </a>
        </div>
        <p className="mt-8 text-[14px] text-ink-2 flex items-center gap-2">
          <ShieldCheck size={18} className="text-ink shrink-0" aria-hidden />
          {t('landing.hero_trust', 'Licensed physical therapists · Registered dietitians · Certified trainers')}
        </p>
      </div>
      <div className="rounded-[28px] bg-sand p-6 sm:p-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="label text-ink-2 uppercase">{t('landing.sara_tuesday', "Sara's Tuesday")}</p>
            <p className="h-display text-[28px] mt-1">{t('landing.oct_14', '14 October')}</p>
          </div>
          <span className="num text-[44px] leading-none">3</span>
        </div>
        <div className="flex flex-col">
          <PlanCard svc="eat" time="14:00" title={t('landing.lunch', 'Lunch')} meta={t('landing.lunch_meta', '620 kcal · 42 g protein')} offset="" />
          <PlanCard svc="move" time="18:00" title={t('landing.lower_body', 'Lower body')} meta={t('landing.lower_body_meta', '45 min · adjusted for your knee')} offset={isRtl ? '-mt-3 sm:mr-8 z-10' : '-mt-3 sm:ml-8 z-10'} />
          <PlanCard svc="recover" time="21:00" title={t('landing.knee_mobility', 'Knee mobility')} meta={t('landing.knee_mobility_meta', "10 min · Dr. Mona's routine")} offset={isRtl ? '-mt-3 sm:mr-16 z-20' : '-mt-3 sm:ml-16 z-20'} />
        </div>
      </div>
    </section>
  )
}

function How() {
  const { t } = useLanguage()
  const steps: [Svc, string, string][] = [
    ['move', t('landing.how_step1_title', 'Tell us about you'), t('landing.how_step1_desc', 'Goals, training days, any pain, and what you eat. About 8 minutes.')],
    ['eat', t('landing.how_step2_title', 'Meet your specialists'), t('landing.how_step2_desc', 'We match you with a trainer, dietitian or PT. You pick who you like.')],
    ['recover', t('landing.how_step3_title', 'Follow one plan'), t('landing.how_step3_desc', 'Workouts, meals and rehab on one calendar. Your team adjusts it as you go.')],
  ]
  return (
    <section id="how" className="bg-white border-y border-line">
      <div className={`${wrap} py-20 lg:py-28`}>
        <div className="lg:hidden">
          <h2 className="h-display text-[40px] max-w-xl">{t('landing.how_title', 'Three steps to a plan that fits your week')}</h2>
          <div className="relative mt-14 grid md:grid-cols-3 gap-10 md:gap-8">
            <div className="hidden md:block absolute top-[52px] left-[52px] right-[52px] h-1 bg-ink" aria-hidden />
            {steps.map(([svc, textTitle, d], i) => (
              <div key={textTitle} className="relative">
                <div className={`${SVC[svc].bg} size-[104px] rounded-[28px] grid place-items-center num text-[64px] relative`}>{i + 1}</div>
                <h3 className="h-display text-[24px] mt-6" style={{ letterSpacing: '-0.02em' }}>
                  {textTitle}
                </h3>
                <p className="text-ink-2 mt-2 max-w-[320px]">{d}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden lg:grid grid-cols-[0.72fr_1.28fr] items-center gap-16">
          <div>
            <p className="label uppercase tracking-wider text-ink-2">{t('landing.how_label', 'How Rebound works')}</p>
            <h2 className="h-display mt-4 text-[48px] max-w-md">{t('landing.how_title', 'Three steps to a plan that fits your week')}</h2>
            <p className="mt-6 max-w-md text-[18px] leading-7 text-ink-2">
              {t('landing.how_sub', 'Start with your real routine, choose the specialists you trust, then follow one plan they manage together.')}
            </p>
            <div className="mt-8 flex h-2 max-w-[240px] overflow-hidden rounded-full" aria-hidden>
              <span className="flex-1 bg-move" />
              <span className="flex-1 bg-eat" />
              <span className="flex-1 bg-recover" />
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border-2 border-ink bg-white">
            {steps.map(([svc, textTitle, d], i) => {
              const service = SVC[svc]
              return (
                <div key={textTitle} className={`grid min-h-40 grid-cols-[112px_1fr_112px] items-stretch ${i > 0 ? 'border-t-2 border-ink' : ''}`}>
                  <div className={`${service.bg} grid place-items-center`}>
                    <span className="num text-[52px] leading-none">0{i + 1}</span>
                  </div>
                  <div className="flex flex-col justify-center px-8 py-6">
                    <p className="h-display text-[26px]">{textTitle}</p>
                    <p className="mt-2 max-w-lg text-ink-2">{d}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2 border-l border-line">
                    <service.Icon size={26} strokeWidth={2.4} aria-hidden />
                    <span className="label uppercase">{service.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function Services() {
  const { t } = useLanguage()
  const [tab, setTab] = useState<Svc>('move')
  const serviceContent = {
    move: {
      title: t('services.move_title', 'Strength and conditioning you can actually keep up with'),
      who: specialists[0],
      items: [
        t('services.move_item1', '3 to 5 workouts a week, at home or in a gym'),
        t('services.move_item2', 'Video demos for every exercise'),
        t('services.move_item3', 'Weekly check-in and load changes'),
      ],
      sample: {
        head: t('services.move_sample_head', 'Tuesday · Lower body'),
        rows: [t('services.move_sample_row1', 'Goblet squat · 3 × 10'), t('services.move_sample_row2', 'Romanian deadlift · 3 × 8')],
        foot: t('services.move_sample_foot', '45 min'),
      },
      image: 'https://images.unsplash.com/photo-1566568531155-07244e00963d?auto=format&fit=crop&w=500&q=85',
    },
    eat: {
      title: t('services.eat_title', 'Meals built from the food you already eat'),
      who: specialists[1],
      items: [
        t('services.eat_item1', 'Meal plan with ful, koshari, grilled chicken and more'),
        t('services.eat_item2', 'Calories and protein set to your goal'),
        t('services.eat_item3', 'Swap any meal, your dietitian re-balances the day'),
      ],
      sample: {
        head: t('services.eat_sample_head', 'Lunch · Grilled chicken with rice'),
        rows: [t('services.eat_sample_row1', '150 g chicken, 1 cup rice, green salad'), t('services.eat_sample_row2', '42 g protein · 68 g carbs · 18 g fat')],
        foot: t('services.eat_sample_foot', '620 kcal'),
      },
      image: 'https://images.unsplash.com/photo-1568625357288-d3b0051abf0e?auto=format&fit=crop&w=500&q=85',
    },
    recover: {
      title: t('services.recover_title', 'Rehab and pain checks, handled by a licensed PT'),
      who: specialists[2],
      items: [
        t('services.recover_item1', 'Short daily routines for your injured area'),
        t('services.recover_item2', 'Pain check-ins reviewed within 24 hours'),
        t('services.recover_item3', 'Your trainer sees every change they make'),
      ],
      sample: {
        head: t('services.recover_sample_head', 'Knee mobility'),
        rows: [t('services.recover_sample_row1', 'Terminal knee extension · 2 × 15'), t('services.recover_sample_row2', 'Heel slides · 2 × 10')],
        foot: t('services.recover_sample_foot', '10 min'),
      },
      image: 'https://images.unsplash.com/photo-1645005512942-a17817fb7c11?auto=format&fit=crop&w=500&q=85',
    },
  }
  const c = serviceContent[tab]
  const s = SVC[tab]
  return (
    <section id="services" className={`${wrap} py-20 lg:py-28`}>
      <h2 className="h-display text-[40px] max-w-xl">{t('landing.services_title', 'Three services, one plan')}</h2>
      <div className="mt-8">
        <Tabs
          label="Services"
          value={tab}
          onChange={setTab}
          tabs={(['move', 'eat', 'recover'] as Svc[]).map((id) => {
            const Icon = SVC[id].Icon
            return { id, label: SVC[id].label, icon: <Icon size={18} aria-hidden /> }
          })}
        />
      </div>
      <div className={`mt-6 rounded-[28px] p-6 sm:p-10 lg:min-h-[660px] lg:p-14 grid lg:grid-cols-[1.1fr_1fr] gap-10 transition-colors lg:[&>div:last-child>div]:h-full ${s.bg}`} role="tabpanel">
        <div className="flex flex-col">
          <h3 className="h-display text-[32px] sm:text-[40px] max-w-lg" style={{ letterSpacing: '-0.03em' }}>
            {c.title}
          </h3>
          <div className="mt-6 flex items-center gap-4 bg-white/90 rounded-2xl p-4 max-w-md">
            <Avatar initials={c.who.initials} svc={tab} />
            <div>
              <p className="label text-ink-2 uppercase">{t('landing.delivered_by', 'Delivered by')}</p>
              <p className="font-bold">{c.who.name}</p>
              <p className="text-[14px] text-ink-2">{c.who.role}, {c.who.years} {t('landing.years', 'years')}</p>
            </div>
          </div>
          <p className="label uppercase mt-8">{t('landing.what_you_get', 'What you get')}</p>
          <ul className="mt-3 space-y-3">
            {c.items.map((i) => (
              <li key={i} className="flex gap-3 font-medium">
                <Check size={22} strokeWidth={3} className="shrink-0 mt-0.5" aria-hidden /> {i}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative">
          <Card className="overflow-hidden">
            <div className="aspect-[16/9] overflow-hidden border-b border-line bg-white">
              <img
                src={c.image}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-opacity"
              />
            </div>
            <div className="p-6">
              <Tag svc={tab}>{t('landing.sample', 'Sample')}</Tag>
              <p className="h-display text-[22px] mt-3" style={{ letterSpacing: '-0.02em' }}>
                {c.sample.head}
              </p>
              <ul className="mt-4 divide-y divide-line">
                {c.sample.rows.map((r) => (
                  <li key={r} className="py-3 text-[15px]">
                    {r}
                  </li>
                ))}
              </ul>
              <p className="num text-[32px] mt-2">{c.sample.foot}</p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}

export function SampleWeek() {
  const { t, isRtl } = useLanguage()
  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-5" aria-label="Legend">
        {(['move', 'eat', 'recover'] as Svc[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-2 text-[14px] font-semibold">
            <span className={`size-4 rounded ${SVC[k].bg}`} />
            {SVC[k].label}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto -mx-5 px-5 lg:mx-0 lg:px-0">
        <div className="grid grid-cols-7 gap-3 min-w-[980px] lg:min-w-0">
          {week.map((d) => (
            <div key={d.day} className="bg-white border border-line rounded-2xl p-3 flex flex-col gap-2">
              <p className="num text-[18px] px-1">{isRtl ? (
                d.day === 'Mon' ? 'الإثنين' :
                d.day === 'Tue' ? 'الثلاثاء' :
                d.day === 'Wed' ? 'الأربعاء' :
                d.day === 'Thu' ? 'الخميس' :
                d.day === 'Fri' ? 'الجمعة' :
                d.day === 'Sat' ? 'السبت' : 'الأحد'
              ) : d.day}</p>
              {d.blocks.map((b) => (
                <div key={b.text} className={`${SVC[b.svc].bg} rounded-xl p-3 text-[14px] leading-5 font-medium text-ink`}>
                  <span className="label uppercase block mb-1">{SVC[b.svc].label}</span>
                  {b.text}
                  {b.adjusted && (
                    <span className="mt-2 inline-flex items-center gap-1 bg-white rounded-full px-2 h-6 label">
                      <TriangleAlert size={12} aria-hidden /> {t('landing.adjusted_badge', 'Adjusted')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Week() {
  const { t } = useLanguage()
  return (
    <section className="bg-white">
      <div className={`${wrap} py-20 lg:py-28`}>
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_0.55fr]">
          <div>
            <p className="label uppercase tracking-wider text-ink-2">{t('landing.week_label', 'One plan, always in sync')}</p>
            <h2 className="h-display mt-4 max-w-2xl text-[40px] lg:text-[52px]">{t('landing.week_title', 'A real week that responds when your body does')}</h2>
            <p className="mt-5 max-w-2xl text-[18px] leading-7 text-ink-2">
              {t('landing.week_sub', "Every block comes from a different specialist. When Sara's knee hurt on Monday night, Tuesday's plan changed before her next session.")}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-paper p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-recover-tint text-ink">
                <Check size={22} strokeWidth={3} aria-hidden />
              </span>
              <p className="h-display text-[22px]">{t('landing.sync_title', 'One change, shared instantly')}</p>
            </div>
            <p className="mt-3 text-[15px] leading-6 text-ink-2">{t('landing.sync_sub', 'The trainer, dietitian, and PT all work from the same live plan.')}</p>
          </div>
        </div>

        <div className="mt-10 rounded-[28px] border border-line bg-paper p-5 lg:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="label uppercase text-ink-2">{t('landing.sara_plan', "Sara's coordinated plan")}</p>
              <p className="h-display mt-1 text-[28px]">{t('landing.this_week', 'This week')}</p>
            </div>
            <p className="text-[14px] font-semibold text-ink-2">{t('landing.scroll_days', 'Scroll to see all seven days')}</p>
          </div>
          <SampleWeek />
        </div>

        <div className="mt-6 overflow-hidden rounded-[28px] border border-line bg-paper lg:grid lg:grid-cols-[0.85fr_1.15fr]" role="note">
          <div className="bg-recover-tint p-6 lg:p-8">
            <Tag svc="recover">{t('landing.pt_update', 'PT update')}</Tag>
            <p className="h-display mt-5 text-[28px]">{t('landing.pt_update_title', 'Tuesday changed before Sara trained')}</p>
            <p className="mt-3 leading-6 text-ink-2">
              {t('landing.pt_update_sub', 'Sara logged knee pain at 4 out of 10. Dr. Mona Fathy changed two exercises and told Coach Karim before the session.')}
            </p>
          </div>

          <div className="p-6 lg:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="label uppercase text-ink-2">{t('plan.plan_change', 'Plan change')}</p>
                <p className="h-display mt-1 text-[22px]">{t('plan.lower_body_session', 'Lower body session')}</p>
              </div>
              <SVC.recover.Icon className="shrink-0 text-recover" aria-hidden />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-paper p-4">
                <p className="label uppercase text-ink-2">{t('landing.before', 'Before')}</p>
                <p className="mt-2 font-semibold">Goblet squat · 3 × 10</p>
                <p className="font-semibold">Walking lunge · 3 × 8</p>
              </div>
              <div className="rounded-xl border border-recover bg-recover-tint p-4">
                <p className="label uppercase">{t('landing.updated_by_pt', 'Updated by Dr. Mona')}</p>
                <p className="mt-2 font-semibold">Box squat to 90° · 3 × 8</p>
                <p className="font-semibold">Terminal knee extension · 3 × 12</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Specialists() {
  const { t, isRtl } = useLanguage()
  return (
    <section id="specialists" className={`${wrap} py-20 lg:py-28`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label uppercase tracking-wider text-ink-2 mb-3">{t('landing.spec_label', 'Your care team')}</p>
          <h2 className="h-display text-[40px] max-w-xl">{t('landing.spec_title', 'Real specialists, checked and licensed')}</h2>
          <p className="text-ink-2 mt-4 max-w-2xl">
            {t('landing.spec_sub', 'Choose the people you trust. Every Rebound specialist is vetted, experienced, and ready to work as one team.')}
          </p>
        </div>
        <Btn variant="secondary" to="/signup">
          {t('landing.find_yours', 'Find yours')}
        </Btn>
      </div>
      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {specialists.map((s) => (
          <li key={s.id}>
            <Link
              to="/signup"
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition duration-300 hover:-translate-y-1 hover:border-ink hover:ring-2 hover:ring-ink focus-visible:-translate-y-1"
              aria-label={`Meet ${s.name}, ${s.role}`}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-sand">
                <img
                  src={s.photo}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.04] motion-reduce:transition-none"
                />
                <div className="absolute left-4 top-4">
                  <Tag svc={s.svc}>{s.role}</Tag>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="h-display text-[22px] leading-6">{s.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <StarRating rating={s.rating ?? 4.9} size={15} showValue />
                  <span className="text-[13px] text-ink-2 font-medium">({s.reviewsCount ?? 4} {t('specialists.reviews', 'reviews')})</span>
                </div>
                <p className="mt-2 text-[15px] text-ink-2 line-clamp-2">{s.cred}</p>
                <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                  <span className="text-[13px] font-semibold text-ink-2">
                    <strong className="text-ink">{s.clientsCount ?? 120}</strong> {t('landing.worked_with_clients', 'clients worked with')}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[14px] font-bold">
                    {t('landing.meet', 'Meet')} {s.name.split(' ')[1]}
                    <ArrowRight size={17} aria-hidden className={`transition-transform group-hover:translate-x-1 motion-reduce:transition-none ${isRtl ? 'rotate-180' : ''}`} />
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-col items-start justify-between gap-5 rounded-2xl border-2 border-ink bg-sand p-6 sm:flex-row sm:items-center lg:p-8">
        <div>
          <p className="h-display text-[28px]">{t('landing.more_spec_title', 'And many more specialists')}</p>
          <p className="mt-2 max-w-2xl text-ink-2">
            {t('landing.more_spec_sub', 'Explore trainers, dietitians, and physical therapists matched to your goals, schedule, and language.')}
          </p>
        </div>
        <Btn to="/signup" className="shrink-0">
          {t('landing.browse_all', 'Browse all specialists')} <ArrowRight size={18} className={isRtl ? 'rotate-180' : ''} aria-hidden />
        </Btn>
      </div>
    </section>
  )
}

function Pricing() {
  const { t, isRtl } = useLanguage()
  const [tab, setTab] = useState<'individuals' | 'organizations'>('individuals')

  const localizedPlans = [
    {
      name: 'Starter',
      price: '399',
      blurb: t('pricing.starter_blurb', 'One specialist, one focus.'),
      feats: [
        t('pricing.starter_f1', 'Plan from a trainer or dietitian'),
        t('pricing.starter_f2', 'Weekly plan updates'),
        t('pricing.starter_f3', 'In-app messages, replies within 48 h'),
        t('pricing.starter_f4', '1 video check-in a month'),
      ],
    },
    {
      name: 'Plus',
      price: '899',
      blurb: t('pricing.plus_blurb', 'Training and food together.'),
      feats: [
        t('pricing.plus_f1', 'Trainer and dietitian on your plan'),
        t('pricing.plus_f2', 'Meals from Egyptian staples'),
        t('pricing.plus_f3', 'Messages, replies within 24 h'),
        t('pricing.plus_f4', '2 video sessions a month'),
        t('pricing.plus_f5', 'Swap meals any time'),
      ],
    },
    {
      name: 'Full Team',
      price: '1,499',
      blurb: t('pricing.full_team_blurb', 'Trainer, dietitian and physical therapist.'),
      feats: [
        t('pricing.full_team_f1', 'All three specialists share one plan'),
        t('pricing.full_team_f2', 'Pain check-ins reviewed within 24 h'),
        t('pricing.full_team_f3', 'Rehab routines with video demos'),
        t('pricing.full_team_f4', '4 video sessions a month'),
        t('pricing.full_team_f5', 'Change specialists whenever you like'),
      ],
      best: true,
    },
  ]

  return (
    <section id="pricing" className="bg-white border-y border-line">
      <div className={`${wrap} py-20 lg:py-28`}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="h-display text-[40px]">{t('landing.pricing_title', 'Transparent, flexible pricing')}</h2>
            <p className="text-ink-2 mt-2">
              {t('landing.pricing_sub', 'For individuals seeking personal health guidance or organizations sponsoring their teams.')}
            </p>
          </div>
          <div className="inline-flex p-1 rounded-xl bg-paper border border-line self-start md:self-auto">
            <button
              type="button"
              onClick={() => setTab('individuals')}
              className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                tab === 'individuals'
                  ? 'bg-ink text-white shadow-sm'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              {t('landing.for_ind', 'For individuals')}
            </button>
            <button
              type="button"
              onClick={() => setTab('organizations')}
              className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                tab === 'organizations'
                  ? 'bg-ink text-white shadow-sm'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              {t('landing.for_org', 'For organizations')}
            </button>
          </div>
        </div>

        {tab === 'individuals' ? (
          <div className="grid md:grid-cols-3 gap-5 items-stretch">
            {localizedPlans.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl bg-white p-8 flex flex-col relative ${
                  p.best ? 'border-[3px] border-ink' : 'border border-line'
                }`}
              >
                {p.best && (
                  <span className={`absolute -top-4 ${isRtl ? 'right-6' : 'left-6'} bg-ink text-white rounded-full px-4 h-8 inline-flex items-center label`}>
                    {t('landing.best_rehab', 'Best for rehab')}
                  </span>
                )}
                <h3 className="h-display text-[24px]">{p.name}</h3>
                <p className="text-ink-2 mt-1">{p.blurb}</p>
                <p className="mt-6 flex items-baseline gap-2">
                  <span className="num text-[48px] leading-none">{p.price}</span>
                  <span className="font-semibold">{t('landing.egp_month', 'EGP / month')}</span>
                </p>
                <ul className="mt-6 space-y-3 mb-8">
                  {p.feats.map((f) => (
                    <li key={f} className="flex gap-3 text-[15px]">
                      <Check size={20} strokeWidth={3} className="shrink-0 mt-0.5 text-ok" aria-hidden />{' '}
                      {f}
                    </li>
                  ))}
                </ul>
                <Btn
                  variant={p.best ? 'primary' : 'secondary'}
                  to="/signup"
                  className="mt-auto w-full"
                >
                  {t('landing.choose', 'Choose')} {p.name}
                </Btn>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 items-stretch bg-paper rounded-3xl p-8 lg:p-12 border border-line">
            <div className="flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-move bg-move-tint px-3 py-1 rounded-full inline-block mb-4">
                  {t('landing.org_badge', 'B2B Wellness & Performance')}
                </span>
                <h3 className="h-display text-[32px] lg:text-[36px]">
                  {t('landing.org_title', "Sponsor your team's health")}
                </h3>
                <p className="text-ink-2 mt-3 text-base leading-relaxed">
                  {t('landing.org_sub', "Bring your own specialists or use ours. Plans scale with your team size, giving employees, athletes, or students dedicated Move, Eat, and Recover support.")}
                </p>

                <div className="grid sm:grid-cols-2 gap-4 mt-8">
                  <div className="p-4 rounded-xl bg-white border border-line">
                    <strong className="text-ink font-bold text-sm block">{t('pricing.b2b_item1_t', 'Flexible Specialists')}</strong>
                    <span className="text-xs text-ink-2 mt-1 block">
                      {t('pricing.b2b_item1_d', 'Connect your internal trainers and therapists or grant access to platform specialists.')}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-line">
                    <strong className="text-ink font-bold text-sm block">{t('pricing.b2b_item2_t', 'Instant Onboarding')}</strong>
                    <span className="text-xs text-ink-2 mt-1 block">
                      {t('pricing.b2b_item2_d', 'One unique invite code. Members join without entering credit cards.')}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-line">
                    <strong className="text-ink font-bold text-sm block">{t('pricing.b2b_item3_t', 'Aggregate Usage Dashboard')}</strong>
                    <span className="text-xs text-ink-2 mt-1 block">
                      {t('pricing.b2b_item3_d', 'Track seat utilization and activity aggregates with zero clinical data exposure.')}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-line">
                    <strong className="text-ink font-bold text-sm block">{t('pricing.b2b_item4_t', 'Custom Seat Limits')}</strong>
                    <span className="text-xs text-ink-2 mt-1 block">
                      {t('pricing.b2b_item4_d', 'Scale from 5 to 500+ sponsored member seats with predictable terms.')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-line flex flex-col sm:flex-row items-center gap-4">
                <Btn to="/register-org" className="w-full sm:w-auto px-8">
                  {t('landing.org_reg_btn', 'Register your organization')} <ArrowRight size={18} className={isRtl ? 'rotate-180' : ''} />
                </Btn>
                <Link
                  to="/join"
                  className="font-semibold text-ink underline underline-offset-4 text-sm"
                >
                  {t('landing.org_join_link', 'Have an invite code from your team? Join here')}
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-line flex flex-col justify-between shadow-sm">
              <div>
                <span className="label text-ink-2">{t('pricing.b2b_card_label', 'Annual or Quarterly Sponsoring')}</span>
                <p className="mt-4 flex items-baseline gap-2">
                  <span className="num text-[44px] leading-none">{t('pricing.b2b_custom', 'Custom')}</span>
                  <span className="text-ink-2 font-medium">{t('pricing.b2b_per_seat', 'per seat / month')}</span>
                </p>
                <p className="text-xs text-ink-2 mt-2">
                  {t('pricing.b2b_invoice_note', 'Invoiced in EGP with dedicated onboarding and specialist assignment support.')}
                </p>

                <div className="mt-6 pt-6 border-t border-line space-y-3">
                  {[
                    t('pricing.b2b_feat1', 'Your own specialists or platform specialists'),
                    t('pricing.b2b_feat2', 'Invite codes for instant zero-payment onboarding'),
                    t('pricing.b2b_feat3', 'Members skip payment (fully sponsored)'),
                    t('pricing.b2b_feat4', 'Aggregate usage dashboard for org admins'),
                    t('pricing.b2b_feat5', '1 to 500 scalable member seats'),
                  ].map((feat) => (
                    <div key={feat} className="flex gap-3 text-sm text-ink">
                      <Check size={18} strokeWidth={3} className="shrink-0 mt-0.5 text-ok" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-line text-center">
                <p className="text-xs text-ink-2">
                  {t('pricing.b2b_already_admin', 'Already managing a team?')}{' '}
                  <Link to="/login" className="font-bold text-ink underline underline-offset-4">
                    {t('pricing.b2b_login_org', 'Log in as Org Admin')}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function Faq() {
  const { t } = useLanguage()
  const [open, setOpen] = useState<number | null>(0)
  const localizedFaqs = [
    [t('faq.q1', 'Is this medical advice?'), t('faq.a1', 'No. Our physical therapists give rehab guidance for training, not a diagnosis. If something feels wrong, see a doctor first. We will tell you when that applies.')],
    [t('faq.q2', 'Do I need a gym?'), t('faq.a2', 'No. Most plans work with a pair of dumbbells or a resistance band at home. Tell us what you have and your trainer builds around it.')],
    [t('faq.q3', 'How do sessions work?'), t('faq.a3', 'You book a 30 or 45 minute video call with a specialist. Between sessions you message them and follow your daily plan in the app.')],
    [t('faq.q4', 'Can I switch specialists?'), t('faq.a4', 'Yes, any time and at no cost. Your plan and history stay with you, and the new specialist reads them before your first call.')],
    [t('faq.q5', 'How is my health data used?'), t('faq.a5', 'Only your own specialists see your answers. We do not sell data or share it with gyms or brands. You can export or delete it from settings.')],
  ]
  return (
    <section className={`${wrap} py-20 lg:py-28 grid lg:grid-cols-[1fr_1.6fr] gap-10`}>
      <h2 className="h-display text-[40px]">{t('landing.faq_title', 'Questions people ask first')}</h2>
      <div className="border-t border-line">
        {localizedFaqs.map(([q, a], i) => (
          <div key={q} className="border-b border-line">
            <h3>
              <button
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full min-h-16 py-4 flex items-center justify-between gap-4 text-left font-bold text-[18px] cursor-pointer"
              >
                {q}
                <ChevronDown className={`shrink-0 transition ${open === i ? 'rotate-180' : ''}`} aria-hidden />
              </button>
            </h3>
            {open === i && <p className="pb-5 text-ink-2 max-w-xl">{a}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}

function Closing() {
  const { t, isRtl } = useLanguage()
  return (
    <section className="bg-ink text-white">
      <div className={`${wrap} py-20 lg:py-24 flex flex-col lg:flex-row lg:items-center justify-between gap-8`}>
        <h2 className="h-display text-[40px] lg:text-[56px] max-w-2xl">{t('landing.closing_title', 'Ten minutes to your starting plan.')}</h2>
        <div>
          <Btn variant="inverse" to="/signup" className="h-14 px-8">
            {t('landing.hero_cta', 'Start free assessment')} <ArrowRight size={20} className={isRtl ? 'rotate-180' : ''} aria-hidden />
          </Btn>
          <p className="text-[14px] text-white/70 mt-3">{t('landing.closing_sub', 'No card needed. Pick specialists after.')}</p>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  const { t } = useLanguage()
  const cols = [
    [t('landing.footer_col_product', 'Product'), [t('landing.nav_how', 'How it works'), t('landing.nav_services', 'Services'), t('landing.nav_pricing', 'Pricing')]],
    [t('landing.footer_col_specialists', 'Specialists'), [t('auth.join_specialist', 'Join as a specialist'), t('landing.our_standards', 'Our standards'), t('specialists.all_specialists', 'Find a specialist')]],
    [t('landing.footer_col_company', 'Company'), [t('common.about', 'About'), t('common.contact', 'Contact'), t('common.privacy', 'Privacy')]],
  ] as const
  return (
    <footer className="bg-paper">
      <div className={`${wrap} py-14 grid md:grid-cols-[1.4fr_repeat(3,1fr)] gap-10`}>
        <div>
          <Wordmark />
          <p className="text-ink-2 mt-3 max-w-xs text-[15px]">{t('landing.footer_tagline', 'Training, food and rehab on one plan. Made in Cairo.')}</p>
        </div>
        {cols.map(([h, ls]) => (
          <div key={h}>
            <p className="font-bold">{h}</p>
            <ul className="mt-3 space-y-1">
              {ls.map((l) => (
                <li key={l}>
                  <a href="#" className="text-ink-2 hover:text-ink min-h-11 inline-flex items-center">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className={`${wrap} pb-10`}>
        <p className="text-[14px] text-ink-2 border-t border-line pt-6 max-w-3xl">
          {t('landing.footer_disclaimer', 'Rebound offers coaching and education, not medical diagnosis or treatment. Talk to your doctor before starting a new program, especially after an injury or if you have a medical condition.')}
        </p>
      </div>
    </footer>
  )
}

export default function Landing() {
  return (
    <div>
      <Header />
      <main>
        <Hero />
        <How />
        <Services />
        <Week />
        <Specialists />
        <Pricing />
        <Faq />
        <Closing />
      </main>
      <Footer />
    </div>
  )
}
