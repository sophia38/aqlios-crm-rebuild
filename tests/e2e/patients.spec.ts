import { expect, test, type Page } from '@playwright/test';

const PRACTICE = '/verticals/public/practices/ashford-medical-centre';
const PATIENTS = `${PRACTICE}/patient-management/`;
// A practice outside the 3 demo practices: no patients.
const EMPTY_PATIENTS = '/verticals/public/practices/chapel-street-medical-centre/patient-management/';

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

/** Opens the first patient in the list and returns their name. */
async function openFirstPatient(page: Page) {
  await page.goto(PATIENTS);
  const view = page.getByRole('link', { name: /^View / }).first();
  const name = ((await view.getAttribute('aria-label')) ?? '').replace(/^View /, '');
  await view.click();
  await expect(page.getByRole('heading', { name: 'Patient Details' })).toBeVisible();
  return name;
}

test.describe('patient management list', () => {
  test('shows patients, breadcrumb, filters by type, searches and clears', async ({ page }) => {
    await logIn(page);
    await page.goto(PATIENTS);
    await expect(page.getByRole('heading', { name: 'Patient Management' })).toBeVisible();
    const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(crumbs.getByText('Patient Management')).toHaveAttribute('aria-current', 'page');

    const table = page.getByRole('table', { name: 'Patients' });
    await expect(table.getByRole('row')).toHaveCount(11);
    await expect(page.getByText('1–10 of 40')).toBeVisible();
    await expect(table.getByRole('row').nth(1)).toContainText('NHS: 999');

    await page.getByLabel('Registration Type').click();
    await page.getByRole('option', { name: 'Private', exact: true }).click();
    const rows = table.getByRole('row');
    await expect(rows.nth(1)).toContainText('Private');
    for (const row of (await rows.all()).slice(1)) await expect(row).toContainText('Private');

    await page.getByRole('textbox', { name: 'Search' }).fill('zzzz');
    await expect(page.getByText('No patients found. Try another search.')).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page.getByText('1–10 of 40')).toBeVisible();
  });

  test('shows the carer tooltip and the status tooltip', async ({ page }) => {
    await logIn(page);
    await page.goto(PATIENTS);
    const carer = page.getByRole('button', { name: /^Carer information for / }).first();
    await carer.focus();
    await expect(page.getByRole('tooltip')).toContainText('Carer Information');
    await expect(page.getByRole('tooltip')).toContainText('Relationship');
    await expect(page.getByRole('img', { name: 'Patient Registered and Carer Correct' }).first()).toBeVisible();
  });

  test('a practice without patients shows the live empty state', async ({ page }) => {
    await logIn(page);
    await page.goto(EMPTY_PATIENTS);
    await expect(page.getByText('No registered patients yet.')).toBeVisible();
  });

  test('archive moves the patient out of the list', async ({ page }) => {
    await logIn(page);
    await page.goto(PATIENTS);
    await expect(page.getByText('1–10 of 40')).toBeVisible();
    const archive = page.getByRole('button', { name: /^Archive / }).first();
    const name = ((await archive.getAttribute('aria-label')) ?? '').replace(/^Archive /, '');
    await archive.click();
    const dialog = page.getByRole('dialog', { name: 'Archive Patient' });
    await expect(dialog).toContainText(`Archive ${name}?`);
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await dialog.getByRole('button', { name: 'Archive Patient' }).click();
    await expect(page.getByText('Patient archived.')).toBeVisible();
    await expect(page.getByText('1–10 of 39')).toBeVisible();
    await expect(page.getByRole('table', { name: 'Patients' })).not.toContainText(name);
  });

  test('a failed load shows the error', async ({ page }) => {
    await logIn(page);
    await page.goto(`${PRACTICE}/dashboard/`);
    await page.evaluate(() => window.localStorage.setItem('aqlios-mock-fail', 'GET /patients/'));
    await page.goto(PATIENTS);
    await expect(page.getByText('Failed to load patients')).toBeVisible();
    await expect(page.getByText('Could not load patients.')).toBeVisible();
  });
});

