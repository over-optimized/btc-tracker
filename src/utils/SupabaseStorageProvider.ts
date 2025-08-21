/**
 * Supabase Storage Provider Implementation
 *
 * Provides database storage for authenticated users using Supabase PostgreSQL backend.
 * Features Row Level Security, real-time synchronization, and zero-transformation operations.
 */

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import {
  BaseStorageProvider,
  StorageOperationResult,
  StorageProviderInfo,
  StorageProviderConfig,
  TransactionQuery,
  IStorageProvider,
} from '../types/StorageProvider';
import { Transaction } from '../types/Transaction';
import {
  OptimizedTransaction,
  convertToOptimizedTransaction,
  convertToLegacyTransaction,
  batchConvertToOptimized,
  batchConvertToLegacy,
} from '../types/OptimizedTransaction';

/**
 * Supabase-specific database schema interface
 * Matches the database table structure exactly
 */
interface DatabaseTransaction {
  id: string;
  user_id: string | null;
  date: string; // ISO 8601 timestamp
  exchange: string;
  type: string;
  usd_amount: number;
  btc_amount: number;
  price: number;
  destination_wallet?: string;
  network_fee?: number;
  network_fee_usd?: number;
  is_self_custody?: boolean;
  notes?: string;
  counterparty?: string;
  goods_services?: string;
  source_exchange?: string;
  destination_exchange?: string;
  is_taxable?: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * SupabaseStorageProvider: Database-backed storage for authenticated users
 */
export class SupabaseStorageProvider extends BaseStorageProvider {
  private client: SupabaseClient | null = null;
  private currentUser: User | null = null;

  readonly info: StorageProviderInfo = {
    type: 'supabase',
    isOnline: true,
    supportsAuth: true,
    supportsSync: true,
    supportsBackup: true,
    description: 'PostgreSQL database storage with Row Level Security and real-time sync',
  };

  /**
   * Initialize the Supabase client and authentication
   */
  async initialize(config?: StorageProviderConfig): Promise<StorageOperationResult<void>> {
    try {
      this._config = config;

      // Get Supabase configuration from environment
      const supabaseUrl = config?.supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = config?.supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        return this.createResult(
          false,
          undefined,
          'Supabase configuration missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.',
          'initialize',
        );
      }

      // Create Supabase client
      this.client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });

      // Get current authentication session
      const {
        data: { session },
        error: sessionError,
      } = await this.client.auth.getSession();

      if (sessionError) {
        console.warn('Supabase session error:', sessionError);
      }

      this.currentUser = session?.user || null;

      // Set up auth state listener
      this.client.auth.onAuthStateChange((event, session) => {
        this.currentUser = session?.user || null;
        console.log('Auth state changed:', event, this.currentUser?.id);
      });

