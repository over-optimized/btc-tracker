/**
 * Test Fixtures - Transaction Data
 * Reusable transaction data for testing migration, storage, and error handling
 */

import { Transaction } from '../../src/types/Transaction';

export interface TestTransactionSet {
  name: string;
  description: string;
  transactions: Transaction[];
}

/**
 * Small dataset for basic migration testing
 */
export const smallTransactionSet: TestTransactionSet = {
  name: 'Small Dataset',
  description: 'Basic transaction set for migration testing',
  transactions: [
    {
      id: 'migration-test-1',
      date: new Date('2024-01-15T10:00:00.000Z').toISOString(),
      exchange: 'Test Exchange',
      type: 'Purchase',
      usdAmount: 1000,
      btcAmount: 0.025,
      price: 40000,
    },
    {
      id: 'migration-test-2',
      date: new Date('2024-02-01T14:30:00.000Z').toISOString(),
      exchange: 'Test Exchange',
      type: 'Purchase',
      usdAmount: 500,
      btcAmount: 0.012,
      price: 42000,
    },
    {
      id: 'migration-test-3',
      date: new Date('2024-02-15T09:15:00.000Z').toISOString(),
      exchange: 'Test Exchange',
      type: 'Purchase',
      usdAmount: 750,
      btcAmount: 0.015,
      price: 50000,
    },
  ],
};

/**
 * Medium dataset for performance testing
 */
export const mediumTransactionSet: TestTransactionSet = {
  name: 'Medium Dataset',
  description: 'Medium-sized dataset for performance and concurrent testing',
  transactions: Array.from({ length: 50 }, (_, i) => ({
    id: `perf-test-${i + 1}`,
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(), // Daily transactions going back
    exchange: i % 3 === 0 ? 'Coinbase' : i % 3 === 1 ? 'Strike' : 'Kraken',
    type: 'Purchase',
    usdAmount: 100 + Math.random() * 900, // $100-$1000
    btcAmount: (100 + Math.random() * 900) / (45000 + Math.random() * 10000), // Realistic BTC amounts
    price: 45000 + Math.random() * 10000, // $45k-$55k range
  })),
};

/**
 * Large dataset for stress testing
 */
export const largeTransactionSet: TestTransactionSet = {
  name: 'Large Dataset',
  description: 'Large dataset for stress testing and storage limits',
  transactions: Array.from({ length: 500 }, (_, i) => ({
    id: `stress-test-${i + 1}`,
    date: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(), // Hourly transactions
    exchange: ['Coinbase', 'Strike', 'Kraken', 'Binance', 'Gemini'][i % 5],
    type: i % 10 === 0 ? 'Sale' : 'Purchase', // Mostly purchases, some sales
    usdAmount: 50 + Math.random() * 450, // $50-$500
    btcAmount: (50 + Math.random() * 450) / (40000 + Math.random() * 20000),
    price: 40000 + Math.random() * 20000, // $40k-$60k range
  })),
};

/**
 * Multi-exchange dataset for testing exchange filtering and classification
 */
export const multiExchangeTransactionSet: TestTransactionSet = {
  name: 'Multi-Exchange Dataset',
  description: 'Transactions from multiple exchanges with various types',
  transactions: [
    // Coinbase transactions
    {
      id: 'coinbase-1',
      date: new Date('2024-01-01T10:00:00.000Z').toISOString(),
      exchange: 'Coinbase',
      type: 'Purchase',
      usdAmount: 1000,
      btcAmount: 0.02,
      price: 50000,
    },
    {
      id: 'coinbase-2',
      date: new Date('2024-01-02T11:00:00.000Z').toISOString(),
      exchange: 'Coinbase',
      type: 'Sale',
      usdAmount: 500,
      btcAmount: 0.01,
      price: 50000,
    },
    // Strike transactions
    {
      id: 'strike-1',
      date: new Date('2024-01-03T12:00:00.000Z').toISOString(),
      exchange: 'Strike',
      type: 'Purchase',
      usdAmount: 200,
      btcAmount: 0.004,
      price: 50000,
    },
    {
      id: 'strike-2',
      date: new Date('2024-01-04T13:00:00.000Z').toISOString(),
      exchange: 'Strike',
      type: 'Lightning Send',
      usdAmount: 0,
      btcAmount: 0.001,
      price: 50000,
    },
    // Kraken transactions
    {
      id: 'kraken-1',
      date: new Date('2024-01-05T14:00:00.000Z').toISOString(),
      exchange: 'Kraken',
      type: 'Purchase',
      usdAmount: 800,
      btcAmount: 0.016,
      price: 50000,
    },
    {
      id: 'kraken-2',
      date: new Date('2024-01-06T15:00:00.000Z').toISOString(),
      exchange: 'Kraken',
      type: 'Transfer',
      usdAmount: 0,
      btcAmount: 0.005,
      price: 50000,
      destinationWallet: 'Cold Storage',
      isSelfCustody: true,
    },
  ],
};