test.describe('patient details', () => {
  test('saves the registration status', async ({ page }) => {
    await logIn(page);
    await openFirstPatient(page);
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).getByText('Patient Details')).toBeVisible();
    const save = page.getByRole('button', { name: 'Save Status' });
    await expect(save).toBeDisabled();
    await page.getByLabel('Registration Status').click();
    await page.getByRole('option', { name: 'Not Known' }).click();
    await page.locator('input[name="nhs_number"]').fill('123');
    await page.locator('input[name="nhs_number"]').blur();
    await expect(page.getByText('Enter a valid NHS number')).toBeVisible();
    await expect(save).toBeDisabled();
    await page.locator('input[name="nhs_number"]').fill('999 111 2222');
    await save.click();
    await expect(page.getByText('Registration status saved')).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Registration Status')).toHaveText('Not Known');
    await expect(page.locator('input[name="nhs_number"]')).toHaveValue('999 111 2222');
  });

  test('adds and deletes a note', async ({ page }) => {
    await logIn(page);
    await openFirstPatient(page);
    await page.getByRole('button', { name: 'Add Note' }).click();
    const saveNote = page.getByRole('button', { name: 'Save Note' });
    await expect(saveNote).toBeDisabled();
    await page.getByRole('textbox', { name: 'Note' }).fill('Called to confirm the new address.');
    await expect(page.getByText('34/1000 characters')).toBeVisible();
    await saveNote.click();
    await expect(page.getByText('Note added')).toBeVisible();
    const note = page.getByRole('article').filter({ hasText: 'Called to confirm the new address.' });
    await expect(note).toContainText('Added By: Aqlios Admin');

    await note.getByRole('button', { name: 'Delete note' }).click();
    const dialog = page.getByRole('dialog', { name: 'Delete note?' });
    await dialog.getByRole('button', { name: 'Delete Note' }).click();
    await expect(page.getByText('Note deleted')).toBeVisible();
    await expect(note).toHaveCount(0);
  });

  test('edits the patient details with validation', async ({ page }) => {
    await logIn(page);
    await openFirstPatient(page);
    await page.getByRole('button', { name: 'Edit Details' }).click();
    const form = page.getByRole('form', { name: 'Edit patient details' });
    await form.getByLabel('First Name').fill('');
    await form.getByLabel('First Name').blur();
    await expect(form.getByText('First name is required')).toBeVisible();
    await form.getByLabel('Email Address').fill('not-an-email');
    await form.getByLabel('Email Address').blur();
    await expect(form.getByText('Enter a valid email')).toBeVisible();

    await form.getByLabel('First Name').fill('Annabel');
    await form.getByLabel('Email Address').fill('annabel@example.com');
    await form.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Patient details updated')).toBeVisible();
    await expect(form).toHaveCount(0);
    await expect(page.getByLabel('First Name').first()).toHaveValue('Annabel');
    await expect(page.getByRole('heading', { name: 'Patient Details' })).toBeVisible();
    await expect(page.getByText(/^Annabel /).first()).toBeVisible();
  });

  test('saves call feedback; message and email stay disabled while empty', async ({ page }) => {
    await logIn(page);
    await openFirstPatient(page);
    const tabs = page.getByRole('tablist', { name: 'Contact method' });
    const saveFeedback = page.getByRole('button', { name: 'Save Feedback' });
    await expect(saveFeedback).toBeDisabled();
    await page
      .getByRole('textbox', { name: 'After Call Feedback' })
      .fill('Left a voicemail asking the patient to call back.');
    await saveFeedback.click();
    await expect(page.getByText('Feedback saved')).toBeVisible();

    await tabs.getByRole('tab', { name: 'Message' }).click();
    await expect(page.getByPlaceholder('Write an SMS to the patient.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Message' })).toBeDisabled();
    await page.getByRole('textbox', { name: 'Message' }).fill('Your test results are ready.');
    await page.getByRole('button', { name: 'Send Message' }).click();
    await expect(page.getByText('Message sent')).toBeVisible();

    await tabs.getByRole('tab', { name: 'Email' }).click();
    await expect(page.getByPlaceholder('Write an email to the patient.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Email' })).toBeDisabled();
    await expect(page.getByText('0/2000 characters')).toBeVisible();
  });

  test('deregisters with a required reason', async ({ page }) => {
    await logIn(page);
    const name = await openFirstPatient(page);
    await page.getByRole('button', { name: 'Deregister Patient' }).click();
    const dialog = page.getByRole('dialog', { name: 'Deregister Patient' });
    await expect(dialog).toContainText(`Deregister ${name}?`);
    const confirm = dialog.getByRole('button', { name: 'Deregister Patient' });
    await expect(confirm).toBeDisabled();
    await dialog.getByLabel('Reason').fill('Registered with another practice');
    await confirm.click();
    await expect(page.getByText('Patient deregistered')).toBeVisible();
    await expect(page.getByText('Reason: Registered with another practice')).toBeVisible();
    await expect(page.getByLabel('Registration Status')).toHaveText('Patient Not Registered');
    await expect(page.getByRole('button', { name: 'Deregister Patient' })).toBeDisabled();
  });

  test('opens a health record and shows the consultations tab', async ({ page }) => {
    await logIn(page);
    await openFirstPatient(page);
    await page
      .getByRole('button', { name: /^View .*\.pdf$/ })
      .first()
      .click();
    const viewer = page.getByRole('dialog');
    await expect(viewer).toContainText("Preview isn't available in the demo.");
    await viewer.getByRole('button', { name: 'Close' }).last().click();
    await expect(viewer).toHaveCount(0);

    await page.getByRole('tablist', { name: 'Medical requests' }).getByRole('tab', { name: 'Consultations' }).click();
    // Filled in by Tickets (phase 5, module 2): the patient's tickets, each linking to its details.
    const consultations = page.getByRole('tabpanel', { name: 'Consultations' });
    await expect(
      consultations.getByRole('link').or(consultations.getByText('No consultations found.')).first(),
    ).toBeVisible();
  });

  test('an unknown patient id shows "Patient not found"', async ({ page }) => {
    await logIn(page);
    await page.goto(`${PATIENTS}00000000-0000-4000-a000-000000000000/`);
    await expect(page.getByText('Patient not found')).toBeVisible();
  });

  test('practice users can open their practice patients', async ({ page }) => {
    await logIn(page, 'practice-user');
    await openFirstPatient(page);
    await expect(page.getByRole('heading', { name: 'Manage Registration' })).toBeVisible();
  });
});
