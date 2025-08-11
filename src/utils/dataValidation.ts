/**
 * Data Validation System
 * Handles startup validation, schema migration, and user-friendly data resets
 * Pre-alpha status allows breaking changes with export-before-reset workflows
 */

import { Transaction } from '../types/Transaction';
import { TransactionClassification } from '../types/TransactionClassification';

// Current schema version - increment when making breaking changes
export const CURRENT_SCHEMA_VERSION = '0.5.0';

// Data validation result types
export interface ValidationResult {
  isValid: boolean;
  schemaVersion?: string;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  canMigrate: boolean;
  requiresReset: boolean;
  migratableTransactions: number;
  invalidTransactions: number;
}

export interface ValidationError {
  type: 'SCHEMA_VERSION' | 'INVALID_TRANSACTION' | 'CORRUPT_DATA' | 'UNSUPPORTED_CLASSIFICATION';
  message: string;
  details?: string;
  affectedTransactions?: string[];
}

export interface ValidationWarning {
  type: 'DEPRECATED_FIELD' | 'MISSING_OPTIONAL_DATA' | 'OUTDATED_CLASSIFICATION';
  message: string;
  details?: string;
  affectedTransactions?: string[];
}

// Migration options for user
export interface MigrationOptions {
  exportBeforeReset: boolean;
  preserveTransactionHistory: boolean;
  skipInvalidTransactions: boolean;
  resetToDefaults: boolean;
}

// Schema version history for migration support
const SCHEMA_VERSIONS = {
  '0.1.0': 'Initial version with basic classifications',
  '0.2.0': 'Added tax calculation enhancements',
  '0.3.0': 'Enhanced error handling and import system',
  '0.4.0': 'Professional tax reporting features',
  '0.5.0': 'Educational UX and expanded classifications'  // Current version
};

// Legacy classification mappings for migration
const LEGACY_CLASSIFICATION_MAP: Record<string, TransactionClassification> = {
  'purchase': TransactionClassification.PURCHASE,
  'self_custody_withdrawal': TransactionClassification.SELF_CUSTODY_WITHDRAWAL,
  'sale': TransactionClassification.SALE,
  'exchange_transfer': TransactionClassification.EXCHANGE_TRANSFER,
  'other': TransactionClassification.SKIP,  // Map old "other" to skip for user review
  'skip': TransactionClassification.SKIP,
};

/**
 * Validate localStorage data on app startup
 */
