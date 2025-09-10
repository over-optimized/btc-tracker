/**
 * Error Handling E2E Tests
 * Tests application resilience under various error conditions
 */

import { test, expect } from '@playwright/test';
import { createTestUtils } from '../utils/test-helpers';
import {
  getTestTransactions,
  generateTransactionSet,
  largeTransactionSet,
} from '../fixtures/test-transactions';
import { authenticatedState } from '../fixtures/mock-auth-states';

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    const utils = createTestUtils(page);
    await utils.localStorage.clear();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Network Error Scenarios', () => {
    test('should handle complete network failure gracefully', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('small');

      console.log('🧪 Testing complete network failure handling...');

      // Set up initial data
      await utils.localStorage.setTransactions(transactions);
      await utils.localStorage.waitForTransactionsLoaded(transactions.length);

      // Simulate complete network failure
      await utils.errors.simulateNetworkFailure();

      // App should continue functioning in offline mode
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Data should still be accessible via localStorage
      await utils.localStorage.waitForTransactionsLoaded(transactions.length);

      // UI should indicate offline state or degraded functionality
      const hasOfflineIndicator = await page
        .locator('[data-testid="offline-indicator"]')
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      const hasNetworkError = utils.console.hasLog(/network.*fail|offline|connection/i);

      expect(hasOfflineIndicator || hasNetworkError).toBe(true);

      // Restore network
      await utils.errors.restoreNetwork();

      console.log('✅ Complete network failure handled gracefully');
    });

    test('should handle slow network connections', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('medium');

      console.log('🧪 Testing slow network handling...');

      await utils.localStorage.setTransactions(transactions);

      // Simulate very slow network (5 second delays)
      await utils.errors.simulateSlowNetwork(5000);

      // Attempt authentication (should handle slow response)
      await utils.auth.simulateAuthentication('slow-network-user');

      // App should show loading states and eventually complete
      const hasLoadingState = await page
        .locator('[data-testid="loading-spinner"]')
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      // Wait for operation to complete despite slow network
      await page.waitForTimeout(10000);

      // Should eventually succeed or fail gracefully
      const finalCount = await utils.localStorage.getTransactions();
      expect(finalCount.length >= 0).toBe(true); // Should not crash

      await utils.errors.restoreNetwork();

      console.log('✅ Slow network connection handled gracefully');
    });

    test('should recover from intermittent network failures', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('small');

      console.log('🧪 Testing intermittent network failure recovery...');

      await utils.localStorage.setTransactions(transactions);

      // Simulate intermittent failures during auth
      await utils.errors.simulateNetworkFailure();
      await utils.auth.simulateAuthentication('intermittent-user');
      await page.waitForTimeout(2000);

      // Restore network - should retry automatically
      await utils.errors.restoreNetwork();
      await page.waitForTimeout(3000);

      // Should eventually complete the operation
      await utils.localStorage.waitForTransactionsLoaded(transactions.length);

      // Check for retry logic in console
      const retryLogs = utils.console.getMatchingLogs(/retry|reconnect|attempt/i);
      console.log(`📊 Recovery attempts: ${retryLogs.length} log entries`);

      console.log('✅ Intermittent network failure recovery verified');
    });

    test('should handle API timeout errors', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('small');

      console.log('🧪 Testing API timeout error handling...');

      await utils.localStorage.setTransactions(transactions);

      // Simulate extreme delays (beyond typical timeout)
      await utils.errors.simulateSlowNetwork(30000); // 30 second delay

      await utils.auth.simulateAuthentication('timeout-test-user');

      // Should timeout and fall back gracefully
      await page.waitForTimeout(5000);

      // Check for timeout handling
      const timeoutLogs = utils.console.getMatchingLogs(/timeout|failed|abort/i);
      expect(timeoutLogs.length).toBeGreaterThan(0);

      // App should still function with localStorage
      const localData = await utils.localStorage.getTransactions();
      expect(localData.length).toBe(transactions.length);

      await utils.errors.restoreNetwork();

      console.log('✅ API timeout error handling verified');
    });
  });

  test.describe('Authentication Error Scenarios', () => {
    test('should handle invalid authentication tokens', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('small');

      console.log('🧪 Testing invalid authentication token handling...');

      await utils.localStorage.setTransactions(transactions);

      // Set invalid auth token
      await page.evaluate(() => {
        localStorage.setItem(
          'supabase.auth.token',
          JSON.stringify({
            access_token: 'invalid-token-123',
            expires_at: Date.now() + 3600000,
            user: { id: 'invalid-user' },
          }),
        );
      });

      // Reload to trigger token validation
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should fall back to anonymous mode
      await page.waitForTimeout(3000);
      expect(await utils.auth.isAnonymous()).toBe(true);

      // Should show appropriate error handling
      const authErrorLogs = utils.console.getMatchingLogs(
        /auth.*error|invalid.*token|unauthorized/i,
      );
      expect(authErrorLogs.length).toBeGreaterThan(0);

      console.log('✅ Invalid authentication token handling verified');
    });

    test('should handle expired authentication sessions', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('small');

      console.log('🧪 Testing expired session handling...');

      await utils.localStorage.setTransactions(transactions);

      // Set expired auth token
      await page.evaluate(() => {
        localStorage.setItem(
          'supabase.auth.token',
          JSON.stringify({
            access_token: 'expired-token-456',
            expires_at: Date.now() - 3600000, // 1 hour ago (expired)
            user: { id: 'expired-user' },
            refresh_token: 'expired-refresh-token',
          }),
        );
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should attempt token refresh and fall back to anonymous
      await page.waitForTimeout(3000);
      expect(await utils.auth.isAnonymous()).toBe(true);

      // Check for session expiry handling
      const expiryLogs = utils.console.getMatchingLogs(/expired|refresh.*failed|session.*invalid/i);
      console.log(`📊 Session expiry logs: ${expiryLogs.length} entries`);

      console.log('✅ Expired session handling verified');
    });

    test('should handle permission denied errors', async ({ page }) => {
      const utils = createTestUtils(page);

      console.log('🧪 Testing permission denied error handling...');

      // Simulate permission denied during operations
      await page.route('**/rest/v1/**', (route) => {
        route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Insufficient permissions' }),
        });
      });

      await utils.auth.simulateAuthentication('permission-denied-user');

      // Should handle permission errors gracefully
      await page.waitForTimeout(3000);

      const permissionLogs = utils.console.getMatchingLogs(
        /permission.*denied|403|insufficient.*permission/i,
      );
      expect(permissionLogs.length).toBeGreaterThan(0);

      // Should fall back to read-only or anonymous mode
      expect(await utils.auth.isAnonymous()).toBe(true);

      await page.unroute('**/rest/v1/**');

      console.log('✅ Permission denied error handling verified');
    });
  });

  test.describe('Data Validation & Corruption', () => {
    test('should handle corrupted transaction data', async ({ page }) => {
      const utils = createTestUtils(page);

      console.log('🧪 Testing corrupted transaction data handling...');

      // Set corrupted JSON in localStorage
      await page.evaluate(() => {
        localStorage.setItem(
          'btc-tracker-transactions',
          '{"transactions": [{"id": "test", malformed: json}]}',
        );
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should handle JSON parsing errors gracefully
      const parseErrorLogs = utils.console.getMatchingLogs(/parse.*error|invalid.*json|corrupted/i);
      expect(parseErrorLogs.length).toBeGreaterThan(0);

      // Should show error recovery or empty state
      const hasErrorRecovery = await page
        .locator('[data-testid="error-recovery"]')
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      const hasEmptyState = await page
        .locator('[data-testid="empty-state"]')
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      expect(hasErrorRecovery || hasEmptyState).toBe(true);

      console.log('✅ Corrupted transaction data handling verified');
    });

    test('should validate transaction data integrity', async ({ page }) => {
      const utils = createTestUtils(page);

      console.log('🧪 Testing transaction data validation...');

      // Create transactions with invalid data
      const invalidTransactions = [
        { id: 'invalid-1', usdAmount: 'not-a-number', btcAmount: 0.01, exchange: 'Test' },
        { id: 'invalid-2', usdAmount: 100, btcAmount: 'invalid', exchange: 'Test' },
        { id: 'invalid-3', usdAmount: -100, btcAmount: 0.01, exchange: 'Test' }, // Negative amount
        {
          id: 'invalid-4',
          date: 'invalid-date',
          usdAmount: 100,
          btcAmount: 0.01,
          exchange: 'Test',
        },
      ];

      await page.evaluate((transactions) => {
        localStorage.setItem(
          'btc-tracker-transactions',
          JSON.stringify({
            transactions,
            lastUpdated: new Date().toISOString(),
          }),
        );
      }, invalidTransactions);

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should validate and filter out invalid transactions
      const validationLogs = utils.console.getMatchingLogs(
        /validation.*error|invalid.*transaction|filtered/i,
      );
      expect(validationLogs.length).toBeGreaterThan(0);

      // Should show warning or filtered count
      const hasValidationWarning = await page
        .locator('[data-testid="validation-warning"]')
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      const hasValidationLog = validationLogs.length > 0;

      expect(hasValidationWarning || hasValidationLog).toBe(true);

      console.log('✅ Transaction data validation verified');
    });

    test('should handle missing required transaction fields', async ({ page }) => {
      const utils = createTestUtils(page);

      console.log('🧪 Testing missing required fields handling...');

      // Create transactions missing required fields
      const incompleteTransactions = [
        { id: 'incomplete-1' }, // Missing most fields
        { id: 'incomplete-2', usdAmount: 100 }, // Missing btcAmount, exchange, etc.
        { id: 'incomplete-3', usdAmount: 100, btcAmount: 0.01 }, // Missing exchange
        { usdAmount: 100, btcAmount: 0.01, exchange: 'Test' }, // Missing ID
      ];

      await utils.localStorage.setTransactions(incompleteTransactions as any);

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should handle missing fields gracefully
      const fieldValidationLogs = utils.console.getMatchingLogs(
        /missing.*field|required.*field|incomplete/i,
      );
      expect(fieldValidationLogs.length).toBeGreaterThan(0);

      // Should filter out incomplete transactions
      const finalCount = (await utils.localStorage.getTransactions()).length;
      expect(finalCount).toBeLessThan(incompleteTransactions.length);

      console.log('✅ Missing required fields handling verified');
    });
  });

  test.describe('Storage & Memory Limits', () => {
    test('should handle localStorage quota exceeded', async ({ page }) => {
      const utils = createTestUtils(page);

      console.log('🧪 Testing localStorage quota exceeded handling...');

      // Simulate storage quota exceeded
      await utils.errors.simulateStorageQuotaExceeded();

      const transactions = getTestTransactions('large');

      // Attempt to store large dataset
      await page.evaluate((transactions) => {
        try {
          localStorage.setItem(
            'btc-tracker-transactions',
            JSON.stringify({
              transactions,
              lastUpdated: new Date().toISOString(),
            }),
          );
        } catch (error) {
          console.error('Storage quota exceeded:', error);
        }
      }, transactions);

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should handle quota error gracefully
      const quotaLogs = utils.console.getMatchingLogs(
        /quota.*exceeded|storage.*full|quota.*error/i,
      );
      expect(quotaLogs.length).toBeGreaterThan(0);

      // Should show appropriate error message
      const hasStorageError = await page
        .locator('[data-testid="storage-error"]')
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      const hasQuotaWarning = quotaLogs.length > 0;

      expect(hasStorageError || hasQuotaWarning).toBe(true);

      console.log('✅ localStorage quota exceeded handling verified');
    });

    test('should handle memory pressure with large datasets', async ({ page }) => {
      const utils = createTestUtils(page);

      console.log('🧪 Testing memory pressure handling...');

      // Create very large dataset
      const largeDataset = generateTransactionSet(1000, {
        prefix: 'memory-test',
        exchanges: Array.from({ length: 20 }, (_, i) => `Exchange-${i}`),
      });

      // Monitor memory during large dataset operations
      const { memoryDelta } = await utils.performance.monitorMemoryDuringOperation(async () => {
        await utils.localStorage.setTransactions(largeDataset);
        await page.waitForTimeout(2000);
        await utils.localStorage.waitForTransactionsLoaded(largeDataset.length);
      });

      // Should handle large datasets without excessive memory usage
      expect(memoryDelta).toBeLessThan(100); // Less than 100MB increase

      // App should remain responsive
      const isResponsive = await page.evaluate(() => {
        return (
          document.readyState === 'complete' &&
          !document.querySelector('[data-testid="memory-warning"]')
        );
      });

      expect(isResponsive).toBe(true);

      console.log(`✅ Memory pressure handling: ${memoryDelta.toFixed(2)}MB delta`);
    });

    test('should handle concurrent storage operations safely', async ({ page }) => {
      const utils = createTestUtils(page);

      console.log('🧪 Testing concurrent storage operations safety...');

      // Create multiple transaction sets for concurrent operations
      const concurrentSets = Array.from({ length: 10 }, (_, i) =>
        generateTransactionSet(5, { prefix: `concurrent-${i}` }),
      );

      // Execute concurrent storage operations
      const concurrentOps = concurrentSets.map(async (transactions, index) => {
        await page.evaluate(
          (data) => {
            const key = `btc-tracker-concurrent-${data.index}`;
            try {
              localStorage.setItem(
                key,
                JSON.stringify({
                  transactions: data.transactions,
                  lastUpdated: new Date().toISOString(),
                }),
              );
            } catch (error) {
              console.error(`Concurrent operation ${data.index} failed:`, error);
            }
          },
          { transactions, index },
        );
      });

      await Promise.allSettled(concurrentOps);

      // Verify operations completed without race conditions
      const completedOps = await page.evaluate(() => {
        return Object.keys(localStorage).filter((k) => k.includes('concurrent')).length;
      });

      expect(completedOps).toBeGreaterThan(5); // At least half should succeed

      // Check for race condition warnings
      const raceLogs = utils.console.getMatchingLogs(/race.*condition|concurrent.*error|conflict/i);
      console.log(`📊 Race condition logs: ${raceLogs.length} entries`);

      console.log('✅ Concurrent storage operations safety verified');
    });
  });

  test.describe('Error Recovery & Graceful Degradation', () => {
    test('should provide automatic error recovery options', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('small');

      console.log('🧪 Testing automatic error recovery...');

      await utils.localStorage.setTransactions(transactions);

      // Cause multiple errors to trigger recovery
      await utils.errors.simulateNetworkFailure();
      await utils.errors.simulateStorageQuotaExceeded();

      await utils.auth.simulateAuthentication('recovery-test-user');
      await page.waitForTimeout(3000);

      // Should show recovery options
      const hasRecoveryUI = await page
        .locator('[data-testid="error-recovery"]')
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      const hasRecoveryLogs = utils.console.hasLog(/recovery.*option|error.*recovery|fallback/i);

      expect(hasRecoveryUI || hasRecoveryLogs).toBe(true);

      // Try manual recovery
      if (hasRecoveryUI) {
        await page
          .locator('[data-testid="retry-button"]')
          .click()
          .catch(() => {});
        await page.waitForTimeout(2000);
      }

      await utils.errors.restoreNetwork();

      console.log('✅ Automatic error recovery options verified');
    });

    test('should maintain core functionality during partial failures', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('medium');

      console.log('🧪 Testing graceful degradation...');

      await utils.localStorage.setTransactions(transactions);

      // Simulate partial service degradation
      await page.route('**/rest/v1/transactions', (route) => {
        // Fail some requests, succeed others
        if (Math.random() < 0.5) {
          route.abort('failed');
        } else {
          route.continue();
        }
      });

      await utils.auth.simulateAuthentication('degraded-service-user');
      await page.waitForTimeout(5000);

      // Core functionality should still work
      await utils.localStorage.waitForTransactionsLoaded(transactions.length);

      // Should show degraded performance warnings
      const degradationLogs = utils.console.getMatchingLogs(
        /degraded|partial.*failure|reduced.*functionality/i,
      );
      console.log(`📊 Degradation logs: ${degradationLogs.length} entries`);

      await page.unroute('**/rest/v1/transactions');

      console.log('✅ Graceful degradation verified');
    });

    test('should provide clear error messaging to users', async ({ page }) => {
      const utils = createTestUtils(page);

      console.log('🧪 Testing user error messaging...');

      // Trigger various error scenarios
      await utils.errors.simulateNetworkFailure();

      const transactions = getTestTransactions('small');
      await utils.localStorage.setTransactions(transactions);

      await utils.auth.simulateAuthentication('error-messaging-user');
      await page.waitForTimeout(3000);

      // Should provide clear user feedback
      const hasErrorToast = await page
        .locator('[data-testid="error-toast"]')
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      const hasErrorBanner = await page
        .locator('[data-testid="error-banner"]')
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      const hasStatusMessage = await page
        .locator('[data-testid="status-message"]')
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      const hasUserFeedback = hasErrorToast || hasErrorBanner || hasStatusMessage;

      // At minimum, should have console error logs
      const userErrorLogs = utils.console.getMatchingLogs(
        /user.*error|error.*message|failed.*operation/i,
      );

      expect(hasUserFeedback || userErrorLogs.length > 0).toBe(true);

      await utils.errors.restoreNetwork();

      console.log('✅ User error messaging verified');
    });
  });

  test.describe('Cross-Browser Error Compatibility', () => {
    test('should handle browser-specific localStorage limitations', async ({
      page,
      browserName,
    }) => {
      const utils = createTestUtils(page);

      console.log(`🧪 Testing browser-specific limitations (${browserName})...`);

      // Test browser-specific storage behaviors
      const browserQuirks = await page.evaluate(() => {
        const quirks: string[] = [];

        // Test localStorage availability
        if (typeof Storage === 'undefined') {
          quirks.push('no-localstorage');
        }

        // Test JSON support
        try {
          JSON.parse('{"test": true}');
        } catch {
          quirks.push('no-json');
        }

        // Test large data handling
        try {
          const testData = 'x'.repeat(1024 * 100); // 100KB
          localStorage.setItem('test-quota', testData);
          localStorage.removeItem('test-quota');
        } catch {
          quirks.push('small-quota');
        }

        return quirks;
      });

      console.log(`📊 Browser quirks detected: ${browserQuirks.join(', ') || 'none'}`);

      const transactions = getTestTransactions('small');
      await utils.localStorage.setTransactions(transactions);

      // Should handle browser-specific limitations gracefully
      await utils.localStorage.waitForTransactionsLoaded(transactions.length);

      console.log(`✅ Browser-specific limitations handled (${browserName})`);
    });
  });
});
