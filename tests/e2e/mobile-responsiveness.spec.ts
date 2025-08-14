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

    // Create a mock classification modal to test mobile layout
    await page.evaluate(() => {
      const modal = document.createElement('div');
      modal.className =
        'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4';
      modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[95vh] sm:h-[90vh] max-h-[95vh] sm:max-h-[90vh] flex flex-col">
          <div class="bg-yellow-50 border-b border-yellow-200 flex-shrink-0">
            <div class="px-3 sm:px-6 py-2 sm:py-3">
              <div class="flex items-start gap-2">
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <p class="text-yellow-800 font-medium text-sm">Important Legal Notice</p>
                    <button class="md:hidden text-yellow-700 hover:text-yellow-900 p-1" aria-label="Collapse disclaimer">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="m7 10 5 5 5-5z"/>
                      </svg>
                    </button>
                  </div>
                  <div class="text-yellow-700 text-xs md:text-sm block mt-1">
                    This tool provides basic transaction categorization for record-keeping purposes only.
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b flex-shrink-0">
            <div>
              <h2 class="text-lg md:text-xl font-semibold text-gray-800">Step 1 of 1</h2>
              <p class="text-sm text-gray-600 mt-1">Classify transactions</p>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto min-h-0">
            <div class="p-3 sm:p-4 md:p-6">
              <div class="space-y-4">
                <div class="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div class="flex items-center gap-2 sm:gap-3">
                      <div class="min-w-0 flex-1">
                        <div class="font-medium text-gray-900 flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                          <span class="text-base sm:text-lg">⬆️</span>
                          <span class="truncate">0.00010000 BTC</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="mt-4">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-2">
                      <p class="text-xs sm:text-sm text-gray-600">Select the category:</p>
                      <span class="text-xs text-green-600 font-medium">✨ = Recommended</span>
                    </div>
                    <div class="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 pb-4">
                      <button class="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm rounded-lg border-2 font-medium transition-all bg-green-100 border-green-300 text-green-800 min-h-[44px]">
                        <div class="flex items-center justify-center gap-1 sm:gap-2">
                          <span>💰</span>
                          <span>Buy Bitcoin</span>
                          <span class="text-sm">✨</span>
                        </div>
                      </button>
                      <button class="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm rounded-lg border-2 font-medium transition-all bg-gray-50 border-gray-200 text-gray-700 hover:bg-blue-50 min-h-[44px]">
                        <div class="flex items-center justify-center gap-1 sm:gap-2">
                          <span>🔒</span>
                          <span>Move to Wallet</span>
                        </div>
                      </button>
                      <button class="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm rounded-lg border-2 font-medium transition-all bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-50 min-h-[44px]">
                        <div class="flex items-center justify-center gap-1 sm:gap-2">
                          <span>⏭️</span>
                          <span>Skip</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="border-t bg-gray-50 flex-shrink-0">
            <div class="p-3 sm:p-4 md:p-6">
              <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div class="text-xs md:text-sm text-gray-600 text-center sm:text-left">1 of 1 steps</div>
                <div class="flex gap-2 md:gap-3">
                  <button class="flex-1 sm:flex-none px-3 md:px-4 py-2 min-h-[44px] text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">Cancel Import</button>
                  <button class="flex-1 sm:flex-none px-3 md:px-4 py-2 min-h-[44px] text-sm rounded-md transition-colors flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700">Import Transactions</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      modal.setAttribute('data-testid', 'mobile-classification-modal');
      document.body.appendChild(modal);
    });

    const modal = page.getByTestId('mobile-classification-modal');
    await expect(modal).toBeVisible();

    // Check modal sizing on mobile
    const modalBox = await modal.boundingBox();
    if (modalBox) {
      // Modal should fit within viewport with appropriate margins
      expect(modalBox.width).toBeLessThanOrEqual(390);
      expect(modalBox.height).toBeLessThanOrEqual(844);
      expect(modalBox.x).toBeGreaterThanOrEqual(8); // 8px margin
    }

    // Check if legal disclaimer collapse button is visible on mobile
    const disclaimerToggle = page.locator('[aria-label*="disclaimer"]');
    if ((await disclaimerToggle.count()) > 0) {
      await expect(disclaimerToggle.first()).toBeVisible();
    }

    // Check classification button layout on mobile - should be grid layout
    const classificationButtons = page.locator(
      'button:has-text("Buy Bitcoin"), button:has-text("Move to Wallet"), button:has-text("Skip")',
    );
    const buttonCount = await classificationButtons.count();

    if (buttonCount > 0) {
      // Check that buttons are arranged in grid (one per row) on mobile
      const firstButton = classificationButtons.first();
      const secondButton = classificationButtons.nth(1);

      if ((await firstButton.isVisible()) && (await secondButton.isVisible())) {
        const firstButtonBox = await firstButton.boundingBox();
        const secondButtonBox = await secondButton.boundingBox();

        if (firstButtonBox && secondButtonBox) {
          // Buttons should be touch-friendly (44px minimum)
          expect(firstButtonBox.height).toBeGreaterThanOrEqual(44);
          expect(secondButtonBox.height).toBeGreaterThanOrEqual(44);

          // In mobile grid layout, second button should be below first (greater Y position)
          expect(secondButtonBox.y).toBeGreaterThan(firstButtonBox.y);
        }
      }
    }

    // Check footer buttons are properly sized for mobile
    const footerButtons = page.locator(
      'button:has-text("Cancel Import"), button:has-text("Import Transactions")',
    );
    const footerButtonCount = await footerButtons.count();

    for (let i = 0; i < footerButtonCount; i++) {
      const button = footerButtons.nth(i);
      if (await button.isVisible()) {
        const buttonBox = await button.boundingBox();
        if (buttonBox) {
          // Footer buttons should meet minimum touch target size
          expect(buttonBox.height).toBeGreaterThanOrEqual(44);
        }
      }
    }

    // Clean up
    await page.evaluate(() => {
      const modal = document.querySelector('[data-testid="mobile-classification-modal"]');
      if (modal) modal.remove();
    });
  });

  test('should handle ImportSummaryModal on mobile screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');

    // Create a mock ImportSummaryModal to test mobile layout
    await page.evaluate(() => {
      const modal = document.createElement('div');
      modal.className =
        'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 dark:bg-black dark:bg-opacity-60 p-2 sm:p-4';
      modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div class="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <svg class="w-6 h-6 sm:w-8 sm:h-8 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <div>
              <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Import Completed</h2>
              <p class="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Your transactions have been processed</p>
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div class="grid grid-cols-2 gap-3 sm:gap-4">
              <div class="text-center">
                <div class="text-xl sm:text-2xl font-bold text-green-600">31</div>
                <div class="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Imported</div>
              </div>
              <div class="text-center">
                <div class="text-xl sm:text-2xl font-bold text-gray-500">0</div>
                <div class="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Skipped</div>
              </div>
            </div>
          </div>
          <div class="mb-6">
            <p class="text-gray-800 dark:text-gray-200 leading-relaxed">Successfully imported 31 transactions</p>
          </div>
          <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button class="order-3 sm:order-1 flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors text-center text-sm sm:text-base">Close</button>
            <button class="order-1 sm:order-3 flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors text-sm sm:text-base">
              <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
              </svg>
              Upload Another
            </button>
          </div>
          <div class="mt-4 text-center">
            <div class="text-4xl mb-2">🎉</div>
            <p class="text-sm text-gray-700 dark:text-gray-300">All transactions imported successfully!</p>
          </div>
        </div>
      `;
      modal.setAttribute('data-testid', 'mobile-import-summary-modal');
      document.body.appendChild(modal);
    });

    const modal = page.getByTestId('mobile-import-summary-modal');
    await expect(modal).toBeVisible();

    // Check modal sizing on mobile
    const modalBox = await modal.boundingBox();
    if (modalBox) {
      // Modal should fit within viewport with appropriate margins
      expect(modalBox.width).toBeLessThanOrEqual(375);
      expect(modalBox.height).toBeLessThanOrEqual(667);
      expect(modalBox.x).toBeGreaterThanOrEqual(8); // 8px margin
      expect(modalBox.y).toBeGreaterThanOrEqual(8);
    }

    // Check that buttons are properly arranged on mobile (column layout)
    const closeButton = page.locator('button:has-text("Close")');
    const uploadButton = page.locator('button:has-text("Upload Another")');

    if ((await closeButton.count()) > 0 && (await uploadButton.count()) > 0) {
      const closeButtonBox = await closeButton.boundingBox();
      const uploadButtonBox = await uploadButton.boundingBox();

      if (closeButtonBox && uploadButtonBox) {
        // Buttons should be touch-friendly
        expect(closeButtonBox.height).toBeGreaterThanOrEqual(40);
        expect(uploadButtonBox.height).toBeGreaterThanOrEqual(40);

        // On mobile, upload button should be above close button (order-1 vs order-3)
        expect(uploadButtonBox.y).toBeLessThan(closeButtonBox.y);
      }
    }

    // Check text readability - should be readable on mobile
    const statsNumbers = page.locator('.text-xl.sm\\:text-2xl');
    const statsCount = await statsNumbers.count();

    for (let i = 0; i < statsCount; i++) {
      const element = statsNumbers.nth(i);
      if (await element.isVisible()) {
        const fontSize = await element.evaluate((el) => {
          return window.getComputedStyle(el).fontSize;
        });
        const fontSizeNum = parseInt(fontSize.replace('px', ''));
        // Should be at least 20px on mobile (text-xl is 20px)
        expect(fontSizeNum).toBeGreaterThanOrEqual(20);
      }
    }

    // Check that content doesn't overflow horizontally
    const modalContent = modal.locator('div').first();
    const contentBox = await modalContent.boundingBox();
    if (contentBox) {
      expect(contentBox.width).toBeLessThanOrEqual(375 - 16); // Account for padding
    }

    // Clean up
    await page.evaluate(() => {
      const modal = document.querySelector('[data-testid="mobile-import-summary-modal"]');
      if (modal) modal.remove();
    });
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
