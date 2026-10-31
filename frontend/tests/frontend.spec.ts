import { test, expect, type Page } from '@playwright/test';
const id = '10000000-0000-4000-8000-000000000001';
const room = '20000000-0000-4000-8000-000000000001';
const category = {
  id: '30000000-0000-4000-8000-000000000001',
  name: 'Electronics',
};
const location = {
  id: '40000000-0000-4000-8000-000000000001',
  name: 'Library',
};
const report = {
  id,
  title: 'Blue headphones',
  description: 'A fictional test report.',
  report_type: 'lost',
  status: 'open',
  category,
  location,
  occurred_on: '2026-10-28',
  created_at: '2026-10-30T00:00:00.000Z',
  updated_at: '2026-10-30T00:00:00.000Z',
  recovered_at: null,
  images: [],
};
async function setup(page: Page, owner = false) {
  await page.route('http://localhost:3001/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const data =
      path === '/catalogs'
        ? { categories: [category], locations: [location] }
        : path === '/auth/login'
          ? {
              access_token: 'test-token',
              token_type: 'Bearer',
              expires_in: 86400,
            }
          : path === '/auth/me'
            ? {
                id: 'test-user',
                full_name: 'Test Student',
                email: 'test@example.invalid',
                student_number: 'TEST',
              }
            : path === '/auth/logout'
              ? { success: true }
              : path === '/me/reports'
                ? { items: owner ? [report] : [], next_cursor: null }
                : path === '/reports'
                  ? route.request().method() === 'POST'
                    ? { ...report, ...route.request().postDataJSON() }
                    : { items: [report], next_cursor: null }
                  : path === '/reports/' + id
                    ? report
                    : path === '/conversations'
                      ? route.request().method() === 'POST'
                        ? { id: room, report_id: id }
                        : {
                            items: [
                              {
                                id: room,
                                report_id: id,
                                report_title: report.title,
                                report_deleted: false,
                              },
                            ],
                            next_cursor: null,
                          }
                      : path.endsWith('/events')
                        ? null
                        : { items: [], next_cursor: null };
    if (path.endsWith('/events'))
      return route.fulfill({
        status: 503,
        json: { message: 'Offline for test' },
      });
    await route.fulfill({ status: 200, json: data });
  });
}
async function login(page: Page, next = '/my-posts') {
  await page.goto('/login?next=' + encodeURIComponent(next));
  await page.getByLabel('Email address').fill('test@example.invalid');
  await page.getByLabel('Password', { exact: true }).fill('Long-test-password');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(next.replaceAll('/', '\\/') + '$'));
}
test('public reports, filters, pagination and delayed responses', async ({
  page,
}) => {
  await setup(page);
  await page.route('http://localhost:3001/reports?**', async (route) => {
    const url = new URL(route.request().url());
    const q = url.searchParams.get('q');
    if (q === 'old') await new Promise((resolve) => setTimeout(resolve, 800));
    const item = {
      ...report,
      title: q ? q + ' result' : report.title,
      id: url.searchParams.has('cursor') ? room : id,
    };
    await route.fulfill({
      json: {
        items: [item],
        next_cursor:
          url.searchParams.has('cursor') || q ? null : 'opaque-cursor',
      },
    });
  });
  await page.goto('/items');
  await expect(page.getByRole('heading', { name: report.title })).toBeVisible();
  await page.getByRole('button', { name: 'Load more reports' }).click();
  await expect(page.getByRole('heading', { name: report.title })).toHaveCount(
    2,
  );
  await page.getByLabel('Keyword').fill('old');
  await page.waitForTimeout(450);
  await page.getByLabel('Keyword').fill('new');
  await expect(page.getByRole('heading', { name: 'new result' })).toBeVisible();
  await page.waitForTimeout(900);
  await expect(page.getByRole('heading', { name: 'old result' })).toHaveCount(
    0,
  );
  await page.getByLabel('Report type').selectOption('found');
  await expect(page).toHaveURL(/report_type=found/);
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page).toHaveURL('/items');
});
test('network error retries and empty results are distinct', async ({
  page,
}) => {
  await setup(page);
  let count = 0;
  await page.route('http://localhost:3001/reports?**', (route) =>
    ++count === 1
      ? route.abort()
      : route.fulfill({ json: { items: [], next_cursor: null } }),
  );
  await page.goto('/items');
  await expect(
    page.getByRole('alert').filter({ hasText: 'Cannot connect' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(
    page.getByRole('heading', { name: 'No reports found' }),
  ).toBeVisible();
});
test('owner publishes, edits and changes status using API', async ({
  page,
}) => {
  await setup(page, true);
  await login(page, '/post');
  await page.getByLabel('Title', { exact: true }).fill('Blue headphones');
  await page
    .getByRole('combobox', { name: 'Category', exact: true })
    .selectOption(category.id);
  await page
    .getByRole('combobox', { name: 'Location', exact: true })
    .selectOption(location.id);
  await page
    .getByLabel('Description', { exact: true })
    .fill('A fictional test report.');
  const post = page.waitForRequest(
    (req) => req.url().endsWith('/reports') && req.method() === 'POST',
  );
  await page.getByRole('button', { name: 'Publish report' }).click();
  expect((await post).postDataJSON()).not.toHaveProperty('author_id');
  await expect(
    page.getByRole('heading', { name: 'Manage your report' }),
  ).toBeVisible();
  const patch = page.waitForRequest((req) => req.method() === 'PATCH');
  await page.getByRole('button', { name: 'Mark as recovered' }).click();
  expect((await patch).postDataJSON()).toEqual({ status: 'recovered' });
  await page.getByRole('link', { name: 'Edit report', exact: true }).click();
  await expect(page.getByLabel('Report type')).toBeDisabled();
  await page.getByLabel('Title', { exact: true }).fill('Updated title');
  const edit = page.waitForRequest((req) => req.method() === 'PATCH');
  await page.getByRole('button', { name: 'Save changes' }).click();
  expect((await edit).postDataJSON()).not.toHaveProperty('report_type');
});
test('image validation, multipart upload and server failures', async ({
  page,
}) => {
  await setup(page, true);
  await login(page, '/items/' + id);
  const input = page.getByLabel('Add a photo');
  await input.setInputFiles({
    name: 'unsafe.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from('<svg/>'),
  });
  await expect(
    page.getByRole('alert').filter({ hasText: 'Choose a JPEG' }),
  ).toBeVisible();
  await input.setInputFiles({
    name: 'test.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAO0lEQVRIiWNQTX5NU8QwakHyaBC9Hk1FqqMZ7fVoUaE6Wpomj1Y4qqNVZvJoq+L1aMMrebTp+HpQt64Bwy3MTGkww7oAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await page.route('http://localhost:3001/reports/' + id + '/images', (route) =>
    route.fulfill({ status: 413, json: { message: 'Image too large' } }),
  );
  const upload = page.waitForRequest(
    (req) => req.url().endsWith('/images') && req.method() === 'POST',
  );
  await page.getByRole('button', { name: 'Upload photo' }).click();
  expect((await upload).headers()['content-type']).toContain(
    'multipart/form-data',
  );
  await expect(
    page.getByRole('alert').filter({ hasText: 'Image too large' }),
  ).toBeVisible();
});
test('private chat retries the same message key and clears auth on 401', async ({
  page,
}) => {
  await setup(page);
  await login(page, '/inbox/' + room);
  const payloads: object[] = [];
  await page.route(
    'http://localhost:3001/conversations/' + room + '/messages',
    async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      const body = route.request().postDataJSON();
      payloads.push(body);
      if (payloads.length === 1) return route.abort();
      await route.fulfill({
        json: {
          ...body,
          id,
          conversation_id: room,
          sender_id: 'test-user',
          created_at: '2026-10-30T01:00:00Z',
        },
      });
    },
  );
  await page.getByLabel('Message', { exact: true }).fill('Is this yours?');
  await page.getByRole('button', { name: 'Send message' }).click();
  await page.getByRole('button', { name: 'Retry same message' }).click();
  expect(payloads[0]).toEqual(payloads[1]);
  await expect(page.getByRole('list', { name: 'Messages' })).toContainText(
    'Is this yours?',
  );
  await page.route(
    'http://localhost:3001/conversations/' + room + '/messages?**',
    (route) => route.fulfill({ status: 401, json: { message: 'Expired' } }),
  );
  await page.getByRole('button', { name: 'Reconnect / refresh' }).click();
  await expect(
    page.getByRole('heading', { name: 'Sign in to continue' }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem('access_token')),
  ).toBeNull();
});
test('direct links, non-owner controls, refresh session and mobile layout', async ({
  page,
}, info) => {
  await setup(page);
  await page.goto('/items/' + id);
  await expect(page.getByRole('heading', { name: report.title })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Edit report', exact: true }),
  ).toHaveCount(0);
  await login(page, '/items/' + id);
  await expect(
    page.getByRole('button', { name: 'Open conversation' }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: info.outputPath('report-layout.png'),
    fullPage: true,
  });
  await page.reload();
  await expect(
    page.getByRole('link', { name: 'Sign in to contact' }),
  ).toBeVisible();
});

test('reconnect recovers more than one page of missed messages without duplicates', async ({
  page,
}) => {
  await setup(page);
  let offlineGap = false;
  const old = {
    id: 'old-message',
    conversation_id: room,
    sender_id: 'other',
    client_message_id: id,
    body: 'Original message',
    created_at: '2026-10-30T00:00:00Z',
  };
  const missed = Array.from({ length: 55 }, (_, i) => ({
    ...old,
    id: 'missed-' + i,
    body: 'Recovered message ' + i,
    created_at: new Date(
      Date.parse(old.created_at) + (i + 1) * 1000,
    ).toISOString(),
  })).reverse();
  await page.route(
    'http://localhost:3001/conversations/' + room + '/messages?**',
    (route) => {
      const next = new URL(route.request().url()).searchParams.has('cursor');
      return route.fulfill({
        json: !offlineGap
          ? { items: [old], next_cursor: null }
          : next
            ? { items: [...missed.slice(50), old], next_cursor: null }
            : { items: missed.slice(0, 50), next_cursor: 'missed-page' },
      });
    },
  );
  await login(page, '/inbox/' + room);
  await expect(page.getByRole('list', { name: 'Messages' })).toContainText(
    'Original message',
  );
  offlineGap = true;
  await page.getByRole('button', { name: 'Reconnect / refresh' }).click();
  await expect(
    page.getByRole('list', { name: 'Messages' }).getByRole('listitem'),
  ).toHaveCount(56);
  await page.getByRole('button', { name: 'Reconnect / refresh' }).click();
  await expect(
    page.getByRole('list', { name: 'Messages' }).getByRole('listitem'),
  ).toHaveCount(56);
});
