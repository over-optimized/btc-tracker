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
  // ACQUISITIONS (Taxable Income Events)
  PURCHASE = 'purchase', // Direct Bitcoin purchase (taxable acquisition)
  GIFT_RECEIVED = 'gift_received', // Bitcoin received as gift (taxable income at FMV)
  PAYMENT_RECEIVED = 'payment_received', // Bitcoin received for goods/services (taxable income)
  REIMBURSEMENT_RECEIVED = 'reimbursement_received', // Bitcoin received as expense reimbursement (taxable)
  MINING_INCOME = 'mining_income', // Mining rewards (taxable income at FMV)
  STAKING_INCOME = 'staking_income', // Staking/yield rewards (taxable income at FMV)

  // DISPOSALS (Taxable Capital Gain/Loss Events)
  SALE = 'sale', // Sale for USD (taxable disposal)
  GIFT_SENT = 'gift_sent', // Bitcoin given as gift (taxable disposal at FMV)
  PAYMENT_SENT = 'payment_sent', // Bitcoin spent for goods/services (taxable disposal)

  // NON-TAXABLE MOVEMENTS
  SELF_CUSTODY_WITHDRAWAL = 'self_custody_withdrawal', // Move to own wallet (non-taxable)
  EXCHANGE_TRANSFER = 'exchange_transfer', // Transfer between exchanges (non-taxable)

  // SYSTEM OPTIONS
  SKIP = 'skip', // Don't import this transaction
}

export interface ClassificationDecision {
  transactionId: string;
  classification: TransactionClassification;

  // Tax calculation fields
  usdValue?: number; // Fair market value (for income events)
  costBasis?: number; // Known cost basis (for disposals)

  // Context fields
  destinationWallet?: string; // For self-custody
  sourceExchange?: string; // For transfers
  destinationExchange?: string; // For exchange transfers
  counterparty?: string; // Who you transacted with
  goodsServices?: string; // What was purchased/provided

  // Legacy fields (for backwards compatibility)
  salePrice?: number; // For sales (now mapped to usdValue)
  transferExchange?: string; // For exchange transfers (now mapped to destinationExchange)

  // User notes
  notes?: string;
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
    'purchase',
    'buy',
    'bought',
    'acquisition',
    'deposit',
    'trade',
    'order',
    'investment',
    'dca',
    'recurring',
  ],
  withdrawals: [
    'withdrawal',
    'withdraw',
    'send',
    'sent',
    'transfer',
    'moved',
    'outgoing',
    'out',
    'to wallet',
    'to address',
    'self custody',
  ],
  deposits: ['deposit', 'receive', 'received', 'incoming', 'in', 'from wallet', 'from address'],
  sales: [
    'sale',
    'sell',
    'sold',
    'disposal',
    'liquidation',
    'convert',
    'exchange',
    'cash out',
    'realize',
  ],
  transfers: [
    'transfer',
    'moved',
    'migration',
    'consolidation',
    'internal transfer',
    'exchange transfer',
    'platform transfer',
  ],
};

// Amount patterns that suggest certain transaction types
export const AMOUNT_PATTERN_HEURISTICS = {
  // Common self-custody amounts (in BTC)
  selfCustodyAmounts: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0],
  // Tolerance for matching common amounts (5%)
  amountTolerance: 0.05,
};

// Tax event types for educational purposes
export enum TaxEventType {
  INCOME = 'income', // Taxable income at FMV
  DISPOSAL = 'disposal', // Capital gains/loss calculation
  NON_TAXABLE = 'non_taxable', // No tax implications
}

// Utility function to determine tax event type from classification
export const getTaxEventType = (classification: TransactionClassification): TaxEventType => {
  switch (classification) {
    case TransactionClassification.PURCHASE:
    case TransactionClassification.GIFT_RECEIVED:
    case TransactionClassification.PAYMENT_RECEIVED:
    case TransactionClassification.REIMBURSEMENT_RECEIVED:
    case TransactionClassification.MINING_INCOME:
    case TransactionClassification.STAKING_INCOME:
      return TaxEventType.INCOME;

    case TransactionClassification.SALE:
    case TransactionClassification.GIFT_SENT:
    case TransactionClassification.PAYMENT_SENT:
      return TaxEventType.DISPOSAL;

    case TransactionClassification.SELF_CUSTODY_WITHDRAWAL:
    case TransactionClassification.EXCHANGE_TRANSFER:
    case TransactionClassification.SKIP:
      return TaxEventType.NON_TAXABLE;

    default:
      return TaxEventType.NON_TAXABLE;
  }
};

import { Transaction } from './Transaction';
