import { Transaction } from '../types/Transaction';
import {
  CURRENT_STORAGE_VERSION,
  getStorageVersion,
  needsMigration,
  performMigration,
  STORAGE_VERSION_KEY,
  type MigrationResult,
  type StorageVersion,
} from './dataMigration';
import {
  convertToOptimizedTransaction,
  type OptimizedTransaction,
  batchConvertToLegacy,
} from '../types/OptimizedTransaction';
import { generateStableTransactionId } from './generateTransactionId';

const STORAGE_KEY = 'btc-tracker:transactions';

/**
 * Validate that a transaction has valid, non-corrupted data
 */
function validateTransactionIntegrity(tx: Transaction): boolean {
  // Check for required fields
  if (!tx.id || !tx.date || !tx.exchange || !tx.type) {
    return false;
  }

  // Check for NaN values
  if (isNaN(tx.usdAmount) || isNaN(tx.btcAmount) || isNaN(tx.price)) {
    return false;
  }

  // Check for impossible combinations
  if (tx.type === 'Purchase' && tx.usdAmount === 0 && tx.price === 0) {
    return false; // Impossible purchase with no USD value
  }

  if (tx.type === 'Sale' && tx.usdAmount === 0) {
    return false; // Impossible sale with no USD proceeds
  }

  // Check for zero amounts in transactions that should have movement
  if (tx.btcAmount === 0 && tx.type !== 'Deposit') {
    return false; // No Bitcoin movement
  }

  return true;
}

export interface StorageLoadResult {
  transactions: Transaction[];
  migrationResult?: MigrationResult;
  needsAttention: boolean;
}

/**
 * Detect if stored data is in optimized format (v3+) or legacy format
 */
function isOptimizedFormat(rawData: any[]): boolean {
  if (!Array.isArray(rawData) || rawData.length === 0) {
    return false;
  }

  // Check if first transaction has optimized format fields
  const firstTx = rawData[0];
  return (
    firstTx &&
    typeof firstTx.usd_amount === 'number' &&
    typeof firstTx.btc_amount === 'number' &&
    typeof firstTx.user_id !== 'undefined' &&
    typeof firstTx.created_at === 'string'
  );
}

/**
 * Load transactions with automatic migration handling and format detection
 */
export function getTransactions(): StorageLoadResult {
  const data = localStorage.getItem(STORAGE_KEY);

  // No data case
  if (!data) {
    // Set current version for new users
    const versionInfo: StorageVersion = {
      version: CURRENT_STORAGE_VERSION,
      migratedAt: new Date(),
    };
    localStorage.setItem(STORAGE_VERSION_KEY, JSON.stringify(versionInfo));

    return {
      transactions: [],
      needsAttention: false,
    };
  }

  // Parse existing data
  let rawTransactions: any[];
  try {
    rawTransactions = JSON.parse(data);
  } catch (error) {
    console.error('Failed to parse transaction data:', error);
    return {
      transactions: [],
      needsAttention: true,
    };
  }

  // Detect format and convert accordingly
  const isOptimized = isOptimizedFormat(rawTransactions);

  if (isOptimized) {
    // Data is already in optimized format (v3+)
    const optimizedTransactions = rawTransactions as OptimizedTransaction[];
    const legacyTransactions = batchConvertToLegacy(optimizedTransactions);

    // Filter for integrity
    const validTransactions = legacyTransactions.filter((tx: Transaction) => {
      const isValid = validateTransactionIntegrity(tx);
      if (!isValid) {
        console.warn('Filtering out corrupted transaction:', tx);
      }
      return isValid;
    });

    // Log if we filtered out corrupted data
    const filteredCount = optimizedTransactions.length - validTransactions.length;
    if (filteredCount > 0) {
      console.warn(`Filtered out ${filteredCount} corrupted transactions during load`);
    }

    return {
      transactions: validTransactions,
      needsAttention: false,
    };
  } else {
    // Data is in legacy format, convert and validate
    const transactions: Transaction[] = rawTransactions
      .map((tx: Omit<Transaction, 'date'> & { date: string }) => ({
        ...tx,
        date: new Date(tx.date),
      }))
      .filter((tx: Transaction) => {
        const isValid = validateTransactionIntegrity(tx);
        if (!isValid) {
          console.warn('Filtering out corrupted transaction:', tx);
        }
        return isValid;
      });

    // Log if we filtered out corrupted data
    const filteredCount = rawTransactions.length - transactions.length;
    if (filteredCount > 0) {
      console.warn(`Filtered out ${filteredCount} corrupted transactions during load`);
    }

    // Check if migration is needed
    if (needsMigration()) {
      console.log('Migration needed, upgrading transaction data...');

      const migrationResult = performMigration(transactions);

      if (migrationResult.success) {
        // For v2→v3 migration, the data is now in optimized format
        // But we need to return legacy format for backward compatibility
        if (migrationResult.preAlphaRestructure) {
          // This was a v2→v3 migration, reload optimized data
          return getTransactions(); // Recursive call to load optimized format
        } else {
          // This was a v1→v2 migration, handle deduplication
          const { deduplicated } = deduplicateAndMigrate(transactions);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(deduplicated));

          return {
            transactions: deduplicated,
            migrationResult,
            needsAttention: migrationResult.errorCount > 0 || migrationResult.duplicatesRemoved > 0,
          };
        }
      } else {
        // Migration failed, return original data but flag for attention
        console.error('Migration failed:', migrationResult.errors);
        return {
          transactions,
          migrationResult,
          needsAttention: true,
        };
      }
    }

    // No migration needed, return data as-is
    return {
      transactions,
      needsAttention: false,
    };
  }
}

