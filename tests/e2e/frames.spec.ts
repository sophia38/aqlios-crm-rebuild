import { expect, test, type Page } from '@playwright/test';

const PRACTICE = '/verticals/public/practices/ashford-medical-centre';

async function logIn(page: Page, persona: 'super-admin' | 'practice-user' = 'super-admin') {
  await page.goto('/auth/login/');
  await page.getByLabel('Email').fill('reviewer@aqlios.demo');
  await page.getByLabel('Password', { exact: true }).fill('demo');
  if (persona === 'practice-user') {
    await page.getByRole('radio', { name: 'Practice user (GP)' }).check();
  }
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(/\/verticals\//);
}

test.describe('vertical frame', () => {
  test('sidebar panel lists every module, marks the current page and collapses', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The sidebar panel is desktop only');
    await logIn(page);
    await page.goto('/verticals/public/roles/');
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('link')).toHaveCount(17);
    await expect(nav.getByRole('link', { name: 'Role and Permissions' })).toHaveAttribute('aria-current', 'page');

    // Groups fold away, except the one holding the current page.
    await nav.getByRole('button', { name: 'FINANCE' }).click();
    await expect(nav.getByRole('link', { name: 'Payroll' })).toBeHidden();
    await nav.getByRole('button', { name: 'FINANCE' }).click();
    await nav.getByRole('link', { name: 'Payroll' }).click();
    await expect(page).toHaveURL(/\/coming-soon\/payroll\/$/);
    await expect(page.getByText('We are currently building Payroll. It will be available here soon.')).toBeVisible();

    // The icon rail keeps every link (named for screen readers) and is remembered after reload.
    await page.getByRole('button', { name: 'Collapse sidebar' }).click();
    await expect(nav.getByRole('link', { name: 'Payroll' })).toHaveAttribute('aria-current', 'page');
    await page.reload();
    await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
    await page.getByRole('button', { name: 'Expand sidebar' }).click();
  });

  test('bell opens hub notifications and Back to Verticals returns', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The bell and Back to Verticals move into the ☰ menu on phones');
    await logIn(page);
    await page.goto('/verticals/public/templates/');
    await page.getByRole('banner').getByRole('link', { name: 'Notifications' }).click();
    await expect(page).toHaveURL(/\/verticals\/public\/notifications\/$/);
    await page.getByRole('link', { name: 'Back to Verticals' }).click();
    await expect(page).toHaveURL(/\/verticals\/$/);
  });

  test('top-bar search finds pages and practices', async ({ page }) => {
    await logIn(page);
    await page.goto('/verticals/public/templates/');
    const search = page.getByRole('combobox', { name: 'Find practices and pages' });
    await search.fill('rota');
    await page.getByRole('option', { name: /ROTA Management/ }).click();
    await expect(page).toHaveURL(/\/verticals\/public\/rota\/$/);

    await search.fill('ashford medical');
    await page.getByRole('option', { name: /Ashford Medical Centre/ }).click();
    await expect(page).toHaveURL(/\/practices\/ashford-medical-centre\/dashboard\/?$/);
  });

  test('Sign out at the foot of the sidebar', async ({ page, isMobile }) => {
    await logIn(page);
    await page.goto('/verticals/public/templates/');
    if (isMobile) await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/auth\/login\/$/);
  });

  test('phones open the hub menu from ☰', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Phone-only layout');
    await logIn(page);
    await page.goto('/verticals/public/roles/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.getByRole('button', { name: 'Open menu' }).click();
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await nav.getByRole('link', { name: 'Template Library' }).click();
    await expect(page).toHaveURL(/\/templates\/$/);
    await expect(nav).toBeHidden();
  });
});

test.describe('practice frame', () => {
  test('sidebar, title, Activity Tracker highlight and switcher', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Sidebar layout is checked on desktop');
    await logIn(page);
    await page.goto(`${PRACTICE}/dashboard/`);
    await expect(page.getByRole('heading', { name: 'The rota week' })).toBeVisible();
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'Profile' })).toHaveCount(0);

    await nav.getByRole('link', { name: 'Activity Tracker' }).click();
    await expect(page).toHaveURL(/\/rota\/\?module=activityTracker$/);
    await expect(nav.getByRole('link', { name: 'Activity Tracker' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'ROTA Management' })).not.toHaveAttribute('aria-current', 'page');

    await page.getByRole('button', { name: /Account menu for Aqlios Admin, in Ashford Medical Centre/ }).click();
    await page.getByRole('menuitem', { name: 'All practices' }).click();
    await expect(page).toHaveURL(/\/verticals\/public\/practices\/$/);
  });

  test('account menu switches to another practice', async ({ page }) => {
    await logIn(page);
    await page.goto(`${PRACTICE}/dashboard/`);
    const chip = page.getByRole('button', { name: /Account menu for Aqlios Admin, in Ashford Medical Centre/ });
    await chip.click();
    const menu = page.getByRole('menu');
    await expect(menu.getByRole('menuitemradio', { name: /Ashford Medical Centre/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await menu.getByRole('menuitemradio', { name: /Barnwell Medical Centre/ }).click();
    await expect(page).toHaveURL(/\/practices\/barnwell-medical-centre\/dashboard\/$/);
    await expect(page.getByRole('button', { name: /in Barnwell Medical Centre/ })).toBeVisible();
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

  test('an unknown practice URL shows the practice not-found state', async ({ page }) => {
    await logIn(page);
    await page.goto('/verticals/public/practices/does-not-exist/dashboard/');
    // The static fallback renders practice dashboards that weren't pre-built (newly onboarded ones).
    await expect(page.getByRole('heading', { name: "Practice not found or you don't have access" })).toBeVisible();
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
    await expect(page.getByRole('heading', { name: 'The rota week' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.getByRole('button', { name: 'Open menu' }).click();
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await nav.getByRole('link', { name: 'Support' }).click();
    await expect(page).toHaveURL(/\/support\/$/);
    await expect(nav).toBeHidden();
  });
});
