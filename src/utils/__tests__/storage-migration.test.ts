/**
 * Storage Migration Unit Tests
 * Tests the specific migration logic and data transformation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Transaction } from '../../types/Transaction';

// Test data fixtures
const createTestTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'test-tx-1',
  date: new Date('2024-01-15').toISOString(),
  exchange: 'Test Exchange',
  type: 'Purchase',
  usdAmount: 1000,
  btcAmount: 0.025,
  price: 40000,
  ...overrides,
});

const createTestTransactionSet = (count: number): Transaction[] =>
  Array.from({ length: count }, (_, i) =>
    createTestTransaction({
      id: `test-tx-${i + 1}`,
      usdAmount: 100 + i * 50,
      btcAmount: (100 + i * 50) / 45000,
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    }),
  );

describe('Storage Migration Logic', () => {
  let mockLocalStorageProvider: any;
  let mockSupabaseProvider: any;
  let autoStorageProvider: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage provider
    mockLocalStorageProvider = {
      getTransactions: vi.fn(),
      clearTransactions: vi.fn(),
    };

    // Mock Supabase provider
    mockSupabaseProvider = {
      saveTransactions: vi.fn(),
    };

    // Mock AutoStorageProvider
    autoStorageProvider = {
      localProvider: mockLocalStorageProvider,
      supabaseProvider: mockSupabaseProvider,
      invalidateTransactionCache: vi.fn(),
      createResult: (success: boolean, data: any, error?: string, operation?: string) => ({
        success,
        data,
        error,
        operation,
        timestamp: new Date().toISOString(),
      }),
      handleError: (error: Error, operation: string) => ({
        success: false,
        error: error.message,
        operation,
        timestamp: new Date().toISOString(),
      }),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Migration Scenarios', () => {
    it('should migrate single transaction successfully', async () => {
      const transaction = createTestTransaction();
      const transactions = [transaction];

      // Mock successful localStorage read
      mockLocalStorageProvider.getTransactions.mockResolvedValue({
        success: true,
        data: transactions,
      });

      // Mock successful Supabase save
      mockSupabaseProvider.saveTransactions.mockResolvedValue({
        success: true,
        data: transactions,
      });

      // Mock successful localStorage clear
      mockLocalStorageProvider.clearTransactions.mockResolvedValue({
        success: true,
      });

      // Import the actual migration function from AutoStorageProvider
      const { AutoStorageProvider } = await import('../AutoStorageProvider');
      const provider = new AutoStorageProvider();

      // Set up mocked providers
      (provider as any).localProvider = mockLocalStorageProvider;
      (provider as any).supabaseProvider = mockSupabaseProvider;

      const result = await provider.migrateToAuthenticated();

      expect(result.success).toBe(true);
      expect(result.data?.migrated).toBe(1);
      expect(result.data?.errors).toBe(0);
      expect(mockLocalStorageProvider.getTransactions).toHaveBeenCalled();
      expect(mockSupabaseProvider.saveTransactions).toHaveBeenCalledWith(transactions);
      expect(mockLocalStorageProvider.clearTransactions).toHaveBeenCalled();
    });

    it('should migrate multiple transactions preserving order', async () => {
      const transactions = createTestTransactionSet(5);

      mockLocalStorageProvider.getTransactions.mockResolvedValue({
        success: true,
        data: transactions,
      });

      mockSupabaseProvider.saveTransactions.mockResolvedValue({
        success: true,
        data: transactions,
      });

      mockLocalStorageProvider.clearTransactions.mockResolvedValue({
        success: true,
      });

      const { AutoStorageProvider } = await import('../AutoStorageProvider');
      const provider = new AutoStorageProvider();
      (provider as any).localProvider = mockLocalStorageProvider;
      (provider as any).supabaseProvider = mockSupabaseProvider;

      const result = await provider.migrateToAuthenticated();

      expect(result.success).toBe(true);
      expect(result.data?.migrated).toBe(5);
      expect(mockSupabaseProvider.saveTransactions).toHaveBeenCalledWith(transactions);
    });

    it('should handle empty localStorage gracefully', async () => {
      mockLocalStorageProvider.getTransactions.mockResolvedValue({
        success: true,
        data: [],
      });

      const { AutoStorageProvider } = await import('../AutoStorageProvider');
      const provider = new AutoStorageProvider();
      (provider as any).localProvider = mockLocalStorageProvider;
      (provider as any).supabaseProvider = mockSupabaseProvider;

      const result = await provider.migrateToAuthenticated();

      expect(result.success).toBe(true);
      expect(result.data?.migrated).toBe(0);
      expect(result.data?.errors).toBe(0);
      expect(mockSupabaseProvider.saveTransactions).not.toHaveBeenCalled();
      expect(mockLocalStorageProvider.clearTransactions).not.toHaveBeenCalled();
    });
  });

  describe('Data Integrity During Migration', () => {
    it('should preserve transaction data structure', async () => {
      const originalTransaction = createTestTransaction({
        id: 'integrity-test',
        usdAmount: 1234.56,
        btcAmount: 0.02469136,
        price: 50000.99,
        exchange: 'Complex Exchange Name',
        type: 'Purchase',
        date: '2024-02-15T14:30:00.000Z',
      });

      mockLocalStorageProvider.getTransactions.mockResolvedValue({
        success: true,
        data: [originalTransaction],
      });

      mockSupabaseProvider.saveTransactions.mockImplementation((transactions) => {
        // Verify the exact transaction data was passed
        expect(transactions).toHaveLength(1);
        expect(transactions[0]).toEqual(originalTransaction);
        return Promise.resolve({ success: true, data: transactions });
      });

      mockLocalStorageProvider.clearTransactions.mockResolvedValue({
        success: true,
      });

      const { AutoStorageProvider } = await import('../AutoStorageProvider');
      const provider = new AutoStorageProvider();
      (provider as any).localProvider = mockLocalStorageProvider;
      (provider as any).supabaseProvider = mockSupabaseProvider;

      const result = await provider.migrateToAuthenticated();

      expect(result.success).toBe(true);
      expect(mockSupabaseProvider.saveTransactions).toHaveBeenCalledWith([originalTransaction]);
    });

    it('should handle transactions with extended fields', async () => {
      const extendedTransaction = createTestTransaction({
        id: 'extended-test',
        destinationWallet: 'Hardware Wallet',
        networkFee: 0.0001,
        isSelfCustody: true,
        isTaxable: false,
        counterparty: 'P2P Seller',
        goodsServices: 'Coffee purchase',
        sourceExchange: 'Exchange A',
        destinationExchange: 'Exchange B',
      });

      mockLocalStorageProvider.getTransactions.mockResolvedValue({
        success: true,
        data: [extendedTransaction],
      });

      mockSupabaseProvider.saveTransactions.mockResolvedValue({
        success: true,
        data: [extendedTransaction],
      });

      mockLocalStorageProvider.clearTransactions.mockResolvedValue({
        success: true,
      });

      const { AutoStorageProvider } = await import('../AutoStorageProvider');
      const provider = new AutoStorageProvider();
      (provider as any).localProvider = mockLocalStorageProvider;
      (provider as any).supabaseProvider = mockSupabaseProvider;

      const result = await provider.migrateToAuthenticated();

      expect(result.success).toBe(true);
      expect(mockSupabaseProvider.saveTransactions).toHaveBeenCalledWith([extendedTransaction]);
    });

    it('should handle duplicate transaction IDs', async () => {
      const baseTransaction = createTestTransaction();
      const duplicates = [
        baseTransaction,
        { ...baseTransaction, usdAmount: 2000 }, // Same ID, different amount
        { ...baseTransaction, date: new Date().toISOString() }, // Same ID, different date
      ];

      mockLocalStorageProvider.getTransactions.mockResolvedValue({
        success: true,
        data: duplicates,
      });

      mockSupabaseProvider.saveTransactions.mockResolvedValue({
        success: true,
        data: duplicates,
      });

      mockLocalStorageProvider.clearTransactions.mockResolvedValue({
        success: true,
      });

      const { AutoStorageProvider } = await import('../AutoStorageProvider');
      const provider = new AutoStorageProvider();
      (provider as any).localProvider = mockLocalStorageProvider;
      (provider as any).supabaseProvider = mockSupabaseProvider;

      const result = await provider.migrateToAuthenticated();

      expect(result.success).toBe(true);
      expect(result.data?.migrated).toBe(3);
      expect(mockSupabaseProvider.saveTransactions).toHaveBeenCalledWith(duplicates);
    });
  });

  describe('Migration Failure Scenarios', () => {
    it('should handle localStorage read failures', async () => {
      mockLocalStorageProvider.getTransactions.mockResolvedValue({
        success: false,
        error: 'localStorage access denied',
      });

      const { AutoStorageProvider } = await import('../AutoStorageProvider');
      const provider = new AutoStorageProvider();
      (provider as any).localProvider = mockLocalStorageProvider;
      (provider as any).supabaseProvider = mockSupabaseProvider;

      const result = await provider.migrateToAuthenticated();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get localStorage transactions');
      expect(result.data?.errors).toBe(1);
      expect(mockSupabaseProvider.saveTransactions).not.toHaveBeenCalled();
    });

    it('should handle Supabase save failures', async () => {
      const transactions = createTestTransactionSet(3);

      mockLocalStorageProvider.getTransactions.mockResolvedValue({
        success: true,
        data: transactions,
      });

      mockSupabaseProvider.saveTransactions.mockResolvedValue({
        success: false,
        error: 'Supabase connection timeout',
      });

      const { AutoStorageProvider } = await import('../AutoStorageProvider');
      const provider = new AutoStorageProvider();
      (provider as any).localProvider = mockLocalStorageProvider;
      (provider as any).supabaseProvider = mockSupabaseProvider;

      const result = await provider.migrateToAuthenticated();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Supabase connection timeout');
      expect(result.data?.errors).toBe(3);
      expect(mockLocalStorageProvider.clearTransactions).not.toHaveBeenCalled();
    });

    it('should handle localStorage clear failures after successful migration', async () => {
      const transactions = createTestTransactionSet(2);

      mockLocalStorageProvider.getTransactions.mockResolvedValue({
        success: true,
        data: transactions,
      });

      mockSupabaseProvider.saveTransactions.mockResolvedValue({
        success: true,
        data: transactions,
      });

      // Clear fails but migration data was saved
      mockLocalStorageProvider.clearTransactions.mockRejectedValue(
        new Error('Failed to clear localStorage'),
      );

      const { AutoStorageProvider } = await import('../AutoStorageProvider');
      const provider = new AutoStorageProvider();
      (provider as any).localProvider = mockLocalStorageProvider;
      (provider as any).supabaseProvider = mockSupabaseProvider;

      const result = await provider.migrateToAuthenticated();

      // Should still report success since data was migrated
      expect(result.success).toBe(true);
      expect(result.data?.migrated).toBe(2);
      expect(mockSupabaseProvider.saveTransactions).toHaveBeenCalledWith(transactions);
    });

    it('should handle missing providers gracefully', async () => {
      const { AutoStorageProvider } = await import('../AutoStorageProvider');
      const provider = new AutoStorageProvider();
      // Don't set up providers

      const result = await provider.migrateToAuthenticated();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Migration providers not available');
      expect(result.data?.migrated).toBe(0);
      expect(result.data?.errors).toBe(0);
    });
  });

  describe('Migration Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = createTestTransactionSet(100);

      mockLocalStorageProvider.getTransactions.mockResolvedValue({
        success: true,
        data: largeDataset,
      });

      mockSupabaseProvider.saveTransactions.mockResolvedValue({
        success: true,
        data: largeDataset,
      });

      mockLocalStorageProvider.clearTransactions.mockResolvedValue({
        success: true,
      });

      const { AutoStorageProvider } = await import('../AutoStorageProvider');
      const provider = new AutoStorageProvider();
      (provider as any).localProvider = mockLocalStorageProvider;
      (provider as any).supabaseProvider = mockSupabaseProvider;

      const startTime = Date.now();
      const result = await provider.migrateToAuthenticated();
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.data?.migrated).toBe(100);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should invalidate cache after successful migration', async () => {
      const transactions = createTestTransactionSet(2);

      mockLocalStorageProvider.getTransactions.mockResolvedValue({
        success: true,
        data: transactions,
      });

      mockSupabaseProvider.saveTransactions.mockResolvedValue({
        success: true,
        data: transactions,
      });

      mockLocalStorageProvider.clearTransactions.mockResolvedValue({
        success: true,
      });

      const { AutoStorageProvider } = await import('../AutoStorageProvider');
      const provider = new AutoStorageProvider();
      (provider as any).localProvider = mockLocalStorageProvider;
      (provider as any).supabaseProvider = mockSupabaseProvider;

      const cacheSpy = vi.spyOn(provider as any, 'invalidateTransactionCache');

      const result = await provider.migrateToAuthenticated();

      expect(result.success).toBe(true);
      expect(cacheSpy).toHaveBeenCalled();
    });
  });

  describe('Migration Edge Cases', () => {
    it('should handle transactions with null/undefined fields', async () => {
      const problematicTransaction = {
        id: 'problematic-tx',
        date: new Date().toISOString(),
        exchange: 'Test Exchange',
        type: 'Purchase',
        usdAmount: 100,
        btcAmount: 0.002,
        price: 50000,
        destinationWallet: null,
        networkFee: undefined,
        isSelfCustody: undefined,
      };

      mockLocalStorageProvider.getTransactions.mockResolvedValue({
        success: true,
        data: [problematicTransaction],
      });

      mockSupabaseProvider.saveTransactions.mockResolvedValue({
        success: true,
        data: [problematicTransaction],
      });

      mockLocalStorageProvider.clearTransactions.mockResolvedValue({
        success: true,
      });

      const { AutoStorageProvider } = await import('../AutoStorageProvider');
      const provider = new AutoStorageProvider();
      (provider as any).localProvider = mockLocalStorageProvider;
      (provider as any).supabaseProvider = mockSupabaseProvider;

      const result = await provider.migrateToAuthenticated();

      expect(result.success).toBe(true);
      expect(result.data?.migrated).toBe(1);
    });

    it('should handle extremely large individual transactions', async () => {
      const extremeTransaction = createTestTransaction({
        id: 'extreme-tx',
        usdAmount: 999999999.99,
        btcAmount: 21000000, // More BTC than will ever exist
        price: 0.000001, // Extremely low price
      });

      mockLocalStorageProvider.getTransactions.mockResolvedValue({
        success: true,
        data: [extremeTransaction],
      });

      mockSupabaseProvider.saveTransactions.mockResolvedValue({
        success: true,
        data: [extremeTransaction],
      });

      mockLocalStorageProvider.clearTransactions.mockResolvedValue({
        success: true,
      });

      const { AutoStorageProvider } = await import('../AutoStorageProvider');
      const provider = new AutoStorageProvider();
      (provider as any).localProvider = mockLocalStorageProvider;
      (provider as any).supabaseProvider = mockSupabaseProvider;

      const result = await provider.migrateToAuthenticated();

      expect(result.success).toBe(true);
      expect(result.data?.migrated).toBe(1);
    });

    it('should handle transactions with very old dates', async () => {
      const oldTransaction = createTestTransaction({
        id: 'old-tx',
        date: '2009-01-03T18:15:05.000Z', // Bitcoin genesis block date
      });

      mockLocalStorageProvider.getTransactions.mockResolvedValue({
        success: true,
        data: [oldTransaction],
      });

      mockSupabaseProvider.saveTransactions.mockResolvedValue({
        success: true,
        data: [oldTransaction],
      });

      mockLocalStorageProvider.clearTransactions.mockResolvedValue({
        success: true,
      });

      const { AutoStorageProvider } = await import('../AutoStorageProvider');
      const provider = new AutoStorageProvider();
      (provider as any).localProvider = mockLocalStorageProvider;
      (provider as any).supabaseProvider = mockSupabaseProvider;

      const result = await provider.migrateToAuthenticated();

      expect(result.success).toBe(true);
      expect(result.data?.migrated).toBe(1);
    });

    it('should handle transactions with future dates', async () => {
      const futureTransaction = createTestTransaction({
        id: 'future-tx',
        date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year in future
      });

      mockLocalStorageProvider.getTransactions.mockResolvedValue({
        success: true,
        data: [futureTransaction],
      });

      mockSupabaseProvider.saveTransactions.mockResolvedValue({
        success: true,
        data: [futureTransaction],
      });

      mockLocalStorageProvider.clearTransactions.mockResolvedValue({
        success: true,
      });

      const { AutoStorageProvider } = await import('../AutoStorageProvider');
      const provider = new AutoStorageProvider();
      (provider as any).localProvider = mockLocalStorageProvider;
      (provider as any).supabaseProvider = mockSupabaseProvider;

      const result = await provider.migrateToAuthenticated();

      expect(result.success).toBe(true);
      expect(result.data?.migrated).toBe(1);
    });
  });

  describe('Migration Result Validation', () => {
    it('should provide accurate migration statistics', async () => {
      const transactions = createTestTransactionSet(10);

      mockLocalStorageProvider.getTransactions.mockResolvedValue({
        success: true,
        data: transactions,
      });

      mockSupabaseProvider.saveTransactions.mockResolvedValue({
        success: true,
        data: transactions,
      });

      mockLocalStorageProvider.clearTransactions.mockResolvedValue({
        success: true,
      });

      const { AutoStorageProvider } = await import('../AutoStorageProvider');
      const provider = new AutoStorageProvider();
      (provider as any).localProvider = mockLocalStorageProvider;
      (provider as any).supabaseProvider = mockSupabaseProvider;

      const result = await provider.migrateToAuthenticated();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.migrated).toBe(10);
      expect(result.data?.errors).toBe(0);
      expect(typeof result.operation).toBe('string');
      expect(typeof result.timestamp).toBe('string');
    });

    it('should provide error details for failed migrations', async () => {
      mockLocalStorageProvider.getTransactions.mockRejectedValue(
        new Error('Detailed error message'),
      );

      const { AutoStorageProvider } = await import('../AutoStorageProvider');
      const provider = new AutoStorageProvider();
      (provider as any).localProvider = mockLocalStorageProvider;
      (provider as any).supabaseProvider = mockSupabaseProvider;

      const result = await provider.migrateToAuthenticated();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Detailed error message');
      expect(result.operation).toBe('migrateToAuthenticated');
      expect(typeof result.timestamp).toBe('string');
    });
  });
});
