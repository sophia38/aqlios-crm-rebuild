import { expect, test, type Page } from '@playwright/test';

const PRACTICE = '/verticals/public/practices/ashford-medical-centre';
const SETTINGS = `${PRACTICE}/settings`;

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

const toast = (page: Page, text: string) => page.getByText(text, { exact: true }).first();

test.describe('practice settings', () => {
  test('appointment configuration has its own practice values and saves', async ({ page }) => {
    await logIn(page);
    await page.goto(`${SETTINGS}/`);
    await expect(page).toHaveURL(/\/settings\/appointment-configuration\/$/);
    await expect(page.getByText('Manage appointment settings here.')).toBeVisible();
    const nav = page.getByRole('navigation', { name: 'Settings sections' });
    await expect(nav.getByRole('link', { name: 'Appointment Configuration' })).toHaveAttribute('aria-current', 'page');

    // Captured practice values, not the vertical ones (72 hours, 48-hour SMS reminder).
    const offered = page.getByLabel(/Allow patient to select offered slots/);
    await expect(offered).toHaveValue('2');
    await expect(page.getByText('No SMS reminder will be sent to patients.')).toBeVisible();
    await offered.fill('6');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(toast(page, 'Appointment configuration updated successfully')).toBeVisible();
    await page.reload();
    await expect(page.getByLabel(/Allow patient to select offered slots/)).toHaveValue('6');

    await page.goto('/verticals/public/settings/?section=appointment-configuration');
    await expect(page.getByLabel(/Allow patient to select offered slots/)).toHaveValue('72');
  });

  test('vertical competencies are locked for practice users; their own rows are not', async ({ page }) => {
    await logIn(page, 'practice-user');
    await page.goto(`${SETTINGS}/competency/`);
    const table = page.getByRole('table', { name: 'Competencies' });
    await expect(table.getByRole('row', { name: /Respiratory/ })).toContainText('Asthma, COPD, Inhaler technique');

    const editEnt = page.getByRole('button', { name: 'Edit ENT' });
    await expect(editEnt).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Delete ENT' })).toBeDisabled();
    await editEnt.locator('..').hover();
    await expect(page.getByRole('tooltip', { name: 'Can be edited via vertical settings' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit Respiratory' })).toBeEnabled();

    await page.getByRole('button', { name: 'Add Competency' }).click();
    const drawer = page.getByRole('dialog', { name: 'Add Competency' });
    await drawer.getByLabel('Competency Type Name').fill('Travel Health');
    await drawer.getByLabel('Roles').click();
    await page.getByRole('option', { name: 'Nurse' }).click();
    await drawer.getByLabel('Slot Duration').fill('15');
    await drawer.getByRole('textbox', { name: 'Sub-type 1' }).fill('Travel vaccines');
    await drawer.getByRole('button', { name: 'Save Competency' }).click();
    await expect(toast(page, 'Competency created successfully')).toBeVisible();

    await page.getByRole('button', { name: 'Delete Travel Health' }).click();
    await page
      .getByRole('dialog', { name: 'Delete Competency' })
      .getByRole('button', { name: 'Delete Competency' })
      .click();
    await expect(toast(page, 'Competency deleted successfully')).toBeVisible();
    await expect(table.getByRole('row', { name: /Travel Health/ })).toHaveCount(0);
  });

  test('a super-admin can still edit vertical rows from the practice', async ({ page }) => {
    await logIn(page);
    await page.goto(`${SETTINGS}/competency/`);
    await expect(page.getByRole('button', { name: 'Edit ENT' })).toBeEnabled();
    // The practice's own rows aren't in vertical Settings.
    await page.goto('/verticals/public/settings/?section=competency');
    const table = page.getByRole('table', { name: 'Competencies' });
    await expect(table.getByRole('row', { name: /ENT/ })).toBeVisible();
    await expect(table.getByRole('row', { name: /Respiratory/ })).toHaveCount(0);
  });

  test('changing a pathway channel makes it Custom for this practice only', async ({ page }) => {
    await logIn(page);
    await page.goto(`${SETTINGS}/pathway-configuration/`);
    const table = page.getByRole('table', { name: 'Pathways' });
    const row = table.getByRole('row', { name: /^Medication Query Assessment/ });
    await expect(row).toContainText('Same as Hub');
    await table.getByRole('switch', { name: 'Mobile App for Medication Query Assessment' }).check();
    await expect(toast(page, 'Mobile App turned on for Medication Query Assessment')).toBeVisible();
    await expect(row).toContainText('Custom');
    await page.reload();
    await expect(table.getByRole('row', { name: /^Medication Query Assessment/ })).toContainText('Custom');

    await page.goto('/verticals/public/settings/?section=pathway-configuration');
    await expect(page.getByRole('switch', { name: 'Mobile App for Medication Query Assessment' })).not.toBeChecked();
  });

  test('templates and the practice profile placeholder', async ({ page }) => {
    await logIn(page, 'practice-user');
    await page.goto(`${SETTINGS}/templates/`);
    await expect(page.getByText('These templates are shared by every practice.', { exact: false })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Communication Templates \(\d+\)$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Template' })).toBeVisible();

    await page
      .getByRole('navigation', { name: 'Settings sections' })
      .getByRole('link', { name: 'Practice Profile' })
      .click();
    await expect(page).toHaveURL(/\/settings\/practice-profile\/?$/);
    await expect(page.getByText(/building the public practice profile management system/)).toBeVisible();
  });
});
