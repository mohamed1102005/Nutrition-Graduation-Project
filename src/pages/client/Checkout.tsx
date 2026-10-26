import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router'
import {
  CreditCard,
  Smartphone,
  Store,
  Landmark,
  CircleCheck,
  Check,
  Building2,
  ShieldCheck,
  Copy,
  Calendar,
  Clock,
  Video,
} from 'lucide-react'
import { Avatar, Btn, Card, Field, inputCls } from '../../ui'
import { specialists } from '../../data'
import { api, getStoredUser } from '../../api'
import { useLanguage } from '../../context/LanguageContext'

const paymentMethodsConfig = [
  { id: 'Card', labelKey: 'checkout.card', subKey: 'checkout.card_sub', defaultLabel: 'Bank Card', defaultSub: 'Visa, Mastercard & Meeza', icon: CreditCard },
  { id: 'InstaPay', labelKey: 'checkout.instapay', subKey: 'checkout.instapay_sub', defaultLabel: 'InstaPay Egypt', defaultSub: 'Instant bank transfer via IPA', icon: Landmark },
  { id: 'Vodafone Cash', labelKey: 'checkout.vodafone', subKey: 'checkout.vodafone_sub', defaultLabel: 'Smart Mobile Wallet', defaultSub: 'Vodafone, Orange, Etisalat, WE', icon: Smartphone },
  { id: 'Fawry', labelKey: 'checkout.fawry', subKey: 'checkout.fawry_sub', defaultLabel: 'Fawry Pay Kiosk', defaultSub: 'Pay with reference code at any outlet', icon: Store },
] as const

