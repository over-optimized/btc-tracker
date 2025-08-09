# Changelog

All notable changes to the Bitcoin DCA Tracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Data Freshness Monitoring System**: Comprehensive import reminder system for users with regular trading patterns
  - **DataFreshnessCard**: Dashboard widget showing data staleness with color-coded indicators (fresh, aging, stale, very stale)
  - **ImportReminderToast**: Smart notification system with snooze options and customizable reminder intervals
  - **Transaction Gap Detection**: Analyzes transaction history to identify missing import periods
  - **Quick Import Actions**: One-click navigation to import functionality from dashboard cards and reminders

### Enhanced
- **InvestedVsPnLChart**: Modified to show running totals (cumulative invested amount and unrealized P&L) instead of monthly discrete values for clearer portfolio growth visualization
- **Dashboard Layout**: Added responsive grid layout for status cards (tax summary and data freshness)

### Added
- Future enhancements and features will be documented here

## [2.1.0] - 2025-01-09

### Added - Comprehensive Tax Reporting System
- **Multi-Method Tax Calculations**: Complete implementation of FIFO, LIFO, HIFO, and Specific Identification methods
- **Tax Lot Management**: Individual purchase lot tracking with partial disposal support and validation
- **Holding Period Classification**: Automatic short-term vs long-term determination (365+ day threshold)
- **Tax Optimization Analysis**: AI-powered recommendations for tax-loss harvesting and holding strategies
- **Hypothetical Disposal Calculator**: Test tax implications before executing sales
- **Professional Export System**: TurboTax-compatible CSV, comprehensive JSON, and detailed CSV formats
- **Interactive Tax Dashboard**: Complete tax reporting interface with configuration, reports, and optimization tools
- **Dashboard Integration**: Tax summary cards on main dashboard with real-time calculations

### Components Added
- `TaxConfig.tsx` - Tax method and year configuration interface
- `TaxReport.tsx` - Comprehensive tax report display with detailed breakdowns
- `TaxOptimization.tsx` - Tax strategy recommendations and hypothetical calculations
- `TaxExport.tsx` - Multi-format export functionality with customizable options
- `TaxDashboard.tsx` - Main tax reporting page integrating all tax features
- `TaxSummaryCard.tsx` - Dashboard widget showing current tax status

### Technical Implementation
- `src/types/TaxTypes.ts` - Complete type system with 18+ interfaces and enums
- `src/utils/taxCalculator.ts` - Main tax calculation engine with report generation
- `src/utils/taxLotManager.ts` - Lot tracking system with FIFO/LIFO/HIFO algorithms
- Navigation integration with `/tax` route and "Tax Reports" menu item
- 54 comprehensive unit tests with >95% coverage for tax calculations
- Integration tests with realistic DCA scenarios and multi-method comparisons

### Tax Features
- **Tax Methods**: FIFO (First In, First Out), LIFO (Last In, First Out), HIFO (Highest In, First Out)
- **Capital Gains Calculation**: Accurate short-term and long-term classification with detailed cost basis
- **Tax Event Tracking**: Complete audit trail of acquisitions and disposals with lot-level details
- **Unrealized Gains**: Real-time calculation of unrealized gains/losses for remaining holdings
- **Method Comparison**: Side-by-side analysis of tax outcomes across different methods
- **Tax Season Alerts**: Contextual reminders during tax filing periods

### Export Capabilities
- **TurboTax CSV**: Directly compatible format for seamless tax software import
- **Detailed CSV**: Comprehensive transaction export with all tax calculations
- **JSON Export**: Complete data export for developers and advanced users
- **Customizable Options**: Summary-only, detailed lots, precision settings, and date formatting

### User Experience
- **Progressive Configuration**: Step-by-step setup with clear explanations and recommendations
- **Visual Tax Reports**: Card-based summaries with color-coded gains/losses
- **Optimization Suggestions**: Contextual recommendations based on portfolio analysis
- **Error Handling**: Comprehensive validation with clear error messages and recovery options

## [2.0.0] - 2025-01-09

### Added - Enhanced Error Handling System
- **Comprehensive Error Type System**: New `ImportError` interface with specific error categories
- **CSV Validation Framework**: Multi-layered validation for files, structure, and data integrity
- **Advanced Error Recovery**: Context-aware recovery options with automated suggestions
- **Interactive Error Modals**: Detailed error display with tabs and actionable recovery buttons
- **Progress Tracking**: Real-time progress indication for large file processing
- **Export Error Data**: Ability to export problematic rows with error details for manual review
- **Smart Help System**: Context-sensitive help content with step-by-step guidance

