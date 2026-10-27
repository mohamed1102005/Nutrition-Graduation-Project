import { Browser, sleep } from '../.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BASE_URL = 'http://localhost:8443';
const API_URL = 'http://localhost:4000/api';
const SCREENSHOT_DIR = './screenshots-test';

if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const DEMO_CREDENTIALS = {
  Client: { email: 'sara@demo.com', password: 'demo1234' },
  Specialist: { email: 'mona@demo.com', password: 'demo1234' },
  Admin: { email: 'admin@demo.com', password: 'demo1234' },
  Finance: { email: 'finance@demo.com', password: 'demo1234' },
  OrgAdmin: { email: 'admin@apex.com', password: 'demo1234' },
};

const PAGES_TO_VERIFY = [
  { path: '/app/today', name: 'client-today', role: 'Client' },
  { path: '/app/plan', name: 'client-plan', role: 'Client' },
  { path: '/app/progress', name: 'client-progress', role: 'Client' },
  { path: '/app/ai-plan', name: 'client-ai-plan', role: 'Client' },
  { path: '/app/bookings/checkout', name: 'client-checkout', role: 'Client' },
  { path: '/app/today', name: 'specialist-today', role: 'Specialist' },
  { path: '/app/clients/sara', name: 'specialist-client-detail', role: 'Specialist' },
  { path: '/app/overview', name: 'admin-overview', role: 'Admin' },
  { path: '/app/finance/overview', name: 'finance-overview', role: 'Finance' },
  { path: '/app/org', name: 'org-dashboard', role: 'OrgAdmin' },
];

async function getTokens() {
  const tokens = {};
  for (const [role, creds] of Object.entries(DEMO_CREDENTIALS)) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds),
    });
    const json = await res.json();
    tokens[role] = {
      token: json.data?.token,
      user: json.data?.user,
    };
  }
  return tokens;
}

async function run() {
  console.log('🔑 Authenticating demo accounts via backend API...');
  const authData = await getTokens();

  console.log('🚀 Launching headless browser for AR/EN Localization verification...');
  const browser = await Browser.launch({ width: 1440, height: 900 });
  const page = await browser.newPage({ width: 1440, height: 900 });

  let totalPassed = 0;
  let totalFailed = 0;

  try {
    for (const lang of ['en', 'ar']) {
      console.log(`\n================== TESTING LANGUAGE: ${lang.toUpperCase()} ==================`);
      for (const item of PAGES_TO_VERIFY) {
        page.consoleErrors.length = 0;

        // Navigate to login to initialize local storage
        await page.goto(`${BASE_URL}/login`, { settleMs: 300 });
        const { token, user } = authData[item.role];
        await page.eval(({ tok, u, l }) => {
          localStorage.setItem('rebound_token', tok);
          localStorage.setItem('rebound_user', JSON.stringify(u));
          localStorage.setItem('rebound_lang', l);
        }, { tok: token, u: user, l: lang });

        // Navigate to target route
        await page.goto(`${BASE_URL}${item.path}`, { settleMs: 1500 });

        const info = await page.eval(() => {
          const docLang = document.documentElement.lang;
          const docDir = document.documentElement.dir;
          const h1 = document.querySelector('h1')?.textContent?.trim() || '';
          const h2 = document.querySelector('h2')?.textContent?.trim() || '';
          const hasErrorBoundary = !!document.querySelector('h2')?.textContent?.includes('Something went wrong');
          const arabicRegex = /[\u0600-\u06FF]/;
          const bodyText = document.body.innerText;
          const hasArabicText = arabicRegex.test(bodyText);

          // Count arabic characters vs total characters
          const arabicMatches = bodyText.match(/[\u0600-\u06FF]/g) || [];

          // Language Switch button check
          const switchBtn = document.querySelector('button[aria-label*="Switch language"]');
          const switchLabel = switchBtn ? switchBtn.textContent.trim() : '';
          const hasEgOrGb = /🇪🇬|🇬🇧|\bEG\b|\bGB\b/.test(switchLabel);

          return {
            docLang,
            docDir,
            h1,
            h2,
            hasErrorBoundary,
            hasArabicText,
            arabicCharCount: arabicMatches.length,
            switchLabel,
            hasEgOrGb,
          };
        });

        const errors = [...page.consoleErrors];
        const isArabicCheck = lang === 'ar' ? (info.docDir === 'rtl' && info.hasArabicText && info.arabicCharCount > 50) : true;
        const noEgGb = !info.hasEgOrGb;
        const passed = errors.length === 0 && !info.hasErrorBoundary && isArabicCheck && noEgGb;

        if (passed) {
          totalPassed++;
          console.log(`✅ [${lang.toUpperCase()}] ${item.path} (${item.name}): dir=${info.docDir}, switchBtn="${info.switchLabel}", h1="${info.h1.slice(0, 30)}"`);
        } else {
          totalFailed++;
          console.error(`❌ [${lang.toUpperCase()}] FAILED: ${item.path} (${item.name})`);
          if (info.hasEgOrGb) console.error(`   Switch button still contains EG/GB or flag: "${info.switchLabel}"`);
          if (errors.length) console.error('   Console errors:', errors);
          if (info.hasErrorBoundary) console.error('   Error boundary tripped!');
          if (lang === 'ar' && (!info.hasArabicText || info.docDir !== 'rtl' || info.arabicCharCount <= 50)) {
            console.error('   RTL or Arabic translation missing/sparse:', { docDir: info.docDir, arChars: info.arabicCharCount });
          }
        }

        // Take snapshot for key pages
        const screenshotPath = join(SCREENSHOT_DIR, `${lang}-${item.name}.jpeg`);
        await page.screenshot({ path: screenshotPath, quality: 75 });
      }
    }

    console.log('\n=======================================');
    console.log(`Localization Test Result: ${totalPassed} passed, ${totalFailed} failed.`);
    console.log('=======================================\n');
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await browser.close();
  }
}

run();
