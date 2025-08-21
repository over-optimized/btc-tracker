import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Transaction } from '../../types/Transaction';
import {
  clearTransactions,
  exportTransactions,
  getStorageInfo,
  getTransactions,
  importTransactions,
  saveTransactions,
  type StorageLoadResult,
} from '../storage';
import {
  CURRENT_STORAGE_VERSION,
  getStorageVersion,
  STORAGE_VERSION_KEY,
  type StorageVersion,
} from '../dataMigration';

// Mock localStorage with real implementation
const createMockLocalStorage = () => {
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
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
};

// Replace global localStorage
const mockLocalStorage = createMockLocalStorage();
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('storage.ts', () => {
  const STORAGE_KEY = 'btc-tracker:transactions';

  // Sample transactions for testing
  const createSampleTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
    id: 'test-transaction-1',
    date: new Date('2025-01-15T10:00:00Z'),
    exchange: 'Strike',
    type: 'Purchase',
    usdAmount: 100,
    btcAmount: 0.001,
    price: 100000,
    ...overrides,
  });

  const createSampleTransactions = (): Transaction[] => [
    createSampleTransaction({
      id: 'tx-1',
      usdAmount: 100,
      btcAmount: 0.001,
    }),
    createSampleTransaction({
      id: 'tx-2',
      date: new Date('2025-01-16T10:00:00Z'),
      usdAmount: 200,
      btcAmount: 0.002,
      price: 100000,
    }),
    createSampleTransaction({
      id: 'tx-3',
      date: new Date('2025-01-17T10:00:00Z'),
      type: 'Withdrawal',
      usdAmount: 0,
      btcAmount: -0.0005,
      destinationWallet: 'bc1qtest',
      isSelfCustody: true,
    }),
  ];

  beforeEach(() => {
    // Clear localStorage before each test
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    mockLocalStorage.clear();
  });

  describe('getTransactions', () => {
    it('should return empty array and set version for new users', () => {
      const result = getTransactions();

      expect(result.transactions).toEqual([]);
      expect(result.needsAttention).toBe(false);
      expect(result.migrationResult).toBeUndefined();

      // Should have set current version
      const version = getStorageVersion();
      expect(version?.version).toBe(CURRENT_STORAGE_VERSION);
    });

    it('should return saved transactions when they exist', () => {
      const transactions = createSampleTransactions();

      // Manually save transactions to test retrieval
      const serializedTransactions = transactions.map((tx) => ({
        ...tx,
        date: tx.date.toISOString(),
      }));
      mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify(serializedTransactions));
      mockLocalStorage.setItem(
        STORAGE_VERSION_KEY,
        JSON.stringify({
          version: CURRENT_STORAGE_VERSION,
          migratedAt: new Date().toISOString(),
        }),
      );

      const result = getTransactions();

      expect(result.transactions).toHaveLength(3);
      expect(result.transactions[0].id).toBe('tx-1');
      expect(result.transactions[0].date).toBeInstanceOf(Date);
      expect(result.needsAttention).toBe(false);
    });

    it('should handle corrupted JSON data gracefully', () => {
      mockLocalStorage.setItem(STORAGE_KEY, 'invalid-json{');

      const result = getTransactions();

      expect(result.transactions).toEqual([]);
      expect(result.needsAttention).toBe(true);
    });

    it('should filter out corrupted transactions', () => {
      const invalidTransactions = [
        createSampleTransaction({ id: 'valid-tx' }),
        {
          id: '',
          date: new Date(),
          exchange: '',
          type: '',
          usdAmount: NaN,
          btcAmount: 0,
          price: 0,
        }, // Invalid
        createSampleTransaction({ id: 'valid-tx-2', usdAmount: 50 }),
        {
          id: 'invalid-purchase',
          date: new Date(),
          exchange: 'Test',
          type: 'Purchase',
          usdAmount: 0,
          btcAmount: 0,
          price: 0,
        }, // Invalid purchase
      ];

      const serializedTransactions = invalidTransactions.map((tx) => ({
        ...tx,
        date: tx.date.toISOString(),
      }));

      mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify(serializedTransactions));
      mockLocalStorage.setItem(
        STORAGE_VERSION_KEY,
        JSON.stringify({
          version: CURRENT_STORAGE_VERSION,
          migratedAt: new Date().toISOString(),
        }),
      );

      const result = getTransactions();

      // Should only return valid transactions
      expect(result.transactions).toHaveLength(2);
      expect(result.transactions[0].id).toBe('valid-tx');
      expect(result.transactions[1].id).toBe('valid-tx-2');
    });

    it('should trigger migration when storage version is outdated', () => {
      const transactions = createSampleTransactions();
      const serializedTransactions = transactions.map((tx) => ({
        ...tx,
        date: tx.date.toISOString(),
      }));

      mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify(serializedTransactions));
      mockLocalStorage.setItem(
        STORAGE_VERSION_KEY,
        JSON.stringify({
          version: 1, // Old version
          migratedAt: new Date().toISOString(),
        }),
      );

      const result = getTransactions();

      expect(result.migrationResult).toBeDefined();
      expect(result.migrationResult?.success).toBe(true);
      expect(result.transactions).toHaveLength(3);
    });
  });

  describe('saveTransactions', () => {
    it('should save transactions to localStorage', () => {
      const transactions = createSampleTransactions();

      saveTransactions(transactions);

      const saved = mockLocalStorage.getItem(STORAGE_KEY);
      expect(saved).toBeDefined();

      const parsed = JSON.parse(saved!);
      expect(parsed).toHaveLength(3);
      expect(parsed[0].id).toBe('tx-1');
    });

    it('should update storage version when saving', () => {
      const transactions = createSampleTransactions();

      saveTransactions(transactions);

      const version = getStorageVersion();
      expect(version?.version).toBe(CURRENT_STORAGE_VERSION);
      expect(version?.migratedAt).toBeInstanceOf(Date);
    });

    it('should handle localStorage quota exceeded error', () => {
      const transactions = createSampleTransactions();

      // Mock localStorage.setItem to throw quota exceeded error
      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => saveTransactions(transactions)).toThrow(
        'Unable to save transaction data to local storage',
      );

      // Restore original setItem
      mockLocalStorage.setItem = originalSetItem;
    });
  });

  describe('clearTransactions', () => {
    it('should remove all transaction data and version info', () => {
      const transactions = createSampleTransactions();
      saveTransactions(transactions);

      // Verify data exists
      expect(mockLocalStorage.getItem(STORAGE_KEY)).toBeDefined();
      expect(mockLocalStorage.getItem(STORAGE_VERSION_KEY)).toBeDefined();

      clearTransactions();

      // Verify data is removed
      expect(mockLocalStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(mockLocalStorage.getItem(STORAGE_VERSION_KEY)).toBeNull();
    });
  });

  describe('getStorageInfo', () => {
    it('should return correct info for empty storage', () => {
      const info = getStorageInfo();

      expect(info.hasTransactions).toBe(false);
      expect(info.transactionCount).toBe(0);
      expect(info.storageVersion).toBeNull();
      expect(info.needsMigration).toBe(true); // No version means needs migration
      expect(info.storageSize).toBe(0);
    });

    it('should return correct info with transactions', () => {
      const transactions = createSampleTransactions();
      saveTransactions(transactions);

      const info = getStorageInfo();

      expect(info.hasTransactions).toBe(true);
      expect(info.transactionCount).toBe(3);
      expect(info.storageVersion?.version).toBe(CURRENT_STORAGE_VERSION);
      expect(info.needsMigration).toBe(false);
      expect(info.storageSize).toBeGreaterThan(0);
    });

    it('should handle corrupted transaction data', () => {
      mockLocalStorage.setItem(STORAGE_KEY, 'invalid-json');

      const info = getStorageInfo();

      expect(info.hasTransactions).toBe(true);
      expect(info.transactionCount).toBe(0); // Corrupted data returns 0 count
      expect(info.storageSize).toBeGreaterThan(0);
    });
  });

  describe('exportTransactions', () => {
    it('should export transactions as JSON', () => {
      const transactions = createSampleTransactions();
      saveTransactions(transactions);

      const exported = exportTransactions('json');
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveLength(3);
      expect(parsed[0].id).toBe('tx-1');
      expect(parsed[0].date).toBeDefined();
    });

    it('should export transactions as CSV', () => {
      const transactions = createSampleTransactions();
      saveTransactions(transactions);

      const exported = exportTransactions('csv');
      const lines = exported.split('\n');

      expect(lines[0]).toBe('ID,Date,Exchange,Type,USD Amount,BTC Amount,Price'); // Header
      expect(lines).toHaveLength(4); // Header + 3 transactions
      expect(lines[1]).toContain('tx-1');
    });

    it('should handle empty transactions', () => {
      const exported = exportTransactions('json');
      const parsed = JSON.parse(exported);

      expect(parsed).toEqual([]);
    });
  });

  describe('importTransactions', () => {
    it('should import JSON transactions successfully', () => {
      const transactions = createSampleTransactions();
      const jsonData = JSON.stringify(
        transactions.map((tx) => ({
          ...tx,
          date: tx.date.toISOString(),
        })),
      );

      const result = importTransactions(jsonData, 'json');

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(3);
      expect(result.error).toBeUndefined();

      // Verify transactions were saved
      const saved = getTransactions();
      expect(saved.transactions).toHaveLength(3);
    });

    it('should import CSV transactions successfully', () => {
      const csvData =
        'ID,Date,Exchange,Type,USD Amount,BTC Amount,Price\n' +
        'tx-1,2025-01-15T10:00:00.000Z,Strike,Purchase,100,0.001,100000\n' +
        'tx-2,2025-01-16T10:00:00.000Z,Strike,Purchase,200,0.002,100000';

      const result = importTransactions(csvData, 'csv');

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(2);

      // Verify transactions were saved
      const saved = getTransactions();
      expect(saved.transactions).toHaveLength(2);
    });

    it('should merge with existing transactions', () => {
      // Add existing transaction
      const existingTx = createSampleTransaction({ id: 'existing-1' });
      saveTransactions([existingTx]);

      // Import new transactions
      const newTransactions = createSampleTransactions();
      const jsonData = JSON.stringify(
        newTransactions.map((tx) => ({
          ...tx,
          date: tx.date.toISOString(),
        })),
      );

      const result = importTransactions(jsonData, 'json');

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(3); // All new transactions

      // Verify merge
      const saved = getTransactions();
      expect(saved.transactions).toHaveLength(4); // 1 existing + 3 new
    });

    it('should handle duplicate transactions during import', () => {
      const transactions = createSampleTransactions();
      saveTransactions(transactions);

      // Try to import the same transactions again
      const jsonData = JSON.stringify(
        transactions.map((tx) => ({
          ...tx,
          date: tx.date.toISOString(),
        })),
      );

      const result = importTransactions(jsonData, 'json');

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(0); // No new transactions imported

      // Verify no duplicates
      const saved = getTransactions();
      expect(saved.transactions).toHaveLength(3);
    });

    it('should handle invalid JSON data', () => {
      const result = importTransactions('invalid-json{', 'json');

      expect(result.success).toBe(false);
      expect(result.importedCount).toBe(0);
      expect(result.error).toBeDefined();
    });

    it('should handle invalid CSV data', () => {
      const csvData = 'incomplete,csv\ndata'; // Invalid format

      const result = importTransactions(csvData, 'csv');

      expect(result.success).toBe(false);
      expect(result.importedCount).toBe(0);
      expect(result.error).toBeDefined();
    });
  });

  describe('data integrity validation', () => {
    it('should validate transaction integrity correctly', () => {
      const validTransaction = createSampleTransaction();
      const invalidTransactions = [
        { ...validTransaction, id: '' }, // Missing ID
        { ...validTransaction, date: null }, // Missing date
        { ...validTransaction, exchange: '' }, // Missing exchange
        { ...validTransaction, type: '' }, // Missing type
        { ...validTransaction, usdAmount: NaN }, // NaN amount
        { ...validTransaction, btcAmount: NaN }, // NaN amount
        { ...validTransaction, price: NaN }, // NaN price
        { ...validTransaction, type: 'Purchase', usdAmount: 0, price: 0 }, // Invalid purchase
        { ...validTransaction, type: 'Sale', usdAmount: 0 }, // Invalid sale
        { ...validTransaction, btcAmount: 0, type: 'Purchase' }, // No BTC movement
      ];

      // Save mix of valid and invalid transactions
      const mixedTransactions = [validTransaction, ...invalidTransactions];
      const serializedTransactions = mixedTransactions.map((tx) => ({
        ...tx,
        date: tx.date?.toISOString?.() || new Date().toISOString(),
      }));

      mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify(serializedTransactions));
      mockLocalStorage.setItem(
        STORAGE_VERSION_KEY,
        JSON.stringify({
          version: CURRENT_STORAGE_VERSION,
          migratedAt: new Date().toISOString(),
        }),
      );

      const result = getTransactions();

      // Should only return the valid transaction
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].id).toBe(validTransaction.id);
    });
  });

  describe('storage version management', () => {
    it('should handle missing version info', () => {
      const transactions = createSampleTransactions();
      const serializedTransactions = transactions.map((tx) => ({
        ...tx,
        date: tx.date.toISOString(),
      }));

      // Save transactions without version info
      mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify(serializedTransactions));

      const result = getTransactions();

      expect(result.migrationResult).toBeDefined();
      expect(result.migrationResult?.success).toBe(true);
    });

    it('should handle corrupted version data', () => {
      const transactions = createSampleTransactions();
      const serializedTransactions = transactions.map((tx) => ({
        ...tx,
        date: tx.date.toISOString(),
      }));

      mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify(serializedTransactions));
      mockLocalStorage.setItem(STORAGE_VERSION_KEY, 'invalid-json{');

      const result = getTransactions();

      expect(result.migrationResult).toBeDefined();
      expect(result.migrationResult?.success).toBe(true);
    });
  });
});
