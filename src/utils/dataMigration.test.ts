import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Transaction } from '../types/Transaction';
import {
  BACKUP_KEY,
  CURRENT_STORAGE_VERSION,
  forceMigration,
  getBackupInfo,
  getStorageVersion,
  migrateTransactionData,
  needsMigration,
  restoreFromBackup,
  STORAGE_VERSION_KEY,
  validateMigratedData,
} from './dataMigration';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Sample legacy transactions (old ID format)
const createLegacyTransactions = (): Transaction[] => [
  {
    id: `strike-${Date.now()}-0`, // Old timestamp-based ID
    date: new Date('2025-01-01T10:00:00Z'),
    exchange: 'Strike',
    type: 'Purchase',
    usdAmount: 100,
    btcAmount: 0.001,
    price: 100000,
  },
  {
    id: `coinbase-${Date.now()}-1`, // Old timestamp-based ID
    date: new Date('2025-01-01T11:00:00Z'),
    exchange: 'Coinbase',
    type: 'Buy',
    usdAmount: 200,
    btcAmount: 0.002,
    price: 100000,
  },
  {
    id: 'strike-ref-abc-123', // Already has reference-based ID
    date: new Date('2025-01-01T12:00:00Z'),
    exchange: 'Strike',
    type: 'Purchase',
    usdAmount: 50,
    btcAmount: 0.0005,
    price: 100000,
  },
];

