import { useMemo } from 'react';
import { Transaction } from '../types/Transaction';

/**
 * Optimized hook that returns only the transaction count
 * Prevents unnecessary re-renders when components only need the count
 */
export const useTransactionCount = (transactions: Transaction[]): number => {
  return useMemo(() => {
    return Array.isArray(transactions) ? transactions.length : 0;
  }, [transactions]); // Need to depend on transactions to detect array changes
};
