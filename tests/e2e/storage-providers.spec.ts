/**
 * Storage Provider E2E Tests
 * Tests the dual storage architecture and provider switching
 */

import { test, expect } from '@playwright/test';
import { createTestUtils } from '../utils/test-helpers';
import { getTestTransactions, generateTransactionSet } from '../fixtures/test-transactions';
import { authenticatedState } from '../fixtures/mock-auth-states';

test.describe('Storage Providers', () => {
  test.beforeEach(async ({ page }) => {
    const utils = createTestUtils(page);
    await utils.localStorage.clear();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('localStorage Provider', () => {
    test('should store and retrieve transactions in localStorage', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('small');

      console.log('🧪 Testing localStorage provider functionality...');

      // Ensure anonymous state
      expect(await utils.auth.isAnonymous()).toBe(true);

      // Set transactions via localStorage provider
      await utils.localStorage.setTransactions(transactions);

      // Reload page to test persistence
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify data persistence
      await utils.localStorage.waitForTransactionsLoaded(transactions.length);
      const storedTransactions = await utils.localStorage.getTransactions();

      expect(storedTransactions).toHaveLength(transactions.length);
      expect(storedTransactions[0].id).toBe(transactions[0].id);
      expect(storedTransactions[0].usdAmount).toBe(transactions[0].usdAmount);

      console.log('✅ localStorage provider functionality verified');
    });

    test('should handle localStorage storage limits gracefully', async ({ page }) => {
      const utils = createTestUtils(page);

      console.log('🧪 Testing localStorage storage limit handling...');

      // Simulate storage quota exceeded
      await utils.errors.simulateStorageQuotaExceeded();

      const transactions = getTestTransactions('medium');

      // Attempt to store data (should handle quota error gracefully)
      await utils.localStorage.setTransactions(transactions, { clearFirst: false });

      // App should still function, possibly with error notifications
      await page.waitForTimeout(2000);

      // Check for error handling in console
      expect(utils.console.hasLog(/quota|storage|error/i)).toBe(true);

      console.log('✅ localStorage storage limit handling verified');
    });

    test('should handle corrupted localStorage data', async ({ page }) => {
      const utils = createTestUtils(page);

      console.log('🧪 Testing corrupted localStorage data handling...');

      // Set corrupted data directly
      await page.evaluate(() => {
        localStorage.setItem('btc-tracker-transactions', '{"invalid": json}');
      });

      // Navigate to app (should handle corrupted data gracefully)
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should show empty state or error recovery
      const hasEmptyState = await page.locator('[data-testid="empty-state"]').isVisible();
      const hasErrorRecovery = utils.console.hasLog(/corrupted|invalid|parse error/i);

      expect(hasEmptyState || hasErrorRecovery).toBe(true);

      console.log('✅ Corrupted localStorage data handling verified');
    });
  });

  test.describe('Supabase Provider', () => {
    test('should switch to Supabase provider when authenticated', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('small');

      console.log('🧪 Testing Supabase provider activation...');

      // Start with localStorage data
      await utils.localStorage.setTransactions(transactions);
      expect(await utils.auth.isAnonymous()).toBe(true);

      // Authenticate to trigger provider switch
      await utils.auth.simulateAuthentication(authenticatedState.user!.id);

      // Verify provider switch (migration should occur)
      await page.waitForTimeout(3000); // Allow for provider switching

      // Should still show data (now from Supabase)
      await utils.localStorage.waitForTransactionsLoaded(transactions.length);

      // localStorage should be cleared (migrated to Supabase)
      const localData = await utils.localStorage.getTransactions();
      expect(localData).toHaveLength(0);

      console.log('✅ Supabase provider activation verified');
    });

    test('should handle Supabase connection errors gracefully', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('small');

      console.log('🧪 Testing Supabase connection error handling...');

      // Set up initial data
      await utils.localStorage.setTransactions(transactions);

      // Simulate network failure
      await utils.errors.simulateNetworkFailure();

      // Attempt to authenticate (Supabase connection should fail)
      await utils.auth.simulateAuthentication('network-fail-user');

      // Should fall back to localStorage functionality
      await page.waitForTimeout(3000);

      // Restore network
      await utils.errors.restoreNetwork();

      // Data should still be accessible via localStorage
      const localData = await utils.localStorage.getTransactions();
      expect(localData.length).toBeGreaterThan(0);

      console.log('✅ Supabase connection error fallback verified');
    });

    test('should handle authentication token expiry', async ({ page }) => {
      const utils = createTestUtils(page);

      console.log('🧪 Testing authentication token expiry handling...');

      // Start authenticated
      await utils.auth.simulateAuthentication('expiry-test-user');
      expect(await utils.auth.isAuthenticated()).toBe(true);

      // Simulate token expiry by clearing auth data
      await page.evaluate(() => {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('supabase.auth')) {
            localStorage.removeItem(key);
          }
        });
      });

      // Reload page to trigger token validation
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should fall back to anonymous/localStorage mode
      expect(await utils.auth.isAnonymous()).toBe(true);

      console.log('✅ Authentication token expiry handling verified');
    });
  });

  test.describe('Provider Switching', () => {
    test('should switch providers based on authentication state', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('small');

      console.log('🧪 Testing provider switching scenarios...');

      // Phase 1: Anonymous → localStorage
      await utils.localStorage.setTransactions(transactions);
      expect(await utils.auth.isAnonymous()).toBe(true);
      await utils.localStorage.waitForTransactionsLoaded(transactions.length);

      // Phase 2: Authenticate → Supabase
      await utils.auth.simulateAuthentication('switching-test-user');
      await page.waitForTimeout(3000); // Allow for migration

      expect(await utils.auth.isAuthenticated()).toBe(true);
      await utils.localStorage.waitForTransactionsLoaded(transactions.length);

      // Phase 3: Logout → localStorage
      await utils.auth.simulateLogout();
      await page.waitForTimeout(2000);

      expect(await utils.auth.isAnonymous()).toBe(true);

      // Should show empty state (data was migrated to Supabase)
      const isEmpty = await utils.localStorage.isEmpty();
      expect(isEmpty).toBe(true);

      console.log('✅ Provider switching scenarios verified');
    });

    test('should handle rapid provider switches without data loss', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('small');

      console.log('🧪 Testing rapid provider switching...');

      await utils.localStorage.setTransactions(transactions);

      // Rapid authentication state changes
      await utils.auth.simulateAuthentication('rapid-user-1');
      await page.waitForTimeout(500);

      await utils.auth.simulateLogout();
      await page.waitForTimeout(500);

      await utils.auth.simulateAuthentication('rapid-user-2');
      await page.waitForTimeout(500);

      await utils.auth.simulateLogout();
      await page.waitForTimeout(1000);

      // Final authentication should complete migration
      await utils.auth.simulateAuthentication('rapid-user-final');
      await page.waitForTimeout(3000);

      // Data should still be available
      await utils.localStorage.waitForTransactionsLoaded(transactions.length);

      console.log('✅ Rapid provider switching without data loss verified');
    });

    test('should maintain data consistency during provider switches', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('multiExchange');

      console.log('🧪 Testing data consistency during provider switches...');

      // Calculate original stats
      const originalStats = {
        totalInvested: transactions.reduce((sum, t) => sum + t.usdAmount, 0),
        totalBTC: transactions.reduce((sum, t) => sum + t.btcAmount, 0),
        transactionCount: transactions.length,
      };

      await utils.localStorage.setTransactions(transactions);

      // Verify initial stats in UI
      await utils.localStorage.waitForTransactionsLoaded(originalStats.transactionCount);

      // Switch to Supabase
      await utils.auth.simulateAuthentication('consistency-test-user');
      await page.waitForTimeout(3000);

      // Verify stats maintained after switch
      await utils.localStorage.waitForTransactionsLoaded(originalStats.transactionCount);

      const totalInvestedElement = page.locator('[data-testid="total-invested"]');
      await expect(totalInvestedElement).toContainText(originalStats.totalInvested.toFixed(2));

      console.log('✅ Data consistency during provider switches verified');
    });
  });

  test.describe('Performance Testing', () => {
    test('should handle large datasets efficiently', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = generateTransactionSet(200, {
        prefix: 'large-perf',
        exchanges: ['Coinbase', 'Strike', 'Kraken'],
        types: ['Purchase', 'Sale'],
      });

      console.log('🧪 Testing large dataset performance...');

      const { duration } = await utils.performance.measureOperation(
        'Large Dataset Storage',
        async () => {
          await utils.localStorage.setTransactions(transactions);
          await utils.localStorage.waitForTransactionsLoaded(transactions.length);
        },
      );

      // Performance assertions
      expect(duration).toBeLessThan(10000); // Max 10 seconds for 200 transactions

      // Test provider switching performance with large dataset
      const { duration: switchDuration } = await utils.performance.measureOperation(
        'Large Dataset Provider Switch',
        async () => {
          await utils.auth.simulateAuthentication('large-dataset-user');
          await page.waitForTimeout(5000); // Allow for migration
          await utils.localStorage.waitForTransactionsLoaded(transactions.length);
        },
      );

      expect(switchDuration).toBeLessThan(20000); // Max 20 seconds for migration

      console.log(
        `✅ Large dataset performance: Storage ${duration.toFixed(2)}ms, Switch ${switchDuration.toFixed(2)}ms`,
      );
    });

    test('should handle concurrent storage operations', async ({ page }) => {
      console.log('🧪 Testing concurrent storage operations...');

      // Create multiple small transaction sets
      const transactionSets = Array.from({ length: 5 }, (_, i) =>
        generateTransactionSet(10, { prefix: `concurrent-${i}` }),
      );

      // Execute concurrent operations
      const concurrentOps = transactionSets.map(async (transactions, index) => {
        await page.evaluate(
          (data) => {
            const key = `btc-tracker-concurrent-${data.index}`;
            localStorage.setItem(
              key,
              JSON.stringify({
                transactions: data.transactions,
                lastUpdated: new Date().toISOString(),
              }),
            );
          },
          { transactions, index },
        );
      });

      await Promise.all(concurrentOps);

      // Verify all operations completed successfully
      const storedSets = await page.evaluate(() => {
        const keys = Object.keys(localStorage).filter((k) => k.includes('concurrent'));
        return keys.length;
      });

      expect(storedSets).toBe(5);

      console.log('✅ Concurrent storage operations verified');
    });
  });

  test.describe('Error Recovery', () => {
    test('should recover from storage provider failures', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('small');

      console.log('🧪 Testing storage provider failure recovery...');

      await utils.localStorage.setTransactions(transactions);

      // Simulate provider failure during authentication
      await utils.errors.simulateNetworkFailure();
      await utils.auth.simulateAuthentication('failure-recovery-user');

      // Should maintain localStorage functionality
      await page.waitForTimeout(3000);
      const localData = await utils.localStorage.getTransactions();
      expect(localData.length).toBeGreaterThan(0);

      // Restore network and retry
      await utils.errors.restoreNetwork();

      // Should eventually complete migration
      await page.waitForTimeout(5000);
      await utils.localStorage.waitForTransactionsLoaded(transactions.length);

      console.log('✅ Storage provider failure recovery verified');
    });

    test('should maintain functionality during partial failures', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('medium');

      console.log('🧪 Testing partial failure resilience...');

      await utils.localStorage.setTransactions(transactions);

      // Simulate intermittent network issues
      await utils.errors.simulateSlowNetwork(2000);

      // App should remain functional despite slow operations
      await utils.auth.simulateAuthentication('partial-failure-user');

      // Should eventually complete operations
      await page.waitForTimeout(10000);
      await utils.localStorage.waitForTransactionsLoaded(transactions.length);

      await utils.errors.restoreNetwork();

      console.log('✅ Partial failure resilience verified');
    });
  });

  test.describe('Data Validation', () => {
    test('should validate transaction data integrity across providers', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('edgeCases');

      console.log('🧪 Testing data validation across providers...');

      await utils.localStorage.setTransactions(transactions);

      // Verify edge cases are handled properly
      await utils.localStorage.waitForTransactionsLoaded(transactions.length);

      // Switch providers and verify data integrity
      await utils.auth.simulateAuthentication('validation-test-user');
      await page.waitForTimeout(3000);

      // Verify edge cases still handled after migration
      await utils.localStorage.waitForTransactionsLoaded(transactions.length);

      // Check for validation warnings in console
      const validationLogs = utils.console.getMatchingLogs(/validation|warning|edge/i);
      console.log(`📊 Validation logs: ${validationLogs.length} entries`);

      console.log('✅ Data validation across providers verified');
    });

    test('should handle malformed transaction data gracefully', async ({ page }) => {
      const utils = createTestUtils(page);

      console.log('🧪 Testing malformed transaction data handling...');

      // Create malformed transaction data
      await page.evaluate(() => {
        const malformedData = {
          transactions: [
            { id: 'malformed-1' }, // Missing required fields
            { id: 'malformed-2', usdAmount: 'not-a-number' }, // Invalid types
            { id: 'malformed-3', date: 'invalid-date' }, // Invalid date
          ],
          lastUpdated: 'invalid-timestamp',
        };
        localStorage.setItem('btc-tracker-transactions', JSON.stringify(malformedData));
      });

      // App should handle malformed data gracefully
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should show error recovery or empty state
      const hasErrorHandling = utils.console.hasLog(/malformed|invalid|error/i);
      const hasEmptyState = await page.locator('[data-testid="empty-state"]').isVisible();

      expect(hasErrorHandling || hasEmptyState).toBe(true);

      console.log('✅ Malformed transaction data handling verified');
    });
  });
});
