import { expect, test, type Page } from '@playwright/test';

const SETTINGS = '/verticals/public/settings/';

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

const sectionTitle = (page: Page) => page.locator('#settings-section-title');

test.describe('settings shell', () => {
  test('section links, deep links and fallback', async ({ page }) => {
    await logIn(page);
    await page.goto(SETTINGS);
    await expect(sectionTitle(page)).toHaveText('Global Practice Configuration');
    const nav = page.getByRole('navigation', { name: 'Settings sections' });
    await expect(nav.getByRole('link', { name: 'Global Practice Configuration' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await nav.getByRole('link', { name: 'Competency' }).click();
    await expect(page).toHaveURL(/\?section=competency$/);
    await expect(sectionTitle(page)).toHaveText('Competency');
    await expect(page.getByRole('navigation', { name: 'breadcrumb' })).toContainText('Competency');

    await page.goto(`${SETTINGS}?section=pathway-configuration`);
    await expect(sectionTitle(page)).toHaveText('Pathway Configuration');
    await page.goto(`${SETTINGS}?section=nonsense`);
    await expect(sectionTitle(page)).toHaveText('Global Practice Configuration');
  });

  test('practice users cannot open settings', async ({ page }) => {
    await logIn(page, 'practice-user');
    await page.goto(SETTINGS);
    await expect(page.getByText("You don't have access to this page")).toBeVisible();
  });
});

test.describe('global practice configuration', () => {
  test('save is disabled until a change; validation; saves and persists', async ({ page }) => {
    await logIn(page);
    await page.goto(`${SETTINGS}?section=practice-configuration`);
    const save = page.getByRole('button', { name: 'Save Changes' });
    const cancel = page.getByRole('button', { name: 'Cancel' });
    await expect(page.getByRole('heading', { name: /Appointment Type Configuration/ })).toBeVisible();
    await expect(save).toBeDisabled();
    await expect(cancel).toBeDisabled();

    // Turning off the only enabled type leaves no default.
    await page.getByRole('checkbox', { name: 'Call' }).uncheck();
    await expect(save).toBeEnabled();
    await save.click();
    await expect(page.getByText('Select a default appointment type.')).toBeVisible();
    await cancel.click();
    await expect(page.getByRole('checkbox', { name: 'Call' })).toBeChecked();
    await expect(save).toBeDisabled();

    // An empty slot duration card shows its required messages.
    await page.getByRole('button', { name: 'Add Another Slot' }).click();
    await save.click();
    await expect(page.getByText('Role is required')).toBeVisible();
    await expect(page.getByText('Duration is required')).toBeVisible();
    await page.getByRole('button', { name: 'Delete Slot Duration 2' }).click();

    // Change a day's hours and the clinical message, then save.
    await page.getByRole('switch', { name: 'Saturday', exact: true }).check();
    const message = page.getByLabel(/^Message/).first();
    await message.fill('We are closed. For urgent help call 111, or 999 in an emergency.');
    await expect(page.getByText('Character limit: 64/300')).toBeVisible();
    await save.click();
    await expect(page.getByText('Global practice configuration updated successfully').first()).toBeVisible();
    await expect(save).toBeDisabled();

    await page.reload();
    await expect(page.getByRole('switch', { name: 'Saturday', exact: true })).toBeChecked();
    await expect(page.getByLabel(/^Message/).first()).toHaveValue(
      'We are closed. For urgent help call 111, or 999 in an emergency.',
    );
  });
});

test.describe('global appointment configuration', () => {
  test('live helpers, limits and additional slots', async ({ page }) => {
    await logIn(page);
    await page.goto(`${SETTINGS}?section=appointment-configuration`);
    const offered = page.getByLabel(/Allow patient to select offered slots/);
    await expect(offered).toHaveValue('72');
    await expect(page.getByText('Patients can book their appointments within 72 hours.')).toBeVisible();
    await offered.fill('900');
    await expect(page.getByText('Patients can book their appointments within 900 hours.')).toBeVisible();
    await page.getByLabel(/Max Advance Booking Period/).fill('400');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Enter a number of hours from 1 to 720')).toBeVisible();
    await expect(page.getByText('Enter a number of days from 1 to 365')).toBeVisible();
    await offered.fill('48');
    await page.getByLabel(/Max Advance Booking Period/).fill('30');

    await page.getByLabel('Send SMS Reminder').click();
    await page.getByRole('option', { name: 'Before 12 Hours' }).click();
    await expect(page.getByText('Send SMS reminder to patient for their appointments before 12 hours.')).toBeVisible();
    await page.getByRole('switch', { name: 'Same Day Booking' }).check();
    await expect(page.getByText('Allowed', { exact: true })).toBeVisible();

    // The staff select waits for a role.
    await page.getByRole('button', { name: 'Add Another Slot' }).click();
    // After the failed save above, the new card shows "Staff is required"; the field stays disabled.
    const staff = page.getByRole('combobox', { name: /^Staff/ });
    await expect(staff.last()).toHaveAttribute('aria-disabled', 'true');
    await page.getByRole('button', { name: 'Delete Additional Slot Duration 3' }).click();
    await expect(staff).toHaveCount(2);

    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Global appointment configuration updated successfully').first()).toBeVisible();
    await page.reload();
    await expect(page.getByLabel(/Allow patient to select offered slots/)).toHaveValue('48');
  });
});

test.describe('competency', () => {
  test('add with validation, edit and delete', async ({ page }) => {
    await logIn(page);
    await page.goto(`${SETTINGS}?section=competency`);
    const table = page.getByRole('table', { name: 'Competencies' });
    await expect(table.getByRole('row')).toHaveCount(4);
    await expect(table.getByRole('row', { name: /ENT/ })).toContainText('Throat, Nose, Ear');

    await page.getByRole('button', { name: 'Add Competency' }).click();
    const drawer = page.getByRole('dialog', { name: 'Add Competency' });
    await drawer.getByRole('button', { name: 'Save Competency' }).click();
    await expect(drawer.getByText('Competency type name is required')).toBeVisible();
    await expect(drawer.getByText('Select at least one role')).toBeVisible();
    await expect(drawer.getByText('Slot duration is required')).toBeVisible();
    await expect(drawer.getByText('Add at least one sub-type')).toBeVisible();

    await drawer.getByLabel('Competency Type Name').fill('Respiratory');
    await drawer.getByLabel('Roles').click();
    await page.getByRole('option', { name: 'Nurse' }).click();
    await drawer.getByLabel('Slot Duration').fill('20');
    await drawer.getByRole('textbox', { name: 'Sub-type 1' }).fill('Asthma');
    await drawer.getByRole('button', { name: 'Add Sub-type' }).click();
    await drawer.getByRole('textbox', { name: 'Sub-type 2' }).fill('COPD');
    await drawer.getByRole('button', { name: 'Save Competency' }).click();
    await expect(page.getByText('Competency created successfully').first()).toBeVisible();
    await expect(table.getByRole('row', { name: /Respiratory/ })).toContainText('Asthma, COPD');
    await expect(table.getByRole('row', { name: /Respiratory/ })).toContainText('20 mins');

    await page.getByRole('button', { name: 'Edit Respiratory' }).click();
    const edit = page.getByRole('dialog', { name: 'Edit Competency' });
    await expect(edit.getByRole('textbox', { name: 'Sub-type 2' })).toHaveValue('COPD');
    await edit.getByRole('button', { name: 'Remove sub-type 2' }).click();
    await edit.getByRole('button', { name: 'Save Competency' }).click();
    await expect(page.getByText('Competency updated successfully').first()).toBeVisible();
    await expect(table.getByRole('row', { name: /Respiratory/ })).not.toContainText('COPD');

    await page.getByRole('button', { name: 'Delete Respiratory' }).click();
    const confirm = page.getByRole('dialog', { name: 'Delete Competency' });
    await expect(confirm).toContainText('Are you sure you want to delete "Respiratory"?');
    await confirm.getByRole('button', { name: 'Delete Competency' }).click();
    await expect(page.getByText('Competency deleted successfully').first()).toBeVisible();
    await expect(table.getByRole('row', { name: /Respiratory/ })).toHaveCount(0);
  });
});

test.describe('pathway configuration', () => {
  test('groups, filters, switches save and a failed save flips back', async ({ page }) => {
    await logIn(page);
    await page.goto(`${SETTINGS}?section=pathway-configuration`);
    const table = page.getByRole('table', { name: 'Pathways' });
    await expect(table.getByRole('button', { name: /Administrative and Non-Clinical/ })).toContainText('2 of 5 active');
    await expect(table.getByRole('button', { name: /Cardiovascular and Metabolic/ })).toContainText('0 of 7 active');
    await expect(table.getByRole('row', { name: /^Death Process/ })).toContainText('—');

    const mobile = table.getByRole('switch', { name: 'Mobile App for Medication Query Assessment' });
    await expect(mobile).not.toBeChecked();
    await mobile.check();
    await expect(page.getByText('Mobile App turned on for Medication Query Assessment').first()).toBeVisible();
    await page.reload();
    await expect(page.getByRole('switch', { name: 'Mobile App for Medication Query Assessment' })).toBeChecked();

    // Make the next channel save fail (mock-only switch), and check the switch flips back.
    await page.evaluate(() => window.localStorage.setItem('aqlios-mock-fail', 'PATCH /pathways/'));
    const web = page.getByRole('switch', { name: 'Web App for Home Visit Request' });
    await expect(web).toBeChecked();
    // A plain click: the failed save can flip the switch back before uncheck() sees it change.
    await web.click();
    await expect(page.getByText('Failed to update Web App for Home Visit Request').first()).toBeVisible();
    await expect(web).toBeChecked();
    await page.evaluate(() => window.localStorage.removeItem('aqlios-mock-fail'));

    await page.getByLabel('Status').click();
    await page.getByRole('option', { name: 'Active', exact: true }).click();
    await expect(table.getByRole('row')).toHaveCount(1 + 6 + 7); // header + 6 groups + 7 active rows
    await page.getByLabel('Search').fill('zzzz');
    await expect(page.getByText('No pathways found. Try another search.')).toBeVisible();
  });
});
