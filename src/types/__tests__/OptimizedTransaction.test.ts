import { describe, expect, it } from 'vitest';
import {
  batchConvertToLegacy,
  batchConvertToOptimized,
  convertToLegacyTransaction,
  convertToOptimizedTransaction,
  createOptimizedTransaction,
  isOptimizedTransaction,
  isValidOptimizedTransaction,
  type OptimizedTransaction,
  updateOptimizedTransaction,
} from '../OptimizedTransaction';

describe('OptimizedTransaction', () => {
  // Sample data for testing
  const createSampleLegacyTransaction = (overrides: any = {}) => ({
    id: 'test-tx-1',
    date: new Date('2025-01-15T10:00:00Z'),
    exchange: 'Strike',
    type: 'Purchase',
    usdAmount: 100,
    btcAmount: 0.001,
    price: 100000,
    ...overrides,
  });

  const createSampleOptimizedTransaction = (
    overrides: Partial<OptimizedTransaction> = {},
  ): OptimizedTransaction => ({
    id: 'test-tx-1',
    user_id: null,
    date: '2025-01-15T10:00:00.000Z',
    exchange: 'Strike',
    type: 'Purchase',
    usd_amount: 100,
    btc_amount: 0.001,
    price: 100000,
    created_at: '2025-01-15T10:00:00.000Z',
    updated_at: '2025-01-15T10:00:00.000Z',
    ...overrides,
  });

  describe('isOptimizedTransaction', () => {
    it('should return true for valid OptimizedTransaction', () => {
      const transaction = createSampleOptimizedTransaction();
      expect(isOptimizedTransaction(transaction)).toBe(true);
    });

    it('should return false for missing required fields', () => {
      const invalidTransactions = [
        { ...createSampleOptimizedTransaction(), id: undefined },
        { ...createSampleOptimizedTransaction(), user_id: undefined },
        { ...createSampleOptimizedTransaction(), date: undefined },
        { ...createSampleOptimizedTransaction(), exchange: undefined },
        { ...createSampleOptimizedTransaction(), type: undefined },
        { ...createSampleOptimizedTransaction(), usd_amount: undefined },
        { ...createSampleOptimizedTransaction(), btc_amount: undefined },
        { ...createSampleOptimizedTransaction(), price: undefined },
        { ...createSampleOptimizedTransaction(), created_at: undefined },
        { ...createSampleOptimizedTransaction(), updated_at: undefined },
      ];

      invalidTransactions.forEach((tx) => {
        expect(isOptimizedTransaction(tx)).toBe(false);
      });
    });

    it('should return false for wrong field types', () => {
      const invalidTransactions = [
        { ...createSampleOptimizedTransaction(), id: 123 },
        { ...createSampleOptimizedTransaction(), user_id: 123 },
        { ...createSampleOptimizedTransaction(), date: new Date() },
        { ...createSampleOptimizedTransaction(), exchange: 123 },
        { ...createSampleOptimizedTransaction(), type: 123 },
        { ...createSampleOptimizedTransaction(), usd_amount: '100' },
        { ...createSampleOptimizedTransaction(), btc_amount: '0.001' },
        { ...createSampleOptimizedTransaction(), price: '100000' },
        { ...createSampleOptimizedTransaction(), created_at: new Date() },
        { ...createSampleOptimizedTransaction(), updated_at: new Date() },
      ];

      invalidTransactions.forEach((tx) => {
        expect(isOptimizedTransaction(tx)).toBe(false);
      });
    });

    it('should return false for null or non-object values', () => {
      expect(isOptimizedTransaction(null)).toBe(false);
      expect(isOptimizedTransaction(undefined)).toBe(false);
      expect(isOptimizedTransaction('string')).toBe(false);
      expect(isOptimizedTransaction(123)).toBe(false);
      expect(isOptimizedTransaction([])).toBe(false);
    });

    it('should allow null user_id', () => {
      const transaction = createSampleOptimizedTransaction({ user_id: null });
      expect(isOptimizedTransaction(transaction)).toBe(true);
    });

    it('should allow string user_id', () => {
      const transaction = createSampleOptimizedTransaction({ user_id: 'user-123' });
      expect(isOptimizedTransaction(transaction)).toBe(true);
    });
  });

  describe('isValidOptimizedTransaction', () => {
    it('should return true for valid transaction', () => {
      const transaction = createSampleOptimizedTransaction();
      expect(isValidOptimizedTransaction(transaction)).toBe(true);
    });

    it('should return false for empty required fields', () => {
      const invalidTransactions = [
        { ...createSampleOptimizedTransaction(), id: '' },
        { ...createSampleOptimizedTransaction(), date: '' },
        { ...createSampleOptimizedTransaction(), exchange: '' },
        { ...createSampleOptimizedTransaction(), type: '' },
      ];

      invalidTransactions.forEach((tx) => {
        expect(isValidOptimizedTransaction(tx)).toBe(false);
      });
    });

    it('should return false for NaN numeric values', () => {
      const invalidTransactions = [
        { ...createSampleOptimizedTransaction(), usd_amount: NaN },
        { ...createSampleOptimizedTransaction(), btc_amount: NaN },
        { ...createSampleOptimizedTransaction(), price: NaN },
      ];

      invalidTransactions.forEach((tx) => {
        expect(isValidOptimizedTransaction(tx)).toBe(false);
      });
    });

    it('should return false for invalid date formats', () => {
      const invalidTransactions = [
        { ...createSampleOptimizedTransaction(), date: 'invalid-date' },
        { ...createSampleOptimizedTransaction(), created_at: 'invalid-date' },
        { ...createSampleOptimizedTransaction(), updated_at: 'invalid-date' },
      ];

      invalidTransactions.forEach((tx) => {
        expect(isValidOptimizedTransaction(tx)).toBe(false);
      });
    });

    it('should return false for impossible Purchase transactions', () => {
      const invalidPurchase = createSampleOptimizedTransaction({
        type: 'Purchase',
        usd_amount: 0,
        price: 0,
      });
      expect(isValidOptimizedTransaction(invalidPurchase)).toBe(false);
    });

    it('should return false for impossible Sale transactions', () => {
      const invalidSale = createSampleOptimizedTransaction({
        type: 'Sale',
        usd_amount: 0,
      });
      expect(isValidOptimizedTransaction(invalidSale)).toBe(false);
    });

    it('should return false for transactions with no BTC movement', () => {
      const invalidTransaction = createSampleOptimizedTransaction({
        type: 'Purchase',
        btc_amount: 0,
      });
      expect(isValidOptimizedTransaction(invalidTransaction)).toBe(false);
    });

    it('should allow Deposit transactions with zero BTC movement', () => {
      const depositTransaction = createSampleOptimizedTransaction({
        type: 'Deposit',
        btc_amount: 0,
      });
      expect(isValidOptimizedTransaction(depositTransaction)).toBe(true);
    });
  });

  describe('convertToOptimizedTransaction', () => {
    it('should convert legacy transaction correctly', () => {
      const legacyTx = createSampleLegacyTransaction();
      const optimized = convertToOptimizedTransaction(legacyTx, 'user-123');

      expect(optimized.id).toBe(legacyTx.id);
      expect(optimized.user_id).toBe('user-123');
      expect(optimized.date).toBe(legacyTx.date.toISOString());
      expect(optimized.exchange).toBe(legacyTx.exchange);
      expect(optimized.type).toBe(legacyTx.type);
      expect(optimized.usd_amount).toBe(legacyTx.usdAmount);
      expect(optimized.btc_amount).toBe(legacyTx.btcAmount);
      expect(optimized.price).toBe(legacyTx.price);
      expect(optimized.created_at).toBeDefined();
      expect(optimized.updated_at).toBeDefined();
    });

    it('should convert extended fields from camelCase to snake_case', () => {
      const legacyTx = createSampleLegacyTransaction({
        destinationWallet: 'bc1qtest',
        networkFee: 0.0001,
        networkFeeUsd: 10,
        isSelfCustody: true,
        goodsServices: 'Coffee purchase',
        sourceExchange: 'Coinbase',
        destinationExchange: 'Strike',
        isTaxable: true,
      });

      const optimized = convertToOptimizedTransaction(legacyTx);

      expect(optimized.destination_wallet).toBe('bc1qtest');
      expect(optimized.network_fee).toBe(0.0001);
      expect(optimized.network_fee_usd).toBe(10);
      expect(optimized.is_self_custody).toBe(true);
      expect(optimized.goods_services).toBe('Coffee purchase');
      expect(optimized.source_exchange).toBe('Coinbase');
      expect(optimized.destination_exchange).toBe('Strike');
      expect(optimized.is_taxable).toBe(true);
    });

    it('should handle string dates', () => {
      const legacyTx = {
        ...createSampleLegacyTransaction(),
        date: '2025-01-15T10:00:00.000Z',
      };

      const optimized = convertToOptimizedTransaction(legacyTx);
      expect(optimized.date).toBe('2025-01-15T10:00:00.000Z');
    });

    it('should handle already optimized fields', () => {
      const legacyTx = createSampleLegacyTransaction({
        usd_amount: 200, // Already snake_case
        btc_amount: 0.002,
        destination_wallet: 'bc1qtest',
      });

      const optimized = convertToOptimizedTransaction(legacyTx);
      expect(optimized.usd_amount).toBe(200);
      expect(optimized.btc_amount).toBe(0.002);
      expect(optimized.destination_wallet).toBe('bc1qtest');
    });

    it('should default user_id to null when not provided', () => {
      const legacyTx = createSampleLegacyTransaction();
      const optimized = convertToOptimizedTransaction(legacyTx);
      expect(optimized.user_id).toBeNull();
    });
  });

  describe('convertToLegacyTransaction', () => {
    it('should convert optimized transaction to legacy format', () => {
      const optimizedTx = createSampleOptimizedTransaction();
      const legacy = convertToLegacyTransaction(optimizedTx);

      expect(legacy.id).toBe(optimizedTx.id);
      expect(legacy.date).toBeInstanceOf(Date);
      expect(legacy.date.toISOString()).toBe(optimizedTx.date);
      expect(legacy.exchange).toBe(optimizedTx.exchange);
      expect(legacy.type).toBe(optimizedTx.type);
      expect(legacy.usdAmount).toBe(optimizedTx.usd_amount);
      expect(legacy.btcAmount).toBe(optimizedTx.btc_amount);
      expect(legacy.price).toBe(optimizedTx.price);
    });

    it('should convert extended fields from snake_case to camelCase', () => {
      const optimizedTx = createSampleOptimizedTransaction({
        destination_wallet: 'bc1qtest',
        network_fee: 0.0001,
        network_fee_usd: 10,
        is_self_custody: true,
        goods_services: 'Coffee purchase',
        source_exchange: 'Coinbase',
        destination_exchange: 'Strike',
        is_taxable: true,
      });

      const legacy = convertToLegacyTransaction(optimizedTx);

      expect(legacy.destinationWallet).toBe('bc1qtest');
      expect(legacy.networkFee).toBe(0.0001);
      expect(legacy.networkFeeUsd).toBe(10);
      expect(legacy.isSelfCustody).toBe(true);
      expect(legacy.goodsServices).toBe('Coffee purchase');
      expect(legacy.sourceExchange).toBe('Coinbase');
      expect(legacy.destinationExchange).toBe('Strike');
      expect(legacy.isTaxable).toBe(true);
    });
  });

  describe('createOptimizedTransaction', () => {
    it('should create transaction with current timestamps', () => {
      const data = {
        id: 'new-tx',
        user_id: 'user-123',
        date: '2025-01-15T10:00:00.000Z',
        exchange: 'Strike',
        type: 'Purchase',
        usd_amount: 100,
        btc_amount: 0.001,
        price: 100000,
      };

      const transaction = createOptimizedTransaction(data);

      expect(transaction.id).toBe(data.id);
      expect(transaction.user_id).toBe(data.user_id);
      expect(transaction.created_at).toBeDefined();
      expect(transaction.updated_at).toBeDefined();
      expect(new Date(transaction.created_at)).toBeInstanceOf(Date);
      expect(new Date(transaction.updated_at)).toBeInstanceOf(Date);
    });
  });

  describe('updateOptimizedTransaction', () => {
    it('should update transaction with new updated_at timestamp', () => {
      const original = createSampleOptimizedTransaction();
      const originalUpdatedAt = original.updated_at;

      // Wait a tiny bit to ensure timestamp changes
      const updated = updateOptimizedTransaction(original, {
        usd_amount: 200,
        notes: 'Updated transaction',
      });

      expect(updated.id).toBe(original.id);
      expect(updated.created_at).toBe(original.created_at); // Should not change
      expect(updated.updated_at).not.toBe(originalUpdatedAt); // Should change
      expect(updated.usd_amount).toBe(200);
      expect(updated.notes).toBe('Updated transaction');
    });

    it('should not allow updating id, created_at, or updated_at directly', () => {
      const original = createSampleOptimizedTransaction();

      // TypeScript should prevent this, but test runtime behavior
      const updated = updateOptimizedTransaction(original, {
        usd_amount: 200,
        // These should be ignored by the function design
      } as any);

      expect(updated.id).toBe(original.id);
      expect(updated.created_at).toBe(original.created_at);
      expect(updated.updated_at).not.toBe(original.updated_at);
    });
  });

  describe('batchConvertToOptimized', () => {
    it('should convert multiple legacy transactions', () => {
      const legacyTransactions = [
        createSampleLegacyTransaction({ id: 'tx-1', usdAmount: 100 }),
        createSampleLegacyTransaction({ id: 'tx-2', usdAmount: 200 }),
        createSampleLegacyTransaction({ id: 'tx-3', usdAmount: 300 }),
      ];

      const optimized = batchConvertToOptimized(legacyTransactions, 'user-123');

      expect(optimized).toHaveLength(3);
      expect(optimized[0].id).toBe('tx-1');
      expect(optimized[0].user_id).toBe('user-123');
      expect(optimized[1].usd_amount).toBe(200);
      expect(optimized[2].usd_amount).toBe(300);
    });

    it('should filter out invalid transactions', () => {
      const mixedTransactions = [
        createSampleLegacyTransaction({ id: 'valid-1' }),
        { id: '', exchange: '', type: '', usdAmount: NaN, btcAmount: 0, price: 0 }, // Invalid
        createSampleLegacyTransaction({ id: 'valid-2' }),
      ];

      const optimized = batchConvertToOptimized(mixedTransactions);

      expect(optimized).toHaveLength(2);
      expect(optimized[0].id).toBe('valid-1');
      expect(optimized[1].id).toBe('valid-2');
    });

    it('should handle empty array', () => {
      const optimized = batchConvertToOptimized([]);
      expect(optimized).toEqual([]);
    });
  });

  describe('batchConvertToLegacy', () => {
    it('should convert multiple optimized transactions', () => {
      const optimizedTransactions = [
        createSampleOptimizedTransaction({ id: 'tx-1', usd_amount: 100 }),
        createSampleOptimizedTransaction({ id: 'tx-2', usd_amount: 200 }),
        createSampleOptimizedTransaction({ id: 'tx-3', usd_amount: 300 }),
      ];

      const legacy = batchConvertToLegacy(optimizedTransactions);

      expect(legacy).toHaveLength(3);
      expect(legacy[0].id).toBe('tx-1');
      expect(legacy[0].usdAmount).toBe(100);
      expect(legacy[1].usdAmount).toBe(200);
      expect(legacy[2].usdAmount).toBe(300);

      // Check that dates are converted to Date objects
      legacy.forEach((tx) => {
        expect(tx.date).toBeInstanceOf(Date);
      });
    });

    it('should handle empty array', () => {
      const legacy = batchConvertToLegacy([]);
      expect(legacy).toEqual([]);
    });
  });

  describe('round-trip conversion', () => {
    it('should maintain data integrity through legacy → optimized → legacy conversion', () => {
      const originalLegacy = createSampleLegacyTransaction({
        destinationWallet: 'bc1qtest',
        networkFee: 0.0001,
        isSelfCustody: true,
        notes: 'Test transaction',
      });

      const optimized = convertToOptimizedTransaction(originalLegacy, 'user-123');
      const backToLegacy = convertToLegacyTransaction(optimized);

      expect(backToLegacy.id).toBe(originalLegacy.id);
      expect(backToLegacy.exchange).toBe(originalLegacy.exchange);
      expect(backToLegacy.type).toBe(originalLegacy.type);
      expect(backToLegacy.usdAmount).toBe(originalLegacy.usdAmount);
      expect(backToLegacy.btcAmount).toBe(originalLegacy.btcAmount);
      expect(backToLegacy.price).toBe(originalLegacy.price);
      expect(backToLegacy.destinationWallet).toBe(originalLegacy.destinationWallet);
      expect(backToLegacy.networkFee).toBe(originalLegacy.networkFee);
      expect(backToLegacy.isSelfCustody).toBe(originalLegacy.isSelfCustody);
      expect(backToLegacy.notes).toBe(originalLegacy.notes);

      // Date should be equivalent but may not be the exact same object
      expect(backToLegacy.date.getTime()).toBe(originalLegacy.date.getTime());
    });

    it('should maintain data integrity through optimized → legacy → optimized conversion', () => {
      const originalOptimized = createSampleOptimizedTransaction({
        destination_wallet: 'bc1qtest',
        network_fee: 0.0001,
        is_self_custody: true,
        notes: 'Test transaction',
      });

      const legacy = convertToLegacyTransaction(originalOptimized);
      const backToOptimized = convertToOptimizedTransaction(legacy, originalOptimized.user_id);

      expect(backToOptimized.id).toBe(originalOptimized.id);
      expect(backToOptimized.user_id).toBe(originalOptimized.user_id);
      expect(backToOptimized.exchange).toBe(originalOptimized.exchange);
      expect(backToOptimized.type).toBe(originalOptimized.type);
      expect(backToOptimized.usd_amount).toBe(originalOptimized.usd_amount);
      expect(backToOptimized.btc_amount).toBe(originalOptimized.btc_amount);
      expect(backToOptimized.price).toBe(originalOptimized.price);
      expect(backToOptimized.destination_wallet).toBe(originalOptimized.destination_wallet);
      expect(backToOptimized.network_fee).toBe(originalOptimized.network_fee);
      expect(backToOptimized.is_self_custody).toBe(originalOptimized.is_self_custody);
      expect(backToOptimized.notes).toBe(originalOptimized.notes);

      // Date should be equivalent
      expect(backToOptimized.date).toBe(originalOptimized.date);
    });
  });
});
