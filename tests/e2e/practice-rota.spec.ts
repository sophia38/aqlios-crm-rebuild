import { expect, test, type Page } from '@playwright/test';
import dayjs from 'dayjs';

const PRACTICE = '/verticals/public/practices/ashford-medical-centre';
const ROTA = `${PRACTICE}/rota/`;

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
const toast = (page: Page, text: string) => page.getByText(text, { exact: true });
/** Wednesday next week: always in the future, and a working day. */
const nextWednesday = () =>
  dayjs()
    .add(7, 'day')
    .subtract((dayjs().day() + 6) % 7, 'day')
    .add(2, 'day');
const slot = (page: Page, day: dayjs.Dayjs, time: string) =>
  calendar(page).getByRole('button', { name: `Assign staff, ${day.format('ddd D MMM')} ${time}`, exact: true });

async function openNextWeek(page: Page) {
  await page.goto(ROTA);
  await expect(page.getByRole('heading', { name: 'ROTA Management' })).toBeVisible();
  await page.getByRole('button', { name: 'Next week' }).click();
  await expect(page.getByLabel('Loading rota')).toBeHidden();
}

/** Picks the first available staff member and fills the required shift details. */
async function fillAssignment(page: Page, drawer: ReturnType<Page['getByRole']>) {
  await drawer.getByRole('radiogroup', { name: 'Available staff' }).getByRole('button').first().click();
  await drawer.getByLabel('Duty Type for this shift').click();
  await page.getByRole('option', { name: 'On Call' }).click();
  await drawer.getByLabel('Appointment Type').click();
  await page.getByRole('option', { name: 'Face to Face Surgery' }).click();
  await page.keyboard.press('Escape');
  await drawer.getByLabel('Routine / Urgent').click();
  await page.getByRole('option', { name: 'Urgent' }).click();
  await page.keyboard.press('Escape');
}

