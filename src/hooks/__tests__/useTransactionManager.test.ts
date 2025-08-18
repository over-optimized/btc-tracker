import { renderHook, act } from '@testing-library/react';
import { useTransactionManager } from '../useTransactionManager';
import { Transaction } from '../../types/Transaction';
import * as storage from '../../utils/storage';

// Mock the storage module
vi.mock('../../utils/storage', () => ({
  getTransactions: vi.fn(() => ({ transactions: [] })),
  saveTransactions: vi.fn(),
  clearTransactions: vi.fn(),
}));

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn(() => true),
});

describe('useTransactionManager', () => {
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
    vi.clearAllMocks();
    (storage.getTransactions as any).mockReturnValue({ transactions: [] });
  });

  it('should initialize with empty transactions from storage', () => {
    const { result } = renderHook(() => useTransactionManager());

    expect(result.current.transactions).toEqual([]);
    expect(storage.getTransactions).toHaveBeenCalled();
  });

  it('should initialize with existing transactions from storage', () => {
    const existingTransactions = [mockTransaction];
    (storage.getTransactions as any).mockReturnValue({ transactions: existingTransactions });

    const { result } = renderHook(() => useTransactionManager());

    expect(result.current.transactions).toEqual(existingTransactions);
  });

  it('should add a single transaction', () => {
    const { result } = renderHook(() => useTransactionManager());

    act(() => {
      result.current.addTransaction(mockTransaction);
    });

    expect(result.current.transactions).toEqual([mockTransaction]);
    expect(storage.saveTransactions).toHaveBeenCalledWith([mockTransaction]);
  });

  it('should merge transactions and return duplicate count', () => {
    // Start with one existing transaction
    (storage.getTransactions as any).mockReturnValue({ transactions: [mockTransaction] });
    const { result } = renderHook(() => useTransactionManager());

    const newTransactions = [mockTransaction, mockTransaction2]; // One duplicate, one new

    let mergeResult: any;
    act(() => {
      mergeResult = result.current.mergeTransactions(newTransactions);
    });

    expect(mergeResult!.duplicateCount).toBe(1); // mockTransaction is a duplicate
    expect(mergeResult!.merged).toHaveLength(2); // Should have 2 unique transactions
    expect(result.current.transactions).toHaveLength(2);
    expect(storage.saveTransactions).toHaveBeenCalledWith(mergeResult!.merged);
  });

  it('should merge transactions with no duplicates', () => {
    const { result } = renderHook(() => useTransactionManager());

    const newTransactions = [mockTransaction, mockTransaction2];

    let mergeResult: any;
    act(() => {
      mergeResult = result.current.mergeTransactions(newTransactions);
    });

    expect(mergeResult!.duplicateCount).toBe(0);
    expect(mergeResult!.merged).toHaveLength(2);
    expect(result.current.transactions).toEqual(newTransactions);
  });

  it('should clear all transactions when confirmed', () => {
    (storage.getTransactions as any).mockReturnValue({ transactions: [mockTransaction] });
    const { result } = renderHook(() => useTransactionManager());

    expect(result.current.transactions).toHaveLength(1);

    act(() => {
      result.current.clearAllTransactions();
    });

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to clear all transaction data?',
    );
    expect(result.current.transactions).toEqual([]);
    expect(storage.clearTransactions).toHaveBeenCalled();
  });

  it('should not clear transactions when not confirmed', () => {
    (window.confirm as any).mockReturnValueOnce(false);
    (storage.getTransactions as any).mockReturnValue({ transactions: [mockTransaction] });
    const { result } = renderHook(() => useTransactionManager());

    act(() => {
      result.current.clearAllTransactions();
    });

    expect(result.current.transactions).toHaveLength(1); // Should still have the transaction
    expect(storage.clearTransactions).not.toHaveBeenCalled();
  });

  it('should get unique exchanges list', () => {
    const transactions = [
      { ...mockTransaction, exchange: 'Strike' },
      { ...mockTransaction2, exchange: 'Coinbase' },
      { ...mockTransaction, id: 'test-id-3', exchange: 'Strike' }, // Duplicate exchange
      { ...mockTransaction, id: 'test-id-4', exchange: 'Kraken' },
    ];

    (storage.getTransactions as any).mockReturnValue({ transactions });
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
    (storage.getTransactions as any).mockReturnValue({ transactions: [mockTransaction] });
    const { result } = renderHook(() => useTransactionManager());

    let mergeResult: any;
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

    let mergeResult: any;
    act(() => {
      mergeResult = result.current.mergeTransactions(newTransactions);
    });

    expect(mergeResult!.duplicateCount).toBe(0);
    expect(mergeResult!.merged).toEqual(newTransactions);
    expect(result.current.transactions).toEqual(newTransactions);
  });
});
