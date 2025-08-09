/**
 * Tax calculation types and interfaces for the Bitcoin DCA Tracker
 * Supports FIFO, LIFO, HIFO, and Specific Identification methods
 */

export enum TaxMethod {
  FIFO = 'FIFO', // First In, First Out
  LIFO = 'LIFO', // Last In, First Out  
  HIFO = 'HIFO', // Highest In, First Out
  SPECIFIC_ID = 'SPECIFIC_ID', // Specific Identification
}

export enum HoldingPeriod {
  SHORT_TERM = 'SHORT_TERM', // <= 1 year
  LONG_TERM = 'LONG_TERM',   // > 1 year
}

export enum TaxEventType {
  ACQUISITION = 'ACQUISITION', // Purchase of Bitcoin
  DISPOSAL = 'DISPOSAL',       // Sale or disposal of Bitcoin
}

/**
 * Represents a tax lot - a specific purchase with tracked cost basis
 */
export interface TaxLot {
  id: string;                    // Unique identifier for this lot
  transactionId: string;         // Reference to original transaction
  purchaseDate: Date;           // Date of acquisition
  btcAmount: number;            // Original BTC amount in this lot
  remaining: number;            // Remaining BTC in this lot (after partial disposals)
  costBasis: number;            // Original USD cost for this lot
  pricePerBtc: number;          // Price per BTC at time of purchase
  exchange: string;             // Exchange where purchased
}

/**
 * Represents a taxable event (acquisition or disposal)
 */
export interface TaxEvent {
  id: string;
  type: TaxEventType;
  date: Date;
  btcAmount: number;
  usdValue: number;
  
  // Disposal-specific fields
  costBasis?: number;           // Cost basis for disposed BTC
  capitalGain?: number;         // Gain or loss (can be negative)
  holdingPeriod?: HoldingPeriod; // Short-term or long-term
  disposedLots?: DisposedLot[]; // Which lots were used for this disposal
  
  // Reference to original transaction
  transactionId?: string;
  
  // Metadata
  exchange?: string;
  notes?: string;
}

/**
 * Tracks which lots were used in a disposal and how much
 */
export interface DisposedLot {
  lotId: string;
  btcAmount: number;            // Amount taken from this lot
  costBasis: number;            // Cost basis for this portion
  purchaseDate: Date;           // Original purchase date
  holdingPeriod: HoldingPeriod; // Holding period for this disposal
}

/**
 * Summary of tax calculations for a specific period
 */
export interface TaxSummary {
  totalGains: number;           // Total capital gains
  totalLosses: number;          // Total capital losses (negative gains)
  netGains: number;             // Total gains - total losses
  shortTermGains: number;       // Gains on assets held <= 1 year
  longTermGains: number;        // Gains on assets held > 1 year
  shortTermLosses: number;      // Losses on assets held <= 1 year
  longTermLosses: number;       // Losses on assets held > 1 year
  
  // Count statistics
  totalDisposals: number;       // Number of disposal events
  shortTermDisposals: number;   // Number of short-term disposals
  longTermDisposals: number;    // Number of long-term disposals
  
  // Portfolio information
  totalCostBasis: number;       // Total cost basis of all lots
  remainingBtc: number;         // BTC still held (not disposed)
  remainingCostBasis: number;   // Cost basis of remaining BTC
  unrealizedGains: number;      // Unrealized gains at current price
}

/**
 * Complete tax report for a specific year and method
 */
export interface TaxReport {
  taxYear: number;              // Tax year (e.g., 2024)
  method: TaxMethod;            // Calculation method used
  generatedAt: Date;            // When this report was generated
  
  // Summary information
  summary: TaxSummary;
  
  // Detailed events
  acquisitions: TaxEvent[];     // All purchase events
  disposals: TaxEvent[];        // All sale/disposal events
  
  // Current portfolio state
  remainingLots: TaxLot[];      // Lots still held
  
  // Metadata
  startDate: Date;              // Start of tax year
  endDate: Date;                // End of tax year
  totalTransactions: number;    // Number of transactions processed
  
  // Validation
  isComplete: boolean;          // All required data present
  warnings: string[];           // Any calculation warnings
  errors: string[];             // Any calculation errors
}

/**
 * Configuration for tax calculations
 */
export interface TaxConfiguration {
  method: TaxMethod;            // Preferred calculation method
  taxYear: number;              // Tax year to calculate
  longTermThresholdDays: number; // Days for long-term classification (default: 365)
  
  // Optional disposal information (for future use)
  disposals?: DisposalEvent[];
  
  // Display preferences
  includePreviousYears: boolean; // Include prior year carryovers
  showDetailedLots: boolean;     // Show individual lot details
  roundToCents: boolean;         // Round currency to cents
}

/**
 * Manual disposal event (for future use when users sell BTC)
 */
export interface DisposalEvent {
  id: string;
  date: Date;
  btcAmount: number;            // Amount sold
  salePrice: number;            // Price per BTC at sale
  totalProceeds: number;        // Total USD received
  fees?: number;                // Transaction fees
  exchange?: string;            // Where the sale occurred
  notes?: string;               // User notes
}

/**
 * Validation result for tax calculations
 */
export interface TaxValidationResult {
  isValid: boolean;
  errors: TaxValidationError[];
  warnings: TaxValidationWarning[];
}

export interface TaxValidationError {
  code: string;
  message: string;
  details?: string;
  lotId?: string;
  eventId?: string;
}

export interface TaxValidationWarning {
  code: string;
  message: string;
  details?: string;
  suggestion?: string;
}

/**
 * Export format options for tax reports
 */
export enum TaxExportFormat {
  CSV = 'CSV',                  // Comma-separated values
  JSON = 'JSON',                // JSON format for developers
  PDF = 'PDF',                  // PDF report (future)
  FORM_8949 = 'FORM_8949',     // IRS Form 8949 format (future)
  TURBOTAX = 'TURBOTAX',       // TurboTax import format
}

/**
 * Options for tax export
 */
export interface TaxExportOptions {
  format: TaxExportFormat;
  includeDetailedLots: boolean;
  includeSummaryOnly: boolean;
  dateFormat?: string;          // Date format preference
  currencyPrecision?: number;   // Number of decimal places
}

/**
 * Current price for unrealized gain calculations
 */
export interface PriceInfo {
  price: number;                // Current BTC price
  timestamp: Date;              // When price was fetched
  source: string;               // Price source (e.g., "CoinGecko")
}