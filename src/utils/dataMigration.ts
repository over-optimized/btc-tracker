/**
 * Data migration utilities for upgrading existing user data
 * to use stable transaction IDs
 */

import { Transaction } from '../types/Transaction';
import { generateStableTransactionId, type TransactionData } from './generateTransactionId';

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errorCount: number;
  errors: string[];
  duplicatesRemoved: number;
  backupCreated: boolean;
}

export interface StorageVersion {
  version: number;
  migratedAt: Date;
  previousVersion?: number;
}

// Current storage version - increment when making breaking changes
export const CURRENT_STORAGE_VERSION = 2;
export const STORAGE_VERSION_KEY = 'btc-tracker:storage-version';
export const BACKUP_KEY = 'btc-tracker:backup-v1';

/**
 * Check if data migration is needed
 */
export function needsMigration(): boolean {
  const versionData = localStorage.getItem(STORAGE_VERSION_KEY);
  if (!versionData) {
    return true; // No version info means old data format
  }

  try {
    const version: StorageVersion = JSON.parse(versionData);
    return version.version < CURRENT_STORAGE_VERSION;
  } catch {
    return true; // Corrupted version data
  }
}

/**
 * Get current storage version info
 */
export function getStorageVersion(): StorageVersion | null {
  const versionData = localStorage.getItem(STORAGE_VERSION_KEY);
  if (!versionData) return null;

  try {
    const version = JSON.parse(versionData);
    return {
      ...version,
      migratedAt: new Date(version.migratedAt),
    };
  } catch {
    return null;
  }
}

/**
 * Create backup of existing data before migration
 */
function createBackup(transactions: Transaction[]): boolean {
  try {
    const backup = {
      transactions,
      timestamp: new Date().toISOString(),
      version: 1, // Pre-migration version
    };

    localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
    return true;
  } catch (error) {
    console.error('Failed to create backup:', error);
    return false;
  }
}

/**
 * Attempt to recreate TransactionData from legacy Transaction
 * This is best-effort since we may be missing some original data
 */
function legacyTransactionToTransactionData(tx: Transaction): TransactionData {
  // Try to extract reference from legacy ID patterns
  let reference: string | undefined;

  // Check for Strike reference pattern in ID
  if (tx.id.includes('strike-ref-')) {
    reference = tx.id.replace('strike-ref-', '');
  } else if (tx.exchange.toLowerCase() === 'strike' && tx.id.includes('-')) {
    // Try to extract reference from other Strike patterns
    const parts = tx.id.split('-');
    if (parts.length > 2) {
      reference = parts.slice(2).join('-');
    }
  }

  return {
    exchange: tx.exchange,
    date: tx.date,
    usdAmount: tx.usdAmount,
    btcAmount: tx.btcAmount,
    type: tx.type,
    price: tx.price,
    reference,
  };
}

/**
 * Migrate legacy transaction to use stable ID
 */
function migrateTransaction(legacyTx: Transaction): Transaction {
  const transactionData = legacyTransactionToTransactionData(legacyTx);
  const newId = generateStableTransactionId(transactionData);

  return {
    ...legacyTx,
    id: newId,
  };
}

/**
 * Detect and remove duplicate transactions after migration
 */
function deduplicateTransactions(transactions: Transaction[]): {
  deduplicated: Transaction[];
  removedCount: number;
} {
  const txMap = new Map<string, Transaction>();
  let removedCount = 0;

  for (const tx of transactions) {
    if (txMap.has(tx.id)) {
      removedCount++;
      // Keep the transaction with more recent data (or first one if same)
      const existing = txMap.get(tx.id)!;
      if (tx.date > existing.date) {
        txMap.set(tx.id, tx);
      }
    } else {
      txMap.set(tx.id, tx);
    }
  }

  return {
    deduplicated: Array.from(txMap.values()),
    removedCount,
  };
}

/**
 * Migrate existing transaction data to use stable IDs
 */
