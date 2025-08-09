# CLAUDE.md - Bitcoin DCA Tracker

## Project Overview

The Bitcoin DCA Tracker is a modern React + TypeScript web application designed to help users track their Bitcoin Dollar Cost Averaging (DCA) purchases across multiple cryptocurrency exchanges. The app provides comprehensive analytics, visualizations, and transaction management capabilities.

## Architecture & Tech Stack

### Frontend Stack

- **React 19** with TypeScript for type safety
- **Vite** for fast development and building
- **React Router** for client-side routing
- **Tailwind CSS** for styling (via CDN)
- **Recharts** for data visualization

### Backend & Infrastructure (Multi-User Production)

- **Supabase** - PostgreSQL database, authentication, and real-time APIs
- **Vercel** - Frontend deployment and hosting with automatic CI/CD
- **GitHub Actions** - Automated testing and deployment pipeline
- **Row Level Security** - Database-level user data isolation

### Development Tools

- **ESLint** + **Prettier** for code quality
- **Vitest** + **Testing Library** for comprehensive testing
- **PNPM** as package manager

### Key Libraries

- **Papa Parse** for CSV parsing
- **Lucide React** for icons
- **Supabase Client** for database and authentication
- **localStorage** for temporary data persistence (migration to database)

## Project Structure

```
src/
├── apis/                    # External API integrations
│   └── fetchBitcoinPrice.ts # CoinGecko price fetching
├── components/              # React components
│   ├── __tests__/          # Component tests  
│   ├── AdditionalCharts.tsx # Advanced chart visualizations
│   ├── AddWithdrawalModal.tsx # Manual withdrawal entry interface
│   ├── DashboardOverview.tsx # Main stats dashboard
│   ├── DataFreshnessCard.tsx # Import reminder dashboard widget
│   ├── ImportErrorModal.tsx # CSV import error handling interface
│   ├── ImportReminderToast.tsx # Smart notification system for stale data
│   ├── ImportSummaryModal.tsx # Import feedback modal
│   ├── InvestedVsPnLChart.tsx # Monthly investment analysis (cumulative)
│   ├── NavBar.tsx          # Navigation component
│   ├── PortfolioValueChart.tsx # Portfolio value over time
│   ├── SelfCustodyCard.tsx # Security scoring and milestone tracking widget
│   ├── TaxConfig.tsx       # Tax configuration interface
│   ├── TaxDashboard.tsx    # Main tax reporting page
│   ├── TaxExport.tsx       # Tax report export functionality
│   ├── TaxOptimization.tsx # Tax strategy and analysis tools
│   ├── TaxReport.tsx       # Tax report display component
│   ├── TaxSummaryCard.tsx  # Dashboard tax summary widget
│   ├── TransactionClassificationModal.tsx # Mixed transaction type classification UI
│   ├── TransactionHistory.tsx # Paginated transaction table
│   └── UploadTransactions.tsx # File upload interface
├── types/                   # TypeScript type definitions
│   ├── ImportError.ts      # CSV import error handling types
│   ├── Stats.ts            # Portfolio statistics interface
│   ├── TaxTypes.ts         # Tax calculation type definitions
│   ├── Transaction.ts      # Transaction data model (extended for withdrawals)
│   └── TransactionClassification.ts # Mixed transaction type classification
├── utils/                   # Utility functions
│   ├── csvProcessor.ts     # Legacy CSV processor (⚠️ DEPRECATED)
│   ├── csvValidator.ts     # CSV file validation utilities
│   ├── dataFreshness.ts    # Import reminder and staleness detection
│   ├── dataMigration.ts    # Data migration and version management
│   ├── enhancedCsvProcessor.ts # Enhanced CSV processor with classification
│   ├── enhancedExchangeParsers.ts # Multi-exchange parsers (all transaction types)
│   ├── errorRecovery.ts    # Import error recovery and help generation
│   ├── exchangeParsers.ts  # Legacy exchange parsers (⚠️ DEPRECATED) 
│   ├── formatBTC.ts        # Bitcoin amount formatting
│   ├── formatCurrency.ts   # Currency formatting
│   ├── generateTransactionId.ts # Stable transaction ID generation
│   ├── selfCustodyTracker.ts # Self-custody milestone and security analysis
│   ├── storage.ts          # localStorage management with versioning
│   ├── taxCalculator.ts    # Tax calculation engine (multi-method)
│   ├── taxLotManager.ts    # Tax lot tracking system (FIFO/LIFO/HIFO)
│   └── transactionClassifier.ts # AI-powered transaction classification engine
├── app.tsx                  # Main application component
└── main.tsx                # Application entry point
```

