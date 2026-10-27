import { expect, test } from '@playwright/test';

test('theme check page renders with Aqlios tokens', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Aqlios rebuild: theme check' })).toBeVisible();

  const save = page.getByRole('button', { name: 'Save Changes' });
  await expect(save).toHaveCSS('background-color', 'rgb(44, 122, 123)'); // primary.main #2C7A7B
  await expect(save).toHaveCSS('border-radius', '18px');

  const login = page.getByRole('button', { name: 'Login' });
  await expect(login).toHaveCSS('background-color', 'rgb(92, 225, 230)'); // brand.main #5CE1E6
  await expect(login).toHaveCSS('color', 'rgb(37, 90, 92)'); // brand.contrastText #255A5C

  const fontFamily = await page.locator('body').evaluate((el) => getComputedStyle(el).fontFamily);
  expect(fontFamily.toLowerCase()).toContain('poppins');

  const input = page.getByRole('textbox', { name: 'Practice Name' });
  const radius = await input.evaluate((el) => getComputedStyle(el.closest('.MuiOutlinedInput-root')!).borderRadius);
  expect(radius).toBe('12px');
});
