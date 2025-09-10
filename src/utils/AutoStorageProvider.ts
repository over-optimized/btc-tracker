/**
 * Auto Storage Provider Implementation
 *
 * Automatically switches between localStorage and Supabase based on authentication state.
 * Provides seamless user experience for anonymous and authenticated users with intelligent caching.
 */

import {
  BaseStorageProvider,
  StorageOperationResult,
  StorageProviderInfo,
  StorageProviderConfig,
  TransactionQuery,
  IStorageProvider,
} from '../types/StorageProvider';
import { Transaction } from '../types/Transaction';
import { LocalStorageProvider } from './LocalStorageProvider';
import { SupabaseStorageProvider } from './SupabaseStorageProvider';
import { ApiCache } from './apiCache';
import { CacheOptions } from '../types/ApiCache';

/**
 * AutoStorageProvider: Intelligent provider switching based on authentication with caching
 */
export class AutoStorageProvider extends BaseStorageProvider {
  private localProvider: LocalStorageProvider | null = null;
  private supabaseProvider: SupabaseStorageProvider | null = null;
  private currentProvider: IStorageProvider | null = null;
  private transactionCache: ApiCache<Transaction[]>;
  private cacheKeyPrefix = 'transactions';

  // Provider caching to prevent repeated API calls
  private _providerInitialized = false;
  private _lastAuthState: { isAuthenticated: boolean; userId?: string } | null = null;

  // Cache configuration - conservative TTL for data integrity
  private readonly cacheConfig: CacheOptions = {
    ttl: parseInt(import.meta.env.VITE_SUPABASE_CACHE_TTL || '60000'), // 1 minute default
    strategy: 'cache-first',
    persistent: true,
    crossTab: true,
  };

  readonly info: StorageProviderInfo = {
    type: 'auto',
    isOnline: true, // Can work both online and offline
    supportsAuth: true,
    supportsSync: true,
    supportsBackup: true,
    description:
      'Auto-switching provider with caching: localStorage for anonymous, Supabase for authenticated users',
  };

  constructor() {
    super();

    // Initialize transaction cache with configuration
    this.transactionCache = new ApiCache<Transaction[]>({
      defaultTtl: this.cacheConfig.ttl,
      maxEntries: 10, // Conservative - few cache keys for transaction data
      cleanupInterval: 30000, // 30 seconds cleanup
      persistent: this.cacheConfig.persistent,
      sharedWorker: false, // Not needed for transaction data
    });
  }

  /**
   * Initialize both providers and detect authentication state
   */
  async initialize(config?: StorageProviderConfig): Promise<StorageOperationResult<void>> {
    try {
      this._config = config;

      // Initialize localStorage provider (always available)
      this.localProvider = new LocalStorageProvider();
      const localResult = await this.localProvider.initialize(config);

      if (!localResult.success) {
        return this.createResult(
          false,
          undefined,
          'Failed to initialize localStorage provider',
          'initialize',
        );
      }

      // Initialize Supabase provider if enabled
      if (config?.enableAuth !== false && import.meta.env.VITE_ENABLE_SUPABASE === 'true') {
        try {
          this.supabaseProvider = new SupabaseStorageProvider();
          const supabaseResult = await this.supabaseProvider.initialize(config);

          if (!supabaseResult.success) {
            console.warn(
              '⚠️ Supabase provider initialization failed, gracefully falling back to localStorage only:',
              supabaseResult.error,
            );
            // Clean up the failed provider
            this.supabaseProvider = null;
          } else {
            console.log('✅ Supabase provider initialized successfully');
          }
        } catch (error) {
          console.warn(
            '💥 Supabase provider failed to initialize due to exception, using localStorage only:',
            error instanceof Error ? error.message : 'Unknown error',
          );
          this.supabaseProvider = null;
        }
      } else {
        console.log(
          '📁 Supabase disabled or authentication disabled - using localStorage only mode',
        );
      }

      // Determine current provider based on authentication state
      await this.updateCurrentProvider();

      this._isReady = true;
      return this.createResult(true, undefined, undefined, 'initialize');
    } catch (error) {
      return this.handleError(error, 'initialize');
    }
  }

