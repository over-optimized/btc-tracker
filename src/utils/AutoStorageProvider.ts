/**
 * Auto Storage Provider Implementation
 *
 * Automatically switches between localStorage and Supabase based on authentication state.
 * Provides seamless user experience for anonymous and authenticated users.
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

/**
 * AutoStorageProvider: Intelligent provider switching based on authentication
 */
export class AutoStorageProvider extends BaseStorageProvider {
  private localProvider: LocalStorageProvider | null = null;
  private supabaseProvider: SupabaseStorageProvider | null = null;
  private currentProvider: IStorageProvider | null = null;

  readonly info: StorageProviderInfo = {
    type: 'auto',
    isOnline: true, // Can work both online and offline
    supportsAuth: true,
    supportsSync: true,
    supportsBackup: true,
    description:
      'Auto-switching provider: localStorage for anonymous, Supabase for authenticated users',
  };

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
        this.supabaseProvider = new SupabaseStorageProvider();
        const supabaseResult = await this.supabaseProvider.initialize(config);

        if (!supabaseResult.success) {
          console.warn(
            'Supabase provider initialization failed, using localStorage only:',
            supabaseResult.error,
          );
        }
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
   * Update current provider based on authentication state
   */
  private async updateCurrentProvider(): Promise<void> {
    console.log('🔍 AutoStorageProvider: Updating current provider...');

    // Use auth context if available for immediate decision
    if (this._config?.authContext) {
      const auth = this._config.authContext;
      console.log('📡 Using auth context:', {
        loading: auth.loading,
        isAuthenticated: auth.isAuthenticated,
        hasSupabase: !!auth.supabase,
      });

      // If auth is still loading, don't make any changes
      if (auth.loading) {
        console.log('⏳ Auth still loading, keeping current provider');
        return;
      }

      // If authenticated and Supabase is available, use Supabase
      if (auth.isAuthenticated && auth.supabase && this.supabaseProvider) {
        console.log('✅ Using Supabase provider (authenticated)');
        this.currentProvider = this.supabaseProvider;
        return;
      }

      // Otherwise use localStorage
      console.log('📁 Using localStorage provider (anonymous or no Supabase)');
      this.currentProvider = this.localProvider;
      return;
    }

    // Fallback to legacy provider detection
    if (this.supabaseProvider) {
      const status = await this.supabaseProvider.getStatus();

      // Use Supabase if authenticated and healthy
      if (status.success && status.data?.isAuthenticated) {
        console.log('✅ Using Supabase provider (legacy detection)');
        this.currentProvider = this.supabaseProvider;
        return;
      }
    }

    // Fall back to localStorage
    console.log('📁 Using localStorage provider (fallback)');
    this.currentProvider = this.localProvider;
  }

  /**
   * Get combined status from both providers
   */
  async getStatus(): Promise<StorageOperationResult<any>> {
    try {
      await this.updateCurrentProvider();

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
   * Delegate to current provider with automatic switching
   */
  async getTransactions(query?: TransactionQuery): Promise<StorageOperationResult<Transaction[]>> {
    await this.updateCurrentProvider();
    return (
      this.currentProvider?.getTransactions(query) ||
      this.createResult(false, [], 'No provider available', 'getTransactions')
    );
  }

  async getTransaction(id: string): Promise<StorageOperationResult<Transaction | null>> {
    await this.updateCurrentProvider();
    return (
      this.currentProvider?.getTransaction(id) ||
      this.createResult(false, null, 'No provider available', 'getTransaction')
    );
  }

  async saveTransaction(transaction: Transaction): Promise<StorageOperationResult<Transaction>> {
    await this.updateCurrentProvider();
    return (
      this.currentProvider?.saveTransaction(transaction) ||
      this.createResult(false, transaction, 'No provider available', 'saveTransaction')
    );
  }

  async saveTransactions(
    transactions: Transaction[],
  ): Promise<StorageOperationResult<Transaction[]>> {
    await this.updateCurrentProvider();
    return (
      this.currentProvider?.saveTransactions(transactions) ||
      this.createResult(false, [], 'No provider available', 'saveTransactions')
    );
  }

  async updateTransaction(
    id: string,
    updates: Partial<Transaction>,
  ): Promise<StorageOperationResult<Transaction>> {
    await this.updateCurrentProvider();
    return (
      this.currentProvider?.updateTransaction(id, updates) ||
      this.createResult(false, updates as Transaction, 'No provider available', 'updateTransaction')
    );
  }

  async deleteTransaction(id: string): Promise<StorageOperationResult<void>> {
    await this.updateCurrentProvider();
    return (
      this.currentProvider?.deleteTransaction(id) ||
      this.createResult(false, undefined, 'No provider available', 'deleteTransaction')
    );
  }

  async clearTransactions(): Promise<StorageOperationResult<void>> {
    await this.updateCurrentProvider();
    return (
      this.currentProvider?.clearTransactions() ||
      this.createResult(false, undefined, 'No provider available', 'clearTransactions')
    );
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
    await this.updateCurrentProvider();
    return (
      this.currentProvider?.bulkOperations([]) ||
      this.createResult(false, [], 'No provider available', 'bulkOperations')
    );
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
