# Action Plan: Critical Features Implementation

## 🎯 Overview

This document outlines the implementation plan for three critical features that will significantly improve the Bitcoin DCA Tracker's reliability and user experience.

---

## 1. 🔧 Fix Transaction ID Generation

### Current Problem Analysis

- **Strike**: ✅ Good - Uses `Reference` field for stable IDs
- **Coinbase**: ❌ Problem - Uses `Date.now()` causing unstable IDs on re-imports
- **Kraken**: ❌ Problem - Uses `Date.now()` causing unstable IDs on re-imports
- **Generic**: ❌ Problem - Uses `Date.now()` causing unstable IDs on re-imports

### Solution Strategy

Create deterministic IDs based on transaction content rather than timestamps.

### Implementation Plan

#### Step 1: Create ID Generation Utility

```typescript
// src/utils/generateTransactionId.ts
interface TransactionData {
  exchange: string;
  date: Date;
  amount: number;
  type: string;
  reference?: string;
}

export function generateStableTransactionId(data: TransactionData): string {
  // Use reference if available (Strike)
  if (data.reference) {
    return `${data.exchange.toLowerCase()}-${data.reference}`;
  }

  // Create hash-like ID from transaction details
  const dateStr = data.date.toISOString().split('T')[0]; // YYYY-MM-DD
  const amountStr = data.amount.toFixed(8);
  const composite = `${data.exchange}-${dateStr}-${data.type}-${amountStr}`;

  // Simple hash function for deterministic IDs
  let hash = 0;
  for (let i = 0; i < composite.length; i++) {
    const char = composite.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return `${data.exchange.toLowerCase()}-${Math.abs(hash).toString(36)}`;
}
```

#### Step 2: Update Exchange Parsers

- Modify each parser to use the new ID generation utility
- Ensure all parsers collect necessary data for stable ID generation
- Add fallback mechanisms for edge cases

#### Step 3: Migration Strategy

- Add version tracking to localStorage data
- Implement data migration for existing users
- Provide clear feedback during migration

#### Step 4: Testing

- Unit tests for ID generation with various inputs
- Integration tests for parser updates
- Test deduplication with re-imported files

### Files to Modify

- `src/utils/exchangeParsers.ts` - Update all parser functions
- `src/utils/generateTransactionId.ts` - New utility file
- `src/utils/storage.ts` - Add migration logic
- Test files for comprehensive coverage

### Acceptance Criteria

- ✅ Re-importing the same CSV produces identical transaction IDs
- ✅ Different transactions always produce different IDs
- ✅ Existing user data migrates seamlessly
- ✅ All exchange parsers use stable ID generation

---

## 2. ⚠️ Enhanced Error Handling

### Current Problem Analysis

- Basic try-catch with generic alert messages
- No specific error types or user guidance
- Limited validation of CSV structure and content
- No graceful degradation for partial failures

### Solution Strategy

Implement comprehensive error handling with user-friendly feedback and recovery options.

### Implementation Plan

#### Step 1: Error Type System

```typescript
// src/types/ImportError.ts
export enum ImportErrorType {
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  INVALID_CSV_FORMAT = 'INVALID_CSV_FORMAT',
  MISSING_REQUIRED_COLUMNS = 'MISSING_REQUIRED_COLUMNS',
  INVALID_DATA_VALUES = 'INVALID_DATA_VALUES',
  EMPTY_FILE = 'EMPTY_FILE',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

export interface ImportError {
  type: ImportErrorType;
  message: string;
  details?: string;
  rowNumber?: number;
  suggestions?: string[];
  recoverable: boolean;
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  ignoredCount: number;
  errors: ImportError[];
  warnings: ImportError[];
  summary: string;
}
```

#### Step 2: CSV Validation System

