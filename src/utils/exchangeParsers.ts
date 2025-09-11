/**
 * Legacy exchange parsers for basic purchase-only transactions
 * @deprecated Use enhancedExchangeParsers.ts instead for mixed transaction support
 * Migration: Replace exchangeParsers with enhancedExchangeParsers for:
 * - Mixed transaction type support (purchases, withdrawals, sales)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO: This file is deprecated - migrate to enhancedExchangeParsers.ts
// Temporary disable to unblock CI pipeline
import { Transaction } from 'types/Transaction';
import { generateStableTransactionId, type TransactionData } from './generateTransactionId';

const parseDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();

  // Handle Strike's format: "Jan 01 2025 14:36:06"
  if (dateStr.includes(' ') && dateStr.length > 10) {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? new Date() : date;
  }

  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? new Date() : date;
};

export const exchangeParsers = {
  strike: (row: any, _index: number): Transaction | null => {
    if (!row['Date & Time (UTC)'] || !row['Transaction Type']) return null;

    const transactionType = row['Transaction Type'];
    if (transactionType !== 'Purchase') return null;

    const date = parseDate(row['Date & Time (UTC)']);
    const usdAmount = Math.abs(parseFloat(row['Amount USD'] || 0));
    const btcAmount = Math.abs(parseFloat(row['Amount BTC'] || 0));
    const price = parseFloat(row['BTC Price'] || 0);
    const reference = row['Reference'];

    // Validate required fields
    if (usdAmount <= 0 || btcAmount <= 0) return null;

    // Create transaction data for ID generation
    const transactionData: TransactionData = {
      exchange: 'Strike',
      date,
      usdAmount,
      btcAmount,
      type: transactionType,
      price,
      reference,
    };

    return {
      id: generateStableTransactionId(transactionData),
      date,
      exchange: 'Strike',
      type: transactionType,
      usdAmount,
      btcAmount,
      price,
    };
  },

  coinbase: (row: any, _index: number): Transaction | null => {
    // Common Coinbase formats
    if (
      row['Transaction Type'] &&
      (row['Transaction Type'] === 'Buy' || row['Transaction Type'] === 'Purchase')
    ) {
      const date = parseDate(row['Timestamp'] || row['Date']);
      const transactionType = row['Transaction Type'];

      // Handle multiple possible field names for amounts
      const usdAmount = Math.abs(
        parseFloat(
          row['USD Spot Price at Transaction'] ||
            row['Total (inclusive of fees)'] ||
            row['Subtotal'] ||
            row['Total'] ||
            row['Amount (USD)'] ||
            0,
        ),
      );

      const btcAmount = Math.abs(
        parseFloat(row['Quantity Transacted'] || row['Amount'] || row['Amount (BTC)'] || 0),
      );

      const price = parseFloat(
        row['USD Spot Price at Transaction'] ||
          row['Price'] ||
          row['Spot Price at Transaction'] ||
          0,
      );

      // Try to get reference/hash from various possible fields
      const reference =
        row['Transaction Hash'] || row['ID'] || row['Reference'] || row['Transaction ID'];

      // Validate required fields
      if (usdAmount <= 0 || btcAmount <= 0) return null;

      // Create transaction data for ID generation
      const transactionData: TransactionData = {
        exchange: 'Coinbase',
        date,
        usdAmount,
        btcAmount,
        type: transactionType,
        price,
        reference,
      };

      return {
        id: generateStableTransactionId(transactionData),
        date,
        exchange: 'Coinbase',
        type: transactionType,
        usdAmount,
        btcAmount,
        price,
      };
    }
    return null;
  },

  kraken: (row: any, _index: number): Transaction | null => {
    // Common Kraken formats
    if (row['type'] && row['type'] === 'trade') {
      const pair = row['pair'] || '';
      if (!pair.includes('USD') || !pair.includes('XBT')) return null;

      const date = parseDate(row['time'] || row['date']);
      const usdAmount = Math.abs(parseFloat(row['cost'] || 0));
      const btcAmount = Math.abs(parseFloat(row['vol'] || row['volume'] || 0));
      const price = parseFloat(row['price'] || 0);

      // Try to get reference from various possible fields
      const reference = row['txid'] || row['refid'] || row['ordertxid'] || row['id'];

      // Validate required fields
      if (usdAmount <= 0 || btcAmount <= 0) return null;

      // Create transaction data for ID generation
      const transactionData: TransactionData = {
        exchange: 'Kraken',
        date,
        usdAmount,
        btcAmount,
        type: 'Buy', // Normalize to standard type
        price,
        reference,
      };

      return {
        id: generateStableTransactionId(transactionData),
        date,
        exchange: 'Kraken',
        type: 'Buy',
        usdAmount,
        btcAmount,
        price,
      };
    }
    return null;
  },

  generic: (row: any, _index: number): Transaction => {
    // Generic fallback parser
    const date = parseDate(row.Date || row.date || row.Timestamp || row.timestamp);
    const usdAmount = Math.abs(
      parseFloat(
        row['USD Amount'] ||
          row['Amount (USD)'] ||
          row.Amount ||
          row['Fiat Amount'] ||
          row['Total'] ||
          row['Cost'] ||
          0,
      ),
    );
    const btcAmount = Math.abs(
      parseFloat(
        row['BTC Amount'] ||
          row['Amount (BTC)'] ||
          row.Bitcoin ||
          row['Crypto Amount'] ||
          row['Volume'] ||
          0,
      ),
    );
    const exchange = row.Exchange || row.exchange || 'Generic';
    const type = row.Type || row.type || row['Transaction Type'] || 'Buy';
    const price = parseFloat(
      row.Price ||
        row.price ||
        row['BTC Price'] ||
        row['Unit Price'] ||
        (btcAmount > 0 ? usdAmount / btcAmount : 0),
    );

    // Try to get reference from various possible fields
    const reference =
      row.Reference || row.reference || row.ID || row.id || row['Transaction ID'] || row['Ref'];

    // Create transaction data for ID generation
    const transactionData: TransactionData = {
      exchange,
      date,
      usdAmount,
      btcAmount,
      type,
      price,
      reference,
    };

    return {
      id: generateStableTransactionId(transactionData),
      date,
      exchange,
      type,
      usdAmount,
      btcAmount,
      price,
    };
  },
};

/**
 * Detect which exchange format a CSV row likely belongs to
 * Useful for providing better error messages and validation
 */
