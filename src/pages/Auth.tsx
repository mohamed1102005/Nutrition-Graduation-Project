import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import {
  Check,
  Circle,
  FileText,
  UploadCloud,
  X,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Award,
  BadgeCheck,
  Building2,
  DollarSign,
  Plus,
  Copy,
} from 'lucide-react'
import { Btn, Field, PasswordInput, inputCls, Wordmark, SVC, Tag, LanguageToggle } from '../ui'
import type { Svc } from '../data'
import { api, ApiError } from '../api'
import { useLanguage } from '../context/LanguageContext'

function AuthLayout({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const { t } = useLanguage()
  const serviceText = {
    move: 'text-move',
    eat: 'text-eat',
    recover: 'text-recover',
  } as const
  const bands: [Svc, string, string][] = [
    ['move', t('auth.banner_move', 'Workouts that fit your week.'), 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=900&q=85'],
    ['eat', t('auth.banner_eat', 'Meals made from real Egyptian food.'), 'https://images.unsplash.com/photo-1568625357288-d3b0051abf0e?auto=format&fit=crop&w=700&q=85'],
    ['recover', t('auth.banner_recover', 'Rehab your trainer can see.'), 'https://images.unsplash.com/photo-1645005512942-a17817fb7c11?auto=format&fit=crop&w=700&q=85'],
  ]
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col" aria-hidden>
        {bands.map(([k, text, image]) => {
          const s = SVC[k]
          return (
            <div key={k} className="relative flex flex-1 flex-col justify-end overflow-hidden bg-ink p-8 xl:p-12">
              <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-ink/75" />
              <div className={`relative ${serviceText[k]}`}>
                <s.Icon size={32} strokeWidth={2.4} />
                <p className="h-display mt-3 text-[40px] xl:text-[56px]">{s.label}</p>
                <p className="mt-1 font-bold xl:text-[18px]">{text}</p>
              </div>
              <div className="pointer-events-none absolute inset-0 bg-ink/15" />
            </div>
          )
        })}
      </div>
      <div className="flex h-3 lg:hidden" aria-hidden>
        {bands.map(([k]) => (
          <span key={k} className={`flex-1 ${SVC[k].bg}`} />
        ))}
      </div>
      <main className="flex flex-col px-5 sm:px-12 py-8 lg:py-12">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="Rebound home">
            <Wordmark />
          </Link>
          <LanguageToggle />
        </div>
        <div className="flex-1 flex items-center">
          <div className={`w-full ${wide ? 'max-w-[560px]' : 'max-w-[440px]'} mx-auto py-10 transition-[max-width,opacity]`}>{children}</div>
        </div>
      </main>
    </div>
  )
}

const emailOk = (v: string) => /^\S+@\S+\.\S+$/.test(v)

export function Login() {
  const nav = useNavigate()
  const { t } = useLanguage()
  const [f, setF] = useState({ email: '', password: '' })
  const [err, setErr] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validate = (x = f) => ({
    email: !x.email ? t('auth.err_enter_email', 'Enter your email.') : !emailOk(x.email) ? t('auth.err_incomplete_email', 'That email looks incomplete. Try name@example.com.') : '',
    password: !x.password ? t('auth.err_enter_pw', 'Enter your password.') : '',
  })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const v = validate()
    setErr(v)
    if (v.email || v.password) return

    setLoading(true)
    try {
      const res = await api.login(f.email, f.password)
      const user = res.user
      if (user.role === 'org_admin') {
        nav('/app/org')
      } else if (user.role === 'admin') {
        nav('/app/overview')
      } else if (user.role === 'finance') {
        nav('/app/finance/overview')
      } else if (user.role === 'specialist') {
        nav('/app/today')
      } else {
        if (user.onboardingCompleted === false) {
          nav('/onboarding')
        } else {
          nav('/app/today')
        }
      }
    } catch (error: any) {
      setErr({
        password: error?.message || t('auth.err_login_failed', 'Login failed. Check your email and password.'),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="h-display text-[32px]">{t('auth.welcome_back', 'Welcome back')}</h1>
      <p className="text-ink-2 mt-2">{t('auth.login_sub', "Log in to see today's plan.")}</p>
      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        <Field label={t('auth.email', 'Email')} error={err.email}>
          {(p) => (
            <input {...p} type="email" autoComplete="email" className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} onBlur={() => setErr({ ...err, email: validate().email })} />
          )}
        </Field>
        <Field label={t('auth.password', 'Password')} error={err.password}>
          {(p) => <PasswordInput {...p} autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />}
        </Field>
        <div className="flex justify-end -mt-2">
          <a href="#" className="font-semibold underline underline-offset-4 min-h-11 inline-flex items-center">
            {t('auth.forgot_pw', 'Forgot password?')}
          </a>
        </div>
        <Btn type="submit" className="w-full" disabled={loading}>
          {loading ? t('auth.logging_in', 'Logging in...') : t('auth.login_btn', 'Log in')}
        </Btn>
      </form>
      <p className="mt-8 text-ink-2">
        {t('auth.new_to_rebound', 'New to Rebound?')}{' '}
        <Link to="/signup" className="font-bold text-ink underline underline-offset-4">
          {t('auth.create_account', 'Create an account')}
        </Link>
      </p>
    </AuthLayout>
  )
}

const EGYPTIAN_CITIES = ['Cairo', 'Giza', 'Alexandria', 'Mansoura', 'Tanta', 'Assiut', 'Port Said', 'Suez', 'Ismailia', 'Aswan']

const FOCUS_SUGGESTIONS: Record<string, string[]> = {
  Trainer: ['Strength & Conditioning', 'Fat loss', 'Muscle Hypertrophy', 'Athletic Performance', 'Mobility & Posture', 'HIIT'],
  Dietitian: ['Clinical Nutrition', 'Fat loss & Weight Management', 'Sports Nutrition', 'Diabetes & PCOS Care', 'Gut Health', 'Muscle Gain'],
  'Physical therapist': ['Sports Rehab', 'ACL & Knee Recovery', 'Spine & Lower Back Rehab', 'Shoulder & Rotator Cuff', 'Post-Surgery Rehab', 'Manual Therapy'],
}

export function Signup() {
  const nav = useNavigate()
  const { t } = useLanguage()
  const [params] = useSearchParams()
  const specialist = params.get('role') === 'specialist'
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const [f, setF] = useState({
    name: '',
    email: '',
    password: '',
    profession: specialist ? 'Physical therapist' : '',
    focusTags: ['Sports Rehab', 'ACL & Knee Recovery'] as string[],
    customFocus: '',
    // Step 2: Legal Papers & Licensure
    nationalId: '',
    syndicateId: '',
    credentials: '',
    documents: [
      { name: 'Syndicate_Licence_Registration.pdf', size: 'PDF, 1.2 MB', type: 'license' },
      { name: 'University_Degree_Certificate.pdf', size: 'PDF, 0.8 MB', type: 'certificate' },
      { name: 'National_ID_Card.jpg', size: 'JPG, 0.4 MB', type: 'national_id' },
    ] as { name: string; size: string; type: string }[],
    newDocName: '',
    newDocType: 'certificate',
    // Step 3: Practice & Rates
    city: 'Cairo',
    yearsExperience: 5,
    rateEgp: 500,
    packagePriceEgp: 1800,
    languages: 'Arabic, English',
    bio: '',
  })

  const [err, setErr] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const rules = [
    [t('auth.min_chars', 'At least 8 characters'), f.password.length >= 8],
    [t('auth.one_number', 'One number'), /\d/.test(f.password)],
    [t('auth.one_letter', 'One letter'), /[a-zA-Z]/.test(f.password)],
  ] as const

  const validateStep1 = () => {
    const e: Record<string, string> = {}
    if (f.name.trim().length < 2) e.name = 'Enter your full legal name.'
    if (!emailOk(f.email)) e.email = 'Enter a valid email address.'
    if (!rules.every((r) => r[1])) e.password = 'Your password must meet all rules below.'
    if (specialist && !f.profession) e.profession = 'Select your healthcare/fitness profession.'
    return e
  }

  const validateStep2 = () => {
    const e: Record<string, string> = {}
    if (!f.nationalId.trim() || f.nationalId.trim().length < 8) {
      e.nationalId = 'Enter your 14-digit National ID or Passport Number.'
    }
    if (!f.syndicateId.trim() || f.syndicateId.trim().length < 3) {
      e.syndicateId = 'Enter your Syndicate practice license registration ID.'
    }
    if (!f.credentials.trim() || f.credentials.trim().length < 3) {
      e.credentials = 'Enter your university degree, credentials and certifications.'
    }
    if (f.documents.length === 0) {
      e.documents = 'Please attach at least one legal credential document.'
    }
    return e
  }

  const validateStep3 = () => {
    const e: Record<string, string> = {}
    if (!f.city.trim()) e.city = 'Select or enter your practice city.'
    if (Number(f.yearsExperience) < 0) e.yearsExperience = 'Years of experience cannot be negative.'
    if (!f.rateEgp || Number(f.rateEgp) <= 0) e.rateEgp = 'Enter your standard session rate in EGP.'
    return e
  }

  const toggleFocusTag = (tag: string) => {
    setF((prev) => ({
      ...prev,
      focusTags: prev.focusTags.includes(tag)
        ? prev.focusTags.filter((t) => t !== tag)
        : [...prev.focusTags, tag],
    }))
  }

  const addCustomFocus = (e?: FormEvent) => {
    if (e) e.preventDefault()
    const val = f.customFocus.trim()
    if (val && !f.focusTags.includes(val)) {
      setF((prev) => ({
        ...prev,
        focusTags: [...prev.focusTags, val],
        customFocus: '',
      }))
    }
  }

  const removeDoc = (index: number) => {
    setF((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }))
  }

  const addDocument = (e?: FormEvent) => {
    if (e) e.preventDefault()
    const name = f.newDocName.trim()
    if (!name) return
    const docEntry = {
      name: name.endsWith('.pdf') || name.endsWith('.jpg') || name.endsWith('.png') ? name : `${name}.pdf`,
      size: 'PDF, 1.1 MB',
      type: f.newDocType,
    }
    setF((prev) => ({
      ...prev,
      documents: [...prev.documents, docEntry],
      newDocName: '',
    }))
    setErr((prev) => ({ ...prev, documents: '' }))
  }

  const handleNextStep = (e: FormEvent) => {
    e.preventDefault()
    if (step === 1) {
      const v = validateStep1()
      setErr(v)
      if (Object.values(v).some(Boolean)) return
      setStep(2)
    } else if (step === 2) {
      const v = validateStep2()
      setErr(v)
      if (Object.values(v).some(Boolean)) return
      setStep(3)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()

    if (!specialist) {
      const v = validateStep1()
      setErr(v)
      if (Object.values(v).some(Boolean)) return

      setLoading(true)
      try {
        await api.register({
          name: f.name.trim(),
          email: f.email.trim(),
          password: f.password,
          role: 'client',
        })
        nav('/onboarding')
      } catch (error: any) {
        if (error?.code === 'EMAIL_IN_USE') {
          setErr({ email: 'This email is already registered. Try logging in.' })
        } else {
          setErr({ password: error?.message || 'Failed to create account.' })
        }
      } finally {
        setLoading(false)
      }
      return
    }

    const v3 = validateStep3()
    setErr(v3)
    if (Object.values(v3).some(Boolean)) return

    setLoading(true)
    try {
      const typeMap: Record<string, string> = {
        Trainer: 'trainer',
        Dietitian: 'nutritionist',
        'Physical therapist': 'physical_therapist',
      }

      await api.register({
        name: f.name.trim(),
        email: f.email.trim(),
        password: f.password,
        role: 'specialist',
        type: typeMap[f.profession] || 'physical_therapist',
        credentials: f.credentials.trim(),
        nationalId: f.nationalId.trim(),
        syndicateId: f.syndicateId.trim(),
        city: f.city.trim(),
        yearsExperience: Number(f.yearsExperience) || 0,
        rateEgp: Number(f.rateEgp) || 500,
        languages: f.languages.trim() || 'Arabic, English',
        bio: f.bio.trim() || undefined,
        focusTags: f.focusTags,
        documents: f.documents,
        credentialDoc: f.documents[0]?.name || 'Syndicate_Licence_Registration.pdf',
        packages: f.packagePriceEgp
          ? [
              {
                name: '4-Session Clinical Block',
                description: 'Four private sessions with care plan design and progress reviews.',
                sessionsCount: 4,
                priceEgp: Number(f.packagePriceEgp),
              },
            ]
          : undefined,
      })

      nav('/app/today')
    } catch (error: any) {
      if (error?.code === 'EMAIL_IN_USE') {
        setStep(1)
        setErr({ email: 'This email is already registered. Try logging in.' })
      } else {
        setErr({ global: error?.message || 'Failed to complete specialist registration.' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout wide={specialist}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="h-display text-[30px] sm:text-[34px]">
            {specialist ? t('auth.join_specialist_title', 'Join as a verified specialist') : t('auth.signup_title', 'Create your account')}
          </h1>
          <p className="text-ink-2 mt-1.5 text-[15px]">
            {specialist
              ? t('auth.join_specialist_sub', 'Trainers, dietitians, and physical therapists. Submit credentials and legal papers for medical licensing review.')
              : t('auth.signup_sub', 'Free to start. Pick specialists after your assessment.')}
          </p>
        </div>
      </div>

      {specialist && (
        <div className="mt-6 mb-8 bg-paper border border-line rounded-2xl p-4">
          <div className="flex items-center justify-between text-[13px] font-semibold text-ink-2 mb-2.5">
            <span className={step === 1 ? 'text-ink font-bold' : ''}>{t('auth.step1_title', '1. Account & Specialty')}</span>
            <span className={step === 2 ? 'text-ink font-bold' : ''}>{t('auth.step2_title', '2. Legal Papers & Licensure')}</span>
            <span className={step === 3 ? 'text-ink font-bold' : ''}>{t('auth.step3_title', '3. Practice & Rates')}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className={`h-2 rounded-full transition-all ${step >= 1 ? 'bg-ink' : 'bg-line'}`} />
            <div className={`h-2 rounded-full transition-all ${step >= 2 ? 'bg-ink' : 'bg-line'}`} />
            <div className={`h-2 rounded-full transition-all ${step >= 3 ? 'bg-ink' : 'bg-line'}`} />
          </div>
        </div>
      )}

      {err.global && (
        <div className="mb-6 rounded-xl bg-bad-tint p-4 text-[14px] font-medium text-[#a02a2a] border border-[#a02a2a]/20">
          {err.global}
        </div>
      )}

      {/* CLIENT SIGNUP OR SPECIALIST STEP 1 */}
      {(!specialist || step === 1) && (
        <form onSubmit={specialist ? handleNextStep : submit} noValidate className="space-y-5">
          <Field label={t('auth.legal_name', 'Full legal name')} error={err.name}>
            {(p) => (
              <input
                {...p}
                autoComplete="name"
                className={inputCls}
                placeholder="e.g. Dr. Tarek Mansour"
                value={f.name}
                onChange={(e) => setF({ ...f, name: e.target.value })}
              />
            )}
          </Field>

          {specialist && (
            <Field label={t('auth.specialist_prof', 'Clinical / Coaching Profession')} error={err.profession}>
              {(p) => (
                <select
                  {...p}
                  className={inputCls}
                  value={f.profession}
                  onChange={(e) => setF({ ...f, profession: e.target.value })}
                >
                  <option value="Physical therapist">Physical Therapist (Recover pillar)</option>
                  <option value="Dietitian">Clinical Dietitian / Nutritionist (Eat pillar)</option>
                  <option value="Trainer">Personal Trainer / Coach (Move pillar)</option>
                </select>
              )}
            </Field>
          )}

          {specialist && (
            <div>
              <label className="label block text-ink mb-1.5 font-semibold text-[14px]">
                {t('auth.focus_areas', 'Specialization & Focus Areas')}
              </label>
              <p className="text-[13px] text-ink-2 mb-2.5">
                {t('auth.focus_areas_sub', 'Select areas matching your clinical practice:')}
              </p>
              <div className="flex flex-wrap gap-2">
                {(FOCUS_SUGGESTIONS[f.profession] || []).map((tag) => {
                  const active = f.focusTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleFocusTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all border ${
                        active
                          ? 'bg-ink text-white border-ink shadow-sm'
                          : 'bg-paper text-ink-2 border-line hover:border-ink hover:text-ink'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}
                      {tag}
                    </button>
                  )
                })}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder={t('auth.add_focus_tag', 'Add custom specialty tag...')}
                  className={`${inputCls} text-[14px]`}
                  value={f.customFocus}
                  onChange={(e) => setF({ ...f, customFocus: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCustomFocus()
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => addCustomFocus()}
                  className="px-4 py-2 bg-paper border border-line rounded-xl text-[14px] font-bold text-ink hover:border-ink cursor-pointer"
                >
                  {t('auth.add_btn', 'Add')}
                </button>
              </div>
            </div>
          )}

          <Field label={t('auth.email_addr', 'Email address')} error={err.email}>
            {(p) => (
              <input
                {...p}
                type="email"
                autoComplete="email"
                className={inputCls}
                placeholder="name@rebound.eg"
                value={f.email}
                onChange={(e) => setF({ ...f, email: e.target.value })}
              />
            )}
          </Field>

          <div>
            <Field label={t('auth.password', 'Password')} error={err.password}>
              {(p) => (
                <PasswordInput
                  {...p}
                  autoComplete="new-password"
                  value={f.password}
                  onChange={(e) => setF({ ...f, password: e.target.value })}
                />
              )}
            </Field>
            <ul className="-mt-1 space-y-1" aria-label="Password rules">
              {rules.map(([tText, ok]) => (
                <li
                  key={tText}
                  className={`flex items-center gap-2 text-[14px] ${
                    ok ? 'text-[#1d6b3d] font-semibold' : 'text-ink-2'
                  }`}
                >
                  {ok ? <Check size={16} strokeWidth={3} aria-hidden /> : <Circle size={16} aria-hidden />}
                  {tText}
                  <span className="sr-only">{ok ? ', done' : ', not yet'}</span>
                </li>
              ))}
            </ul>
          </div>

          <Btn type="submit" className="w-full" disabled={loading}>
            {specialist ? (
              <span className="flex items-center justify-center gap-2">
                {t('auth.next_legal', 'Next: Legal Papers & Licensure')} <ArrowRight size={18} />
              </span>
            ) : loading ? (
              t('auth.creating_btn', 'Creating account...')
            ) : (
              t('auth.create_btn', 'Create account')
            )}
          </Btn>
        </form>
      )}

      {/* SPECIALIST STEP 2: LEGAL PAPERS & LICENSURE */}
      {specialist && step === 2 && (
        <form onSubmit={handleNextStep} noValidate className="space-y-5">
          <div className="p-4 rounded-xl bg-sand/60 border border-line flex items-start gap-3">
            <ShieldCheck size={24} className="text-ink shrink-0 mt-0.5" />
            <div className="text-[13px] leading-relaxed text-ink-2">
              <strong className="text-ink block font-semibold text-[14px]">
                {t('auth.compliance_notice_title', 'Medical Syndicate & Licensing Compliance')}
              </strong>
              {t('auth.compliance_notice_desc', 'Egyptian Ministry of Health and applicable professional syndicate regulations require verifying national identity and clinical accreditation before accepting client bookings.')}
            </div>
          </div>

          <Field
            label={t('auth.national_id', 'National ID or Passport Number')}
            helper={t('auth.national_id_helper', '14-digit Egyptian National ID or valid passport number')}
            error={err.nationalId}
          >
            {(p) => (
              <input
                {...p}
                className={inputCls}
                placeholder="e.g. 29408151201948"
                value={f.nationalId}
                onChange={(e) => setF({ ...f, nationalId: e.target.value })}
              />
            )}
          </Field>

          <Field
            label={t('auth.syndicate_id', 'Syndicate / Practice License Registration Number')}
            helper={t('auth.syndicate_id_helper', 'Registration ID with the Syndicate of Physical Therapy, Doctors, or Sports Syndicate')}
            error={err.syndicateId}
          >
            {(p) => (
              <input
                {...p}
                className={inputCls}
                placeholder="e.g. PT-EG-74921 / 2024"
                value={f.syndicateId}
                onChange={(e) => setF({ ...f, syndicateId: e.target.value })}
              />
            )}
          </Field>

          <Field
            label={t('auth.credentials', 'Academic Qualifications & Degree')}
            helper={t('auth.credentials_helper', 'Degrees, issuing universities, fellowships and clinical certifications')}
            error={err.credentials}
          >
            {(p) => (
              <input
                {...p}
                className={inputCls}
                placeholder="e.g. BSc Physical Therapy (Cairo Univ), MSc Sports Rehabilitation"
                value={f.credentials}
                onChange={(e) => setF({ ...f, credentials: e.target.value })}
              />
            )}
          </Field>

          <div>
            <label className="label block text-ink mb-1.5 font-semibold text-[14px]">
              {t('auth.documents_title', 'Legal Credential Documents & Certificates')}
            </label>
            <p className="text-[13px] text-ink-2 mb-3">
              {t('auth.documents_sub', 'Attach Syndicate license, university certificate, and national ID copies for administration review:')}
            </p>

            {err.documents && (
              <p className="text-[13px] text-[#a02a2a] font-medium mb-2">{err.documents}</p>
            )}

            <div className="space-y-2 mb-4">
              {f.documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl border border-line bg-paper hover:border-ink transition-all"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-ink-2" />
                    <div>
                      <p className="font-semibold text-[14px] text-ink">{doc.name}</p>
                      <p className="text-[12px] text-ink-2">{doc.size} · {t('auth.verified_format', 'Verified format')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDoc(idx)}
                    className="p-1.5 text-ink-2 hover:text-[#a02a2a] transition-colors"
                    aria-label={`Remove document ${doc.name}`}
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t('auth.add_doc_placeholder', 'Add other document (e.g. First_Aid_Cert.pdf)...')}
                className={`${inputCls} text-[14px]`}
                value={f.newDocName}
                onChange={(e) => setF({ ...f, newDocName: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addDocument()
                  }
                }}
              />
              <button
                type="button"
                onClick={() => addDocument()}
                className="px-4 py-2 bg-paper border border-line rounded-xl text-[14px] font-bold text-ink hover:border-ink shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={16} /> {t('auth.attach_btn', 'Attach')}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Btn
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setStep(1)}
            >
              <ArrowLeft size={18} /> {t('common.back', 'Back')}
            </Btn>
            <Btn type="submit" className="flex-[2]">
              {t('auth.next_practice', 'Next: Practice & Rates')} <ArrowRight size={18} />
            </Btn>
          </div>
        </form>
      )}

      {/* SPECIALIST STEP 3: PRACTICE LOGISTICS & RATES */}
      {specialist && step === 3 && (
        <form onSubmit={submit} noValidate className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t('auth.city', 'City / Governorate')} error={err.city}>
              {(p) => (
                <select
                  {...p}
                  className={inputCls}
                  value={f.city}
                  onChange={(e) => setF({ ...f, city: e.target.value })}
                >
                  {EGYPTIAN_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field label={t('auth.years_experience', 'Years of Experience')} error={err.yearsExperience}>
              {(p) => (
                <input
                  {...p}
                  type="number"
                  min="0"
                  max="60"
                  className={inputCls}
                  value={f.yearsExperience}
                  onChange={(e) => setF({ ...f, yearsExperience: Number(e.target.value) })}
                />
              )}
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label={t('auth.session_rate', 'Session Rate (EGP)')}
              helper={t('auth.session_rate_helper', 'Price charged per standard 30-min session')}
              error={err.rateEgp}
            >
              {(p) => (
                <div className="relative">
                  <input
                    {...p}
                    type="number"
                    min="50"
                    step="50"
                    className={inputCls}
                    value={f.rateEgp}
                    onChange={(e) => {
                      const r = Number(e.target.value)
                      setF({
                        ...f,
                        rateEgp: r,
                        packagePriceEgp: Math.round(r * 4 * 0.9),
                      })
                    }}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[14px] font-bold text-ink-2 pointer-events-none">
                    EGP
                  </span>
                </div>
              )}
            </Field>

            <Field
              label={t('auth.package_rate', '4-Session Package (EGP)')}
              helper={t('auth.package_rate_helper', 'Bundle package price with recommended 10% discount')}
            >
              {(p) => (
                <div className="relative">
                  <input
                    {...p}
                    type="number"
                    min="100"
                    step="50"
                    className={inputCls}
                    value={f.packagePriceEgp}
                    onChange={(e) => setF({ ...f, packagePriceEgp: Number(e.target.value) })}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[14px] font-bold text-ink-2 pointer-events-none">
                    EGP
                  </span>
                </div>
              )}
            </Field>
          </div>

          <Field label={t('auth.languages', 'Languages spoken')}>
            {(p) => (
              <input
                {...p}
                className={inputCls}
                placeholder="Arabic, English"
                value={f.languages}
                onChange={(e) => setF({ ...f, languages: e.target.value })}
              />
            )}
          </Field>

          <Field
            label={t('auth.bio', 'Professional Bio & Clinical Philosophy')}
            helper={t('auth.bio_helper', 'Brief summary visible on your public specialist profile')}
          >
            {(p) => (
              <textarea
                {...p}
                rows={3}
                className={`${inputCls} h-auto py-3 leading-relaxed`}
                placeholder="Describe your assessment approach, rehabilitation style, or coaching philosophy..."
                value={f.bio}
                onChange={(e) => setF({ ...f, bio: e.target.value })}
              />
            )}
          </Field>

          <div className="flex gap-3 pt-2">
            <Btn
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setStep(2)}
              disabled={loading}
            >
              <ArrowLeft size={18} /> {t('common.back', 'Back')}
            </Btn>
            <Btn type="submit" className="flex-[2]" disabled={loading}>
              {loading ? t('auth.submitting_app', 'Submitting Application...') : t('auth.submit_verification', 'Submit for Verification')}
            </Btn>
          </div>
        </form>
      )}

      <div className="mt-8 space-y-1 text-ink-2">
        <p>
          {t('auth.have_account', 'Already have an account?')}{' '}
          <Link to="/login" className="font-bold text-ink underline underline-offset-4">
            {t('auth.login_btn', 'Log in')}
          </Link>
        </p>
        <p>
          {t('auth.have_invite', 'Have an invite code?')}{' '}
          <Link to="/join" className="font-bold text-ink underline underline-offset-4">
            {t('auth.join_team', 'Join your team')}
          </Link>
        </p>
        <p>
          {t('auth.sponsor_team', 'Looking to sponsor your team?')}{' '}
          <Link to="/register-org" className="font-bold text-ink underline underline-offset-4">
            {t('auth.register_org', 'Register an organization')}
          </Link>
        </p>
        <p>
          {specialist ? (
            <Link to="/signup" className="font-bold text-ink underline underline-offset-4">
              {t('auth.signup_client_instead', 'Sign up as a client instead')}
            </Link>
          ) : (
            <Link to="/signup?role=specialist" className="font-bold text-ink underline underline-offset-4">
              {t('auth.join_specialist', 'Join as a specialist')}
            </Link>
          )}
        </p>
      </div>
    </AuthLayout>
  )
}

/**
 * JoinOrg: Allows users with an organization invite code to register without payment.
 * Automatically links the user to the organization and logs them in.
 */
export function JoinOrg() {
  const nav = useNavigate()
  const { t } = useLanguage()
  const [f, setF] = useState({
    inviteCode: '',
    name: '',
    email: '',
    password: '',
  })
  const [err, setErr] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!f.inviteCode.trim()) e.inviteCode = 'Enter the 8-character invite code from your organization.'
    if (f.name.trim().length < 2) e.name = 'Enter your full name.'
    if (!emailOk(f.email)) e.email = 'Enter a valid email address.'
    if (f.password.length < 8) e.password = 'Password must be at least 8 characters.'
    return e
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const v = validate()
    setErr(v)
    if (Object.keys(v).length > 0) return

    setLoading(true)
    try {
      await api.joinOrg({
        inviteCode: f.inviteCode.trim().toUpperCase(),
        name: f.name.trim(),
        email: f.email.trim(),
        password: f.password,
      })
      // Sponsored org member is now registered and logged in; route to onboarding
      nav('/onboarding')
    } catch (error: any) {
      setErr({
        global: error?.message || 'Failed to join organization. Please verify your invite code.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="flex items-center gap-3 mb-2">
        <div className="size-10 rounded-xl bg-move-tint text-move flex items-center justify-center">
          <Building2 size={22} />
        </div>
        <span className="text-xs font-bold tracking-wider uppercase bg-sand px-2.5 py-1 rounded-full text-ink">
          {t('auth.sponsored_access', 'Sponsored Access')}
        </span>
      </div>
      <h1 className="h-display text-[32px]">{t('auth.join_title', 'Join your organization')}</h1>
      <p className="text-ink-2 mt-2">
        {t('auth.join_sub', 'Enter the invite code provided by your company, university, or club to get sponsored wellness access.')}
      </p>

      {err.global && (
        <div className="mt-6 rounded-xl bg-bad-tint p-4 text-[14px] font-medium text-[#a02a2a] border border-[#a02a2a]/20">
          {err.global}
        </div>
      )}

      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        <Field
          label={t('auth.invite_code', 'Organization Invite Code')}
          helper={t('auth.invite_code_helper', '8-character uppercase code (e.g. APEX2026)')}
          error={err.inviteCode}
        >
          {(p) => (
            <input
              {...p}
              type="text"
              className={`${inputCls} font-mono tracking-wider text-base uppercase`}
              placeholder="e.g. APEX2026"
              maxLength={12}
              value={f.inviteCode}
              onChange={(e) => setF({ ...f, inviteCode: e.target.value.toUpperCase() })}
            />
          )}
        </Field>

        <Field label={t('auth.legal_name', 'Full name')} error={err.name}>
          {(p) => (
            <input
              {...p}
              type="text"
              autoComplete="name"
              className={inputCls}
              placeholder="e.g. Youssef Nabil"
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
            />
          )}
        </Field>

        <Field label={t('auth.work_email', 'Work / Personal Email')} error={err.email}>
          {(p) => (
            <input
              {...p}
              type="email"
              autoComplete="email"
              className={inputCls}
              placeholder="name@example.com"
              value={f.email}
              onChange={(e) => setF({ ...f, email: e.target.value })}
            />
          )}
        </Field>

        <Field label={t('auth.create_pw', 'Create Password')} error={err.password}>
          {(p) => (
            <PasswordInput
              {...p}
              autoComplete="new-password"
              value={f.password}
              onChange={(e) => setF({ ...f, password: e.target.value })}
            />
          )}
        </Field>

        <Btn type="submit" className="w-full" disabled={loading}>
          {loading ? t('auth.joining_btn', 'Joining organization...') : t('auth.join_btn', 'Join with invite code')}
        </Btn>
      </form>

      <div className="mt-8 space-y-1 text-ink-2">
        <p>
          {t('auth.have_account', 'Already have an account?')}{' '}
          <Link to="/login" className="font-bold text-ink underline underline-offset-4">
            {t('auth.login_btn', 'Log in')}
          </Link>
        </p>
        <p>
          {t('auth.individual_signup', 'Individual member without a team code?')}{' '}
          <Link to="/signup" className="font-bold text-ink underline underline-offset-4">
            {t('auth.individual_signup_link', 'Individual sign up')}
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

/**
 * RegisterOrg: Allows creating an organization alongside an org_admin user.
 * Displays the unique invite code immediately upon registration with copy functionality.
 */
export function RegisterOrg() {
  const { t } = useLanguage()
  const [f, setF] = useState({
    organizationName: '',
    type: 'company' as 'company' | 'university' | 'gym' | 'other',
    seatLimit: 50,
    adminName: '',
    email: '',
    password: '',
  })
  const [err, setErr] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [createdOrg, setCreatedOrg] = useState<{
    name: string
    inviteCode: string
    seatLimit: number
  } | null>(null)

  const validate = () => {
    const e: Record<string, string> = {}
    if (f.organizationName.trim().length < 2) e.organizationName = 'Enter your organization name.'
    if (!f.seatLimit || Number(f.seatLimit) < 1 || Number(f.seatLimit) > 500) {
      e.seatLimit = 'Seat limit must be between 1 and 500.'
    }
    if (f.adminName.trim().length < 2) e.adminName = 'Enter the lead administrator name.'
    if (!emailOk(f.email)) e.email = 'Enter a valid administrator email.'
    if (f.password.length < 8) e.password = 'Password must be at least 8 characters.'
    return e
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const v = validate()
    setErr(v)
    if (Object.keys(v).length > 0) return

    setLoading(true)
    try {
      const res = await api.registerOrg({
        organizationName: f.organizationName.trim(),
        type: f.type,
        seatLimit: Number(f.seatLimit),
        adminName: f.adminName.trim(),
        email: f.email.trim(),
        password: f.password,
      })
      setCreatedOrg({
        name: res.organization.name,
        inviteCode: res.organization.inviteCode || '',
        seatLimit: res.organization.seatLimit || 50,
      })
    } catch (error: any) {
      setErr({
        global: error?.message || 'Failed to register organization. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const copyCode = async () => {
    if (!createdOrg) return
    try {
      await navigator.clipboard.writeText(createdOrg.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback
    }
  }

  // One-time success view displayed immediately after organization creation
  if (createdOrg) {
    return (
      <AuthLayout wide>
        <div className="text-center py-4">
          <div className="size-16 rounded-2xl bg-ok/10 text-ok flex items-center justify-center mx-auto mb-4">
            <Check size={32} strokeWidth={2.5} />
          </div>
          <h1 className="h-display text-[32px]">{t('auth.org_registered_title', 'Organization Registered!')}</h1>
          <p className="text-ink-2 mt-2 max-w-md mx-auto">
            <strong>{createdOrg.name}</strong> {t('auth.org_registered_sub', 'has been registered with sponsored member seats.')}
          </p>

          <div className="mt-8 p-6 bg-paper rounded-2xl border border-line text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-2 block mb-2">
              {t('auth.team_invite_code', 'Your Team Invite Code')}
            </span>
            <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-xl border border-line">
              <span className="font-mono text-2xl font-bold tracking-widest text-ink select-all">
                {createdOrg.inviteCode}
              </span>
              <Btn
                type="button"
                variant="secondary"
                onClick={copyCode}
                className="gap-2 shrink-0 min-h-10 text-sm"
              >
                {copied ? (
                  <>
                    <Check size={16} className="text-ok" /> {t('auth.copied', 'Copied!')}
                  </>
                ) : (
                  <>
                    <Copy size={16} /> {t('auth.copy_code', 'Copy code')}
                  </>
                )}
              </Btn>
            </div>
            <p className="text-xs text-ink-2 mt-3 leading-relaxed">
              {t('auth.invite_code_instruction', 'Share this code with your members. They will enter it on the join page to activate their sponsored membership immediately without payment.')}
            </p>
          </div>

          <div className="mt-8">
            <Btn
              to="/app/org"
              className="w-full text-base py-3.5 gap-2"
            >
              {t('auth.continue_org_dashboard', 'Continue to organization dashboard')} <ArrowRight size={18} />
            </Btn>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout wide>
      <div className="flex items-center gap-3 mb-2">
        <div className="size-10 rounded-xl bg-eat-tint text-eat flex items-center justify-center">
          <Building2 size={22} />
        </div>
        <span className="text-xs font-bold tracking-wider uppercase bg-sand px-2.5 py-1 rounded-full text-ink">
          {t('auth.b2b_portal', 'B2B Organization Portal')}
        </span>
      </div>
      <h1 className="h-display text-[32px]">{t('auth.reg_org_title', 'Register your organization')}</h1>
      <p className="text-ink-2 mt-2">
        {t('auth.reg_org_sub', 'Equip your team with personalized nutrition, training, and recovery. Bring your own specialists or use ours.')}
      </p>

      {err.global && (
        <div className="mt-6 rounded-xl bg-bad-tint p-4 text-[14px] font-medium text-[#a02a2a] border border-[#a02a2a]/20">
          {err.global}
        </div>
      )}

      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t('auth.org_name', 'Organization Name')} error={err.organizationName}>
            {(p) => (
              <input
                {...p}
                className={inputCls}
                placeholder="e.g. Apex Athletic Club"
                value={f.organizationName}
                onChange={(e) => setF({ ...f, organizationName: e.target.value })}
              />
            )}
          </Field>

          <Field label={t('auth.org_type', 'Organization Type')}>
            {(p) => (
              <select
                {...p}
                className={inputCls}
                value={f.type}
                onChange={(e) =>
                  setF({
                    ...f,
                    type: e.target.value as 'company' | 'university' | 'gym' | 'other',
                  })
                }
              >
                <option value="company">{t('auth.org_type_company', 'Corporate / Company')}</option>
                <option value="university">{t('auth.org_type_university', 'University / School')}</option>
                <option value="gym">{t('auth.org_type_gym', 'Gym / Fitness Club')}</option>
                <option value="other">{t('auth.org_type_other', 'Other Community')}</option>
              </select>
            )}
          </Field>
        </div>

        <Field
          label={t('auth.seat_limit', 'Seat Limit')}
          helper={t('auth.seat_limit_helper', 'Total number of client members your organization will sponsor (1 to 500)')}
          error={err.seatLimit}
        >
          {(p) => (
            <input
              {...p}
              type="number"
              min={1}
              max={500}
              className={inputCls}
              value={f.seatLimit}
              onChange={(e) => setF({ ...f, seatLimit: Number(e.target.value) })}
            />
          )}
        </Field>

        <div className="pt-2 border-t border-line">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider mb-3">
            {t('auth.lead_admin_section', 'Lead Administrator Account')}
          </h2>
          <div className="space-y-4">
            <Field label={t('auth.admin_name_field', 'Admin Full Name')} error={err.adminName}>
              {(p) => (
                <input
                  {...p}
                  autoComplete="name"
                  className={inputCls}
                  placeholder="e.g. Sarah Jenkins"
                  value={f.adminName}
                  onChange={(e) => setF({ ...f, adminName: e.target.value })}
                />
              )}
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={t('auth.admin_email_field', 'Admin Email')} error={err.email}>
                {(p) => (
                  <input
                    {...p}
                    type="email"
                    autoComplete="email"
                    className={inputCls}
                    placeholder="admin@org.com"
                    value={f.email}
                    onChange={(e) => setF({ ...f, email: e.target.value })}
                  />
                )}
              </Field>

              <Field label={t('auth.admin_pw_field', 'Admin Password')} error={err.password}>
                {(p) => (
                  <PasswordInput
                    {...p}
                    autoComplete="new-password"
                    value={f.password}
                    onChange={(e) => setF({ ...f, password: e.target.value })}
                  />
                )}
              </Field>
            </div>
          </div>
        </div>

        <Btn type="submit" className="w-full mt-4" disabled={loading}>
          {loading ? t('auth.reg_org_creating', 'Creating organization...') : t('auth.reg_org_btn', 'Create organization & get invite code')}
        </Btn>
      </form>

      <div className="mt-8 space-y-1 text-ink-2">
        <p>
          {t('auth.have_account', 'Already registered?')}{' '}
          <Link to="/login" className="font-bold text-ink underline underline-offset-4">
            {t('auth.login_btn', 'Log in to dashboard')}
          </Link>
        </p>
        <p>
          {t('auth.have_invite', 'Have an invite code instead?')}{' '}
          <Link to="/join" className="font-bold text-ink underline underline-offset-4">
            {t('auth.join_team', 'Join your organization')}
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