## Development Setup & Standards

### Prerequisites & Installation

```bash
# Required versions
node >= 16.0.0
pnpm >= 8.0.0  # Recommended package manager

# Setup
git clone <repository-url>
cd btc-tracker
pnpm install
```

### Development Commands

```bash
# Development
pnpm dev        # Start development server (http://localhost:5173)
pnpm build      # Build for production
pnpm preview    # Preview production build locally

# Code Quality  
pnpm lint       # Run ESLint (includes TypeScript checks)
pnpm lint:fix   # Auto-fix ESLint issues
pnpm format     # Format code with Prettier
pnpm typecheck  # TypeScript type checking (if available)

# Testing
pnpm test       # Run all tests with coverage
pnpm test:watch # Run tests in watch mode
pnpm test:ui    # Run Vitest UI (if available)

# Specific test commands for new features
pnpm test --run src/components/__tests__/ComponentName.test.tsx
pnpm test --run src/utils/__tests__/utilityName.test.ts
pnpm test --run src/utils/__tests__/tax  # All tax-related tests
```

### Testing New Features

When developing new features, ensure comprehensive testing:

```bash
# 1. Run relevant existing tests
pnpm test --run src/utils/taxCalculator.test.ts

# 2. Create new test files following naming convention
# ComponentName.test.tsx for React components  
# utilityName.test.ts for utility functions

# 3. Aim for test coverage thresholds
# >90% for critical utilities (tax calculations, data processing)
# >80% for UI components
# >70% overall project coverage

# 4. Run coverage report
pnpm test --coverage
open coverage/index.html  # View detailed coverage report
```

### Code Quality Standards

#### TypeScript Standards
- **Strict Mode**: Always enabled - no implicit any, null checks required
- **Explicit Typing**: Avoid `any` - use proper types or `unknown` with type guards
- **Interface Definitions**: Create comprehensive interfaces in `src/types/`

#### ESLint Rules (Enforced)
```json
{
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/prefer-ts-expect-error": "error", 
  "@typescript-eslint/ban-ts-comment": "error",
  "react-hooks/exhaustive-deps": "error"
}
```

#### Component Standards
- **Props Interfaces**: Always define explicit props interfaces
- **Error Boundaries**: Wrap complex components in error boundaries
- **Accessibility**: Include ARIA labels and keyboard navigation
- **Testing**: Include both unit tests and integration scenarios

### Deprecation Guidelines

When replacing classes, functions, or entire modules:

1. **Mark with JSDoc `@deprecated` tag**:
```typescript
/**
 * Legacy CSV processor for basic imports
 * @deprecated Use EnhancedCSVProcessor instead for mixed transaction support
 * @see EnhancedCSVProcessor
 */
export class CSVProcessor { ... }
```

2. **Provide Migration Path**:
```typescript
/**
 * @deprecated Use enhancedExchangeParsers.ts instead
 * Migration: Replace `exchangeParsers.strike()` with `enhancedExchangeParsers.strike()`
 * New version supports all transaction types, not just purchases
 */
export const exchangeParsers = { ... }
```

3. **Update Documentation**: Add deprecation notice to CLAUDE.md project structure
4. **Create Migration Guide**: Document changes in CHANGELOG.md
5. **Gradual Removal**: Keep deprecated code for 2+ releases before removal

## Core Features

### 1. Intelligent Transaction Classification System

