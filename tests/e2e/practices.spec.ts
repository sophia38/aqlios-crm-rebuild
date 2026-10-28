import { expect, test, type Page } from '@playwright/test';

const LIST = '/verticals/public/hub-management/practices/';
const ONBOARD = `${LIST}practice-management/onboard/`;

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

test.describe('practice grid', () => {
  test('shows 12 cards, paginates, toggles view and opens a practice', async ({ page }) => {
    await logIn(page);
    await page.goto('/verticals/public/practices/');
    const grid = page.getByRole('list', { name: 'Practices' });
    await expect(grid.getByRole('button', { name: /^Open business / })).toHaveCount(12);
    await expect(page.getByText('1–12 of 155')).toBeVisible();
    await page.getByRole('button', { name: 'Go to next page' }).click();
    await expect(page.getByText('13–24 of 155')).toBeVisible();

    await page.getByRole('tab', { name: 'List view' }).click();
    await expect(page.getByRole('table', { name: 'Practices' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('tab', { name: 'List view' })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', { name: 'Grid view' }).click(); // the reload starts again on page 1
    await grid.getByRole('button', { name: 'Open business Ashford Medical Centre' }).click();
    await expect(page).toHaveURL(/\/practices\/ashford-medical-centre\/dashboard\/$/);
  });

  test('practice user sees only their practices and no Onboard button', async ({ page }) => {
    await logIn(page, 'practice-user');
    await expect(page).toHaveURL(/\/verticals\/public\/practices\/$/);
    await expect(page.getByRole('list', { name: 'Practices' }).getByRole('button')).toHaveCount(2);
    await expect(page.getByRole('link', { name: 'Onboard New Practice' })).toHaveCount(0);
  });
});

test.describe('practice management list', () => {
  test('default sort, sorting, search, empty state and incomplete rows', async ({ page }) => {
    await logIn(page);
    await page.goto(LIST);
    const table = page.getByRole('table', { name: 'Practices' });
    await expect(table.getByRole('columnheader', { name: 'Date Added' })).toHaveAttribute('aria-sort', 'descending');
    await expect(page.getByText('1–10 of 155')).toBeVisible();
    await expect(table.getByLabel('Practice profile is incomplete').first()).toBeVisible();

    await table.getByRole('button', { name: 'No. of Users' }).click();
    await expect(table.getByRole('columnheader', { name: 'No. of Users' })).toHaveAttribute('aria-sort', 'descending');

    await page.getByLabel(/^Practice Name/).fill('Riverside');
    await expect(page.getByText('1–4 of 4')).toBeVisible();
    await page.getByLabel(/^Practice Name/).fill('zzz no match');
    await expect(table.getByText('No practices found. Try another search.')).toBeVisible();
  });

  test('View opens the practice profile', async ({ page }) => {
    await logIn(page);
    await page.goto(LIST);
    await page.getByRole('link', { name: 'View Ashford Medical Centre' }).click();
    await expect(page).toHaveURL(/complete-profile\/\?practiceId=.+&subAppId=/);
    await expect(page.getByRole('heading', { name: 'Practice Information' })).toBeVisible();
  });
});

test.describe('onboard new practice', () => {
  test('empty save shows the captured messages and focuses the first error', async ({ page }) => {
    await logIn(page);
    await page.goto(ONBOARD);
    await page.getByRole('button', { name: 'Save Changes' }).click();
    for (const message of [
      'Practice name or ODS code is required',
      'Practice name is required',
      'PCN name is required',
      'Phone number is required',
      'Address line 1 is required',
      'Postcode is required',
    ]) {
      await expect(page.getByText(message)).toBeVisible();
    }
    await expect(page.getByLabel('Practice name or ODS code')).toBeFocused();
  });

  test('ODS autofill, POC validation, hours check, duplicate name and successful save', async ({ page }) => {
    await logIn(page);
    await page.goto(ONBOARD);
    await page.getByLabel('Practice name or ODS code').fill('Ilkley');
    await page.getByRole('option', { name: /The Ilkley Surgery/ }).click();
    await expect(page.getByLabel(/^Practice Name/)).toHaveValue('The Ilkley Surgery');
    await expect(page.getByLabel('PCN Name')).not.toHaveValue('');
    await expect(page.getByLabel('Address Line 1')).not.toHaveValue('');

    // Duplicate name check.
    await page.getByLabel(/^Practice Name/).fill('Ashford Medical Centre');
    await expect(page.getByText('A practice with this name already exists.')).toBeVisible();
    await page.getByLabel(/^Practice Name/).fill('The Ilkley Surgery');

    // Point of contact: add, invalid email, then fill.
    await page.getByRole('button', { name: 'Add Another POC' }).first().click();
    await page.getByLabel(/^Email\s*\*?$/).fill('abc');
    await page.getByLabel(/^Email\s*\*?$/).blur();
    await expect(page.getByText('Enter a valid email')).toBeVisible();
    await page.getByLabel(/^Name\s*\*?$/).fill('Alex Morgan');
    await page.getByLabel(/^Contact No/).fill('7700 900123');
    await page.getByLabel(/^Email\s*\*?$/).fill('alex.morgan@nhs.demo');
    await page.getByLabel(/^Designation/).fill('Practice Lead');

    // Closing time before opening time.
    const mondayCloseHours = page
      .getByRole('group', { name: 'Monday closing time' })
      .getByRole('spinbutton', { name: 'Hours' });
    await mondayCloseHours.click();
    await page.keyboard.type('0700');
    await expect(page.getByText('Closing time must be after opening time')).toBeVisible();
    await mondayCloseHours.click();
    await page.keyboard.type('1730');
    await expect(page.getByText('Closing time must be after opening time')).toHaveCount(0);

    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Practice onboarded successfully')).toBeVisible();
    await expect(page).toHaveURL(/complete-profile\/\?practiceId=/);

    await page.goto(LIST);
    await expect(page.getByRole('table', { name: 'Practices' }).getByText('The Ilkley Surgery')).toBeVisible();
  });
});

test.describe('practice profile', () => {
  test('finishing the configuration clears the incomplete row', async ({ page }) => {
    await logIn(page);
    await page.goto(LIST);
    const row = page.getByRole('row', { name: /Castleton Medical Centre/ });
    await expect(row.getByLabel('Practice profile is incomplete')).toBeVisible();
    await row.getByRole('link', { name: 'View Castleton Medical Centre' }).click();
    await expect(page.getByRole('heading', { name: 'Practice Information' })).toBeVisible();

    // Save without a default appointment type → error.
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Select a default appointment type.')).toBeVisible();

    await page.getByRole('checkbox', { name: 'Face To Face Surgery' }).check();
    await page.getByRole('button', { name: 'Set Face To Face Surgery as default' }).click();
    await expect(page.getByText('Default', { exact: true })).toBeVisible();

    // Slot duration options follow the enabled types.
    await page.getByLabel('Role').first().click();
    await page.getByRole('option', { name: 'Clinician' }).click();
    await page.getByLabel('Appointment Type').first().click();
    await expect(page.getByRole('option', { name: 'Telephone Or Audio' })).toHaveCount(0);
    await page.getByRole('option', { name: 'Face To Face Surgery' }).click();
    await page.getByLabel('Duration (minutes)').first().fill('30');

    // Ongoing off shows End Date.
    await page.getByRole('checkbox', { name: 'Ongoing' }).uncheck();
    await expect(page.getByRole('group', { name: 'End Date' })).toBeVisible();
    await page.getByRole('checkbox', { name: 'Ongoing' }).check();

    // Succession date and any missing practice details, then save.
    const start = page.getByRole('group', { name: 'Start Date' });
    if ((await start.textContent())?.includes('DD')) {
      await start.click();
      await page.keyboard.type('01092026');
    }
    // Fill any practice details this fixture is missing, then save once.
    await page.getByRole('button', { name: 'Save Changes' }).click();
    if (await page.getByText('PCN name is required').isVisible())
      await page.getByLabel(/^PCN Name/).fill('Central PCN');
    if (await page.getByText('Phone number is required').isVisible()) {
      await page.getByLabel(/^Phone number/).fill('113 496 0000');
    }
    if (
      await page
        .getByText(/is required/)
        .first()
        .isVisible()
    ) {
      await page.getByRole('button', { name: 'Save Changes' }).click();
    }
    await expect(page.getByText('Practice profile updated successfully').first()).toBeVisible();

    await page.goto(LIST);
    await expect(
      page.getByRole('row', { name: /Castleton Medical Centre/ }).getByLabel('Practice profile is incomplete'),
    ).toHaveCount(0);
  });

  test('an unknown practice id shows the not-found state', async ({ page }) => {
    await logIn(page);
    await page.goto(`${LIST}practice-management/create/manual/complete-profile/?practiceId=nope`);
    await expect(page.getByRole('heading', { name: "Practice not found or you don't have access" })).toBeVisible();
  });
});
