/**
 * Test Utilities - E2E Helper Functions
 * Common utilities for Playwright E2E tests
 */

import { Page, expect } from '@playwright/test';
import { Transaction } from '../../src/types/Transaction';
import { createLocalStorageData } from '../fixtures/test-transactions';

export interface StorageTestOptions {
  clearFirst?: boolean;
  waitForLoad?: boolean;
  expectCount?: number;
}

/**
 * localStorage Test Utilities
 */
export class LocalStorageTestUtils {
  constructor(private page: Page) {}

  /**
   * Set transaction data in localStorage
   */
  async setTransactions(transactions: Transaction[], options: StorageTestOptions = {}) {
    const { clearFirst = true } = options;

    if (clearFirst) {
      await this.clear();
    }

    const data = createLocalStorageData({
      name: 'test',
      description: 'test data',
      transactions,
    });

    await this.page.evaluate((data) => {
      localStorage.setItem('btc-tracker-transactions', JSON.stringify(data));
      localStorage.setItem(
        'btc-tracker-exchanges',
        JSON.stringify([...new Set(data.transactions.map((t) => t.exchange))]),
      );
    }, data);

    console.log(`📁 Set ${transactions.length} transactions in localStorage`);
  }

  /**
   * Get transaction data from localStorage
   */
  async getTransactions(): Promise<Transaction[]> {
    const data = await this.page.evaluate(() => {
      const stored = localStorage.getItem('btc-tracker-transactions');
      return stored ? JSON.parse(stored) : null;
    });

    return data?.transactions || [];
  }

  /**
   * Clear all localStorage data
   */
  async clear() {
    await this.page.evaluate(() => {
      localStorage.removeItem('btc-tracker-transactions');
      localStorage.removeItem('btc-tracker-exchanges');
      // Clear any other btc-tracker keys
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('btc-tracker')) {
          localStorage.removeItem(key);
        }
      });
    });

    console.log('🧹 Cleared localStorage');
  }

  /**
   * Wait for transaction data to be loaded in the UI
   */
  async waitForTransactionsLoaded(expectedCount?: number) {
    if (expectedCount !== undefined) {
      await expect(this.page.getByTestId('transaction-count')).toHaveText(
        expectedCount.toString(),
        { timeout: 10000 },
      );
    } else {
      // Wait for loading state to complete
      await this.page.waitForSelector('[data-testid="dashboard-stats"]', { timeout: 10000 });
    }
  }

  /**
   * Check if localStorage is empty
   */
  async isEmpty(): Promise<boolean> {
    const transactions = await this.getTransactions();
    return transactions.length === 0;
  }
}

/**
 * Authentication Test Utilities
 */
export class AuthTestUtils {
  constructor(private page: Page) {}

  /**
   * Wait for auth loading to complete
   */
  async waitForAuthReady() {
    // Wait for auth context to initialize
    await this.page.waitForFunction(
      () => {
        return (
          window.localStorage.getItem('supabase.auth.token') !== undefined ||
          document.querySelector('[data-auth-state]') !== null
        );
      },
      { timeout: 10000 },
    );
  }

  /**
   * Check if user is in anonymous state
   */
  async isAnonymous(): Promise<boolean> {
    return await this.page.evaluate(() => {
      // Check for auth UI elements that indicate anonymous state
      return (
        document.querySelector('[data-testid="auth-button"]') !== null ||
        document.querySelector('[data-testid="signup-button"]') !== null
      );
    });
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return await this.page.evaluate(() => {
      return window.localStorage.getItem('supabase.auth.token') !== null;
    });
  }

