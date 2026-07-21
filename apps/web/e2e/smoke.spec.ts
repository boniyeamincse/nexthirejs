import { test, expect } from '@playwright/test';

test('home page loads and main heading is visible', async ({ page }) => {
  await page.goto('/');
  const heading = page.getByRole('heading', { level: 1, name: /NextHire/i });
  await expect(heading).toBeVisible();
});

test('navigate to status page', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Status' })
    .click();
  await expect(page).toHaveURL('/status');
  const heading = page.getByRole('heading', { level: 1, name: /Platform Status/i });
  await expect(heading).toBeVisible();
});

test('unknown route shows custom not-found page', async ({ page }) => {
  await page.goto('/does-not-exist');
  await expect(page.getByText('404')).toBeVisible();
  await expect(page.getByText('Page not found')).toBeVisible();
  await expect(page.getByRole('link', { name: /Go home/i })).toBeVisible();
});
