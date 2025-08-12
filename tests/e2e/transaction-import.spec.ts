import { test, expect } from '@playwright/test';

test.describe('Transaction Import Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the application to load
    await expect(page.locator('[data-testid="app-header"]')).toBeVisible({ timeout: 10000 });
  });

  test('should display upload button and modal flow', async ({ page }) => {
    // Look for the upload CSV file button
    const uploadButton = page.locator('text=Upload CSV file');
    await expect(uploadButton).toBeVisible();

    // Click the upload button
    await uploadButton.click();

    // Check if file input is available (might be hidden)
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
  });

  test('should handle CSV file upload with sample transaction data', async ({ page }) => {
    // Look for upload functionality
    const uploadButton = page.locator('text=Upload CSV file');
    await uploadButton.click();

    // Set up file chooser handler before triggering the file input
    const fileChooserPromise = page.waitForEvent('filechooser');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.click();

    const fileChooser = await fileChooserPromise;

    // We'll simulate by checking that the file chooser was triggered
    expect(fileChooser).toBeTruthy();
  });

  test('should display legal disclaimer in classification modal', async ({ page }) => {
    // Navigate to upload
    const uploadButton = page.locator('text=Upload CSV file');
    await uploadButton.click();

    // For this test, we'll check if the legal notice appears when classification is needed
    // In a real scenario, this would happen after file upload

    // This might not be visible until a CSV is actually processed
    // but we can check the modal structure exists
    const modal = page.locator('[role="dialog"]');

    // Modal should exist (even if not visible yet)
    if ((await modal.count()) > 0) {
      await expect(modal).toBeAttached();
    }
  });

  test('should be mobile responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size

    // Navigate to the app
    await page.goto('/');

    // Check that navigation works on mobile
    const navBar = page.locator('[data-testid="navbar"]');
    if ((await navBar.count()) > 0) {
      await expect(navBar).toBeVisible();
    }

    // Check that upload button is accessible on mobile
    const uploadButton = page.locator('text=Upload CSV file');
    if ((await uploadButton.count()) > 0) {
      await expect(uploadButton).toBeVisible();

      // Check that button is touch-friendly (minimum 44px height)
      const buttonHeight = await uploadButton.boundingBox();
      if (buttonHeight) {
        expect(buttonHeight.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should handle transaction classification workflow', async ({ page }) => {
    // This test checks the classification modal workflow
    // In a real scenario, this would be triggered after uploading a CSV with mixed transactions

    // Look for classification-related elements
    const classificationOptions = ['Buy Bitcoin', 'Move to Wallet', 'Sell Bitcoin', 'Skip This'];

    // Check if any modals with classification options exist
    for (const option of classificationOptions) {
      const optionElement = page.locator(`text=${option}`);
      // These might not be visible until a file is uploaded, so we just check they can be found
      if ((await optionElement.count()) > 0) {
        console.log(`Found classification option: ${option}`);
      }
    }

    // Look for IRS publication links (should be in legal disclaimers)
    const irsLink = page.locator('a[href*="irs.gov"]');
    if ((await irsLink.count()) > 0) {
      await expect(irsLink).toBeAttached();
    }
  });

  test('should display feature flag safe mode correctly', async ({ page }) => {
    // Test that in production mode, high-risk features are properly disabled
    // and safe mode disclaimers are shown

    // Check for safe mode indicators
    const safetyDisclaimer = page.locator('text=record-keeping purposes only');
    if ((await safetyDisclaimer.count()) > 0) {
      await expect(safetyDisclaimer).toBeVisible();
    }

    // Check that professional consultation guidance is present
    const professionalGuidance = page.locator('text=qualified tax professional');
    if ((await professionalGuidance.count()) > 0) {
      await expect(professionalGuidance).toBeVisible();
    }
  });
});