  /**
   * Simulate authentication state change
   * Note: This is a mock for testing - real auth would go through Supabase
   */
  async simulateAuthentication(userId: string = 'test-user-123') {
    await this.page.evaluate((userId) => {
      // Mock auth token in localStorage
      window.localStorage.setItem(
        'supabase.auth.token',
        JSON.stringify({
          access_token: 'mock-token',
          user: { id: userId },
          expires_at: Date.now() + 3600000, // 1 hour from now
        }),
      );

      // Trigger auth state change event
      window.dispatchEvent(
        new CustomEvent('auth-state-changed', {
          detail: { authenticated: true, userId },
        }),
      );
    }, userId);

    console.log(`🔐 Simulated authentication for user: ${userId}`);
  }

  /**
   * Simulate logout
   */
  async simulateLogout() {
    await this.page.evaluate(() => {
      // Clear auth data
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth')) {
          localStorage.removeItem(key);
        }
      });

      // Trigger auth state change event
      window.dispatchEvent(
        new CustomEvent('auth-state-changed', {
          detail: { authenticated: false },
        }),
      );
    });

    console.log('🚪 Simulated logout');
  }
}

/**
 * Migration Test Utilities
 */
export class MigrationTestUtils {
  private localStorage: LocalStorageTestUtils;
  private auth: AuthTestUtils;

  constructor(private page: Page) {
    this.localStorage = new LocalStorageTestUtils(page);
    this.auth = new AuthTestUtils(page);
  }

  /**
   * Setup migration test scenario
   */
  async setupMigrationScenario(transactions: Transaction[]) {
    console.log('🔧 Setting up migration test scenario...');

    // 1. Clear any existing data
    await this.localStorage.clear();

    // 2. Set up localStorage data (anonymous state)
    await this.localStorage.setTransactions(transactions);

    // 3. Navigate to app
    await this.page.goto('/');

    // 4. Wait for app to load
    await this.page.waitForLoadState('networkidle');
    await this.localStorage.waitForTransactionsLoaded(transactions.length);

    console.log(`✅ Migration scenario ready with ${transactions.length} transactions`);
  }

  /**
   * Trigger migration by simulating authentication
   */
  async triggerMigration(userId: string = 'migration-test-user') {
    console.log('🚀 Triggering migration...');

    const beforeCount = await this.localStorage.getTransactions();
    console.log(`📊 Pre-migration: ${beforeCount.length} transactions in localStorage`);

    // Simulate authentication to trigger migration
    await this.auth.simulateAuthentication(userId);

    // Wait for migration to complete
    await this.waitForMigrationComplete();

    console.log('✅ Migration triggered and completed');
  }

  /**
   * Wait for migration to complete by watching console logs
   */
  async waitForMigrationComplete() {
    let migrationCompleted = false;

    // Listen for migration completion logs
    this.page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('Migration completed:') || text.includes('migration successful')) {
        migrationCompleted = true;
      }
    });

    // Wait for migration completion with timeout
    await this.page.waitForFunction(
      () => {
        // Check if localStorage has been cleared (sign of successful migration)
        const stored = localStorage.getItem('btc-tracker-transactions');
        return !stored || JSON.parse(stored).transactions.length === 0;
      },
      { timeout: 15000 },
    );

    console.log('✅ Migration completion detected');
  }

  /**
   * Verify migration results
   */
  async verifyMigrationSuccess(expectedCount: number) {
    console.log('🔍 Verifying migration results...');

    // 1. Check that localStorage is cleared
    const localTransactions = await this.localStorage.getTransactions();
    expect(localTransactions).toHaveLength(0);
    console.log('✅ localStorage cleared after migration');

    // 2. Check that user is authenticated
    const isAuth = await this.auth.isAuthenticated();
    expect(isAuth).toBe(true);
    console.log('✅ User is authenticated');

    // 3. Check that data is still visible in UI
    await this.localStorage.waitForTransactionsLoaded(expectedCount);
    console.log(`✅ ${expectedCount} transactions still visible in UI`);

    // 4. Verify data persistence after page refresh
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
    await this.localStorage.waitForTransactionsLoaded(expectedCount);
    console.log('✅ Data persists after page refresh');
  }
}

/**
 * Performance Test Utilities
 */