  /**
   * Update current provider based on authentication state (with intelligent caching)
   */
  private async updateCurrentProvider(forceUpdate = false): Promise<void> {
    // Get current auth state from context if available
    const authContext = this._config?.authContext;
    const currentAuthState = authContext
      ? {
          isAuthenticated: authContext.isAuthenticated || false,
          userId: authContext.user?.id,
          loading: authContext.loading || false,
        }
      : null;

    // Skip update if provider already initialized and auth state hasn't changed
    if (this._providerInitialized && !forceUpdate && currentAuthState) {
      const authStateChanged =
        !this._lastAuthState ||
        this._lastAuthState.isAuthenticated !== currentAuthState.isAuthenticated ||
        this._lastAuthState.userId !== currentAuthState.userId;

      if (!authStateChanged) {
        console.log('✅ Provider already up-to-date, skipping expensive update');
        return;
      }
    }

    console.log('🔄 Updating current provider based on auth state');

    // Use auth context if available for immediate decision
    if (authContext) {
      console.log('📡 Using auth context:', {
        loading: currentAuthState?.loading,
        isAuthenticated: currentAuthState?.isAuthenticated,
        hasSupabase: !!authContext.supabase,
      });

      // If auth is still loading, don't make any changes
      if (currentAuthState?.loading) {
        console.log('⏳ Auth still loading, keeping current provider');
        return;
      }

      // If authenticated and Supabase is available, use Supabase
      if (currentAuthState?.isAuthenticated && authContext.supabase && this.supabaseProvider) {
        console.log('✅ Using Supabase provider (authenticated)');
        this.currentProvider = this.supabaseProvider;
        this._providerInitialized = true;
        this._lastAuthState = currentAuthState;
        return;
      }

      // Otherwise use localStorage
      console.log('📁 Using localStorage provider (anonymous or no Supabase)');
      this.currentProvider = this.localProvider;
      this._providerInitialized = true;
      this._lastAuthState = currentAuthState;
      return;
    }

    // No auth context available - default to localStorage (safe fallback)
    console.warn('⚠️ No auth context available, defaulting to localStorage provider');
    this.currentProvider = this.localProvider;
    this._providerInitialized = true;
    this._lastAuthState = null;
  }

  /**
   * Get combined status from both providers
   */
  async getStatus(): Promise<StorageOperationResult<any>> {
    try {
      if (!this.currentProvider) {
        return this.createResult(false, undefined, 'No provider available', 'getStatus');
      }

      const status = await this.currentProvider.getStatus();

      return this.createResult(
        true,
        {
          ...status.data,
          activeProvider: this.currentProvider.info.type,
          hasSupabase: !!this.supabaseProvider,
          hasLocalStorage: !!this.localProvider,
        },
        undefined,
        'getStatus',
      );
    } catch (error) {
      return this.handleError(error, 'getStatus');
    }
  }

  /**
   * Get cached cache key for query
   */
  private getCacheKey(query?: TransactionQuery): string {
    if (!query) {
      return `${this.cacheKeyPrefix}:all`;
    }

    // Create deterministic cache key based on query parameters
    const keyParts = [this.cacheKeyPrefix];

    if (query.exchange) keyParts.push(`exchange:${query.exchange}`);
    if (query.type) keyParts.push(`type:${query.type}`);
    if (query.startDate) keyParts.push(`start:${query.startDate.toISOString()}`);
    if (query.endDate) keyParts.push(`end:${query.endDate.toISOString()}`);
    if (query.minAmount !== undefined) keyParts.push(`minAmount:${query.minAmount}`);
    if (query.maxAmount !== undefined) keyParts.push(`maxAmount:${query.maxAmount}`);
    if (query.onlyTaxableEvents) keyParts.push('taxableOnly:true');
    if (query.sortBy) keyParts.push(`sort:${query.sortBy}:${query.sortOrder || 'desc'}`);
    if (query.limit) keyParts.push(`limit:${query.limit}`);
    if (query.offset) keyParts.push(`offset:${query.offset}`);

    return keyParts.join('|');
  }

  /**
   * Clear transaction cache when data is modified
   */
  private invalidateTransactionCache(): void {
    console.log('🗑️ Invalidating transaction cache due to data modification');
    this.transactionCache.clear();
  }

