import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

// Opt-in only: start the backend against its dedicated _test database first.
const live = process.env.LIVE_API_URL;
test('two accounts use real reports, photos and private chat', async ({
  browser,
  request,
}, info) => {
  test.skip(
    !live || info.project.name !== 'desktop',
    'Requires a dedicated local test backend.',
  );
  test.setTimeout(120000);
  if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(live!))
    throw new Error('Local test backend required');
  const key = randomUUID();
  const title = 'Live notebook ' + key;
  const password = 'Live-test-' + randomUUID();
  const users = ['owner', 'visitor'].map((role) => ({
    email: `frontend-live-20261031-${role}-${key}@example.invalid`,
    password,
    full_name: role + ' Test',
    student_number: role + key,
  }));
  for (const user of users)
    expect(
      (await request.post(live + '/auth/register', { data: user })).status(),
    ).toBe(201);
  const contexts = await Promise.all(users.map(() => browser.newContext()));
  try {
    const pages = await Promise.all(
      contexts.map(async (context, index) => {
        // Only rewrite the test target; requests still reach the real API.
        await context.route('http://localhost:3001/**', (route) =>
          route.continue({
            url:
              live +
              new URL(route.request().url()).pathname +
              new URL(route.request().url()).search,
          }),
        );
        const page = await context.newPage();
        await page.goto('http://localhost:3030/login?next=/post');
        await page.getByLabel('Email address').fill(users[index].email);
        await page.getByLabel('Password', { exact: true }).fill(password);
        await page.getByRole('button', { name: 'Log in', exact: true }).click();
        await expect(page).toHaveURL(/\/post$/);
        return page;
      }),
    );
    const [owner, visitor] = pages;
    await owner
      .getByLabel('Title', { exact: true })
      .fill(title);
    await owner
      .getByRole('combobox', { name: 'Category', exact: true })
      .selectOption({ label: 'Other' });
    await owner
      .getByRole('combobox', { name: 'Location', exact: true })
      .selectOption({ label: 'Library' });
    await owner
      .getByLabel('Description', { exact: true })
      .fill('Disposable end-to-end test report.');
    await owner.getByRole('button', { name: 'Publish report' }).click();
    await expect(
      owner.getByRole('heading', { name: 'Manage your report' }),
    ).toBeVisible();
    const reportUrl = owner.url();
    await owner
      .getByLabel('Add a photo')
      .setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAO0lEQVRIiWNQTX5NU8QwakHyaBC9Hk1FqqMZ7fVoUaE6Wpomj1Y4qqNVZvJoq+L1aMMrebTp+HpQt64Bwy3MTGkww7oAAAAASUVORK5CYII=',
          'base64',
        ),
      });
    await owner.getByRole('button', { name: 'Upload photo' }).click();
    await expect(
      owner.getByRole('heading', { name: 'Photos (1/3)' }),
    ).toBeVisible();
    await owner.screenshot({
      path: info.outputPath('live-report.png'),
      fullPage: true,
    });
    // Client navigation preserves the deliberately memory-only session.
    await visitor
      .getByRole('link', { name: 'Browse items', exact: true })
      .first()
      .click();
    await visitor.getByLabel('Keyword').fill(key);
    await visitor
      .getByRole('link')
      .filter({
        has: visitor.getByRole('heading', { name: title }),
      })
      .click();
    await expect(visitor).toHaveURL(reportUrl);
    await expect(
      visitor.getByRole('link', { name: 'Edit report', exact: true }),
    ).toHaveCount(0);
    await visitor.getByRole('button', { name: 'Open conversation' }).click();
    await expect(
      visitor.getByRole('heading', { name: 'Conversation', exact: true }),
    ).toBeVisible();
    await visitor
      .getByLabel('Message', { exact: true })
      .fill('Hello from the visitor');
    await visitor.getByRole('button', { name: 'Send message' }).click();
    await expect(visitor.getByRole('list', { name: 'Messages' })).toContainText(
      'Hello from the visitor',
    );
    await owner
      .getByRole('link', { name: 'Inbox', exact: true })
      .first()
      .click();
    await owner
      .getByRole('link')
      .filter({
        has: owner.getByRole('heading', { name: title }),
      })
      .click();
    await expect(owner.getByRole('list', { name: 'Messages' })).toContainText(
      'Hello from the visitor',
    );
    await owner
      .getByLabel('Message', { exact: true })
      .fill('Hello from the owner');
    await owner.getByRole('button', { name: 'Send message' }).click();
    await expect(visitor.getByRole('list', { name: 'Messages' })).toContainText(
      'Hello from the owner',
    );
    await visitor.screenshot({
      path: info.outputPath('live-chat.png'),
      fullPage: true,
    });
    await owner
      .getByRole('link', { name: 'My posts', exact: true })
      .first()
      .click();
    await owner
      .getByRole('link')
      .filter({
        has: owner.getByRole('heading', { name: title }),
      })
      .click();
    owner.once('dialog', (dialog) => dialog.accept());
    await owner.getByRole('button', { name: 'Remove photo' }).click();
    await expect(
      owner.getByRole('heading', { name: 'Photos (0/3)' }),
    ).toBeVisible();
    await owner.getByRole('button', { name: 'Mark as recovered' }).click();
    await expect(
      owner.getByRole('button', { name: 'Reopen report' }),
    ).toBeVisible();
    owner.once('dialog', (dialog) => dialog.accept());
    await owner.getByRole('button', { name: 'Delete report' }).click();
    await expect(owner).toHaveURL(/\/my-posts$/);
    expect(
      (
        await request.get(
          live + new URL(reportUrl).pathname.replace('/items/', '/reports/'),
        )
      ).status(),
    ).toBe(404);
    await visitor
      .getByLabel('Message', { exact: true })
      .fill('This must not be saved');
    await visitor.getByRole('button', { name: 'Send message' }).click();
    await expect(
      visitor.getByRole('alert').filter({ hasText: 'read-only' }),
    ).toBeVisible();
  } finally {
    for (const context of contexts) await context.close();
  }
});
