import { renderHook } from '@testing-library/react';
import { usePortfolioStats } from '../usePortfolioStats';
import { Transaction } from '../../types/Transaction';

describe('usePortfolioStats', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'tx1',
      date: new Date('2025-01-01'),
      exchange: 'Strike',
      type: 'Purchase',
      usdAmount: 100,
      btcAmount: 0.001,
      price: 100000,
    },
    {
      id: 'tx2',
      date: new Date('2025-01-02'),
      exchange: 'Coinbase',
      type: 'Purchase',
      usdAmount: 200,
      btcAmount: 0.002,
      price: 100000,
    },
    {
      id: 'tx3',
      date: new Date('2025-01-03'),
      exchange: 'Strike',
      type: 'Purchase',
      usdAmount: 300,
      btcAmount: 0.0025, // Different price: 120,000
      price: 120000,
    },
  ];

  it('should calculate stats correctly with valid transactions and price', () => {
    const currentPrice = 110000;
    const { result } = renderHook(() => usePortfolioStats(mockTransactions, currentPrice));

    expect(result.current.totalInvested).toBe(600); // 100 + 200 + 300
    expect(result.current.totalBitcoin).toBe(0.0055); // 0.001 + 0.002 + 0.0025
    expect(result.current.avgCostBasis).toBeCloseTo(109090.91, 2); // 600 / 0.0055
    expect(result.current.currentValue).toBe(605); // 0.0055 * 110000
    expect(result.current.unrealizedPnL).toBe(5); // 605 - 600
  });

  it('should calculate stats correctly with null current price', () => {
    const { result } = renderHook(() => usePortfolioStats(mockTransactions, null));

    expect(result.current.totalInvested).toBe(600);
    expect(result.current.totalBitcoin).toBe(0.0055);
    expect(result.current.avgCostBasis).toBeCloseTo(109090.91, 2);
    expect(result.current.currentValue).toBe(0); // 0.0055 * null = 0
    expect(result.current.unrealizedPnL).toBe(-600); // 0 - 600
  });

  it('should handle empty transactions array', () => {
    const currentPrice = 50000;
    const { result } = renderHook(() => usePortfolioStats([], currentPrice));

    expect(result.current.totalInvested).toBe(0);
    expect(result.current.totalBitcoin).toBe(0);
    expect(result.current.avgCostBasis).toBe(0);
    expect(result.current.currentValue).toBe(0);
    expect(result.current.unrealizedPnL).toBe(0);
  });

  it('should handle transactions with zero BTC amount', () => {
    const transactionsWithZero: Transaction[] = [
      {
        id: 'tx1',
        date: new Date('2025-01-01'),
        exchange: 'Strike',
        type: 'Purchase',
        usdAmount: 100,
        btcAmount: 0, // Zero BTC
        price: 100000,
      },
    ];

    const currentPrice = 50000;
    const { result } = renderHook(() => usePortfolioStats(transactionsWithZero, currentPrice));

    expect(result.current.totalInvested).toBe(100);
    expect(result.current.totalBitcoin).toBe(0);
    expect(result.current.avgCostBasis).toBe(0); // Should not divide by zero
    expect(result.current.currentValue).toBe(0);
    expect(result.current.unrealizedPnL).toBe(-100);
  });

  it('should handle negative amounts (withdrawals)', () => {
    const transactionsWithWithdrawal: Transaction[] = [
      {
        id: 'tx1',
        date: new Date('2025-01-01'),
        exchange: 'Strike',
        type: 'Purchase',
        usdAmount: 100,
        btcAmount: 0.001,
        price: 100000,
      },
      {
        id: 'tx2',
        date: new Date('2025-01-02'),
        exchange: 'Strike',
        type: 'Withdrawal',
        usdAmount: 0, // No USD for withdrawal
        btcAmount: -0.0005, // Negative BTC (withdrawal)
        price: 100000,
      },
    ];

    const currentPrice = 120000;
    const { result } = renderHook(() => usePortfolioStats(transactionsWithWithdrawal, currentPrice));

    expect(result.current.totalInvested).toBe(100); // Only the purchase
    expect(result.current.totalBitcoin).toBe(0.0005); // 0.001 - 0.0005
    expect(result.current.avgCostBasis).toBe(200000); // 100 / 0.0005
    expect(result.current.currentValue).toBe(60); // 0.0005 * 120000
    expect(result.current.unrealizedPnL).toBe(-40); // 60 - 100
  });

  it('should recalculate when transactions change', () => {
    const currentPrice = 100000;
    let transactions = mockTransactions.slice(0, 2); // First 2 transactions
    
    const { result, rerender } = renderHook(
      ({ transactions, price }) => usePortfolioStats(transactions, price),
      { initialProps: { transactions, price: currentPrice } }
    );

    // Initial calculation with 2 transactions
    expect(result.current.totalInvested).toBe(300); // 100 + 200
    expect(result.current.totalBitcoin).toBe(0.003); // 0.001 + 0.002

    // Update with all 3 transactions
    transactions = mockTransactions;
    rerender({ transactions, price: currentPrice });

    expect(result.current.totalInvested).toBe(600); // 100 + 200 + 300
    expect(result.current.totalBitcoin).toBe(0.0055); // 0.001 + 0.002 + 0.0025
  });

  it('should recalculate when price changes', () => {
    const transactions = mockTransactions.slice(0, 1); // Just one transaction
    let currentPrice = 100000;

    const { result, rerender } = renderHook(
      ({ transactions, price }) => usePortfolioStats(transactions, price),
      { initialProps: { transactions, price: currentPrice } }
    );

    // Initial calculation
    expect(result.current.currentValue).toBe(100); // 0.001 * 100000
    expect(result.current.unrealizedPnL).toBe(0); // 100 - 100

    // Update price
    currentPrice = 200000;
    rerender({ transactions, price: currentPrice });

    expect(result.current.currentValue).toBe(200); // 0.001 * 200000
    expect(result.current.unrealizedPnL).toBe(100); // 200 - 100
  });

  it('should handle very large numbers correctly', () => {
    const largeTransactions: Transaction[] = [
      {
        id: 'large1',
        date: new Date('2025-01-01'),
        exchange: 'Strike',
        type: 'Purchase',
        usdAmount: 1000000, // $1M
        btcAmount: 10, // 10 BTC
        price: 100000,
      },
    ];

    const currentPrice = 150000;
    const { result } = renderHook(() => usePortfolioStats(largeTransactions, currentPrice));

    expect(result.current.totalInvested).toBe(1000000);
    expect(result.current.totalBitcoin).toBe(10);
    expect(result.current.avgCostBasis).toBe(100000);
    expect(result.current.currentValue).toBe(1500000); // 10 * 150000
    expect(result.current.unrealizedPnL).toBe(500000);
  });

  it('should be memoized and not recalculate unnecessarily', () => {
    const currentPrice = 100000;
    
    const { result, rerender } = renderHook(
      ({ transactions, price }) => usePortfolioStats(transactions, price),
      { initialProps: { transactions: mockTransactions, price: currentPrice } }
    );

    const firstResult = result.current;

    // Rerender with same values
    rerender({ transactions: mockTransactions, price: currentPrice });

    // Should be the same object reference due to memoization
    expect(result.current).toBe(firstResult);
  });
});