  /**
   * Delegate to current provider with intelligent caching
   */
  async getTransactions(query?: TransactionQuery): Promise<StorageOperationResult<Transaction[]>> {
    // Provider should already be set during initialization - don't update on every call!
    if (!this.currentProvider) {
      return this.createResult(false, [], 'No provider available', 'getTransactions');
    }

    // Only cache Supabase results (localStorage is already fast)
    const shouldCache = this.currentProvider === this.supabaseProvider;

    if (!shouldCache) {
      console.log('📁 Using localStorage provider (no caching needed)');
      return this.currentProvider.getTransactions(query);
    }

    const cacheKey = this.getCacheKey(query);
    console.log('🔍 Checking cache for transactions:', cacheKey);

    // Try to get from cache first
    const cachedResult = this.transactionCache.get(cacheKey);
    if (cachedResult) {
      console.log('✅ Cache hit for transactions:', cachedResult.data.length, 'transactions');
      return this.createResult(true, cachedResult.data, undefined, 'getTransactions');
    }

    console.log('❌ Cache miss, fetching from Supabase...');

    try {
      // Fetch from Supabase
      const result = await this.currentProvider.getTransactions(query);

      if (result.success && result.data) {
        // Cache successful results
        console.log('💾 Caching transaction data:', result.data.length, 'transactions');
        this.transactionCache.set(cacheKey, result.data, this.cacheConfig);
      } else {
        console.warn('⚠️ Supabase fetch failed, attempting localStorage fallback:', result.error);

        // If Supabase fails, try to fall back to localStorage
        if (this.localProvider && this.supabaseProvider) {
          console.log('🔄 Attempting localStorage fallback for transaction fetch...');
          const fallbackResult = await this.localProvider.getTransactions(query);
          if (fallbackResult.success) {
            console.log('✅ localStorage fallback successful');
            return fallbackResult;
          }
        }
      }

      return result;
    } catch (error) {
      console.error('💥 Exception during Supabase fetch:', error);

      // If Supabase throws an exception, try localStorage fallback
      if (this.localProvider) {
        console.log('🔄 Emergency localStorage fallback due to exception...');
        try {
          const fallbackResult = await this.localProvider.getTransactions(query);
          if (fallbackResult.success) {
            console.log('✅ Emergency localStorage fallback successful');
            return fallbackResult;
          }
        } catch (fallbackError) {
          console.error('💥 localStorage fallback also failed:', fallbackError);
        }
      }

      return this.createResult(
        false,
        [],
        error instanceof Error ? error.message : 'Unknown error during transaction fetch',
        'getTransactions',
      );
    }
  }

  async getTransaction(id: string): Promise<StorageOperationResult<Transaction | null>> {
    if (!this.currentProvider) {
      return this.createResult(false, null, 'No provider available', 'getTransaction');
    }
    return this.currentProvider.getTransaction(id);
  }

  async saveTransaction(transaction: Transaction): Promise<StorageOperationResult<Transaction>> {
    if (!this.currentProvider) {
      return this.createResult(false, transaction, 'No provider available', 'saveTransaction');
    }

    const result = await this.currentProvider.saveTransaction(transaction);

    // Invalidate cache if successful and using Supabase
    if (result.success && this.currentProvider === this.supabaseProvider) {
      this.invalidateTransactionCache();
    }

    return result;
  }

  async saveTransactions(
    transactions: Transaction[],
  ): Promise<StorageOperationResult<Transaction[]>> {
    if (!this.currentProvider) {
      return this.createResult(false, [], 'No provider available', 'saveTransactions');
    }

    const result = await this.currentProvider.saveTransactions(transactions);

    // Invalidate cache if successful and using Supabase
    if (result.success && this.currentProvider === this.supabaseProvider) {
      this.invalidateTransactionCache();
    }

    return result;
  }

  async updateTransaction(
    id: string,
    updates: Partial<Transaction>,
  ): Promise<StorageOperationResult<Transaction>> {
    if (!this.currentProvider) {
      return this.createResult(
        false,
        updates as Transaction,
        'No provider available',
        'updateTransaction',
      );
    }

    const result = await this.currentProvider.updateTransaction(id, updates);

    // Invalidate cache if successful and using Supabase
    if (result.success && this.currentProvider === this.supabaseProvider) {
      this.invalidateTransactionCache();
    }

    return result;
  }

  async deleteTransaction(id: string): Promise<StorageOperationResult<void>> {
    if (!this.currentProvider) {
      return this.createResult(false, undefined, 'No provider available', 'deleteTransaction');
    }

    const result = await this.currentProvider.deleteTransaction(id);

    // Invalidate cache if successful and using Supabase
    if (result.success && this.currentProvider === this.supabaseProvider) {
      this.invalidateTransactionCache();
    }

    return result;
  }

