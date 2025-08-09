export interface UnclassifiedTransaction {
  id: string;
  rawData: any; // Original CSV row data
  detectedType: string; // What we detected from CSV
  exchange: string;
  date: Date;
  btcAmount: number; // Can be negative for outgoing
  usdAmount: number; // Can be 0 for transfers
  price?: number;
  destinationAddress?: string; // If available in CSV
  txHash?: string; // If available in CSV
  confidence: number; // 0-1, how confident we are about the type
  suggestedClassification: TransactionClassification;
}

export enum TransactionClassification {
  PURCHASE = 'purchase', // Buy/Purchase (taxable acquisition)
  SELF_CUSTODY_WITHDRAWAL = 'self_custody_withdrawal', // Withdrawal to own wallet (non-taxable)
  SALE = 'sale', // Sale for USD (taxable disposal)
  EXCHANGE_TRANSFER = 'exchange_transfer', // Transfer to another exchange (non-taxable)
  OTHER = 'other', // User will specify
  SKIP = 'skip', // Don't import this transaction
}

export interface ClassificationDecision {
  transactionId: string;
  classification: TransactionClassification;
  destinationWallet?: string; // For self-custody withdrawals
  notes?: string;
  salePrice?: number; // For sales
  transferExchange?: string; // For exchange transfers
}

export interface TransactionClassificationResult {
  classified: Transaction[];
  needsClassification: UnclassifiedTransaction[];
  skipped: UnclassifiedTransaction[];
  errors: Array<{
    transaction: UnclassifiedTransaction;
    error: string;
  }>;
}

export interface ClassificationPrompt {
  title: string;
  message: string;
  transactions: UnclassifiedTransaction[];
  bulkActions?: Array<{
    label: string;
    classification: TransactionClassification;
    condition?: (tx: UnclassifiedTransaction) => boolean;
  }>;
}

// Common transaction type patterns for detection
export const TRANSACTION_TYPE_PATTERNS = {
  purchases: [
    'purchase', 'buy', 'bought', 'acquisition', 'deposit', 'trade', 'order',
    'investment', 'dca', 'recurring'
  ],
  withdrawals: [
    'withdrawal', 'withdraw', 'send', 'sent', 'transfer', 'moved', 'outgoing',
    'out', 'to wallet', 'to address', 'self custody'
  ],
  sales: [
    'sale', 'sell', 'sold', 'disposal', 'liquidation', 'convert', 'exchange',
    'cash out', 'realize'
  ],
  transfers: [
    'transfer', 'moved', 'migration', 'consolidation', 'internal transfer',
    'exchange transfer', 'platform transfer'
  ]
};

// Amount patterns that suggest certain transaction types
export const AMOUNT_PATTERN_HEURISTICS = {
  // Common self-custody amounts (in BTC)
  selfCustodyAmounts: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0],
  // Tolerance for matching common amounts (5%)
  amountTolerance: 0.05,
};

import { Transaction } from './Transaction';