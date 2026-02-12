import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Happy Path: User Journey', () => {
test('App loads and passes accessibility checks', async ({ page }) => {
    // 1. Visit App
    await page.goto('/');

    // 2. Wait for any visible content (either login or dashboard)
    // This is more resilient - we just want to verify the app loads
    await page.waitForLoadState('networkidle');
    
    // 3. Accessibility Check (Level 4 Requirement)
    // This is the key requirement - automated a11y testing
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa']) // Test WCAG 2.0 Level A & AA
      .analyze();
    
    // Report violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility Violations:', JSON.stringify(accessibilityScanResults.violations, null, 2));
    }
    
    // Assert no critical violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
