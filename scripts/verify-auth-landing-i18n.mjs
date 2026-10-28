import { Browser } from '../.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';

async function main() {
  console.log('🧪 Verifying Landing, Auth & Onboarding Bilingual Parity...\n');

  // Obtain a valid client auth token for onboarding
  const loginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'omar@demo.com', password: 'demo1234' }),
  });
  const loginJson = await loginRes.json();
  const clientToken = loginJson?.data?.token;
  const clientUser = loginJson?.data?.user;

  const browser = await Browser.launch({ headless: true });
  const page = await browser.newPage({ width: 1440, height: 900 });

  const testCases = [
    {
      name: 'Landing (EN)',
      lang: 'en',
      path: '/',
      auth: false,
      check: () => {
        const h1 = document.querySelector('h1')?.innerText;
        return { h1, dir: document.documentElement.dir };
      }
    },
    {
      name: 'Landing (AR)',
      lang: 'ar',
      path: '/',
      auth: false,
      check: () => {
        const h1 = document.querySelector('h1')?.innerText;
        return { h1, dir: document.documentElement.dir };
      }
    },
    {
      name: 'Login (EN)',
      lang: 'en',
      path: '/login',
      auth: false,
      check: () => {
        const h1 = document.querySelector('h1')?.innerText;
        return { h1, dir: document.documentElement.dir };
      }
    },
    {
      name: 'Login (AR)',
      lang: 'ar',
      path: '/login',
      auth: false,
      check: () => {
        const h1 = document.querySelector('h1')?.innerText;
        return { h1, dir: document.documentElement.dir };
      }
    },
    {
      name: 'Signup (EN)',
      lang: 'en',
      path: '/signup',
      auth: false,
      check: () => {
        const h1 = document.querySelector('h1')?.innerText;
        return { h1, dir: document.documentElement.dir };
      }
    },
    {
      name: 'Signup (AR)',
      lang: 'ar',
      path: '/signup',
      auth: false,
      check: () => {
        const h1 = document.querySelector('h1')?.innerText;
        return { h1, dir: document.documentElement.dir };
      }
    },
    {
      name: 'Onboarding (EN)',
      lang: 'en',
      path: '/onboarding',
      auth: true,
      check: () => {
        const h1 = document.querySelector('h1')?.innerText;
        return { h1, dir: document.documentElement.dir };
      }
    },
    {
      name: 'Onboarding (AR)',
      lang: 'ar',
      path: '/onboarding',
      auth: true,
      check: () => {
        const h1 = document.querySelector('h1')?.innerText;
        return { h1, dir: document.documentElement.dir };
      }
    },
  ];

  let pass = 0;
  let fail = 0;

  for (const tc of testCases) {
    // Navigate to landing first to set cookies/localStorage
    await page.goto('http://localhost:8443/', { settleMs: 300 });

    await page.eval(({ lang, auth, token, user }) => {
      localStorage.setItem('rebound_lang', lang);
      if (auth && token) {
        localStorage.setItem('rebound_token', token);
        localStorage.setItem('rebound_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('rebound_token');
        localStorage.removeItem('rebound_user');
      }
    }, { lang: tc.lang, auth: tc.auth, token: clientToken, user: clientUser });

    // Navigate to target path
    await page.goto(`http://localhost:8443${tc.path}`, { settleMs: 1200 });

    const val = await page.eval(tc.check);
    console.log(`[${tc.name}] dir=${val?.dir} h1="${val?.h1}"`);

    const hasExpectedDir = tc.lang === 'ar' ? val?.dir === 'rtl' : val?.dir === 'ltr';
    const hasText = Boolean(val?.h1 && val.h1.trim().length > 0);

    // Verify Arabic titles don't contain English headers
    let isCorrectLang = true;
    if (tc.lang === 'ar') {
      if (val?.h1?.includes('Welcome back') || val?.h1?.includes('Create your account') || val?.h1?.includes('Your workouts')) {
        isCorrectLang = false;
      }
    }

    if (hasExpectedDir && hasText && isCorrectLang) {
      console.log(`   ✅ PASSED (${tc.lang.toUpperCase()}): dir=${val.dir}\n`);
      pass++;
    } else {
      console.log(`   ❌ FAILED: dir=${val?.dir}, h1="${val?.h1}"\n`);
      fail++;
    }
  }

  await browser.close();

  console.log('========================================');
  console.log(`Summary: ${pass} passed, ${fail} failed.`);
  console.log('========================================');

  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