/**
 * Helper function to deduplicate and migrate transactions
 */
function deduplicateAndMigrate(transactions: Transaction[]): {
  deduplicated: Transaction[];
  removedCount: number;
} {
  const txMap = new Map<string, Transaction>();
  let removedCount = 0;

  for (const tx of transactions) {
    // Generate new stable ID
    const transactionData = {
      exchange: tx.exchange,
      date: tx.date,
      usdAmount: tx.usdAmount,
      btcAmount: tx.btcAmount,
      type: tx.type,
      price: tx.price,
      // Try to extract reference from existing ID if it looks like a reference
      reference: extractReferenceFromLegacyId(tx.id, tx.exchange),
    };

    const newId = generateStableTransactionId(transactionData);
    const migratedTx = { ...tx, id: newId };

    if (txMap.has(newId)) {
      removedCount++;
      // Keep the more recent transaction
      const existing = txMap.get(newId)!;
      if (migratedTx.date > existing.date) {
        txMap.set(newId, migratedTx);
      }
    } else {
      txMap.set(newId, migratedTx);
    }
  }

  return {
    deduplicated: Array.from(txMap.values()),
    removedCount,
  };
}

/**
 * Try to extract reference from legacy ID patterns
 */
function extractReferenceFromLegacyId(legacyId: string, exchange: string): string | undefined {
  // Strike reference extraction
  if (exchange.toLowerCase() === 'strike') {
    if (legacyId.includes('strike-ref-')) {
      return legacyId.replace('strike-ref-', '');
    }
    if (legacyId.startsWith('strike-') && legacyId.length > 20) {
      // Might be a reference, try to extract
      const parts = legacyId.split('-');
      if (parts.length >= 3) {
        return parts.slice(1).join('-');
      }
    }
  }

  // Other exchanges - look for common reference patterns
  if (legacyId.includes('-ref-')) {
    return legacyId.split('-ref-')[1];
  }

  return undefined;
}

/**
 * Save transactions in optimized format for v3+ compatibility
 */
