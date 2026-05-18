import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders hero section with title and CTAs', async ({ page }) => {
    await expect(page.locator('h1, h2').filter({ hasText: /Showcase|Mettez/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Explore|Explorer/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Submit|Soumettre/i }).first()).toBeVisible();
  });

  test('shows KPI counters', async ({ page }) => {
    // KPI section contains numeric counters
    await expect(page.locator('text=/\\d+/')).not.toHaveCount(0);
  });

  test('header shows site title and subtitle', async ({ page }) => {
    await expect(page.getByRole('banner')).toContainText(/Panorama (SDG|ODD)/);
    await expect(page.getByRole('banner')).toContainText(/Union/i);
  });

  test('navigation links are present', async ({ page }) => {
    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: /Home|Accueil/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Explore|Explorer/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Submit|Soumettre/i })).toBeVisible();
  });

  test('footer is present with copyright text', async ({ page }) => {
    await expect(page.getByRole('contentinfo')).toContainText(/2026/);
    await expect(page.getByRole('contentinfo')).toContainText(/Union/i);
  });
});
