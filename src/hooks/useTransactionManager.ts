import { useState, useEffect } from 'react';
import { Transaction } from '../types/Transaction';
import { AutoStorageProvider } from '../utils/AutoStorageProvider';
import { StorageProviderConfig } from '../types/StorageProvider';

interface MergeResult {
  merged: Transaction[];
  duplicateCount: number;
}

interface TransactionManagerResult {
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => Promise<void>;
  mergeTransactions: (newTransactions: Transaction[]) => Promise<MergeResult>;
  clearAllTransactions: () => Promise<void>;
  getExchangesList: () => string[];
  loading: boolean;
  error: string | null;
  storageProvider: AutoStorageProvider | null;
}

export const useTransactionManager = (): TransactionManagerResult => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageProvider, setStorageProvider] = useState<AutoStorageProvider | null>(null);

  // Initialize storage provider and load transactions
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        setLoading(true);
        setError(null);

        const provider = new AutoStorageProvider();
        const config: StorageProviderConfig = {
          enableAuth: true, // Allow authentication but don't require it
        };

        const initResult = await provider.initialize(config);
        if (!initResult.success) {
          throw new Error(initResult.error || 'Failed to initialize storage');
        }

        setStorageProvider(provider);

        // Load existing transactions
        const transactionsResult = await provider.getTransactions();
        if (transactionsResult.success) {
          setTransactions(transactionsResult.data || []);
        } else {
          console.warn('Failed to load transactions:', transactionsResult.error);
          setError(transactionsResult.error || 'Failed to load transactions');
        }
      } catch (err) {
        console.error('Storage initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');

        // Fallback to legacy localStorage loading
        try {
          const { getTransactions } = await import('../utils/storage');
          const result = getTransactions();
          setTransactions(result.transactions);
        } catch {
          setTransactions([]);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeStorage();
  }, []);

  const addTransaction = async (transaction: Transaction) => {
    if (!storageProvider) {
      console.error('Storage provider not available');
      return;
    }

    const result = await storageProvider.saveTransaction(transaction);
    if (result.success && result.data) {
      setTransactions((prev) => [...prev, result.data!]);
    } else {
      console.error('Failed to add transaction:', result.error);
      setError(result.error || 'Failed to add transaction');
    }
  };

  const mergeTransactions = async (newTransactions: Transaction[]): Promise<MergeResult> => {
    if (!storageProvider) {
      console.error('Storage provider not available');
      return { merged: transactions, duplicateCount: 0 };
    }

    const txMap = new Map<string, Transaction>();

    // Add existing transactions
    transactions.forEach((tx) => txMap.set(tx.id, tx));

    // Add new transactions and count duplicates
    let duplicateCount = 0;
    newTransactions.forEach((tx) => {
      if (txMap.has(tx.id)) {
        duplicateCount++;
      }
      txMap.set(tx.id, tx);
    });

    const merged = Array.from(txMap.values());

    // Save all transactions to storage
    const result = await storageProvider.saveTransactions(merged);
    if (result.success && result.data) {
      setTransactions(result.data);
      return { merged: result.data, duplicateCount };
    } else {
      console.error('Failed to merge transactions:', result.error);
      setError(result.error || 'Failed to merge transactions');
      return { merged: transactions, duplicateCount: 0 };
    }
  };

  const clearAllTransactions = async () => {
    if (confirm('Are you sure you want to clear all transaction data?')) {
      if (!storageProvider) {
        console.error('Storage provider not available');
        return;
      }

      const result = await storageProvider.clearTransactions();
      if (result.success) {
        setTransactions([]);
      } else {
        console.error('Failed to clear transactions:', result.error);
        setError(result.error || 'Failed to clear transactions');
      }
    }
  };

  const getExchangesList = (): string[] => {
    const exchanges = new Set(transactions.map((tx) => tx.exchange));
    return Array.from(exchanges).sort();
  };

  return {
    transactions,
    setTransactions,
    addTransaction,
    mergeTransactions,
    clearAllTransactions,
    getExchangesList,
    loading,
    error,
    storageProvider,
  };
};
