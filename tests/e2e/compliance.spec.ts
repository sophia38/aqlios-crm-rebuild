import { expect, test, type Page } from '@playwright/test';

const CQC = '/verticals/public/compliance-dashboard/';

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

test.describe('compliance dashboard', () => {
  test('super-admin sees the cards, table, filters and pagination', async ({ page }) => {
    await logIn(page);
    await page.goto(CQC);
    await expect(page.getByRole('heading', { name: 'Compliance Dashboard' })).toBeVisible();
    for (const label of [
      'Total Staff',
      'Compliant',
      'Pending Upload',
      'Awaiting Verification',
      'Re-verification Due',
      'Expired',
    ]) {
      await expect(page.getByRole('listitem').filter({ hasText: label }).first()).toBeVisible();
    }
    await expect(page.getByRole('listitem').filter({ hasText: 'Total Staff' })).toContainText('98');
    await expect(page.getByText('Across All Practices')).toBeVisible();

    const table = page.getByRole('table', { name: 'Staff compliance' });
    await expect(table.getByRole('row')).toHaveCount(11);
    await expect(page.getByText('1–10 of 98')).toBeVisible();
    await page.getByRole('button', { name: 'Go to next page' }).click();
    await expect(page.getByText('11–20 of 98')).toBeVisible();

    await page.getByLabel('Compliance Status').click();
    await page.getByRole('option', { name: 'Expired' }).click();
    const rows = table.getByRole('row');
    await expect(rows.nth(1)).toContainText('Expired');
    for (const row of (await rows.all()).slice(1)) await expect(row).toContainText('Expired');
    // The cards keep the unfiltered totals.
    await expect(page.getByRole('listitem').filter({ hasText: 'Total Staff' })).toContainText('98');

    await page.getByLabel('Search').fill('zzzz');
    await expect(page.getByText('No staff found. Adjust your filters or search term.')).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page.getByText('1–10 of 98')).toBeVisible();
  });

  test('a 401 shows the error without logging out; a 500 shows the error too', async ({ page }) => {
    await logIn(page);
    await page.goto('/verticals/public/practices/');
    await page.evaluate(() => window.localStorage.setItem('aqlios-mock-fail', 'GET /staff/dashboard/ 401'));
    await page.goto(CQC);
    await expect(page.getByText('Failed to load compliance dashboard').first()).toBeVisible();
    await expect(page).toHaveURL(/compliance-dashboard/);
    await expect(page.getByRole('button', { name: /Account menu for/ })).toBeVisible();

    await page.evaluate(() => window.localStorage.setItem('aqlios-mock-fail', '/staff/dashboard/'));
    await page.reload();
    await expect(page.getByText('Failed to load compliance dashboard').first()).toBeVisible();
    await page.evaluate(() => window.localStorage.removeItem('aqlios-mock-fail'));
    await page.reload();
    await expect(page.getByText('1–10 of 98')).toBeVisible();
  });

  test('practice users get the no-access state', async ({ page }) => {
    await logIn(page, 'practice-user');
    await page.goto(CQC);
    await expect(page.getByText("You don't have access to this page")).toBeVisible();
  });
});
