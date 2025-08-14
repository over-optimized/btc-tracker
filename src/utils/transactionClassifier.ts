/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO: Replace 'any' types with proper TypeScript interfaces for CSV data and classification logic
// This file handles dynamic CSV parsing and needs careful type analysis

import {
  UnclassifiedTransaction,
  TransactionClassification,
  TransactionClassificationResult,
  ClassificationDecision,
  TRANSACTION_TYPE_PATTERNS,
  AMOUNT_PATTERN_HEURISTICS,
  ClassificationPrompt,
} from '../types/TransactionClassification';
import { Transaction } from '../types/Transaction';
import { generateStableTransactionId } from './generateTransactionId';

export class TransactionClassifier {
  /**
   * Classify raw transaction data from CSV parsing
   */
  classifyTransactions(
    rawTransactions: Array<{
      rawData: any;
      exchange: string;
    }>,
  ): TransactionClassificationResult {
    const classified: Transaction[] = [];
    const needsClassification: UnclassifiedTransaction[] = [];
    const skipped: UnclassifiedTransaction[] = [];
    const errors: Array<{ transaction: UnclassifiedTransaction; error: string }> = [];

    for (const rawTx of rawTransactions) {
      try {
        const unclassified = this.parseRawTransaction(rawTx.rawData, rawTx.exchange);

        if (!unclassified) {
          // Skip invalid transactions
          continue;
        }

        // Try automatic classification
        const autoClassification = this.attemptAutoClassification(unclassified);

        if (autoClassification.confidence >= 0.9) {
          // High confidence - auto-classify
          const transaction = this.applyClassification(unclassified, {
            transactionId: unclassified.id,
            classification: autoClassification.classification,
          });

          if (transaction) {
            classified.push(transaction);
          }
        } else {
          // Low confidence - needs user input, but set suggested classification
          unclassified.suggestedClassification = autoClassification.classification;
          unclassified.confidence = autoClassification.confidence;
          needsClassification.push(unclassified);
        }
      } catch (error) {
        console.error('Error classifying transaction:', error);
        // Add to errors if we can parse enough info
      }
    }

    return {
      classified,
      needsClassification,
      skipped,
      errors,
    };
  }

  /**
   * Parse raw CSV data into unclassified transaction
   */
  private parseRawTransaction(rawData: any, exchange: string): UnclassifiedTransaction | null {
    // Extract basic fields (exchange-specific logic could be added here)
    const date = this.parseDate(rawData);
    const detectedType = this.extractTransactionType(rawData);
    const btcAmount = this.extractBtcAmount(rawData);
    const usdAmount = this.extractUsdAmount(rawData);
    const price = this.extractPrice(rawData, btcAmount, usdAmount);

    // Skip invalid transactions
    if (!date || !detectedType || btcAmount === 0) {
      return null;
    }

    // Generate temporary ID
    const id = generateStableTransactionId({
      exchange,
      date,
      usdAmount: Math.abs(usdAmount),
      btcAmount: Math.abs(btcAmount),
      type: detectedType,
      price: price || 0,
    });

    const unclassified: UnclassifiedTransaction = {
      id,
      rawData,
      detectedType,
      exchange,
      date,
      btcAmount,
      usdAmount,
      price,
      confidence: 0, // Will be set by classification
      suggestedClassification: TransactionClassification.SKIP, // Will be set by classification
      destinationAddress: this.extractDestinationAddress(rawData),
      txHash: this.extractTxHash(rawData),
    };

    return unclassified;
  }

