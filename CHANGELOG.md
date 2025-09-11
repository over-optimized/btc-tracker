# Changelog

All notable changes to the Bitcoin DCA Tracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - v0.4.0-alpha.1 (Planned March 2025)

### Infrastructure Deployment

- Multi-user authentication with Supabase
- Production deployment with Vercel
- Database migration from localStorage
- CI/CD pipeline with GitHub Actions

## [v0.3.0-dev] - Q1 2025 Development Phase ✅ INFRASTRUCTURE COMPLETE

### 🎨 UI/UX Improvements

- **Logo Enhancement**: Redesigned brand header with Bitcoin symbol integration and Inter typography
  - Replaced "BTC Tracker" with "₿TC Tracker" for better brand recognition
  - Added Inter font family for modern, professional typography
  - Removed duplicate Bitcoin icon and repositioned trending indicator
  - Maintained beautiful gradient effects and shimmer animations

- **Accessibility & Contrast Improvements**: Fixed light mode text contrast across multiple components
  - Enhanced auth button text visibility in light theme
  - Improved chart title contrast using CSS custom properties
  - Fixed navigation and form element readability

- **TimeRangeSelector UX Upgrade**: Converted filter buttons to professional dropdown
  - Replaced 5 horizontal buttons with space-efficient dropdown control
  - Solved persistent contrast issues with native select styling
  - Improved mobile experience and accessibility
  - Better visual hierarchy and cleaner interface

- **Font Optimization**: Reduced bundle size by removing unused Inter font weights
  - Optimized from 4 weights (400,500,600,700) to 2 weights (500,600)
  - Focused font usage on brand elements only

### 🐛 Bug Fixes

- **Error Handling**: Fixed "transactions.forEach is not a function" TypeError on page refresh
  - Added defensive programming to self-custody tracking utilities
  - Implemented proper array validation in `calculateExchangeBalances` and `analyzeSelfCustody`
  - Graceful degradation with sensible defaults during loading states

### 🏗️ Infrastructure & Deployment (Phase 0.6 - COMPLETE)

- **Legal Compliance & Feature Flag System**: Production-safe deployment with risk-based feature management
  - **Complete Feature Flag Architecture**: React context-based system with TypeScript safety and environment-aware activation
  - **Legal Risk Management**: High/Medium/Low risk categorization with production safety controls
  - **Production Safe Mode**: All high-risk features disabled, comprehensive legal disclaimers, professional consultation guidance
  - **Development Flexibility**: Full feature access in development with legal review capabilities in staging
  - **Compliance Verification**: Automated scripts ensure legal compliance before production deployment

- **Professional CI/CD Pipeline & Branch Protection**: Enterprise-grade development workflow infrastructure
  - **Comprehensive GitHub Actions**: Multi-node testing (20.x/22.x), ESLint enforcement, coverage gates, feature flag compliance
  - **Advanced Branch Protection**: CODEOWNERS-based collaboration control with maintainer approval requirements
  - **Quality Gates**: Pre-push hooks with coverage verification, automatic lint fixing, comprehensive testing requirements
  - **Professional Deployment**: Git-based automatic deployments to staging and production environments
  - **Security & Performance**: Professional security headers, optimized builds, comprehensive error handling

- **GitHub Integration & Development Tools**: Complete development environment setup
  - **GitHub MCP Server**: Enhanced repository management capabilities for Claude Code integration
  - **Professional Documentation**: Comprehensive setup guides, development workflows, legal compliance procedures
  - **Team Collaboration**: CODEOWNERS, branch protection, automated deployments, professional code review process
  - **Security Configuration**: Token management, environment variable separation, development permission controls

**Development Stats:**

- Model: Claude Sonnet 4
- Infrastructure Tasks Completed: 45+ comprehensive tasks
- Testing Coverage: >90% for critical business logic, >80% overall
- Legal Compliance: 100% production-safe feature flag implementation
- CI/CD Pipeline: Fully automated with quality gates and deployment verification

### 🎯 Core Features (Phases 1-5 - COMPLETE)

### Added

- **Intelligent Transaction Classification System**: Revolutionary CSV import enhancement that handles mixed transaction types
  - **Enhanced CSV Parsing**: Detects ALL transaction types (purchases, withdrawals, sales, transfers) instead of filtering
  - **Smart Auto-Classification**: Pattern recognition with confidence scoring for automatic transaction categorization
  - **Interactive Classification Modal**: User-friendly interface for ambiguous transactions with bulk actions and visual indicators
  - **Mixed Statement Support**: Seamlessly handles exchange CSV files containing both purchases and outgoing transfers
  - **Tax-Aware Processing**: Properly categorizes withdrawals as non-taxable events and sales as taxable disposals

- **Self-Custody Tracking & Milestone System**: Complete solution for tracking Bitcoin movements to self-custody
  - **Extended Transaction Model**: Support for withdrawal transactions with destination wallet, network fees, and tax flags
  - **Milestone Recommendations**: Smart alerts at 0.001, 0.01, 0.05, 0.1, and 1.0 BTC thresholds with educational content
  - **SelfCustodyCard**: Dashboard widget showing security score, exchange balances, and milestone recommendations
  - **AddWithdrawalModal**: User-friendly interface for recording withdrawals to self-custody
  - **Portfolio Security Analysis**: Real-time risk assessment based on exchange exposure and concentration
  - **Tax Integration**: Withdrawals properly handled as non-taxable events in tax calculations

- **Data Freshness Monitoring System**: Comprehensive import reminder system for users with regular trading patterns
  - **DataFreshnessCard**: Dashboard widget showing data staleness with color-coded indicators (fresh, aging, stale, very stale)
  - **ImportReminderToast**: Smart notification system with snooze options and customizable reminder intervals
  - **Transaction Gap Detection**: Analyzes transaction history to identify missing import periods
  - **Quick Import Actions**: One-click navigation to import functionality from dashboard cards and reminders

- **Development Cost Tracking Workflow**: Integrated Claude token usage tracking for development budget analysis
  - **Task-Based Token Tracking**: Instructions for capturing token usage after completing each feature/task
  - **CHANGELOG Integration**: Standardized development metrics format (model, tokens, cost, story points)
  - **Documentation Workflow**: Updated process to include token summaries in all feature documentation
  - **Future CLI System**: Complete implementation preserved in sandbox for automated cost analysis tools

**Development Stats:**

- Model: Claude Sonnet 4
- Tokens: 4,200 input / 2,800 output
- Estimated Cost: $0.054
- Story Points: 3

### Enhanced

- **InvestedVsPnLChart**: Modified to show running totals (cumulative invested amount and unrealized P&L) instead of monthly discrete values for clearer portfolio growth visualization
- **Dashboard Layout**: Added responsive grid layout for status cards (tax summary and data freshness)

### Added

- Future enhancements and features will be documented here

## Development Milestone 3 - Professional Tax Reporting (January 2025)

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

## Development Milestone 2 - Comprehensive Error Handling (January 2025)

### Added

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

## Development Milestone 1 - Stable Transaction IDs (January 2025)

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

## Early Development Phase (December 2024)

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

## Project Inception (November 2024)

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
