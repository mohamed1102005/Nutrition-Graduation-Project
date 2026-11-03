import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Menu, X } from 'lucide-react'
import { Wordmark } from '../ui'
import { specialists, type Svc } from '../data'
import { useLanguage } from '../context/LanguageContext'
import { assetUrl } from '../basePath'
import './landing.css'

const wrap = 'lp-wrap'
const media = assetUrl('landing')
const movePhoto = 'https://images.unsplash.com/photo-1566568531155-07244e00963d?auto=format&fit=crop&w=1400&q=80'
const recoverPhoto = 'https://images.unsplash.com/photo-1645005512942-a17817fb7c11?auto=format&fit=crop&w=1400&q=80'

const pill = 'inline-flex min-h-12 items-center gap-3 rounded-full px-6 text-[18px] font-bold transition-[transform,background-color] hover:-translate-y-0.5 active:scale-[.97]'
const primary = 'group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-move px-8 text-[18px] font-bold text-ink transition-transform hover:-translate-y-0.5 active:scale-[.97]'

const fill: Record<Svc, string> = { move: 'bg-move', eat: 'bg-eat', recover: 'bg-recover' }
const tint: Record<Svc, string> = { move: 'bg-move-tint', eat: 'bg-eat-tint', recover: 'bg-recover-tint' }

// Portraits render at about 100px, so ask Unsplash for a small crop instead of the 900px original.
const thumb = (src: string) => (src.includes('images.unsplash.com') ? src.replace('w=900', 'w=320') : src)

// Adds the class that arms entrances, then reveals [data-reveal] once as it enters.
function useReveal() {
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('lp-js')
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    const watch = () => document.querySelectorAll<HTMLElement>('.lp [data-reveal]:not(.is-in)').forEach((el) => io.observe(el))
    watch()
    // Nodes that mount later (a language switch re-keys some lists) need observing too.
    const mo = new MutationObserver(watch)
    const lp = document.querySelector('.lp')
    if (lp) mo.observe(lp, { childList: true, subtree: true })
    return () => {
      mo.disconnect()
      io.disconnect()
      root.classList.remove('lp-js')
    }
  }, [])
}

