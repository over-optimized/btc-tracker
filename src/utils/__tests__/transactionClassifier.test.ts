import { describe, test, expect, beforeEach } from 'vitest';
import { TransactionClassifier } from '../transactionClassifier';
import {
  TransactionClassification,
  UnclassifiedTransaction,
  ClassificationDecision,
} from '../../types/TransactionClassification';

// Type for accessing private methods in tests
interface TransactionClassifierWithPrivateMethods extends TransactionClassifier {
  validateClassificationDecision: (
    unclassified: UnclassifiedTransaction,
    decision: ClassificationDecision,
  ) => { isValid: boolean; reason?: string };
}

describe('TransactionClassifier - Enhanced Validation Logic', () => {
  let classifier: TransactionClassifier;
  let classifierWithPrivate: TransactionClassifierWithPrivateMethods;

  beforeEach(() => {
    classifier = new TransactionClassifier();
    classifierWithPrivate = classifier as TransactionClassifierWithPrivateMethods;
  });

  describe('validateClassificationDecision', () => {
    const createMockTransaction = (
      btcAmount: number,
      usdAmount: number,
      price?: number,
    ): UnclassifiedTransaction => ({
      id: 'test-tx-1',
      rawData: {},
      detectedType: 'test',
      exchange: 'test-exchange',
      date: new Date('2024-01-01'),
      btcAmount,
      usdAmount,
      price,
      confidence: 0.8,
      suggestedClassification: TransactionClassification.SKIP,
    });

    const createDecision = (
      classification: TransactionClassification,
      additionalData?: Partial<ClassificationDecision>,
    ): ClassificationDecision => ({
      transactionId: 'test-tx-1',
      classification,
      ...additionalData,
    });

    describe('Income Events - Positive BTC Required', () => {
      test('PURCHASE: should require positive BTC and USD/price', () => {
        // Valid purchase
        const validTx = createMockTransaction(0.001, 50);
        const validDecision = createDecision(TransactionClassification.PURCHASE);

        const validation = classifierWithPrivate.validateClassificationDecision(
          validTx,
          validDecision,
        );
        expect(validation.isValid).toBe(true);

        // Invalid: negative BTC
        const invalidTx1 = createMockTransaction(-0.001, 50);
        const validation1 = classifierWithPrivate.validateClassificationDecision(
          invalidTx1,
          validDecision,
        );
        expect(validation1.isValid).toBe(false);
        expect(validation1.reason).toContain('positive Bitcoin amount');

        // Invalid: no USD or price
        const invalidTx2 = createMockTransaction(0.001, 0);
        const validation2 = classifierWithPrivate.validateClassificationDecision(
          invalidTx2,
          validDecision,
        );
        expect(validation2.isValid).toBe(false);
        expect(validation2.reason).toContain('USD amount or valid price');
      });

      test('GIFT_RECEIVED: should require positive BTC and fair market value', () => {
        // Valid with usdValue
        const validTx = createMockTransaction(0.001, 0);
        const validDecision = createDecision(TransactionClassification.GIFT_RECEIVED, {
          usdValue: 50,
        });

        const validation = classifierWithPrivate.validateClassificationDecision(
          validTx,
          validDecision,
        );
        expect(validation.isValid).toBe(true);

        // Valid with price
        const validTxWithPrice = createMockTransaction(0.001, 0, 50000);
        const validDecisionWithPrice = createDecision(TransactionClassification.GIFT_RECEIVED);

        const validation2 = classifierWithPrivate.validateClassificationDecision(
          validTxWithPrice,
          validDecisionWithPrice,
        );
        expect(validation2.isValid).toBe(true);

        // Invalid: negative BTC
        const invalidTx1 = createMockTransaction(-0.001, 0);
        const validation3 = classifierWithPrivate.validateClassificationDecision(
          invalidTx1,
          validDecision,
        );
        expect(validation3.isValid).toBe(false);
        expect(validation3.reason).toContain('positive Bitcoin amount');

        // Invalid: no fair market value
        const invalidTx2 = createMockTransaction(0.001, 0);
        const invalidDecision = createDecision(TransactionClassification.GIFT_RECEIVED);
        const validation4 = classifierWithPrivate.validateClassificationDecision(
          invalidTx2,
          invalidDecision,
        );
        expect(validation4.isValid).toBe(false);
        expect(validation4.reason).toContain('fair market value');
        expect(validation4.reason).toContain('taxable income');
      });

      test('PAYMENT_RECEIVED: should require positive BTC and fair market value', () => {
        const validTx = createMockTransaction(0.001, 0);
        const validDecision = createDecision(TransactionClassification.PAYMENT_RECEIVED, {
          usdValue: 50,
        });

        const validation = classifierWithPrivate.validateClassificationDecision(
          validTx,
          validDecision,
        );
        expect(validation.isValid).toBe(true);

        // Invalid: no fair market value
        const invalidDecision = createDecision(TransactionClassification.PAYMENT_RECEIVED);
        const validation2 = classifierWithPrivate.validateClassificationDecision(
          validTx,
          invalidDecision,
        );
        expect(validation2.isValid).toBe(false);
        expect(validation2.reason).toContain('fair market value');
        expect(validation2.reason).toContain('taxable income');
      });

      test('MINING_INCOME: should require positive BTC and fair market value', () => {
        const validTx = createMockTransaction(0.000625, 0, 80000); // Mining reward with price
        const validDecision = createDecision(TransactionClassification.MINING_INCOME);

        const validation = classifierWithPrivate.validateClassificationDecision(
          validTx,
          validDecision,
        );
        expect(validation.isValid).toBe(true);

        // Invalid: negative BTC
        const invalidTx = createMockTransaction(-0.000625, 0);
        const validation2 = classifierWithPrivate.validateClassificationDecision(
          invalidTx,
          validDecision,
        );
        expect(validation2.isValid).toBe(false);
        expect(validation2.reason).toContain('positive Bitcoin amount');
      });

      test('STAKING_INCOME: should require positive BTC and fair market value', () => {
        const validTx = createMockTransaction(0.0001, 0);
        const validDecision = createDecision(TransactionClassification.STAKING_INCOME, {
          usdValue: 8,
        });

        const validation = classifierWithPrivate.validateClassificationDecision(
          validTx,
          validDecision,
        );
        expect(validation.isValid).toBe(true);

        // Invalid: no fair market value
        const invalidDecision = createDecision(TransactionClassification.STAKING_INCOME);
        const validation2 = classifierWithPrivate.validateClassificationDecision(
          validTx,
          invalidDecision,
        );
        expect(validation2.isValid).toBe(false);
        expect(validation2.reason).toContain('taxable income at time of receipt');
      });
    });

    describe('Disposal Events - Negative BTC Required', () => {
      test('SALE: should require negative BTC and positive USD proceeds', () => {
        // Valid sale
        const validTx = createMockTransaction(-0.001, 60);
        const validDecision = createDecision(TransactionClassification.SALE);

        const validation = classifierWithPrivate.validateClassificationDecision(
          validTx,
          validDecision,
        );
        expect(validation.isValid).toBe(true);

        // Valid with usdValue instead of usdAmount
        const validTx2 = createMockTransaction(-0.001, 0);
        const validDecision2 = createDecision(TransactionClassification.SALE, { usdValue: 60 });
        const validation2 = classifierWithPrivate.validateClassificationDecision(
          validTx2,
          validDecision2,
        );
        expect(validation2.isValid).toBe(true);

        // Invalid: positive BTC
        const invalidTx1 = createMockTransaction(0.001, 60);
        const validation3 = classifierWithPrivate.validateClassificationDecision(
          invalidTx1,
          validDecision,
        );
        expect(validation3.isValid).toBe(false);
        expect(validation3.reason).toContain('negative Bitcoin amount');

        // Invalid: no USD proceeds
        const invalidTx2 = createMockTransaction(-0.001, 0);
        const invalidDecision = createDecision(TransactionClassification.SALE);
        const validation4 = classifierWithPrivate.validateClassificationDecision(
          invalidTx2,
          invalidDecision,
        );
        expect(validation4.isValid).toBe(false);
        expect(validation4.reason).toContain('positive USD proceeds');
      });

      test('GIFT_SENT: should require negative BTC and fair market value', () => {
        const validTx = createMockTransaction(-0.001, 0);
        const validDecision = createDecision(TransactionClassification.GIFT_SENT, { usdValue: 50 });

        const validation = classifierWithPrivate.validateClassificationDecision(
          validTx,
          validDecision,
        );
        expect(validation.isValid).toBe(true);

        // Invalid: positive BTC
        const invalidTx = createMockTransaction(0.001, 0);
        const validation2 = classifierWithPrivate.validateClassificationDecision(
          invalidTx,
          validDecision,
        );
        expect(validation2.isValid).toBe(false);
        expect(validation2.reason).toContain('negative Bitcoin amount');

        // Invalid: no fair market value
        const invalidDecision = createDecision(TransactionClassification.GIFT_SENT);
        const validation3 = classifierWithPrivate.validateClassificationDecision(
          validTx,
          invalidDecision,
        );
        expect(validation3.isValid).toBe(false);
        expect(validation3.reason).toContain('owe tax on any gains since purchase');
      });

      test('PAYMENT_SENT: should require negative BTC and fair market value', () => {
        const validTx = createMockTransaction(-0.0001, 0, 80000); // Lightning payment
        const validDecision = createDecision(TransactionClassification.PAYMENT_SENT);

        const validation = classifierWithPrivate.validateClassificationDecision(
          validTx,
          validDecision,
        );
        expect(validation.isValid).toBe(true);

        // Invalid: no fair market value
        const invalidTx = createMockTransaction(-0.0001, 0);
        const invalidDecision = createDecision(TransactionClassification.PAYMENT_SENT);
        const validation2 = classifierWithPrivate.validateClassificationDecision(
          invalidTx,
          invalidDecision,
        );
        expect(validation2.isValid).toBe(false);
        expect(validation2.reason).toContain('taxable capital gains/losses');
      });
    });

    describe('Non-Taxable Movements', () => {
      test('SELF_CUSTODY_WITHDRAWAL: should require negative BTC and no USD amounts', () => {
        // Valid withdrawal
        const validTx = createMockTransaction(-0.01, 0);
        const validDecision = createDecision(TransactionClassification.SELF_CUSTODY_WITHDRAWAL);

        const validation = classifierWithPrivate.validateClassificationDecision(
          validTx,
          validDecision,
        );
        expect(validation.isValid).toBe(true);

        // Invalid: positive BTC
        const invalidTx1 = createMockTransaction(0.01, 0);
        const validation2 = classifierWithPrivate.validateClassificationDecision(
          invalidTx1,
          validDecision,
        );
        expect(validation2.isValid).toBe(false);
        expect(validation2.reason).toContain('negative Bitcoin amount');

        // Invalid: USD amount present
        const invalidTx2 = createMockTransaction(-0.01, 50);
        const validation3 = classifierWithPrivate.validateClassificationDecision(
          invalidTx2,
          validDecision,
        );
        expect(validation3.isValid).toBe(false);
        expect(validation3.reason).toContain('should not have USD amounts');
        expect(validation3.reason).toContain('you still own the Bitcoin');
      });

      test('EXCHANGE_TRANSFER: should require negative BTC and no USD amounts', () => {
        const validTx = createMockTransaction(-0.01, 0);
        const validDecision = createDecision(TransactionClassification.EXCHANGE_TRANSFER);

        const validation = classifierWithPrivate.validateClassificationDecision(
          validTx,
          validDecision,
        );
        expect(validation.isValid).toBe(true);

        // Invalid: USD amount present
        const invalidTx = createMockTransaction(-0.01, 50);
        const validation2 = classifierWithPrivate.validateClassificationDecision(
          invalidTx,
          validDecision,
        );
        expect(validation2.isValid).toBe(false);
        expect(validation2.reason).toContain('moving Bitcoin between exchanges');
      });

      test('SKIP: should always be valid', () => {
        const tx1 = createMockTransaction(0.001, 50);
        const tx2 = createMockTransaction(-0.001, 0);
        const tx3 = createMockTransaction(0, 0);
        const decision = createDecision(TransactionClassification.SKIP);

        expect(classifierWithPrivate.validateClassificationDecision(tx1, decision).isValid).toBe(
          true,
        );
        expect(classifierWithPrivate.validateClassificationDecision(tx2, decision).isValid).toBe(
          true,
        );
        expect(classifierWithPrivate.validateClassificationDecision(tx3, decision).isValid).toBe(
          true,
        );
      });
    });

    describe('General Validation Rules', () => {
      test('should reject zero BTC amounts except for SKIP', () => {
        const zeroBtcTx = createMockTransaction(0, 50);
        const nonSkipDecision = createDecision(TransactionClassification.PURCHASE);

        const validation = classifierWithPrivate.validateClassificationDecision(
          zeroBtcTx,
          nonSkipDecision,
        );
        expect(validation.isValid).toBe(false);
        expect(validation.reason).toContain('Transaction requires Bitcoin movement');
      });

      test('should handle unknown classification types', () => {
        const tx = createMockTransaction(0.001, 50);
        const invalidDecision = createDecision('UNKNOWN_TYPE' as TransactionClassification);

        const validation = classifierWithPrivate.validateClassificationDecision(
          tx,
          invalidDecision,
        );
        expect(validation.isValid).toBe(false);
        expect(validation.reason).toContain('Unknown classification type');
      });
    });
  });

  describe('applyClassification', () => {
    const createMockTransaction = (
      btcAmount: number,
      usdAmount: number,
      price?: number,
    ): UnclassifiedTransaction => ({
      id: 'test-tx-1',
      rawData: {},
      detectedType: 'test',
      exchange: 'test-exchange',
      date: new Date('2024-01-01'),
      btcAmount,
      usdAmount,
      price,
      confidence: 0.8,
      suggestedClassification: TransactionClassification.SKIP,
    });

    test('should create proper transaction objects for income events', () => {
      const tx = createMockTransaction(0.001, 0);
      const decision: ClassificationDecision = {
        transactionId: 'test-tx-1',
        classification: TransactionClassification.GIFT_RECEIVED,
        usdValue: 50,
        counterparty: 'Friend',
      };

      const result = classifier.applyClassification(tx, decision);

      expect(result).not.toBeNull();
      expect(result!.type).toBe('Gift Received');
      expect(result!.isTaxable).toBe(true);
      expect(result!.usdAmount).toBe(50);
      expect(result!.counterparty).toBe('Friend');
      expect(result!.price).toBe(50000); // 50 / 0.001
    });

    test('should create proper transaction objects for disposal events', () => {
      const tx = createMockTransaction(-0.001, 0);
      const decision: ClassificationDecision = {
        transactionId: 'test-tx-1',
        classification: TransactionClassification.PAYMENT_SENT,
        usdValue: 8,
        counterparty: 'Coffee Shop',
        goodsServices: 'Coffee',
      };

      const result = classifier.applyClassification(tx, decision);

      expect(result).not.toBeNull();
      expect(result!.type).toBe('Payment Sent');
      expect(result!.isTaxable).toBe(true);
      expect(result!.usdAmount).toBe(8);
      expect(result!.counterparty).toBe('Coffee Shop');
      expect(result!.goodsServices).toBe('Coffee');
      expect(result!.price).toBe(8000); // 8 / 0.001
    });

    test('should return null for invalid classifications', () => {
      const tx = createMockTransaction(0.001, 50); // Positive BTC
      const invalidDecision: ClassificationDecision = {
        transactionId: 'test-tx-1',
        classification: TransactionClassification.SALE, // Requires negative BTC
      };

      const result = classifier.applyClassification(tx, invalidDecision);
      expect(result).toBeNull();
    });

    test('should handle SKIP classification correctly', () => {
      const tx = createMockTransaction(0.001, 50);
      const decision: ClassificationDecision = {
        transactionId: 'test-tx-1',
        classification: TransactionClassification.SKIP,
      };

      const result = classifier.applyClassification(tx, decision);
      expect(result).toBeNull(); // SKIP should return null (don't create transaction)
    });
  });

  describe('getAvailableClassifications - Feature Flag Integration', () => {
    const createMockTransaction = (
      btcAmount: number,
      usdAmount: number,
      price?: number,
    ): UnclassifiedTransaction => ({
      id: 'test-tx-1',
      rawData: {},
      detectedType: 'test',
      exchange: 'test-exchange',
      date: new Date('2024-01-01'),
      btcAmount,
      usdAmount,
      price,
      confidence: 0.8,
      suggestedClassification: TransactionClassification.SKIP,
    });

    describe('4-option system (expandedClassifications: false)', () => {
      test('should return basic classifications for positive BTC with USD', () => {
        const tx = createMockTransaction(0.001, 50);
        const result = classifier.getAvailableClassifications(tx, {
          expandedClassifications: false,
        });

        expect(result.available).toContain(TransactionClassification.PURCHASE);
        expect(result.available).toContain(TransactionClassification.SKIP);

        // SELF_CUSTODY_WITHDRAWAL should NOT be available for positive BTC (incoming)
        expect(result.available).not.toContain(TransactionClassification.SELF_CUSTODY_WITHDRAWAL);

        // Should NOT contain expanded classifications
        expect(result.available).not.toContain(TransactionClassification.GIFT_RECEIVED);
        expect(result.available).not.toContain(TransactionClassification.PAYMENT_RECEIVED);
        expect(result.available).not.toContain(TransactionClassification.MINING_INCOME);
        expect(result.available).not.toContain(TransactionClassification.STAKING_INCOME);
        expect(result.available).not.toContain(TransactionClassification.EXCHANGE_TRANSFER);
      });

      test('should return basic classifications for negative BTC with USD', () => {
        const tx = createMockTransaction(-0.001, 50);
        const result = classifier.getAvailableClassifications(tx, {
          expandedClassifications: false,
        });

        expect(result.available).toContain(TransactionClassification.SALE);
        expect(result.available).toContain(TransactionClassification.SELF_CUSTODY_WITHDRAWAL);
        expect(result.available).toContain(TransactionClassification.SKIP);

        // Should NOT contain expanded classifications
        expect(result.available).not.toContain(TransactionClassification.GIFT_SENT);
        expect(result.available).not.toContain(TransactionClassification.PAYMENT_SENT);
        expect(result.available).not.toContain(TransactionClassification.EXCHANGE_TRANSFER);
      });
    });

    describe('12-option system (expandedClassifications: true)', () => {
      test('should return all income classifications for positive BTC with USD', () => {
        const tx = createMockTransaction(0.001, 50);
        const result = classifier.getAvailableClassifications(tx, {
          expandedClassifications: true,
        });

        // Basic classifications
        expect(result.available).toContain(TransactionClassification.PURCHASE);
        expect(result.available).toContain(TransactionClassification.SKIP);

        // Expanded income classifications
        expect(result.available).toContain(TransactionClassification.GIFT_RECEIVED);
        expect(result.available).toContain(TransactionClassification.PAYMENT_RECEIVED);
        expect(result.available).toContain(TransactionClassification.REIMBURSEMENT_RECEIVED);
        expect(result.available).toContain(TransactionClassification.MINING_INCOME);
        expect(result.available).toContain(TransactionClassification.STAKING_INCOME);
      });

      test('should return all disposal classifications for negative BTC with USD', () => {
        const tx = createMockTransaction(-0.001, 50);
        const result = classifier.getAvailableClassifications(tx, {
          expandedClassifications: true,
        });

        // Basic classifications
        expect(result.available).toContain(TransactionClassification.SALE);
        expect(result.available).toContain(TransactionClassification.SELF_CUSTODY_WITHDRAWAL);
        expect(result.available).toContain(TransactionClassification.SKIP);

        // Expanded disposal classifications
        expect(result.available).toContain(TransactionClassification.GIFT_SENT);
        expect(result.available).toContain(TransactionClassification.PAYMENT_SENT);

        // Expanded non-taxable classifications
        expect(result.available).toContain(TransactionClassification.EXCHANGE_TRANSFER);
      });

      test('should allow disposal events for negative BTC without USD (Lightning payments)', () => {
        const tx = createMockTransaction(-0.0001, 0, 80000); // Lightning payment
        const result = classifier.getAvailableClassifications(tx, {
          expandedClassifications: true,
        });

        // Should allow disposal events that accept fair market value
        expect(result.available).toContain(TransactionClassification.GIFT_SENT);
        expect(result.available).toContain(TransactionClassification.PAYMENT_SENT);
        expect(result.available).toContain(TransactionClassification.SELF_CUSTODY_WITHDRAWAL);
        expect(result.available).toContain(TransactionClassification.EXCHANGE_TRANSFER);

        // Should disable SALE since it requires USD proceeds
        expect(
          result.disabled.find((d) => d.classification === TransactionClassification.SALE),
        ).toBeDefined();
        expect(
          result.disabled.find((d) => d.classification === TransactionClassification.SALE)?.reason,
        ).toContain('positive USD proceeds');
      });

      test('should allow expanded income classifications for positive BTC without USD (Lightning/manual entry)', () => {
        const tx = createMockTransaction(0.001, 0); // Positive BTC, no USD/price (like Lightning receive)
        const result = classifier.getAvailableClassifications(tx, {
          expandedClassifications: true,
        });

        // Should allow expanded income classifications (user can provide fair market value manually)
        expect(result.available).toContain(TransactionClassification.GIFT_RECEIVED);
        expect(result.available).toContain(TransactionClassification.PAYMENT_RECEIVED);
        expect(result.available).toContain(TransactionClassification.MINING_INCOME);
        expect(result.available).toContain(TransactionClassification.STAKING_INCOME);
        expect(result.available).toContain(TransactionClassification.SKIP);

        // PURCHASE should be disabled (requires USD/price for direct cost basis)
        const disabledTypes = result.disabled.map((d) => d.classification);
        expect(disabledTypes).toContain(TransactionClassification.PURCHASE);

        const purchaseDisabled = result.disabled.find(
          (d) => d.classification === TransactionClassification.PURCHASE,
        );
        expect(purchaseDisabled?.reason).toContain('USD amount or price to establish cost basis');
      });
    });

    describe('default behavior', () => {
      test('should default to 4-option system when no options provided', () => {
        const tx = createMockTransaction(0.001, 50);
        const result = classifier.getAvailableClassifications(tx);

        expect(result.available).toContain(TransactionClassification.PURCHASE);
        expect(result.available).not.toContain(TransactionClassification.GIFT_RECEIVED);
        expect(result.available).not.toContain(TransactionClassification.PAYMENT_RECEIVED);
      });

      test('should default to false when expandedClassifications not specified', () => {
        const tx = createMockTransaction(0.001, 50);
        const result = classifier.getAvailableClassifications(tx, {});

        expect(result.available).toContain(TransactionClassification.PURCHASE);
        expect(result.available).not.toContain(TransactionClassification.GIFT_RECEIVED);
      });
    });
  });
});