```typescript
// src/utils/csvValidator.ts
export interface CSVValidationResult {
  isValid: boolean;
  detectedFormat: 'strike' | 'coinbase' | 'kraken' | 'generic' | 'unknown';
  errors: ImportError[];
  warnings: ImportError[];
  requiredColumns: string[];
  foundColumns: string[];
}

export function validateCSVStructure(headers: string[], data: any[]): CSVValidationResult;
export function validateTransactionRow(row: any, format: string, rowIndex: number): ImportError[];
```

#### Step 3: Enhanced Import Process

```typescript
// Enhanced import workflow
const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setLoading(true);
  const result = await processCSVFile(file);

  if (result.success) {
    // Show success modal with details
    setImportResult(result);
    setImportModalOpen(true);
  } else {
    // Show error modal with actionable feedback
    setErrorModalOpen(true);
    setImportErrors(result.errors);
  }
  setLoading(false);
};
```

#### Step 4: User Interface Updates

- Enhanced ImportSummaryModal with error display
- New ErrorModal component for detailed error feedback
- Progress indicator for large file processing
- Validation feedback before processing

#### Step 5: Error Recovery Options

- "Try Again" functionality with different parser
- Export of problematic rows for manual review
- Suggestion system for common CSV format issues
- Partial import options (import valid rows, skip invalid)

### Files to Create/Modify

- `src/types/ImportError.ts` - New error type system
- `src/utils/csvValidator.ts` - New validation utilities
- `src/utils/csvProcessor.ts` - Enhanced processing logic
- `src/components/ImportErrorModal.tsx` - New error display component
- `src/components/ImportSummaryModal.tsx` - Enhanced with error display
- `src/app.tsx` - Updated import handling
- Test files for comprehensive error scenarios

### Acceptance Criteria

- ✅ Clear, actionable error messages for all failure types
- ✅ Partial import capability when some rows are valid
- ✅ Detailed validation feedback before processing
- ✅ Recovery suggestions for common issues
- ✅ Progress indication for large files

---

## 3. 📊 Tax Reporting

### Current Gap Analysis

- No tax-specific calculations or reports
- Missing cost basis tracking for individual lots
- No capital gains/loss calculations
- No export functionality for tax software

### Solution Strategy

Implement comprehensive tax reporting with FIFO/LIFO methods and export capabilities.

### Implementation Plan

#### Step 1: Tax Calculation Engine

```typescript
// src/types/TaxTypes.ts
export enum TaxMethod {
  FIFO = 'FIFO', // First In, First Out
  LIFO = 'LIFO', // Last In, First Out
  HIFO = 'HIFO', // Highest In, First Out
  SPECIFIC_ID = 'SPECIFIC_ID', // Specific Identification
}

export interface TaxLot {
  id: string;
  purchaseDate: Date;
  btcAmount: number;
  costBasis: number; // USD
  pricePerBtc: number;
  exchange: string;
  remaining: number; // Remaining BTC in this lot
}

export interface TaxEvent {
  id: string;
  type: 'DISPOSAL' | 'ACQUISITION';
  date: Date;
  btcAmount: number;
  usdValue: number;
  costBasis?: number; // For disposals
  capitalGain?: number; // For disposals
  holdingPeriod?: 'SHORT' | 'LONG'; // For disposals
  lots?: TaxLot[]; // Associated lots
}

export interface TaxReport {
  taxYear: number;
  method: TaxMethod;
  totalGains: number;
  totalLosses: number;
  shortTermGains: number;
  longTermGains: number;
  events: TaxEvent[];
  summary: TaxSummary;
}
```

#### Step 2: Tax Calculation Utilities

```typescript
// src/utils/taxCalculations.ts
export class TaxCalculator {
  private lots: TaxLot[] = [];
  private method: TaxMethod;

  constructor(method: TaxMethod = TaxMethod.FIFO) {
    this.method = method;
  }

  addPurchase(transaction: Transaction): void;
  calculateSale(btcAmount: number, salePrice: number, saleDate: Date): TaxEvent;
  generateYearlyReport(year: number): TaxReport;
  exportTaxReport(report: TaxReport, format: 'CSV' | 'JSON' | 'PDF'): string;
}
```