export function migrateTransactionData(existingTransactions: Transaction[]): MigrationResult {
  const result: MigrationResult = {
    success: false,
    migratedCount: 0,
    errorCount: 0,
    errors: [],
    duplicatesRemoved: 0,
    backupCreated: false,
  };

  try {
    // Create backup first
    result.backupCreated = createBackup(existingTransactions);

    // Migrate each transaction
    const migratedTransactions: Transaction[] = [];

    for (const legacyTx of existingTransactions) {
      try {
        const migratedTx = migrateTransaction(legacyTx);
        migratedTransactions.push(migratedTx);
        result.migratedCount++;
      } catch (error) {
        result.errorCount++;
        result.errors.push(`Failed to migrate transaction ${legacyTx.id}: ${error}`);
      }
    }

    // Deduplicate after migration (stable IDs might reveal duplicates)
    const { deduplicated, removedCount } = deduplicateTransactions(migratedTransactions);
    result.duplicatesRemoved = removedCount;

    // Update storage version
    const versionInfo: StorageVersion = {
      version: CURRENT_STORAGE_VERSION,
      migratedAt: new Date(),
      previousVersion: 1,
    };
    localStorage.setItem(STORAGE_VERSION_KEY, JSON.stringify(versionInfo));

    result.success = true;
    return result;
  } catch (error) {
    result.errors.push(`Migration failed: ${error}`);
    return result;
  }
}

/**
 * Restore from backup (in case migration goes wrong)
 */
export function restoreFromBackup(): {
  success: boolean;
  transactionsCount: number;
  error?: string;
} {
  try {
    const backupData = localStorage.getItem(BACKUP_KEY);
    if (!backupData) {
      return { success: false, transactionsCount: 0, error: 'No backup found' };
    }

    const backup = JSON.parse(backupData);
    const transactions = backup.transactions.map((tx: any) => ({
      ...tx,
      date: new Date(tx.date),
    }));

    // Restore transactions to main storage
    localStorage.setItem('btc-tracker:transactions', JSON.stringify(transactions));

    // Reset version to pre-migration
    localStorage.removeItem(STORAGE_VERSION_KEY);

    return { success: true, transactionsCount: transactions.length };
  } catch (error) {
    return { success: false, transactionsCount: 0, error: String(error) };
  }
}

/**
 * Clean up migration artifacts (call after successful migration verification)
 */
export function cleanupMigration(): void {
  // Remove backup after successful migration (optional - user preference)
  // localStorage.removeItem(BACKUP_KEY);
  // Could also clean up any temporary migration data
}

/**
 * Get backup info for UI display
 */
export function getBackupInfo(): {
  exists: boolean;
  timestamp?: string;
  transactionCount?: number;
} {
  try {
    const backupData = localStorage.getItem(BACKUP_KEY);
    if (!backupData) {
      return { exists: false };
    }

    const backup = JSON.parse(backupData);
    return {
      exists: true,
      timestamp: backup.timestamp,
      transactionCount: backup.transactions?.length || 0,
    };
  } catch {
    return { exists: false };
  }
}

/**
 * Force re-migration (for testing or if something went wrong)
 */
export function forceMigration(transactions: Transaction[]): MigrationResult {
  // Remove version info to force migration
  localStorage.removeItem(STORAGE_VERSION_KEY);
  return migrateTransactionData(transactions);
}

/**
 * Validate migrated data integrity
 */
export function validateMigratedData(transactions: Transaction[]): {
  valid: boolean;
  issues: string[];
  stats: {
    totalTransactions: number;
    referenceBasedIds: number;
    hashBasedIds: number;
    uniqueIds: number;
  };
} {
  const issues: string[] = [];
  const idSet = new Set<string>();
  let referenceBasedIds = 0;
  let hashBasedIds = 0;

  for (const tx of transactions) {
    // Check ID format
    if (!tx.id || typeof tx.id !== 'string') {
      issues.push(`Transaction missing or invalid ID: ${JSON.stringify(tx)}`);
      continue;
    }

    // Check for duplicates
    if (idSet.has(tx.id)) {
      issues.push(`Duplicate transaction ID: ${tx.id}`);
    }
    idSet.add(tx.id);

    // Count ID types
    if (tx.id.includes('-ref-')) {
      referenceBasedIds++;
    } else {
      hashBasedIds++;
    }

    // Check required fields
    if (!tx.date || !tx.exchange || !tx.type) {
      issues.push(`Transaction missing required fields: ${tx.id}`);
    }

    if (tx.usdAmount <= 0 || tx.btcAmount <= 0) {
      issues.push(`Transaction has invalid amounts: ${tx.id}`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    stats: {
      totalTransactions: transactions.length,
      referenceBasedIds,
      hashBasedIds,
      uniqueIds: idSet.size,
    },
  };
}
