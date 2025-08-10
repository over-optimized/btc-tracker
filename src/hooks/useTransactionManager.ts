import { useState } from 'react';
import { Transaction } from '../types/Transaction';
import { clearTransactions, getTransactions, saveTransactions } from '../utils/storage';

interface MergeResult {
  merged: Transaction[];
  duplicateCount: number;
}

interface TransactionManagerResult {
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  mergeTransactions: (newTransactions: Transaction[]) => MergeResult;
  clearAllTransactions: () => void;
  getExchangesList: () => string[];
}

export const useTransactionManager = (): TransactionManagerResult => {
  const [transactions, setTransactions] = useState<Transaction[]>(
    () => getTransactions().transactions
  );

  const addTransaction = (transaction: Transaction) => {
    const updatedTransactions = [...transactions, transaction];
    setTransactions(updatedTransactions);
    saveTransactions(updatedTransactions);
  };

  const mergeTransactions = (newTransactions: Transaction[]): MergeResult => {
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
    setTransactions(merged);
    saveTransactions(merged);

    return { merged, duplicateCount };
  };

  const clearAllTransactions = () => {
    if (confirm('Are you sure you want to clear all transaction data?')) {
      setTransactions([]);
      clearTransactions();
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
  };
};