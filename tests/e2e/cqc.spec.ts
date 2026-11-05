import { expect, test, type Page } from '@playwright/test';
import dayjs from 'dayjs';

const CQC = '/verticals/public/cqc-compliance/';

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

/** Opens an area from the module's own nav (a row of pills on a phone). */
async function openArea(page: Page, name: string) {
  await page
    .getByRole('navigation', { name: 'CQC Compliance sections' })
    .getByRole('link', { name, exact: true })
    .click();
  await expect(page.getByRole('heading', { name, level: 2 })).toBeVisible();
}

/** Types into the date sections, and types again if a keystroke was lost (it happens under load). */
async function typeDate(page: Page, label: RegExp, date: dayjs.Dayjs) {
  const group = page.getByRole('group', { name: label });
  await expect(async () => {
    await group.getByRole('spinbutton', { name: 'Day' }).focus();
    await page.keyboard.type(date.format('DDMMYYYY'), { delay: 20 });
    await expect(group.locator('input')).toHaveValue(date.format('DD/MM/YYYY'), { timeout: 1000 });
  }).toPass({ timeout: 15_000 });
}

async function choose(page: Page, scope: ReturnType<Page['getByRole']>, label: string, option: string) {
  await scope.getByLabel(label, { exact: false }).first().click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

const toast = (page: Page, text: string) => page.getByText(text, { exact: true });

test.describe('cqc compliance', () => {
  test('the overview shows the predicted rating, the numbers and one row per area', async ({ page }) => {
    await logIn(page);
    await page.goto(CQC);
    await expect(page.getByRole('heading', { name: 'CQC Compliance', level: 1 })).toBeVisible();
    await expect(page.getByText('Overall predicted rating')).toBeVisible();
    for (const label of [
      'Overall Readiness',
      'Open Or Progressing Gaps',
      'Not Checked',
      'High / Immediate Unresolved',
    ]) {
      await expect(page.getByRole('listitem').filter({ hasText: label }).first()).toBeVisible();
    }
    const areas = page.getByRole('table', { name: 'CQC areas' });
    await expect(areas.getByRole('row')).toHaveCount(9);
    for (const area of [
      'Inspection Checklist',
      'Estates & Statutory',
      'Clinical Searches',
      'CAS Alerts',
      'Surgery Audits',
      'Risk Assessments',
      'Policies',
      'National GP Patient Survey',
    ]) {
      await expect(areas.getByRole('row').filter({ hasText: area })).toHaveCount(1);
    }
    await expect(page.getByText(/Rating safeguard/)).toBeVisible();
    await page.getByRole('button', { name: 'Expand section' }).click();
    await expect(page.getByText('This is a management warning system, not a CQC scoring engine.')).toBeVisible();
  });

  test('an area lists its checks with filters, search and paging', async ({ page }) => {
    await logIn(page);
    await page.goto(CQC);
    await openArea(page, 'Inspection Checklist');
    const table = page.getByRole('table', { name: 'CQC checks' });
    await expect(table.getByRole('row')).toHaveCount(11);
    await expect(page.getByText('1–10 of 28')).toBeVisible();
    await page.getByRole('button', { name: 'Go to next page' }).click();
    await expect(page.getByText('11–20 of 28')).toBeVisible();

    await page.getByLabel('Search').fill('INS-014');
    await expect(table.getByRole('row')).toHaveCount(2);
    await expect(table).toContainText('National GP Patient Survey results entered, rated and actioned');
    await page.getByLabel('Search').fill('zzzz');
    await expect(page.getByText('No checks found. Try another search.')).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page.getByText('1–10 of 28')).toBeVisible();

    await choose(page, page.locator('main, body'), 'Area', 'Well-led');
    await expect(page.getByText('1–7 of 7')).toBeVisible();
  });

  test('a gap links to one action, and the check can only be completed once that action is closed', async ({
    page,
  }) => {
    await logIn(page);
    await page.goto(CQC);
    await openArea(page, 'Risk Assessments');
    await page.getByLabel('Search').fill('RA-001');
    await page.getByRole('button', { name: 'View RA-001' }).click();
    const drawer = page.getByRole('dialog', { name: 'Check RA-001' });

    // A gap needs a risk, a due date and the action.
    await choose(page, drawer, 'Status', 'Gap');
    await expect(drawer.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
    await choose(page, drawer, 'Risk', 'Medium');
    await drawer.getByLabel('Gap / action required').fill('Renew the assessment and sign it off.');
    await typeDate(page, /^Due \/ review date/, dayjs().add(30, 'day'));
    await expect(drawer.getByRole('button', { name: 'Save Changes' })).toBeEnabled();
    await drawer.getByRole('button', { name: 'Save Changes' }).click();
    await expect(toast(page, 'Check updated')).toBeVisible();
    const row = page.getByRole('table', { name: 'CQC checks' }).getByRole('row').filter({ hasText: 'RA-001' });
    await expect(row).toContainText('Gap');
    const actionId = (await row.textContent())?.match(/ACT-\d{3}/)?.[0];
    expect(actionId).toBeTruthy();

    // Complete is refused while the action is open.
    await page.getByRole('button', { name: 'View RA-001' }).click();
    await choose(page, drawer, 'Status', 'Complete');
    await drawer.getByLabel('Evidence location / reference').fill('Compliance folder / RA-001');
    await typeDate(page, /^Completed date/, dayjs());
    await drawer.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText(new RegExp(`Close action ${actionId} first`))).toBeVisible();
    // The header's Close button: on a phone the error toast sits over Cancel.
    await drawer.getByRole('button', { name: 'Close' }).click();
    await expect(drawer).toBeHidden();

    // Closing the action needs completion evidence and an effectiveness check.
    await openArea(page, 'Action Plan');
    await page.getByLabel('Search').fill(actionId!);
    await page.getByRole('button', { name: `View ${actionId}` }).click();
    const action = page.getByRole('dialog', { name: `Action ${actionId}` });
    await choose(page, action, 'Status', 'Closed');
    await action.getByLabel('Completion evidence').focus();
    await action.getByLabel('Effectiveness check').focus();
    await action.getByLabel('Status', { exact: false }).first().focus();
    await expect(action.getByText('Completion evidence is required to close an action')).toBeVisible();
    await expect(action.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
    await action.getByLabel('Completion evidence').fill('New assessment approved and filed.');
    await action.getByLabel('Effectiveness check').fill('Reviewed at the monthly governance meeting.');
    await action.getByRole('button', { name: 'Save Changes' }).click();
    await expect(toast(page, 'Action updated')).toBeVisible();
    await expect(page.getByRole('table', { name: 'CQC action plan' })).toContainText('Closed');
  });

  test('a survey result is scored against the national result', async ({ page }) => {
    await logIn(page);
    await page.goto(CQC);
    await openArea(page, 'National GP Patient Survey');
    await expect(page.getByRole('table', { name: 'National GP Patient Survey measures' }).getByRole('row')).toHaveCount(
      11,
    );
    await page.getByRole('button', { name: 'View NPS-02' }).click();
    const drawer = page.getByRole('dialog', { name: 'Measure NPS-02' });
    await drawer.getByLabel('Practice result (%)', { exact: true }).fill('72');
    await drawer.getByLabel('National result (%)', { exact: true }).fill('62');
    await expect(drawer).toContainText('+10pp');
    await drawer.getByLabel('Practice result (%)', { exact: true }).fill('150');
    await drawer.getByLabel('National result (%)', { exact: true }).focus();
    await expect(drawer.getByText('Practice result must be between 0 and 100')).toBeVisible();
    await drawer.getByLabel('Practice result (%)', { exact: true }).fill('72');
    await drawer.getByRole('button', { name: 'Save Changes' }).click();
    await expect(toast(page, 'Measure updated')).toBeVisible();
    await expect(
      page
        .getByRole('table', { name: 'National GP Patient Survey measures' })
        .getByRole('row')
        .filter({ hasText: 'NPS-02' }),
    ).toContainText('Outstanding-ready');
  });

  test('CAS alerts add an entry to the alert register', async ({ page }) => {
    await logIn(page);
    await page.goto(CQC);
    await openArea(page, 'CAS Alerts');
    const register = page.getByRole('table', { name: 'CAS alert register' });
    await expect(register).toBeVisible();
    await page.getByRole('button', { name: 'Add Alert' }).click();
    const drawer = page.getByRole('dialog', { name: 'Add Alert' });
    await expect(drawer.getByRole('button', { name: 'Add Alert' })).toBeDisabled();
    await drawer.getByLabel('Alert reference').fill('ALERT-777');
    await drawer.getByLabel('Alert title').fill('Sample alert: equipment recall');
    await typeDate(page, /^Received date/, dayjs().subtract(2, 'day'));
    await choose(page, drawer, 'Applicable?', 'Yes');
    await expect(drawer.getByRole('button', { name: 'Add Alert' })).toBeEnabled();
    await drawer.getByRole('button', { name: 'Add Alert' }).click();
    await expect(toast(page, 'Alert added')).toBeVisible();
    await expect(register).toContainText('Sample alert: equipment recall');
  });

  test('practice users get the no-access state', async ({ page }) => {
    await logIn(page, 'practice-user');
    await page.goto(CQC);
    await expect(page.getByText("You don't have access to this page")).toBeVisible();
  });

  test('the sidebar lists Compliance Dashboard above CQC Compliance', async ({ page }) => {
    await logIn(page);
    await page.goto(CQC);
    await page.getByRole('button', { name: 'Open menu' }).click();
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('link', { name: 'CQC Compliance' })).toBeVisible();
    const labels = await nav.getByRole('link').allInnerTexts();
    const dashboard = labels.findIndex((label) => label.includes('Compliance Dashboard'));
    const cqc = labels.findIndex((label) => label.includes('CQC Compliance'));
    expect(dashboard).toBeGreaterThan(-1);
    expect(cqc).toBe(dashboard + 1);
    await expect(nav.getByRole('link', { name: 'CQC Compliance' })).toHaveAttribute('aria-current', 'page');
  });
});
