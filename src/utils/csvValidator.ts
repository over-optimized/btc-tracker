import { ImportError, ImportErrorType, ValidationWarning, FileValidationResult } from '../types/ImportError';

export interface CSVValidationResult {
  isValid: boolean;
  detectedFormat: 'strike' | 'coinbase' | 'kraken' | 'generic' | 'unknown';
  errors: ImportError[];
  warnings: ValidationWarning[];
  requiredColumns: string[];
  foundColumns: string[];
}

const EXCHANGE_FORMATS = {
  strike: {
    requiredColumns: ['Reference', 'Date & Time (UTC)', 'Transaction Type', 'Amount USD', 'Amount BTC'],
    optionalColumns: ['BTC Price'],
    signatures: ['Reference', 'Date & Time (UTC)', 'Transaction Type'],
    transactionTypes: ['Purchase'],
  },
  coinbase: {
    requiredColumns: ['Transaction Type', 'Timestamp'],
    optionalColumns: ['Quantity Transacted', 'USD Spot Price at Transaction', 'Subtotal', 'Total'],
    signatures: ['Transaction Type', 'Timestamp'],
    transactionTypes: ['Buy', 'Purchase'],
  },
  kraken: {
    requiredColumns: ['type', 'pair', 'time'],
    optionalColumns: ['cost', 'vol', 'price', 'txid'],
    signatures: ['type', 'pair', 'time'],
    transactionTypes: ['trade'],
  },
  generic: {
    requiredColumns: ['Date', 'USD Amount', 'BTC Amount'],
    optionalColumns: ['Exchange', 'Type', 'Price'],
    signatures: ['Date'],
    transactionTypes: [],
  },
};

export function validateFile(file: File): FileValidationResult {
  const errors: ImportError[] = [];
  const warnings: ValidationWarning[] = [];

  // File size validation (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push({
      type: ImportErrorType.FILE_READ_ERROR,
      message: `File size too large: ${(file.size / 1024 / 1024).toFixed(1)}MB`,
      details: `Maximum allowed size is ${maxSize / 1024 / 1024}MB`,
      suggestions: ['Try splitting your CSV into smaller files', 'Remove unnecessary columns or rows'],
      recoverable: false,
    });
  }

  // File type validation
  const allowedTypes = ['.csv', 'text/csv', 'application/csv'];
  const hasValidType = allowedTypes.some(type => 
    file.type === type || file.name.toLowerCase().endsWith('.csv')
  );

  if (!hasValidType) {
    errors.push({
      type: ImportErrorType.INVALID_CSV_FORMAT,
      message: 'Invalid file type',
      details: `File type: ${file.type || 'unknown'}, File name: ${file.name}`,
      suggestions: ['Ensure your file has a .csv extension', 'Export data as CSV from your exchange'],
      recoverable: false,
    });
  }

  // File name suggestions
  if (file.size < 100) {
    warnings.push({
      type: 'SUSPICIOUS_DATA',
      message: 'File appears to be very small',
      details: `File size: ${file.size} bytes`,
      suggestions: ['Verify the file contains transaction data', 'Check if export completed successfully'],
      recoverable: true,
    });
  }

  return {
    isValid: errors.length === 0,
    fileSize: file.size,
    lineCount: 0, // Will be determined after parsing
    errors,
    warnings,
  };
}

