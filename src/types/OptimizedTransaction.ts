/**
 * Optimized transaction structure using snake_case field names
 * to match database schema exactly, eliminating field mapping during migration
 */

export type OptimizedTransactionType =
  | 'Purchase'
  | 'Buy'
  | 'Trade' // Acquisition transactions
  | 'Withdrawal'
  | 'Transfer' // Self-custody movements
  | 'Sale'
  | 'Sell'; // Disposal transactions

/**
 * Optimized transaction structure that maps directly to Supabase database schema
 * Uses snake_case field names for zero-transformation database operations
 */
export interface OptimizedTransaction {
  // Primary fields (required)
  id: string;
  user_id: string | null; // null for anonymous users, UUID for authenticated
  date: string; // ISO 8601 string for consistent serialization
  exchange: string;
  type: string; // Will gradually migrate to OptimizedTransactionType
  usd_amount: number;
  btc_amount: number;
  price: number;

  // Extended fields (optional for backward compatibility)
  destination_wallet?: string; // Wallet name or address where Bitcoin was sent
  network_fee?: number; // Network fee in BTC for withdrawals
  network_fee_usd?: number; // Network fee in USD at time of transaction
  is_self_custody?: boolean; // Flag indicating this is a self-custody movement
  notes?: string; // User notes about the transaction

  // Classification fields for enhanced transaction types
  counterparty?: string; // Person or entity involved in the transaction
  goods_services?: string; // What was purchased or provided
  source_exchange?: string; // Source exchange for transfers
  destination_exchange?: string; // Destination exchange for transfers

  // Tax treatment flags
  is_taxable?: boolean; // Whether this creates a taxable event (defaults based on type)

  // Metadata (required for database)
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * Withdrawal transaction with enforced constraints
 */
export interface OptimizedWithdrawalTransaction extends OptimizedTransaction {
  type: 'Withdrawal' | 'Transfer';
  destination_wallet: string;
  is_self_custody: true;
  is_taxable: false;
}

/**
 * Type guard to check if a transaction is an OptimizedTransaction
 */
export function isOptimizedTransaction(obj: any): obj is OptimizedTransaction {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    (typeof obj.user_id === 'string' || obj.user_id === null) &&
    typeof obj.date === 'string' &&
    typeof obj.exchange === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.usd_amount === 'number' &&
    typeof obj.btc_amount === 'number' &&
    typeof obj.price === 'number' &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  );
}

/**
 * Type guard to check if a transaction is valid for database insertion
 */
export function isValidOptimizedTransaction(obj: OptimizedTransaction): boolean {
  // Check required fields
  if (!obj.id || !obj.date || !obj.exchange || !obj.type) {
    return false;
  }

  // Check for NaN values
  if (isNaN(obj.usd_amount) || isNaN(obj.btc_amount) || isNaN(obj.price)) {
    return false;
  }

  // Check date format
  if (isNaN(Date.parse(obj.date))) {
    return false;
  }

  // Check timestamp formats
  if (isNaN(Date.parse(obj.created_at)) || isNaN(Date.parse(obj.updated_at))) {
    return false;
  }

  // Check for impossible combinations
  if (obj.type === 'Purchase' && obj.usd_amount === 0 && obj.price === 0) {
    return false; // Impossible purchase with no USD value
  }

  if (obj.type === 'Sale' && obj.usd_amount === 0) {
    return false; // Impossible sale with no USD proceeds
  }

  // Check for zero amounts in transactions that should have movement
  if (obj.btc_amount === 0 && obj.type !== 'Deposit') {
    return false; // No Bitcoin movement
  }

  return true;
}

/**
 * Convert legacy Transaction to OptimizedTransaction format
 */
export function convertToOptimizedTransaction(
  legacyTx: any,
  userId: string | null = null,
): OptimizedTransaction {
  const now = new Date().toISOString();

  return {
    id: legacyTx.id,
    user_id: userId,
    date: legacyTx.date instanceof Date ? legacyTx.date.toISOString() : legacyTx.date,
    exchange: legacyTx.exchange,
    type: legacyTx.type,
    usd_amount: legacyTx.usd_amount || legacyTx.usdAmount || 0,
    btc_amount: legacyTx.btc_amount || legacyTx.btcAmount || 0,
    price: legacyTx.price || 0,

    // Extended fields (convert camelCase to snake_case)
    destination_wallet: legacyTx.destinationWallet || legacyTx.destination_wallet,
    network_fee: legacyTx.networkFee || legacyTx.network_fee,
    network_fee_usd: legacyTx.networkFeeUsd || legacyTx.network_fee_usd,
    is_self_custody: legacyTx.isSelfCustody || legacyTx.is_self_custody,
    notes: legacyTx.notes,

    // Classification fields
    counterparty: legacyTx.counterparty,
    goods_services: legacyTx.goodsServices || legacyTx.goods_services,
    source_exchange: legacyTx.sourceExchange || legacyTx.source_exchange,
    destination_exchange: legacyTx.destinationExchange || legacyTx.destination_exchange,

    // Tax treatment
    is_taxable: legacyTx.isTaxable || legacyTx.is_taxable,

    // Metadata
    created_at: legacyTx.created_at || now,
    updated_at: legacyTx.updated_at || now,
  };
}

/**
 * Convert OptimizedTransaction to legacy Transaction format for backward compatibility
 */
export function convertToLegacyTransaction(optimizedTx: OptimizedTransaction): any {
  return {
    id: optimizedTx.id,
    date: new Date(optimizedTx.date),
    exchange: optimizedTx.exchange,
    type: optimizedTx.type,
    usdAmount: optimizedTx.usd_amount,
    btcAmount: optimizedTx.btc_amount,
    price: optimizedTx.price,

    // Extended fields (convert snake_case to camelCase)
    destinationWallet: optimizedTx.destination_wallet,
    networkFee: optimizedTx.network_fee,
    networkFeeUsd: optimizedTx.network_fee_usd,
    isSelfCustody: optimizedTx.is_self_custody,
    notes: optimizedTx.notes,

    // Classification fields
    counterparty: optimizedTx.counterparty,
    goodsServices: optimizedTx.goods_services,
    sourceExchange: optimizedTx.source_exchange,
    destinationExchange: optimizedTx.destination_exchange,

    // Tax treatment
    isTaxable: optimizedTx.is_taxable,
  };
}

/**
 * Create a new OptimizedTransaction with current timestamps
 */
export function createOptimizedTransaction(
  data: Omit<OptimizedTransaction, 'created_at' | 'updated_at'>,
): OptimizedTransaction {
  const now = new Date().toISOString();

  return {
    ...data,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Update an OptimizedTransaction with new updated_at timestamp
 */
export function updateOptimizedTransaction(
  transaction: OptimizedTransaction,
  updates: Partial<Omit<OptimizedTransaction, 'id' | 'created_at' | 'updated_at'>>,
): OptimizedTransaction {
  return {
    ...transaction,
    ...updates,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Batch convert legacy transactions to optimized format
 */
export function batchConvertToOptimized(
  legacyTransactions: any[],
  userId: string | null = null,
): OptimizedTransaction[] {
  return legacyTransactions
    .map((tx) => convertToOptimizedTransaction(tx, userId))
    .filter(isValidOptimizedTransaction);
}

/**
 * Batch convert optimized transactions to legacy format
 */
export function batchConvertToLegacy(optimizedTransactions: OptimizedTransaction[]): any[] {
  return optimizedTransactions.map(convertToLegacyTransaction);
}