  /**
   * Attempt to automatically classify a transaction
   */
  private attemptAutoClassification(tx: UnclassifiedTransaction): {
    classification: TransactionClassification;
    confidence: number;
    reason: string;
  } {
    const type = tx.detectedType.toLowerCase();
    const amount = Math.abs(tx.btcAmount);

    // High confidence purchases
    if (this.matchesPatterns(type, TRANSACTION_TYPE_PATTERNS.purchases) && tx.btcAmount > 0) {
      return {
        classification: TransactionClassification.PURCHASE,
        confidence: 0.95,
        reason: `Transaction type "${tx.detectedType}" matches purchase patterns`,
      };
    }

    // High confidence deposits/receives (positive BTC, could be from external source)
    if (this.matchesPatterns(type, TRANSACTION_TYPE_PATTERNS.deposits) && tx.btcAmount > 0) {
      // If there's a USD value, it's likely a purchase, otherwise could be a receive
      if (tx.usdAmount > 0) {
        return {
          classification: TransactionClassification.PURCHASE,
          confidence: 0.9,
          reason: `Receive transaction with USD value - likely a purchase`,
        };
      } else {
        // No USD value - could be receiving Bitcoin from external wallet
        // For now, classify as purchase but with lower confidence for user confirmation
        return {
          classification: TransactionClassification.PURCHASE,
          confidence: 0.6,
          reason: `Receive transaction without USD value - needs user confirmation`,
        };
      }
    }

    // High confidence sales (negative BTC, positive USD)
    if (
      this.matchesPatterns(type, TRANSACTION_TYPE_PATTERNS.sales) &&
      tx.btcAmount < 0 &&
      tx.usdAmount > 0
    ) {
      return {
        classification: TransactionClassification.SALE,
        confidence: 0.9,
        reason: `Transaction type "${tx.detectedType}" matches sale patterns with USD proceeds`,
      };
    }

    // High confidence withdrawals (negative BTC, no/minimal USD)
    if (
      this.matchesPatterns(type, TRANSACTION_TYPE_PATTERNS.withdrawals) &&
      tx.btcAmount < 0 &&
      tx.usdAmount <= 0
    ) {
      // Check if amount matches common self-custody patterns
      const isSelfCustodyAmount = this.isCommonSelfCustodyAmount(amount);
      // Check if it has a destination address (strong indicator of self-custody)
      const hasDestinationAddress = tx.destinationAddress && tx.destinationAddress.length > 10;

      let confidence = 0.7; // Base confidence
      if (isSelfCustodyAmount) confidence = 0.85;
      if (hasDestinationAddress) confidence = Math.max(confidence, 0.9); // Boost confidence for destination address

      return {
        classification: TransactionClassification.SELF_CUSTODY_WITHDRAWAL,
        confidence,
        reason: `Withdrawal pattern detected${isSelfCustodyAmount ? ' with common self-custody amount' : ''}${hasDestinationAddress ? ' to external address' : ''}`,
      };
    }

    // Medium confidence transfers
    if (this.matchesPatterns(type, TRANSACTION_TYPE_PATTERNS.transfers)) {
      return {
        classification: TransactionClassification.EXCHANGE_TRANSFER,
        confidence: 0.6,
        reason: `Transaction type "${tx.detectedType}" suggests transfer between platforms`,
      };
    }

    // Low confidence - needs user input
    return {
      classification: TransactionClassification.SKIP,
      confidence: 0.1,
      reason: `Unable to automatically classify transaction type "${tx.detectedType}"`,
    };
  }

  /**
   * Get available classification options for a transaction based on its data
   */
  getAvailableClassifications(unclassified: UnclassifiedTransaction): {
    available: TransactionClassification[];
    disabled: Array<{ classification: TransactionClassification; reason: string }>;
  } {
    const { btcAmount, usdAmount, price } = unclassified;
    const available: TransactionClassification[] = [];
    const disabled: Array<{ classification: TransactionClassification; reason: string }> = [];

    // Always allow SKIP
    available.push(TransactionClassification.SKIP);

    // Check PURCHASE (positive BTC + USD/price required)
    if (btcAmount > 0 && (usdAmount > 0 || (price && price > 0))) {
      available.push(TransactionClassification.PURCHASE);
      available.push(TransactionClassification.GIFT_RECEIVED);
      available.push(TransactionClassification.PAYMENT_RECEIVED);
      available.push(TransactionClassification.REIMBURSEMENT_RECEIVED);
      available.push(TransactionClassification.MINING_INCOME);
      available.push(TransactionClassification.STAKING_INCOME);
    } else {
      disabled.push({
        classification: TransactionClassification.PURCHASE,
        reason:
          btcAmount <= 0
            ? 'Bitcoin amount must be positive for acquisitions'
            : 'USD amount or price required for purchases',
      });
    }

    // Check SALE (negative BTC + positive USD required)
    if (btcAmount < 0 && usdAmount > 0) {
      available.push(TransactionClassification.SALE);
      available.push(TransactionClassification.GIFT_SENT);
      available.push(TransactionClassification.PAYMENT_SENT);
    } else {
      disabled.push({
        classification: TransactionClassification.SALE,
        reason:
          btcAmount >= 0
            ? 'Bitcoin amount must be negative (outgoing) for sales'
            : 'USD proceeds required for sales',
      });
    }

    // Check WITHDRAWALS (negative BTC, no USD required)
    if (btcAmount < 0) {
      available.push(TransactionClassification.SELF_CUSTODY_WITHDRAWAL);
      available.push(TransactionClassification.EXCHANGE_TRANSFER);
    } else {
      disabled.push({
        classification: TransactionClassification.SELF_CUSTODY_WITHDRAWAL,
        reason: 'Bitcoin amount must be negative (outgoing) for withdrawals',
      });
    }

    return { available, disabled };
  }

