import { expect, test, type Page } from '@playwright/test';
import dayjs from 'dayjs';

const PRACTICE = '/verticals/public/practices/ashford-medical-centre';
const LEAVES = `${PRACTICE}/leave-management/`;
const MY_LEAVE = `${PRACTICE}/leave-and-rota/`;

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

const toast = (page: Page, text: string) => page.getByText(text, { exact: true });
const requests = (page: Page) => page.getByRole('table', { name: 'Leave Requests' });
const rowWith = (page: Page, text: string) => requests(page).getByRole('row').filter({ hasText: text });

/** Types into the date sections, and types again if a keystroke was lost (it happens under load). */
async function typeDate(page: Page, label: RegExp, date: dayjs.Dayjs) {
  const group = page.getByRole('group', { name: label });
  await expect(async () => {
    // Focus rather than click: under load a click can land on the Year section.
    await group.getByRole('spinbutton', { name: 'Day' }).focus();
    await page.keyboard.type(date.format('DDMMYYYY'), { delay: 20 });
    await expect(group.locator('input')).toHaveValue(date.format('DD/MM/YYYY'), { timeout: 1000 });
  }).toPass({ timeout: 15_000 });
}

/** Monday next week: always in the future. */
const nextMonday = () => dayjs().add(7 - ((dayjs().day() + 6) % 7), 'day');

test.describe('leave management', () => {
  test('pending requests show balance and warnings, and your own can’t be approved', async ({ page }) => {
    await logIn(page);
    await page.goto(LEAVES);
    await expect(page.getByRole('heading', { name: 'Leave Management' })).toBeVisible();
    await expect(rowWith(page, 'Sick Leave')).toHaveCount(1);
    await expect(
      requests(page)
        .getByText(/shifts? on the rota in this period/)
        .first(),
    ).toBeVisible();
    await expect(rowWith(page, 'Sick Leave')).toContainText('4.69 days (37.5 h)');

    // Fix (question 5): the super-admin's own requests can't be decided by them.
    const own = rowWith(page, 'Family holiday booked in the spring.');
    await expect(own.getByRole('button', { name: /^Approve/ })).toBeDisabled();
    await expect(own.getByRole('button', { name: /^Reject/ })).toBeDisabled();

    await rowWith(page, 'Sick Leave').getByRole('button', { name: /^View/ }).click();
    const details = page.getByRole('dialog', { name: 'Leave Request Details' });
    await expect(details).toContainText('Migraine; back the next day.');
    await expect(details).toContainText('1 day (8 h)');
    await details.getByRole('button', { name: 'Close' }).click();
    await expect(details).toBeHidden();
  });

  test('approve and reject move requests to Leaves History', async ({ page }) => {
    await logIn(page);
    await page.goto(LEAVES);
    await rowWith(page, 'TOIL Leave')
      .getByRole('button', { name: /^Approve/ })
      .click();
    const approve = page.getByRole('dialog', { name: 'Approve Leave Request' });
    await expect(approve).toContainText('TOIL Leave (Time Off in Lieu)');
    await approve.getByRole('button', { name: 'Approve' }).click();
    await expect(toast(page, 'Leave request approved')).toBeVisible();
    await expect(rowWith(page, 'TOIL Leave')).toHaveCount(0);

    await rowWith(page, 'Sick Leave')
      .getByRole('button', { name: /^Reject/ })
      .click();
    const reject = page.getByRole('dialog', { name: 'Reject Leave Request' });
    await reject.getByLabel('Reason (Optional)').fill('No cover that day.');
    await reject.getByRole('button', { name: 'Reject' }).click();
    await expect(toast(page, 'Leave request rejected')).toBeVisible();

    await page.getByRole('tab', { name: 'Leaves History' }).click();
    await expect(page).toHaveURL(/tab=history/);
    const history = page.getByRole('table', { name: 'Leaves History' });
    await page.getByLabel('Status').click();
    await page.getByRole('option', { name: 'Rejected' }).click();
    const rejected = history.getByRole('row').filter({ hasText: 'Sick Leave' });
    await expect(rejected).toContainText('Rejected');
    await rejected.getByRole('button', { name: /^View/ }).click();
    await expect(page.getByRole('dialog', { name: 'Leave Request Details' })).toContainText('No cover that day.');
    await page.keyboard.press('Escape');

    await page.getByLabel('Status').click();
    await page.getByRole('option', { name: 'Approved' }).click();
    await expect(history.getByRole('row').filter({ hasText: 'TOIL Leave' })).toHaveCount(1);
  });

  test('filters narrow the list and an empty search says so', async ({ page }) => {
    await logIn(page);
    await page.goto(LEAVES);
    await expect(rowWith(page, 'Sick Leave')).toHaveCount(1);
    await page.getByLabel('Leave Type').click();
    await page.getByRole('option', { name: 'Annual Leave' }).click();
    await expect(rowWith(page, 'Sick Leave')).toHaveCount(0);
    await expect(rowWith(page, 'Annual Leave').first()).toBeVisible();

    await page.getByRole('combobox', { name: 'Staff' }).click();
    await page.getByRole('option', { name: 'Aqlios Admin' }).click();
    await expect(requests(page).getByRole('row').filter({ hasText: 'Annual Leave' })).toHaveCount(2);

    await page.getByRole('button', { name: 'Clear filters' }).click();
    await page.getByRole('textbox', { name: 'Search' }).fill('nobody by this name');
    await expect(page.getByText('No leave requests found. Try another search.')).toBeVisible();
  });

  test('approved leave takes the person off the ROTA', async ({ page }) => {
    await logIn(page);
    await page.goto(LEAVES);
    const row = rowWith(page, 'Moving house.');
    const [dd, mm, yyyy] = (await row.getByRole('cell').nth(4).textContent())!.trim().split('/');
    const start = dayjs(`${yyyy}-${mm}-${dd}`);
    const name = (await row.getByRole('cell').first().textContent())!.trim();
    await row.getByRole('button', { name: /^Approve/ }).click();
    await page.getByRole('dialog', { name: 'Approve Leave Request' }).getByRole('button', { name: 'Approve' }).click();
    await expect(toast(page, 'Leave request approved')).toBeVisible();

    await page.goto(`${PRACTICE}/rota/`);
    await expect(page.getByLabel('Loading rota')).toBeHidden();
    const monday = (day: dayjs.Dayjs) => day.subtract((day.day() + 6) % 7, 'day').startOf('day');
    const weeks = Math.round(monday(start).diff(monday(dayjs()), 'day') / 7);
    for (let week = 0; week < weeks; week += 1) {
      await page.getByRole('button', { name: 'Next week' }).click();
      await expect(page.getByLabel('Loading rota')).toBeHidden();
    }
    await expect(
      page.getByRole('region', { name: 'Rota calendar' }).getByText(`${name} on leave`).first(),
    ).toBeVisible();
  });
});