#### Step 3: Tax Configuration Component

```typescript
// src/components/TaxConfiguration.tsx
// Allow users to:
// - Select tax method (FIFO/LIFO/HIFO)
// - Set tax year
// - Configure disposal events
// - Preview calculations before generating reports
```

#### Step 4: Tax Reports Interface

```typescript
// src/components/TaxReports.tsx
// Features:
// - Yearly tax report generation
// - Gain/loss summaries
// - Detailed transaction breakdown
// - Export functionality (CSV, JSON)
// - Print-friendly formatting
```

#### Step 5: Integration with Existing System

- Add disposal transaction support (future feature)
- Enhance transaction types beyond purchases
- Add tax lot tracking to storage system
- Update portfolio calculations to include tax implications

### Tax Report Features

#### Summary Section

- Total capital gains/losses
- Short-term vs long-term breakdown
- Effective tax rates
- Unrealized gains (current holdings)

#### Detailed Reports

- Transaction-by-transaction breakdown
- Cost basis calculations
- Holding period determinations
- Lot-specific tracking

#### Export Formats

- **CSV**: Compatible with tax software (TurboTax, TaxAct)
- **JSON**: For developers/advanced users
- **PDF**: Printable reports for tax professionals
- **Form 8949**: Pre-filled capital gains/losses form

### Files to Create/Modify

- `src/types/TaxTypes.ts` - Tax-specific type definitions
- `src/utils/taxCalculations.ts` - Core tax calculation engine
- `src/components/TaxConfiguration.tsx` - Tax settings component
- `src/components/TaxReports.tsx` - Tax report interface
- `src/components/TaxSummary.tsx` - Summary dashboard component
- `src/utils/taxExport.ts` - Export utilities
- `src/app.tsx` - Add tax reporting routes
- Comprehensive test coverage for tax calculations

### Acceptance Criteria

- ✅ Accurate FIFO/LIFO/HIFO calculations
- ✅ Proper short-term vs long-term determination
- ✅ Export compatibility with major tax software
- ✅ Year-by-year report generation
- ✅ Lot-level tracking and reporting
- ✅ Preview functionality before final reports

---

## 🚀 Implementation Timeline

### Phase 1: Foundation (Week 1)

- **Day 1-2**: Transaction ID Generation utility and tests
- **Day 3-4**: Update exchange parsers with stable IDs
- **Day 5**: Migration logic and user testing

### Phase 2: Error Handling (Week 2)

- **Day 1-2**: Error type system and validation utilities
- **Day 3-4**: Enhanced CSV processing and UI components
- **Day 5**: Integration and comprehensive testing

### Phase 3: Tax Reporting (Week 3-4)

- **Week 3**: Tax calculation engine and core utilities
- **Week 4**: Tax reporting UI and export functionality

### Phase 4: Integration & Polish (Week 5)

- Integration testing across all three features
- Performance optimization
- Documentation updates
- User acceptance testing

---

## 🧪 Testing Strategy

### Unit Tests

- Transaction ID generation with various inputs
- Error handling for all failure scenarios
- Tax calculation accuracy across different methods
- Export format validation

### Integration Tests

- End-to-end CSV import with new error handling
- Tax report generation from real transaction data
- Cross-browser compatibility
- Performance testing with large datasets

### User Testing

- CSV import error scenarios
- Tax report accuracy validation
- UI/UX feedback collection
- Mobile device testing

---

## 📋 Definition of Done

Each feature is considered complete when:

- ✅ All acceptance criteria are met
- ✅ Unit and integration tests pass
- ✅ Code review completed
- ✅ Documentation updated
- ✅ User testing validated
- ✅ Performance benchmarks met
- ✅ Accessibility standards confirmed

This action plan provides a comprehensive roadmap for implementing these critical features while maintaining code quality and user experience standards.
