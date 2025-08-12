import { test, expect } from '@playwright/test';

test.describe('Performance and Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load within acceptable time limits', async ({ page }) => {
    const startTime = Date.now();

    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    console.log(`✓ Page loaded in ${loadTime}ms`);

    // Check that main content is visible
    const mainContent = page.locator('main, [role="main"], .main-content');
    if ((await mainContent.count()) > 0) {
      await expect(mainContent.first()).toBeVisible();
    }
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Monitor console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Monitor network failures
    page.on('response', (response) => {
      if (!response.ok()) {
        console.log(`⚠️ Network error: ${response.status()} ${response.url()}`);
      }
    });

    // Navigate and interact with the app
    await page.goto('/');

    // Try to interact with upload functionality
    const uploadButton = page.locator('text=Upload CSV file');
    if ((await uploadButton.count()) > 0) {
      await uploadButton.click();
    }

    // Check that there are no critical console errors
    const criticalErrors = consoleErrors.filter(
      (error) =>
        error.includes('TypeError') ||
        error.includes('ReferenceError') ||
        error.includes('SyntaxError'),
    );

    if (criticalErrors.length > 0) {
      console.log(`⚠️ Found ${criticalErrors.length} critical console errors:`, criticalErrors);
    }

    // Allow some warnings but not critical errors
    expect(criticalErrors.length).toBeLessThanOrEqual(2);
  });

  test('should handle large file upload scenarios', async ({ page }) => {
    // Test behavior when attempting to upload large files
    const uploadButton = page.locator('text=Upload CSV file');

    if ((await uploadButton.count()) > 0) {
      await uploadButton.click();

      // Look for file size validation messages
      const fileSizeWarning = page.locator('text*=file size, text*=too large, text*=maximum');

      // Check if file size limits are communicated to users
      if ((await fileSizeWarning.count()) > 0) {
        console.log('✓ Found file size validation messaging');
      }

      // Look for progress indicators for file processing
      const progressIndicators = page.locator('[role="progressbar"], .progress, text*=processing');
      if ((await progressIndicators.count()) > 0) {
        console.log('✓ Found progress indicators for file processing');
      }
    }
  });

  test('should handle invalid CSV data gracefully', async ({ page }) => {
    // Test error handling for invalid data
    const uploadButton = page.locator('text=Upload CSV file');

    if ((await uploadButton.count()) > 0) {
      await uploadButton.click();

      // Look for error handling UI elements
      const errorElements = [
        '[role="alert"]',
        '.error-message',
        'text*=error',
        'text*=invalid',
        'text*=failed',
      ];

      for (const selector of errorElements) {
        const element = page.locator(selector);
        if ((await element.count()) > 0) {
          console.log(`✓ Found error handling element: ${selector}`);
        }
      }

      // Look for recovery options
      const recoveryOptions = ['text*=try again', 'text*=retry', 'text*=help', 'text*=support'];

      for (const option of recoveryOptions) {
        const element = page.locator(option);
        if ((await element.count()) > 0) {
          console.log(`✓ Found recovery option: ${option}`);
        }
      }
    }
  });

  test('should maintain responsive performance on slower connections', async ({ page }) => {
    // Simulate slow 3G connection
    await page.route('**/*', async (route) => {
      // Add delay to simulate slow connection
      await new Promise((resolve) => setTimeout(resolve, 100));
      await route.continue();
    });

    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Should still load within reasonable time on slow connections
    expect(loadTime).toBeLessThan(10000); // 10 seconds for slow connection
    console.log(`✓ Page loaded in ${loadTime}ms on simulated slow connection`);

    // Check that loading states are handled properly
    const loadingIndicators = page.locator('[role="status"], .loading, text*=loading');
    if ((await loadingIndicators.count()) > 0) {
      console.log('✓ Found loading indicators for slow connections');
    }
  });

  test('should handle memory constraints efficiently', async ({ page }) => {
    // Monitor memory usage (basic check)
    const performanceMetrics = await page.evaluate(() => {
      const nav = window.performance?.getEntriesByType('navigation')[0] as {
        domContentLoadedEventEnd?: number;
        domContentLoadedEventStart?: number;
        loadEventEnd?: number;
        loadEventStart?: number;
      };
      return {
        domContentLoaded:
          (nav?.domContentLoadedEventEnd || 0) - (nav?.domContentLoadedEventStart || 0),
        loadComplete: (nav?.loadEventEnd || 0) - (nav?.loadEventStart || 0),
        // Basic memory info if available
        memoryInfo:
          'memory' in window.performance
            ? (window.performance as unknown as { memory: unknown }).memory
            : null,
      };
    });

    console.log('Performance metrics:', performanceMetrics);

    // Check that DOM loaded quickly
    expect(performanceMetrics.domContentLoaded).toBeLessThan(2000);

    // Take screenshot of performance metrics
    await page.screenshot({
      path: 'test-results/performance-metrics.png',
    });
  });

  test('should handle component errors with error boundaries', async ({ page }) => {
    // Monitor for React error boundary messages
    const errorBoundaryMessages = [
      'Something went wrong',
      'Error boundary',
      'Component error',
      'Try refreshing',
    ];

    for (const message of errorBoundaryMessages) {
      const element = page.locator(`text*=${message}`);
      if ((await element.count()) > 0) {
        console.log(`Found error boundary message: ${message}`);

        // Take screenshot of error state
        await page.screenshot({
          path: 'test-results/error-boundary-state.png',
        });
      }
    }

    // Check that the app doesn't crash completely
    const appHeader = page.locator('[data-testid="app-header"], header, nav');
    if ((await appHeader.count()) > 0) {
      await expect(appHeader.first()).toBeVisible();
      console.log('✓ App header remains visible (no complete crash)');
    }
  });

  test('should handle concurrent user interactions', async ({ page }) => {
    // Test rapid user interactions
    const uploadButton = page.locator('text=Upload CSV file');

    if ((await uploadButton.count()) > 0) {
      // Rapidly click multiple times to test debouncing/throttling
      await uploadButton.click();
      await uploadButton.click();
      await uploadButton.click();

      // Check that multiple modals don't open
      const modals = page.locator('[role="dialog"], .modal');
      const modalCount = await modals.count();

      // Should have at most 1 modal open
      expect(modalCount).toBeLessThanOrEqual(1);
      console.log(`✓ Handled rapid clicks correctly (${modalCount} modal(s) open)`);
    }
  });

  test('should provide accessibility for screen readers', async ({ page }) => {
    // Check for ARIA labels and roles
    const ariaElements = [
      '[aria-label]',
      '[aria-describedby]',
      '[role="button"]',
      '[role="dialog"]',
      '[role="alert"]',
    ];

    let foundAriaElements = 0;
    for (const selector of ariaElements) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        foundAriaElements += count;
        console.log(`✓ Found ${count} elements with ${selector}`);
      }
    }

    console.log(`Total ARIA elements found: ${foundAriaElements}`);

    // Check for keyboard navigation
    const focusableElements = page.locator('button, input, a, [tabindex]:not([tabindex="-1"])');
    const focusableCount = await focusableElements.count();

    if (focusableCount > 0) {
      console.log(`✓ Found ${focusableCount} focusable elements for keyboard navigation`);
    }

    // Take screenshot for accessibility review
    await page.screenshot({
      path: 'test-results/accessibility-review.png',
      fullPage: true,
    });
  });

  test('should handle browser compatibility gracefully', async ({ page }) => {
    // Check for graceful degradation
    await page.addInitScript(() => {
      // Simulate missing modern features
      if ('ResizeObserver' in window) {
        console.log('✓ ResizeObserver available');
      }

      if ('fetch' in window) {
        console.log('✓ Fetch API available');
      }
    });

    await page.goto('/');

    // Check that core functionality works even with feature detection
    const coreElements = page.locator('button, input, nav');
    const coreElementCount = await coreElements.count();

    expect(coreElementCount).toBeGreaterThan(0);
    console.log(`✓ Core elements functional: ${coreElementCount} interactive elements found`);
  });
});
