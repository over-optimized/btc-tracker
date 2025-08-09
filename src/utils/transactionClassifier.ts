import { 
  UnclassifiedTransaction, 
  TransactionClassification, 
  TransactionClassificationResult,
  ClassificationDecision,
  TRANSACTION_TYPE_PATTERNS,
  AMOUNT_PATTERN_HEURISTICS,
  ClassificationPrompt
} from '../types/TransactionClassification';
import { Transaction } from '../types/Transaction';
import { generateStableTransactionId } from './generateTransactionId';

export class TransactionClassifier {
  /**
   * Classify raw transaction data from CSV parsing
   */
  classifyTransactions(rawTransactions: Array<{
    rawData: any;
    exchange: string;
  }>): TransactionClassificationResult {
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
          // Low confidence - needs user input
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
      suggestedClassification: TransactionClassification.OTHER, // Will be set by classification
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
        reason: `Transaction type "${tx.detectedType}" matches purchase patterns`
      };
    }

    // High confidence sales (negative BTC, positive USD)
    if (this.matchesPatterns(type, TRANSACTION_TYPE_PATTERNS.sales) && tx.btcAmount < 0 && tx.usdAmount > 0) {
      return {
        classification: TransactionClassification.SALE,
        confidence: 0.9,
        reason: `Transaction type "${tx.detectedType}" matches sale patterns with USD proceeds`
      };
    }

    // High confidence withdrawals (negative BTC, no/minimal USD)
    if (this.matchesPatterns(type, TRANSACTION_TYPE_PATTERNS.withdrawals) && tx.btcAmount < 0 && tx.usdAmount <= 0) {
      // Check if amount matches common self-custody patterns
      const isSelfCustodyAmount = this.isCommonSelfCustodyAmount(amount);
      
      return {
        classification: TransactionClassification.SELF_CUSTODY_WITHDRAWAL,
        confidence: isSelfCustodyAmount ? 0.85 : 0.7,
        reason: `Withdrawal pattern detected${isSelfCustodyAmount ? ' with common self-custody amount' : ''}`
      };
    }

    // Medium confidence transfers
    if (this.matchesPatterns(type, TRANSACTION_TYPE_PATTERNS.transfers)) {
      return {
        classification: TransactionClassification.EXCHANGE_TRANSFER,
        confidence: 0.6,
        reason: `Transaction type "${tx.detectedType}" suggests transfer between platforms`
      };
    }

    // Low confidence - needs user input
    return {
      classification: TransactionClassification.OTHER,
      confidence: 0.1,
      reason: `Unable to automatically classify transaction type "${tx.detectedType}"`
    };
  }

  /**
   * Apply user classification decision to create final transaction
   */
  applyClassification(
    unclassified: UnclassifiedTransaction, 
    decision: ClassificationDecision
  ): Transaction | null {
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
    needsClassification: UnclassifiedTransaction[]
  ): ClassificationPrompt[] {
    const prompts: ClassificationPrompt[] = [];

    // Group by transaction type patterns
    const withdrawals = needsClassification.filter(tx => 
      this.matchesPatterns(tx.detectedType.toLowerCase(), TRANSACTION_TYPE_PATTERNS.withdrawals)
    );

    const sales = needsClassification.filter(tx => 
      this.matchesPatterns(tx.detectedType.toLowerCase(), TRANSACTION_TYPE_PATTERNS.sales)
    );

    const unknown = needsClassification.filter(tx => 
      !withdrawals.includes(tx) && !sales.includes(tx)
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
            condition: (tx) => this.isCommonSelfCustodyAmount(Math.abs(tx.btcAmount))
          },
          {
            label: 'Mark All as Exchange Transfers',
            classification: TransactionClassification.EXCHANGE_TRANSFER,
          }
        ]
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
          }
        ]
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
    return rawData['Transaction Type'] || 
           rawData['Type'] || 
           rawData['type'] || 
           rawData['Action'] || 
           'Unknown';
  }

  private extractBtcAmount(rawData: any): number {
    const btcFields = ['Amount BTC', 'Amount (BTC)', 'BTC Amount', 'Volume', 'vol', 'Quantity', 'Bitcoin'];
    
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
    const usdFields = ['Amount USD', 'Amount (USD)', 'USD Amount', 'Total', 'Cost', 'Value', 'Subtotal'];
    
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
    return patterns.some(pattern => lowerText.includes(pattern.toLowerCase()));
  }

  private isCommonSelfCustodyAmount(btcAmount: number): boolean {
    return AMOUNT_PATTERN_HEURISTICS.selfCustodyAmounts.some(commonAmount => 
      Math.abs(btcAmount - commonAmount) <= commonAmount * AMOUNT_PATTERN_HEURISTICS.amountTolerance
    );
  }
}