test.describe('practice rota', () => {
  test('shows the practice tabs without a practice filter or panel', async ({ page }) => {
    await logIn(page);
    await page.goto(ROTA);
    await expect(page.getByRole('tab', { name: 'Staff Rota' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('complementary', { name: 'Select Practice' })).toHaveCount(0);
    await expect(page.getByLabel('Practice', { exact: true })).toHaveCount(0);

    await page.getByRole('tab', { name: 'Activity Tracker' }).click();
    await expect(page).toHaveURL(/module=activityTracker/);
    await expect(page.getByLabel('Duty Type')).toBeVisible();
    // The sidebar marks Activity Tracker, not ROTA Management (phones hide the sidebar).
    if (test.info().project.name === 'desktop') {
      await expect(
        page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Activity Tracker' }),
      ).toHaveAttribute('aria-current', 'page');
    }
  });

  test('assigns staff once from a slot, then edits and deletes the shift', async ({ page }) => {
    await logIn(page);
    await openNextWeek(page);
    const day = nextWednesday();
    await slot(page, day, '06:00').click();
    const drawer = page.getByRole('dialog', { name: 'Assign Staff' });
    const submit = drawer.getByRole('button', { name: 'Assign Staff' }).last();
    await expect(submit).toBeDisabled();
    await expect(drawer.getByRole('textbox', { name: 'From', exact: true })).toHaveValue('06:00');
    await expect(drawer.getByRole('textbox', { name: 'To', exact: true })).toHaveValue('07:00');
    await fillAssignment(page, drawer);
    await submit.click();
    await expect(toast(page, 'Staff assigned')).toBeVisible();
    const shift = calendar(page).getByRole('button', {
      name: new RegExp(`^${day.format('ddd D MMM')}, 06:00 - 07:00, `),
    });
    await expect(shift).toBeVisible();

    await shift.click();
    const edit = page.getByRole('dialog', { name: 'Edit Assignment' });
    await expect(edit).toContainText(day.format('ddd, D MMM YYYY'));
    await edit.getByRole('textbox', { name: 'To', exact: true }).fill('07:30');
    await edit.getByRole('button', { name: 'Save changes' }).click();
    await expect(toast(page, 'Assignment updated')).toBeVisible();
    const edited = calendar(page).getByRole('button', {
      name: new RegExp(`^${day.format('ddd D MMM')}, 06:00 - 07:30, `),
    });
    await expect(edited).toBeVisible();

    await edited.click();
    await page
      .getByRole('dialog', { name: 'Edit Assignment' })
      .getByRole('button', { name: /^Delete .+'s assignment$/ })
      .click();
    await page
      .getByRole('dialog', { name: 'Delete Assignment' })
      .getByRole('button', { name: 'Delete Assignment' })
      .click();
    await expect(toast(page, 'Assignment deleted')).toBeVisible();
    await expect(edited).toHaveCount(0);
  });

  test('a recurring assignment repeats, and edits follow the chosen scope', async ({ page }) => {
    await logIn(page);
    await openNextWeek(page);
    const day = nextWednesday();
    await slot(page, day, '05:00').click();
    const drawer = page.getByRole('dialog', { name: 'Assign Staff' });
    await drawer.getByRole('tab', { name: 'Recurring' }).click();
    await expect(drawer.getByRole('button', { name: 'Wednesday' })).toHaveAttribute('aria-pressed', 'true');
    await drawer.getByRole('button', { name: 'Thursday' }).click();
    await fillAssignment(page, drawer);
    await drawer.getByRole('button', { name: 'Assign Staff' }).last().click();
    await expect(toast(page, 'Staff assigned')).toBeVisible();
    const early = (date: dayjs.Dayjs, end = '06:00') =>
      calendar(page).getByRole('button', { name: new RegExp(`^${date.format('ddd D MMM')}, 05:00 - ${end}, `) });
    await expect(early(day)).toBeVisible();
    await expect(early(day.add(1, 'day'))).toBeVisible();

    // Current and Following from Thursday: that Thursday and every later day of the series change
    // (next week's Wednesday too); this Wednesday, before it, doesn't.
    await early(day.add(1, 'day')).click();
    const edit = page.getByRole('dialog', { name: 'Edit Assignment' });
    await edit.getByRole('radio', { name: 'Current and Following Assignment' }).check();
    await edit.getByRole('textbox', { name: 'To', exact: true }).fill('06:30');
    await edit.getByRole('button', { name: 'Save changes' }).click();
    await expect(toast(page, 'Assignment updated')).toBeVisible();
    await expect(early(day)).toBeVisible();
    await expect(early(day.add(1, 'day'), '06:30')).toBeVisible();
    await page.getByRole('button', { name: 'Next week' }).click();
    await expect(early(day.add(7, 'day'), '06:30')).toBeVisible();
    await expect(early(day.add(8, 'day'), '06:30')).toBeVisible();

    // Delete All.
    await early(day.add(7, 'day'), '06:30').click();
    const again = page.getByRole('dialog', { name: 'Edit Assignment' });
    await again.getByRole('radio', { name: 'All Assignments' }).check();
    await again.getByRole('button', { name: /^Delete .+'s assignment$/ }).click();
    await page
      .getByRole('dialog', { name: 'Delete Assignment' })
      .getByRole('button', { name: 'Delete Assignment' })
      .click();
    await expect(toast(page, 'Assignment deleted')).toBeVisible();
    await expect(early(day.add(7, 'day'), '06:30')).toHaveCount(0);
    await expect(early(day.add(8, 'day'), '06:30')).toHaveCount(0);
    await page.getByRole('button', { name: 'Previous week' }).click();
    await expect(early(day)).toHaveCount(0);
  });

  test('dragging down the ＋ column picks the time range', async ({ page }) => {
    await logIn(page);
    await openNextWeek(page);
    const day = nextWednesday();
    const from = slot(page, day, '07:00');
    const to = slot(page, day, '08:30');
    await from.scrollIntoViewIfNeeded();
    await from.hover();
    await page.mouse.down();
    await to.hover();
    await page.mouse.up();
    const drawer = page.getByRole('dialog', { name: 'Assign Staff' });
    await expect(drawer.getByRole('textbox', { name: 'From', exact: true })).toHaveValue('07:00');
    await expect(drawer.getByRole('textbox', { name: 'To', exact: true })).toHaveValue('09:00');
  });

  test('creates a template from a week and applies it', async ({ page }) => {
    await logIn(page);
    await openNextWeek(page);
    await page.getByRole('button', { name: 'Create Rota Template' }).click();
    const create = page.getByRole('dialog', { name: 'Create Rota Template' });
    await expect(create.getByRole('button', { name: 'Create Template' })).toBeDisabled();
    await create.getByRole('textbox', { name: 'Template Name' }).fill('Standard week');
    await expect(create.getByLabel('Select Practice')).toHaveValue('Ashford Medical Centre');
    await create.getByLabel('Select Staff').click();
    await page.getByRole('option').first().click();
    await page.keyboard.press('Escape');
    await create.getByRole('button', { name: 'Create Template' }).click();
    await expect(toast(page, 'Template created')).toBeVisible();

    await page.getByRole('button', { name: 'Apply Rota Template' }).click();
    const apply = page.getByRole('dialog', { name: 'Choose Rota Template' });
    const card = apply.getByRole('listitem', { name: 'Standard week' });
    await expect(card).toContainText('Ashford Medical Centre');
    await expect(apply.getByRole('button', { name: 'Apply Template' })).toBeDisabled();
    await card.getByRole('button', { name: 'Choose' }).click();
    await apply.getByLabel('Clear existing shifts before applying template').check();
    await expect(apply.getByText(/will be removed/)).toBeVisible();
    await apply.getByRole('button', { name: 'Apply Template' }).click();
    await expect(page.getByText(/^Template applied: \d+ shifts? added$/)).toBeVisible();

    await page.getByRole('button', { name: 'Apply Rota Template' }).click();
    await apply.getByRole('button', { name: 'Delete template Standard week' }).click();
    await page
      .getByRole('dialog', { name: 'Delete Template' })
      .getByRole('button', { name: 'Delete Template' })
      .click();
    await expect(toast(page, 'Template deleted')).toBeVisible();
    await expect(apply.getByText('No rota templates yet. Create one from the rota first.')).toBeVisible();
  });

  test('managers publish a slot and accept a bid', async ({ page }) => {
    await logIn(page);
    await openNextWeek(page);
    const day = nextWednesday();
    await slot(page, day, '19:00').click();
    const drawer = page.getByRole('dialog', { name: 'Assign Staff' });
    await drawer.getByRole('tab', { name: 'Publish Slot' }).click();
    const publish = page.getByRole('dialog', { name: 'Publish Slot' });
    const submit = publish.getByRole('button', { name: 'Publish Slot' });
    await expect(submit).toBeDisabled();
    await publish.getByLabel('Duty Type').click();
    await page.getByRole('option', { name: 'Extended Access' }).click();
    await publish.getByRole('textbox', { name: 'Rate per hour' }).fill('90');
    await submit.click();
    await expect(toast(page, 'Slot published')).toBeVisible();

    await page.getByRole('tab', { name: 'Shift Bidding' }).click();
    await expect(page).toHaveURL(/module=shiftBidding/);
    const slots = page.getByRole('list', { name: 'Published slots' });
    await expect(slots.getByText('£90/hour').first()).toBeVisible();
    const accept = slots.getByRole('button', { name: /^Accept bid from / }).first();
    await accept.click();
    const dialog = page.getByRole('dialog', { name: 'Accept Bid' });
    await expect(dialog).toContainText('This will assign the slot to them.');
    await dialog.getByRole('button', { name: 'Accept Bid' }).click();
    await expect(toast(page, 'Bid accepted')).toBeVisible();
  });

  test('practice users claim and decline published slots', async ({ page }) => {
    await logIn(page, 'practice-user');
    await page.goto(`${ROTA}?module=shiftBidding`);
    const slots = page.getByRole('list', { name: 'Published slots' });
    // Today's slot may already be closed for bidding; use one that's still open.
    const first = slots.getByRole('listitem').filter({ hasNotText: 'Bidding closed' }).first();
    await first.getByRole('button', { name: 'Claim' }).click();
    await page.getByRole('dialog', { name: 'Claim Shift' }).getByRole('button', { name: 'Claim Shift' }).click();
    await expect(toast(page, 'Shift claimed')).toBeVisible();
    await expect(first).toContainText('Claimed');
    await expect(first.getByRole('button', { name: 'Claim' })).toBeDisabled();

    await first.getByRole('button', { name: 'Decline' }).click();
    await page.getByRole('dialog', { name: 'Decline Shift' }).getByRole('button', { name: 'Decline Shift' }).click();
    await expect(toast(page, 'Shift declined')).toBeVisible();
    await expect(first).toContainText('Declined');

    await page.getByRole('tab', { name: 'Staff Rota' }).click();
    await expect(calendar(page)).toBeVisible();
    await expect(page.getByText('Failed to load the rota')).toHaveCount(0);
  });
});
