import { describe, expect, it } from 'vitest';
import {
  detectIdCollisions,
  generateStableTransactionId,
  getExchangeFromId,
  isReferenceBasedId,
  isValidTransactionId,
  normalizeAmount,
  simpleHash,
  type TransactionData,
} from './generateTransactionId';

describe('generateStableTransactionId', () => {
  const baseTransaction: TransactionData = {
    exchange: 'Strike',
    date: new Date('2025-01-15T10:30:45.123Z'),
    usdAmount: 100.5,
    btcAmount: 0.00105432,
    type: 'Purchase',
  };

  describe('reference-based IDs', () => {
    it('should use reference when available', () => {
      const tx: TransactionData = {
        ...baseTransaction,
        reference: 'abc-123-xyz',
      };

      const id = generateStableTransactionId(tx);
      expect(id).toBe('strike-ref-abc-123-xyz');
      expect(isReferenceBasedId(id)).toBe(true);
    });

    it('should clean reference strings', () => {
      const tx: TransactionData = {
        ...baseTransaction,
        reference: ' abc@123#xyz! ',
      };

      const id = generateStableTransactionId(tx);
      expect(id).toBe('strike-ref-abc123xyz');
    });

    it('should fallback to hash when reference is empty', () => {
      const tx: TransactionData = {
        ...baseTransaction,
        reference: '   ',
      };

      const id = generateStableTransactionId(tx);
      expect(id).toMatch(/^strike-[a-z0-9]+$/);
      expect(isReferenceBasedId(id)).toBe(false);
    });
  });

  describe('hash-based IDs', () => {
    it('should generate consistent hash for same data', () => {
      const tx1 = { ...baseTransaction };
      const tx2 = { ...baseTransaction };

      const id1 = generateStableTransactionId(tx1);
      const id2 = generateStableTransactionId(tx2);

      expect(id1).toBe(id2);
      expect(id1).toMatch(/^strike-[a-z0-9]+$/);
    });

    it('should generate different hashes for different data', () => {
      const tx1 = { ...baseTransaction };
      const tx2 = { ...baseTransaction, usdAmount: 200.0 };

      const id1 = generateStableTransactionId(tx1);
      const id2 = generateStableTransactionId(tx2);

      expect(id1).not.toBe(id2);
    });

    it('should handle different exchanges', () => {
      const strikeId = generateStableTransactionId({ ...baseTransaction, exchange: 'Strike' });
      const coinbaseId = generateStableTransactionId({ ...baseTransaction, exchange: 'Coinbase' });

      expect(strikeId.startsWith('strike-')).toBe(true);
      expect(coinbaseId.startsWith('coinbase-')).toBe(true);
      expect(strikeId).not.toBe(coinbaseId);
    });

    it('should handle price differences', () => {
      const tx1 = { ...baseTransaction, price: 95000 };
      const tx2 = { ...baseTransaction, price: 96000 };

      const id1 = generateStableTransactionId(tx1);
      const id2 = generateStableTransactionId(tx2);

      expect(id1).not.toBe(id2);
    });

    it('should handle missing price', () => {
      const txWithPrice = { ...baseTransaction, price: 95000 };
      const txWithoutPrice = { ...baseTransaction };

      const id1 = generateStableTransactionId(txWithPrice);
      const id2 = generateStableTransactionId(txWithoutPrice);

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^strike-[a-z0-9]+$/);
      expect(id2).toMatch(/^strike-[a-z0-9]+$/);
    });
  });

  describe('edge cases', () => {
    it('should handle very small amounts', () => {
      const tx: TransactionData = {
        ...baseTransaction,
        usdAmount: 0.01,
        btcAmount: 0.00000001,
      };

      const id = generateStableTransactionId(tx);
      expect(id).toMatch(/^strike-[a-z0-9]+$/);
      expect(isValidTransactionId(id)).toBe(true);
    });

    it('should handle very large amounts', () => {
      const tx: TransactionData = {
        ...baseTransaction,
        usdAmount: 999999.99,
        btcAmount: 10.12345678,
      };

      const id = generateStableTransactionId(tx);
      expect(id).toMatch(/^strike-[a-z0-9]+$/);
      expect(isValidTransactionId(id)).toBe(true);
    });

    it('should handle different date formats', () => {
      const tx1 = { ...baseTransaction, date: new Date('2025-01-15T10:30:45.123Z') };
      const tx2 = { ...baseTransaction, date: new Date('2025-01-15T10:30:45.456Z') };
      const tx3 = { ...baseTransaction, date: new Date('2025-01-15T10:30:46.123Z') };

      const id1 = generateStableTransactionId(tx1);
      const id2 = generateStableTransactionId(tx2);
      const id3 = generateStableTransactionId(tx3);

      // Same second, different milliseconds - should be same ID
      expect(id1).toBe(id2);
      // Different second - should be different ID
      expect(id1).not.toBe(id3);
    });

    it('should handle special characters in exchange names', () => {
      const tx: TransactionData = {
        ...baseTransaction,
        exchange: 'Some-Exchange_2.0',
      };

      const id = generateStableTransactionId(tx);
      expect(id.startsWith('some-exchange_2.0-')).toBe(true);
    });
  });
});