  /**
   * Validate that a classification decision is logically possible for the transaction data
   */
  private validateClassificationDecision(
    unclassified: UnclassifiedTransaction,
    decision: ClassificationDecision,
  ): { isValid: boolean; reason?: string } {
    const { btcAmount, usdAmount, price } = unclassified;
    const { classification } = decision;

    console.log(`🔍 Validating classification decision:`, {
      btcAmount,
      usdAmount,
      price,
      classification,
      detectedType: unclassified.detectedType,
    });

    // Purchases require positive BTC and non-zero USD/price (USD can be negative for outflows)
    if (classification === TransactionClassification.PURCHASE) {
      if (btcAmount <= 0) {
        console.log(`❌ Validation FAILED: Purchase with negative/zero BTC amount (${btcAmount})`);
        return { isValid: false, reason: 'Purchases require positive Bitcoin amount' };
      }
      if (usdAmount === 0 && (!price || price <= 0)) {
        console.log(
          `❌ Validation FAILED: Purchase with no USD amount (${usdAmount}) or price (${price})`,
        );
        return { isValid: false, reason: 'Purchases require USD amount or valid price' };
      }
      console.log(`✅ Purchase validation passed`);
    }

    // Sales require negative BTC (outgoing) and positive USD
    if (classification === TransactionClassification.SALE) {
      if (btcAmount >= 0) {
        return { isValid: false, reason: 'Sales require negative Bitcoin amount (outgoing)' };
      }
      if (usdAmount <= 0) {
        return { isValid: false, reason: 'Sales require positive USD proceeds' };
      }
    }

    // Withdrawals should have negative BTC and no/minimal USD
    if (classification === TransactionClassification.SELF_CUSTODY_WITHDRAWAL) {
      if (btcAmount >= 0) {
        return { isValid: false, reason: 'Withdrawals require negative Bitcoin amount (outgoing)' };
      }
    }

    // Transfers should have no USD component
    if (classification === TransactionClassification.EXCHANGE_TRANSFER) {
      if (usdAmount > 0) {
        return { isValid: false, reason: 'Exchange transfers should not have USD amounts' };
      }
    }

    // All classifications except SKIP require non-zero BTC
    if (classification !== TransactionClassification.SKIP && btcAmount === 0) {
      return { isValid: false, reason: 'Transaction requires Bitcoin movement' };
    }

    console.log(`✅ Validation PASSED for classification: ${classification}`);
    return { isValid: true };
  }

  /**
   * Apply user classification decision to create final transaction
   */
  applyClassification(
    unclassified: UnclassifiedTransaction,
    decision: ClassificationDecision,
  ): Transaction | null {
    // Validate the classification decision first
    const validation = this.validateClassificationDecision(unclassified, decision);
    if (!validation.isValid) {
      console.error(`Invalid classification decision: ${validation.reason}`, {
        transaction: unclassified,
        decision,
      });
      return null; // Reject invalid classification
    }

    const baseTransaction = {
      id: unclassified.id,
      date: unclassified.date,
      exchange: unclassified.exchange,
      usdAmount: Math.abs(unclassified.usdAmount),
      btcAmount: Math.abs(unclassified.btcAmount),
      price: unclassified.price || 0,
      notes: decision.notes,
    };

    switch (decision.classification) {
      case TransactionClassification.PURCHASE:
        return {
          ...baseTransaction,
          type: 'Purchase',
          isTaxable: true,
        };

      case TransactionClassification.SELF_CUSTODY_WITHDRAWAL:
        return {
          ...baseTransaction,
          type: 'Withdrawal',
          isSelfCustody: true,
          isTaxable: false,
          destinationWallet: decision.destinationWallet || 'Self-Custody Wallet',
          usdAmount: 0, // Withdrawals don't have USD value
        };

      case TransactionClassification.SALE:
        return {
          ...baseTransaction,
          type: 'Sale',
          isTaxable: true,
          price: decision.salePrice || unclassified.price || 0,
        };

      case TransactionClassification.EXCHANGE_TRANSFER:
        return {
          ...baseTransaction,
          type: 'Transfer',
          isTaxable: false,
          destinationWallet: decision.transferExchange || 'Another Exchange',
          usdAmount: 0, // Transfers don't have USD value
        };

      case TransactionClassification.SKIP:
        return null; // Don't create transaction

      default:
        return null;
    }
  }

