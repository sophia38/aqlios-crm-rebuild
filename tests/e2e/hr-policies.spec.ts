import { expect, test, type Page } from '@playwright/test';

const PRACTICE = '/verticals/public/practices/ashford-medical-centre';
const ASK = `${PRACTICE}/hr-policies/ask/`;
const LIBRARY = `${PRACTICE}/hr-policies/library/`;

async function logIn(page: Page) {
  await page.goto('/auth/login/');
  await page.getByLabel('Email').fill('reviewer@aqlios.demo');
  await page.getByLabel('Password', { exact: true }).fill('demo');
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(/\/verticals\//);
}

const toast = (page: Page, text: string) => page.getByText(text, { exact: true });
const table = (page: Page) => page.getByRole('table', { name: 'Policy Library' });
const rowWith = (page: Page, text: string) => table(page).getByRole('row').filter({ hasText: text });

test.describe('ask hr', () => {
  test('a suggested question gets an answer that cites its source', async ({ page }) => {
    await logIn(page);
    await page.goto(ASK);
    await expect(page.getByRole('heading', { name: 'Ask HR', exact: true })).toBeVisible();
    const composer = page.getByRole('textbox', { name: 'Ask a question about your policies' });
    const send = page.getByRole('button', { name: 'Send' });
    await expect(send).toBeDisabled();
    await expect(page.getByText('0/1000')).toBeVisible();

    // The suggestion fills the composer; Enter sends.
    await page.getByRole('button', { name: 'How much annual leave do I get?' }).click();
    await expect(composer).toHaveValue('How much annual leave do I get?');
    await expect(send).toBeEnabled();
    await composer.press('Enter');

    const thread = page.getByRole('log', { name: 'Ask HR conversation' });
    await expect(thread).toContainText('How much annual leave do I get?');
    await expect(thread).toContainText('27 days of annual leave a year');
    await expect(thread).toContainText('Annual leave policy, section 2.1');
    await expect(composer).toHaveValue('');

    // Shift+Enter adds a line instead of sending.
    await composer.fill('How do I raise');
    await composer.press('Shift+Enter');
    await composer.pressSequentially('a grievance?');
    await expect(composer).toHaveValue('How do I raise\na grievance?');
    await send.click();
    await expect(thread).toContainText('Grievance policy, section 3.1');

    await composer.fill('Can I bring my dog to work?');
    await composer.press('Enter');
    await expect(thread).toContainText('I couldn’t find this in your practice’s policies.');
  });

  test('the tabs are routes and keep HR Policies active in the menu', async ({ page, isMobile }) => {
    await logIn(page);
    await page.goto(ASK);
    await page.getByRole('tab', { name: 'Policy Library' }).click();
    await expect(page).toHaveURL(/\/hr-policies\/library\/?$/);
    await expect(page.getByRole('heading', { name: 'Policy Library' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Policy Library' })).toHaveAttribute('aria-selected', 'true');
    test.skip(isMobile, 'The sidebar is checked on desktop');
    await expect(
      page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'HR Policies' }),
    ).toHaveAttribute('aria-current', 'page');
  });
});

test.describe('policy library', () => {
  test('category pills filter the list', async ({ page }) => {
    await logIn(page);
    await page.goto(LIBRARY);
    await expect(rowWith(page, 'Annual leave policy')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'All', exact: true })).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'Grievance', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Grievance', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(rowWith(page, 'Grievance policy')).toHaveCount(1);
    await expect(rowWith(page, 'Annual leave policy')).toHaveCount(0);

    await page.getByRole('button', { name: 'Equality', exact: true }).click();
    await expect(page.getByText('No policies found in this category. Try another category.')).toBeVisible();

    await page.getByRole('button', { name: 'All', exact: true }).click();
    await rowWith(page, 'Sickness absence policy').getByRole('button', { name: 'View' }).click();
    const details = page.getByRole('dialog', { name: 'Sickness absence policy' });
    await expect(details).toContainText('2.1 Reporting sickness');
    await details.getByRole('button', { name: 'Close' }).click();
    await expect(details).toBeHidden();
  });

  test('upload validates, then the new policy can be replaced and deleted', async ({ page }) => {
    await logIn(page);
    await page.goto(LIBRARY);
    await page.getByRole('button', { name: 'Upload Policy' }).click();
    const dialog = page.getByRole('dialog', { name: 'Upload Policy' });
    const upload = dialog.getByRole('button', { name: 'Upload' });
    await expect(upload).toBeDisabled();

    await dialog.getByLabel(/^Title/).fill('Lone working');
    await dialog.getByLabel(/^Title/).clear();
    await dialog.getByLabel(/^Category/).click();
    await page.getByRole('option', { name: 'Health & safety' }).click();
    await expect(dialog.getByText('Title is required')).toBeVisible();
    await dialog.getByLabel(/^Title/).fill('Lone working policy');

    await dialog.locator('input[type="file"]').setInputFiles({
      name: 'lone-working.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('notes'),
    });
    await expect(dialog.getByText('Upload a PDF or Word (.docx) file.')).toBeVisible();
    await expect(upload).toBeDisabled();
    await dialog.locator('input[type="file"]').setInputFiles({
      name: 'lone-working.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 demo'),
    });
    await expect(dialog.getByText(/^lone-working\.pdf/)).toBeVisible();
    await dialog.getByLabel('Owner').click();
    await page.getByRole('option').nth(1).click();
    await upload.click();
    await expect(toast(page, 'Policy uploaded.')).toBeVisible();

    const row = rowWith(page, 'Lone working policy');
    await expect(row).toContainText('Health & safety');
    await expect(row).toContainText('v1');

    await row.getByRole('button', { name: 'Replace' }).click();
    const replace = page.getByRole('dialog', { name: 'Replace Policy' });
    await expect(replace.getByLabel(/^Title/)).toHaveValue('Lone working policy');
    await expect(replace.getByRole('button', { name: 'Replace' })).toBeDisabled();
    await replace.locator('input[type="file"]').setInputFiles({
      name: 'lone-working-v2.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('demo'),
    });
    await replace.getByRole('button', { name: 'Replace' }).click();
    await expect(toast(page, 'Policy replaced.')).toBeVisible();
    await expect(row).toContainText('v2');
    await expect(row).toContainText('lone-working-v2.docx');

    await row.getByRole('button', { name: 'Delete' }).click();
    const confirm = page.getByRole('dialog', { name: 'Delete policy?' });
    await expect(confirm).toContainText('"Lone working policy" and all its versions will be removed');
    await confirm.getByRole('button', { name: 'Delete' }).click();
    await expect(toast(page, 'Policy deleted.')).toBeVisible();
    await expect(rowWith(page, 'Lone working policy')).toHaveCount(0);
  });

  test('with every policy deleted, both tabs show the empty state', async ({ page }) => {
    await logIn(page);
    await page.goto(LIBRARY);
    for (let left = 6; left > 0; left -= 1) {
      await table(page).getByRole('button', { name: 'Delete' }).first().click();
      await page.getByRole('dialog', { name: 'Delete policy?' }).getByRole('button', { name: 'Delete' }).click();
      await expect(table(page).getByRole('button', { name: 'Delete' })).toHaveCount(left - 1);
    }
    await expect(page.getByRole('heading', { name: 'No Policies Yet' })).toBeVisible();

    await page.getByRole('tab', { name: 'Ask HR' }).click();
    await expect(page.getByRole('heading', { name: "Ask About Your Practice's HR Policies" })).toBeVisible();
    await page.getByRole('button', { name: 'Upload a Policy' }).click();
    await expect(page.getByRole('dialog', { name: 'Upload Policy' })).toBeVisible();
  });
});
