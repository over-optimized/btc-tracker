import { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction } from '../types/Transaction';
import { AutoStorageProvider } from '../utils/AutoStorageProvider';
import { StorageProviderConfig } from '../types/StorageProvider';
import { useOptionalAuth } from '../contexts/AuthContext';

// Global singleton flags to prevent multiple concurrent executions across all hook instances
let globalIsLoading = false;
let globalInitializationAttempted = false;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let hookInstanceCounter = 0;

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

  // Track hook instances for potential debugging (increment counter)
  ++hookInstanceCounter;

  // Get auth context to coordinate with authentication state
  const auth = useOptionalAuth();

  // Create stable auth context reference for storage provider
  // NOTE: Only include essential stable data needed for storage provider
  // IMPORTANT: We deliberately use specific properties (user?.id, session?.access_token)
  // instead of full objects to prevent infinite re-renders from object recreation
  const stableAuthContext = useMemo(
    () => ({
      loading: auth.loading,
      isAuthenticated: auth.isAuthenticated,
      isAnonymous: auth.isAnonymous,
      user: auth.user,
      session: auth.session,
      supabase: auth.supabase,
      // Auth functions are not needed for storage provider operations
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      auth.loading,
      auth.isAuthenticated,
      auth.isAnonymous,
      auth.user?.id, // Only track user ID, not the entire user object
      auth.session?.access_token, // Only track access token, not entire session
      auth.supabase,
      // NOTE: We intentionally do NOT include auth.user and auth.session here
      // to prevent infinite re-renders from object recreation
    ],
  );

  // Create ref for auth context to avoid dependency issues
  const authContextRef = useRef(stableAuthContext);
  authContextRef.current = stableAuthContext;

  // Consolidated effect for storage initialization and auth state management
  useEffect(() => {
    const manageStorageAndTransactions = async () => {
      // Prevent concurrent execution with global singleton flag
      if (globalIsLoading) {
        return;
      }

      globalIsLoading = true;

      try {
        // Phase 1: Initialize provider if needed
        let activeProvider = storageProvider;

        if (!storageProvider && !auth.loading && !globalInitializationAttempted) {
          console.log('🔄 Transaction manager initializing (first time)');
          globalInitializationAttempted = true;
          setLoading(true);
          setError(null);

          const provider = new AutoStorageProvider();
          const config: StorageProviderConfig = {
            enableAuth: true,
            authContext: authContextRef.current,
          };

          const initResult = await provider.initialize(config);
          if (!initResult.success) {
            throw new Error(initResult.error || 'Failed to initialize storage');
          }

          setStorageProvider(provider);
          activeProvider = provider; // Use the fresh provider, don't wait for state update
        }

        // Phase 2: Load/refresh transactions if we have a provider
        if (activeProvider && !auth.loading) {
          console.log('📚 Loading/refreshing transactions from storage...');

          // Check if provider needs updating due to auth state change
          const config: StorageProviderConfig = {
            enableAuth: true,
            authContext: authContextRef.current,
          };

          // Update provider with current auth context (this may trigger migration)
          await activeProvider.initialize(config);

          // Load transactions - this is the only place we fetch from API
          const transactionsResult = await activeProvider.getTransactions();

          if (transactionsResult.success) {
            console.log('✅ Loaded transactions:', transactionsResult.data?.length || 0);
            setTransactions(transactionsResult.data || []);
          } else {
            console.warn('⚠️ Failed to load transactions:', transactionsResult.error);
            setError(transactionsResult.error || 'Failed to load transactions');
          }
        }
      } catch (err) {
        console.error('💥 Storage operation failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');

        // Fallback to legacy localStorage loading
        if (!storageProvider) {
          try {
            const { getTransactions } = await import('../utils/storage');
            const result = getTransactions();
            setTransactions(result.transactions);
          } catch {
            setTransactions([]);
          }
        }
      } finally {
        setLoading(false);
        globalIsLoading = false;
      }
    };

    // Only run when auth state is stable (not loading)
    if (!auth.loading) {
      manageStorageAndTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    auth.loading,
    // Only react to auth changes, not storageProvider changes to avoid circular dependency
    stableAuthContext.isAuthenticated, // Only care about auth state, not full context
    stableAuthContext.user?.id, // Only care about user ID changes
    // Intentionally excluding stableAuthContext and storageProvider to prevent circular dependency
  ]);

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
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const exchanges = new Set(safeTransactions.map((tx) => tx.exchange));
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
