import { expect, test, type Page } from '@playwright/test';

const PRACTICE = '/verticals/public/practices/ashford-medical-centre';

async function logIn(page: Page, persona: 'super-admin' | 'practice-user' = 'super-admin') {
  await page.goto('/auth/login/');
  await page.getByLabel('Email').fill('reviewer@aqlios.demo');
  await page.getByLabel('Password', { exact: true }).fill('demo');
  if (persona === 'practice-user') {
    await page.getByLabel('Sign in as').click();
    await page.getByRole('option', { name: 'Practice user (GP)' }).click();
  }
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(/\/verticals\//);
}

test.describe('vertical frame', () => {
  test('drawer lists every module, marks the current page and closes', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Drawer layout is checked on desktop');
    await logIn(page);
    await page.goto('/verticals/public/roles/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('link')).toHaveCount(16);
    await expect(nav.getByRole('link', { name: 'Role and Permissions' })).toHaveAttribute('aria-current', 'page');

    await page.keyboard.press('Escape');
    await expect(nav).toBeHidden();

    await page.getByRole('button', { name: 'Open menu' }).click();
    await nav.getByRole('link', { name: 'Payroll' }).click();
    await expect(page).toHaveURL(/\/coming-soon\/payroll\/$/);
    await expect(page.getByText('We are currently building Payroll. It will be available here soon.')).toBeVisible();
    await expect(nav).toBeHidden();
  });

  test('bell opens hub notifications and Back to Verticals returns', async ({ page, isMobile }) => {
    await logIn(page);
    await page.goto('/verticals/public/templates/');
    await page.getByRole('link', { name: 'Notifications' }).click();
    await expect(page).toHaveURL(/\/verticals\/public\/notifications\/$/);
    test.skip(isMobile, 'Back to Verticals is hidden on phones, as space is short');
    await page.getByRole('link', { name: 'Back to Verticals' }).click();
    await expect(page).toHaveURL(/\/verticals\/$/);
  });
});

test.describe('practice frame', () => {
  test('sidebar, title, Activity Tracker highlight and switcher', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Sidebar layout is checked on desktop');
    await logIn(page);
    await page.goto(`${PRACTICE}/dashboard/`);
    await expect(page.getByRole('heading', { name: 'Welcome, Aqlios!' })).toBeVisible();
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'Profile' })).toHaveCount(0);

    await nav.getByRole('link', { name: 'Activity Tracker' }).click();
    await expect(page).toHaveURL(/\/rota\/\?module=activityTracker$/);
    await expect(nav.getByRole('link', { name: 'Activity Tracker' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'ROTA Management' })).not.toHaveAttribute('aria-current', 'page');

    await page.getByRole('button', { name: /Current practice: Ashford Medical Centre/ }).click();
    await page.getByRole('menuitem', { name: 'Switch Practice' }).click();
    await expect(page).toHaveURL(/\/verticals\/public\/practices\/$/);
  });

  test('sidebar collapse is remembered after reload', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Sidebar layout is checked on desktop');
    await logIn(page);
    await page.goto(`${PRACTICE}/dashboard/`);
    await page.getByRole('button', { name: 'Collapse sidebar' }).click();
    await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
  });

  test('settings opens on its first section and placeholders use the live copy', async ({ page }) => {
    await logIn(page);
    await page.goto(`${PRACTICE}/settings/`);
    await expect(page).toHaveURL(/\/settings\/appointment-configuration\/$/);
    await page.goto(`${PRACTICE}/support/`);
    await expect(page.getByText(/building the public practice support center/)).toBeVisible();
  });

  test('a practice that was not pre-built shows the not-found page', async ({ page }) => {
    await logIn(page);
    await page.goto('/verticals/public/practices/does-not-exist/dashboard/');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  });
});

test.describe('practice user access', () => {
  test('menu differs and hidden pages are blocked', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Sidebar layout is checked on desktop');
    await logIn(page, 'practice-user');
    await page.goto(`${PRACTICE}/dashboard/`);
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('link', { name: 'Profile' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'HR Policies' })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Documents' })).toHaveCount(0);

    await page.goto(`${PRACTICE}/hr-policies/ask/`);
    await expect(page.getByRole('heading', { name: "You don't have access to this page" })).toBeVisible();
  });

  test('hub routes show no access; other practices are not found', async ({ page }) => {
    await logIn(page, 'practice-user');
    await page.goto('/verticals/public/roles/');
    await expect(page.getByRole('heading', { name: "You don't have access to this page" })).toBeVisible();
    await page.goto('/verticals/public/practices/castleton-medical-centre/dashboard/');
    await expect(page.getByRole('heading', { name: "Practice not found or you don't have access" })).toBeVisible();
  });
});

test.describe('phone layout', () => {
  test('practice frame fits the screen and the menu opens from ☰', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Phone-only layout');
    await logIn(page);
    await page.goto(`${PRACTICE}/dashboard/`);
    await expect(page.getByRole('heading', { name: 'Welcome, Aqlios!' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.getByRole('button', { name: 'Open menu' }).click();
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await nav.getByRole('link', { name: 'Support' }).click();
    await expect(page).toHaveURL(/\/support\/$/);
    await expect(nav).toBeHidden();
  });
});
