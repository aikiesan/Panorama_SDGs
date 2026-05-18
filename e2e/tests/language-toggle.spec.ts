import { test, expect } from '@playwright/test';

test.describe('Language toggle (EN / FR)', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh with English forced via localStorage
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('panorama-lang', 'en'));
    await page.reload();
  });

  test('defaults to English on first visit', async ({ page }) => {
    await expect(page.getByRole('banner')).toContainText('Panorama SDG');
    await expect(page.getByRole('banner')).toContainText('Union of International Architects');
  });

  test('switches to French when FR is clicked', async ({ page }) => {
    const frButton = page.getByRole('button', { name: /toggle language/i });
    await frButton.click();
    // Wait for language to change
    await expect(page.getByRole('banner')).toContainText('Union Internationale des Architectes', { timeout: 3000 });
    await expect(page.getByRole('banner')).toContainText('Panorama ODD');
  });

  test('persists language choice across page navigation', async ({ page }) => {
    // Switch to French
    await page.getByRole('button', { name: /toggle language/i }).click();
    await expect(page.getByRole('banner')).toContainText('Union Internationale des Architectes', { timeout: 3000 });

    // Navigate to dashboard and back
    await page.goto('/dashboard');
    await expect(page.getByRole('banner')).toContainText('Union Internationale des Architectes');

    await page.goto('/');
    await expect(page.getByRole('banner')).toContainText('Union Internationale des Architectes');
  });

  test('switches back to English when EN is clicked', async ({ page }) => {
    // Switch to French first
    await page.getByRole('button', { name: /toggle language/i }).click();
    await expect(page.getByRole('banner')).toContainText('Union Internationale des Architectes', { timeout: 3000 });

    // Switch back to English
    await page.getByRole('button', { name: /toggle language/i }).click();
    await expect(page.getByRole('banner')).toContainText('Union of International Architects', { timeout: 3000 });
  });

  test('footer copyright updates with language', async ({ page }) => {
    const footer = page.getByRole('contentinfo');
    await expect(footer).toContainText('International Union of Architects');

    await page.getByRole('button', { name: /toggle language/i }).click();
    await expect(footer).toContainText('Union Internationale des Architectes', { timeout: 3000 });
  });

  test('nav links translate to French', async ({ page }) => {
    await page.getByRole('button', { name: /toggle language/i }).click();
    await expect(page.getByRole('navigation')).toContainText('Accueil', { timeout: 3000 });
    await expect(page.getByRole('navigation')).toContainText('Explorer les projets');
  });
});
