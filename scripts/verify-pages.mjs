import { Browser, sleep } from '../.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BASE_URL = 'http://localhost:8443';
const SCREENSHOT_DIR = './screenshots-test';

if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const DEMO_USERS = {
  Client: { id: 1, name: 'Sara Hassan', email: 'sara@demo.com', role: 'client', onboardingCompleted: true },
  Specialist: { id: 2, name: 'Dr. Mona Fathy', email: 'mona@demo.com', role: 'specialist', approvalStatus: 'approved', onboardingCompleted: true },
  Admin: { id: 3, name: 'Admin team', email: 'admin@demo.com', role: 'admin', onboardingCompleted: true },
  Finance: { id: 4, name: 'Tamer Fahmy', email: 'finance@demo.com', role: 'finance', onboardingCompleted: true },
  OrgAdmin: { id: 10, name: 'Apex Admin', email: 'admin@apex.com', role: 'org_admin', organizationId: 1, onboardingCompleted: true },
};

const ROUTES_TO_TEST = [
  // Public
  { path: '/', name: 'landing', role: null },
  { path: '/login', name: 'login', role: null },
  { path: '/signup', name: 'signup', role: null },
  { path: '/join', name: 'join-org', role: null },
  { path: '/register-org', name: 'register-org', role: null },

  // Client Dashboard & Pages
  { path: '/app/today', name: 'client-dashboard-today', role: 'Client' },
  { path: '/app/specialists', name: 'client-specialists', role: 'Client' },
  { path: '/app/my-specialists', name: 'client-my-specialists', role: 'Client' },
  { path: '/app/bookings', name: 'client-bookings', role: 'Client' },
  { path: '/app/bookings/checkout', name: 'client-checkout', role: 'Client' },
  { path: '/app/plan', name: 'client-plan', role: 'Client' },
  { path: '/app/progress', name: 'client-progress', role: 'Client' },
  { path: '/app/ai-plan', name: 'client-ai-plan', role: 'Client' },
  { path: '/session', name: 'client-session', role: 'Client' },

  // Specialist Dashboard & Pages
  { path: '/app/today', name: 'specialist-dashboard-today', role: 'Specialist' },
  { path: '/app/clients', name: 'specialist-clients', role: 'Specialist' },
  { path: '/app/clients/sara', name: 'specialist-client-detail', role: 'Specialist' },
  { path: '/app/schedule', name: 'specialist-schedule', role: 'Specialist' },

  // Platform Admin Dashboard & Pages
  { path: '/app/overview', name: 'admin-dashboard-overview', role: 'Admin' },
  { path: '/app/users', name: 'admin-users', role: 'Admin' },
  { path: '/app/approvals', name: 'admin-approvals', role: 'Admin' },
  { path: '/app/admin/support', name: 'admin-support', role: 'Admin' },

  // Finance Dashboard & Pages
  { path: '/app/finance/overview', name: 'finance-dashboard-overview', role: 'Finance' },
  { path: '/app/finance/transactions', name: 'finance-transactions', role: 'Finance' },
  { path: '/app/finance/payouts', name: 'finance-payouts', role: 'Finance' },
  { path: '/app/finance/subscriptions', name: 'finance-subscriptions', role: 'Finance' },

  // Org Admin Dashboard & Pages
  { path: '/app/org', name: 'org-dashboard', role: 'OrgAdmin' },
  { path: '/app/org/members', name: 'org-members', role: 'OrgAdmin' },
  { path: '/app/org/specialists', name: 'org-specialists', role: 'OrgAdmin' },
];

async function run() {
  console.log('🚀 Launching headless browser via CDP...');
  const browser = await Browser.launch({ width: 1440, height: 900 });
  const page = await browser.newPage({ width: 1440, height: 900 });

  const results = [];
  let totalErrors = 0;

  try {
    for (const item of ROUTES_TO_TEST) {
      console.log(`\nTesting [${item.role || 'Public'}] ${item.path} (${item.name})...`);
      
      // Reset errors for page
      page.consoleErrors.length = 0;

      // Navigate to base first to set localStorage if role is needed
      if (item.role) {
        await page.goto(`${BASE_URL}/login`, { settleMs: 300 });
        const user = DEMO_USERS[item.role];
        await page.eval((u) => {
          localStorage.setItem('rebound_token', 'demo-valid-token');
          localStorage.setItem('rebound_user', JSON.stringify(u));
        }, user);
      } else {
        await page.goto(`${BASE_URL}/login`, { settleMs: 300 });
        await page.eval(() => {
          localStorage.removeItem('rebound_token');
          localStorage.removeItem('rebound_user');
        });
      }

      // Navigate to target route
      await page.goto(`${BASE_URL}${item.path}`, { settleMs: 1500 });

      // Check for errors and UI state
      const state = await page.eval(() => {
        const root = document.getElementById('root');
        const hasErrorBoundary = !!document.querySelector('h2')?.textContent?.includes('Something went wrong');
        const errorBoundaryText = hasErrorBoundary ? document.body.innerText.slice(0, 300) : null;
        const pageTitle = document.title;
        const headingText = document.querySelector('h1, h2')?.textContent?.trim() || '';
        return {
          rootLength: root ? root.innerHTML.length : 0,
          hasErrorBoundary,
          errorBoundaryText,
          pageTitle,
          headingText,
        };
      });

      const errors = [...page.consoleErrors];
      const hasErrors = errors.length > 0 || state.hasErrorBoundary;

      if (hasErrors) {
        totalErrors++;
        console.error(`❌ FAILED: ${item.path}`);
        if (state.hasErrorBoundary) {
          console.error(`   Error Boundary tripped: ${state.errorBoundaryText}`);
        }
        if (errors.length) {
          console.error(`   Console errors:`, errors);
        }
      } else {
        console.log(`✅ PASSED: ${item.path} (Heading: "${state.headingText}")`);
      }

      // Take screenshot of dashboards and redesigned key pages
      if (item.name.includes('dashboard') || item.name === 'landing' || item.name.includes('client-') || item.name.includes('specialist-')) {
        const screenshotPath = join(SCREENSHOT_DIR, `${item.name}.jpeg`);
        await page.screenshot({ path: screenshotPath, quality: 80 });
        console.log(`   📸 Screenshot saved: ${screenshotPath}`);
      }

      results.push({
        path: item.path,
        name: item.name,
        role: item.role,
        passed: !hasErrors,
        heading: state.headingText,
        errors,
        errorBoundary: state.errorBoundaryText,
      });
    }

    console.log('\n=======================================');
    console.log(`Summary: ${results.filter(r => r.passed).length}/${results.length} passed.`);
    if (totalErrors > 0) {
      console.log(`⚠️ ${totalErrors} routes failed!`);
    } else {
      console.log('🎉 ALL ROUTES AND DASHBOARDS PASSED WITH 0 CONSOLE ERRORS!');
    }
    console.log('=======================================\n');

  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    await browser.close();
  }
}

run();
