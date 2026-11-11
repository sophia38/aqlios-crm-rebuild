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

test.describe('practice dashboard', () => {
  test('tiles and panels load from the practice data', async ({ page }) => {
    await logIn(page);
    await page.goto(`${PRACTICE}/dashboard/`);
    await expect(page.getByRole('heading', { name: 'Ashford Medical Centre dashboard' })).toBeAttached();

    for (const label of [
      'Staff on the books',
      'Rota coverage this week',
      'Shifts needing cover',
      'Appointments this week',
      'Leave to approve',
      'Certifications lapsing',
    ]) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }
    await expect(page.getByText(/^\d+ active · \d+ invited$/)).toBeVisible();
    await expect(page.getByText(/^\d+ of \d+ slots covered$/)).toBeVisible();

    for (const heading of [
      'The rota week',
      'Who works here',
      'Scheduling coverage',
      'Appointments this week',
      'On today',
      'Leave',
      'Compliance watchlist',
      'Practice details',
    ]) {
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    }
    const details = page.getByRole('region', { name: 'Practice details' });
    await expect(details.getByText('Y10000')).toBeVisible();
    await expect(details.getByText('Eastside PCN')).toBeVisible();
    await expect(page.getByRole('img', { name: /Monday: \d+ covered/ })).toBeVisible();
  });

  test('practice users get the dashboard for their practice', async ({ page }) => {
    await logIn(page, 'practice-user');
    await page.goto(`${PRACTICE}/dashboard/`);
    await expect(page.getByRole('heading', { name: 'The rota week' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Account menu for Sam Patel, in Ashford Medical Centre/ }),
    ).toBeVisible();
    // Practice users have no vertical picker in their menu.
    await page.getByRole('button', { name: /Account menu for Sam Patel/ }).click();
    await expect(page.getByRole('menuitem', { name: 'All verticals' })).toHaveCount(0);
    await expect(page.getByRole('menuitem', { name: 'Sign out' })).toBeVisible();
  });
});