/**
 * Edge case transactions for error testing
 */
export const edgeCaseTransactionSet: TestTransactionSet = {
  name: 'Edge Cases',
  description: 'Transactions with edge cases for validation testing',
  transactions: [
    // Very small amounts
    {
      id: 'edge-tiny-amount',
      date: new Date('2024-01-01T10:00:00.000Z').toISOString(),
      exchange: 'Test Exchange',
      type: 'Purchase',
      usdAmount: 0.01, // 1 cent
      btcAmount: 0.000001, // 1 satoshi
      price: 10000,
    },
    // Very large amounts
    {
      id: 'edge-large-amount',
      date: new Date('2024-01-02T10:00:00.000Z').toISOString(),
      exchange: 'Test Exchange',
      type: 'Purchase',
      usdAmount: 1000000, // $1M
      btcAmount: 20, // 20 BTC
      price: 50000,
    },
    // Zero amounts (for transfers)
    {
      id: 'edge-zero-usd',
      date: new Date('2024-01-03T10:00:00.000Z').toISOString(),
      exchange: 'Test Exchange',
      type: 'Transfer',
      usdAmount: 0,
      btcAmount: 0.1,
      price: 50000,
      destinationWallet: 'Hardware Wallet',
    },
    // Unusual prices
    {
      id: 'edge-low-price',
      date: new Date('2024-01-04T10:00:00.000Z').toISOString(),
      exchange: 'Test Exchange',
      type: 'Purchase',
      usdAmount: 100,
      btcAmount: 1, // $100/BTC (historically low)
      price: 100,
    },
    // Recent transactions
    {
      id: 'edge-recent',
      date: new Date().toISOString(), // Right now
      exchange: 'Test Exchange',
      type: 'Purchase',
      usdAmount: 500,
      btcAmount: 0.01,
      price: 50000,
    },
  ],
};

/**
 * Utility function to create custom transaction datasets
 */
export function generateTransactionSet(
  count: number,
  options: {
    prefix?: string;
    exchanges?: string[];
    types?: string[];
    dateRange?: { start: Date; end: Date };
    priceRange?: { min: number; max: number };
    amountRange?: { min: number; max: number };
  } = {},
): Transaction[] {
  const {
    prefix = 'generated',
    exchanges = ['Test Exchange'],
    types = ['Purchase'],
    dateRange = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
    },
    priceRange = { min: 40000, max: 60000 },
    amountRange = { min: 100, max: 1000 },
  } = options;

  return Array.from({ length: count }, (_, i) => {
    const usdAmount = amountRange.min + Math.random() * (amountRange.max - amountRange.min);
    const price = priceRange.min + Math.random() * (priceRange.max - priceRange.min);
    const btcAmount = usdAmount / price;

    const dateSpan = dateRange.end.getTime() - dateRange.start.getTime();
    const randomDate = new Date(dateRange.start.getTime() + Math.random() * dateSpan);

    return {
      id: `${prefix}-${i + 1}`,
      date: randomDate.toISOString(),
      exchange: exchanges[i % exchanges.length],
      type: types[i % types.length],
      usdAmount,
      btcAmount,
      price,
    };
  });
}

/**
 * All available test datasets
 */
export const testTransactionSets = {
  small: smallTransactionSet,
  medium: mediumTransactionSet,
  large: largeTransactionSet,
  multiExchange: multiExchangeTransactionSet,
  edgeCases: edgeCaseTransactionSet,
} as const;

/**
 * Create localStorage-compatible transaction data
 */
export function createLocalStorageData(transactionSet: TestTransactionSet) {
  return {
    transactions: transactionSet.transactions,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Helper to get transactions for a specific test scenario
 */
export function getTestTransactions(scenario: keyof typeof testTransactionSets): Transaction[] {
  return testTransactionSets[scenario].transactions;
}
