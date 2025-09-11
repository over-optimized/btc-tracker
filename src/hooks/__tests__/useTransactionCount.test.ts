import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTransactionCount } from '../useTransactionCount';
import { Transaction } from '../../types/Transaction';

describe('useTransactionCount', () => {
  const createMockTransaction = (id: string): Transaction => ({
    id,
    date: new Date(),
    exchange: 'test',
    type: 'Purchase',
    usdAmount: 100,
    btcAmount: 0.001,
    price: 100000,
  });

  it('should return 0 for empty array', () => {
    const { result } = renderHook(() => useTransactionCount([]));
    expect(result.current).toBe(0);
  });

  it('should return correct count for non-empty array', () => {
    const transactions = [
      createMockTransaction('1'),
      createMockTransaction('2'),
      createMockTransaction('3'),
    ];
    const { result } = renderHook(() => useTransactionCount(transactions));
    expect(result.current).toBe(3);
  });

  it('should return 0 for non-array input', () => {
    // @ts-expect-error Testing edge case
    const { result } = renderHook(() => useTransactionCount(null));
    expect(result.current).toBe(0);
  });

  it('should update count when transactions array changes', () => {
    const initialTransactions = [createMockTransaction('1')];
    const { result, rerender } = renderHook(
      ({ transactions }) => useTransactionCount(transactions),
      { initialProps: { transactions: initialTransactions } },
    );

    expect(result.current).toBe(1);

    const updatedTransactions = [createMockTransaction('1'), createMockTransaction('2')];
    rerender({ transactions: updatedTransactions });
    expect(result.current).toBe(2);
  });

  it('should handle large arrays efficiently', () => {
    const largeArray = Array.from({ length: 1000 }, (_, i) => createMockTransaction(`tx-${i}`));
    const { result } = renderHook(() => useTransactionCount(largeArray));
    expect(result.current).toBe(1000);
  });

  it('should return same result for same array reference', () => {
    const transactions = [createMockTransaction('1')];
    const { result, rerender } = renderHook(() => useTransactionCount(transactions));

    const firstResult = result.current;
    rerender();
    const secondResult = result.current;

    expect(firstResult).toBe(secondResult);
    expect(firstResult).toBe(1);
  });
});
