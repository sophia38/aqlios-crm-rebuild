import { expect, test, type Page } from '@playwright/test';

const PRACTICE = '/verticals/public/practices/ashford-medical-centre';
const APPOINTMENT = `${PRACTICE}/appointment/`;

async function logIn(page: Page) {
  await page.goto('/auth/login/');
  await page.getByLabel('Email').fill('reviewer@aqlios.demo');
  await page.getByLabel('Password', { exact: true }).fill('demo');
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(/\/verticals\//);
}

/**
 * Moves the shared date to a weekday `weeks` weeks from today (Wednesday ahead, Tuesday behind), so the
 * tests don't depend on the day they run: appointments are worked out per day and none fall on Sundays.
 */
async function goToWeekday(page: Page, weeks: 1 | -1) {
  await page.getByRole('tab', { name: 'Day', exact: true }).click();
  const today = new Date();
  const weekday = today.getDay();
  const target = weeks === 1 ? 3 : 2;
  const steps = weeks === 1 ? 7 + ((target - weekday + 7) % 7) : 7 + ((weekday - target + 7) % 7);
  const button = page.getByRole('button', { name: weeks === 1 ? 'Next day' : 'Previous day' });
  for (let step = 0; step < steps; step += 1) await button.click();
}

const table = (page: Page) => page.getByRole('table', { name: 'Appointments' });
const appointmentDialog = (page: Page) => page.getByRole('dialog').filter({ hasText: 'Appointment Information' });

async function showTable(page: Page, status: string) {
  await page.getByRole('tab', { name: 'Table View' }).click();
  await expect(page).toHaveURL(/view=table/);
  await page.getByLabel('Status').click();
  await page.getByRole('option', { name: status, exact: true }).click();
  await expect(table(page).getByRole('row').nth(1)).toContainText(status);
}

test.describe('appointment', () => {
  test('switches views, locks Severity until a type is chosen, and shows real durations', async ({ page }) => {
    await logIn(page);
    await page.goto(APPOINTMENT);
    await expect(page.getByRole('heading', { name: 'Appointment', exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Appointment calendar' })).toBeVisible();

    const severity = page.getByRole('combobox', { name: 'Severity' });
    await expect(severity).toHaveAttribute('aria-disabled', 'true');
    await expect(severity).toContainText('Select type first');
    await page.getByLabel('Appointment Type').click();
    await page.getByRole('option', { name: 'Telephone or Audio' }).click();
    await expect(severity).not.toHaveAttribute('aria-disabled', 'true');
    await page.getByRole('button', { name: 'Clear filters' }).click();

    await goToWeekday(page, 1);
    await expect(page.getByRole('button', { name: /^View appointment for / }).first()).toBeVisible();

    await page.getByRole('tab', { name: 'Table View' }).click();
    await expect(page).toHaveURL(/view=table/);
    await expect(page.getByText('Upcoming Appointments')).toBeVisible();
    await expect(page.getByText('Cancelled Appointments')).toBeVisible();
    const rows = (await table(page).getByRole('row').all()).slice(1);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const minutes = Number(((await row.getByRole('cell').nth(5).textContent()) ?? '').replace(' min', ''));
      expect(minutes).toBeGreaterThan(0);
      expect(minutes).toBeLessThanOrEqual(45);
    }

    await page.getByRole('textbox', { name: 'Search' }).fill('zzzz');
    await expect(page.getByText('No appointments found. Try another search.')).toBeVisible();
  });

  test('reschedules an upcoming appointment, then cancels it with a reason', async ({ page }) => {
    await logIn(page);
    await page.goto(APPOINTMENT);
    await goToWeekday(page, 1);
    await showTable(page, 'Upcoming');
    await table(page)
      .getByRole('button', { name: /^View appointment for / })
      .first()
      .click();
    const dialog = appointmentDialog(page);
    await expect(dialog).toContainText('View Request Details');

    await dialog.getByRole('button', { name: 'Reschedule' }).click();
    const confirm = page.getByRole('dialog', { name: 'Reschedule Appointment' });
    await expect(confirm).toContainText('The patient will be asked to choose a new time.');
    await confirm.getByRole('button', { name: 'Request Reschedule' }).click();
    await expect(page.getByText('Reschedule requested', { exact: true })).toBeVisible();
    await expect(dialog).toContainText('Reschedule Requested');
    await expect(dialog.getByRole('button', { name: 'Reschedule' })).toBeDisabled();

    await dialog.getByRole('button', { name: 'Cancel Appointment' }).click();
    const cancel = page.getByRole('dialog', { name: 'Cancel Appointment' });
    const submit = cancel.getByRole('button', { name: 'Cancel Appointment' });
    await expect(submit).toBeDisabled();
    await cancel.getByRole('textbox', { name: 'Reason' }).fill('Patient asked to cancel by phone.');
    await submit.click();
    await expect(page.getByText('Appointment cancelled', { exact: true })).toBeVisible();
    await expect(dialog).toContainText('Cancelled by Staff');
    await expect(dialog).toContainText('Patient asked to cancel by phone.');
  });

  test('records the outcome of a past appointment', async ({ page }) => {
    await logIn(page);
    await page.goto(APPOINTMENT);
    await goToWeekday(page, -1);
    await showTable(page, 'Completed');
    await table(page)
      .getByRole('button', { name: /^View appointment for / })
      .first()
      .click();
    const dialog = appointmentDialog(page);
    await expect(dialog.getByRole('button', { name: 'Cancel Appointment' })).toBeDisabled();

    await dialog.getByRole('button', { name: 'Mark as DNA' }).click();
    await page.getByRole('dialog', { name: 'Mark as DNA' }).getByRole('button', { name: 'Mark as DNA' }).click();
    await expect(page.getByText('Appointment marked as DNA', { exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Mark as DNA' })).toBeHidden();

    await dialog.getByRole('button', { name: 'Mark as Completed' }).click();
    await page
      .getByRole('dialog', { name: 'Mark as Completed' })
      .getByRole('button', { name: 'Mark as Completed' })
      .click();
    await expect(page.getByText('Appointment marked as completed', { exact: true })).toBeVisible();
  });

  test('approves and rejects alternative-staff requests', async ({ page }) => {
    await logIn(page);
    await page.goto(`${APPOINTMENT}?tab=requests`);
    await expect(page.getByRole('heading', { name: 'Appointment Requests' })).toBeVisible();
    const requests = page.getByRole('table', { name: 'Appointment requests' });
    const approve = requests.getByRole('button', { name: /^Approve request for / });
    await expect(approve).toHaveCount(4);

    await approve.first().click();
    await page
      .getByRole('dialog', { name: 'Approve Request' })
      .getByRole('button', { name: 'Approve Request' })
      .click();
    await expect(page.getByText('Request approved', { exact: true })).toBeVisible();
    await expect(approve).toHaveCount(3);

    await requests
      .getByRole('button', { name: /^Reject request for / })
      .first()
      .click();
    const reject = page.getByRole('dialog', { name: 'Reject Request' });
    await reject.getByRole('textbox', { name: 'Reason' }).fill('The recommended GP has a slot that day.');
    await reject.getByRole('button', { name: 'Reject Request' }).click();
    await expect(page.getByText('Request rejected', { exact: true })).toBeVisible();
    await expect(approve).toHaveCount(2);

    await page.getByLabel('Status').click();
    await page.getByRole('option', { name: 'Expired' }).click();
    await expect(requests.getByRole('row')).toHaveCount(2);

    await requests
      .getByRole('link', { name: /^View case for / })
      .first()
      .click();
    await expect(page.getByRole('heading', { name: 'Consultation Details' })).toBeVisible();
    // Phones show only the current crumb.
    if (test.info().project.name === 'desktop') {
      await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Appointment');
    }
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page).toHaveURL(/tab=requests/);
  });
});