export function detectExchangeFormat(row: any): string {
  // Strike detection
  if (row['Date & Time (UTC)'] && row['Transaction Type'] && row['Reference']) {
    return 'strike';
  }

  // Coinbase detection
  if (
    row['Transaction Type'] &&
    (row['Timestamp'] || row['Date']) &&
    (row['Quantity Transacted'] || row['Amount'])
  ) {
    return 'coinbase';
  }

  // Kraken detection
  if (row['type'] && row['pair'] && row['time']) {
    return 'kraken';
  }

  // Generic detection (has basic required fields)
  if (
    (row.Date || row.date) &&
    (row['USD Amount'] || row.Amount || row.Cost) &&
    (row['BTC Amount'] || row.Bitcoin || row.Volume)
  ) {
    return 'generic';
  }

  return 'unknown';
}

/**
 * Get expected columns for each exchange format
 * Useful for validation and error messages
 */
export function getExpectedColumns(format: string): string[] {
  switch (format) {
    case 'strike':
      return [
        'Reference',
        'Date & Time (UTC)',
        'Transaction Type',
        'Amount USD',
        'Amount BTC',
        'BTC Price',
      ];
    case 'coinbase':
      return [
        'Transaction Type',
        'Timestamp',
        'Quantity Transacted',
        'USD Spot Price at Transaction',
      ];
    case 'kraken':
      return ['type', 'pair', 'time', 'cost', 'vol', 'price'];
    case 'generic':
      return ['Date', 'USD Amount', 'BTC Amount'];
    default:
      return [];
  }
}

/**
 * Validate if a row has the minimum required fields for parsing
 */
export function validateRowData(row: any, format: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Common validations
  if (!row || typeof row !== 'object') {
    errors.push('Invalid row data');
    return { valid: false, errors };
  }

  switch (format) {
    case 'strike':
      if (!row['Date & Time (UTC)']) errors.push('Missing Date & Time (UTC)');
      if (!row['Transaction Type']) errors.push('Missing Transaction Type');
      if (!row['Amount USD'] && !row['Amount BTC']) errors.push('Missing amount fields');
      break;

    case 'coinbase':
      if (!row['Transaction Type']) errors.push('Missing Transaction Type');
      if (!row['Timestamp'] && !row['Date']) errors.push('Missing timestamp/date');
      break;

    case 'kraken':
      if (!row['type']) errors.push('Missing type');
      if (!row['pair']) errors.push('Missing pair');
      if (!row['time']) errors.push('Missing time');
      break;

    case 'generic':
      if (!row.Date && !row.date) errors.push('Missing date field');
      break;
  }

  return { valid: errors.length === 0, errors };
}