- **Mixed CSV Support**: Handles files containing purchases, withdrawals, sales, and transfers
- **Smart Auto-Classification**: Pattern recognition with 90%+ confidence scoring
- **Interactive Classification UI**: User-friendly modal for ambiguous transactions  
- **Bulk Actions**: One-click classification for common patterns
- **Tax-Aware Processing**: Properly categorizes transactions for tax implications

### 2. Self-Custody Tracking & Security

- **Milestone Recommendations**: Smart alerts at 0.001, 0.01, 0.05, 0.1, 1.0 BTC thresholds
- **Security Scoring**: Real-time assessment (0-100) based on exchange exposure
- **Withdrawal Recording**: Manual entry for Bitcoin moved to self-custody
- **Exchange Balance Monitoring**: Track BTC remaining on each exchange
- **Risk Analysis**: Visual indicators and educational content

### 3. Professional Tax Reporting System

- **Multi-Method Calculations**: FIFO, LIFO, HIFO, and Specific Identification
- **Lot-Level Tracking**: Individual purchase lots with partial disposal support
- **Holding Period Classification**: Automatic short-term vs long-term determination
- **Professional Export**: TurboTax-compatible CSV, comprehensive JSON formats
- **Tax Optimization**: Strategy recommendations and hypothetical disposal analysis
- **Dashboard Integration**: Real-time tax summary widgets

### 4. Data Freshness & Import Monitoring

- **Staleness Detection**: Alerts when transaction data becomes outdated
- **Import Reminders**: Smart notifications for daily DCA users
- **Gap Analysis**: Identifies missing transaction periods
- **Snooze Options**: Customizable reminder intervals
- **Quick Actions**: One-click navigation to import functionality

### 5. Enhanced Multi-Exchange Support

- **Strike**: All transaction types (purchases, withdrawals, sales) with reference IDs
- **Coinbase**: Full transaction parsing with multiple format support
- **Kraken**: Complete trade and withdrawal processing
- **Generic CSV**: Flexible parser for any exchange format
- **Auto-Detection**: Intelligent format recognition for seamless imports

### 6. Advanced Portfolio Analytics

- **Real-Time Dashboard**: Live Bitcoin pricing with portfolio value tracking
- **Interactive Charts**: Portfolio growth, cumulative investment analysis, P&L trends
- **Historical Analysis**: Portfolio value over time with cost basis comparison
- **Performance Metrics**: Unrealized gains, average cost basis, total returns

## Technical Highlights

### Intelligent Transaction Classification Engine (v2.2.0)

1. **Multi-Type Detection**: Automatically identifies purchases, withdrawals, sales, and transfers
2. **Pattern Recognition**: Advanced heuristics with confidence scoring (0-100%)
3. **Interactive Classification**: User-friendly modal for ambiguous transactions
4. **Bulk Actions**: Smart suggestions for common transaction patterns
5. **Tax Integration**: Proper categorization for tax calculation compatibility
6. **Exchange Compatibility**: Works with all supported exchange formats

### Enhanced CSV Processing Pipeline (v2.0.0+)

1. **Universal Format Support**: Handles mixed transaction types in single CSV files
2. **Intelligent Format Detection**: Auto-detects exchange format with confidence scoring
3. **Multi-Layer Validation**: File → structure → transaction-level data validation
4. **Advanced Error Recovery**: Context-aware recovery options with user guidance
5. **Progress Tracking**: Real-time progress indication for large file processing
6. **Smart Deduplication**: Stable ID-based duplicate prevention across re-imports
7. **Versioned Storage**: Persistent localStorage with automatic migration support

### Stable Transaction ID System (v1.2.0)

- **Deterministic IDs**: Content-based IDs that remain stable across re-imports
- **Exchange-Specific Logic**: Reference-based for Strike, hash-based for others
- **Collision Detection**: Advanced algorithms to prevent ID conflicts
- **Data Migration**: Automatic migration of existing user data with backup/restore
- **Version Tracking**: localStorage versioning with seamless upgrades

### Advanced Error Handling (v2.0.0)