export function validateCSVStructure(headers: string[], data: any[]): CSVValidationResult {
  const errors: ImportError[] = [];
  const warnings: ValidationWarning[] = [];
  let detectedFormat: CSVValidationResult['detectedFormat'] = 'unknown';
  let requiredColumns: string[] = [];
  let foundColumns = headers;

  // Detect format based on headers
  for (const [format, config] of Object.entries(EXCHANGE_FORMATS)) {
    const matchedSignatures = config.signatures.filter(sig => 
      headers.some(header => header.toLowerCase().includes(sig.toLowerCase()))
    );

    if (matchedSignatures.length >= Math.ceil(config.signatures.length * 0.7)) {
      detectedFormat = format as CSVValidationResult['detectedFormat'];
      requiredColumns = config.requiredColumns;
      break;
    }
  }

  // Validate required columns
  if (detectedFormat !== 'unknown') {
    const config = EXCHANGE_FORMATS[detectedFormat];
    const missingColumns = config.requiredColumns.filter(required => 
      !headers.some(header => header.toLowerCase() === required.toLowerCase())
    );

    if (missingColumns.length > 0) {
      errors.push({
        type: ImportErrorType.MISSING_REQUIRED_COLUMNS,
        message: `Missing required columns for ${detectedFormat} format`,
        details: `Missing: ${missingColumns.join(', ')}`,
        suggestions: [
          `Ensure you exported the correct format from ${detectedFormat}`,
          'Check column names match expected format',
          'Try using generic format if columns are named differently',
        ],
        recoverable: true,
      });
    }
  }

  // Validate data consistency
  if (data.length === 0) {
    errors.push({
      type: ImportErrorType.EMPTY_FILE,
      message: 'CSV file contains no data rows',
      details: 'File has headers but no transaction data',
      suggestions: [
        'Verify your exchange export included transaction data',
        'Check date range filters in your export',
      ],
      recoverable: false,
    });
  }

  // Check for suspicious patterns
  if (data.length > 1000) {
    warnings.push({
      type: 'SUSPICIOUS_DATA',
      message: 'Large number of transactions detected',
      details: `${data.length} rows found`,
      suggestions: [
        'Consider processing in smaller batches if import is slow',
        'Verify this is the intended data range',
      ],
      recoverable: true,
    });
  }

  // Check for duplicate headers
  const duplicateHeaders = headers.filter((header, index) => 
    headers.indexOf(header) !== index
  );
  
  if (duplicateHeaders.length > 0) {
    warnings.push({
      type: 'FORMAT_INCONSISTENCY',
      message: 'Duplicate column headers detected',
      details: `Duplicates: ${duplicateHeaders.join(', ')}`,
      suggestions: [
        'Remove duplicate columns from your CSV',
        'Check your export settings',
      ],
      recoverable: true,
    });
  }

  return {
    isValid: errors.length === 0,
    detectedFormat,
    errors,
    warnings,
    requiredColumns,
    foundColumns,
  };
}

export function validateTransactionRow(row: any, format: string, rowIndex: number): ImportError[] {
  const errors: ImportError[] = [];

  if (!row || typeof row !== 'object') {
    errors.push({
      type: ImportErrorType.INVALID_DATA_VALUES,
      message: 'Invalid row data',
      details: `Row ${rowIndex + 1}: Empty or malformed data`,
      rowNumber: rowIndex + 1,
      suggestions: ['Check for empty rows or formatting issues'],
      recoverable: false,
    });
    return errors;
  }

  const config = EXCHANGE_FORMATS[format as keyof typeof EXCHANGE_FORMATS];
  if (!config) return errors;

  // Validate required fields
  for (const required of config.requiredColumns) {
    const value = row[required];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push({
        type: ImportErrorType.INVALID_DATA_VALUES,
        message: `Missing required field: ${required}`,
        details: `Row ${rowIndex + 1}: ${required} is empty or missing`,
        rowNumber: rowIndex + 1,
        suggestions: [`Ensure ${required} column has valid data`],
        recoverable: false,
      });
    }
  }

  // Format-specific validations
  switch (format) {
    case 'strike':
      validateStrikeRow(row, rowIndex, errors);
      break;
    case 'coinbase':
      validateCoinbaseRow(row, rowIndex, errors);
      break;
    case 'kraken':
      validateKrakenRow(row, rowIndex, errors);
      break;
    case 'generic':
      validateGenericRow(row, rowIndex, errors);
      break;
  }

  return errors;
}

function validateStrikeRow(row: any, rowIndex: number, errors: ImportError[]): void {
  // Validate transaction type
  if (row['Transaction Type'] !== 'Purchase') {
    errors.push({
      type: ImportErrorType.INVALID_DATA_VALUES,
      message: 'Unsupported transaction type',
      details: `Row ${rowIndex + 1}: Found "${row['Transaction Type']}", expected "Purchase"`,
      rowNumber: rowIndex + 1,
      suggestions: ['Only Purchase transactions are supported', 'Filter your export to Purchase transactions only'],
      recoverable: false,
    });
  }

  // Validate amounts
  validateAmountField(row, 'Amount USD', rowIndex, errors);
  validateAmountField(row, 'Amount BTC', rowIndex, errors);
  
  // Validate date
  validateDateField(row, 'Date & Time (UTC)', rowIndex, errors);
}