export class PerformanceTestUtils {
  constructor(private page: Page) {}

  /**
   * Measure operation performance
   */
  async measureOperation<T>(
    name: string,
    operation: () => Promise<T>,
  ): Promise<{ result: T; duration: number }> {
    console.log(`⏱️ Starting performance measurement: ${name}`);

    const start = performance.now();
    const result = await operation();
    const duration = performance.now() - start;

    console.log(`✅ ${name} completed in ${duration.toFixed(2)}ms`);

    return { result, duration };
  }

  /**
   * Monitor memory usage during operation
   */
  async monitorMemoryDuringOperation<T>(
    operation: () => Promise<T>,
  ): Promise<{ result: T; memoryDelta: number }> {
    const beforeMemory = await this.getMemoryUsage();
    const result = await operation();
    const afterMemory = await this.getMemoryUsage();

    const memoryDelta = afterMemory - beforeMemory;
    console.log(`📊 Memory delta: ${memoryDelta.toFixed(2)}MB`);

    return { result, memoryDelta };
  }

  /**
   * Get current memory usage
   */
  private async getMemoryUsage(): Promise<number> {
    return await this.page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize / 1024 / 1024;
      }
      return 0;
    });
  }

  /**
   * Wait for network idle (no requests for specified time)
   */
  async waitForNetworkIdle(idleTime: number = 2000) {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(idleTime);
  }
}

/**
 * Error Simulation Utilities
 */
export class ErrorSimulationUtils {
  constructor(private page: Page) {}

  /**
   * Simulate network failure
   */
  async simulateNetworkFailure() {
    await this.page.route('**/*', (route) => {
      route.abort('failed');
    });
    console.log('🌐 Network failure simulated');
  }

  /**
   * Simulate slow network
   */
  async simulateSlowNetwork(delayMs: number = 5000) {
    await this.page.route('**/*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await route.continue();
    });
    console.log(`🐌 Slow network simulated (${delayMs}ms delay)`);
  }

  /**
   * Restore network
   */
  async restoreNetwork() {
    await this.page.unroute('**/*');
    console.log('🌐 Network restored');
  }

  /**
   * Simulate storage quota exceeded
   */
  async simulateStorageQuotaExceeded() {
    await this.page.addInitScript(() => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key.startsWith('btc-tracker')) {
          throw new Error('QuotaExceededError: Failed to execute setItem on Storage');
        }
        return originalSetItem.call(this, key, value);
      };
    });
    console.log('💾 Storage quota exceeded simulation enabled');
  }
}

/**
 * Console Log Monitor
 */
export class ConsoleMonitor {
  private logs: string[] = [];

  constructor(private page: Page) {
    this.page.on('console', (msg) => {
      this.logs.push(msg.text());
    });
  }

  /**
   * Check if specific log message appeared
   */
  hasLog(pattern: string | RegExp): boolean {
    if (typeof pattern === 'string') {
      return this.logs.some((log) => log.includes(pattern));
    }
    return this.logs.some((log) => pattern.test(log));
  }

  /**
   * Get all logs matching pattern
   */
  getMatchingLogs(pattern: string | RegExp): string[] {
    if (typeof pattern === 'string') {
      return this.logs.filter((log) => log.includes(pattern));
    }
    return this.logs.filter((log) => pattern.test(log));
  }

  /**
   * Clear collected logs
   */
  clear() {
    this.logs = [];
  }

  /**
   * Get all logs
   */
  getAllLogs(): string[] {
    return [...this.logs];
  }
}

/**
 * Helper to create all test utilities for a page
 */
export function createTestUtils(page: Page) {
  return {
    localStorage: new LocalStorageTestUtils(page),
    auth: new AuthTestUtils(page),
    migration: new MigrationTestUtils(page),
    performance: new PerformanceTestUtils(page),
    errors: new ErrorSimulationUtils(page),
    console: new ConsoleMonitor(page),
  };
}