- **Comprehensive Error Types**: Specific error categories with recovery guidance
- **Progressive Disclosure**: Summary → detailed errors → recovery options → help
- **Export Problematic Data**: CSV export of rows with issues for manual review
- **Smart Recovery**: Context-aware suggestions (try different formats, skip invalid rows)
- **User-Friendly UI**: Modal interfaces with clear actions and guidance

### Chart System

- **Responsive Design**: Charts adapt to container sizes
- **Time Series Data**: Proper date handling and sorting
- **Interactive Tooltips**: Formatted currency and BTC values
- **Multiple Chart Types**: Line charts, area charts, bar charts

### Self-Custody Security System (v2.2.0)

- **Milestone Detection**: Automatic alerts at common self-custody thresholds (0.01, 0.1, 1.0 BTC)
- **Security Scoring**: Real-time risk assessment (0-100) based on exchange exposure
- **Balance Tracking**: Accurate calculation of Bitcoin remaining on each exchange
- **Educational Integration**: Context-aware recommendations and security best practices
- **Withdrawal Recording**: Manual entry system for Bitcoin moved to self-custody
- **Tax Compliance**: Proper handling of withdrawals as non-taxable events

### Tax Calculation Engine (v2.1.0)

- **Multi-Method Support**: Complete implementation of FIFO, LIFO, HIFO, and Specific Identification
- **Lot Tracking**: Individual purchase lot management with partial disposal support
- **Holding Period Logic**: Automatic short-term vs long-term classification (365+ days)
- **Tax Event Generation**: Complete audit trail of acquisitions and disposals
- **Withdrawal Handling**: Proper processing of self-custody withdrawals as non-taxable
- **Optimization Analysis**: Tax-loss harvesting and strategy recommendations
- **Professional Export**: TurboTax-compatible CSV and comprehensive JSON formats

### Comprehensive Testing Strategy

- **Unit Tests**: >95% coverage for tax calculations, >90% for critical utilities
- **Integration Tests**: End-to-end CSV import scenarios and tax calculation workflows
- **Tax Scenario Tests**: Comprehensive validation of FIFO/LIFO/HIFO calculations
- **Error Scenario Tests**: Tax calculation edge cases and error recovery
- **Performance Tests**: Large portfolio handling and multi-method comparisons
- **Component Tests**: UI components with realistic tax data and scenarios

## Data Models

### Extended Transaction Interface

```typescript
interface Transaction {
  // Core fields
  id: string; // Unique identifier for deduplication
  date: Date; // Transaction timestamp
  exchange: string; // Exchange name (Strike, Coinbase, etc.)
  type: string; // Transaction type (Purchase, Withdrawal, Sale, etc.)
  usdAmount: number; // USD amount (0 for withdrawals)
  btcAmount: number; // Bitcoin amount (positive for acquisitions)
  price: number; // Bitcoin price at transaction time
  
  // Extended fields for withdrawal tracking (optional for backward compatibility)
  destinationWallet?: string; // Wallet name or address where Bitcoin was sent
  networkFee?: number; // Network fee in BTC for withdrawals
  networkFeeUsd?: number; // Network fee in USD at time of transaction
  isSelfCustody?: boolean; // Flag indicating this is a self-custody movement
  notes?: string; // User notes about the transaction
  
  // Tax treatment flags
  isTaxable?: boolean; // Whether this creates a taxable event (defaults based on type)
}

interface WithdrawalTransaction extends Transaction {
  type: 'Withdrawal' | 'Transfer';
  destinationWallet: string;
  isSelfCustody: true;
  isTaxable: false;
}
```

### Stats Interface

```typescript
interface Stats {
  totalInvested: number; // Total USD invested
  totalBitcoin: number; // Total BTC acquired
  avgCostBasis: number; // Average cost per BTC
  currentValue: number; // Current portfolio value
  unrealizedPnL: number; // Profit/Loss vs investment
}
```

### Tax Data Models

