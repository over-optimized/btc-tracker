import { Transaction } from '../types/Transaction';
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

interface RawTransactionData {
  rawData: any;
  exchange: string;
}

export const enhancedExchangeParsers = {
  strike: (row: any, index: number): RawTransactionData | null => {
    if (!row['Date & Time (UTC)'] || !row['Transaction Type']) return null;

    // Now we capture ALL transaction types, not just purchases
    const transactionType = row['Transaction Type'];
    const date = parseDate(row['Date & Time (UTC)']);
    const usdAmount = parseFloat(row['Amount USD'] || 0);
    const btcAmount = parseFloat(row['Amount BTC'] || 0);
    const price = parseFloat(row['BTC Price'] || 0);
    const reference = row['Reference'];

    // Only skip if we have no meaningful data
    if (btcAmount === 0 && usdAmount === 0) return null;

    return {
      rawData: {
        ...row,
        // Normalized fields for easier processing
        parsedDate: date,
        parsedUsdAmount: usdAmount,
        parsedBtcAmount: btcAmount,
        parsedPrice: price,
        parsedReference: reference,
        parsedType: transactionType,
      },
      exchange: 'Strike',
    };
  },

  coinbase: (row: any, index: number): RawTransactionData | null => {
    // Check if we have the basic required fields
    if (!row['Transaction Type'] && !row['Type']) return null;

    const date = parseDate(row['Timestamp'] || row['Date']);
    const transactionType = row['Transaction Type'] || row['Type'];

    // Handle multiple possible field names for amounts
    const usdAmount = parseFloat(
      row['USD Spot Price at Transaction'] ||
        row['Total (inclusive of fees)'] ||
        row['Subtotal'] ||
        row['Total'] ||
        row['Amount (USD)'] ||
        0,
    );

    const btcAmount = parseFloat(
      row['Quantity Transacted'] || 
      row['Amount'] || 
      row['Amount (BTC)'] ||
      row['Size'] ||
      0,
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

    // Only skip if we have no meaningful data
    if (btcAmount === 0 && usdAmount === 0) return null;

    return {
      rawData: {
        ...row,
        // Normalized fields
        parsedDate: date,
        parsedUsdAmount: usdAmount,
        parsedBtcAmount: btcAmount,
        parsedPrice: price,
        parsedReference: reference,
        parsedType: transactionType,
      },
      exchange: 'Coinbase',
    };
  },

  kraken: (row: any, index: number): RawTransactionData | null => {
    // Check for various transaction types, not just trades
    if (!row['type'] && !row['Type']) return null;

    const transactionType = row['type'] || row['Type'];
    const date = parseDate(row['time'] || row['date'] || row['Date']);
    
    // For trades, check if it's Bitcoin-related
    if (transactionType === 'trade') {
      const pair = row['pair'] || '';
      if (!pair.includes('USD') || !pair.includes('XBT')) return null;
    }

    const usdAmount = Math.abs(parseFloat(row['cost'] || row['amount'] || 0));
    const btcAmount = parseFloat(row['vol'] || row['volume'] || row['amount'] || 0);
    const price = parseFloat(row['price'] || 0);

    // Try to get reference from various possible fields
    const reference = row['txid'] || row['refid'] || row['ordertxid'] || row['id'];

    // Only skip if we have no meaningful data
    if (btcAmount === 0 && usdAmount === 0) return null;

    return {
      rawData: {
        ...row,
        // Normalized fields
        parsedDate: date,
        parsedUsdAmount: usdAmount,
        parsedBtcAmount: btcAmount,
        parsedPrice: price,
        parsedReference: reference,
        parsedType: transactionType,
      },
      exchange: 'Kraken',
    };
  },

  generic: (row: any, index: number): RawTransactionData => {
    // Generic fallback parser - accept any row with date info
    const date = parseDate(row.Date || row.date || row.Timestamp || row.timestamp);
    const usdAmount = parseFloat(
      row['USD Amount'] ||
        row['Amount (USD)'] ||
        row.Amount ||
        row['Fiat Amount'] ||
        row['Total'] ||
        row['Cost'] ||
        0,
    );
    const btcAmount = parseFloat(
      row['BTC Amount'] ||
        row['Amount (BTC)'] ||
        row.Bitcoin ||
        row['Crypto Amount'] ||
        row['Volume'] ||
        0,
    );
    const exchange = row.Exchange || row.exchange || 'Generic';
    const transactionType = row.Type || row.type || row['Transaction Type'] || 'Unknown';
    const price = parseFloat(
      row.Price ||
        row.price ||
        row['BTC Price'] ||
        row['Unit Price'] ||
        (btcAmount !== 0 ? Math.abs(usdAmount / btcAmount) : 0),
    );

    // Try to get reference from various possible fields
    const reference =
      row.Reference || row.reference || row.ID || row.id || row['Transaction ID'] || row['Ref'];

    return {
      rawData: {
        ...row,
        // Normalized fields
        parsedDate: date,
        parsedUsdAmount: usdAmount,
        parsedBtcAmount: btcAmount,
        parsedPrice: price,
        parsedReference: reference,
        parsedType: transactionType,
      },
      exchange,
    };
  },
};

/**
 * Detect exchange format from CSV headers (enhanced version)
 */
export function detectExchangeFormat(headers: string[]): string {
  const headerStr = headers.join(' ').toLowerCase();

  // Strike detection
  if (headerStr.includes('date & time (utc)') && headerStr.includes('transaction type')) {
    return 'strike';
  }

  // Coinbase detection
  if (headerStr.includes('timestamp') && (headerStr.includes('transaction type') || headerStr.includes('quantity transacted'))) {
    return 'coinbase';
  }

  // Kraken detection  
  if (headerStr.includes('txid') || (headerStr.includes('type') && headerStr.includes('pair'))) {
    return 'kraken';
  }

  // Default to generic
  return 'generic';
}

/**
 * Parse all rows from a CSV file using enhanced parsers
 */
export function parseAllTransactions(
  rows: any[], 
  exchangeType: string
): RawTransactionData[] {
  const parser = enhancedExchangeParsers[exchangeType as keyof typeof enhancedExchangeParsers];
  
  if (!parser) {
    return rows.map((row, index) => enhancedExchangeParsers.generic(row, index));
  }

  const results: RawTransactionData[] = [];
  
  for (let i = 0; i < rows.length; i++) {
    const result = parser(rows[i], i);
    if (result) {
      results.push(result);
    }
  }
  
  return results;
}