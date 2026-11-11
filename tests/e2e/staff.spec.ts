import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import * as XLSX from 'xlsx';

const PRACTICE = '/verticals/public/practices/ashford-medical-centre';
const STAFF = `${PRACTICE}/staff/`;

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

const staffTable = (page: Page, name = 'Staff List') => page.getByRole('table', { name });
const toast = (page: Page, text: string) => page.getByText(text, { exact: true });

/** Opens a staff member from the Staff List by searching for them. */
async function openStaff(page: Page, search: string) {
  await page.goto(STAFF);
  await page.getByRole('textbox', { name: 'Search' }).fill(search);
  await expect(staffTable(page).getByRole('row')).toHaveCount(2);
  await staffTable(page)
    .getByRole('link', { name: /^View / })
    .click();
  await expect(page.getByRole('heading', { name: 'Staff Member Details' })).toBeVisible();
}

test.describe('staff management', () => {
  test('shows the tabs, stats and filters, and invites someone', async ({ page }) => {
    await logIn(page);
    await page.goto(STAFF);
    await expect(page.getByRole('heading', { name: 'Staff List' })).toBeVisible();
    for (const label of ['Total Staff', 'Active Staff', 'Pending Invitations']) {
      await expect(page.getByRole('listitem').filter({ hasText: label })).toBeVisible();
    }
    await expect(staffTable(page).getByRole('row')).toHaveCount(11);

    await page.getByLabel('Status').click();
    await page.getByRole('option', { name: 'Pending Approval' }).click();
    for (const row of (await staffTable(page).getByRole('row').all()).slice(1)) {
      await expect(row).toContainText('Pending Approval');
    }
    await page.getByRole('textbox', { name: 'Search' }).fill('zzzz');
    await expect(page.getByText('No staff found. Try another search.')).toBeVisible();

    await page.getByRole('tab', { name: 'Archived Users' }).click();
    await expect(page).toHaveURL(/tab=archived/);
    await expect(page.getByText('No archived staff. Adjust your filters or search term.')).toBeVisible();

    await page.getByRole('tab', { name: 'Sent Invitations' }).click();
    await page.getByRole('button', { name: 'Invite Staff' }).click();
    const dialog = page.getByRole('dialog', { name: 'Send Invite' });
    const submit = dialog.getByRole('button', { name: 'Send Invite' });
    await expect(submit).toBeDisabled();
    await dialog.getByRole('textbox', { name: 'Email' }).fill('not-an-email');
    await dialog.getByRole('textbox', { name: 'First Name' }).click();
    await expect(dialog.getByText('Enter a valid email')).toBeVisible();
    await dialog.getByRole('textbox', { name: 'First Name' }).fill('Robin');
    await dialog.getByRole('textbox', { name: 'Last Name' }).fill('Testwell');
    await dialog.getByRole('textbox', { name: 'Email' }).fill('robin.testwell@example.com');
    await dialog.getByLabel('Role').click();
    await page.getByRole('option', { name: 'Nurse', exact: true }).click();
    await dialog.getByLabel('Staff Type').click();
    await page.getByRole('option', { name: 'ANP', exact: true }).click();
    await submit.click();
    await expect(toast(page, 'Invitation sent')).toBeVisible();
    await expect(staffTable(page, 'Sent Invitations').getByRole('row').nth(1)).toContainText('Robin Testwell');
    await expect(staffTable(page, 'Sent Invitations').getByRole('row').nth(1)).toContainText('Pending Invite');
  });

  test('downloads the .xlsx template and imports a valid and an invalid row', async ({ page }) => {
    await logIn(page);
    await page.goto(STAFF);
    await page.getByRole('button', { name: 'Bulk Import Staff' }).click();
    const dialog = page.getByRole('dialog', { name: 'Bulk Import Staff' });
    const submit = dialog.getByRole('button', { name: 'Import Staff' });
    await expect(submit).toBeDisabled();

    const downloading = page.waitForEvent('download');
    await dialog.getByRole('button', { name: 'Download Template' }).click();
    const download = await downloading;
    expect(download.suggestedFilename()).toBe('aqlios_staff_import_template.xlsx');
    const template = XLSX.read(readFileSync((await download.path())!), { type: 'buffer' });
    expect(template.SheetNames).toEqual(['Staff', 'Guidance']);
    expect(XLSX.utils.sheet_to_json<string[]>(template.Sheets.Staff, { header: 1 })[0]).toEqual([
      'First Name',
      'Last Name',
      'Email',
      'Role',
      'Staff Type',
    ]);

    // A wrong file type is refused before upload.
    await dialog.locator('input[type="file"]').setInputFiles({
      name: 'staff.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('First Name\n'),
    });
    await expect(dialog.getByText('Upload a .xlsx file.')).toBeVisible();

    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.aoa_to_sheet([
        ['First Name', 'Last Name', 'Email', 'Role', 'Staff Type'],
        ['Kit', 'Importer', 'kit.importer@example.com', 'Nurse', 'Nurse'],
        ['No', 'Email', '', 'Nurse', 'Nurse'],
      ]),
      'Staff',
    );
    await dialog.locator('input[type="file"]').setInputFiles({
      name: 'staff.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: XLSX.write(book, { bookType: 'xlsx', type: 'buffer' }) as Buffer,
    });
    await expect(dialog.getByText('staff.xlsx')).toBeVisible();
    await submit.click();
    await expect(toast(page, '1 staff imported')).toBeVisible();
    await expect(dialog.getByRole('alert').filter({ hasText: 'needs fixing' })).toContainText(
      'Row 3: Email is required',
    );
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await page.getByRole('textbox', { name: 'Search' }).fill('kit.importer');
    await expect(staffTable(page).getByRole('row').nth(1)).toContainText('Pending Invite');
  });

  test('locks and unlocks, archives and unarchives, and resends an invite', async ({ page }) => {
    await logIn(page);
    await page.goto(STAFF);
    await page.getByLabel('Status').click();
    await page.getByRole('option', { name: 'Active', exact: true }).click();
    const lock = staffTable(page)
      .getByRole('button', { name: /^Lock / })
      .first();
    const name = ((await lock.getAttribute('aria-label')) ?? '').replace(/^Lock /, '');
    await lock.click();
    const lockDialog = page.getByRole('dialog', { name: 'Lock User' });
    await expect(lockDialog).toContainText(name);
    await lockDialog.getByRole('button', { name: 'Lock User' }).click();
    await expect(toast(page, 'User locked')).toBeVisible();

    await page.getByLabel('Status').click();
    await page.getByRole('option', { name: 'Locked', exact: true }).click();
    await staffTable(page)
      .getByRole('button', { name: `Unlock ${name}` })
      .click();
    await page.getByRole('dialog', { name: 'Unlock User' }).getByRole('button', { name: 'Unlock User' }).click();
    await expect(toast(page, 'User unlocked')).toBeVisible();

    await page.getByRole('button', { name: 'Clear filters' }).click();
    await page.getByRole('textbox', { name: 'Search' }).fill(name);
    await staffTable(page)
      .getByRole('button', { name: `Archive ${name}` })
      .click();
    await page.getByRole('dialog', { name: 'Archive Staff' }).getByRole('button', { name: 'Archive Staff' }).click();
    await expect(toast(page, 'Staff archived')).toBeVisible();
    await page.getByRole('tab', { name: 'Archived Users' }).click();
    await staffTable(page, 'Archived Staff')
      .getByRole('button', { name: `Unarchive ${name}` })
      .click();
    await page
      .getByRole('dialog', { name: 'Unarchive Staff' })
      .getByRole('button', { name: 'Unarchive Staff' })
      .click();
    await expect(toast(page, 'Staff unarchived')).toBeVisible();
    await expect(page.getByText('No archived staff. Adjust your filters or search term.')).toBeVisible();

    await page.getByRole('tab', { name: 'Sent Invitations' }).click();
    await staffTable(page, 'Sent Invitations')
      .getByRole('button', { name: /^Resend invite to / })
      .first()
      .click();
    await expect(toast(page, 'Invitation resent')).toBeVisible();
  });
});