```typescript
interface TaxLot {
  id: string;                    // Unique identifier for this lot
  transactionId: string;         // Reference to original transaction
  purchaseDate: Date;           // Date of acquisition
  btcAmount: number;            // Original BTC amount in this lot
  remaining: number;            // Remaining BTC in this lot (after disposals)
  costBasis: number;            // Original USD cost for this lot
  pricePerBtc: number;          // Price per BTC at time of purchase
  exchange: string;             // Exchange where purchased
}

interface TaxEvent {
  id: string;
  type: TaxEventType;           // ACQUISITION or DISPOSAL
  date: Date;
  btcAmount: number;
  usdValue: number;
  costBasis?: number;           // Cost basis for disposed BTC
  capitalGain?: number;         // Gain or loss (can be negative)
  holdingPeriod?: HoldingPeriod; // SHORT_TERM or LONG_TERM
  disposedLots?: DisposedLot[]; // Which lots were used for disposal
}

interface TaxReport {
  taxYear: number;              // Tax year (e.g., 2024)
  method: TaxMethod;            // Calculation method used (FIFO/LIFO/HIFO)
  generatedAt: Date;            // When this report was generated
  summary: TaxSummary;          // Summary statistics
  acquisitions: TaxEvent[];     // All purchase events
  disposals: TaxEvent[];        // All sale/disposal events
  remainingLots: TaxLot[];      // Lots still held
}
```

## Exchange Parser Details

### Strike Parser

- **Trigger**: `Date & Time (UTC)` and `Transaction Type` fields
- **Filter**: Only processes "Purchase" transactions
- **ID Generation**: Uses `Reference` field for stable IDs
- **Fields**: Amount USD, Amount BTC, BTC Price

### Coinbase Parser

- **Trigger**: `Transaction Type` field with "Buy" or "Purchase"
- **ID Generation**: Timestamp-based (needs improvement)
- **Fields**: Supports multiple field variations for different export formats

### Kraken Parser

- **Trigger**: `type: "trade"` with Bitcoin/USD pairs
- **Pair Filtering**: Only processes XBT/USD related trades
- **ID Generation**: Timestamp-based (needs improvement)

### Generic Parser

- **Fallback**: Handles any CSV with standard columns
- **Flexible**: Supports various column name variations
- **Calculation**: Derives price from USD/BTC amounts when not provided

## Development Workflow

### Testing Commands

```bash
# Run specific test file
pnpm test --run src/components/__tests__/ComponentName.test.tsx

# Run all tests with coverage
pnpm test

# Run error handling tests specifically
pnpm test --run src/utils/csvValidator.test.ts src/utils/errorRecovery.test.ts

# Run ID generation and migration tests
pnpm test --run src/utils/generateTransactionId.test.ts src/utils/dataMigration.test.ts

# Run tax calculation tests specifically
pnpm test --run src/utils/__tests__/tax

# Run specific tax component tests
pnpm test --run src/utils/__tests__/taxLotManager.test.ts src/utils/__tests__/taxCalculator.test.ts

# View coverage report
open coverage/index.html
```

### Code Quality & Standards

```bash
pnpm lint      # ESLint checking
pnpm format    # Prettier formatting  
pnpm dev       # Development server
pnpm build     # Production build
pnpm typecheck # TypeScript type checking (if available)
```

### Token Usage Tracking

For budget tracking and development cost analysis, track Claude token usage after completing each task or feature:

**After completing each significant task/feature, ask Claude:**
```
Please provide a token usage summary for this task, including:
- Input tokens used
- Output tokens generated  
- Total tokens for this task
- Brief description of what was accomplished
```

**Manual Tracking Format:**
```
Task: [Task/Feature Name]
Date: [Date Completed]
Accomplished: [Brief description]
Input Tokens: [Number]
Output Tokens: [Number]
Total Cost Estimate: [Based on Sonnet 4 pricing: $3 input + $15 output per 1M tokens]
```

**Benefits of Task-Based Tracking:**
- ✅ Captures data before session ends
- ✅ Links costs directly to deliverables  
- ✅ Better granularity for budgeting
- ✅ No risk of losing token data on session exit

> **Future Enhancement**: Advanced automated cost analysis CLI tools planned - see docs/tasks.md

### Documentation Workflow & Maintenance

```bash
# Update project status after significant changes
vim docs/PROJECT_STATUS.md

# Track new tasks and estimates
vim docs/tasks.md

# Document completed features
vim CHANGELOG.md

# Update this file for architectural changes
vim CLAUDE.md
```