      this._isReady = true;
      return this.createResult(true, undefined, undefined, 'initialize');
    } catch (error) {
      return this.handleError(error, 'initialize');
    }
  }

  /**
   * Get provider health and connection status
   */
  async getStatus(): Promise<StorageOperationResult<any>> {
    try {
      if (!this.client) {
        return this.createResult(false, undefined, 'Client not initialized', 'getStatus');
      }

      // Test database connection with a simple query
      const { data, error } = await this.client
        .from('transactions')
        .select('count(*)', { count: 'exact', head: true });

      if (error) {
        return this.createResult(
          false,
          {
            isHealthy: false,
            error: error.message,
            isAuthenticated: !!this.currentUser,
          },
          error.message,
          'getStatus',
        );
      }

      return this.createResult(
        true,
        {
          isHealthy: true,
          isAuthenticated: !!this.currentUser,
          userId: this.currentUser?.id,
          transactionCount: data?.length || 0,
          lastCheck: new Date(),
        },
        undefined,
        'getStatus',
      );
    } catch (error) {
      return this.handleError(error, 'getStatus');
    }
  }

  /**
   * Get transactions with optional filtering and pagination
   */
  async getTransactions(query?: TransactionQuery): Promise<StorageOperationResult<Transaction[]>> {
    try {
      if (!this.client) {
        return this.createResult(false, [], 'Client not initialized', 'getTransactions');
      }

      if (!this.currentUser) {
        return this.createResult(false, [], 'User not authenticated', 'getTransactions');
      }

      // Build query with Row Level Security (automatically filters by user_id)
      let supabaseQuery = this.client.from('transactions').select('*');

      // Apply filters
      if (query) {
        if (query.exchange) {
          supabaseQuery = supabaseQuery.eq('exchange', query.exchange);
        }
        if (query.type) {
          supabaseQuery = supabaseQuery.eq('type', query.type);
        }
        if (query.startDate) {
          supabaseQuery = supabaseQuery.gte('date', query.startDate.toISOString());
        }
        if (query.endDate) {
          supabaseQuery = supabaseQuery.lte('date', query.endDate.toISOString());
        }
        if (query.minAmount !== undefined) {
          supabaseQuery = supabaseQuery.gte('usd_amount', query.minAmount);
        }
        if (query.maxAmount !== undefined) {
          supabaseQuery = supabaseQuery.lte('usd_amount', query.maxAmount);
        }
        if (query.onlyTaxableEvents) {
          supabaseQuery = supabaseQuery.eq('is_taxable', true);
        }

        // Apply sorting
        const sortField =
          query.sortBy === 'amount'
            ? 'usd_amount'
            : query.sortBy === 'exchange'
              ? 'exchange'
              : query.sortBy === 'type'
                ? 'type'
                : 'date';
        const ascending = query.sortOrder === 'asc';
        supabaseQuery = supabaseQuery.order(sortField, { ascending });

        // Apply pagination
        if (query.limit) {
          supabaseQuery = supabaseQuery.limit(query.limit);
        }
        if (query.offset) {
          supabaseQuery = supabaseQuery.range(
            query.offset,
            query.offset + (query.limit || 100) - 1,
          );
        }
      } else {
        // Default: sort by date descending
        supabaseQuery = supabaseQuery.order('date', { ascending: false });
      }

      const { data, error } = await supabaseQuery;

      if (error) {
        return this.handleError(error, 'getTransactions');
      }

      // Convert database format to legacy Transaction format
      const transactions = this.convertDatabaseToTransactions(data || []);

      return this.createResult(true, transactions, undefined, 'getTransactions');
    } catch (error) {
      return this.handleError(error, 'getTransactions');
    }
  }

  /**
   * Get a specific transaction by ID
   */
  async getTransaction(id: string): Promise<StorageOperationResult<Transaction | null>> {
    try {
      if (!this.client || !this.currentUser) {
        return this.createResult(
          false,
          null,
          'Client not initialized or user not authenticated',
          'getTransaction',
        );
      }

      const { data, error } = await this.client
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return this.createResult(true, null, undefined, 'getTransaction');
        }
        return this.handleError(error, 'getTransaction');
      }

      const transaction = this.convertDatabaseToTransaction(data);
      return this.createResult(true, transaction, undefined, 'getTransaction');
    } catch (error) {
      return this.handleError(error, 'getTransaction');
    }
  }

  /**
   * Save a single transaction
   */
  async saveTransaction(transaction: Transaction): Promise<StorageOperationResult<Transaction>> {
    try {
      if (!this.client || !this.currentUser) {
        return this.createResult(
          false,
          transaction,
          'Client not initialized or user not authenticated',
          'saveTransaction',
        );
      }

      // Convert to optimized format for database storage
      const optimizedTransaction = convertToOptimizedTransaction(transaction, this.currentUser.id);

      // Convert to database format
      const dbTransaction = this.convertOptimizedToDatabase(optimizedTransaction);

      const { data, error } = await this.client
        .from('transactions')
        .upsert(dbTransaction, {
          onConflict: 'id',
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'saveTransaction');
      }

      const savedTransaction = this.convertDatabaseToTransaction(data);
      return this.createResult(true, savedTransaction, undefined, 'saveTransaction');
    } catch (error) {
      return this.handleError(error, 'saveTransaction');
    }
  }

  /**
   * Save multiple transactions efficiently
   */
  async saveTransactions(
    transactions: Transaction[],
  ): Promise<StorageOperationResult<Transaction[]>> {
    try {
      if (!this.client || !this.currentUser) {
        return this.createResult(
          false,
          [],
          'Client not initialized or user not authenticated',
          'saveTransactions',
        );
      }

      if (transactions.length === 0) {
        return this.createResult(true, [], undefined, 'saveTransactions');
      }

      // Convert to optimized format for database storage
      const optimizedTransactions = batchConvertToOptimized(transactions, this.currentUser.id);

      // Convert to database format
      const dbTransactions = optimizedTransactions.map((tx) => this.convertOptimizedToDatabase(tx));

      const { data, error } = await this.client
        .from('transactions')
        .upsert(dbTransactions, {
          onConflict: 'id',
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        return this.handleError(error, 'saveTransactions');
      }

      const savedTransactions = this.convertDatabaseToTransactions(data || []);
      return this.createResult(true, savedTransactions, undefined, 'saveTransactions');
    } catch (error) {
      return this.handleError(error, 'saveTransactions');
    }
  }

  /**
   * Update a specific transaction
   */
  async updateTransaction(
    id: string,
    updates: Partial<Transaction>,
  ): Promise<StorageOperationResult<Transaction>> {
    try {
      if (!this.client || !this.currentUser) {
        return this.createResult(
          false,
          updates as Transaction,
          'Client not initialized or user not authenticated',
          'updateTransaction',
        );
      }

      // Get the existing transaction first
      const existingResult = await this.getTransaction(id);
      if (!existingResult.success || !existingResult.data) {
        return this.createResult(
          false,
          updates as Transaction,
          'Transaction not found',
          'updateTransaction',
        );
      }

      // Merge updates with existing transaction
      const updatedTransaction = { ...existingResult.data, ...updates };

      // Save the updated transaction
      return await this.saveTransaction(updatedTransaction);
    } catch (error) {
      return this.handleError(error, 'updateTransaction');
    }
  }

  /**
   * Delete a specific transaction
   */
  async deleteTransaction(id: string): Promise<StorageOperationResult<void>> {
    try {
      if (!this.client || !this.currentUser) {
        return this.createResult(
          false,
          undefined,
          'Client not initialized or user not authenticated',
          'deleteTransaction',
        );
      }

      const { error } = await this.client.from('transactions').delete().eq('id', id);

      if (error) {
        return this.handleError(error, 'deleteTransaction');
      }

      return this.createResult(true, undefined, undefined, 'deleteTransaction');
    } catch (error) {
      return this.handleError(error, 'deleteTransaction');
    }
  }

  /**
   * Clear all transactions for the current user
   */
  async clearTransactions(): Promise<StorageOperationResult<void>> {
    try {
      if (!this.client || !this.currentUser) {
        return this.createResult(
          false,
          undefined,
          'Client not initialized or user not authenticated',
          'clearTransactions',
        );
      }

      const { error } = await this.client
        .from('transactions')
        .delete()
        .eq('user_id', this.currentUser.id);

      if (error) {
        return this.handleError(error, 'clearTransactions');
      }

      return this.createResult(true, undefined, undefined, 'clearTransactions');
    } catch (error) {
      return this.handleError(error, 'clearTransactions');
    }
  }

  // ============================================================================
  // UTILITY METHODS AND CONVERSIONS
  // ============================================================================

  /**
   * Convert database transaction to legacy Transaction format
   */
  private convertDatabaseToTransaction(dbTx: DatabaseTransaction): Transaction {
    // Convert to OptimizedTransaction first
    const optimized: OptimizedTransaction = {
      id: dbTx.id,
      user_id: dbTx.user_id,
      date: dbTx.date,
      exchange: dbTx.exchange,
      type: dbTx.type,
      usd_amount: dbTx.usd_amount,
      btc_amount: dbTx.btc_amount,
      price: dbTx.price,
      destination_wallet: dbTx.destination_wallet,
      network_fee: dbTx.network_fee,
      network_fee_usd: dbTx.network_fee_usd,
      is_self_custody: dbTx.is_self_custody,
      notes: dbTx.notes,
      counterparty: dbTx.counterparty,
      goods_services: dbTx.goods_services,
      source_exchange: dbTx.source_exchange,
      destination_exchange: dbTx.destination_exchange,
      is_taxable: dbTx.is_taxable,
      created_at: dbTx.created_at,
      updated_at: dbTx.updated_at,
    };

    // Then convert to legacy format
    return convertToLegacyTransaction(optimized);
  }

  /**
   * Convert multiple database transactions to legacy format
   */
  private convertDatabaseToTransactions(dbTransactions: DatabaseTransaction[]): Transaction[] {
    return dbTransactions.map((dbTx) => this.convertDatabaseToTransaction(dbTx));
  }

  /**
   * Convert OptimizedTransaction to database format
   */
  private convertOptimizedToDatabase(optimized: OptimizedTransaction): DatabaseTransaction {
    return {
      id: optimized.id,
      user_id: optimized.user_id,
      date: optimized.date,
      exchange: optimized.exchange,
      type: optimized.type,
      usd_amount: optimized.usd_amount,
      btc_amount: optimized.btc_amount,
      price: optimized.price,
      destination_wallet: optimized.destination_wallet,
      network_fee: optimized.network_fee,
      network_fee_usd: optimized.network_fee_usd,
      is_self_custody: optimized.is_self_custody,
      notes: optimized.notes,
      counterparty: optimized.counterparty,
      goods_services: optimized.goods_services,
      source_exchange: optimized.source_exchange,
      destination_exchange: optimized.destination_exchange,
      is_taxable: optimized.is_taxable,
      created_at: optimized.created_at,
      updated_at: optimized.updated_at,
    };
  }

  // ============================================================================
  // PLACEHOLDER IMPLEMENTATIONS (For interface compliance)
  // ============================================================================

  async bulkOperations(operations: Array<any>): Promise<StorageOperationResult<Transaction[]>> {
    // TODO: Implement bulk operations for efficiency
    return this.createResult(false, [], 'Bulk operations not yet implemented', 'bulkOperations');
  }

  async importTransactions(data: any, format?: string): Promise<StorageOperationResult<any>> {
    // TODO: Implement transaction import
    return this.createResult(false, undefined, 'Import not yet implemented', 'importTransactions');
  }

  async exportTransactions(
    format: string,
    query?: TransactionQuery,
  ): Promise<StorageOperationResult<string>> {
    // TODO: Implement transaction export
    return this.createResult(false, '', 'Export not yet implemented', 'exportTransactions');
  }

  async syncWith(otherProvider: IStorageProvider): Promise<StorageOperationResult<any>> {
    // TODO: Implement sync with other providers
    return this.createResult(false, undefined, 'Sync not yet implemented', 'syncWith');
  }

  async createBackup(): Promise<StorageOperationResult<any>> {
    // TODO: Implement backup creation
    return this.createResult(false, undefined, 'Backup not yet implemented', 'createBackup');
  }

  async restoreFromBackup(backupId: string): Promise<StorageOperationResult<any>> {
    // TODO: Implement backup restoration
    return this.createResult(false, undefined, 'Restore not yet implemented', 'restoreFromBackup');
  }

  async listBackups(): Promise<StorageOperationResult<any>> {
    // TODO: Implement backup listing
    return this.createResult(false, [], 'List backups not yet implemented', 'listBackups');
  }

  async getStats(): Promise<StorageOperationResult<any>> {
    // TODO: Implement statistics gathering
    return this.createResult(false, undefined, 'Stats not yet implemented', 'getStats');
  }

  async performMaintenance(): Promise<StorageOperationResult<any>> {
    // TODO: Implement maintenance operations
    return this.createResult(
      false,
      undefined,
      'Maintenance not yet implemented',
      'performMaintenance',
    );
  }

  async dispose(): Promise<void> {
    // Clean up resources
    if (this.client) {
      // Supabase client doesn't have explicit cleanup, but we can clear references
      this.client = null;
      this.currentUser = null;
      this._isReady = false;
    }
  }
}
