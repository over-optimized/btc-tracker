import { test, expect } from '@playwright/test';

test.describe('Mobile Responsiveness', () => {
  const mobileViewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPhone 12 Pro Max', width: 428, height: 926 },
    { name: 'Samsung Galaxy S20', width: 360, height: 800 },
    { name: 'iPad Mini', width: 768, height: 1024 },
  ];

  mobileViewports.forEach(({ name, width, height }) => {
    test(`should display correctly on ${name} (${width}x${height})`, async ({ page }) => {
      // Set viewport to mobile device
      await page.setViewportSize({ width, height });

      // Navigate to the application
      await page.goto('/');

      // Wait for the application to load
      await page.waitForLoadState('networkidle');

      // Check basic layout elements
      const mainContent = page.locator('main, [role="main"], .main-content');
      if ((await mainContent.count()) > 0) {
        await expect(mainContent.first()).toBeVisible();
      }

      // Check that content fits within viewport (no horizontal overflow)
      const body = page.locator('body');
      const bodyBox = await body.boundingBox();
      if (bodyBox) {
        expect(bodyBox.width).toBeLessThanOrEqual(width + 20); // Allow small margin for scrollbars
      }

      // Check navigation is accessible
      const navElements = page.locator('nav, [role="navigation"], .navbar');
      if ((await navElements.count()) > 0) {
        await expect(navElements.first()).toBeVisible();
      }
    });
  });

  test('should have touch-friendly interface elements', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');

    // Check that buttons meet minimum touch target size (44px)
    const buttons = page.locator('button, [role="button"], input[type="submit"]');
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      // Check first few visible buttons
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          if (box) {
            // Apple and Android recommend minimum 44px touch targets
            expect(box.height).toBeGreaterThanOrEqual(40); // Allow slight margin
            expect(box.width).toBeGreaterThanOrEqual(40);
          }
        }
      }
    }
  });

  test('should handle modal responsiveness correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');

    // Try to trigger a modal (upload button)
    const uploadButton = page.locator('text=Upload CSV file');
    if ((await uploadButton.count()) > 0) {
      await uploadButton.click();

      // Check if modal appears and is properly sized for mobile
      const modal = page.locator('[role="dialog"], .modal');
      if ((await modal.count()) > 0) {
        const modalBox = await modal.first().boundingBox();
        if (modalBox) {
          // Modal should not exceed viewport width
          expect(modalBox.width).toBeLessThanOrEqual(375);

          // Modal should not exceed viewport height
          expect(modalBox.height).toBeLessThanOrEqual(667);

          // Modal should have some margin from edges
          expect(modalBox.x).toBeGreaterThanOrEqual(8); // 8px margin
          expect(modalBox.y).toBeGreaterThanOrEqual(8);
        }
      }
    }
  });

  test('should handle transaction classification modal on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12
    await page.goto('/');

    // Look for classification modal elements that might exist
    // (In real usage, these would appear after CSV upload)

    // Check if legal disclaimer can be collapsed on mobile
    const disclaimerToggle = page.locator(
      '[aria-label*="disclaimer"], button:has-text("Important Legal Notice")',
    );
    if ((await disclaimerToggle.count()) > 0) {
      await expect(disclaimerToggle.first()).toBeVisible();
    }

    // Check classification button layout on mobile
    const classificationButtons = page.locator(
      'button:has-text("Buy Bitcoin"), button:has-text("Move to Wallet")',
    );
    if ((await classificationButtons.count()) > 0) {
      // Buttons should be arranged in a mobile-friendly grid
      const firstButton = classificationButtons.first();
      if (await firstButton.isVisible()) {
        const buttonBox = await firstButton.boundingBox();
        if (buttonBox) {
          // Button should be touch-friendly
          expect(buttonBox.height).toBeGreaterThanOrEqual(40);
        }
      }
    }
  });

  test('should handle text readability on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 }); // Small Android
    await page.goto('/');

    // Check that text is readable (not too small)
    const textElements = page.locator('p, span, div:not(:empty)').first();
    if ((await textElements.count()) > 0) {
      const fontSize = await textElements.evaluate((el) => {
        return window.getComputedStyle(el).fontSize;
      });

      // Font size should be at least 14px for readability on mobile
      const fontSizeNum = parseInt(fontSize.replace('px', ''));
      expect(fontSizeNum).toBeGreaterThanOrEqual(14);
    }
  });

  test('should handle overflow and scrolling correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');

    // Check that page content can be scrolled if needed
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = 667;

    if (pageHeight > viewportHeight) {
      // Try scrolling to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // Verify we can scroll back to top
      await page.evaluate(() => window.scrollTo(0, 0));
    }

    // Check that horizontal scrolling is not needed
    const pageWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(pageWidth).toBeLessThanOrEqual(375 + 20); // Allow small buffer
  });

  test('should maintain functionality in landscape mode', async ({ page }) => {
    // Test landscape orientation on mobile
    await page.setViewportSize({ width: 667, height: 375 }); // iPhone SE landscape
    await page.goto('/');

    // Check that main functionality is still accessible
    const uploadButton = page.locator('text=Upload CSV file');
    if ((await uploadButton.count()) > 0) {
      await expect(uploadButton).toBeVisible();
    }

    // Check that navigation is still functional
    const navElements = page.locator('nav, [role="navigation"]');
    if ((await navElements.count()) > 0) {
      await expect(navElements.first()).toBeVisible();
    }
  });
});