**IMPORTANT: Documentation Maintenance Requirements**

When completing major features or making significant changes, **ALWAYS** update the following documentation:

1. **CLAUDE.md** (this file): 
   - Add new components to project structure
   - Update core features list
   - Add new technical highlights
   - Update data models and interfaces
   - Add new testing commands

2. **CHANGELOG.md**:
   - Document the completed feature with version number
   - Include technical implementation details
   - List user-facing improvements
   - Note any breaking changes
   - **Add development metrics**: Include Claude model, token usage, estimated cost, and story points

3. **docs/PROJECT_STATUS.md**:
   - Update current status and version
   - Mark completed features
   - Update next priorities

4. **docs/critical-features.md**:
   - Remove completed features
   - Update remaining feature priorities
   - Adjust implementation timelines

**Documentation Update Process**:
```bash
# After completing a major feature:
1. Get token usage summary from Claude
2. Update CLAUDE.md with new technical details
3. Add entry to CHANGELOG.md with version bump and development metrics
4. Update PROJECT_STATUS.md current status
5. Remove completed items from critical-features.md
6. Commit all documentation updates together
```

**CHANGELOG Development Metrics Format**:
```markdown
**Development Stats:**
- Model: Claude Sonnet 4
- Tokens: [X] input / [Y] output 
- Estimated Cost: $[Z]
- Story Points: [N]
```

This ensures the project documentation stays current and accurate for future development work.

## Project Management & Development

### Documentation System

The project uses a structured documentation approach:

- **[CHANGELOG.md](CHANGELOG.md)** - Complete project history and releases
- **[docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md)** - High-level project overview and health
- **[docs/critical-features.md](docs/critical-features.md)** - Next priority features and planning
- **[docs/tasks.md](docs/tasks.md)** - Detailed task tracking with estimates and priorities

### Development Workflow

```bash
# Check current project status
cat docs/PROJECT_STATUS.md

# Review next priorities
cat docs/critical-features.md

# See detailed task breakdown
cat docs/tasks.md

# View completed work
cat CHANGELOG.md
```

### Quality Standards

- **Code Coverage**: >90% for critical utilities, >80% overall
- **Type Safety**: Full TypeScript coverage with strict mode
- **Error Handling**: Comprehensive error scenarios with recovery options
- **Performance**: Sub-second response for typical portfolio sizes
- **Testing**: Unit, integration, and error scenario coverage

## Current Status & Recent Achievements

### ✅ Recently Completed (v2.1.0)
1. **Stable Transaction ID System** (v1.2.0) - Eliminated duplicate import issues
2. **Comprehensive Error Handling** (v2.0.0) - Professional-grade CSV import with recovery options
3. **Tax Reporting System** (v2.1.0) - Complete multi-method tax calculations with professional export capabilities

### 🎯 Current Status
**Pre-Production Development** - All core features implemented with comprehensive testing and documentation

### 📝 Development Notes
**Data Migration Policy**: Since the application is in pre-production development phase and not yet live, data migrations are not required. LocalStorage data can be purged as needed for structural changes without concern for user data preservation. This allows for more aggressive refactoring and schema evolution during development.

### 📋 Known Limitations

1. **Performance**: No virtualization for large transaction lists (10,000+ rows)
2. **Offline Support**: No service worker or offline capabilities
3. **Mobile**: Limited mobile optimization for complex tax tables
4. **Exchange APIs**: Only CSV import supported (no direct API integration)
5. **Disposal Tracking**: Manual disposal entry (no automatic exchange integration)

## Security Considerations

- **Client-side Only**: No server-side data transmission
- **Local Storage**: All data stays in browser localStorage
- **API Calls**: Only to public CoinGecko API (read-only)
- **No Authentication**: No user accounts or sensitive data handling

## Browser Compatibility

- **Modern Browsers**: Requires ES2021+ features
- **Local Storage**: Requires localStorage support
- **ResizeObserver**: Mocked for testing, required for charts
- **Fetch API**: Required for Bitcoin price updates

