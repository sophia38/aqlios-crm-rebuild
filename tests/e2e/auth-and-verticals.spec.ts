import { expect, test, type Page } from '@playwright/test';

async function logIn(
  page: Page,
  persona: 'Super-admin (Vertical Admin)' | 'Practice user (GP)' = 'Super-admin (Vertical Admin)',
) {
  await page.goto('/auth/login/');
  await page.getByLabel('Email').fill('reviewer@aqlios.demo');
  await page.getByLabel('Password', { exact: true }).fill('demo');
  if (persona !== 'Super-admin (Vertical Admin)') {
    await page.getByLabel('Sign in as').click();
    await page.getByRole('option', { name: persona }).click();
  }
  await page.getByRole('button', { name: 'Log In' }).click();
}

test('signed-out visitors are sent to the login page', async ({ page }) => {
  await page.goto('/verticals/');
  await expect(page).toHaveURL(/\/auth\/login\/$/);
  await expect(page.getByRole('heading', { name: 'Portal Login' })).toBeVisible();
});

test('login validates fields and rejects a wrong password', async ({ page }) => {
  await page.goto('/auth/login/');
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page.getByText('Email is required')).toBeVisible();
  await expect(page.getByText('Password is required')).toBeVisible();

  await page.getByLabel('Email').fill('not-an-email');
  await page.getByLabel('Email').blur();
  await expect(page.getByText('Enter a valid email')).toBeVisible();

  await page.getByLabel('Email').fill('reviewer@aqlios.demo');
  await page.getByLabel('Password', { exact: true }).fill('wrong');
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page.getByText('Invalid email or password.')).toBeVisible();
});

test('login button and Forgot Password match the capture', async ({ page }) => {
  await page.goto('/auth/login/');
  const button = page.getByRole('button', { name: 'Log In' });
  await expect(button).toHaveCSS('background-color', 'rgb(92, 225, 230)');
  await expect(button).toHaveCSS('border-radius', '16px');
  await expect(button).toHaveCSS('height', '48px');

  await page.getByRole('button', { name: 'Forgot Password?' }).click();
  await expect(page.getByText(/Password reset is handled by the 31G sign-in service/)).toBeVisible();
});

test('super-admin sees the verticals picker', async ({ page }) => {
  await logIn(page);
  await expect(page).toHaveURL(/\/verticals\/$/);
  await expect(page.getByRole('heading', { name: /Welcome back Aqlios Admin/ })).toBeVisible();

  const verticals = page.getByRole('navigation', { name: 'Verticals' });
  await expect(verticals.getByRole('button', { name: 'Public Primary Care' })).toBeEnabled();
  await expect(verticals.getByRole('button', { name: 'Private Business' })).toBeEnabled();
  await expect(verticals.getByRole('button', { name: 'Everyclinic Business' })).toBeDisabled();
  await expect(page.getByText(/Copyright © \d{4} Aqlios\. All rights reserved\./)).toBeVisible();

  await verticals.getByRole('button', { name: 'Private Business' }).click();
  await expect(page).toHaveURL(/\/verticals\/private\/$/);
  await expect(page.getByText('Private Business is not part of this rebuild.', { exact: false })).toBeVisible();

  await page.getByRole('link', { name: 'Back to Verticals' }).click();
  await page
    .getByRole('navigation', { name: 'Verticals' })
    .getByRole('button', { name: 'Public Primary Care' })
    .click();
  await expect(page).toHaveURL(/\/verticals\/public\/practices\/$/);
});

test('practice user skips the picker and has no role line', async ({ page }) => {
  await logIn(page, 'Practice user (GP)');
  await expect(page).toHaveURL(/\/verticals\/public\/practices\/$/);
  const pill = page.getByRole('button', { name: 'Account menu for Sam Patel' });
  await expect(pill).toBeVisible();
  await expect(pill).not.toContainText('super-admin');
  await expect(page.getByRole('link', { name: 'Back to Verticals' })).toHaveCount(0);
});

test('logout returns to the login page and protects routes again', async ({ page }) => {
  await logIn(page);
  await page.getByRole('button', { name: 'Account menu for Aqlios Admin' }).click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/auth\/login\/$/);
  await page.goto('/verticals/');
  await expect(page).toHaveURL(/\/auth\/login\/$/);
});