describe('utility functions', () => {
  describe('simpleHash', () => {
    it('should return consistent hash for same input', () => {
      const input = 'test-string-123';
      expect(simpleHash(input)).toBe(simpleHash(input));
    });

    it('should return different hashes for different inputs', () => {
      expect(simpleHash('test1')).not.toBe(simpleHash('test2'));
    });

    it('should handle empty string', () => {
      expect(simpleHash('')).toBe(0);
    });

    it('should return positive numbers', () => {
      expect(simpleHash('negative-test')).toBeGreaterThanOrEqual(0);
    });
  });

  describe('normalizeAmount', () => {
    it('should normalize to 8 decimal places', () => {
      expect(normalizeAmount(1.123456789)).toBe('1.12345679');
      expect(normalizeAmount(1.1)).toBe('1.10000000');
      expect(normalizeAmount(0)).toBe('0.00000000');
    });

    it('should handle very small numbers', () => {
      expect(normalizeAmount(0.00000001)).toBe('0.00000001');
    });

    it('should handle very large numbers', () => {
      expect(normalizeAmount(999999.99999999)).toBe('999999.99999999');
    });
  });

  describe('isValidTransactionId', () => {
    it('should validate reference-based IDs', () => {
      expect(isValidTransactionId('strike-ref-abc123')).toBe(true);
      expect(isValidTransactionId('coinbase-ref-tx-hash-456')).toBe(true);
    });

    it('should validate hash-based IDs', () => {
      expect(isValidTransactionId('strike-a1b2c3')).toBe(true);
      expect(isValidTransactionId('kraken-xyz789')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidTransactionId('')).toBe(false);
      expect(isValidTransactionId('invalid')).toBe(false);
      expect(isValidTransactionId('strike')).toBe(false);
      expect(isValidTransactionId('strike-')).toBe(false);
      expect(isValidTransactionId('-abc123')).toBe(false);
    });
  });

  describe('getExchangeFromId', () => {
    it('should extract exchange name', () => {
      expect(getExchangeFromId('strike-ref-abc123')).toBe('strike');
      expect(getExchangeFromId('coinbase-a1b2c3')).toBe('coinbase');
      expect(getExchangeFromId('kraken-xyz789')).toBe('kraken');
    });

    it('should handle invalid IDs gracefully', () => {
      expect(getExchangeFromId('invalid')).toBe('invalid');
      expect(getExchangeFromId('')).toBe('unknown');
    });
  });

  describe('detectIdCollisions', () => {
    const baseTransaction: TransactionData = {
      exchange: 'Strike',
      date: new Date('2025-01-15T10:30:45.123Z'),
      usdAmount: 100.5,
      btcAmount: 0.00105432,
      type: 'Purchase',
    };
    it('should detect no collisions for unique transactions', () => {
      const transactions: TransactionData[] = [
        { ...baseTransaction, usdAmount: 100 },
        { ...baseTransaction, usdAmount: 200 },
        { ...baseTransaction, usdAmount: 300 },
      ];

      const collisions = detectIdCollisions(transactions);
      expect(collisions).toHaveLength(0);
    });

    it('should detect collisions for identical transactions', () => {
      const transactions: TransactionData[] = [{ ...baseTransaction }, { ...baseTransaction }];

      const collisions = detectIdCollisions(transactions);
      expect(collisions).toHaveLength(1);
      expect(collisions[0]).toContain('Collision at index 1');
    });

    it('should provide detailed collision information', () => {
      const transactions: TransactionData[] = [
        { ...baseTransaction, reference: 'abc123' },
        { ...baseTransaction, reference: 'abc123' }, // Same reference
        { ...baseTransaction, reference: 'xyz789' },
      ];

      const collisions = detectIdCollisions(transactions);
      expect(collisions).toHaveLength(1);
      expect(collisions[0]).toContain('strike-ref-abc123');
    });
  });
});

// Integration tests with real-world scenarios
describe('real-world scenarios', () => {
  it('should handle Strike CSV re-import correctly', () => {
    const strikeTransaction: TransactionData = {
      exchange: 'Strike',
      date: new Date('2025-01-01T14:36:06Z'),
      usdAmount: 50.0,
      btcAmount: 0.00053277,
      type: 'Purchase',
      reference: 'abc-123',
      price: 93849.13,
    };

    const id1 = generateStableTransactionId(strikeTransaction);
    const id2 = generateStableTransactionId(strikeTransaction);

    expect(id1).toBe(id2);
    expect(id1).toBe('strike-ref-abc-123');
  });

  it('should handle Coinbase without reference', () => {
    const coinbaseTransaction: TransactionData = {
      exchange: 'Coinbase',
      date: new Date('2025-01-01T12:00:00Z'),
      usdAmount: 40000,
      btcAmount: 0.001,
      type: 'Buy',
      price: 40000,
    };

    const id1 = generateStableTransactionId(coinbaseTransaction);
    const id2 = generateStableTransactionId(coinbaseTransaction);

    expect(id1).toBe(id2);
    expect(id1).toMatch(/^coinbase-[a-z0-9]+$/);
  });

  it('should handle mixed exchange imports', () => {
    const transactions: TransactionData[] = [
      {
        exchange: 'Strike',
        date: new Date('2025-01-01T10:00:00Z'),
        usdAmount: 100,
        btcAmount: 0.001,
        type: 'Purchase',
        reference: 'strike-ref-1',
      },
      {
        exchange: 'Coinbase',
        date: new Date('2025-01-01T10:00:00Z'),
        usdAmount: 100,
        btcAmount: 0.001,
        type: 'Buy',
      },
      {
        exchange: 'Kraken',
        date: new Date('2025-01-01T10:00:00Z'),
        usdAmount: 100,
        btcAmount: 0.001,
        type: 'trade',
      },
    ];

    const ids = transactions.map(generateStableTransactionId);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(3); // All should be unique
    expect(ids[0]).toMatch(/^strike-ref-strike-ref-1$/);
    expect(ids[1]).toMatch(/^coinbase-[a-z0-9]+$/);
    expect(ids[2]).toMatch(/^kraken-[a-z0-9]+$/);
  });
});