## Performance Characteristics

- **Bundle Size**: Optimized with Vite for small bundles
- **Chart Rendering**: Recharts provides efficient canvas-based rendering
- **Data Processing**: In-memory processing suitable for thousands of transactions
- **Real-time Updates**: Efficient price polling with cleanup

## Architecture & Design Principles

### Core Design Philosophy
- **Error-First Design**: Comprehensive error handling throughout the application
- **User Experience Focus**: Progressive disclosure and recovery options for all failure scenarios  
- **Data Integrity**: Zero data loss with automatic backup and migration systems
- **Type Safety**: Full TypeScript coverage with strict mode enabled
- **Testing Excellence**: >80% overall coverage, >90% for critical business logic

### Key Architectural Decisions

#### Multi-User Production Architecture
- **Hybrid Client-Server**: Core logic client-side, user data and auth server-side
- **Supabase Backend**: PostgreSQL database with Row Level Security for user isolation
- **Progressive Migration**: localStorage → database migration preserving existing functionality
- **Modular Design**: Clear separation between data processing, UI components, and business logic

#### Robust Data Processing
- **Multi-Stage Validation**: File → Structure → Row-level validation with specific error types
- **Stable ID Generation**: Content-based IDs that remain consistent across re-imports
- **Error Recovery**: Context-aware recovery options with user guidance and data export

#### Performance Considerations
- **Streaming Processing**: Large CSV files processed with progress indication
- **Memory Efficiency**: Proper cleanup and resource management
- **Caching Strategy**: Intelligent data caching with versioning for fast retrieval

### Technology Choices Rationale

#### Frontend Technologies
- **React 19**: Latest stable with concurrent features for smooth UX
- **TypeScript**: Strict typing prevents runtime errors and improves maintainability
- **Vite**: Fast development builds and optimized production bundles
- **Vitest**: Modern testing framework with excellent TypeScript integration
- **Tailwind CSS**: Utility-first CSS for rapid, consistent UI development

#### Infrastructure Technologies (Production)
- **Supabase**: Open-source Firebase alternative with PostgreSQL, generous free tier, built-in auth
- **Vercel**: Zero-config deployments, excellent Vite/React integration, automatic CI/CD
- **GitHub Actions**: Free for public repos, seamless Vercel integration, automated testing
- **PostgreSQL**: ACID compliance crucial for financial data, JSON support for flexibility
- **Row Level Security**: Database-level user isolation, eliminates complex server-side auth logic

## 🏗️ Infrastructure Transition (Q2 2025)

### Current Status: Feature-Complete → Multi-User Production

The application includes all essential Bitcoin DCA tracking features and is transitioning from localhost-only to production-ready multi-user platform:

#### ✅ Completed (Q1 2025)
- All core features: transaction tracking, tax reporting, self-custody monitoring
- Comprehensive testing with >90% coverage for critical calculations  
- Professional-grade error handling and data validation
- Advanced features: AI classification, security scoring, export capabilities

#### 🏗️ In Progress (Q2 2025) - Foundation Infrastructure
- **Phase 1 (March)**: Supabase + Vercel deployment with authentication
- **Phase 2 (April)**: Beta testing with trusted users, security hardening
- **Phase 3 (May)**: Production launch with professional monitoring
- **Phase 4 (Q3)**: Exchange API integrations (Strike, Coinbase, Kraken)

### Cost-Effective Scaling Strategy

#### Alpha Release: $0/month
- Supabase free tier (500MB DB, 50K requests)
- Vercel free tier (hobby projects)
- GitHub Actions free tier (2000 minutes)

#### Beta Release: ~$10-25/month
- Potential Supabase Pro upgrade ($25/month)
- Custom domain (~$15/year)
- Sentry error tracking (free tier)

#### Production Scale: Revenue-dependent
- Scale based on actual user growth and usage patterns
- Monitor unit economics and optimize before tier upgrades

This approach demonstrates modern full-stack development with React frontend and Supabase backend, emphasizing cost-effective scaling, security-first design, and user-focused financial data management.