test.describe('staff member details', () => {
  test('saves Account Details and Leave, and validates fields', async ({ page }) => {
    await logIn(page);
    await openStaff(page, 'Usha');
    const save = page.getByRole('button', { name: 'Save Changes' });
    await expect(save).toBeDisabled();
    const phone = page.getByRole('textbox', { name: 'Phone number' }).first();
    await phone.fill('12');
    await phone.blur();
    await expect(page.getByText('Enter a valid phone number')).toBeVisible();
    await phone.fill('+44 7700 900123');
    await page.getByRole('textbox', { name: 'Spoken Language' }).fill('Welsh');
    await save.click();
    await expect(toast(page, 'Staff details saved')).toBeVisible();
    await expect(save).toBeDisabled();
    await page.reload();
    await expect(page.getByRole('textbox', { name: 'Spoken Language' })).toHaveValue('Welsh');

    await page.getByRole('tab', { name: 'Leave Management' }).click();
    await expect(page).toHaveURL(/tab=leave/);
    const annual = page.getByRole('spinbutton', { name: 'Duration (days)' }).first();
    await annual.fill('30');
    // Usha works 09:00–17:00 on weekdays, so a day is 8 hours.
    await expect(page.getByText('240 hours')).toBeVisible();
    await save.click();
    await expect(toast(page, 'Staff details saved')).toBeVisible();
  });

  test('a rejected compliance document shows on the CQC dashboard', async ({ page }) => {
    await logIn(page);
    await openStaff(page, 'Usha');
    await page.getByRole('tab', { name: 'Compliance' }).click();
    const row = page.getByRole('listitem', { name: 'Proof of address 1' });
    await row.getByRole('button', { name: /upload Proof of address 1$/i }).click();
    const upload = page.getByRole('dialog', { name: /Proof of address 1$/ });
    await upload.locator('input[type="file"]').setInputFiles({
      name: 'utility-bill.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 demo'),
    });
    await upload.getByRole('button', { name: 'Upload Document' }).click();
    await expect(toast(page, 'Document uploaded')).toBeVisible();
    await expect(row).toContainText('Pending Verification');
    await expect(row).toContainText('utility-bill.pdf');

    await row.getByRole('button', { name: 'Reject Proof of address 1' }).click();
    const reject = page.getByRole('dialog', { name: 'Reject Document' });
    await expect(reject.getByRole('button', { name: 'Reject Document' })).toBeDisabled();
    await reject.getByRole('textbox', { name: 'Reason' }).fill('The address is cut off.');
    await reject.getByRole('button', { name: 'Reject Document' }).click();
    await expect(toast(page, 'Document rejected')).toBeVisible();
    await expect(row).toContainText('Rejected: The address is cut off.');

    await page.goto('/verticals/public/compliance-dashboard/');
    await page.getByRole('textbox', { name: 'Search' }).fill('Usha Ingram');
    const rows = page.getByRole('table', { name: 'Staff compliance' }).getByRole('row');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(1)).toContainText('Rejected');
  });

  test('an unknown staff id shows "Staff member not found"', async ({ page }) => {
    await logIn(page);
    await page.goto(`${STAFF}not-a-person/`);
    await expect(page.getByText('Staff member not found')).toBeVisible();
  });
});

