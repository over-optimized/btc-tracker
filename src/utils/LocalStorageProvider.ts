/**
 * LocalStorage Provider Implementation
 *
 * Wraps existing localStorage functionality in the StorageProvider interface
 * for seamless integration with the dual-mode storage architecture.
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
import { getTransactions, saveTransactions, clearTransactions } from './storage';

/**
 * LocalStorageProvider: Browser localStorage for anonymous/offline users
 */
export class LocalStorageProvider extends BaseStorageProvider {
  readonly info: StorageProviderInfo = {
    type: 'localStorage',
    isOnline: false,
    supportsAuth: false,
    supportsSync: false,
    supportsBackup: true,
    maxStorageSize: 5 * 1024 * 1024, // ~5MB typical localStorage limit
    description: 'Browser localStorage for offline/anonymous users',
  };

  /**
   * Initialize localStorage provider
   */
  async initialize(config?: StorageProviderConfig): Promise<StorageOperationResult<void>> {
    try {
      this._config = config;

      // Test localStorage availability
      if (typeof localStorage === 'undefined') {
        return this.createResult(false, undefined, 'localStorage not available', 'initialize');
      }

      // Test write capability
      try {
        localStorage.setItem('btc-tracker:test', 'test');
        localStorage.removeItem('btc-tracker:test');
      } catch (error) {
        return this.createResult(false, undefined, 'localStorage write test failed', 'initialize');
      }

      this._isReady = true;
      return this.createResult(true, undefined, undefined, 'initialize');
    } catch (error) {
      return this.handleError(error, 'initialize');
    }
  }

  /**
   * Get localStorage status
   */
  async getStatus(): Promise<StorageOperationResult<any>> {
    try {
      const { transactions } = getTransactions();

      return this.createResult(
        true,
        {
          isHealthy: true,
          isAuthenticated: false,
          transactionCount: transactions.length,
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
   * Get transactions from localStorage
   */
  async getTransactions(query?: TransactionQuery): Promise<StorageOperationResult<Transaction[]>> {
    try {
      const { transactions } = getTransactions();

      // Apply basic filtering if query provided
      let filteredTransactions = transactions;

      if (query) {
        filteredTransactions = transactions.filter((tx) => {
          if (query.exchange && tx.exchange !== query.exchange) return false;
          if (query.type && tx.type !== query.type) return false;
          if (query.startDate && tx.date < query.startDate) return false;
          if (query.endDate && tx.date > query.endDate) return false;
          if (query.minAmount !== undefined && tx.usdAmount < query.minAmount) return false;
          if (query.maxAmount !== undefined && tx.usdAmount > query.maxAmount) return false;
          return true;
        });

        // Apply sorting
        if (query.sortBy) {
          const field = query.sortBy === 'amount' ? 'usdAmount' : query.sortBy;
          const order = query.sortOrder === 'desc' ? -1 : 1;

          filteredTransactions.sort((a, b) => {
            const aVal = a[field as keyof Transaction];
            const bVal = b[field as keyof Transaction];

            if (aVal !== undefined && bVal !== undefined) {
              if (aVal < bVal) return -1 * order;
              if (aVal > bVal) return 1 * order;
            }
            return 0;
          });
        }

        // Apply pagination
        if (query.offset || query.limit) {
          const start = query.offset || 0;
          const end = query.limit ? start + query.limit : undefined;
          filteredTransactions = filteredTransactions.slice(start, end);
        }
      }

      return this.createResult(true, filteredTransactions, undefined, 'getTransactions');
    } catch (error) {
      return this.handleError(error, 'getTransactions');
    }
  }

  /**
   * Get single transaction by ID
   */
  async getTransaction(id: string): Promise<StorageOperationResult<Transaction | null>> {
    try {
      const { transactions } = getTransactions();
      const transaction = transactions.find((tx) => tx.id === id) || null;

      return this.createResult(true, transaction, undefined, 'getTransaction');
    } catch (error) {
      return this.handleError(error, 'getTransaction');
    }
  }

  /**
   * Save single transaction
   */
  async saveTransaction(transaction: Transaction): Promise<StorageOperationResult<Transaction>> {
    try {
      const { transactions } = getTransactions();
      const existingIndex = transactions.findIndex((tx) => tx.id === transaction.id);

      if (existingIndex >= 0) {
        transactions[existingIndex] = transaction;
      } else {
        transactions.push(transaction);
      }

      saveTransactions(transactions);
      return this.createResult(true, transaction, undefined, 'saveTransaction');
    } catch (error) {
      return this.handleError(error, 'saveTransaction');
    }
  }

  /**
   * Save multiple transactions
   */
  async saveTransactions(
    transactions: Transaction[],
  ): Promise<StorageOperationResult<Transaction[]>> {
    try {
      saveTransactions(transactions);
      return this.createResult(true, transactions, undefined, 'saveTransactions');
    } catch (error) {
      return this.handleError(error, 'saveTransactions');
    }
  }

  /**
   * Update transaction
   */
  async updateTransaction(
    id: string,
    updates: Partial<Transaction>,
  ): Promise<StorageOperationResult<Transaction>> {
    try {
      const { transactions } = getTransactions();
      const existingIndex = transactions.findIndex((tx) => tx.id === id);

      if (existingIndex < 0) {
        return this.createResult(
          false,
          updates as Transaction,
          'Transaction not found',
          'updateTransaction',
        );
      }

      const updatedTransaction = { ...transactions[existingIndex], ...updates };
      transactions[existingIndex] = updatedTransaction;

      saveTransactions(transactions);
      return this.createResult(true, updatedTransaction, undefined, 'updateTransaction');
    } catch (error) {
      return this.handleError(error, 'updateTransaction');
    }
  }

  /**
   * Delete transaction
   */
  async deleteTransaction(id: string): Promise<StorageOperationResult<void>> {
    try {
      const { transactions } = getTransactions();
      const filteredTransactions = transactions.filter((tx) => tx.id !== id);

      saveTransactions(filteredTransactions);
      return this.createResult(true, undefined, undefined, 'deleteTransaction');
    } catch (error) {
      return this.handleError(error, 'deleteTransaction');
    }
  }

  /**
   * Clear all transactions
   */
  async clearTransactions(): Promise<StorageOperationResult<void>> {
    try {
      clearTransactions();
      return this.createResult(true, undefined, undefined, 'clearTransactions');
    } catch (error) {
      return this.handleError(error, 'clearTransactions');
    }
  }

  // ============================================================================
  // PLACEHOLDER IMPLEMENTATIONS (Not applicable for localStorage)
  // ============================================================================

  async bulkOperations(): Promise<StorageOperationResult<Transaction[]>> {
    return this.createResult(
      false,
      [],
      'Bulk operations not supported by localStorage',
      'bulkOperations',
    );
  }

  async importTransactions(): Promise<StorageOperationResult<any>> {
    return this.createResult(false, undefined, 'Import not yet implemented', 'importTransactions');
  }

  async exportTransactions(): Promise<StorageOperationResult<string>> {
    return this.createResult(false, '', 'Export not yet implemented', 'exportTransactions');
  }

  async syncWith(): Promise<StorageOperationResult<any>> {
    return this.createResult(false, undefined, 'Sync not supported by localStorage', 'syncWith');
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
    this._isReady = false;
  }
}