function Arrow() {
  const { isRtl } = useLanguage()
  return <ArrowRight size={20} aria-hidden className={`transition-transform group-hover:translate-x-1 ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
}

function Header() {
  const [open, setOpen] = useState(false)
  const { t, lang, toggleLang } = useLanguage()
  const headerRef = useRef<HTMLElement>(null)
  const menuBtn = useRef<HTMLButtonElement>(null)
  const links = [
    [t('landing.nav_how', 'How it works'), '#how'],
    [t('landing.nav_services', 'Services'), '#services'],
    [t('landing.nav_specialists', 'Specialists'), '#team'],
    [t('landing.nav_pricing', 'Pricing'), '#pricing'],
  ]

  // The open menu closes on Escape (returning focus to its button) and on a tap outside the header.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        menuBtn.current?.focus()
      }
    }
    const onDown = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  const langBtn = (
    <button type="button" onClick={toggleLang} className="min-h-11 px-2 font-semibold text-[15px] text-paper/85 hover:text-paper cursor-pointer">
      {lang === 'en' ? <span lang="ar">العربية</span> : <span lang="en">English</span>}
    </button>
  )
  return (
    <header ref={headerRef} className="bg-ink text-paper sticky top-0 z-40">
      <div className={`${wrap} h-[var(--lp-header)] flex items-center justify-between gap-6`}>
        <Link to="/" aria-label="Rebound home" className="rounded-lg">
          <Wordmark />
        </Link>
        <nav className="hidden lg:flex gap-8" aria-label="Main">
          {links.map(([l, h]) => (
            <a key={h} href={h} className="font-semibold text-[15px] py-3 text-paper/85 hover:text-paper transition-colors">
              {l}
            </a>
          ))}
        </nav>
        <div className="hidden lg:flex items-center gap-4">
          {langBtn}
          <Link to="/login" className="min-h-11 inline-flex items-center px-2 font-semibold text-[15px] text-paper/85 hover:text-paper">
            {t('landing.login', 'Log in')}
          </Link>
          <Link to="/signup" className="min-h-11 inline-flex items-center px-5 rounded-full bg-paper text-ink font-bold text-[15px] transition-transform active:scale-[.97]">
            {t('landing.hero_cta', 'Start free assessment')}
          </Link>
        </div>
        <div className="flex items-center gap-1 lg:hidden">
          {langBtn}
          <button
            ref={menuBtn}
            className="size-11 grid place-items-center rounded-full bg-paper/10 cursor-pointer"
            aria-label={open ? t('lp.menu_close', 'Close menu') : t('lp.menu_open', 'Open menu')}
            aria-expanded={open}
            aria-controls="lp-menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X aria-hidden /> : <Menu aria-hidden />}
          </button>
        </div>
      </div>
      {open && (
        <div id="lp-menu" className="lg:hidden absolute inset-x-0 top-full bg-paper text-ink rounded-b-[28px]">
          <nav className={`${wrap} pt-4 pb-8 flex flex-col`} aria-label="Mobile">
            {links.map(([l, h]) => (
              <a key={h} href={h} onClick={() => setOpen(false)} className="min-h-12 flex items-center text-[22px] font-bold">
                {l}
              </a>
            ))}
            <Link to="/login" className="min-h-12 flex items-center text-[22px] font-bold">
              {t('landing.login', 'Log in')}
            </Link>
            <Link to="/signup" className={`${primary} mt-6`}>
              {t('landing.hero_cta', 'Start free assessment')} <Arrow />
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}

function Hero() {
  const { t } = useLanguage()
  // These match the plan the demo below opens on (pain 4 of 10).
  const chips: [Svc, string, string, string][] = [
    ['eat', '14:00', t('landing.lunch', 'Lunch'), t('lp.chip_eat_meta', '560 kcal · 42 g protein')],
    ['move', '18:00', t('landing.lower_body', 'Lower body'), t('lp.chip_move_meta', '40 min · box squats for the knee')],
    ['recover', '21:00', t('landing.knee_mobility', 'Knee mobility'), t('lp.chip_rec_meta', "15 min · Dr. Mona's routine")],
  ]
  const tilt = ['-rotate-2', 'rotate-1', '-rotate-1']
  return (
    <section className="bg-ink text-paper">
      <div className={`${wrap} pt-10 lg:pt-20 pb-16 lg:pb-24 min-h-[calc(100svh-var(--lp-header))] flex flex-col`}>
        <h1 className="h-display lp-display lp-lines max-w-[1200px]">
          <span className="lp-line">
            <span data-line style={{ '--i': 0 } as React.CSSProperties}>
              {t('lp.hero_l1', 'Knee pain')}
            </span>
          </span>{' '}
          <span className="lp-line">
            <span data-line style={{ '--i': 1 } as React.CSSProperties}>
              {t('lp.hero_l2', 'changes lunch.')}
            </span>
          </span>
        </h1>
        <div className="mt-auto pt-14 grid gap-10 lg:grid-cols-12 items-end" data-fade>
          <div className="lg:col-span-5">
            <p className="text-[18px] leading-[1.55] max-w-[44ch]">
              {t('lp.hero_sub', 'Rebound puts a trainer, a dietitian and a physical therapist on one plan. Log a sore knee once, and all three adjust your day.')}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link to="/signup" className={primary}>
                {t('landing.hero_cta', 'Start free assessment')} <Arrow />
              </Link>
              <a href="#try" className="min-h-11 inline-flex items-center font-semibold underline underline-offset-[6px] decoration-2 hover:decoration-move">
                {t('lp.hero_try', "Try it on Sara's Tuesday")}
              </a>
            </div>
          </div>
          <ul className="lg:col-span-7 grid gap-3 sm:grid-cols-3" data-ui aria-label={t('lp.hero_chips', "Sara's Tuesday plan")}>
            {chips.map(([svc, time, title, meta], i) => (
              <li key={svc} className={`${fill[svc]} ${tilt[i]} rounded-2xl p-5 text-ink transition-transform hover:rotate-0 hover:-translate-y-1`}>
                <p className="flex justify-between font-bold text-[15px]">
                  <span>{t(`lp.${svc}`, svc)}</span>
                  <span className="tabular-nums">{time}</span>
                </p>
                <p className="h-display text-[26px] mt-3">{title}</p>
                <p className="text-[15px] mt-1 font-medium">{meta}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

type Level = 0 | 1 | 2 | 3
const levelOf = (p: number): Level => (p <= 2 ? 0 : p <= 5 ? 1 : p <= 8 ? 2 : 3)

function TryIt() {
  const { t } = useLanguage()
  const [pain, setPain] = useState(4)
  const lv = levelOf(pain)
  const who = {
    move: t('lp.who_karim', 'Coach Karim'),
    eat: t('lp.who_hana', 'Hana, RD'),
    recover: t('lp.who_mona', 'Dr. Mona'),
  }
  const rows: { svc: Svc; title: string; meta: string; delta: string }[] = [
    {
      svc: 'eat',
      title: t('lp.eat_t', 'Lunch · 14:00'),
      meta: t(`lp.l${lv}_eat`, ''),
      delta: lv > 0 ? t(`lp.l${lv}_eat_d`, '') : '',
    },
    {
      svc: 'move',
      title: lv < 2 ? t('lp.move_t', 'Lower body · 18:00') : lv === 2 ? t('lp.l2_move_t', 'Upper body instead · 18:00') : t('lp.l3_move_t', 'Rest day'),
      meta: t(`lp.l${lv}_move`, ''),
      delta: lv > 0 ? t(`lp.l${lv}_move_d`, '') : '',
    },
    {
      svc: 'recover',
      title: lv < 2 ? t('lp.rec_t', 'Knee mobility · 21:00') : lv === 2 ? t('lp.l2_rec_t', 'Pain check · 21:00') : t('lp.l3_rec_t', 'See a doctor today'),
      meta: t(`lp.l${lv}_rec`, ''),
      delta: lv > 0 ? t(`lp.l${lv}_rec_d`, '') : '',
    },
  ]
  const presets: [number, string][] = [
    [0, t('lp.preset_0', 'No pain')],
    [4, t('lp.preset_4', 'Sore after stairs')],
    [7, t('lp.preset_7', 'Sharp when bending')],
    [9, t('lp.preset_9', "Can't bear weight")],
  ]
  const outOf = t('lp.out_of_10', 'out of 10')
  return (
    <section id="try" className="bg-paper py-[clamp(96px,12vw,180px)]">
      <div className={`${wrap} grid gap-12 lg:grid-cols-12 lg:gap-8`}>
        <div className="lg:col-span-5">
          <h2 className="h-display lp-h2" data-reveal>
            {t('lp.try_title', "Set Sara's knee pain")}
          </h2>
          <p className="mt-6 text-[18px] leading-[1.55] max-w-[40ch]" data-reveal style={{ '--d': 1 } as React.CSSProperties}>
            {t('lp.try_sub', 'She logs it in the app on Monday night. Move the score and watch what her team changes for Tuesday.')}
          </p>
          <div className="mt-12" data-ui data-reveal style={{ '--d': 2 } as React.CSSProperties}>
            <label htmlFor="pain" className="block font-bold text-[18px]">
              {t('lp.try_label', 'Knee pain, 0 to 10')}
            </label>
            <output htmlFor="pain" className="block h-display lp-display tabular-nums mt-2">
              {pain}
              <span className="text-ink/55">/10</span>
            </output>
            <input
              id="pain"
              type="range"
              min={0}
              max={10}
              step={1}
              value={pain}
              aria-valuetext={`${pain} ${outOf}`}
              onChange={(e) => setPain(Number(e.target.value))}
              className="lp-range mt-4"
            />
            <div className="mt-6 flex flex-wrap gap-2">
              {presets.map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPain(v)}
                  aria-pressed={pain === v}
                  className={`min-h-11 rounded-full px-4 text-[15px] font-semibold cursor-pointer transition-[background-color,color,transform] active:scale-[.97] ${
                    pain === v ? 'bg-ink text-paper' : 'bg-sand text-ink hover:bg-sand-deep'
                  }`}
                >
                  {v} · {l}
                </button>
              ))}
            </div>
            {/* The outcome sits right under the control, so it is seen on a phone and announced to screen readers. */}
            <p className="mt-6 text-[18px] font-semibold max-w-[40ch]" aria-live="polite">
              <span className="lp-swap block" key={lv}>
                {t(`lp.l${lv}_note`, '')}
              </span>
            </p>
          </div>
        </div>
        <div className="lg:col-span-7 lg:ps-8" data-reveal style={{ '--d': 2 } as React.CSSProperties}>
          <div className="rounded-[28px] bg-white p-5 sm:p-8" data-ui>
            <p className="h-display text-[26px] px-1">{t('lp.try_tuesday', "Sara's Tuesday")}</p>
            <ul className="mt-6 grid gap-3">
              {rows.map((r, i) => (
                <li key={`${r.svc}:${r.meta}`} className={`lp-swap rounded-2xl p-5 ${tint[r.svc]}`} style={{ animationDelay: `${i * 70}ms` }}>
                  <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="h-display text-[26px]">{r.title}</span>
                    <span className="text-[15px] font-semibold">
                      {r.delta ? `${t('lp.changed_by', 'Changed by')} ${who[r.svc]}` : t('lp.as_planned', 'As planned')}
                    </span>
                  </p>
                  <p className="mt-2 text-[18px] leading-[1.5]">{r.meta}</p>
                  {r.delta && (
                    <p className="mt-2 text-[15px]">
                      <strong className="font-bold">{t('lp.what_changed', 'What changed')}:</strong> {r.delta}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <Link to="/signup" className={`${primary} mt-6`}>
            {t('lp.try_cta', 'Start your own free assessment')} <Arrow />
          </Link>
        </div>
      </div>
    </section>
  )
}

function How() {
  const { t } = useLanguage()
  const stages: [Svc, string, string, string, string][] = [
    ['move', '14%', t('lp.how_s1_d', '8 minutes'), t('lp.how_who1', 'You'), t('lp.how_s1', 'First, tell us your goals, training days, any pain and what you eat.')],
    ['eat', '26%', t('lp.how_s2_d', 'Within a day'), t('lp.how_who2', 'We match, you choose'), t('lp.how_s2', 'Then pick the trainer, dietitian or PT you like from your matches.')],
    ['recover', '60%', t('lp.how_s3_d', 'Every week after'), t('lp.how_who3', 'Your three specialists'), t('lp.how_s3', 'After that, follow one calendar while your team adjusts it each week.')],
  ]
  return (
    <section id="how" className="bg-paper pb-[clamp(96px,12vw,180px)]">
      <div className={wrap}>
        <h2 className="h-display lp-h2" data-reveal>
          {t('lp.how_title', 'A plan by tomorrow')}
        </h2>
        <ol className="mt-16 flex flex-col gap-[6px] md:flex-row" data-ui>
          {stages.map(([svc, basis, dur, actor, clause], i) => (
            <li key={svc} className="flex flex-col md:min-w-[10rem]" style={{ flexBasis: basis, flexGrow: 0, flexShrink: 1 }} data-reveal>
              <div
                className={`${fill[svc]} min-h-[120px] md:h-[22vh] md:min-h-[180px] rounded-xl p-5 text-ink flex flex-col justify-between gap-4`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <p className="h-display text-[clamp(22px,2vw,30px)]">{dur}</p>
                <p className="text-[15px] font-bold">{actor}</p>
              </div>
              <p className="mt-4 text-[18px] leading-[1.5] max-w-[24ch] pe-2">{clause}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Sheets() {
  const { t } = useLanguage()
  const sheets: { svc: Svc; name: string; body: string; by: string; src: string; alt: string; w: number; h: number }[] = [
    {
      svc: 'move',
      name: t('lp.sheet_move', 'Move: strength you can keep'),
      body: t('lp.sheet_move_p', 'Three to five workouts a week, at home or in a gym, with a video demo for every exercise and a weekly check-in that changes the load.'),
      by: t('lp.sheet_move_by', 'With Coach Karim Adel, 9 years coaching'),
      src: movePhoto,
      alt: t('lp.move_alt', 'A kettlebell resting on a training mat'),
      w: 1400,
      h: 933,
    },
    {
      svc: 'eat',
      name: t('lp.sheet_eat', 'Eat: food you already like'),
      body: t('lp.sheet_eat_p', 'Meal plans built from ful, koshari, grilled chicken and lentil soup, with calories and protein set to your goal. Swap any meal and your dietitian rebalances the day.'),
      by: t('lp.sheet_eat_by', 'With Hana Ibrahim, RD, 7 years'),
      src: `${media}/ful-medames.jpg`,
      alt: t('lp.ful_alt', 'A plate of ful medames with eggs, bread, olives and salad'),
      w: 1200,
      h: 1224,
    },
    {
      svc: 'recover',
      name: t('lp.sheet_rec', 'Recover: rehab with a PT'),
      body: t('lp.sheet_rec_p', 'Short daily routines for the injured area, pain check-ins reviewed within 24 hours, and limits your trainer sees the moment they change.'),
      by: t('lp.sheet_rec_by', 'With Dr. Mona Fathy, PT, 11 years'),
      src: recoverPhoto,
      alt: t('lp.rec_alt', 'A physical therapist guiding a resistance band exercise'),
      w: 1400,
      h: 933,
    },
  ]
  return (
    <section id="services" className="bg-paper">
      <div className={wrap}>
        <h2 className="h-display lp-h2 pb-12" data-reveal>
          {t('lp.sheets_title', 'Three experts, one plan')}
        </h2>
      </div>
      <div className="px-[max(0px,calc((100vw-1440px)/2))]">
        {sheets.map((s, i) => (
          <article
            key={s.svc}
            className={`${fill[s.svc]} text-ink sticky rounded-t-[28px] overflow-hidden md:h-[66svh] grid md:grid-cols-12`}
            style={{ top: `calc(var(--lp-header) + ${i} * var(--lp-band))` }}
          >
            <h3 className="md:col-span-12 h-display lp-h3 h-[var(--lp-band)] flex items-center px-[var(--lp-gutter)]">
              <span className="truncate">{s.name}</span>
            </h3>
            <div className="md:col-span-6 flex flex-col justify-between gap-8 p-[var(--lp-gutter)] pt-4">
              <p className="text-[18px] leading-[1.55] max-w-[40ch]">{s.body}</p>
              <p className="text-[18px] font-bold pb-2">{s.by}</p>
            </div>
            <div className="md:col-span-6 aspect-[4/3] md:aspect-auto md:h-[calc(66svh-var(--lp-band))] overflow-hidden bg-ink/10">
              <img src={s.src} alt={s.alt} width={s.w} height={s.h} loading="lazy" className="h-full w-full object-cover" />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function Team() {
  const { t } = useLanguage()
  const people = (['mona', 'karim', 'hana'] as const).map((id) => {
    const s = specialists.find((p) => p.id === id)!
    return {
      id,
      photo: thumb(s.photo),
      name: t(`lp.${id}_name`, s.name),
      bio: t(`lp.${id}_bio`, s.about),
      facts: [t(`lp.${id}_role`, s.role), t(`lp.${id}_cred`, s.cred), t(`lp.${id}_years`, `${s.years} years`), t(`lp.${id}_langs`, s.langs)],
    }
  })
  return (
    <section id="team" className="bg-paper py-[clamp(96px,12vw,180px)]">
      <div className={wrap}>
        <div className="grid gap-6 lg:grid-cols-12 items-end">
          <h2 className="h-display lp-h2 lg:col-span-8" data-reveal>
            {t('lp.team_title', "The people on Sara's plan")}
          </h2>
          <div className="lg:col-span-4 lg:justify-self-end" data-reveal style={{ '--d': 1 } as React.CSSProperties}>
            <Link to="/signup" className={`group ${pill} bg-sand text-ink hover:bg-sand-deep`}>
              {t('lp.team_cta', 'Get matched with your team')} <Arrow />
            </Link>
          </div>
        </div>
        <div className="mt-20 grid gap-20">
          {people.map((p) => (
            <div key={p.id} className="grid gap-6 lg:grid-cols-12" data-reveal>
              <ul className="lg:col-span-3 flex flex-wrap gap-x-4 gap-y-1 lg:block lg:space-y-1 text-[15px] font-semibold lg:pt-2 order-2 lg:order-1">
                {p.facts.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <p className="lp-lead lg:col-span-9 order-1 lg:order-2">
                <img src={p.photo} alt="" width={240} height={240} loading="lazy" className="float-start me-[0.5em] mb-1 size-[3.9em] object-cover object-top" />
                <strong className="font-bold">{p.name}</strong> {p.bio}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  const { t } = useLanguage()
  const cta = t('landing.hero_cta', 'Start free assessment')
  const plans = [
    {
      name: t('lp.plan_starter', 'Starter'),
      blurb: t('lp.blurb_starter', 'One specialist, one focus.'),
      price: '399',
      tile: 'bg-sand',
      strip: 'bg-sand-deep',
      h: 'md:h-[440px]',
      feats: [t('pricing.starter_f1', 'Plan from a trainer or dietitian'), t('pricing.starter_f2', 'Weekly plan updates'), t('pricing.starter_f3', 'In-app messages, replies within 48 h')],
    },
    {
      name: t('lp.plan_plus', 'Plus'),
      blurb: t('lp.blurb_plus', 'Training and food together.'),
      price: '899',
      tile: 'bg-eat',
      strip: 'bg-eat-deep',
      h: 'md:h-[540px]',
      feats: [t('pricing.plus_f1', 'Trainer and dietitian on your plan'), t('pricing.plus_f2', 'Meals from Egyptian staples'), t('pricing.plus_f3', 'Messages, replies within 24 h'), t('pricing.plus_f4', '2 video sessions a month')],
    },
    {
      name: t('lp.plan_full', 'Full Team'),
      blurb: t('lp.blurb_full', "The whole team, like Sara's plan above."),
      price: '1,499',
      tile: 'bg-recover',
      strip: 'bg-recover-deep',
      h: 'md:h-[660px]',
      feats: [
        t('pricing.full_team_f1', 'All three specialists share one plan'),
        t('pricing.full_team_f2', 'Pain check-ins reviewed within 24 h'),
        t('pricing.full_team_f3', 'Rehab routines with video demos'),
        t('pricing.full_team_f4', '4 video sessions a month'),
        t('pricing.full_team_f5', 'Change specialists whenever you like'),
      ],
    },
  ]
  return (
    <section id="pricing" className="bg-paper pb-[clamp(96px,12vw,180px)]">
      <div className={wrap}>
        <div className="grid gap-5 lg:grid-cols-12 items-end">
          <h2 className="h-display lp-h2 lg:col-span-7" data-reveal>
            {t('lp.pricing_title', 'Pay for the team you need')}
          </h2>
          <p className="lg:col-span-5 text-[18px] leading-[1.55] max-w-[40ch]" data-reveal style={{ '--d': 1 } as React.CSSProperties}>
            {t('lp.pricing_note', 'Every plan starts with the free assessment: about 8 minutes, no card needed.')}
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:gap-2 md:grid-cols-3 md:items-end">
          {plans.map((p, i) => (
            <div key={p.price} className={`${p.tile} ${p.h} rounded-2xl overflow-hidden flex flex-col text-ink`} data-reveal style={{ '--d': i } as React.CSSProperties}>
              <div className="p-7 flex-1">
                <h3 className="h-display text-[26px]">{p.name}</h3>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="num lp-h3">{p.price}</span>
                  <span className="font-semibold text-[15px]">{t('landing.egp_month', 'EGP / month')}</span>
                </p>
                <p className="mt-4 text-[18px] font-bold">{p.blurb}</p>
                <ul className="mt-3 space-y-2 text-[18px] leading-[1.4]">
                  {p.feats.map((f, j) => (
                    <li key={j}>{f}</li>
                  ))}
                </ul>
              </div>
              <Link
                to="/signup"
                aria-label={`${cta}: ${p.name}`}
                className={`${p.strip} h-16 px-7 flex items-center font-bold text-[18px] underline-offset-[6px] decoration-2 hover:underline`}
              >
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Faq() {
  const { t } = useLanguage()
  const faqs: [string, string, string?][] = [
    [t('faq.q1', 'Is this medical advice?'), t('faq.a1', 'No. Our physical therapists give rehab guidance for training, not a diagnosis. If something feels wrong, see a doctor first. We will tell you when that applies.')],
    [t('lp.faq_q7', 'What does it cost after the assessment?'), t('lp.faq_a7', 'The assessment is free. After it you choose Starter, Plus or Full Team at 399, 899 or 1,499 EGP a month. If your organization sponsors you, you pay nothing.')],
    [t('faq.q2', 'Do I need a gym?'), t('faq.a2', 'No. Most plans work with a pair of dumbbells or a resistance band at home. Tell us what you have and your trainer builds around it.')],
    [t('faq.q3', 'How do sessions work?'), t('faq.a3', 'You book a 30 or 45 minute video call with a specialist. Between sessions you message them and follow your daily plan in the app.')],
    [t('lp.faq_q6', 'Can I cancel a session?'), t('lp.faq_a6', 'Yes, up to 12 hours before it starts. Inside 12 hours the slot stays booked, because your specialist kept it for you.')],
    [t('faq.q4', 'Can I switch specialists?'), t('faq.a4', 'Yes, any time and at no cost. Your plan and history stay with you, and the new specialist reads them before your first call.')],
    [t('faq.q5', 'How is my health data used?'), t('faq.a5', 'Only your own specialists see your answers. We do not sell data or share it with gyms or brands. You can export or delete it from settings.'), 'faq-data'],
  ]
  return (
    <section id="faq" className="bg-paper pb-[clamp(96px,12vw,180px)]">
      <div className={wrap}>
        <h2 className="h-display lp-h2" data-reveal>
          {t('landing.faq_title', 'Questions people ask first')}
        </h2>
        <div className="mt-14 lg:mt-20 grid lg:grid-cols-12">
          <div className="lg:col-start-5 lg:col-span-8 flex flex-col gap-3">
            {faqs.map(([q, a, id], i) => (
              <details key={i} id={id} open={i === 0} className="group rounded-2xl -mx-5 px-5 open:bg-sand transition-colors" data-reveal style={{ '--d': i } as React.CSSProperties}>
                <summary className="min-h-16 py-4 flex items-center justify-between gap-6 lp-lead font-semibold cursor-pointer list-none">
                  {q}
                  <span className="lp-chev" aria-hidden />
                </summary>
                <p className="pb-6 text-[18px] leading-[1.55] max-w-[52ch]">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Organizations() {
  const { t } = useLanguage()
  return (
    <section id="organizations" className="bg-recover-tint">
      <div className={`${wrap} py-[clamp(80px,9vw,140px)] grid gap-8 lg:grid-cols-12 items-end`}>
        <h2 className="h-display lp-h2 lg:col-span-6" data-reveal>
          {t('lp.org_title', 'Sponsoring a team?')}
        </h2>
        <div className="lg:col-span-6" data-reveal style={{ '--d': 1 } as React.CSSProperties}>
          <p className="text-[18px] leading-[1.55] max-w-[52ch]">
            {t('lp.org_sub', "Members join with an invite code and pay nothing. Your admins see seat use and totals, never anyone's health data.")}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link to="/register-org" className={`group ${pill} bg-ink text-paper`}>
              {t('landing.org_reg_btn', 'Register your organization')} <Arrow />
            </Link>
            <Link to="/join" className="min-h-11 inline-flex items-center font-semibold underline underline-offset-[6px] decoration-2">
              {t('lp.org_join', 'Join with an invite code')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function Closing() {
  const { t } = useLanguage()
  return (
    <section className="bg-ink text-paper">
      <div className={`${wrap} min-h-[80svh] md:min-h-[90svh] py-[clamp(80px,9vw,140px)] flex flex-col justify-between gap-16`}>
        <h2 className="h-display lp-display" data-reveal>
          {t('lp.cta_l1', 'Tell us where')}
          <br />
          {t('lp.cta_l2', 'it hurts.')}
        </h2>
        <div className="grid gap-8 lg:grid-cols-12 items-end" data-reveal style={{ '--d': 1 } as React.CSSProperties}>
          <p className="lg:col-span-5 text-[clamp(18px,1.6vw,22px)] leading-[1.5]">
            {t('lp.cta_sub', 'The free assessment takes about 8 minutes. No card needed, and you choose your specialists after.')}
          </p>
          <div className="lg:col-span-4 lg:col-start-9 lg:justify-self-end">
            <Link to="/signup" className={`${primary} w-full lg:w-auto`}>
              {t('landing.hero_cta', 'Start free assessment')} <Arrow />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="bg-eat text-ink">
      <div className={`${wrap} md:min-h-[72svh] py-10 flex flex-col justify-between gap-20`}>
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 grid gap-4 sm:grid-cols-2 text-[15px] leading-[1.5]">
            <div>
              <Wordmark />
              <p className="mt-3">{t('landing.footer_tagline', 'Training, food and rehab on one plan. Made in Cairo.')}</p>
            </div>
            <p>{t('landing.footer_disclaimer', 'Rebound offers coaching and education, not medical diagnosis or treatment. Talk to your doctor before starting a new program, especially after an injury or if you have a medical condition.')}</p>
          </div>
          <a href="#top" className="lg:col-span-2 lg:col-start-11 lg:justify-self-end min-h-11 font-semibold underline underline-offset-[6px] decoration-2">
            {t('lp.footer_top', 'Back to top')}
          </a>
        </div>
        <div>
          <h2 className="text-[18px] font-bold">{t('lp.footer_write', 'Write to the team')}</h2>
          <a
            href="mailto:hello@rebound.eg"
            dir="ltr"
            className="mt-2 block h-display text-[8.4vw] leading-[0.95] tracking-[-0.05em] whitespace-nowrap hover:text-ink/75 transition-colors"
          >
            hello@rebound.eg
          </a>
          <div className="mt-10 grid gap-2 md:grid-cols-3 text-[15px]">
            <p className="flex flex-wrap gap-x-5 gap-y-1">
              <Link to="/signup?role=specialist" className="underline underline-offset-4">
                {t('auth.join_specialist', 'Join as a specialist')}
              </Link>
              <a href="#faq-data" className="underline underline-offset-4">
                {t('lp.footer_data', 'How we use your data')}
              </a>
              <Link to="/login" className="underline underline-offset-4">
                {t('landing.login', 'Log in')}
              </Link>
            </p>
            <p className="md:text-center" dir="ltr">
              Ful medames photo: Miansari66, CC0, via Wikimedia Commons
            </p>
            <p className="md:text-end">{t('lp.footer_city', 'Cairo, 2026')}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function Landing() {
  useReveal()
  return (
    <div className="lp" id="top">
      <Header />
      <main>
        <Hero />
        <TryIt />
        <How />
        <Sheets />
        <Team />
        <Pricing />
        <Faq />
        <Organizations />
        <Closing />
      </main>
      <Footer />
    </div>
  )
}
