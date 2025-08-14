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
   * Supports feature flag filtering for 4-option vs 12-option display
   */
  getAvailableClassifications(
    unclassified: UnclassifiedTransaction,
    options: { expandedClassifications?: boolean } = {},
  ): {
    available: TransactionClassification[];
    disabled: Array<{ classification: TransactionClassification; reason: string }>;
  } {
    const { btcAmount, usdAmount, price } = unclassified;
    const { expandedClassifications = false } = options;
    const available: TransactionClassification[] = [];
    const disabled: Array<{ classification: TransactionClassification; reason: string }> = [];

    // Always allow SKIP
    available.push(TransactionClassification.SKIP);

    // INCOME EVENTS - Positive BTC required
    if (btcAmount > 0 && (usdAmount > 0 || (price && price > 0))) {
      // Core 4-option system: always include PURCHASE
      available.push(TransactionClassification.PURCHASE);

      // Extended 12-option system: add specialized income types
      if (expandedClassifications) {
        available.push(TransactionClassification.GIFT_RECEIVED);
        available.push(TransactionClassification.PAYMENT_RECEIVED);
        available.push(TransactionClassification.REIMBURSEMENT_RECEIVED);
        available.push(TransactionClassification.MINING_INCOME);
        available.push(TransactionClassification.STAKING_INCOME);
      }
    } else {
      // Provide detailed reasons for why income events are disabled
      const baseReason =
        btcAmount <= 0
          ? 'Bitcoin amount must be positive for acquisitions'
          : 'USD amount or price required for purchases';

      disabled.push({
        classification: TransactionClassification.PURCHASE,
        reason: baseReason,
      });

      if (expandedClassifications) {
        disabled.push({
          classification: TransactionClassification.GIFT_RECEIVED,
          reason: 'Bitcoin gifts received require positive Bitcoin amount and fair market value',
        });
        disabled.push({
          classification: TransactionClassification.PAYMENT_RECEIVED,
          reason: 'Bitcoin payments received require positive Bitcoin amount and fair market value',
        });
        disabled.push({
          classification: TransactionClassification.REIMBURSEMENT_RECEIVED,
          reason: 'Bitcoin reimbursements require positive Bitcoin amount and fair market value',
        });
        disabled.push({
          classification: TransactionClassification.MINING_INCOME,
          reason: 'Mining rewards require positive Bitcoin amount and fair market value',
        });
        disabled.push({
          classification: TransactionClassification.STAKING_INCOME,
          reason: 'Staking rewards require positive Bitcoin amount and fair market value',
        });
      }
    }

    // DISPOSAL EVENTS - Negative BTC required
    if (btcAmount < 0 && usdAmount > 0) {
      // Core 4-option system: always include SALE
      available.push(TransactionClassification.SALE);

      // Extended 12-option system: add specialized disposal types
      if (expandedClassifications) {
        available.push(TransactionClassification.GIFT_SENT);
        available.push(TransactionClassification.PAYMENT_SENT);
      }
    } else if (btcAmount < 0 && expandedClassifications) {
      // Special case: negative BTC but no USD - allow disposal events that don't require USD proceeds
      // (these will need fair market value provided by user)
      available.push(TransactionClassification.GIFT_SENT);
      available.push(TransactionClassification.PAYMENT_SENT);

      // Still disable SALE since it specifically requires USD proceeds from exchange
      disabled.push({
        classification: TransactionClassification.SALE,
        reason: 'Sales require positive USD proceeds to calculate capital gains/losses',
      });
    } else {
      // Positive BTC or other invalid combinations
      const baseReason =
        btcAmount >= 0
          ? 'Bitcoin amount must be negative (outgoing) for sales'
          : 'USD proceeds required for sales';

      disabled.push({
        classification: TransactionClassification.SALE,
        reason: baseReason,
      });

      if (expandedClassifications) {
        disabled.push({
          classification: TransactionClassification.GIFT_SENT,
          reason: 'Bitcoin gifts sent require negative Bitcoin amount (outgoing)',
        });
        disabled.push({
          classification: TransactionClassification.PAYMENT_SENT,
          reason: 'Bitcoin payments sent require negative Bitcoin amount (outgoing)',
        });
      }
    }

    // NON-TAXABLE MOVEMENTS - Negative BTC required
    if (btcAmount < 0) {
      // Core 4-option system: always include SELF_CUSTODY_WITHDRAWAL
      available.push(TransactionClassification.SELF_CUSTODY_WITHDRAWAL);

      // Extended 12-option system: add EXCHANGE_TRANSFER
      if (expandedClassifications) {
        available.push(TransactionClassification.EXCHANGE_TRANSFER);
      }
    } else {
      disabled.push({
        classification: TransactionClassification.SELF_CUSTODY_WITHDRAWAL,
        reason: 'Bitcoin amount must be negative (outgoing) for withdrawals',
      });

      if (expandedClassifications) {
        disabled.push({
          classification: TransactionClassification.EXCHANGE_TRANSFER,
          reason: 'Bitcoin amount must be negative (outgoing) for exchange transfers',
        });
      }
    }

    return { available, disabled };
  }

  /**
   * Validate that a classification decision is logically possible for the transaction data
   * Enhanced validation for all 12 classification types with user-friendly error messages
   */
  private validateClassificationDecision(
    unclassified: UnclassifiedTransaction,
    decision: ClassificationDecision,
  ): { isValid: boolean; reason?: string } {
    const { btcAmount, usdAmount, price } = unclassified;
    const { classification, usdValue } = decision;

    // All classifications except SKIP require non-zero BTC
    if (classification !== TransactionClassification.SKIP && btcAmount === 0) {
      return { isValid: false, reason: 'Transaction requires Bitcoin movement' };
    }

    // Group validations by tax event type for better organization
    switch (classification) {
      // INCOME EVENTS - Require positive BTC (incoming) + fair market value
      case TransactionClassification.PURCHASE:
        if (btcAmount <= 0) {
          return {
            isValid: false,
            reason: 'Bitcoin purchases require positive Bitcoin amount (incoming)',
          };
        }
        if (usdAmount === 0 && (!price || price <= 0)) {
          return {
            isValid: false,
            reason: 'Purchases require USD amount or valid price to establish cost basis',
          };
        }
        break;

      case TransactionClassification.GIFT_RECEIVED:
        if (btcAmount <= 0) {
          return {
            isValid: false,
            reason: 'Bitcoin gifts received require positive Bitcoin amount (incoming)',
          };
        }
        if (!usdValue && (!price || price <= 0)) {
          return {
            isValid: false,
            reason:
              'Gifts received require fair market value for tax reporting - this is taxable income',
          };
        }
        break;

      case TransactionClassification.PAYMENT_RECEIVED:
        if (btcAmount <= 0) {
          return {
            isValid: false,
            reason: 'Bitcoin payments received require positive Bitcoin amount (incoming)',
          };
        }
        if (!usdValue && (!price || price <= 0)) {
          return {
            isValid: false,
            reason: 'Payments received require fair market value - this is taxable income',
          };
        }
        break;

      case TransactionClassification.REIMBURSEMENT_RECEIVED:
        if (btcAmount <= 0) {
          return {
            isValid: false,
            reason: 'Bitcoin reimbursements require positive Bitcoin amount (incoming)',
          };
        }
        if (!usdValue && (!price || price <= 0)) {
          return {
            isValid: false,
            reason:
              'Reimbursements require fair market value to calculate taxable gain/loss vs cash amount spent',
          };
        }
        break;

      case TransactionClassification.MINING_INCOME:
        if (btcAmount <= 0) {
          return {
            isValid: false,
            reason: 'Mining rewards require positive Bitcoin amount (incoming)',
          };
        }
        if (!usdValue && (!price || price <= 0)) {
          return {
            isValid: false,
            reason:
              'Mining income requires fair market value - this is taxable income at time of receipt',
          };
        }
        break;

      case TransactionClassification.STAKING_INCOME:
        if (btcAmount <= 0) {
          return {
            isValid: false,
            reason: 'Staking rewards require positive Bitcoin amount (incoming)',
          };
        }
        if (!usdValue && (!price || price <= 0)) {
          return {
            isValid: false,
            reason:
              'Staking income requires fair market value - this is taxable income at time of receipt',
          };
        }
        break;

      // DISPOSAL EVENTS - Require negative BTC (outgoing) + sale proceeds/fair market value
      case TransactionClassification.SALE:
        if (btcAmount >= 0) {
          return {
            isValid: false,
            reason: 'Bitcoin sales require negative Bitcoin amount (outgoing)',
          };
        }
        if (usdAmount <= 0 && (!usdValue || usdValue <= 0)) {
          return {
            isValid: false,
            reason: 'Sales require positive USD proceeds to calculate capital gains/losses',
          };
        }
        break;

      case TransactionClassification.GIFT_SENT:
        if (btcAmount >= 0) {
          return {
            isValid: false,
            reason: 'Bitcoin gifts sent require negative Bitcoin amount (outgoing)',
          };
        }
        if (!usdValue && (!price || price <= 0)) {
          return {
            isValid: false,
            reason:
              'Gifts sent require fair market value - you owe tax on any gains since purchase',
          };
        }
        break;

      case TransactionClassification.PAYMENT_SENT:
        if (btcAmount >= 0) {
          return {
            isValid: false,
            reason: 'Bitcoin payments sent require negative Bitcoin amount (outgoing)',
          };
        }
        if (!usdValue && (!price || price <= 0)) {
          return {
            isValid: false,
            reason:
              'Payments sent require fair market value - this creates taxable capital gains/losses',
          };
        }
        break;

      // NON-TAXABLE MOVEMENTS - Require negative BTC (outgoing) + minimal/no USD
      case TransactionClassification.SELF_CUSTODY_WITHDRAWAL:
        if (btcAmount >= 0) {
          return {
            isValid: false,
            reason: 'Self-custody withdrawals require negative Bitcoin amount (outgoing)',
          };
        }
        if (usdAmount > 0) {
          return {
            isValid: false,
            reason:
              'Self-custody withdrawals should not have USD amounts - you still own the Bitcoin',
          };
        }
        break;

      case TransactionClassification.EXCHANGE_TRANSFER:
        if (btcAmount >= 0) {
          return {
            isValid: false,
            reason: 'Exchange transfers require negative Bitcoin amount (outgoing)',
          };
        }
        if (usdAmount > 0) {
          return {
            isValid: false,
            reason:
              'Exchange transfers should not have USD amounts - this is just moving Bitcoin between exchanges',
          };
        }
        break;

      case TransactionClassification.SKIP:
        // SKIP is always valid - user chooses not to import this transaction
        break;

      default:
        return { isValid: false, reason: `Unknown classification type: ${classification}` };
    }

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
      // INCOME EVENTS - Taxable acquisitions
      case TransactionClassification.PURCHASE:
        return {
          ...baseTransaction,
          type: 'Purchase',
          isTaxable: true,
        };

      case TransactionClassification.GIFT_RECEIVED:
        return {
          ...baseTransaction,
          type: 'Gift Received',
          isTaxable: true,
          usdAmount:
            decision.usdValue || unclassified.price * Math.abs(unclassified.btcAmount) || 0,
          price: decision.usdValue
            ? decision.usdValue / Math.abs(unclassified.btcAmount)
            : unclassified.price || 0,
          counterparty: decision.counterparty,
        };

      case TransactionClassification.PAYMENT_RECEIVED:
        return {
          ...baseTransaction,
          type: 'Payment Received',
          isTaxable: true,
          usdAmount:
            decision.usdValue || unclassified.price * Math.abs(unclassified.btcAmount) || 0,
          price: decision.usdValue
            ? decision.usdValue / Math.abs(unclassified.btcAmount)
            : unclassified.price || 0,
          counterparty: decision.counterparty,
          goodsServices: decision.goodsServices,
        };

      case TransactionClassification.REIMBURSEMENT_RECEIVED:
        return {
          ...baseTransaction,
          type: 'Reimbursement Received',
          isTaxable: true,
          usdAmount:
            decision.usdValue || unclassified.price * Math.abs(unclassified.btcAmount) || 0,
          price: decision.usdValue
            ? decision.usdValue / Math.abs(unclassified.btcAmount)
            : unclassified.price || 0,
          counterparty: decision.counterparty,
          goodsServices: decision.goodsServices,
        };

      case TransactionClassification.MINING_INCOME:
        return {
          ...baseTransaction,
          type: 'Mining Income',
          isTaxable: true,
          usdAmount:
            decision.usdValue || unclassified.price * Math.abs(unclassified.btcAmount) || 0,
          price: decision.usdValue
            ? decision.usdValue / Math.abs(unclassified.btcAmount)
            : unclassified.price || 0,
        };

      case TransactionClassification.STAKING_INCOME:
        return {
          ...baseTransaction,
          type: 'Staking Income',
          isTaxable: true,
          usdAmount:
            decision.usdValue || unclassified.price * Math.abs(unclassified.btcAmount) || 0,
          price: decision.usdValue
            ? decision.usdValue / Math.abs(unclassified.btcAmount)
            : unclassified.price || 0,
        };

      // DISPOSAL EVENTS - Taxable disposals
      case TransactionClassification.SALE:
        return {
          ...baseTransaction,
          type: 'Sale',
          isTaxable: true,
          usdAmount: decision.usdValue || decision.salePrice || Math.abs(unclassified.usdAmount),
          price: decision.usdValue
            ? decision.usdValue / Math.abs(unclassified.btcAmount)
            : decision.salePrice || unclassified.price || 0,
        };

      case TransactionClassification.GIFT_SENT:
        return {
          ...baseTransaction,
          type: 'Gift Sent',
          isTaxable: true,
          usdAmount:
            decision.usdValue || unclassified.price * Math.abs(unclassified.btcAmount) || 0,
          price: decision.usdValue
            ? decision.usdValue / Math.abs(unclassified.btcAmount)
            : unclassified.price || 0,
          counterparty: decision.counterparty,
        };

      case TransactionClassification.PAYMENT_SENT:
        return {
          ...baseTransaction,
          type: 'Payment Sent',
          isTaxable: true,
          usdAmount:
            decision.usdValue || unclassified.price * Math.abs(unclassified.btcAmount) || 0,
          price: decision.usdValue
            ? decision.usdValue / Math.abs(unclassified.btcAmount)
            : unclassified.price || 0,
          counterparty: decision.counterparty,
          goodsServices: decision.goodsServices,
        };

      // NON-TAXABLE MOVEMENTS
      case TransactionClassification.SELF_CUSTODY_WITHDRAWAL:
        return {
          ...baseTransaction,
          type: 'Withdrawal',
          isSelfCustody: true,
          isTaxable: false,
          destinationWallet: decision.destinationWallet || 'Self-Custody Wallet',
          usdAmount: 0, // Withdrawals don't have USD value
        };

      case TransactionClassification.EXCHANGE_TRANSFER:
        return {
          ...baseTransaction,
          type: 'Transfer',
          isTaxable: false,
          destinationWallet:
            decision.destinationExchange || decision.transferExchange || 'Another Exchange',
          sourceExchange: decision.sourceExchange,
          usdAmount: 0, // Transfers don't have USD value
        };

      case TransactionClassification.SKIP:
        return null; // Don't create transaction

      default:
        console.error(`Unknown classification type: ${decision.classification}`);
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
