import { test, expect } from '@playwright/test';

test.describe('Admin panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('admin login page is accessible', async ({ page }) => {
    await expect(page).toHaveURL('/admin');
    await expect(page.getByRole('heading', { name: /Sign in|Connexion/i })).toBeVisible({ timeout: 10_000 });
  });

  test('login form has email and password fields', async ({ page }) => {
    await expect(page.getByLabel(/Email|E-mail/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel(/Password|Mot de passe/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In|Se connecter/i })).toBeVisible();
  });

  test('shows error on wrong credentials', async ({ page }) => {
    await page.getByLabel(/Email|E-mail/i).fill('wrong@example.com');
    await page.getByLabel(/Password|Mot de passe/i).fill('wrongpassword');
    await page.getByRole('button', { name: /Sign In|Se connecter/i }).click();
    await expect(
      page.locator('text=/Invalid credentials|Identifiants invalides/i')
    ).toBeVisible({ timeout: 8_000 });
  });

  test('login page shows in French when language is FR', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('panorama-lang', 'fr'));
    await page.reload();
    await expect(page.getByRole('heading', { name: /Connexion/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=/Personnel UIA autorisé/i')).toBeVisible();
  });
});
