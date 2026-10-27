import { expect, test, type Page } from '@playwright/test';

const SUB_APP = '3b668066-ab7e-4a11-ae82-01af30ff5cef';

async function call(page: Page, path: string, body?: unknown) {
  return page.evaluate(
    async ({ path, body }) => {
      const response = await fetch(path, {
        method: body === undefined ? 'GET' : 'POST',
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return { status: response.status, body: await response.json().catch(() => null) };
    },
    { path, body },
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // The app renders only once the mock worker is running.
  await expect(page.getByRole('heading', { name: 'Aqlios rebuild: theme check' })).toBeVisible();
  await call(page, '/api/mock/reset', {});
  await call(page, '/api/auth/logout', {});
});

test('demo login and session', async ({ page }) => {
  expect((await call(page, '/api/auth/me')).status).toBe(401);
  expect((await call(page, '/api/auth/login', { email: 'x@y.z', password: 'wrong' })).status).toBe(401);
  expect((await call(page, '/api/auth/login', { email: 'x@y.z', password: 'demo' })).status).toBe(200);

  const me = await call(page, '/api/auth/me');
  expect(me.status).toBe(200);
  expect(me.body.user).toMatchObject({ role: 'super-admin', isAdmin: true });

  expect((await call(page, '/api/auth/logout', {})).status).toBe(200);
  expect((await call(page, '/api/crm/api/users/v1/profile')).status).toBe(401);
});

test('practices list matches the live API shape and rules', async ({ page }) => {
  await call(page, '/api/auth/login', { email: 'x@y.z', password: 'demo' });
  const base = `/api/crm/api/practice-management/v1/sub-apps/${SUB_APP}/practices`;

  const list = await call(page, `${base}?page=1&page_size=10&ordering=-created_at`);
  expect(list.status).toBe(200);
  expect(list.body.status).toEqual({ code: 200, message: 'Success' });
  expect(list.body.errors).toEqual([]);
  expect(list.body.data.count).toBe(155);
  expect(list.body.data.results).toHaveLength(10);
  expect(list.body.data.next).toContain('page=2');
  expect(list.body.data.results[0]).not.toHaveProperty('secret_key');

  const capped = await call(page, `${base}?page_size=1000`);
  expect(capped.body.data.results).toHaveLength(100);

  const detail = await call(page, `${base}/${list.body.data.results[0].id}`);
  expect(detail.body.data.practice_name).toBe(list.body.data.results[0].practice_name);

  const unknown = await call(page, `${base}/00000000-0000-0000-0000-000000000000`);
  expect(unknown.status).toBe(403);
});

test('practice user sees only their practices and no roles', async ({ page }) => {
  await call(page, '/api/auth/login', { email: 'x@y.z', password: 'demo' });
  await call(page, '/api/mock/persona', { persona: 'practice-user' });

  const me = await call(page, '/api/auth/me');
  expect(me.body.user).toMatchObject({ role: '', isAdmin: false });

  const list = await call(page, `/api/crm/api/practice-management/v1/sub-apps/${SUB_APP}/practices`);
  expect(list.body.data.count).toBe(2);

  const roles = await call(page, `/api/crm/api/users/sub-apps/${SUB_APP}/roles`);
  expect(roles.status).toBe(403);
  expect(roles.body.status.message).toBe('You do not have permission to perform this action!');
});