export const validateStoredData = (): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    canMigrate: false,
    requiresReset: false,
    migratableTransactions: 0,
    invalidTransactions: 0
  };

  try {
    // Check for stored data
    const storedTransactions = localStorage.getItem('btc-tracker:transactions');
    const storedVersion = localStorage.getItem('btc-tracker:schema-version');
    
    if (!storedTransactions) {
      // No stored data - fresh start
      return result;
    }

    // Validate schema version
    result.schemaVersion = storedVersion || 'unknown';
    if (!storedVersion || storedVersion !== CURRENT_SCHEMA_VERSION) {
      result.errors.push({
        type: 'SCHEMA_VERSION',
        message: `Data was created with ${storedVersion || 'unknown'} schema, current is ${CURRENT_SCHEMA_VERSION}`,
        details: 'Data structure may have changed and require migration or reset'
      });
      result.isValid = false;
      result.requiresReset = !canMigrateVersion(storedVersion);
      result.canMigrate = canMigrateVersion(storedVersion);
    }

    // Parse and validate transactions
    let transactions: any[] = [];
    try {
      transactions = JSON.parse(storedTransactions);
      if (!Array.isArray(transactions)) {
        throw new Error('Transactions data is not an array');
      }
    } catch (parseError) {
      result.errors.push({
        type: 'CORRUPT_DATA',
        message: 'Unable to parse stored transaction data',
        details: 'Data may be corrupted and requires reset'
      });
      result.isValid = false;
      result.requiresReset = true;
      return result;
    }

    // Validate individual transactions
    const validationResults = transactions.map((tx, index) => validateTransaction(tx, index));
    const invalidCount = validationResults.filter(r => !r.isValid).length;
    const migratableCount = validationResults.filter(r => r.canMigrate).length;

    result.invalidTransactions = invalidCount;
    result.migratableTransactions = migratableCount;

    // Collect errors and warnings
    validationResults.forEach(txResult => {
      result.errors.push(...txResult.errors);
      result.warnings.push(...txResult.warnings);
    });

    // Determine overall validity
    if (invalidCount > 0) {
      result.isValid = false;
      if (migratableCount < transactions.length * 0.8) {
        // If less than 80% can be migrated, recommend reset
        result.requiresReset = true;
        result.canMigrate = false;
      }
    }

  } catch (error) {
    result.errors.push({
      type: 'CORRUPT_DATA',
      message: 'Unexpected error validating stored data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    result.isValid = false;
    result.requiresReset = true;
  }

  return result;
};

/**
 * Validate individual transaction
 */
interface TransactionValidationResult {
  isValid: boolean;
  canMigrate: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

const validateTransaction = (tx: any, index: number): TransactionValidationResult => {
  const result: TransactionValidationResult = {
    isValid: true,
    canMigrate: true,
    errors: [],
    warnings: []
  };

  const txId = tx.id || `transaction-${index}`;

  // Check required fields
  if (!tx.id || !tx.date || tx.btcAmount === undefined) {
    result.errors.push({
      type: 'INVALID_TRANSACTION',
      message: `Transaction ${txId} missing required fields`,
      details: 'Required: id, date, btcAmount',
      affectedTransactions: [txId]
    });
    result.isValid = false;
    result.canMigrate = false;
    return result;
  }

  // Validate transaction type/classification
  if (tx.type && !isValidClassification(tx.type)) {
    if (canMigrateClassification(tx.type)) {
      result.warnings.push({
        type: 'OUTDATED_CLASSIFICATION',
        message: `Transaction ${txId} uses outdated classification: ${tx.type}`,
        details: `Will be migrated to: ${LEGACY_CLASSIFICATION_MAP[tx.type] || 'SKIP'}`,
        affectedTransactions: [txId]
      });
    } else {
      result.errors.push({
        type: 'UNSUPPORTED_CLASSIFICATION',
        message: `Transaction ${txId} has unsupported classification: ${tx.type}`,
        details: 'Classification not recognized and cannot be migrated',
        affectedTransactions: [txId]
      });
      result.isValid = false;
      result.canMigrate = false;
    }
  }

  // Check for deprecated fields
  if (tx.withdrawalWallet && !tx.destinationWallet) {
    result.warnings.push({
      type: 'DEPRECATED_FIELD',
      message: `Transaction ${txId} uses deprecated field 'withdrawalWallet'`,
      details: 'Will be migrated to destinationWallet field',
      affectedTransactions: [txId]
    });
  }

  return result;
};

/**
 * Check if schema version can be migrated
 */
const canMigrateVersion = (version: string | null): boolean => {
  if (!version) return false;
  
  // Define migration paths
  const migratableVersions = ['0.3.0', '0.4.0'];
  return migratableVersions.includes(version);
};

/**
 * Check if classification is valid in current schema
 */
const isValidClassification = (classification: string): boolean => {
  return Object.values(TransactionClassification).includes(classification as TransactionClassification);
};

/**
 * Check if legacy classification can be migrated
 */
const canMigrateClassification = (classification: string): boolean => {
  return classification in LEGACY_CLASSIFICATION_MAP;
};

/**
 * Perform data migration if possible
 */
export const migrateData = (options: MigrationOptions): { success: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  try {
    const storedTransactions = localStorage.getItem('btc-tracker:transactions');
    if (!storedTransactions) {
      return { success: true, errors: [] };
    }

    const transactions = JSON.parse(storedTransactions);
    const migratedTransactions: Transaction[] = [];

    transactions.forEach((tx: any, index: number) => {
      try {
        const migrated = migrateTransaction(tx, options);
        if (migrated) {
          migratedTransactions.push(migrated);
        } else if (!options.skipInvalidTransactions) {
          errors.push(`Failed to migrate transaction ${tx.id || index}`);
        }
      } catch (error) {
        errors.push(`Error migrating transaction ${tx.id || index}: ${error}`);
      }
    });

    if (errors.length === 0 || options.skipInvalidTransactions) {
      // Save migrated data
      localStorage.setItem('btc-tracker:transactions', JSON.stringify(migratedTransactions));
      localStorage.setItem('btc-tracker:schema-version', CURRENT_SCHEMA_VERSION);
      return { success: true, errors };
    }

  } catch (error) {
    errors.push(`Migration failed: ${error}`);
  }

  return { success: false, errors };
};

/**
 * Migrate individual transaction
 */
const migrateTransaction = (tx: any, options: MigrationOptions): Transaction | null => {
  try {
    const migrated: Transaction = {
      id: tx.id,
      date: new Date(tx.date),
      exchange: tx.exchange || 'Unknown',
      type: migrateClassification(tx.type) || 'Purchase',
      usdAmount: tx.usdAmount || 0,
      btcAmount: tx.btcAmount,
      price: tx.price || (tx.usdAmount && tx.btcAmount ? tx.usdAmount / tx.btcAmount : 0),
      
      // Migrate deprecated fields
      destinationWallet: tx.destinationWallet || tx.withdrawalWallet,
      networkFee: tx.networkFee,
      networkFeeUsd: tx.networkFeeUsd,
      isSelfCustody: tx.isSelfCustody,
      notes: tx.notes,
      isTaxable: tx.isTaxable
    };

    return migrated;
  } catch (error) {
    return null;
  }
};

/**
 * Migrate classification to new enum
 */
const migrateClassification = (oldType: string): string | null => {
  return LEGACY_CLASSIFICATION_MAP[oldType] || null;
};

/**
 * Export current data for backup before reset
 */
export const exportDataForBackup = (): { success: boolean; data?: string; filename: string } => {
  try {
    const storedData = {
      version: localStorage.getItem('btc-tracker:schema-version'),
      exportDate: new Date().toISOString(),
      transactions: localStorage.getItem('btc-tracker:transactions'),
      settings: localStorage.getItem('btc-tracker:settings')
    };

    const dataStr = JSON.stringify(storedData, null, 2);
    const filename = `btc-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    return { success: true, data: dataStr, filename };
  } catch (error) {
    return { success: false, filename: 'backup-failed.json' };
  }
};

/**
 * Clear all stored data (nuclear option)
 */
export const clearAllData = (): void => {
  const keys = ['btc-tracker:transactions', 'btc-tracker:schema-version', 'btc-tracker:settings'];
  keys.forEach(key => localStorage.removeItem(key));
  
  // Set current schema version for fresh start
  localStorage.setItem('btc-tracker:schema-version', CURRENT_SCHEMA_VERSION);
};