test.describe('profile', () => {
  test('practice users change their password with the captured rules', async ({ page }) => {
    await logIn(page, 'practice-user');
    await page.goto(`${PRACTICE}/profile/`);
    await expect(page.getByRole('heading', { name: 'Staff Member Details' })).toBeVisible();
    await page.getByRole('tab', { name: 'Leave Management' }).click();
    await expect(page.getByText('Your leave entitlement is set by your practice.', { exact: false })).toBeVisible();
    await page.getByRole('tab', { name: 'Security' }).click();

    const save = page.getByRole('button', { name: 'Save Changes' });
    await page.getByLabel(/^Current Password/).fill('wrong-password');
    await page.getByLabel(/^New Password/).fill('short');
    await page.getByLabel(/^Confirm New Password/).fill('different');
    await save.click();
    await expect(page.getByText('Passwords do not match')).toBeVisible();
    await expect(page.getByText(/^Password must be at least 12 characters/)).toBeVisible();

    await page.getByLabel(/^New Password/).fill('Strong!Passw0rd');
    await page.getByLabel(/^Confirm New Password/).fill('Strong!Passw0rd');
    await page.getByRole('button', { name: 'Show new password' }).click();
    await expect(page.getByLabel(/^New Password/)).toHaveAttribute('type', 'text');
    await save.click();
    await expect(page.getByText('Current password is incorrect')).toBeVisible();

    await page.getByLabel(/^Current Password/).fill('demo');
    await save.click();
    await expect(toast(page, 'Password updated')).toBeVisible();
    await expect(page.getByLabel(/^Current Password/)).toHaveValue('');
  });

  test('practice users can open the staff list and invite', async ({ page }) => {
    await logIn(page, 'practice-user');
    await page.goto(STAFF);
    await expect(staffTable(page).getByRole('row').nth(1)).toBeVisible();
    await page.getByRole('button', { name: 'Invite Staff' }).click();
    await page.getByRole('dialog', { name: 'Send Invite' }).getByLabel('Role').click();
    await expect(page.getByRole('option', { name: 'Clinician' })).toBeVisible();
  });
});
