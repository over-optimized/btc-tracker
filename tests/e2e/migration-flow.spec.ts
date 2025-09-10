/**
 * Migration Flow E2E Tests
 * Tests the critical localStorage → Supabase migration functionality
 */

import { test, expect } from '@playwright/test';
import { createTestUtils } from '../utils/test-helpers';
import { getTestTransactions } from '../fixtures/test-transactions';
import { migrationTestUser } from '../fixtures/mock-auth-states';

test.describe('Migration Flow', () => {
  test.beforeEach(async ({ page }) => {
    const utils = createTestUtils(page);

    // Start with clean state
    await utils.localStorage.clear();
    await page.goto('/');

    // Wait for app to initialize
    await page.waitForLoadState('networkidle');
  });

  test.describe('Basic Migration Scenarios', () => {
    test('should migrate small dataset from localStorage to Supabase', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('small');

      console.log('🧪 Testing basic migration with small dataset...');

      // Setup: Add transactions to localStorage while anonymous
      await utils.migration.setupMigrationScenario(transactions);

      // Verify initial state
      expect(await utils.auth.isAnonymous()).toBe(true);
      expect(await utils.localStorage.getTransactions()).toHaveLength(3);

      // Trigger migration by authenticating
      await utils.migration.triggerMigration(migrationTestUser.user!.id);

      // Verify migration success
      await utils.migration.verifyMigrationSuccess(3);

      console.log('✅ Basic migration test completed successfully');
    });

    test('should migrate medium dataset without data loss', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('medium');

      console.log('🧪 Testing migration with medium dataset (50 transactions)...');

      // Setup migration scenario
      await utils.migration.setupMigrationScenario(transactions);

      // Measure migration performance
      const { duration } = await utils.performance.measureOperation(
        'Medium Dataset Migration',
        async () => {
          await utils.migration.triggerMigration('medium-test-user');
          await utils.migration.verifyMigrationSuccess(50);
        },
      );

      // Performance assertion - migration should complete within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds max

      console.log('✅ Medium dataset migration test completed successfully');
    });

    test('should handle multi-exchange transactions during migration', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('multiExchange');

      console.log('🧪 Testing migration with multi-exchange transactions...');

      await utils.migration.setupMigrationScenario(transactions);

      // Verify different exchanges are preserved
      const beforeExchanges = [...new Set(transactions.map((t) => t.exchange))];

      await utils.migration.triggerMigration('multiexchange-test-user');
      await utils.migration.verifyMigrationSuccess(transactions.length);

      // Verify exchange diversity is maintained after migration
      await expect(page.locator('[data-testid="exchange-list"]')).toContainText('Coinbase');
      await expect(page.locator('[data-testid="exchange-list"]')).toContainText('Strike');
      await expect(page.locator('[data-testid="exchange-list"]')).toContainText('Kraken');

      console.log(`✅ Multi-exchange migration preserved ${beforeExchanges.length} exchanges`);
    });
  });

  test.describe('Migration Edge Cases', () => {
    test('should handle empty localStorage gracefully', async ({ page }) => {
      const utils = createTestUtils(page);

      console.log('🧪 Testing migration with empty localStorage...');

      // Start with empty localStorage
      await utils.localStorage.clear();
      await page.goto('/');

      // Verify anonymous state with no data
      expect(await utils.auth.isAnonymous()).toBe(true);
      expect(await utils.localStorage.getTransactions()).toHaveLength(0);

      // Authenticate (should not trigger migration)
      await utils.auth.simulateAuthentication('empty-state-user');

      // Verify no errors occurred and user is authenticated
      expect(await utils.auth.isAuthenticated()).toBe(true);

      // Should still have no transactions
      await page.waitForSelector('[data-testid="empty-state"]', { timeout: 5000 });

      console.log('✅ Empty localStorage migration handled gracefully');
    });

    test('should handle duplicate transaction IDs during migration', async ({ page }) => {
      const utils = createTestUtils(page);

      console.log('🧪 Testing migration with duplicate transaction IDs...');

      // Create transactions with duplicate IDs
      const baseTransaction = getTestTransactions('small')[0];
      const duplicateTransactions = [
        baseTransaction,
        { ...baseTransaction, usdAmount: 500 }, // Same ID, different amount
        { ...baseTransaction, date: new Date().toISOString() }, // Same ID, different date
      ];

      await utils.migration.setupMigrationScenario(duplicateTransactions);
      await utils.migration.triggerMigration('duplicate-test-user');

      // Should handle duplicates gracefully (typically keeping the last one)
      await utils.migration.verifyMigrationSuccess(1);

      console.log('✅ Duplicate transaction IDs handled during migration');
    });

    test('should preserve transaction data integrity during migration', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('small');

      console.log('🧪 Testing transaction data integrity during migration...');

      await utils.migration.setupMigrationScenario(transactions);

      // Store original transaction data for comparison
      const originalData = {
        totalInvested: transactions.reduce((sum, t) => sum + t.usdAmount, 0),
        totalBTC: transactions.reduce((sum, t) => sum + t.btcAmount, 0),
        exchangeCount: new Set(transactions.map((t) => t.exchange)).size,
      };

      await utils.migration.triggerMigration('integrity-test-user');
      await utils.migration.verifyMigrationSuccess(transactions.length);

      // Verify data integrity in UI
      const totalInvestedElement = page.locator('[data-testid="total-invested"]');
      const totalBTCElement = page.locator('[data-testid="total-btc"]');

      await expect(totalInvestedElement).toContainText(originalData.totalInvested.toFixed(2));
      await expect(totalBTCElement).toContainText(originalData.totalBTC.toFixed(8));

      console.log('✅ Transaction data integrity preserved during migration');
    });
  });

  test.describe('Migration Performance & Reliability', () => {
    test('should complete migration within performance thresholds', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('medium');

      console.log('🧪 Testing migration performance thresholds...');

      await utils.migration.setupMigrationScenario(transactions);

      // Monitor memory during migration
      const { duration, memoryDelta } = await utils.performance.monitorMemoryDuringOperation(
        async () => {
          const { duration } = await utils.performance.measureOperation(
            'Performance Threshold Migration',
            async () => {
              await utils.migration.triggerMigration('performance-test-user');
              await utils.migration.verifyMigrationSuccess(50);
            },
          );
          return { duration };
        },
      );

      // Performance assertions
      expect(duration).toBeLessThan(15000); // Max 15 seconds for 50 transactions
      expect(memoryDelta).toBeLessThan(50); // Max 50MB memory increase

      console.log(
        `✅ Migration performance: ${duration.toFixed(2)}ms, ${memoryDelta.toFixed(2)}MB`,
      );
    });

    test('should recover from migration interruption', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('small');

      console.log('🧪 Testing migration recovery from interruption...');

      await utils.migration.setupMigrationScenario(transactions);

      // Simulate network failure during migration
      await utils.errors.simulateNetworkFailure();

      // Attempt migration (should fail gracefully)
      await utils.auth.simulateAuthentication('interrupted-migration-user');

      // Wait a moment for the failed migration attempt
      await page.waitForTimeout(2000);

      // Restore network and retry
      await utils.errors.restoreNetwork();

      // Migration should eventually succeed
      await utils.migration.verifyMigrationSuccess(transactions.length);

      console.log('✅ Migration recovery from interruption successful');
    });

    test('should handle rapid authentication state changes', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('small');

      console.log('🧪 Testing rapid auth state changes during migration...');

      await utils.migration.setupMigrationScenario(transactions);

      // Rapid auth state changes (login/logout/login)
      await utils.auth.simulateAuthentication('rapid-change-user-1');
      await page.waitForTimeout(100);

      await utils.auth.simulateLogout();
      await page.waitForTimeout(100);

      await utils.auth.simulateAuthentication('rapid-change-user-2');

      // Should eventually stabilize and migrate data
      await utils.migration.verifyMigrationSuccess(transactions.length);

      console.log('✅ Rapid auth state changes handled gracefully');
    });
  });

  test.describe('Migration Logging & Debugging', () => {
    test('should log migration progress correctly', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('small');

      console.log('🧪 Testing migration logging...');

      await utils.migration.setupMigrationScenario(transactions);

      // Monitor console logs during migration
      const logPatterns = [
        /Auth state changed from anonymous to authenticated/,
        /triggering migration/i,
        /Migration completed.*transactions migrated/i,
      ];

      await utils.migration.triggerMigration('logging-test-user');

      // Verify expected log messages appeared
      for (const pattern of logPatterns) {
        expect(utils.console.hasLog(pattern)).toBe(true);
      }

      const migrationLogs = utils.console.getMatchingLogs('migration');
      expect(migrationLogs.length).toBeGreaterThan(0);

      console.log(`✅ Migration logging verified: ${migrationLogs.length} log entries`);
    });

    test('should provide clear error messages on migration failure', async ({ page }) => {
      const utils = createTestUtils(page);
      const transactions = getTestTransactions('small');

      console.log('🧪 Testing migration error messages...');

      await utils.migration.setupMigrationScenario(transactions);

      // Simulate storage quota exceeded
      await utils.errors.simulateStorageQuotaExceeded();

      await utils.auth.simulateAuthentication('error-test-user');

      // Look for error handling logs
      await page.waitForTimeout(3000); // Give time for error to occur

      const errorLogs = utils.console.getMatchingLogs(/migration.*failed|error/i);
      expect(errorLogs.length).toBeGreaterThan(0);

      console.log(`✅ Migration error logging verified: ${errorLogs.length} error entries`);
    });
  });

  test.describe('Cross-tab Migration Scenarios', () => {
    test('should handle migration when multiple tabs are open', async ({ browser }) => {
      console.log('🧪 Testing cross-tab migration behavior...');

      // Create two tabs
      const context = await browser.newContext();
      const tab1 = await context.newPage();
      const tab2 = await context.newPage();

      const utils1 = createTestUtils(tab1);
      const utils2 = createTestUtils(tab2);

      // Setup data in tab1
      const transactions = getTestTransactions('small');
      await utils1.migration.setupMigrationScenario(transactions);

      // Open tab2 with same data
      await tab2.goto('/');
      await utils2.localStorage.waitForTransactionsLoaded(transactions.length);

      // Trigger migration in tab1
      await utils1.migration.triggerMigration('cross-tab-user');

      // Tab2 should also see the migration effect
      await tab2.waitForTimeout(2000); // Allow for cross-tab synchronization
      await tab2.reload();
      await utils2.localStorage.waitForTransactionsLoaded(transactions.length);

      // Both tabs should show authenticated state
      expect(await utils1.auth.isAuthenticated()).toBe(true);
      expect(await utils2.auth.isAuthenticated()).toBe(true);

      await context.close();

      console.log('✅ Cross-tab migration behavior verified');
    });
  });
});
