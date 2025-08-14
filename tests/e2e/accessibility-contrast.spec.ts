import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility & Contrast Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Light Mode Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      // Ensure we're in light mode
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        localStorage.setItem('btc-tracker:theme', 'light');
      });
    });

    test('should pass axe accessibility checks in light mode', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have proper contrast ratios for all text elements in light mode', async ({
      page,
    }) => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['color-contrast'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should test ImportSummaryModal contrast in light mode', async ({ page }) => {
      // Mock the modal being open with test data
      await page.evaluate(() => {
        // Create a test modal to verify contrast
        const modal = document.createElement('div');
        modal.className =
          'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-2 sm:p-4';
        modal.innerHTML = `
          <div class="bg-white rounded-xl shadow-xl p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div class="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div>
                <h2 class="text-lg sm:text-xl font-bold text-gray-900">Import Completed</h2>
                <p class="text-xs sm:text-sm text-gray-700">Your transactions have been processed</p>
              </div>
            </div>
            <div class="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div class="grid grid-cols-2 gap-3 sm:gap-4">
                <div class="text-center">
                  <div class="text-xl sm:text-2xl font-bold text-green-600">31</div>
                  <div class="text-xs sm:text-sm text-gray-700">Imported</div>
                </div>
                <div class="text-center">
                  <div class="text-xl sm:text-2xl font-bold text-gray-500">0</div>
                  <div class="text-xs sm:text-sm text-gray-700">Skipped</div>
                </div>
              </div>
            </div>
            <div class="mb-6">
              <p class="text-gray-800 leading-relaxed">Successfully imported 31 transactions</p>
            </div>
            <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button class="order-3 sm:order-1 flex-1 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors text-center text-sm sm:text-base">Close</button>
              <button class="order-1 sm:order-3 flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base">Upload Another</button>
            </div>
          </div>
        `;
        modal.setAttribute('data-testid', 'import-summary-modal');
        document.body.appendChild(modal);
      });

      const modal = page.getByTestId('import-summary-modal');
      await expect(modal).toBeVisible();

      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('[data-testid="import-summary-modal"]')
        .withTags(['color-contrast'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      // Clean up
      await page.evaluate(() => {
        const modal = document.querySelector('[data-testid="import-summary-modal"]');
        if (modal) modal.remove();
      });
    });
  });

  test.describe('Dark Mode Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      // Ensure we're in dark mode
      await page.evaluate(() => {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        localStorage.setItem('btc-tracker:theme', 'dark');
      });
      // Wait for theme to apply
      await page.waitForTimeout(100);
    });

    test('should pass axe accessibility checks in dark mode', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have proper contrast ratios for all text elements in dark mode', async ({
      page,
    }) => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['color-contrast'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should test ImportSummaryModal contrast in dark mode', async ({ page }) => {
      // Mock the modal being open with test data including dark mode classes
      await page.evaluate(() => {
        const modal = document.createElement('div');
        modal.className =
          'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 dark:bg-black dark:bg-opacity-60 p-2 sm:p-4';
        modal.innerHTML = `
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div class="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
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
              <button class="order-1 sm:order-3 flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors text-sm sm:text-base">Upload Another</button>
            </div>
          </div>
        `;
        modal.setAttribute('data-testid', 'import-summary-modal-dark');
        document.body.appendChild(modal);
      });

      const modal = page.getByTestId('import-summary-modal-dark');
      await expect(modal).toBeVisible();

      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('[data-testid="import-summary-modal-dark"]')
        .withTags(['color-contrast'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      // Clean up
      await page.evaluate(() => {
        const modal = document.querySelector('[data-testid="import-summary-modal-dark"]');
        if (modal) modal.remove();
      });
    });
  });

  test.describe('TransactionClassificationModal Accessibility', () => {
    test('should test classification modal contrast in light mode', async ({ page }) => {
      // Ensure light mode
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      });

      // Mock the transaction classification modal
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
                    </div>
                    <div class="text-yellow-700 text-xs md:text-sm block mt-1">
                      This tool provides basic transaction categorization for record-keeping purposes only.
                      <strong> This is not financial or tax advice.</strong>
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
                            <span class="text-gray-600 text-xs sm:text-sm truncate">($1,614.19)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="mt-4">
                      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-2">
                        <p class="text-xs sm:text-sm text-gray-600">Select the category that best describes this transaction:</p>
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
          </div>
        `;
        modal.setAttribute('data-testid', 'classification-modal');
        document.body.appendChild(modal);
      });

      const modal = page.getByTestId('classification-modal');
      await expect(modal).toBeVisible();

      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('[data-testid="classification-modal"]')
        .withTags(['color-contrast'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      // Clean up
      await page.evaluate(() => {
        const modal = document.querySelector('[data-testid="classification-modal"]');
        if (modal) modal.remove();
      });
    });
  });

  test.describe('Contrast Ratio Validation', () => {
    test('should validate minimum touch target sizes', async ({ page }) => {
      const buttons = page.locator('button, [role="button"], input[type="submit"]');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          if (box) {
            // WCAG recommends minimum 44x44px touch targets
            expect(box.height).toBeGreaterThanOrEqual(44);
            expect(box.width).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });

    test('should validate focus indicators', async ({ page }) => {
      const focusableElements = page.locator(
        'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])',
      );
      const count = await focusableElements.count();

      // Test first few focusable elements
      for (let i = 0; i < Math.min(count, 5); i++) {
        const element = focusableElements.nth(i);
        if (await element.isVisible()) {
          await element.focus();

          // Check that focused element has visible focus indicator
          const styles = await element.evaluate((el) => {
            const computed = window.getComputedStyle(el, ':focus');
            return {
              outline: computed.outline,
              outlineWidth: computed.outlineWidth,
              boxShadow: computed.boxShadow,
            };
          });

          // Should have either outline or box-shadow for focus indication
          const hasFocusIndicator =
            (styles.outline && styles.outline !== 'none' && styles.outline !== '0px') ||
            (styles.outlineWidth && styles.outlineWidth !== '0px') ||
            (styles.boxShadow && styles.boxShadow !== 'none');

          expect(hasFocusIndicator).toBeTruthy();
        }
      }
    });

    test('should generate accessibility report', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();

      // Log detailed results for debugging
      if (accessibilityScanResults.violations.length > 0) {
        console.log('Accessibility violations found:');
        accessibilityScanResults.violations.forEach((violation, index) => {
          console.log(`${index + 1}. ${violation.id}: ${violation.description}`);
          console.log(`   Impact: ${violation.impact}`);
          console.log(`   Help: ${violation.help}`);
          console.log(`   Elements: ${violation.nodes.length}`);
        });
      }

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });
});