  /**
   * Generate classification prompts for user
   */
  generateClassificationPrompts(
    needsClassification: UnclassifiedTransaction[],
  ): ClassificationPrompt[] {
    const prompts: ClassificationPrompt[] = [];

    // Group by transaction type patterns
    const withdrawals = needsClassification.filter((tx) =>
      this.matchesPatterns(tx.detectedType.toLowerCase(), TRANSACTION_TYPE_PATTERNS.withdrawals),
    );

    const sales = needsClassification.filter((tx) =>
      this.matchesPatterns(tx.detectedType.toLowerCase(), TRANSACTION_TYPE_PATTERNS.sales),
    );

    const unknown = needsClassification.filter(
      (tx) => !withdrawals.includes(tx) && !sales.includes(tx),
    );

    // Withdrawal prompt
    if (withdrawals.length > 0) {
      prompts.push({
        title: 'Outgoing Bitcoin Transactions Detected',
        message: `We found ${withdrawals.length} outgoing Bitcoin transaction(s). Please classify each one:`,
        transactions: withdrawals,
        bulkActions: [
          {
            label: 'Mark All as Self-Custody',
            classification: TransactionClassification.SELF_CUSTODY_WITHDRAWAL,
            condition: (tx) => this.isCommonSelfCustodyAmount(Math.abs(tx.btcAmount)),
          },
          {
            label: 'Mark All as Exchange Transfers',
            classification: TransactionClassification.EXCHANGE_TRANSFER,
          },
        ],
      });
    }

    // Sale prompt
    if (sales.length > 0) {
      prompts.push({
        title: 'Potential Sales Detected',
        message: `We found ${sales.length} potential sale transaction(s). Please confirm:`,
        transactions: sales,
        bulkActions: [
          {
            label: 'Mark All as Sales',
            classification: TransactionClassification.SALE,
          },
        ],
      });
    }

    // Unknown transactions
    if (unknown.length > 0) {
      prompts.push({
        title: 'Unknown Transactions',
        message: `We found ${unknown.length} transaction(s) that need classification:`,
        transactions: unknown,
      });
    }

    return prompts;
  }

  // Helper methods
  private parseDate(rawData: any): Date | null {
    const dateFields = ['Date & Time (UTC)', 'Timestamp', 'Date', 'date', 'time', 'Time'];

    for (const field of dateFields) {
      if (rawData[field]) {
        const date = new Date(rawData[field]);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    return null;
  }

  private extractTransactionType(rawData: any): string {
    return (
      rawData['Transaction Type'] ||
      rawData['Type'] ||
      rawData['type'] ||
      rawData['Action'] ||
      'Unknown'
    );
  }

  private extractBtcAmount(rawData: any): number {
    const btcFields = [
      'Amount BTC',
      'Amount (BTC)',
      'BTC Amount',
      'Volume',
      'vol',
      'Quantity',
      'Bitcoin',
    ];

    for (const field of btcFields) {
      if (rawData[field]) {
        const amount = parseFloat(rawData[field]);
        if (!isNaN(amount)) {
          return amount; // Keep sign (negative for outgoing)
        }
      }
    }

    return 0;
  }

  private extractUsdAmount(rawData: any): number {
    const usdFields = [
      'Amount USD',
      'Amount (USD)',
      'USD Amount',
      'Total',
      'Cost',
      'Value',
      'Subtotal',
    ];

    for (const field of usdFields) {
      if (rawData[field]) {
        const amount = parseFloat(rawData[field]);
        if (!isNaN(amount)) {
          return Math.abs(amount); // Always positive for consistency
        }
      }
    }

    return 0;
  }

  private extractPrice(rawData: any, btcAmount: number, usdAmount: number): number | undefined {
    const priceFields = ['BTC Price', 'Price', 'Rate', 'Exchange Rate', 'Unit Price'];

    for (const field of priceFields) {
      if (rawData[field]) {
        const price = parseFloat(rawData[field]);
        if (!isNaN(price) && price > 0) {
          return price;
        }
      }
    }

    // Calculate price from amounts if available
    if (btcAmount !== 0 && usdAmount > 0) {
      return usdAmount / Math.abs(btcAmount);
    }

    return undefined;
  }

  private extractDestinationAddress(rawData: any): string | undefined {
    const addressFields = ['Address', 'Destination', 'To Address', 'Recipient', 'To'];

    for (const field of addressFields) {
      if (rawData[field] && typeof rawData[field] === 'string') {
        return rawData[field];
      }
    }

    return undefined;
  }

  private extractTxHash(rawData: any): string | undefined {
    const hashFields = ['Transaction Hash', 'Hash', 'TX Hash', 'TXID', 'Transaction ID'];

    for (const field of hashFields) {
      if (rawData[field] && typeof rawData[field] === 'string') {
        return rawData[field];
      }
    }

    return undefined;
  }

  private matchesPatterns(text: string, patterns: string[]): boolean {
    const lowerText = text.toLowerCase();
    return patterns.some((pattern) => lowerText.includes(pattern.toLowerCase()));
  }

  private isCommonSelfCustodyAmount(btcAmount: number): boolean {
    return AMOUNT_PATTERN_HEURISTICS.selfCustodyAmounts.some(
      (commonAmount) =>
        Math.abs(btcAmount - commonAmount) <=
        commonAmount * AMOUNT_PATTERN_HEURISTICS.amountTolerance,
    );
  }
}
