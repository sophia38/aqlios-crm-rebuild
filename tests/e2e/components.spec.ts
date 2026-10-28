import { expect, test } from '@playwright/test';

// Behaviour of shared components, exercised in the dev gallery (/dev/components).
test.beforeEach(async ({ page }) => {
  await page.goto('/dev/components/');
  await expect(page.getByRole('heading', { name: 'Component gallery' })).toBeVisible();
});

test('ConfirmDialog focuses Cancel and Enter does not confirm', async ({ page }) => {
  await page.getByRole('button', { name: 'ConfirmDialog: error' }).click();
  const dialog = page.getByRole('dialog', { name: 'Delete Assignment' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("This can't be undone.")).toHaveCount(1);
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Enter'); // activates the focused Cancel, never Delete
  await expect(dialog).toBeHidden();
});

test('FormModal keeps submit disabled until valid and closes on Esc', async ({ page }) => {
  await page.getByRole('button', { name: /FormModal/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Create Rota Group' });
  await expect(dialog.getByRole('button', { name: 'Create Group' })).toBeDisabled();
  await dialog.getByLabel('Group Name').fill('North Pool');
  await expect(dialog.getByRole('button', { name: 'Create Group' })).toBeEnabled();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('DataTable sorts, paginates and shows incomplete rows', async ({ page }) => {
  const table = page.getByRole('table', { name: 'Practices' });
  await expect(table.getByRole('columnheader', { name: 'Date Added' })).toHaveAttribute('aria-sort', 'descending');
  await table.getByRole('button', { name: 'No. of Users' }).click();
  await expect(table.getByRole('columnheader', { name: 'No. of Users' })).toHaveAttribute('aria-sort', 'descending');
  await table.getByRole('button', { name: 'No. of Users' }).click();
  await expect(table.getByRole('columnheader', { name: 'No. of Users' })).toHaveAttribute('aria-sort', 'ascending');
  await expect(page.getByText('1–10 of 23')).toBeVisible();
  await page.getByRole('button', { name: 'Go to next page' }).click();
  await expect(page.getByText('11–20 of 23')).toBeVisible();
  await expect(table.getByLabel('Practice profile is incomplete').first()).toBeVisible();

  await page.getByRole('button', { name: 'Table: empty' }).click();
  await expect(table.getByText('No practices found. Try another search.')).toBeVisible();
});
