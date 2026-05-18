import { test, expect } from '@playwright/test';

test.describe('Submit project form', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('panorama-lang', 'en'));
    await page.goto('/submit');
  });

  test('submit page loads in English', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Submit Your Project/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=/UIA experts/i')).toBeVisible();
  });

  test('submit page loads in French', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('panorama-lang', 'fr'));
    await page.reload();
    await expect(page.getByRole('heading', { name: /Soumettre votre projet/i })).toBeVisible({ timeout: 10_000 });
  });

  test('required fields show validation errors on empty submit', async ({ page }) => {
    // Click submit without filling in any fields
    const submitBtn = page.getByRole('button', { name: /Submit Project|Soumettre le projet/i }).last();
    await submitBtn.click();
    // At least one validation error should appear
    await expect(page.locator('text=/required|obligatoire/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('contact section fields are visible', async ({ page }) => {
    await expect(page.getByLabel(/Organization Name|Nom de l'organisation/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel(/Contact Person|Personne de contact/i)).toBeVisible();
    await expect(page.getByLabel(/Contact Email|E-mail de contact/i)).toBeVisible();
  });

  test('GDPR consent checkbox is present', async ({ page }) => {
    await expect(page.locator('input[type="checkbox"]').last()).toBeVisible({ timeout: 10_000 });
  });
});