  async clearTransactions(): Promise<StorageOperationResult<void>> {
    if (!this.currentProvider) {
      return this.createResult(false, undefined, 'No provider available', 'clearTransactions');
    }

    const result = await this.currentProvider.clearTransactions();

    // Invalidate cache if successful and using Supabase
    if (result.success && this.currentProvider === this.supabaseProvider) {
      this.invalidateTransactionCache();
    }

    return result;
  }

  /**
   * Migration utility: Move data from localStorage to Supabase when user authenticates
   */
  async migrateToAuthenticated(): Promise<
    StorageOperationResult<{
      migrated: number;
      errors: number;
    }>
  > {
    try {
      if (!this.localProvider || !this.supabaseProvider) {
        return this.createResult(
          false,
          { migrated: 0, errors: 0 },
          'Migration providers not available',
          'migrateToAuthenticated',
        );
      }

      // Get all transactions from localStorage
      const localResult = await this.localProvider.getTransactions();
      if (!localResult.success || !localResult.data) {
        return this.createResult(
          false,
          { migrated: 0, errors: 1 },
          'Failed to get localStorage transactions',
          'migrateToAuthenticated',
        );
      }

      const localTransactions = localResult.data;
      if (localTransactions.length === 0) {
        return this.createResult(
          true,
          { migrated: 0, errors: 0 },
          undefined,
          'migrateToAuthenticated',
        );
      }

      // Save to Supabase
      const supabaseResult = await this.supabaseProvider.saveTransactions(localTransactions);
      if (!supabaseResult.success) {
        return this.createResult(
          false,
          { migrated: 0, errors: localTransactions.length },
          supabaseResult.error,
          'migrateToAuthenticated',
        );
      }

      // Clear localStorage after successful migration
      await this.localProvider.clearTransactions();

      // Invalidate cache since we just added data to Supabase
      this.invalidateTransactionCache();

      return this.createResult(
        true,
        {
          migrated: localTransactions.length,
          errors: 0,
        },
        undefined,
        'migrateToAuthenticated',
      );
    } catch (error) {
      return this.handleError(error, 'migrateToAuthenticated');
    }
  }

  // ============================================================================
  // PLACEHOLDER IMPLEMENTATIONS
  // ============================================================================

  async bulkOperations(): Promise<StorageOperationResult<Transaction[]>> {
    if (!this.currentProvider) {
      return this.createResult(false, [], 'No provider available', 'bulkOperations');
    }
    return this.currentProvider.bulkOperations([]);
  }

  async importTransactions(): Promise<StorageOperationResult<any>> {
    return this.createResult(false, undefined, 'Import not yet implemented', 'importTransactions');
  }

  async exportTransactions(): Promise<StorageOperationResult<string>> {
    return this.createResult(false, '', 'Export not yet implemented', 'exportTransactions');
  }

  async syncWith(): Promise<StorageOperationResult<any>> {
    return this.createResult(false, undefined, 'Sync not yet implemented', 'syncWith');
  }

  async createBackup(): Promise<StorageOperationResult<any>> {
    return this.createResult(false, undefined, 'Backup not yet implemented', 'createBackup');
  }

  async restoreFromBackup(): Promise<StorageOperationResult<any>> {
    return this.createResult(false, undefined, 'Restore not yet implemented', 'restoreFromBackup');
  }

  async listBackups(): Promise<StorageOperationResult<any>> {
    return this.createResult(false, [], 'List backups not yet implemented', 'listBackups');
  }

  async getStats(): Promise<StorageOperationResult<any>> {
    return this.createResult(false, undefined, 'Stats not yet implemented', 'getStats');
  }

  async performMaintenance(): Promise<StorageOperationResult<any>> {
    return this.createResult(
      false,
      undefined,
      'Maintenance not yet implemented',
      'performMaintenance',
    );
  }

  async dispose(): Promise<void> {
    // Clean up cache resources
    if (this.transactionCache) {
      this.transactionCache.destroy();
    }

    if (this.localProvider) {
      await this.localProvider.dispose();
      this.localProvider = null;
    }

    if (this.supabaseProvider) {
      await this.supabaseProvider.dispose();
      this.supabaseProvider = null;
    }

    this.currentProvider = null;
    this._isReady = false;
  }
}
