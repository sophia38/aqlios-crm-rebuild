import { expect, test, type Page } from '@playwright/test';

const ROLES = '/verticals/public/roles/';

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

test.describe('roles list', () => {
  test('shows the captured roles, sorts by date, searches and shows the empty message', async ({ page }) => {
    await logIn(page);
    await page.goto(ROLES);
    const table = page.getByRole('table', { name: 'Roles' });
    await expect(table.getByRole('row')).toHaveCount(6); // header + 5 roles
    await expect(table.getByRole('columnheader', { name: 'Date Created' })).toHaveAttribute('aria-sort', 'descending');
    await expect(table.getByRole('row').nth(1)).toContainText('HR');
    await expect(table.getByRole('row', { name: /Practice Manager/ })).toContainText('49');
    await expect(page.getByText('1–5 of 5')).toBeVisible();

    await page.getByLabel('Search').fill('nur');
    await expect(table.getByRole('row')).toHaveCount(2);
    await page.getByLabel('Search').fill('zzzz');
    await expect(page.getByText('No roles found. Try another search.')).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(table.getByRole('row')).toHaveCount(6);
  });

  test('delete stays disabled until every user is reassigned', async ({ page }) => {
    await logIn(page);
    await page.goto(ROLES);
    await page.getByRole('button', { name: 'Delete Nurse' }).click();
    const dialog = page.getByRole('dialog', { name: 'Delete Role' });
    await expect(dialog).toContainText('Are you sure you want to delete the role "Nurse"?');
    await expect(dialog).toContainText('2 user(s)');
    const confirm = dialog.getByRole('button', { name: 'Delete Role' });
    await expect(confirm).toBeDisabled();

    const pickers = dialog.getByRole('combobox', { name: /Reassign User To Role/ });
    await expect(pickers).toHaveCount(2);
    await pickers.nth(0).click();
    await expect(page.getByRole('option', { name: 'Nurse' })).toHaveCount(0);
    await page.getByRole('option', { name: 'Clinician' }).click();
    await expect(confirm).toBeDisabled();
    // Esc closes only the open option list, not the dialog.
    await pickers.nth(1).click();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    await pickers.nth(1).click();
    await page.getByRole('option', { name: 'Clinician' }).click();
    await expect(confirm).toBeEnabled();
    await confirm.click();

    await expect(page.getByText('Role deleted successfully').first()).toBeVisible();
    const table = page.getByRole('table', { name: 'Roles' });
    await expect(table.getByRole('row')).toHaveCount(5);
    await expect(table.getByRole('row', { name: /Clinician/ })).toContainText('47');
  });
});

test.describe('role detail, edit and create', () => {
  test('view mode shows granted permissions; edit saves changes', async ({ page }) => {
    await logIn(page);
    await page.goto(ROLES);
    await page.getByRole('link', { name: 'View Nurse' }).click();
    await expect(page.getByRole('heading', { name: 'Role Detail', exact: true })).toBeVisible();
    const section = page.getByRole('button', { name: /Role Permission Management/ });
    await expect(section).toContainText('3 / 4 permissions selected');
    await section.click();
    await expect(page.getByLabel('Granted', { exact: true })).toHaveCount(3);
    await expect(page.getByLabel('Not granted')).toHaveCount(1);
    await expect(page.getByRole('checkbox', { name: 'List All Roles' })).toBeDisabled();

    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByRole('heading', { name: 'Editing role details' })).toBeVisible();
    const save = page.getByRole('button', { name: 'Save Changes' });
    await expect(save).toBeDisabled();
    await page.getByRole('button', { name: /Billing/ }).click();
    const selectAll = page.getByRole('checkbox', { name: 'Select all 1 permissions' });
    await selectAll.check();
    await expect(save).toBeEnabled();
    await selectAll.uncheck();
    await expect(save).toBeDisabled();

    // Ticking a child ticks its parent; "Select all" shows the partial state.
    await page.getByRole('button', { name: /^Appointment/ }).click();
    await page.getByRole('checkbox', { name: 'Book Slots for Other Staff' }).check();
    await expect(page.getByRole('checkbox', { name: 'Book Appointments for Patients' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'View Open/Available and Booked Slots' })).toBeChecked();
    await expect(page.getByRole('button', { name: /^Appointment/ })).toContainText('3 / 12 permissions selected');
    await expect(page.getByRole('checkbox', { name: 'Select all 12 permissions' })).toHaveAttribute(
      'data-indeterminate',
      'true',
    );
    await save.click();
    await expect(page.getByText('Role updated successfully').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Role Detail', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Appointment/ })).toContainText('3 / 12 permissions selected');
  });

  test('create validates, searches permissions and opens the new role', async ({ page }) => {
    await logIn(page);
    await page.goto(ROLES);
    await page.getByRole('link', { name: 'Add New Role' }).click();
    await expect(page.getByRole('heading', { name: 'Create New Role' })).toBeVisible();
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Role name is required.')).toBeVisible();

    await page.getByLabel('Search').fill('zzzz');
    await expect(page.getByText('No results matching "zzzz"')).toBeVisible();
    await page.getByLabel('Search').fill('download rota');
    await page.getByRole('checkbox', { name: 'Download ROTA' }).check();
    await page.getByLabel('Search').fill('');

    await page.getByLabel(/Role Name/).fill('Nurse');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('A role with this name already exists.').first()).toBeVisible();

    await page.getByLabel(/Role Name/).fill('Receptionist');
    await page.getByLabel('Role Description').fill('Front desk staff');
    await expect(page.getByText('16 / 100')).toBeVisible();
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Role created successfully').first()).toBeVisible();
    await expect(page).toHaveURL(/\/roles\/[0-9a-f-]{36}\/$/);
    // A new role has no pre-built page; the static host's fallback renders it at its real URL.
    await expect(page.getByRole('heading', { name: 'Role Detail', exact: true })).toBeVisible();
    await expect(page.getByText('Receptionist', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /ROTA Management/ })).toContainText('2 / 10 permissions selected');
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Role Detail', exact: true })).toBeVisible();
  });
});

test.describe('associated users', () => {
  test('lists the role users and filters by search', async ({ page }) => {
    await logIn(page);
    await page.goto(ROLES);
    await page.getByRole('link', { name: 'View users of Practice Manager' }).click();
    await expect(page.getByText('Associated Users List').first()).toBeVisible();
    const table = page.getByRole('table', { name: 'Associated users' });
    await expect(table.getByRole('row')).toHaveCount(11);
    await expect(page.getByText('1–10 of 49')).toBeVisible();
    await page.getByLabel('Search').fill('zzzz');
    await expect(page.getByText('No users found. Try another search.')).toBeVisible();
    await page.getByRole('button', { name: 'Go Back' }).click();
    await expect(page).toHaveURL(/\/roles\/$/);
  });

  test('practice users cannot open roles', async ({ page }) => {
    await logIn(page, 'practice-user');
    await page.goto(ROLES);
    await expect(page.getByText("You don't have access to this page")).toBeVisible();
  });
});
