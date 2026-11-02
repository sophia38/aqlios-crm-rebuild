import { expect, test, type Page } from '@playwright/test';

const ROTA = '/verticals/public/rota/';

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

const calendar = (page: Page) => page.getByRole('region', { name: 'Rota calendar' });
const shiftButtons = (page: Page) => calendar(page).getByRole('button', { name: /, (Salaried|Locum), / });

test.describe('rota management', () => {
  test('week grid with shifts, legend, navigation and day view', async ({ page }) => {
    await logIn(page);
    await page.goto(ROTA);
    await expect(page.getByRole('heading', { name: 'Hub ROTA Management' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Rota Management' })).toHaveAttribute('aria-selected', 'true');
    const legend = page.getByRole('list', { name: 'Legend' });
    for (const label of ['AM', 'PM', 'On Call', 'Remote Working', 'Leave-created', 'Unallocated']) {
      await expect(legend.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(shiftButtons(page).first()).toBeVisible();

    const label = page.locator('[aria-live="polite"]').first();
    const thisWeek = await label.textContent();
    await page.getByRole('button', { name: 'Next week' }).click();
    await expect(label).not.toHaveText(thisWeek ?? '');
    await page.getByRole('button', { name: 'Previous week' }).click();
    await expect(label).toHaveText(thisWeek ?? '');

    await page.getByRole('tab', { name: 'Day', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Next day' })).toBeVisible();
    await expect(calendar(page).getByRole('button', { name: /^Assign staff, / })).toHaveCount(48);
  });

  test('picking a practice enables Download Rota; staff view and phase 5 notes', async ({ page }) => {
    await logIn(page);
    await page.goto(ROTA);
    const download = page.getByRole('button', { name: 'Download Rota' });
    await expect(download).toBeDisabled();
    const panel = page.getByRole('complementary', { name: 'Select Practice' });
    await panel
      .getByRole('button', { name: /Weekly Capacity/ })
      .first()
      .click();
    await expect(download).toBeEnabled();
    const [file] = await Promise.all([page.waitForEvent('download'), download.click()]);
    expect(file.suggestedFilename()).toMatch(/^rota-.+-\d{4}-\d{2}-\d{2}\.csv$/);

    await calendar(page)
      .getByRole('button', { name: /^Assign staff, / })
      .first()
      .click();
    await expect(
      page.getByText('This is rebuilt in phase 5, together with practice-level ROTA.').first(),
    ).toBeVisible();

    await page.getByRole('tab', { name: 'Staff View' }).click();
    await expect(page.getByRole('paragraph').filter({ hasText: /^Staff View$/ })).toBeVisible();
    const staffPanel = page.getByRole('complementary', { name: 'Select Staff' });
    await expect(staffPanel.getByRole('button', { name: /^Clinicians\(\d+\)$/ })).toBeVisible();
    await staffPanel.getByRole('button', { name: 'Collapse sidebar' }).click();
    await expect(staffPanel.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
  });
});

test.describe('rota groups', () => {
  test('deep link, dependent fields, create and edit', async ({ page }) => {
    await logIn(page);
    await page.goto(`${ROTA}?tab=rota-groups`);
    await expect(page.getByRole('tab', { name: 'Rota Groups' })).toHaveAttribute('aria-selected', 'true');
    const table = page.getByRole('table', { name: 'Rota groups' });
    await expect(table.getByRole('row')).toHaveCount(4);
    await expect(table.getByRole('row', { name: /Primary Rota Group/ })).toContainText('15 sites');

    await page.getByRole('button', { name: 'Create Rota Group' }).click();
    const dialog = page.getByRole('dialog', { name: 'Create Rota Group' });
    const submit = dialog.getByRole('button', { name: 'Create Group' });
    await expect(submit).toBeDisabled();
    await expect(dialog.getByText('Select practice first')).toBeVisible();
    await expect(dialog.getByText('Select role first')).toBeVisible();

    await dialog.getByLabel(/Group Name/).fill('Weekend Cover');
    await dialog.getByLabel(/Description/).fill('Saturday & Sunday cover <b>');
    await dialog.getByLabel(/Group Name/).click();
    await expect(dialog.getByText('Only alphanumeric text and standard punctuation are accepted.')).toHaveCSS(
      'color',
      'rgb(220, 38, 38)',
    );
    await dialog.getByLabel(/Description/).fill('Saturday and Sunday cover.');

    await dialog.getByLabel(/Select Practices/).click();
    await page.getByRole('option').first().click();
    await expect(dialog.getByText('Select practice first')).toHaveCount(0);
    await dialog.getByLabel(/Select Roles/).click();
    await page.getByRole('option', { name: 'Nurse' }).click();
    await dialog.getByLabel(/Select Staff/).click();
    await page.getByRole('option').first().click();
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(page.getByText('Rota group created successfully').first()).toBeVisible();
    await expect(table.getByRole('row', { name: /Weekend Cover/ })).toContainText('1 site');

    await page.getByRole('button', { name: 'Edit Weekend Cover' }).click();
    const edit = page.getByRole('dialog', { name: 'Edit Rota Group' });
    await expect(edit.getByLabel(/Group Name/)).toHaveValue('Weekend Cover');
    await edit.getByLabel(/Group Name/).fill('Weekend Cover Team');
    await edit.getByRole('switch', { name: 'Active Status' }).uncheck();
    await edit.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Rota group updated successfully').first()).toBeVisible();
    await expect(table.getByRole('row', { name: /Weekend Cover Team/ })).toContainText('Inactive');
  });
});

test.describe('activity tracker', () => {
  test('stats, cards and the On Leave filter', async ({ page }) => {
    await logIn(page);
    await page.goto(`${ROTA}?tab=activity-tracker`);
    await expect(page.getByRole('heading', { name: 'Activity Tracker' })).toBeVisible();
    for (const label of ['Active Now', 'Inactive', 'On Leave']) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }
    await page.getByLabel('Status').click();
    await page.getByRole('option', { name: 'On Leave' }).click();
    const cards = page.getByRole('region', { name: 'Staff activity' }).getByRole('article');
    const empty = page.getByText('No staff activity found. Try another search.');
    await expect(cards.first().or(empty)).toBeVisible();
    for (const card of await cards.all()) await expect(card).toContainText('On Leave');
  });

  test('practice users cannot open ROTA', async ({ page }) => {
    await logIn(page, 'practice-user');
    await page.goto(ROTA);
    await expect(page.getByText("You don't have access to this page")).toBeVisible();
  });
});
