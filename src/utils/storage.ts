import { Transaction } from '../types/Transaction';

const STORAGE_KEY = 'btc-tracker:transactions';

export function getTransactions(): Transaction[] {
  const data = localStorage.getItem('transactions');
  if (!data) return [];
  return JSON.parse(data).map((tx: any) => ({
    ...tx,
    date: new Date(tx.date), // Ensure date is a Date object
  }));
}

export function saveTransactions(transactions: Transaction[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

export function clearTransactions() {
  localStorage.removeItem(STORAGE_KEY);
}
