import { Transaction } from 'types/Transaction';

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
  strike: (row: any, index: number): Transaction | null => {
    if (!row['Date & Time (UTC)'] || !row['Transaction Type']) return null;

    const transactionType = row['Transaction Type'];
    if (transactionType !== 'Purchase') return null;

    // Use Reference as unique id if available
    const reference = row['Reference'] || `strike-unknown-${index}`;
    return {
      id: `strike-${reference}`,
      date: parseDate(row['Date & Time (UTC)']),
      exchange: 'Strike',
      type: transactionType,
      usdAmount: Math.abs(parseFloat(row['Amount USD'] || 0)),
      btcAmount: Math.abs(parseFloat(row['Amount BTC'] || 0)),
      price: parseFloat(row['BTC Price'] || 0),
    };
  },

  coinbase: (row: any, index: number): Transaction | null => {
    // Common Coinbase formats
    if (
      row['Transaction Type'] &&
      (row['Transaction Type'] === 'Buy' || row['Transaction Type'] === 'Purchase')
    ) {
      return {
        id: `coinbase-${Date.now()}-${index}`,
        date: parseDate(row['Timestamp'] || row['Date']),
        exchange: 'Coinbase',
        type: row['Transaction Type'],
        usdAmount: Math.abs(
          parseFloat(
            row['USD Spot Price at Transaction'] ||
              row['Total (inclusive of fees)'] ||
              row['Subtotal'] ||
              0,
          ),
        ),
        btcAmount: Math.abs(parseFloat(row['Quantity Transacted'] || row['Amount'] || 0)),
        price: parseFloat(row['USD Spot Price at Transaction'] || 0),
      };
    }
    return null;
  },

  kraken: (row: any, index: number): Transaction | null => {
    // Common Kraken formats
    if (row['type'] && row['type'] === 'trade') {
      const pair = row['pair'] || '';
      if (!pair.includes('USD') || !pair.includes('XBT')) return null;

      return {
        id: `kraken-${Date.now()}-${index}`,
        date: parseDate(row['time'] || row['date']),
        exchange: 'Kraken',
        type: 'Buy',
        usdAmount: Math.abs(parseFloat(row['cost'] || row['vol'] || 0)),
        btcAmount: Math.abs(parseFloat(row['vol'] || 0)),
        price: parseFloat(row['price'] || 0),
      };
    }
    return null;
  },

  generic: (row: any, index: number): Transaction => {
    // Generic fallback parser
    const date = parseDate(row.Date || row.date || row.Timestamp || row.timestamp);
    const usdAmount = parseFloat(
      row['USD Amount'] || row['Amount (USD)'] || row.Amount || row['Fiat Amount'] || 0,
    );
    const btcAmount = parseFloat(
      row['BTC Amount'] || row['Amount (BTC)'] || row.Bitcoin || row['Crypto Amount'] || 0,
    );
    const exchange = row.Exchange || row.exchange || 'Unknown';
    const type = row.Type || row.type || 'Buy';

    return {
      id: `generic-${Date.now()}-${index}`,
      date,
      exchange,
      type,
      usdAmount: Math.abs(usdAmount),
      btcAmount: Math.abs(btcAmount),
      price: btcAmount > 0 ? usdAmount / btcAmount : 0,
    };
  },
};