export default function Checkout() {
  const { t, lang } = useLanguage()
  const loc = useLocation()
  const o = (loc.state as {
    spId: string
    pkg: string
    n: number
    type: string
    when: string
    total: number
    resched?: boolean
    bookingId?: string | number
    slotId?: number
  } | null) ?? {
    spId: 'mona',
    pkg: 'Single Session',
    n: 1,
    type: 'Video Telemedicine Consultation',
    when: 'Thu 16 Oct, 6:30 PM',
    total: 450,
  }

  const s = specialists.find((x) => x.id === o.spId) || specialists[0]
  const user = getStoredUser()
  const isSponsored = Boolean(user?.organization?.sponsored || user?.organizationId)
  const orgName = user?.organization?.name || 'Your Organization'

  const [m, setM] = useState<(typeof methods)[number]['id']>('Card')
  const [f, setF] = useState(() => ({ name: user?.name || '', num: '', exp: '', cvc: '', phone: '', handle: '' }))
  const [err, setErr] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [paid, setPaid] = useState(false)
  const [copied, setCopied] = useState(false)
  const [reference, setReference] = useState('RB-48213')
  const fee = 0
  const total = isSponsored ? 0 : o.total + fee

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const v: Record<string, string> = {}

    if (!isSponsored) {
      if (m === 'Card') {
        if (f.name.trim().length < 2) v.name = 'Cardholder name is required.'
        if (f.num.replace(/\s/g, '').length !== 16) v.num = 'Enter a valid 16-digit card number.'
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(f.exp)) v.exp = 'Use format MM/YY.'
        if (!/^\d{3,4}$/.test(f.cvc)) v.cvc = 'Enter 3-digit security code.'
      }
      if (m === 'Vodafone Cash' && !/^01[0-9]{9}$/.test(f.phone)) {
        v.phone = 'Enter an 11-digit Egyptian mobile number (e.g. 01012345678).'
      }
      if (m === 'InstaPay' && !/^\S+@\S+$/.test(f.handle)) {
        v.handle = 'Enter a valid InstaPay address (e.g. name@instapay).'
      }
      setErr(v)
      if (Object.keys(v).length) return
    }

    setSubmitting(true)
    try {
      if (o.slotId) {
        if (o.resched && o.bookingId) {
          const res = await api.rescheduleBooking(o.bookingId, o.slotId)
          setReference(`RB-${res?.booking?.id || o.bookingId}`)
        } else {
          const res = await api.createBooking({
            specialistId: o.spId as any,
            slotId: o.slotId,
            sessionType: o.type,
            notes: '',
          })
          setReference(`RB-${res?.booking?.id || '48213'}`)
        }
      } else {
        if (isSponsored) {
          setReference(`ORG-${user?.organization?.inviteCode || 'SPONSORED'}-${Date.now().toString().slice(-4)}`)
        } else {
          const methodMap: Record<string, 'card' | 'fawry' | 'vodafone_cash' | 'instapay'> = {
            Card: 'card',
            Fawry: 'fawry',
            'Vodafone Cash': 'vodafone_cash',
            InstaPay: 'instapay',
          }
          const res = await api.checkout('Starter', methodMap[m] || 'card')
          setReference(res?.subscription?.reference || res?.subscription?.paymentReference || 'RB-48213')
        }
      }
      setPaid(true)
    } catch (error: any) {
      if (error?.code === 'ALREADY_SPONSORED') {
        setReference(`ORG-${user?.organization?.inviteCode || 'SPONSORED'}`)
        setPaid(true)
      } else {
        console.error('Checkout error:', error)
        setErr({ general: error.message || 'Payment processing could not be completed.' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const copyReference = () => {
    navigator.clipboard?.writeText(reference)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Success Screen
  if (paid) {
    return (
      <div className="max-w-xl mx-auto py-8 space-y-6">
        <Card className="p-8 text-center bg-white border border-line space-y-5">
          <div className="size-16 rounded-2xl bg-ok-tint text-ok grid place-items-center mx-auto">
            <CircleCheck size={36} strokeWidth={2.5} />
          </div>

          <div>
            <span className="text-xs uppercase font-bold text-ok tracking-wider">
              {isSponsored
                ? (lang === 'ar' ? 'تم التحقق من رعاية جهة العمل' : 'Corporate Sponsorship Verified')
                : (lang === 'ar' ? 'تمت معالجة الدفع بنجاح' : 'Payment Successfully Processed')}
            </span>
            <h1 className="h-display text-[26px] sm:text-[30px] font-bold text-ink mt-1">
              {t('checkout.confirmed_title', 'Your Session is Confirmed')}
            </h1>
            <p className="text-sm text-ink-2 mt-1 max-w-md mx-auto">
              {lang === 'ar'
                ? 'تم إرسال دعوة التقويم ورابط غرفة الكشف الطبي الافتراضية إلى بريدك الإلكتروني.'
                : 'A calendar invite and telemedicine room access link have been dispatched to your email.'}
            </p>
          </div>

          {/* Reference Card */}
          <div className="p-4 rounded-xl border border-line bg-paper/60 text-center">
            <span className="text-xs uppercase font-semibold text-ink-2 block">
              {t('checkout.ref_code', 'Booking Confirmation Reference')}
            </span>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="num font-bold text-xl text-ink tracking-wider">{reference}</span>
              <button
                type="button"
                onClick={copyReference}
                className="size-8 rounded-lg hover:bg-white text-ink-2 hover:text-ink grid place-items-center transition cursor-pointer"
                aria-label="Copy reference code"
              >
                {copied ? <Check size={16} className="text-ok" /> : <Copy size={16} />}
              </button>
            </div>
            {copied && <p className="text-xs text-ok font-semibold mt-1">{lang === 'ar' ? 'تم النسخ إلى الحافظة' : 'Copied to clipboard'}</p>}
          </div>

          {/* Details Summary */}
          <div className="p-4 rounded-xl border border-line/60 bg-white text-left rtl:text-right space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-line/60">
              <span className="text-ink-2 font-medium">{lang === 'ar' ? 'المختص المشرف:' : 'Assigned Specialist:'}</span>
              <span className="font-bold text-ink">{s.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-line/60">
              <span className="text-ink-2 font-medium">{t('checkout.scheduled_date', 'Scheduled Time:')}</span>
              <span className="font-bold text-ink num">{o.when}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-ink-2 font-medium">{t('checkout.total_payable', 'Total Amount Paid:')}</span>
              <span className="font-bold text-ink num">
                {isSponsored
                  ? (lang === 'ar' ? '0 ج.م (مغطى بالكامل)' : 'EGP 0 (Employer Covered)')
                  : (lang === 'ar' ? `${total.toLocaleString('ar-EG')} ج.م` : `EGP ${total.toLocaleString('en-US')}`)}
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Btn to="/app/bookings" className="w-full">
              {t('checkout.go_bookings', 'View in My Bookings')}
            </Btn>
            <Btn to="/app/today" variant="secondary" className="w-full">
              {t('checkout.return_dashboard', 'Return to Dashboard')}
            </Btn>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-line pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-ink-2 uppercase tracking-wider mb-1">
            <ShieldCheck size={14} className="text-ok" aria-hidden /> {t('checkout.encrypted', '256-bit Encrypted Checkout')}
          </div>
          <h1 className="h-display text-[26px] sm:text-[30px] font-bold text-ink">
            {t('checkout.title', 'Confirm & Reserve Session')}
          </h1>
        </div>

        <Link
          to="/app/specialists"
          className="text-xs font-bold text-ink-2 hover:text-ink transition underline cursor-pointer"
        >
          {t('checkout.change_spec', 'Change Specialist or Date')}
        </Link>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
        {/* Left Column: Payment Method Selection */}
        <div className="space-y-6">
          {/* Corporate Sponsorship Pass if applicable */}
          {isSponsored ? (
            <Card className="p-6 bg-sand/30 border border-line space-y-3">
              <div className="flex items-center gap-2 text-xs uppercase font-bold text-ink tracking-wider">
                <Building2 size={16} aria-hidden /> {lang === 'ar' ? 'ميزة مؤسسية مغطاة' : 'Corporate Benefit Covered'}
              </div>
              <h2 className="text-lg font-bold text-ink">
                {lang === 'ar' ? `برعاية ${orgName}` : `Sponsored by ${orgName}`}
              </h2>
              <p className="text-xs text-ink/80 leading-relaxed">
                {lang === 'ar'
                  ? 'جلستك مغطاة بالكامل 100% ضمن باقة الرعاية الصحية والوقائية لجهة عملك. لا يلزم دفع أي مبالغ نقدية أو استخدام بطاقة ائتمانية.'
                  : "Your consultation is 100% sponsored under your employer's health and performance benefit tier. Zero out-of-pocket payment or credit card is required."}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase font-bold text-ink-2 tracking-wider block mb-2">
                  {t('checkout.select_method', 'Select Payment Method')}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paymentMethodsConfig.map((method) => {
                    const I = method.icon
                    const isSelected = m === method.id
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setM(method.id)}
                        className={`text-left rtl:text-right p-4 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'bg-ink text-white border-ink shadow-sm'
                            : 'bg-white border-line hover:border-ink/40 text-ink'
                        }`}
                      >
                        <I size={20} className={`shrink-0 mt-0.5 ${isSelected ? 'text-white' : 'text-ink-2'}`} />
                        <div>
                          <p className="font-bold text-sm leading-tight">{t(method.labelKey, method.defaultLabel)}</p>
                          <p className={`text-xs mt-0.5 ${isSelected ? 'text-white/80' : 'text-ink-2'}`}>
                            {t(method.subKey, method.defaultSub)}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Method Forms */}
              <Card className="p-6 bg-white border border-line">
                {m === 'Card' && (
                  <div className="space-y-4">
                    <Field label={t('checkout.cardholder_name', 'Cardholder Name')} error={err.name}>
                      {(p) => <input {...p} placeholder="e.g. Sara Hassan" className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}
                    </Field>

                    <Field label={t('checkout.card_number', 'Card Number')} error={err.num}>
                      {(p) => (
                        <input
                          {...p}
                          inputMode="numeric"
                          placeholder="•••• •••• •••• ••••"
                          className={`${inputCls} num`}
                          value={f.num}
                          onChange={(e) => setF({ ...f, num: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                        />
                      )}
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label={t('checkout.exp_date', 'Expiration Date')} error={err.exp} helper="MM/YY">
                        {(p) => (
                          <input
                            {...p}
                            inputMode="numeric"
                            placeholder="08/28"
                            className={`${inputCls} num`}
                            value={f.exp}
                            onChange={(e) => setF({ ...f, exp: e.target.value.slice(0, 5) })}
                          />
                        )}
                      </Field>
                      <Field label={t('checkout.cvc', 'Security Code (CVC)')} error={err.cvc} helper="3 digits">
                        {(p) => (
                          <input
                            {...p}
                            inputMode="numeric"
                            placeholder="123"
                            className={`${inputCls} num`}
                            value={f.cvc}
                            onChange={(e) => setF({ ...f, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                          />
                        )}
                      </Field>
                    </div>
                  </div>
                )}

                {m === 'InstaPay' && (
                  <div className="space-y-3">
                    <Field label={lang === 'ar' ? 'عنوان الدفع اللحظي إنستاباي IPA' : 'InstaPay IPA Address'} error={err.handle} helper={lang === 'ar' ? 'عنوان الدفع المسجل لدى شبكة المدفوعات اللحظية IPN' : 'Instant payment address registered with Central Bank IPN'}>
                      {(p) => <input {...p} placeholder="username@instapay" className={inputCls} value={f.handle} onChange={(e) => setF({ ...f, handle: e.target.value })} />}
                    </Field>
                    <p className="text-xs text-ink-2 bg-paper/60 p-3 rounded-xl border border-line">
                      {lang === 'ar' ? 'بعد الضغط على تأكيد، ستصلك مطالبة دفع فورية عبر تطبيق إنستاباي أو بنكك المسجل.' : "After clicking confirm, an instant transfer prompt will be requested through your bank's InstaPay gateway."}
                    </p>
                  </div>
                )}

                {m === 'Vodafone Cash' && (
                  <div className="space-y-3">
                    <Field label={lang === 'ar' ? 'رقم المحفظة الإلكترونية' : 'Smart Mobile Wallet Number'} error={err.phone} helper={lang === 'ar' ? 'رقم فودافون كاش، أورنج، اتصالات كاش، أو وي باي' : 'Vodafone, Orange, Etisalat, or WE Pay mobile number'}>
                      {(p) => (
                        <input
                          {...p}
                          inputMode="numeric"
                          placeholder="01012345678"
                          className={`${inputCls} num`}
                          value={f.phone}
                          onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                        />
                      )}
                    </Field>
                    <p className="text-xs text-ink-2 bg-paper/60 p-3 rounded-xl border border-line">
                      {lang === 'ar' ? 'ستصلك رسالة USSD تلقائية على هاتفك المحمول لإدخال الرقم السري وتأكيد المعاملة.' : 'You will receive an automated PIN verification prompt directly on your mobile handset to approve the transaction.'}
                    </p>
                  </div>
                )}

                {m === 'Fawry' && (
                  <div className="space-y-2 text-xs text-ink-2 leading-relaxed bg-paper/60 p-4 rounded-xl border border-line">
                    <p className="font-bold text-sm text-ink mb-1">{lang === 'ar' ? 'الدفع في أي منفذ فوري في جميع أنحاء مصر' : 'Pay at any Fawry Outlet across Egypt'}</p>
                    <p>
                      {lang === 'ar'
                        ? 'سيتم إصدار كود دفع فوري مميز مكوّن من 8 أرقام فور التأكيد. توجه بالكود لأي ماكينة فوري خلال 24 ساعة لسداد الرسوم وتثبيت موعد الحجز.'
                        : 'A unique 8-digit Fawry reference code will be generated upon confirmation. Present this reference code to any Fawry kiosk or retail pos within 24 hours to secure your booking slot.'}
                    </p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {err.general && (
            <p role="alert" className="text-xs font-semibold text-bad p-3 rounded-xl bg-bad-tint">
              {err.general}
            </p>
          )}

          <Btn
            onClick={submit}
            disabled={submitting}
            className="w-full !h-12 text-sm font-bold shadow-sm"
          >
            {submitting
              ? (lang === 'ar' ? 'جارٍ حجز الجلسة...' : 'Securing Reservation...')
              : isSponsored
              ? (lang === 'ar' ? 'تأكيد الحجز المغطى من جهة العمل' : 'Confirm Employer-Sponsored Reservation')
              : `${t('checkout.complete_res', 'Complete Reservation')} · ${lang === 'ar' ? `${total.toLocaleString('ar-EG')} ج.م` : `EGP ${total.toLocaleString('en-US')}`}`}
          </Btn>
        </div>

        {/* Right Column: Order Summary Card */}
        <Card className="p-6 bg-white border border-line space-y-5 lg:sticky lg:top-24">
          <h2 className="font-bold text-[17px] text-ink pb-3 border-b border-line">
            {t('checkout.summary_title', 'Reservation Summary')}
          </h2>

          {/* Specialist Header */}
          <div className="flex items-center gap-3">
            <Avatar initials={s.name.replace(/^(Dr\.|Coach)\s+/i, '').slice(0, 2).toUpperCase()} svc={s.service || 'recover'} size={48} />
            <div>
              <p className="font-bold text-sm text-ink">{s.name}</p>
              <p className="text-xs text-ink-2">{s.role || 'Physical Therapist'}</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2.5 text-xs text-ink-2 border-y border-line py-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Calendar size={13} /> {t('checkout.scheduled_date', 'Scheduled Date:')}</span>
              <strong className="text-ink font-semibold num">{o.when}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Video size={13} /> {t('checkout.session_format', 'Session Format:')}</span>
              <strong className="text-ink font-semibold">{o.type}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Clock size={13} /> {t('checkout.duration', 'Duration:')}</span>
              <strong className="text-ink font-semibold">{lang === 'ar' ? '50 دقيقة' : '50 minutes'}</strong>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-ink-2">
              <span>{lang === 'ar' ? 'سعر الجلسة الأساسي' : 'Session Base Rate'}</span>
              <span className="num font-semibold text-ink">{lang === 'ar' ? `${o.total.toLocaleString('ar-EG')} ج.م` : `EGP ${o.total.toLocaleString('en-US')}`}</span>
            </div>
            <div className="flex justify-between text-ink-2">
              <span>{lang === 'ar' ? 'رسوم المعالجة الإدارية' : 'Clinic Processing Fee'}</span>
              <span className="num font-semibold text-ok">{lang === 'ar' ? 'مجاناً' : 'EGP 0'}</span>
            </div>
            {isSponsored && (
              <div className="flex justify-between text-ok font-semibold">
                <span>{lang === 'ar' ? 'خصم ميزة العمل المؤسسية' : 'Employer Benefit Discount'}</span>
                <span className="num">-{lang === 'ar' ? `${o.total.toLocaleString('ar-EG')} ج.م` : `EGP ${o.total.toLocaleString('en-US')}`}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-ink pt-2 border-t border-line">
              <span>{t('checkout.total_payable', 'Total Payable')}</span>
              <span className="num text-xl">
                {isSponsored
                  ? (lang === 'ar' ? '0 ج.م' : 'EGP 0')
                  : (lang === 'ar' ? `${total.toLocaleString('ar-EG')} ج.م` : `EGP ${total.toLocaleString('en-US')}`)}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-[11px] leading-relaxed text-ink-2 bg-sand/30 p-3 rounded-xl border border-line/60">
              <strong className="text-ink">{lang === 'ar' ? 'ضمان ريباوند للإلغاء المرن:' : 'Rebound Cancellation Guarantee:'}</strong>{' '}
              {lang === 'ar'
                ? 'إعادة جدولة مجانية أو استرداد كامل للمبلغ حتى 6 ساعات قبل موعد الجلسة.'
                : 'Free rescheduling or 100% refund up to 6 hours before session time.'}
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
