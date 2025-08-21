import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTransactionManager } from '../useTransactionManager';
import { Transaction } from '../../types/Transaction';

// Mock localStorage with real implementation for integration testing
const createMockLocalStorage = () => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
};

// Replace global localStorage for real integration testing
const mockLocalStorage = createMockLocalStorage();
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn(() => true),
});

describe('useTransactionManager (Real Integration)', () => {
  const mockTransaction: Transaction = {
    id: 'test-id-1',
    date: new Date('2025-01-01'),
    exchange: 'Strike',
    type: 'Purchase',
    usdAmount: 100,
    btcAmount: 0.001,
    price: 100000,
  };

  const mockTransaction2: Transaction = {
    id: 'test-id-2',
    date: new Date('2025-01-02'),
    exchange: 'Coinbase',
    type: 'Purchase',
    usdAmount: 200,
    btcAmount: 0.002,
    price: 100000,
  };

  beforeEach(() => {
    // Clear localStorage before each test
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    mockLocalStorage.clear();
  });

  it('should initialize with empty transactions from storage', () => {
    const { result } = renderHook(() => useTransactionManager());

    expect(result.current.transactions).toEqual([]);
    // Should have created storage version for new user
    expect(mockLocalStorage.getItem('btc-tracker:storage-version')).toBeDefined();
  });

  it('should initialize with existing transactions from real storage', () => {
    // Pre-populate localStorage with existing transactions
    const existingTransactions = [mockTransaction];
    const serializedTransactions = existingTransactions.map((tx) => ({
      ...tx,
      date: tx.date.toISOString(),
    }));

    mockLocalStorage.setItem('btc-tracker:transactions', JSON.stringify(serializedTransactions));
    mockLocalStorage.setItem(
      'btc-tracker:storage-version',
      JSON.stringify({
        version: 2,
        migratedAt: new Date().toISOString(),
      }),
    );

    const { result } = renderHook(() => useTransactionManager());

    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0].id).toBe('test-id-1');
    expect(result.current.transactions[0].date).toBeInstanceOf(Date);
  });

  it('should add a single transaction and persist to real storage', () => {
    const { result } = renderHook(() => useTransactionManager());

    act(() => {
      result.current.addTransaction(mockTransaction);
    });

    expect(result.current.transactions).toEqual([mockTransaction]);

    // Verify it was actually saved to localStorage
    const saved = mockLocalStorage.getItem('btc-tracker:transactions');
    expect(saved).toBeDefined();
    const parsed = JSON.parse(saved!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('test-id-1');
  });

  it('should merge transactions and return duplicate count with real storage', () => {
    // Pre-populate localStorage with existing transaction
    const existingTransactions = [mockTransaction];
    const serializedTransactions = existingTransactions.map((tx) => ({
      ...tx,
      date: tx.date.toISOString(),
    }));

    mockLocalStorage.setItem('btc-tracker:transactions', JSON.stringify(serializedTransactions));
    mockLocalStorage.setItem(
      'btc-tracker:storage-version',
      JSON.stringify({
        version: 2,
        migratedAt: new Date().toISOString(),
      }),
    );

    const { result } = renderHook(() => useTransactionManager());

    const newTransactions = [mockTransaction, mockTransaction2]; // One duplicate, one new

    interface MergeResult {
      merged: Transaction[];
      duplicateCount: number;
    }

    let mergeResult: MergeResult | undefined;
    act(() => {
      mergeResult = result.current.mergeTransactions(newTransactions);
    });

    expect(mergeResult!.duplicateCount).toBe(1); // mockTransaction is a duplicate
    expect(mergeResult!.merged).toHaveLength(2); // Should have 2 unique transactions
    expect(result.current.transactions).toHaveLength(2);

    // Verify persistence to real storage
    const saved = mockLocalStorage.getItem('btc-tracker:transactions');
    const parsed = JSON.parse(saved!);
    expect(parsed).toHaveLength(2);
  });

  it('should merge transactions with no duplicates', () => {
    const { result } = renderHook(() => useTransactionManager());

    const newTransactions = [mockTransaction, mockTransaction2];

    interface MergeResult {
      merged: Transaction[];
      duplicateCount: number;
    }

    let mergeResult: MergeResult | undefined;
    act(() => {
      mergeResult = result.current.mergeTransactions(newTransactions);
    });

    expect(mergeResult!.duplicateCount).toBe(0);
    expect(mergeResult!.merged).toHaveLength(2);
    expect(result.current.transactions).toEqual(newTransactions);

    // Verify persistence
    const saved = mockLocalStorage.getItem('btc-tracker:transactions');
    const parsed = JSON.parse(saved!);
    expect(parsed).toHaveLength(2);
  });

  it('should clear all transactions when confirmed', () => {
    // Pre-populate localStorage
    const existingTransactions = [mockTransaction];
    const serializedTransactions = existingTransactions.map((tx) => ({
      ...tx,
      date: tx.date.toISOString(),
    }));

    mockLocalStorage.setItem('btc-tracker:transactions', JSON.stringify(serializedTransactions));
    mockLocalStorage.setItem(
      'btc-tracker:storage-version',
      JSON.stringify({
        version: 2,
        migratedAt: new Date().toISOString(),
      }),
    );

    const { result } = renderHook(() => useTransactionManager());

    expect(result.current.transactions).toHaveLength(1);

    act(() => {
      result.current.clearAllTransactions();
    });

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to clear all transaction data?',
    );
    expect(result.current.transactions).toEqual([]);

    // Verify storage was actually cleared
    expect(mockLocalStorage.getItem('btc-tracker:transactions')).toBeNull();
    expect(mockLocalStorage.getItem('btc-tracker:storage-version')).toBeNull();
  });

  it('should not clear transactions when not confirmed', () => {
    (window.confirm as any).mockReturnValueOnce(false);

    // Pre-populate localStorage
    const existingTransactions = [mockTransaction];
    const serializedTransactions = existingTransactions.map((tx) => ({
      ...tx,
      date: tx.date.toISOString(),
    }));

    mockLocalStorage.setItem('btc-tracker:transactions', JSON.stringify(serializedTransactions));
    mockLocalStorage.setItem(
      'btc-tracker:storage-version',
      JSON.stringify({
        version: 2,
        migratedAt: new Date().toISOString(),
      }),
    );

    const { result } = renderHook(() => useTransactionManager());

    act(() => {
      result.current.clearAllTransactions();
    });

    expect(result.current.transactions).toHaveLength(1); // Should still have the transaction

    // Verify storage was NOT cleared
    expect(mockLocalStorage.getItem('btc-tracker:transactions')).toBeDefined();
    expect(mockLocalStorage.getItem('btc-tracker:storage-version')).toBeDefined();
  });

  it('should get unique exchanges list', () => {
    const transactions = [
      { ...mockTransaction, exchange: 'Strike' },
      { ...mockTransaction2, exchange: 'Coinbase' },
      { ...mockTransaction, id: 'test-id-3', exchange: 'Strike' }, // Duplicate exchange
      { ...mockTransaction, id: 'test-id-4', exchange: 'Kraken' },
    ];

    // Pre-populate localStorage with transactions
    const serializedTransactions = transactions.map((tx) => ({
      ...tx,
      date: tx.date.toISOString(),
    }));

    mockLocalStorage.setItem('btc-tracker:transactions', JSON.stringify(serializedTransactions));
    mockLocalStorage.setItem(
      'btc-tracker:storage-version',
      JSON.stringify({
        version: 3,
        migratedAt: new Date().toISOString(),
      }),
    );

    const { result } = renderHook(() => useTransactionManager());

    const exchanges = result.current.getExchangesList();

    expect(exchanges).toEqual(['Coinbase', 'Kraken', 'Strike']); // Should be sorted and unique
  });

  it('should return empty array for exchanges when no transactions', () => {
    const { result } = renderHook(() => useTransactionManager());

    const exchanges = result.current.getExchangesList();

    expect(exchanges).toEqual([]);
  });

  it('should update transactions state when using setTransactions', () => {
    const { result } = renderHook(() => useTransactionManager());

    const newTransactions = [mockTransaction, mockTransaction2];

    act(() => {
      result.current.setTransactions(newTransactions);
    });

    expect(result.current.transactions).toEqual(newTransactions);
  });

  it('should handle empty new transactions in merge', () => {
    // Pre-populate localStorage with existing transaction
    const serializedTransactions = [mockTransaction].map((tx) => ({
      ...tx,
      date: tx.date.toISOString(),
    }));

    mockLocalStorage.setItem('btc-tracker:transactions', JSON.stringify(serializedTransactions));
    mockLocalStorage.setItem(
      'btc-tracker:storage-version',
      JSON.stringify({
        version: 3,
        migratedAt: new Date().toISOString(),
      }),
    );

    const { result } = renderHook(() => useTransactionManager());

    interface MergeResult {
      merged: Transaction[];
      duplicateCount: number;
    }

    let mergeResult: MergeResult | undefined;
    act(() => {
      mergeResult = result.current.mergeTransactions([]);
    });

    expect(mergeResult!.duplicateCount).toBe(0);
    expect(mergeResult!.merged).toEqual([mockTransaction]); // Should keep existing
    expect(result.current.transactions).toEqual([mockTransaction]);
  });

  it('should handle merging with empty existing transactions', () => {
    const { result } = renderHook(() => useTransactionManager());

    const newTransactions = [mockTransaction, mockTransaction2];

    interface MergeResult {
      merged: Transaction[];
      duplicateCount: number;
    }

    let mergeResult: MergeResult | undefined;
    act(() => {
      mergeResult = result.current.mergeTransactions(newTransactions);
    });

    expect(mergeResult!.duplicateCount).toBe(0);
    expect(mergeResult!.merged).toEqual(newTransactions);
    expect(result.current.transactions).toEqual(newTransactions);
  });
});
