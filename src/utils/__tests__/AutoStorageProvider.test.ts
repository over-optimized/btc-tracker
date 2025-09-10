/**
 * AutoStorageProvider Unit Tests
 * Tests the core logic of the dual storage provider system
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AutoStorageProvider } from '../AutoStorageProvider';
import { StorageProviderConfig } from '../../types/StorageProvider';
import { Transaction } from '../../types/Transaction';

// Mock the storage providers
vi.mock('../LocalStorageProvider', () => ({
  LocalStorageProvider: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({ success: true }),
    getTransactions: vi.fn().mockResolvedValue({ success: true, data: [] }),
    saveTransaction: vi.fn().mockResolvedValue({ success: true, data: null }),
    saveTransactions: vi.fn().mockResolvedValue({ success: true, data: [] }),
    clearTransactions: vi.fn().mockResolvedValue({ success: true }),
    getStatus: vi.fn().mockResolvedValue({
      success: true,
      data: { available: true, provider: 'localStorage' },
    }),
  })),
}));

vi.mock('../SupabaseStorageProvider', () => ({
  SupabaseStorageProvider: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({ success: true }),
    getTransactions: vi.fn().mockResolvedValue({ success: true, data: [] }),
    saveTransaction: vi.fn().mockResolvedValue({ success: true, data: null }),
    saveTransactions: vi.fn().mockResolvedValue({ success: true, data: [] }),
    clearTransactions: vi.fn().mockResolvedValue({ success: true }),
    getStatus: vi.fn().mockResolvedValue({
      success: true,
      data: { available: true, provider: 'supabase' },
    }),
  })),
}));

describe('AutoStorageProvider', () => {
  let provider: AutoStorageProvider;
  let mockAuthContext: any;
  let mockConfig: StorageProviderConfig;

  const sampleTransaction: Transaction = {
    id: 'test-tx-1',
    date: new Date('2024-01-15'),
    exchange: 'Test Exchange',
    type: 'Purchase',
    usdAmount: 1000,
    btcAmount: 0.025,
    price: 40000,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthContext = {
      loading: false,
      isAuthenticated: false,
      isAnonymous: true,
      user: null,
      session: null,
      supabase: null,
    };

    mockConfig = {
      enableAuth: true,
      authContext: mockAuthContext,
    };

    provider = new AutoStorageProvider();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid config', async () => {
      const result = await provider.initialize(mockConfig);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail gracefully with invalid config', async () => {
      const invalidConfig = undefined as any;

      const result = await provider.initialize(invalidConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Configuration is required');
    });

    it('should handle auth context loading state', async () => {
      mockAuthContext.loading = true;

      const result = await provider.initialize(mockConfig);

      expect(result.success).toBe(true);
      // Should not attempt provider selection while loading
    });
  });

  describe('Provider Selection Logic', () => {
    it('should select localStorage provider for anonymous users', async () => {
      mockAuthContext.isAuthenticated = false;
      mockAuthContext.isAnonymous = true;

      await provider.initialize(mockConfig);

      const status = await provider.getStatus();
      expect(status.success).toBe(true);
    });

    it('should select Supabase provider for authenticated users', async () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.isAnonymous = false;
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.session = { access_token: 'test-token' };
      mockAuthContext.supabase = {}; // Mock Supabase client

      await provider.initialize(mockConfig);

      const status = await provider.getStatus();
      expect(status.success).toBe(true);
    });

    it('should fallback to localStorage when Supabase unavailable', async () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.supabase = null; // No Supabase client

      await provider.initialize(mockConfig);

      const status = await provider.getStatus();
      expect(status.success).toBe(true);
    });
  });

  describe('Provider Caching & Performance', () => {
    it('should prevent repeated initialization', async () => {
      const spy = vi.spyOn(provider as any, 'updateCurrentProvider');

      await provider.initialize(mockConfig);
      await provider.initialize(mockConfig);
      await provider.initialize(mockConfig);

      // Should only initialize once due to caching
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should detect auth state changes', async () => {
      // Start anonymous
      await provider.initialize(mockConfig);

      // Change to authenticated
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.isAnonymous = false;
      mockAuthContext.user = { id: 'auth-user-456' };
      mockAuthContext.session = { access_token: 'new-token' };
      mockAuthContext.supabase = {};

      // Force provider update
      await (provider as any).updateCurrentProvider(false, true);

      // Should switch providers
      const status = await provider.getStatus();
      expect(status.success).toBe(true);
    });

    it('should avoid unnecessary provider updates', async () => {
      await provider.initialize(mockConfig);

      const updateSpy = vi.spyOn(provider as any, 'updateCurrentProvider');

      // Call with same auth state multiple times
      await (provider as any).updateCurrentProvider();
      await (provider as any).updateCurrentProvider();

      // Should skip unnecessary updates due to caching
      expect(updateSpy).toHaveBeenCalledTimes(2); // Initial calls only
    });
  });

  describe('Transaction Operations', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should get transactions from current provider', async () => {
      const result = await provider.getTransactions();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should save transaction via current provider', async () => {
      const result = await provider.saveTransaction(sampleTransaction);

      expect(result.success).toBe(true);
    });

    it('should save multiple transactions', async () => {
      const transactions = [sampleTransaction];

      const result = await provider.saveTransactions(transactions);

      expect(result.success).toBe(true);
    });

    it('should clear transactions via current provider', async () => {
      const result = await provider.clearTransactions();

      expect(result.success).toBe(true);
    });

    it('should handle operation failures gracefully', async () => {
      // Mock provider failure
      const mockProvider = {
        getTransactions: vi.fn().mockResolvedValue({ success: false, error: 'Test error' }),
      };

      (provider as any).currentProvider = mockProvider;

      const result = await provider.getTransactions();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Test error');
    });
  });

  describe('Migration Logic', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should migrate data from localStorage to Supabase', async () => {
      const localTransactions = [sampleTransaction];

      // Mock localStorage provider with data
      const mockLocalProvider = {
        getTransactions: vi.fn().mockResolvedValue({
          success: true,
          data: localTransactions,
        }),
        clearTransactions: vi.fn().mockResolvedValue({ success: true }),
      };

      // Mock Supabase provider
      const mockSupabaseProvider = {
        saveTransactions: vi.fn().mockResolvedValue({
          success: true,
          data: localTransactions,
        }),
      };

      (provider as any).localProvider = mockLocalProvider;
      (provider as any).supabaseProvider = mockSupabaseProvider;

      const result = await provider.migrateToAuthenticated();

      expect(result.success).toBe(true);
      expect(result.data?.migrated).toBe(localTransactions.length);
      expect(mockLocalProvider.getTransactions).toHaveBeenCalled();
      expect(mockSupabaseProvider.saveTransactions).toHaveBeenCalledWith(localTransactions);
      expect(mockLocalProvider.clearTransactions).toHaveBeenCalled();
    });

    it('should handle migration with no local data', async () => {
      const mockLocalProvider = {
        getTransactions: vi.fn().mockResolvedValue({ success: true, data: [] }),
      };

      (provider as any).localProvider = mockLocalProvider;
      (provider as any).supabaseProvider = {};

      const result = await provider.migrateToAuthenticated();

      expect(result.success).toBe(true);
      expect(result.data?.migrated).toBe(0);
    });

    it('should handle migration failures gracefully', async () => {
      const mockLocalProvider = {
        getTransactions: vi.fn().mockResolvedValue({
          success: false,
          error: 'Failed to read localStorage',
        }),
      };

      (provider as any).localProvider = mockLocalProvider;
      (provider as any).supabaseProvider = {};

      const result = await provider.migrateToAuthenticated();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get localStorage transactions');
    });

    it('should handle Supabase save failures during migration', async () => {
      const localTransactions = [sampleTransaction];

      const mockLocalProvider = {
        getTransactions: vi.fn().mockResolvedValue({
          success: true,
          data: localTransactions,
        }),
      };

      const mockSupabaseProvider = {
        saveTransactions: vi.fn().mockResolvedValue({
          success: false,
          error: 'Supabase connection failed',
        }),
      };

      (provider as any).localProvider = mockLocalProvider;
      (provider as any).supabaseProvider = mockSupabaseProvider;

      const result = await provider.migrateToAuthenticated();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Supabase connection failed');
      expect(result.data?.errors).toBe(localTransactions.length);
    });

    it('should invalidate cache after successful migration', async () => {
      const localTransactions = [sampleTransaction];

      const mockLocalProvider = {
        getTransactions: vi.fn().mockResolvedValue({
          success: true,
          data: localTransactions,
        }),
        clearTransactions: vi.fn().mockResolvedValue({ success: true }),
      };

      const mockSupabaseProvider = {
        saveTransactions: vi.fn().mockResolvedValue({
          success: true,
          data: localTransactions,
        }),
      };

      (provider as any).localProvider = mockLocalProvider;
      (provider as any).supabaseProvider = mockSupabaseProvider;

      const cacheSpy = vi.spyOn(provider as any, 'invalidateTransactionCache');

      await provider.migrateToAuthenticated();

      expect(cacheSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle provider initialization errors', async () => {
      const errorConfig = { ...mockConfig, authContext: undefined };

      const result = await provider.initialize(errorConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle missing current provider', async () => {
      // Don't initialize provider
      const result = await provider.getTransactions();

      expect(result.success).toBe(false);
      expect(result.error).toContain('No storage provider available');
    });

    it('should provide meaningful error messages', async () => {
      const testError = new Error('Test storage error');

      const result = (provider as any).handleError(testError, 'testOperation');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Test storage error');
      expect(result.operation).toBe('testOperation');
    });

    it('should handle network errors gracefully', async () => {
      await provider.initialize(mockConfig);

      // Mock network error
      const mockProvider = {
        getTransactions: vi.fn().mockRejectedValue(new Error('Network error')),
      };

      (provider as any).currentProvider = mockProvider;

      const result = await provider.getTransactions();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('Auth State Transitions', () => {
    it('should trigger migration on anonymous to authenticated transition', async () => {
      // Start as anonymous
      mockAuthContext.isAuthenticated = false;
      mockAuthContext.isAnonymous = true;
      await provider.initialize(mockConfig);

      // Set up migration spy
      const migrationSpy = vi.spyOn(provider, 'migrateToAuthenticated');
      migrationSpy.mockResolvedValue({
        success: true,
        data: { migrated: 1, errors: 0 },
      });

      // Simulate auth state change to authenticated
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.isAnonymous = false;
      mockAuthContext.user = { id: 'transition-user' };
      mockAuthContext.session = { access_token: 'transition-token' };
      mockAuthContext.supabase = {};

      // Trigger provider update with auth state change
      await (provider as any).updateCurrentProvider(false, true);

      // Migration should be called asynchronously
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(migrationSpy).toHaveBeenCalled();
    });

    it('should not trigger migration for authenticated to authenticated transitions', async () => {
      // Start as authenticated
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = { id: 'existing-user' };
      await provider.initialize(mockConfig);

      const migrationSpy = vi.spyOn(provider, 'migrateToAuthenticated');

      // Change user (but still authenticated)
      mockAuthContext.user = { id: 'different-user' };

      await (provider as any).updateCurrentProvider(false, true);

      expect(migrationSpy).not.toHaveBeenCalled();
    });

    it('should not trigger migration for anonymous to anonymous transitions', async () => {
      // Start and stay anonymous
      mockAuthContext.isAuthenticated = false;
      mockAuthContext.isAnonymous = true;
      await provider.initialize(mockConfig);

      const migrationSpy = vi.spyOn(provider, 'migrateToAuthenticated');

      await (provider as any).updateCurrentProvider(false, true);

      expect(migrationSpy).not.toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    it('should invalidate transaction cache when needed', async () => {
      await provider.initialize(mockConfig);

      // Access the private method
      const invalidateSpy = vi.spyOn(provider as any, 'invalidateTransactionCache');

      (provider as any).invalidateTransactionCache();

      expect(invalidateSpy).toHaveBeenCalled();
    });

    it('should handle cache operations safely', async () => {
      await provider.initialize(mockConfig);

      // These should not throw errors
      expect(() => {
        (provider as any).invalidateTransactionCache();
        (provider as any).invalidateTransactionCache();
      }).not.toThrow();
    });
  });

  describe('Status Reporting', () => {
    it('should report provider status correctly', async () => {
      await provider.initialize(mockConfig);

      const status = await provider.getStatus();

      expect(status.success).toBe(true);
      expect(status.data).toBeDefined();
    });

    it('should handle status check failures', async () => {
      await provider.initialize(mockConfig);

      // Mock status failure
      const mockProvider = {
        getStatus: vi.fn().mockResolvedValue({
          success: false,
          error: 'Status check failed',
        }),
      };

      (provider as any).currentProvider = mockProvider;

      const status = await provider.getStatus();

      expect(status.success).toBe(false);
      expect(status.error).toContain('Status check failed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined auth context gracefully', async () => {
      const configWithNullAuth = { ...mockConfig, authContext: undefined };

      const result = await provider.initialize(configWithNullAuth);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle rapid auth state changes', async () => {
      await provider.initialize(mockConfig);

      // Rapid state changes
      const promises = [];
      for (let i = 0; i < 10; i++) {
        mockAuthContext.user = { id: `user-${i}` };
        promises.push((provider as any).updateCurrentProvider(false, true));
      }

      await Promise.allSettled(promises);

      // Should handle all state changes without errors
      const status = await provider.getStatus();
      expect(status.success).toBe(true);
    });

    it('should handle empty transaction arrays', async () => {
      await provider.initialize(mockConfig);

      const result = await provider.saveTransactions([]);

      expect(result.success).toBe(true);
    });

    it('should handle duplicate transaction IDs', async () => {
      await provider.initialize(mockConfig);

      const duplicates = [sampleTransaction, sampleTransaction];

      const result = await provider.saveTransactions(duplicates);

      expect(result.success).toBe(true);
    });
  });
});
