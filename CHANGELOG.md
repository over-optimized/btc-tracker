# Changelog

All notable changes to the Bitcoin DCA Tracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive changelog to track project progress

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