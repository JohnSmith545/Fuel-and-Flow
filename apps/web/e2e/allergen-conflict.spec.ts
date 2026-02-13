// Tests the application's ability to detect and warn users about food allergen conflicts during the logging process.
import { test, expect } from '@playwright/test';

test.describe('Sad Path: Allergen Conflict', () => {
  test('shows safety alert when selecting food with allergen conflict', async ({ page }) => {
    await page.goto('/nutrition');
    await page.waitForLoadState('networkidle');

    // "Peanut Butter Sandwich" contains 'peanuts' — conflicts with mock profile allergens
    const peanutButterItem = page.locator('text=Peanut Butter Sandwich');
    await expect(peanutButterItem).toBeVisible();

    // Click the food item to trigger the safety check
    await peanutButterItem.click();

    // SafetyModal should appear
    const safetyAlert = page.locator('text=Safety Alert');
    await expect(safetyAlert).toBeVisible();

    // Verify the modal describes the conflict (scoped to the modal's border-red container)
    const modal = page.locator('.border-red-600');
    await expect(modal.locator('strong', { hasText: 'peanuts' })).toBeVisible();
    await expect(modal.locator('text=exclusion list')).toBeVisible();

    // Both action buttons should be present
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    await expect(page.locator('button:has-text("I understand the risk")')).toBeVisible();

    // Click Cancel to dismiss
    await page.locator('button:has-text("Cancel")').click();

    // Modal should be gone
    await expect(safetyAlert).not.toBeVisible();

    // Meal should NOT have been logged
    await expect(page.locator('text=Meal Logged!')).not.toBeVisible();
  });

  test('no safety alert for safe food items', async ({ page }) => {
    await page.goto('/nutrition');
    await page.waitForLoadState('networkidle');

    // "Oatmeal" has ingredients: ['oats'] — no conflict with ['peanuts', 'dairy']
    const oatmealItem = page.locator('text=Oatmeal');
    await expect(oatmealItem).toBeVisible();

    await oatmealItem.click();

    // Safety Alert should NOT appear for safe food
    await expect(page.locator('text=Safety Alert')).not.toBeVisible({ timeout: 2000 });
  });
});