### Enhanced
- **ImportSummaryModal**: Enhanced with error preview and details navigation
- **CSV Processing**: Complete rewrite with robust error handling and partial import capability
- **User Experience**: Progressive error disclosure from summary to detailed help

### Technical Implementation
- `src/types/ImportError.ts` - Complete error type definitions
- `src/utils/csvValidator.ts` - Comprehensive validation utilities (94.51% test coverage)
- `src/utils/csvProcessor.ts` - Enhanced processing with error handling
- `src/utils/errorRecovery.ts` - Recovery options and help content generation
- `src/components/ImportErrorModal.tsx` - Detailed error display component
- 47 comprehensive tests covering all error scenarios

### Error Categories Handled
- File validation (size, type, encoding)
- CSV structure validation (missing columns, format detection)
- Data validation (invalid values, dates, amounts)
- Processing errors (network, timeout, memory)

## [1.2.0] - 2025-01-09

### Added - Stable Transaction ID Generation
- **Deterministic ID System**: Content-based transaction IDs that remain stable across re-imports
- **Multi-Exchange Support**: Stable IDs for Strike (reference-based), Coinbase/Kraken (hash-based)
- **Data Migration System**: Automatic migration of existing user data with backup/restore
- **Collision Detection**: Advanced deduplication with collision detection utilities

### Enhanced
- **Exchange Parsers**: All parsers updated to use stable ID generation
- **Storage System**: Enhanced with version tracking and automatic migration
- **Deduplication Logic**: Improved duplicate detection using stable IDs

### Technical Implementation
- `src/utils/generateTransactionId.ts` - Core stable ID generation (100% test coverage)
- `src/utils/dataMigration.ts` - Complete migration system (92.3% test coverage)
- `src/utils/storage.ts` - Enhanced storage with migration support
- `src/utils/exchangeParsers.ts` - Updated all parsers for stable IDs
- 56 comprehensive tests covering ID generation and migration scenarios

### Fixed
- **Duplicate Import Issue**: Re-importing CSV files no longer creates duplicate transactions
- **ID Consistency**: Transaction IDs now remain consistent across app sessions
- **Data Integrity**: Existing user data properly migrates without loss

### Migration Features
- Automatic backup creation before migration
- Graceful error handling with rollback capability
- Progress reporting and validation
- Support for mixed ID formats during transition

## [1.1.0] - 2024-12-XX (Previous Release)

### Added
- Multi-exchange CSV import support (Strike, Coinbase, Kraken, Generic)
- Real-time Bitcoin price tracking via CoinGecko API
- Portfolio analytics and visualizations
- Transaction history with pagination
- Data persistence via localStorage

### Features
- Dashboard with key metrics (total invested, BTC holdings, P&L)
- Multiple chart types (portfolio value, investment vs P&L, additional analytics)
- Responsive design with Tailwind CSS
- TypeScript for type safety

## [1.0.0] - 2024-11-XX (Initial Release)

### Added
- Basic Bitcoin DCA transaction tracking
- CSV import functionality
- Portfolio value calculations
- Simple transaction history
- Basic error handling with alerts

---

## Development Notes

### Testing Strategy
- **Unit Tests**: Core utilities and business logic
- **Integration Tests**: Component interactions and data flow
- **Error Scenario Tests**: Comprehensive error handling validation
- **Coverage Goals**: >90% for critical utilities, >70% overall

### Architecture Decisions
- **Client-Side Only**: No server-side dependencies
- **Local Storage**: All data persists locally in browser
- **Modular Design**: Clean separation of concerns
- **Type Safety**: Full TypeScript coverage
- **Error-First Design**: Comprehensive error handling throughout

### Performance Considerations
- **Efficient Parsing**: Streaming CSV processing for large files
- **Smart Caching**: Optimized data storage and retrieval
- **Progress Tracking**: User feedback for long-running operations
- **Memory Management**: Proper cleanup and resource management

### Security Measures
- **No Data Transmission**: All processing happens client-side
- **Input Validation**: Comprehensive CSV and data validation
- **Safe Parsing**: Protected against CSV injection and malformed data
- **Local Storage Only**: No external data sharing or tracking