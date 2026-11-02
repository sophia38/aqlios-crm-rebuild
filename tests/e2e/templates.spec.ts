import { expect, test, type Page } from '@playwright/test';

const TEMPLATES = '/verticals/public/templates/';

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

const card = (page: Page, name: string) => page.getByRole('article', { name, exact: true });

async function openMenu(page: Page, name: string) {
  await page.getByRole('button', { name: `Actions for ${name}` }).click();
}

test.describe('template library', () => {
  test('tabs, counts, groups, filters and placeholders', async ({ page }) => {
    await logIn(page);
    await page.goto(TEMPLATES);
    await expect(page.getByRole('heading', { name: 'Communication Templates (27)' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Standard Templates (16)' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Appointments (6)' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Prescription (2)' })).toBeVisible();
    // Placeholders show in blue on the cards.
    const placeholder = card(page, 'Appointment Confirmation').getByText('{{patient_name}}');
    await expect(placeholder).toHaveCSS('color', 'rgb(2, 136, 209)');

    await page.getByLabel('Search').fill('reminder');
    await expect(page.getByRole('article')).toHaveCount(3);
    await page.getByLabel('Search').fill('zzzz');
    await expect(page.getByText('No templates found. Try another search.')).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await page.getByLabel('Template Categories').click();
    await page.getByRole('option', { name: 'Blood Tests' }).click();
    await expect(page.getByRole('article')).toHaveCount(1);

    await page.getByRole('tab', { name: 'Staff Created Templates' }).click();
    await expect(page).toHaveURL(/\?tab=staff-created$/);
    await expect(page.getByRole('heading', { name: 'Staff Created Templates (11)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Template' })).toHaveCount(0);
    await expect(page.getByLabel('Created By')).toBeVisible();
    await expect(card(page, 'Running Late Today')).toContainText('Business: Ashford Medical Centre');
    await page.reload();
    await expect(page.getByRole('tab', { name: 'Staff Created Templates' })).toHaveAttribute('aria-selected', 'true');
  });

  test('create validates, previews with sample data and saves', async ({ page }) => {
    await logIn(page);
    await page.goto(TEMPLATES);
    await page.getByRole('button', { name: 'Add Template' }).click();
    const dialog = page.getByRole('dialog', { name: 'Create Template' });
    await expect(dialog.getByText('Start typing to generate a preview.')).toBeVisible();
    const create = dialog.getByRole('button', { name: 'Create Template' });
    await expect(create).toBeDisabled();

    await dialog.getByRole('button', { name: 'Save as Draft' }).click();
    await expect(dialog.getByText('Template name is required')).toBeVisible();
    await expect(dialog.getByText('Category is required')).toBeVisible();
    await expect(dialog.getByText('Template message is required')).toBeVisible();

    await dialog.getByLabel(/Template Name/).fill('Flu Clinic Invite');
    await dialog.getByLabel(/Category/).click();
    await page.getByRole('option', { name: 'Appointments' }).click();
    await dialog.getByRole('radio', { name: 'Email' }).check();
    await dialog.getByLabel(/Subject/).fill('Flu clinic at {{practice_name}}');
    const editor = dialog.getByRole('textbox', { name: 'Template Message' });
    await editor.click();
    await page.keyboard.type('Hi ');
    await dialog.getByRole('button', { name: 'Insert Placeholder' }).click();
    await page.getByRole('menuitem', { name: '{{patient_name}}' }).click();
    await page.keyboard.type(', book your flu jab today.');
    await expect(dialog.getByText('Character limit: 45/300')).toBeVisible();
    const preview = dialog.getByRole('region', { name: 'Message preview' });
    await expect(preview).toContainText('Hi Jordan Hale, book your flu jab today.');
    await expect(preview).toContainText('Flu clinic at Ashford Medical Centre');
    await expect(dialog.getByRole('button', { name: 'Ask AI' })).toBeDisabled();

    await dialog.getByLabel('Status').click();
    await page.getByRole('option', { name: 'Active', exact: true }).click();
    await expect(create).toBeEnabled();
    await create.click();
    await expect(page.getByText('Template created successfully').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Communication Templates (28)' })).toBeVisible();
    await expect(card(page, 'Flu Clinic Invite')).toContainText('Active');
  });

  test('message over 300 characters is rejected', async ({ page }) => {
    await logIn(page);
    await page.goto(TEMPLATES);
    await page.getByRole('button', { name: 'Add Template' }).click();
    const dialog = page.getByRole('dialog', { name: 'Create Template' });
    await dialog.getByRole('textbox', { name: 'Template Message' }).click();
    await page.keyboard.insertText('x'.repeat(301));
    await dialog.getByLabel(/Template Name/).click();
    await expect(dialog.getByText('Template message must be 300 characters or fewer')).toBeVisible();
    await expect(dialog.getByText('Character limit: 301/300')).toBeVisible();
  });

  test('view, edit, deactivate, activate and delete a standard template', async ({ page }) => {
    await logIn(page);
    await page.goto(TEMPLATES);

    await openMenu(page, 'Appointment Reminder');
    await page.getByRole('menuitem', { name: 'View Details' }).click();
    const view = page.getByRole('dialog', { name: 'Template Details' });
    await expect(view.getByLabel(/Template Name/)).toBeDisabled();
    await expect(view.getByRole('toolbar', { name: 'Formatting' })).toHaveCount(0);
    await view.getByRole('button', { name: 'Close' }).last().click();

    await openMenu(page, 'Appointment Reminder');
    await page.getByRole('menuitem', { name: 'Edit Template' }).click();
    const edit = page.getByRole('dialog', { name: 'Edit Template' });
    await edit.getByLabel(/Template Name/).fill('Appointment Reminder (24h)');
    await edit.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Template updated successfully').first()).toBeVisible();
    await expect(card(page, 'Appointment Reminder (24h)')).toBeVisible();

    await openMenu(page, 'Appointment Reminder (24h)');
    await page.getByRole('menuitem', { name: 'Mark as Inactive' }).click();
    const deactivate = page.getByRole('dialog', { name: 'Mark Template as Inactive' });
    await expect(deactivate).toContainText('You can reactivate this template anytime from the Template Library.');
    await expect(deactivate.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await deactivate.getByRole('button', { name: 'Mark as Inactive' }).click();
    await expect(page.getByText('Template marked as inactive').first()).toBeVisible();
    await expect(card(page, 'Appointment Reminder (24h)')).toContainText('Inactive');

    await openMenu(page, 'Appointment Reminder (24h)');
    await page.getByRole('menuitem', { name: 'Activate Template' }).click();
    await page.getByRole('dialog', { name: 'Activate Template' }).getByRole('button', { name: 'Activate' }).click();
    await expect(page.getByText('Template activated successfully').first()).toBeVisible();

    await openMenu(page, 'Appointment Reminder (24h)');
    await page.getByRole('menuitem', { name: 'Delete Template' }).click();
    const remove = page.getByRole('dialog', { name: 'Delete Template' });
    await expect(remove).toContainText('"Appointment Reminder (24h)" will be permanently deleted.');
    await remove.getByRole('button', { name: 'Delete Permanently' }).click();
    await expect(page.getByText('Template deleted successfully').first()).toBeVisible();
    await expect(card(page, 'Appointment Reminder (24h)')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Standard Templates (15)' })).toBeVisible();
  });

  test('move a staff-created template to standard', async ({ page }) => {
    await logIn(page);
    await page.goto(`${TEMPLATES}?tab=staff-created`);
    await openMenu(page, 'Fasting Before Your Test');
    await page.getByRole('menuitem', { name: 'Move to Standard' }).click();
    const dialog = page.getByRole('dialog', { name: 'Move to Standard Templates' });
    await expect(dialog.getByRole('region', { name: 'Original template' })).toContainText('Rhys Owen');
    await expect(dialog.getByText(/Character limit: \d+\/1000/)).toBeVisible();
    await dialog.getByLabel(/Template Name/).fill('');
    await expect(dialog.getByRole('button', { name: 'Move to Standard' })).toBeDisabled();
    await dialog.getByLabel(/Template Name/).fill('Fasting Blood Test Advice');
    await dialog.getByRole('button', { name: 'Move to Standard' }).click();
    await expect(page.getByText('Template moved to Standard Templates successfully.').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Staff Created Templates (10)' })).toBeVisible();

    await page.getByRole('tab', { name: 'Standard Templates' }).click();
    await expect(page.getByRole('heading', { name: 'Standard Templates (17)' })).toBeVisible();
    await expect(card(page, 'Fasting Blood Test Advice')).toBeVisible();
  });

  test('practice users cannot open the library', async ({ page }) => {
    await logIn(page, 'practice-user');
    await page.goto(TEMPLATES);
    await expect(page.getByText("You don't have access to this page")).toBeVisible();
  });
});