function validateCoinbaseRow(row: any, rowIndex: number, errors: ImportError[]): void {
  const validTypes = ['Buy', 'Purchase'];
  if (!validTypes.includes(row['Transaction Type'])) {
    errors.push({
      type: ImportErrorType.INVALID_DATA_VALUES,
      message: 'Unsupported transaction type',
      details: `Row ${rowIndex + 1}: Found "${row['Transaction Type']}", expected one of: ${validTypes.join(', ')}`,
      rowNumber: rowIndex + 1,
      suggestions: ['Only Buy/Purchase transactions are supported'],
      recoverable: false,
    });
  }

  validateDateField(row, 'Timestamp', rowIndex, errors);
}

function validateKrakenRow(row: any, rowIndex: number, errors: ImportError[]): void {
  if (row['type'] !== 'trade') {
    errors.push({
      type: ImportErrorType.INVALID_DATA_VALUES,
      message: 'Unsupported transaction type',
      details: `Row ${rowIndex + 1}: Found "${row['type']}", expected "trade"`,
      rowNumber: rowIndex + 1,
      suggestions: ['Only trade transactions are supported'],
      recoverable: false,
    });
  }

  // Validate pair contains Bitcoin
  const pair = row['pair'] || '';
  if (!pair.includes('XBT') && !pair.includes('BTC')) {
    errors.push({
      type: ImportErrorType.INVALID_DATA_VALUES,
      message: 'Non-Bitcoin trading pair',
      details: `Row ${rowIndex + 1}: Pair "${pair}" does not contain Bitcoin`,
      rowNumber: rowIndex + 1,
      suggestions: ['Only Bitcoin trading pairs are supported'],
      recoverable: false,
    });
  }

  validateDateField(row, 'time', rowIndex, errors);
}

function validateGenericRow(row: any, rowIndex: number, errors: ImportError[]): void {
  validateAmountField(row, 'USD Amount', rowIndex, errors);
  validateAmountField(row, 'BTC Amount', rowIndex, errors);
  validateDateField(row, 'Date', rowIndex, errors);
}

function validateAmountField(row: any, fieldName: string, rowIndex: number, errors: ImportError[]): void {
  const value = row[fieldName];
  if (value === undefined || value === null) return;

  const numValue = parseFloat(value);
  if (isNaN(numValue) || numValue <= 0) {
    errors.push({
      type: ImportErrorType.INVALID_DATA_VALUES,
      message: `Invalid amount value: ${fieldName}`,
      details: `Row ${rowIndex + 1}: "${value}" is not a valid positive number`,
      rowNumber: rowIndex + 1,
      suggestions: [`Ensure ${fieldName} contains valid numeric values`],
      recoverable: false,
    });
  }
}

function validateDateField(row: any, fieldName: string, rowIndex: number, errors: ImportError[]): void {
  const value = row[fieldName];
  if (!value) return;

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    errors.push({
      type: ImportErrorType.INVALID_DATA_VALUES,
      message: `Invalid date format: ${fieldName}`,
      details: `Row ${rowIndex + 1}: "${value}" is not a valid date`,
      rowNumber: rowIndex + 1,
      suggestions: [
        'Ensure date is in a recognized format (YYYY-MM-DD, MM/DD/YYYY, etc.)',
        'Check your export date format settings',
      ],
      recoverable: false,
    });
  }

  // Check for future dates
  if (date > new Date()) {
    errors.push({
      type: ImportErrorType.INVALID_DATA_VALUES,
      message: `Future date detected: ${fieldName}`,
      details: `Row ${rowIndex + 1}: "${value}" is in the future`,
      rowNumber: rowIndex + 1,
      suggestions: ['Verify the date is correct', 'Check timezone settings'],
      recoverable: true,
    });
  }
}

export function generateErrorSuggestions(error: ImportError): string[] {
  const suggestions = [...(error.suggestions || [])];

  switch (error.type) {
    case ImportErrorType.MISSING_REQUIRED_COLUMNS:
      suggestions.push(
        'Double-check your exchange export settings',
        'Try using the Generic format if column names differ',
        'Contact support if you believe this is correct data'
      );
      break;

    case ImportErrorType.INVALID_CSV_FORMAT:
      suggestions.push(
        'Ensure file is saved as CSV format',
        'Try opening in Excel and re-saving as CSV',
        'Check for special characters in the file'
      );
      break;

    case ImportErrorType.EMPTY_FILE:
      suggestions.push(
        'Verify your date range includes transactions',
        'Check export filters and settings',
        'Ensure you have completed transactions to export'
      );
      break;

    default:
      suggestions.push('Contact support if this error persists');
      break;
  }

  return suggestions;
}