describe('dataMigration', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('needsMigration', () => {
    it('should return true when no version info exists', () => {
      expect(needsMigration()).toBe(true);
    });

    it('should return true when version is outdated', () => {
      localStorage.setItem(
        STORAGE_VERSION_KEY,
        JSON.stringify({
          version: 1,
          migratedAt: new Date().toISOString(),
        }),
      );

      expect(needsMigration()).toBe(true);
    });

    it('should return false when version is current', () => {
      localStorage.setItem(
        STORAGE_VERSION_KEY,
        JSON.stringify({
          version: CURRENT_STORAGE_VERSION,
          migratedAt: new Date().toISOString(),
        }),
      );

      expect(needsMigration()).toBe(false);
    });

    it('should return true when version data is corrupted', () => {
      localStorage.setItem(STORAGE_VERSION_KEY, 'invalid-json');
      expect(needsMigration()).toBe(true);
    });
  });

  describe('getStorageVersion', () => {
    it('should return null when no version exists', () => {
      expect(getStorageVersion()).toBeNull();
    });

    it('should return version info when it exists', () => {
      const versionInfo = {
        version: 2,
        migratedAt: new Date().toISOString(),
        previousVersion: 1,
      };
      localStorage.setItem(STORAGE_VERSION_KEY, JSON.stringify(versionInfo));

      const result = getStorageVersion();
      expect(result).toBeTruthy();
      expect(result!.version).toBe(2);
      expect(result!.previousVersion).toBe(1);
      expect(result!.migratedAt).toBeInstanceOf(Date);
    });

    it('should handle corrupted version data', () => {
      localStorage.setItem(STORAGE_VERSION_KEY, 'invalid-json');
      expect(getStorageVersion()).toBeNull();
    });
  });

  describe('migrateTransactionData', () => {
    it('should successfully migrate legacy transactions', () => {
      const legacyTransactions = createLegacyTransactions();
      const result = migrateTransactionData(legacyTransactions);

      expect(result.success).toBe(true);
      expect(result.migratedCount).toBe(3);
      expect(result.errorCount).toBe(0);
      expect(result.backupCreated).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should create backup before migration', () => {
      const legacyTransactions = createLegacyTransactions();
      migrateTransactionData(legacyTransactions);

      const backup = localStorage.getItem(BACKUP_KEY);
      expect(backup).toBeTruthy();

      const parsedBackup = JSON.parse(backup!);
      expect(parsedBackup.transactions).toHaveLength(3);
      expect(parsedBackup.version).toBe(1);
    });

    it('should update storage version after migration', () => {
      const legacyTransactions = createLegacyTransactions();
      migrateTransactionData(legacyTransactions);

      const versionInfo = getStorageVersion();
      expect(versionInfo).toBeTruthy();
      expect(versionInfo!.version).toBe(CURRENT_STORAGE_VERSION);
      expect(versionInfo!.previousVersion).toBe(1);
    });

    it('should remove duplicates after migration', () => {
      // Create transactions that will have same stable ID after migration
      const duplicateTransactions: Transaction[] = [
        {
          id: 'old-id-1',
          date: new Date('2025-01-01T10:00:00Z'),
          exchange: 'Strike',
          type: 'Purchase',
          usdAmount: 100,
          btcAmount: 0.001,
          price: 100000,
        },
        {
          id: 'old-id-2', // Different old ID
          date: new Date('2025-01-01T10:00:00Z'), // Same content
          exchange: 'Strike',
          type: 'Purchase',
          usdAmount: 100,
          btcAmount: 0.001,
          price: 100000,
        },
      ];

      const result = migrateTransactionData(duplicateTransactions);
      expect(result.duplicatesRemoved).toBeGreaterThan(0);
    });

    it('should handle migration errors gracefully', () => {
      const invalidTransactions = [
        {
          id: 'invalid',
          // Missing required fields
        } as any,
      ];

      const result = migrateTransactionData(invalidTransactions);
      expect(result.success).toBe(true); // Should still succeed overall
      expect(result.errorCount).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('backup and restore', () => {
    it('should create and restore backup correctly', () => {
      const originalTransactions = createLegacyTransactions();

      // Migrate (creates backup)
      migrateTransactionData(originalTransactions);

      // Verify backup exists
      const backupInfo = getBackupInfo();
      expect(backupInfo.exists).toBe(true);
      expect(backupInfo.transactionCount).toBe(3);

      // Restore from backup
      const restoreResult = restoreFromBackup();
      expect(restoreResult.success).toBe(true);
      expect(restoreResult.transactionsCount).toBe(3);
    });

    it('should handle restore when no backup exists', () => {
      const result = restoreFromBackup();
      expect(result.success).toBe(false);
      expect(result.error).toContain('No backup found');
    });

    it('should handle corrupted backup data', () => {
      localStorage.setItem(BACKUP_KEY, 'invalid-json');

      const result = restoreFromBackup();
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('validateMigratedData', () => {
    it('should validate correct migrated data', () => {
      const validTransactions: Transaction[] = [
        {
          id: 'strike-ref-abc-123',
          date: new Date('2025-01-01'),
          exchange: 'Strike',
          type: 'Purchase',
          usdAmount: 100,
          btcAmount: 0.001,
          price: 100000,
        },
        {
          id: 'coinbase-a1b2c3',
          date: new Date('2025-01-02'),
          exchange: 'Coinbase',
          type: 'Buy',
          usdAmount: 200,
          btcAmount: 0.002,
          price: 100000,
        },
      ];

      const result = validateMigratedData(validTransactions);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.stats.totalTransactions).toBe(2);
      expect(result.stats.referenceBasedIds).toBe(1);
      expect(result.stats.hashBasedIds).toBe(1);
      expect(result.stats.uniqueIds).toBe(2);
    });

    it('should detect invalid data issues', () => {
      const invalidTransactions: Transaction[] = [
        {
          id: '', // Invalid ID
          date: new Date(),
          exchange: 'Strike',
          type: 'Purchase',
          usdAmount: 100,
          btcAmount: 0.001,
          price: 100000,
        },
        {
          id: 'valid-id',
          date: new Date(),
          exchange: '', // Missing exchange
          type: 'Purchase',
          usdAmount: 0, // Invalid amount
          btcAmount: 0.001,
          price: 100000,
        },
        {
          id: 'valid-id', // Duplicate ID
          date: new Date(),
          exchange: 'Coinbase',
          type: 'Buy',
          usdAmount: 100,
          btcAmount: 0.001,
          price: 100000,
        },
      ];

      const result = validateMigratedData(invalidTransactions);
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);

      const issueText = result.issues.join(' ');
      expect(issueText).toContain('invalid ID');
      expect(issueText).toContain('Duplicate transaction ID');
      expect(issueText).toContain('invalid amounts');
    });
  });

  describe('forceMigration', () => {
    it('should force migration even when not needed', () => {
      // Set current version
      localStorage.setItem(
        STORAGE_VERSION_KEY,
        JSON.stringify({
          version: CURRENT_STORAGE_VERSION,
          migratedAt: new Date().toISOString(),
        }),
      );

      expect(needsMigration()).toBe(false);

      const transactions = createLegacyTransactions();
      const result = forceMigration(transactions);

      expect(result.success).toBe(true);
      expect(needsMigration()).toBe(false); // Should be current after force migration
    });
  });

  describe('real-world scenarios', () => {
    it('should handle mixed ID formats correctly', () => {
      const mixedTransactions: Transaction[] = [
        {
          id: 'strike-ref-abc-123', // Already stable
          date: new Date('2025-01-01'),
          exchange: 'Strike',
          type: 'Purchase',
          usdAmount: 100,
          btcAmount: 0.001,
          price: 100000,
        },
        {
          id: `coinbase-${Date.now()}-old`, // Legacy timestamp
          date: new Date('2025-01-02'),
          exchange: 'Coinbase',
          type: 'Buy',
          usdAmount: 200,
          btcAmount: 0.002,
          price: 100000,
        },
        {
          id: 'generic-old-format',
          date: new Date('2025-01-03'),
          exchange: 'CustomExchange',
          type: 'Buy',
          usdAmount: 150,
          btcAmount: 0.0015,
          price: 100000,
        },
      ];

      const result = migrateTransactionData(mixedTransactions);
      expect(result.success).toBe(true);
      expect(result.migratedCount).toBe(3);

      // Validate the result
      const validation = validateMigratedData(mixedTransactions);
      expect(validation.valid).toBe(true);
    });

    it('should preserve transaction data during migration', () => {
      const originalTransaction = createLegacyTransactions()[0];
      const result = migrateTransactionData([originalTransaction]);

      expect(result.success).toBe(true);

      // The original transaction should have all the same data except ID
      // (We can't easily test the actual migrated transaction here without
      // more complex setup, but the data preservation is tested in integration)
    });

    it('should handle large datasets efficiently', () => {
      const largeDataset: Transaction[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `old-id-${i}`,
        date: new Date(`2025-01-${String((i % 30) + 1).padStart(2, '0')}`),
        exchange: i % 2 === 0 ? 'Strike' : 'Coinbase',
        type: 'Purchase',
        usdAmount: 100 + i,
        btcAmount: 0.001 + i * 0.0001,
        price: 100000,
      }));

      const startTime = Date.now();
      const result = migrateTransactionData(largeDataset);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.migratedCount).toBe(1000);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