export function saveTransactions(transactions: Transaction[]): void {
  try {
    // Convert legacy transactions to optimized format for storage
    const optimizedTransactions = transactions.map(
      (tx) => convertToOptimizedTransaction(tx, null), // null = anonymous user
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(optimizedTransactions));

    // Ensure version is up to date
    const currentVersion = getStorageVersion();
    if (!currentVersion || currentVersion.version < CURRENT_STORAGE_VERSION) {
      const versionInfo: StorageVersion = {
        version: CURRENT_STORAGE_VERSION,
        migratedAt: new Date(),
        previousVersion: currentVersion?.version,
      };
      localStorage.setItem(STORAGE_VERSION_KEY, JSON.stringify(versionInfo));
    }
  } catch (error) {
    console.error('Failed to save transactions:', error);
    throw new Error('Unable to save transaction data to local storage');
  }
}

/**
 * Clear all transaction data and version info
 */
export function clearTransactions(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_VERSION_KEY);
}

/**
 * Get storage info for diagnostics
 */
export function getStorageInfo(): {
  hasTransactions: boolean;
  transactionCount: number;
  storageVersion: StorageVersion | null;
  needsMigration: boolean;
  storageSize: number; // in bytes
} {
  const data = localStorage.getItem(STORAGE_KEY);
  const version = getStorageVersion();

  let transactionCount = 0;
  if (data) {
    try {
      const transactions = JSON.parse(data);
      transactionCount = Array.isArray(transactions) ? transactions.length : 0;
    } catch {
      // Invalid data
    }
  }

  const storageSize =
    (data?.length || 0) + (localStorage.getItem(STORAGE_VERSION_KEY)?.length || 0);

  return {
    hasTransactions: !!data,
    transactionCount,
    storageVersion: version,
    needsMigration: needsMigration(),
    storageSize,
  };
}

/**
 * Export transactions for backup/analysis
 */
export function exportTransactions(format: 'json' | 'csv' = 'json'): string {
  const { transactions } = getTransactions();

  if (format === 'csv') {
    const headers = ['ID', 'Date', 'Exchange', 'Type', 'USD Amount', 'BTC Amount', 'Price'];
    const rows = transactions.map((tx) => [
      tx.id,
      tx.date.toISOString(),
      tx.exchange,
      tx.type,
      tx.usdAmount.toString(),
      tx.btcAmount.toString(),
      tx.price.toString(),
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  // JSON format
  return JSON.stringify(transactions, null, 2);
}

/**
 * Import transactions from backup
 */
export function importTransactions(
  data: string,
  format: 'json' | 'csv' = 'json',
): {
  success: boolean;
  importedCount: number;
  error?: string;
} {
  try {
    let importedTransactions: Transaction[];

    if (format === 'csv') {
      // Basic CSV parsing (would use Papa Parse in real implementation)
      const lines = data.trim().split('\n');
      const _headers = lines[0].split(','); // Headers for reference if needed

      importedTransactions = lines.slice(1).map((line) => {
        const values = line.split(',');
        return {
          id: values[0],
          date: new Date(values[1]),
          exchange: values[2],
          type: values[3],
          usdAmount: parseFloat(values[4]),
          btcAmount: parseFloat(values[5]),
          price: parseFloat(values[6]),
        };
      });
    } else {
      // JSON format
      importedTransactions = JSON.parse(data).map(
        (tx: Omit<Transaction, 'date'> & { date: string }) => ({
          ...tx,
          date: new Date(tx.date),
        }),
      );
    }

    // Merge with existing transactions
    const { transactions: existingTransactions } = getTransactions();
    const txMap = new Map<string, Transaction>();

    // Add existing transactions
    existingTransactions.forEach((tx) => txMap.set(tx.id, tx));

    // Add imported transactions (will overwrite duplicates)
    let importedCount = 0;
    importedTransactions.forEach((tx) => {
      if (!txMap.has(tx.id)) {
        importedCount++;
      }
      txMap.set(tx.id, tx);
    });

    const mergedTransactions = Array.from(txMap.values());
    saveTransactions(mergedTransactions);

    return {
      success: true,
      importedCount,
    };
  } catch (error) {
    return {
      success: false,
      importedCount: 0,
      error: String(error),
    };
  }
}

// Legacy function names for backward compatibility
export { getTransactions as getTransactionsLegacy };
