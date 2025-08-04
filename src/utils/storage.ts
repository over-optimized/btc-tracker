import { Transaction } from '../types/Transaction';

const STORAGE_KEY = 'btc-tracker:transactions';

export function getTransactions(): Transaction[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    // Convert date strings back to Date objects
    return arr.map((tx: any) => ({ ...tx, date: new Date(tx.date) }));
  } catch {
    return [];
  }
}

export function saveTransactions(transactions: Transaction[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

export function clearTransactions() {
  localStorage.removeItem(STORAGE_KEY);
}
