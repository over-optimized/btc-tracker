/**
 * Storage Provider Interface for BTC Tracker
 *
 * This interface provides a unified API for different storage backends:
 * - LocalStorageProvider: Browser localStorage for offline/anonymous users
 * - SupabaseStorageProvider: Database storage for authenticated users
 */

import { Transaction } from './Transaction';
import { OptimizedTransaction } from './OptimizedTransaction';

/**
 * Result interface for storage operations that may include metadata
 */
export interface StorageOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    operation: string;
    timestamp: Date;
    provider: StorageProviderType;
    migrationInfo?: {
      fromVersion: number;
      toVersion: number;
      recordsAffected: number;
    };
  };
}

/**
 * Available storage provider types
 */
export type StorageProviderType = 'localStorage' | 'supabase' | 'auto';

/**
 * Storage provider capabilities and configuration
 */
export interface StorageProviderInfo {
  type: StorageProviderType;
  isOnline: boolean;
  supportsAuth: boolean;
  supportsSync: boolean;
  supportsBackup: boolean;
  maxStorageSize?: number; // in bytes, undefined = unlimited
  description: string;
}

/**
 * Configuration for storage providers
 */
export interface StorageProviderConfig {
  // Common configuration
  enableCache?: boolean;
  enableBackup?: boolean;
  enableSync?: boolean;
  enableAuth?: boolean;

  // Supabase-specific configuration
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  enableRealtime?: boolean;

  // localStorage-specific configuration
  enableCompression?: boolean;
  maxLocalStorageSize?: number;

  // Fallback configuration
  fallbackProvider?: StorageProviderType;
  enableOfflineMode?: boolean;
}

/**
 * Transaction query parameters for filtering and pagination
 */
export interface TransactionQuery {
  // Filtering
  userId?: string | null; // null for anonymous users
  exchange?: string;
  type?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;

  // Pagination
  limit?: number;
  offset?: number;

  // Sorting
  sortBy?: 'date' | 'amount' | 'exchange' | 'type';
  sortOrder?: 'asc' | 'desc';

  // Advanced filtering
  includeOptionalFields?: boolean;
  onlyTaxableEvents?: boolean;
}

/**
 * Unified storage provider interface
 *
 * This interface abstracts storage operations across different backends,
 * allowing the application to work seamlessly with localStorage or Supabase.
 */
export interface IStorageProvider {
  /**
   * Provider identification and capabilities
   */
  readonly info: StorageProviderInfo;

  /**
   * Initialize the storage provider
   */
  initialize(config?: StorageProviderConfig): Promise<StorageOperationResult<void>>;

  /**
   * Check if the provider is ready for operations
   */
  isReady(): boolean;

  /**
   * Get provider health status
   */
  getStatus(): Promise<
    StorageOperationResult<{
      isHealthy: boolean;
      lastSync?: Date;
      pendingOperations?: number;
      storageUsed?: number;
      storageAvailable?: number;
    }>
  >;

  // ============================================================================
  // TRANSACTION OPERATIONS
  // ============================================================================

  /**
   * Get all transactions for the current user
   */
  getTransactions(query?: TransactionQuery): Promise<StorageOperationResult<Transaction[]>>;

  /**
   * Get a specific transaction by ID
   */
  getTransaction(id: string): Promise<StorageOperationResult<Transaction | null>>;

  /**
   * Save a single transaction
   */
  saveTransaction(transaction: Transaction): Promise<StorageOperationResult<Transaction>>;

  /**
   * Save multiple transactions
   */
  saveTransactions(transactions: Transaction[]): Promise<StorageOperationResult<Transaction[]>>;

  /**
   * Update a specific transaction
   */
  updateTransaction(
    id: string,
    updates: Partial<Transaction>,
  ): Promise<StorageOperationResult<Transaction>>;

  /**
   * Delete a specific transaction
   */
  deleteTransaction(id: string): Promise<StorageOperationResult<void>>;

  /**
   * Clear all transactions for the current user
   */
  clearTransactions(): Promise<StorageOperationResult<void>>;

  /**
   * Bulk operations for efficient data management
   */
  bulkOperations(
    operations: Array<{
      type: 'insert' | 'update' | 'delete';
      transaction?: Transaction;
      id?: string;
      updates?: Partial<Transaction>;
    }>,
  ): Promise<StorageOperationResult<Transaction[]>>;

  // ============================================================================
  // SYNC AND MIGRATION OPERATIONS
  // ============================================================================

  /**
   * Import transactions from another provider or format
   */
  importTransactions(
    data: Transaction[] | OptimizedTransaction[] | string,
    format?: 'transactions' | 'optimized' | 'csv' | 'json',
  ): Promise<
    StorageOperationResult<{
      imported: number;
      duplicates: number;
      errors: number;
      errorDetails?: string[];
    }>
  >;

  /**
   * Export transactions to various formats
   */
  exportTransactions(
    format: 'json' | 'csv' | 'optimized',
    query?: TransactionQuery,
  ): Promise<StorageOperationResult<string>>;

  /**
   * Sync with another storage provider (for migration)
   */
  syncWith(otherProvider: IStorageProvider): Promise<
    StorageOperationResult<{
      synced: number;
      conflicts: number;
      lastSyncTime: Date;
    }>
  >;

  // ============================================================================
  // BACKUP AND RECOVERY
  // ============================================================================

