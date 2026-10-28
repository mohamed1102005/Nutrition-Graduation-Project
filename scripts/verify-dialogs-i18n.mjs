import { Browser, sleep } from '../.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs'

const BASE_URL = 'http://localhost:8443'
const API_URL = 'http://localhost:4000/api'

const DEMO_CREDENTIALS = {
  Client: { email: 'sara@demo.com', password: 'demo1234' },
  Admin: { email: 'admin@demo.com', password: 'demo1234' },
  Finance: { email: 'finance@demo.com', password: 'demo1234' },
  OrgAdmin: { email: 'admin@apex.com', password: 'demo1234' },
}

async function getTokens() {
  const tokens = {}
  for (const [role, creds] of Object.entries(DEMO_CREDENTIALS)) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds),
    })
    const json = await res.json()
    tokens[role] = {
      token: json.data?.token,
      user: json.data?.user,
    }
  }
  return tokens
}

async function run() {
  console.log('🔑 Authenticating demo accounts via backend API...')
  const authData = await getTokens()

  console.log('🚀 Launching headless browser for Modal Dialogs Arabic verification...')
  const browser = await Browser.launch({ width: 1440, height: 900 })
  const page = await browser.newPage({ width: 1440, height: 900 })

  let failed = 0
  let passed = 0

  function assert(cond, name, details) {
    if (cond) {
      console.log(`✅ [PASS] ${name}`)
      passed++
    } else {
      console.error(`❌ [FAIL] ${name}: ${details}`)
      failed++
    }
  }

  // Helper to set auth and lang in localStorage
  async function setupPage(role, lang = 'ar') {
    await page.goto(`${BASE_URL}/login`, { settleMs: 200 })
    const { token, user } = authData[role]
    await page.eval(({ tok, u, l }) => {
      localStorage.setItem('rebound_token', tok)
      localStorage.setItem('rebound_user', JSON.stringify(u))
      localStorage.setItem('rebound_lang', l)
      document.documentElement.lang = l
      document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'
    }, { tok: token, u: user, l: lang })
  }

  // 1. Admin Users - Create User Dialog
  await setupPage('Admin')
  await page.goto(`${BASE_URL}/app/users`, { settleMs: 1200 })

  await page.eval(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const addBtn = btns.find((b) => b.innerText.includes('إضافة مستخدم'))
    if (addBtn) addBtn.click()
  })
  await sleep(400)

  const userModal = await page.eval(() => {
    const dialog = document.querySelector('[role="dialog"]')
    if (!dialog) return null
    return {
      title: dialog.querySelector('h2')?.innerText || '',
      text: dialog.innerText || '',
    }
  })

  assert(
    userModal && userModal.title === 'إنشاء حساب مستخدم',
    'Admin Users Create Modal Title in Arabic',
    `Got ${JSON.stringify(userModal?.title)}`
  )
  assert(
    userModal && userModal.text.includes('الاسم بالكامل') && userModal.text.includes('البريد الإلكتروني') && userModal.text.includes('كلمة المرور'),
    'Admin Users Create Modal Form Labels in Arabic',
    `Got: ${userModal?.text.slice(0, 150)}`
  )
  assert(
    userModal && userModal.text.includes('إلغاء') && userModal.text.includes('إنشاء الحساب'),
    'Admin Users Create Modal Buttons in Arabic',
    `Buttons found: ${userModal?.text.includes('إلغاء')}, ${userModal?.text.includes('إنشاء الحساب')}`
  )

  // 2. Client Progress - Log Health Vitals Modal
  await setupPage('Client')
  await page.goto(`${BASE_URL}/app/progress`, { settleMs: 1200 })

  await page.eval(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const logBtn = btns.find((b) => b.innerText.includes('المؤشرات') || b.innerText.includes('تسجيل'))
    if (logBtn) logBtn.click()
  })
  await sleep(400)

  const progressModal = await page.eval(() => {
    const dialog = document.querySelector('[role="dialog"]')
    if (!dialog) return null
    return {
      title: dialog.querySelector('h2')?.innerText || '',
      text: dialog.innerText || '',
    }
  })

  assert(
    progressModal && progressModal.title === 'تسجيل المؤشرات الصحية لليوم',
    'Client Progress Log Modal Title in Arabic',
    `Got ${JSON.stringify(progressModal?.title)}`
  )
  assert(
    progressModal && progressModal.text.includes('وزن الجسم (كجم)') && progressModal.text.includes('تسجيل التقرير اليومي'),
    'Client Progress Log Modal Content in Arabic',
    `Got: ${progressModal?.text.slice(0, 200)}`
  )

  // 3. Org Specialists - Add Specialist Modal
  await setupPage('OrgAdmin')
  await page.goto(`${BASE_URL}/app/org/specialists`, { settleMs: 1200 })

  await page.eval(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const addSpecBtn = btns.find((b) => b.innerText.includes('إضافة أخصائي'))
    if (addSpecBtn) addSpecBtn.click()
  })
  await sleep(400)

  const orgSpecModal = await page.eval(() => {
    const dialog = document.querySelector('[role="dialog"]')
    if (!dialog) return null
    return {
      title: dialog.querySelector('h2')?.innerText || '',
      text: dialog.innerText || '',
    }
  })

  assert(
    orgSpecModal && orgSpecModal.title === 'إضافة أخصائي لمنظمتك',
    'Org Specialist Modal Title in Arabic',
    `Got ${JSON.stringify(orgSpecModal?.title)}`
  )
  assert(
    orgSpecModal && orgSpecModal.text.includes('الاسم القانوني بالكامل') && orgSpecModal.text.includes('كلمة المرور المؤقتة') && orgSpecModal.text.includes('إنشاء حساب الأخصائي'),
    'Org Specialist Modal Form Fields in Arabic',
    `Got: ${orgSpecModal?.text.slice(0, 200)}`
  )

  // 4. Finance Payouts - Settle Disbursement Modal
  await setupPage('Finance')
  await page.goto(`${BASE_URL}/app/finance/payouts`, { settleMs: 1200 })

  await page.eval(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const settleBtn = btns.find((b) => b.innerText.includes('تسوية') || b.innerText.includes('تحويل') || b.innerText.includes('صرف'))
    if (settleBtn) settleBtn.click()
  })
  await sleep(400)

  const payoutsModal = await page.eval(() => {
    const dialog = document.querySelector('[role="dialog"]')
    if (!dialog) return null
    return {
      title: dialog.querySelector('h2')?.innerText || '',
      text: dialog.innerText || '',
    }
  })

  if (payoutsModal) {
    assert(
      payoutsModal.title.includes('تسوية') || payoutsModal.title.includes('الأخصائي'),
      'Finance Settle Modal Title in Arabic',
      `Got ${JSON.stringify(payoutsModal.title)}`
    )
    assert(
      payoutsModal.text.includes('الجلسات المكتملة') || payoutsModal.text.includes('إجمالي المستحقات') || payoutsModal.text.includes('تأكيد وتعيين كمدفوع'),
      'Finance Settle Modal Content in Arabic',
      `Got: ${payoutsModal.text.slice(0, 150)}`
    )
  }

  await browser.close()

  console.log(`\n=======================================`)
  console.log(`Modal Dialogs Arabic Verification: ${passed} passed, ${failed} failed.`)
  console.log(`=======================================`)
  if (failed > 0) process.exit(1)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