test.describe('leaves and rota', () => {
  test('a practice user applies for leave, then cancels it', async ({ page }) => {
    await logIn(page, 'practice-user');
    await page.goto(MY_LEAVE);
    await expect(page.getByRole('heading', { name: 'Leave History' })).toBeVisible();
    await expect(page.getByText('Annual Leave', { exact: true }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Apply For Leave' }).click();
    const drawer = page.getByRole('dialog', { name: 'Apply For Leave' });
    const submit = drawer.getByRole('button', { name: 'Apply Leave' });
    await expect(submit).toBeDisabled();

    await drawer.getByLabel(/^Leave Type/).click();
    await page.getByRole('option', { name: 'Annual Leave' }).click();
    await expect(drawer.getByText(/^Balance: /)).toBeVisible();
    const tuesday = nextMonday().add(1, 'day');
    await typeDate(page, /^Start Date/, tuesday.add(2, 'day'));
    await typeDate(page, /^End Date/, tuesday);
    await drawer.getByRole('spinbutton', { name: /^Duration/ }).click();
    await expect(drawer.getByText("End Date can't be before Start Date")).toBeVisible();
    await expect(submit).toBeDisabled();

    await typeDate(page, /^Start Date/, tuesday);
    await typeDate(page, /^End Date/, tuesday.add(2, 'day'));
    // The duration fills in from the contracted hours: Tuesday to Thursday is 3 working days.
    await expect(drawer.getByRole('spinbutton', { name: /^Duration/ })).toHaveValue('3');
    await expect(drawer.getByText('You work 3 days (24 h) in these dates')).toBeVisible();
    await drawer.getByRole('spinbutton', { name: /^Duration/ }).fill('4');
    await expect(drawer.getByText(/^Duration can't be more than the 3 days \(24 h\)/)).toBeVisible();
    await drawer.getByRole('spinbutton', { name: /^Duration/ }).fill('2.5');
    await drawer.getByLabel('Note').fill('School holiday cover.');
    await expect(drawer.getByText('21/300')).toBeVisible();
    await submit.click();
    await expect(toast(page, 'Leave request submitted')).toBeVisible();

    const table = page.getByRole('table', { name: 'My leave requests' });
    const row = table.getByRole('row').filter({ hasText: 'School holiday cover.' });
    await expect(row).toContainText('Pending Approval');
    await expect(row).toContainText('2.5 days (20 h)');
    await expect(row).toContainText(tuesday.format('DD/MM/YYYY'));

    await row.getByRole('button', { name: 'Cancel request' }).click();
    const cancel = page.getByRole('dialog', { name: 'Cancel Request' });
    await expect(cancel).toContainText('Cancel this leave request?');
    await cancel.getByRole('button', { name: 'Cancel Leave' }).click();
    await expect(toast(page, 'Leave request cancelled.')).toBeVisible();
    await expect(row).toContainText('Cancelled');
    await expect(row.getByRole('button', { name: 'Cancel request' })).toHaveCount(0);

    // The new request reached the manager's list, and went again when cancelled.
    await page.getByLabel('Status').click();
    await page.getByRole('option', { name: 'Cancelled' }).click();
    await expect(table.getByRole('row').filter({ hasText: 'School holiday cover.' })).toHaveCount(1);
  });

  test('my shifts this week and next come from the ROTA', async ({ page }) => {
    await logIn(page, 'practice-user');
    await page.goto(MY_LEAVE);
    const shifts = page.getByRole('region', { name: 'My Shifts' });
    await expect(shifts.getByText('08:30 - 13:00').first()).toBeVisible();
    await expect(shifts.getByRole('heading', { name: 'Next week' })).toBeVisible();
    await shifts.getByRole('link', { name: 'Open ROTA' }).click();
    await expect(page).toHaveURL(/\/rota\/?$/);
  });

  test('a super-admin sees their balances but no Apply For Leave, as live', async ({ page }) => {
    await logIn(page);
    await page.goto(MY_LEAVE);
    await expect(page.getByText('Maternity Leave', { exact: true })).toBeVisible();
    await expect(page.getByRole('table', { name: 'My leave requests' }).getByRole('row')).toHaveCount(3);
    await expect(page.getByRole('button', { name: 'Apply For Leave' })).toHaveCount(0);
  });
});
