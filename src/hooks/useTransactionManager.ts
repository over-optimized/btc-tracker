import { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction } from '../types/Transaction';
import { AutoStorageProvider } from '../utils/AutoStorageProvider';
import { StorageProviderConfig } from '../types/StorageProvider';
import { useOptionalAuth } from '../contexts/AuthContext';

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

  // Use refs to prevent duplicate operations
  const initializationAttempted = useRef(false);
  const currentRequestId = useRef<string | null>(null);

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
      // Generate unique request ID for deduplication
      const requestId = Date.now().toString();
      currentRequestId.current = requestId;

      try {
        // Phase 1: Initialize provider if needed
        if (!storageProvider && !auth.loading && !initializationAttempted.current) {
          console.log('🔄 Transaction manager initializing (first time)');
          initializationAttempted.current = true;
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

          // Check if request is still current before updating state
          if (currentRequestId.current !== requestId) {
            console.log('🚫 Request superseded during initialization, aborting');
            return;
          }

          setStorageProvider(provider);
        }

        // Phase 2: Load/refresh transactions if we have a provider
        const activeProvider =
          storageProvider || (initializationAttempted.current ? storageProvider : null);

        if (activeProvider && !auth.loading) {
          console.log('📚 Loading/refreshing transactions from storage...');

          // Check if provider needs updating due to auth state change
          const config: StorageProviderConfig = {
            enableAuth: true,
            authContext: authContextRef.current,
          };

          // Update provider with current auth context (this may trigger migration)
          await activeProvider.initialize(config);

          // Check if request is still current before making API call
          if (currentRequestId.current !== requestId) {
            console.log('🚫 Request superseded during provider update, aborting');
            return;
          }

          // Load transactions - this is the only place we fetch from API
          const transactionsResult = await activeProvider.getTransactions();

          // Final check before updating state
          if (currentRequestId.current !== requestId) {
            console.log('🚫 Request superseded during transaction loading, aborting');
            return;
          }

          if (transactionsResult.success) {
            console.log('✅ Loaded transactions:', transactionsResult.data?.length || 0);
            setTransactions(transactionsResult.data || []);
          } else {
            console.warn('⚠️ Failed to load transactions:', transactionsResult.error);
            setError(transactionsResult.error || 'Failed to load transactions');
          }
        }
      } catch (err) {
        // Only handle error if this request is still current
        if (currentRequestId.current === requestId) {
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
        }
      } finally {
        // Only update loading state if this request is still current
        if (currentRequestId.current === requestId) {
          setLoading(false);
        }
      }
    };

    // Only run when auth state is stable (not loading)
    if (!auth.loading) {
      manageStorageAndTransactions();
    }
  }, [
    auth.loading,
    stableAuthContext, // This will change when user logs in/out
    storageProvider, // This will be null initially, then set once
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