  /**
   * Create a backup of all data
   */
  createBackup(): Promise<
    StorageOperationResult<{
      backupId: string;
      timestamp: Date;
      size: number;
      transactionCount: number;
    }>
  >;

  /**
   * Restore from a backup
   */
  restoreFromBackup(backupId: string): Promise<
    StorageOperationResult<{
      restored: number;
      timestamp: Date;
    }>
  >;

  /**
   * List available backups
   */
  listBackups(): Promise<
    StorageOperationResult<
      Array<{
        id: string;
        timestamp: Date;
        size: number;
        transactionCount: number;
      }>
    >
  >;

  // ============================================================================
  // UTILITY AND MAINTENANCE
  // ============================================================================

  /**
   * Get storage statistics
   */
  getStats(): Promise<
    StorageOperationResult<{
      totalTransactions: number;
      totalSize: number;
      oldestTransaction?: Date;
      newestTransaction?: Date;
      transactionsByExchange: Record<string, number>;
      transactionsByType: Record<string, number>;
    }>
  >;

  /**
   * Perform maintenance operations
   */
  performMaintenance(): Promise<
    StorageOperationResult<{
      operationsPerformed: string[];
      sizeFreed: number;
      errorsFixed: number;
    }>
  >;

  /**
   * Cleanup and dispose of resources
   */
  dispose(): Promise<void>;
}

/**
 * Abstract base class for storage providers
 * Provides common functionality and error handling
 */
export abstract class BaseStorageProvider implements IStorageProvider {
  protected _isReady = false;
  protected _config?: StorageProviderConfig;

  abstract readonly info: StorageProviderInfo;

  abstract initialize(config?: StorageProviderConfig): Promise<StorageOperationResult<void>>;

  isReady(): boolean {
    return this._isReady;
  }

  abstract getStatus(): Promise<StorageOperationResult<any>>;
  abstract getTransactions(
    query?: TransactionQuery,
  ): Promise<StorageOperationResult<Transaction[]>>;
  abstract getTransaction(id: string): Promise<StorageOperationResult<Transaction | null>>;
  abstract saveTransaction(transaction: Transaction): Promise<StorageOperationResult<Transaction>>;
  abstract saveTransactions(
    transactions: Transaction[],
  ): Promise<StorageOperationResult<Transaction[]>>;
  abstract updateTransaction(
    id: string,
    updates: Partial<Transaction>,
  ): Promise<StorageOperationResult<Transaction>>;
  abstract deleteTransaction(id: string): Promise<StorageOperationResult<void>>;
  abstract clearTransactions(): Promise<StorageOperationResult<void>>;
  abstract bulkOperations(operations: Array<any>): Promise<StorageOperationResult<Transaction[]>>;
  abstract importTransactions(data: any, format?: string): Promise<StorageOperationResult<any>>;
  abstract exportTransactions(
    format: string,
    query?: TransactionQuery,
  ): Promise<StorageOperationResult<string>>;
  abstract syncWith(otherProvider: IStorageProvider): Promise<StorageOperationResult<any>>;
  abstract createBackup(): Promise<StorageOperationResult<any>>;
  abstract restoreFromBackup(backupId: string): Promise<StorageOperationResult<any>>;
  abstract listBackups(): Promise<StorageOperationResult<any>>;
  abstract getStats(): Promise<StorageOperationResult<any>>;
  abstract performMaintenance(): Promise<StorageOperationResult<any>>;
  abstract dispose(): Promise<void>;

  /**
   * Protected helper method for creating operation results
   */
  protected createResult<T>(
    success: boolean,
    data?: T,
    error?: string,
    operation?: string,
  ): StorageOperationResult<T> {
    return {
      success,
      data,
      error,
      metadata: {
        operation: operation || 'unknown',
        timestamp: new Date(),
        provider: this.info.type,
      },
    };
  }

  /**
   * Protected helper method for error handling
   */
  protected handleError<T>(error: unknown, operation: string): StorageOperationResult<T> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Storage operation failed [${this.info.type}/${operation}]:`, error);

    return this.createResult<T>(false, undefined, errorMessage, operation);
  }
}

/**
 * Storage provider factory
 */
export class StorageProviderFactory {
  /**
   * Create a storage provider instance
   */
  static async create(
    type: StorageProviderType,
    config?: StorageProviderConfig,
  ): Promise<IStorageProvider> {
    switch (type) {
      case 'localStorage': {
        const { LocalStorageProvider } = await import('../utils/LocalStorageProvider');
        return new LocalStorageProvider();
      }

      case 'supabase': {
        const { SupabaseStorageProvider } = await import('../utils/SupabaseStorageProvider');
        return new SupabaseStorageProvider();
      }

      case 'auto': {
        // Auto-detect based on authentication state and environment
        const { AutoStorageProvider } = await import('../utils/AutoStorageProvider');
        return new AutoStorageProvider();
      }

      default:
        throw new Error(`Unknown storage provider type: ${type}`);
    }
  }

  /**
   * Get available provider types based on current environment
   */
  static getAvailableProviders(): StorageProviderType[] {
    const providers: StorageProviderType[] = ['localStorage'];

    // Check if Supabase is configured
    if (
      import.meta.env.VITE_ENABLE_SUPABASE === 'true' &&
      import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_ANON_KEY
    ) {
      providers.push('supabase');
    }

    // Auto mode is always available if we have multiple options
    if (providers.length > 1) {
      providers.push('auto');
    }

    return providers;
  }
}
