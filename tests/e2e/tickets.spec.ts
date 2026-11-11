import { expect, test, type Page } from '@playwright/test';

const PRACTICE = '/verticals/public/practices/ashford-medical-centre';
const TICKETS = `${PRACTICE}/consultations-review/`;

async function logIn(page: Page) {
  await page.goto('/auth/login/');
  await page.getByLabel('Email').fill('reviewer@aqlios.demo');
  await page.getByLabel('Password', { exact: true }).fill('demo');
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(/\/verticals\//);
}

const openTable = (page: Page) => page.getByRole('table', { name: 'Open cases' });

/** Opens the first unassigned ticket on the first page (its row still has the assign actions). */
async function openUnassignedTicket(page: Page) {
  await page.goto(TICKETS);
  const row = openTable(page)
    .getByRole('row')
    .filter({ has: page.getByRole('button', { name: /to alternative staff$/ }) })
    .first();
  await row.getByRole('link', { name: /^View consultation/ }).click();
  await expect(page.getByRole('heading', { name: 'Consultation Details' })).toBeVisible();
}

async function assignTask(page: Page) {
  await page.getByLabel('Select Staff').click();
  await page.getByRole('option').first().click();
  await page.getByRole('button', { name: 'Assign Task' }).click();
  await expect(page.getByText('Staff assigned')).toBeVisible();
}

test.describe('tickets list', () => {
  test('shows open and closed cases with their filters', async ({ page }) => {
    await logIn(page);
    await page.goto(TICKETS);
    await expect(page.getByRole('heading', { name: 'Tickets' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).getByText('Tickets')).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(openTable(page).getByRole('row')).toHaveCount(11);
    await expect(page.getByText('1–10 of 60')).toBeVisible();

    await page.getByLabel('Status').click();
    await page.getByRole('option', { name: 'New', exact: true }).click();
    const rows = openTable(page).getByRole('row');
    await expect(rows.nth(1)).toContainText('New');
    for (const row of (await rows.all()).slice(1)) await expect(row).toContainText('New');

    await page.getByRole('textbox', { name: 'Search' }).fill('zzzz');
    await expect(page.getByText('No tickets found. Try another search.')).toBeVisible();

    await page.getByRole('tab', { name: 'Closed Cases' }).click();
    await expect(page).toHaveURL(/cases=closed/);
    const closed = page.getByRole('table', { name: 'Closed cases' });
    await expect(closed.getByRole('row')).toHaveCount(9);
    await expect(page.getByText('1–8 of 8')).toBeVisible();
    await expect(page.getByLabel('Status')).toHaveCount(0);
    await expect(closed.getByRole('columnheader', { name: 'Date Closed' })).toBeVisible();
  });

  test('approves the recommended staff member', async ({ page }) => {
    await logIn(page);
    await page.goto(TICKETS);
    const approve = openTable(page).getByRole('button', { name: /^Approve recommended staff for / });
    await expect(approve.first()).toBeVisible();
    const enabled = approve.and(page.locator(':enabled'));
    const before = await enabled.count();
    expect(before).toBeGreaterThan(0);
    await enabled.first().click();
    const dialog = page.getByRole('dialog', { name: 'Approve Recommended Staff' });
    await expect(dialog).toContainText('to this consultation?');
    await dialog.getByRole('button', { name: 'Assign Staff' }).click();
    await expect(page.getByText('Staff assigned')).toBeVisible();
    await expect(enabled).toHaveCount(before - 1);
  });

  test('assigns a ticket to alternative staff', async ({ page }) => {
    await logIn(page);
    await page.goto(TICKETS);
    await openTable(page)
      .getByRole('button', { name: /to alternative staff$/ })
      .first()
      .click();
    const dialog = page.getByRole('dialog', { name: 'Assign to Alternative Staff' });
    const submit = dialog.getByRole('button', { name: 'Assign Staff' });
    await expect(submit).toBeDisabled();
    await dialog.getByLabel('Staff').click();
    await page.getByRole('option').first().click();
    await dialog.getByRole('textbox', { name: 'Reason' }).fill('Covering for a colleague on leave.');
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(page.getByText('Staff assigned')).toBeVisible();
    await expect(dialog).toBeHidden();
  });
});

test.describe('consultation details', () => {
  test('is read-only until a staff member is assigned', async ({ page }) => {
    await logIn(page);
    await openUnassignedTicket(page);
    await expect(page.getByText('Current Viewer: Aqlios Admin')).toBeVisible();
    await expect(page.getByText('This consultation is unassigned and read-only.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Update Status' })).toBeDisabled();
    await expect(page.getByRole('textbox', { name: 'Message' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Assign Task' })).toBeDisabled();

    await assignTask(page);
    await expect(page.getByText('This consultation is unassigned and read-only.')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Update Status' })).toBeEnabled();
    await expect(page.getByRole('textbox', { name: 'Message' })).toBeEnabled();
  });

  test('saves notes, adds a SNOMED code and sends a templated message', async ({ page }) => {
    await logIn(page);
    await openUnassignedTicket(page);
    await assignTask(page);

    await page.getByRole('textbox', { name: 'Clinical Notes' }).fill('Called the patient; advice given.');
    await page.getByLabel('Share this note with the patient').check();
    await page.getByRole('button', { name: 'Save Notes to Aqlios' }).click();
    await expect(page.getByText('Notes saved')).toBeVisible();
    await expect(page.getByText('Called the patient; advice given.')).toBeVisible();
    await expect(page.getByText('Shared with patient')).toBeVisible();

    await page.getByRole('tab', { name: 'SNOMED codes' }).click();
    await page.getByRole('combobox', { name: 'Search codes' }).fill('asth');
    await page.getByRole('option', { name: '195967001 · Asthma' }).click();
    await page.getByRole('button', { name: 'Add and Save to Aqlios' }).click();
    await expect(page.getByText('SNOMED code added')).toBeVisible();
    await expect(page.getByRole('table', { name: 'Saved SNOMED codes' })).toContainText('195967001 · Asthma');

    await page.getByRole('button', { name: 'Browse Templates' }).first().click();
    const picker = page.getByRole('dialog', { name: /^Message Templates/ });
    await expect(picker.getByRole('tab', { name: /^Standard Templates/ })).toBeVisible();
    await picker
      .getByRole('button', { name: /^Use template / })
      .first()
      .click();
    await expect(picker).toBeHidden();
    const message = page.getByRole('textbox', { name: 'Message' });
    await expect(message).not.toHaveValue('');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByText('Message sent')).toBeVisible();
    await expect(message).toHaveValue('');
    await expect(page.getByRole('log', { name: 'Messages with the patient' })).toContainText('Sent via Aqlios App');
  });

  test('closes a case with a reason, then reopens it', async ({ page }) => {
    await logIn(page);
    await openUnassignedTicket(page);
    await assignTask(page);

    await page.getByRole('button', { name: 'Update Status' }).click();
    const dialog = page.getByRole('dialog', { name: 'Update Status' });
    await dialog.getByLabel('Status').click();
    await page.getByRole('option', { name: 'Closed', exact: true }).click();
    const submit = dialog.getByRole('button', { name: 'Close Case' });
    await expect(submit).toBeDisabled();
    await dialog.getByLabel('Reason for Closure').click();
    await page.getByRole('option', { name: 'Other' }).click();
    await expect(submit).toBeDisabled();
    await dialog.getByRole('textbox', { name: 'Details' }).fill('Seen at the walk-in centre.');
    await submit.click();
    await expect(page.getByText('Case closed')).toBeVisible();
    await expect(page.getByText(/This case is closed\. Please reopen it to make changes\./)).toContainText(
      'Reason: Seen at the walk-in centre.',
    );
    await expect(page.getByRole('button', { name: 'Update Status' })).toBeDisabled();
    await expect(page.getByRole('textbox', { name: 'Clinical Notes' })).toBeDisabled();

    await page.goto(`${TICKETS}?cases=closed`);
    await expect(page.getByText('1–9 of 9')).toBeVisible();
    // Sorted by Date Closed, newest first.
    await expect(page.getByRole('table', { name: 'Closed cases' }).getByRole('row').nth(1)).toContainText(
      'Seen at the walk-in centre.',
    );
    await page
      .getByRole('table', { name: 'Closed cases' })
      .getByRole('link', { name: /^View consultation/ })
      .first()
      .click();
    await page.getByRole('button', { name: 'Reopen Case' }).click();
    await page.getByRole('dialog', { name: 'Reopen Case' }).getByRole('button', { name: 'Reopen Case' }).click();
    await expect(page.getByText('Case reopened')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Update Status' })).toBeEnabled();
  });

  test('shows the logs drawer and previous consultations', async ({ page }) => {
    await logIn(page);
    await openUnassignedTicket(page);
    await assignTask(page);
    await page.getByRole('button', { name: 'View Logs' }).click();
    const drawer = page.getByRole('dialog', { name: 'Consultation Logs' });
    await expect(drawer).toContainText('Consultation Started');
    await expect(drawer).toContainText('Staff Assigned');
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();

    await page.getByRole('link', { name: 'Previous Consultations' }).click();
    await expect(page.getByRole('heading', { name: 'Previous Consultations' })).toBeVisible();
    await expect(page.getByRole('table', { name: 'Previous consultations' })).toBeVisible();
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('heading', { name: 'Consultation Details' })).toBeVisible();
  });

  test('an unknown consultation id shows "Consultation not found"', async ({ page }) => {
    await logIn(page);
    await page.goto(`${TICKETS}not-a-ticket/`);
    await expect(page.getByText('Consultation not found')).toBeVisible();
  });

  test("a patient's consultations link to their tickets", async ({ page }) => {
    await logIn(page);
    await openUnassignedTicket(page);
    const name = (await page.getByRole('heading', { level: 2 }).first().textContent()) ?? '';
    await page.goto(`${PRACTICE}/patient-management/`);
    await page.getByRole('textbox', { name: 'Search' }).fill(name.split(' ')[0]);
    await page
      .getByRole('link', { name: new RegExp(`^View ${name}`) })
      .first()
      .click();
    // The Overview lists the recent ones.
    await page.getByRole('list', { name: 'Consultations' }).getByRole('link').first().click();
    await expect(page.getByRole('heading', { name: 'Consultation Details' })).toBeVisible();
  });
});
