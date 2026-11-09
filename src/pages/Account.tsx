import { useEffect, useState, type FormEvent } from 'react'
import { Btn, Card, Field, PageHead, PasswordInput, inputCls } from '../ui'
import { api, getStoredUser } from '../api'
import { useLanguage } from '../context/LanguageContext'

// One account page for every role: profile, password, and (by role) specialist
// profile or subscription.

type Status = { kind: 'ok' | 'err'; text: string } | null

function StatusLine({ s }: { s: Status }) {
  if (!s) return null
  return (
    <p role="status" className={`mt-4 rounded-xl px-4 py-3 font-semibold ${s.kind === 'ok' ? 'bg-ok-tint' : 'bg-bad/10 text-bad'}`}>
      {s.text}
    </p>
  )
}

export default function Account() {
  const { t } = useLanguage()
  const role = getStoredUser()?.role as string | undefined
  const isSpecialist = role === 'specialist'
  const isClient = role === 'client'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [profileMsg, setProfileMsg] = useState<Status>(null)

  const [pw, setPw] = useState({ current: '', next: '' })
  const [pwMsg, setPwMsg] = useState<Status>(null)

  const [sp, setSp] = useState({ bio: '', city: '', rateEgp: '0', yearsExperience: '0', languages: '', focusTags: '' })
  const [spMsg, setSpMsg] = useState<Status>(null)

  const [sub, setSub] = useState<any>(null)
  const [subMsg, setSubMsg] = useState<Status>(null)

  useEffect(() => {
    api.getAccount().then((res) => {
      setName(res.user.name)
      setEmail(res.user.email)
      if (res.specialist) {
        setSp({
          bio: res.specialist.bio || '',
          city: res.specialist.city || '',
          rateEgp: String(res.specialist.rateEgp ?? 0),
          yearsExperience: String(res.specialist.yearsExperience ?? 0),
          languages: res.specialist.languages || '',
          focusTags: (res.specialist.focusTags || []).join(', '),
        })
      }
    }).catch(() => {})
    if (isClient) api.getCurrentSubscription().then((r) => setSub(r.subscription)).catch(() => {})
  }, [isClient])

  const fail = (err: any): Status => ({ kind: 'err', text: err?.message || t('account.error', 'Something went wrong. Please try again.') })

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await api.updateAccount({ name: name.trim(), email: email.trim() })
      setProfileMsg({ kind: 'ok', text: t('account.saved', 'Saved.') })
    } catch (err) {
      setProfileMsg(fail(err))
    }
  }

  const savePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (pw.next.length < 8) return setPwMsg({ kind: 'err', text: t('account.pw_short', 'New password must be at least 8 characters.') })
    try {
      await api.changePassword(pw.current, pw.next)
      setPw({ current: '', next: '' })
      setPwMsg({ kind: 'ok', text: t('account.pw_changed', 'Password changed.') })
    } catch (err) {
      setPwMsg(fail(err))
    }
  }

  const saveSpecialist = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await api.updateSpecialistProfile({
        bio: sp.bio,
        city: sp.city,
        rateEgp: Number(sp.rateEgp) || 0,
        yearsExperience: Number(sp.yearsExperience) || 0,
        languages: sp.languages,
        focusTags: sp.focusTags.split(',').map((x) => x.trim()).filter(Boolean),
      })
      setSpMsg({ kind: 'ok', text: t('account.saved', 'Saved.') })
    } catch (err) {
      setSpMsg(fail(err))
    }
  }

  const cancelSub = async () => {
    try {
      await api.cancelSubscription()
      setSub(null)
      setSubMsg({ kind: 'ok', text: t('account.sub_cancelled', 'Subscription cancelled.') })
    } catch (err) {
      setSubMsg(fail(err))
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHead title={t('account.title', 'Account')} sub={t('account.sub', 'Manage your details and security.')} />

      <Card className="p-6 mb-6">
        <h2 className="h-display text-[20px] mb-4">{t('account.profile', 'Profile')}</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <Field label={t('account.name', 'Full name')}>
            {(p) => <input {...p} className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />}
          </Field>
          <Field label={t('auth.email', 'Email')}>
            {(p) => <input {...p} type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          <Btn type="submit">{t('account.save', 'Save changes')}</Btn>
          <StatusLine s={profileMsg} />
        </form>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="h-display text-[20px] mb-4">{t('account.password', 'Change password')}</h2>
        <form onSubmit={savePassword} className="space-y-4">
          <Field label={t('account.current_pw', 'Current password')}>
            {(p) => <PasswordInput {...p} autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />}
          </Field>
          <Field label={t('account.new_pw', 'New password')}>
            {(p) => <PasswordInput {...p} autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />}
          </Field>
          <Btn type="submit">{t('account.update_pw', 'Update password')}</Btn>
          <StatusLine s={pwMsg} />
        </form>
      </Card>

      {isSpecialist && (
        <Card className="p-6 mb-6">
          <h2 className="h-display text-[20px] mb-4">{t('account.specialist', 'Public profile')}</h2>
          <form onSubmit={saveSpecialist} className="space-y-4">
            <Field label={t('account.bio', 'Bio')}>
              {(p) => <textarea {...p} rows={4} className={`${inputCls} h-auto py-3`} value={sp.bio} onChange={(e) => setSp({ ...sp, bio: e.target.value })} />}
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={t('account.city', 'City')}>
                {(p) => <input {...p} className={inputCls} value={sp.city} onChange={(e) => setSp({ ...sp, city: e.target.value })} />}
              </Field>
              <Field label={t('account.rate', 'Session rate (EGP)')}>
                {(p) => <input {...p} type="number" min={0} className={inputCls} value={sp.rateEgp} onChange={(e) => setSp({ ...sp, rateEgp: e.target.value })} />}
              </Field>
              <Field label={t('account.years', 'Years of experience')}>
                {(p) => <input {...p} type="number" min={0} className={inputCls} value={sp.yearsExperience} onChange={(e) => setSp({ ...sp, yearsExperience: e.target.value })} />}
              </Field>
              <Field label={t('account.languages', 'Languages')}>
                {(p) => <input {...p} className={inputCls} value={sp.languages} onChange={(e) => setSp({ ...sp, languages: e.target.value })} />}
              </Field>
            </div>
            <Field label={t('account.focus', 'Focus areas (comma separated)')}>
              {(p) => <input {...p} className={inputCls} value={sp.focusTags} onChange={(e) => setSp({ ...sp, focusTags: e.target.value })} />}
            </Field>
            <Btn type="submit">{t('account.save', 'Save changes')}</Btn>
            <StatusLine s={spMsg} />
          </form>
        </Card>
      )}

      {isClient && (
        <Card className="p-6">
          <h2 className="h-display text-[20px] mb-2">{t('account.subscription', 'Subscription')}</h2>
          {sub ? (
            <>
              <p className="text-ink-2">
                {sub.planName} · {sub.priceEgp} EGP
                {sub.source === 'organization' && sub.organizationName ? ` · ${t('account.sponsored_by', 'Sponsored by')} ${sub.organizationName}` : ''}
              </p>
              {sub.source !== 'organization' && (
                <Btn variant="secondary" className="mt-4" onClick={cancelSub}>{t('account.cancel_sub', 'Cancel subscription')}</Btn>
              )}
            </>
          ) : (
            <>
              <p className="text-ink-2">{t('account.no_sub', 'You have no active subscription. You need one to book sessions.')}</p>
              <Btn className="mt-4" to="/app/bookings/checkout">{t('account.choose_plan', 'Choose a plan')}</Btn>
            </>
          )}
          <StatusLine s={subMsg} />
        </Card>
      )}
    </div>
  )
}
