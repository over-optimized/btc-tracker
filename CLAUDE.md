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

### Development Tools

- **ESLint** + **Prettier** for code quality
- **Vitest** + **Testing Library** for comprehensive testing
- **PNPM** as package manager

### Key Libraries

- **Papa Parse** for CSV parsing
- **Lucide React** for icons
- **localStorage** for data persistence

## Project Structure

```
src/
├── apis/                    # External API integrations
│   └── fetchBitcoinPrice.ts # CoinGecko price fetching
├── components/              # React components
│   ├── __tests__/          # Component tests
│   ├── AdditionalCharts.tsx # Advanced chart visualizations
│   ├── DashboardOverview.tsx # Main stats dashboard
│   ├── ImportSummaryModal.tsx # Import feedback modal
│   ├── InvestedVsPnLChart.tsx # Monthly investment analysis
│   ├── NavBar.tsx          # Navigation component
│   ├── PortfolioValueChart.tsx # Portfolio value over time
│   ├── TaxConfig.tsx       # Tax configuration interface
│   ├── TaxDashboard.tsx    # Main tax reporting page
│   ├── TaxExport.tsx       # Tax report export functionality
│   ├── TaxOptimization.tsx # Tax strategy and analysis tools
│   ├── TaxReport.tsx       # Tax report display component
│   ├── TaxSummaryCard.tsx  # Dashboard tax summary widget
│   ├── TransactionHistory.tsx # Paginated transaction table
│   └── UploadTransactions.tsx # File upload interface
├── types/                   # TypeScript type definitions
│   ├── Stats.ts            # Portfolio statistics interface
│   ├── TaxTypes.ts         # Tax calculation type definitions
│   └── Transaction.ts      # Transaction data model
├── utils/                   # Utility functions
│   ├── exchangeParsers.ts  # Multi-exchange CSV parsers
│   ├── formatBTC.ts        # Bitcoin amount formatting
│   ├── formatCurrency.ts   # Currency formatting
│   ├── storage.ts          # localStorage management
│   ├── taxCalculator.ts    # Tax calculation engine
│   └── taxLotManager.ts    # Tax lot tracking system
├── app.tsx                  # Main application component
└── main.tsx                # Application entry point
```

## Core Features

### 1. Multi-Exchange Support

- **Strike**: Parses purchase transactions with reference IDs
- **Coinbase**: Supports buy/purchase transaction types
- **Kraken**: Handles trade transactions with pair filtering
- **Generic**: Fallback parser for custom CSV formats

### 2. Real-time Data

- Live Bitcoin price updates via CoinGecko API
- Automatic price refresh every 30 seconds
- Real-time portfolio value calculations

### 3. Advanced Analytics

- **Dashboard Overview**: Total invested, BTC holdings, average cost basis, unrealized P&L
- **Portfolio Value Chart**: Historical portfolio value tracking
- **Investment vs P&L**: Monthly breakdown of investments and returns
- **Additional Charts**: Cumulative BTC acquisition, cost basis analysis, P&L trends

### 4. Transaction Management

- Automatic deduplication by transaction ID
- Paginated transaction history (10/25/50/100 per page)
- Exchange-specific transaction tagging
- Import summary with detailed feedback

### 5. Data Persistence

- localStorage-based data storage
- Transaction serialization with Date object handling
- Clear data functionality with confirmation

### 6. Tax Reporting System

- **Multi-Method Support**: FIFO, LIFO, HIFO, and Specific Identification tax calculations
- **Comprehensive Reports**: Detailed acquisition and disposal tracking with holding periods
- **Tax Optimization**: Strategy recommendations and hypothetical disposal analysis
- **Professional Export**: CSV, JSON, and TurboTax-compatible formats
- **Dashboard Integration**: Tax summary cards with real-time calculations

## Technical Highlights

### Robust CSV Processing Pipeline (v2.0.0)

1. **File Validation**: Size, type, and structure validation before processing
2. **Format Detection**: Intelligent exchange format recognition with confidence scoring
3. **Multi-Layer Validation**: File → structure → row-level data validation
4. **Error Recovery**: Context-aware recovery options with user guidance
5. **Progress Tracking**: Real-time progress indication for large files
6. **Deduplication**: Stable ID-based duplicate prevention across re-imports
7. **Storage**: Persistent localStorage with versioning and migration support

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

### Tax Calculation Engine (v2.1.0)

- **Multi-Method Support**: Complete implementation of FIFO, LIFO, HIFO, and Specific Identification
- **Lot Tracking**: Individual purchase lot management with partial disposal support
- **Holding Period Logic**: Automatic short-term vs long-term classification (365+ days)
- **Tax Event Generation**: Complete audit trail of acquisitions and disposals
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

### Transaction Interface

```typescript
interface Transaction {
  id: string; // Unique identifier for deduplication
  date: Date; // Transaction timestamp
  exchange: string; // Exchange name (Strike, Coinbase, etc.)
  type: string; // Transaction type (Purchase, Buy, etc.)
  usdAmount: number; // USD amount invested
  btcAmount: number; // Bitcoin amount acquired
  price: number; // Bitcoin price at transaction time
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
1. Update CLAUDE.md with new technical details
2. Add entry to CHANGELOG.md with version bump
3. Update PROJECT_STATUS.md current status
4. Remove completed items from critical-features.md
5. Commit all documentation updates together
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
**Production Ready** - All core features implemented with comprehensive testing and documentation

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

#### Client-Side Architecture
- **No Backend Dependency**: All processing happens in browser for privacy and simplicity
- **localStorage Persistence**: Versioned data storage with automatic migration
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
- **React 19**: Latest stable with concurrent features for smooth UX
- **TypeScript**: Strict typing prevents runtime errors and improves maintainability
- **Vite**: Fast development builds and optimized production bundles
- **Vitest**: Modern testing framework with excellent TypeScript integration
- **Tailwind CSS**: Utility-first CSS for rapid, consistent UI development

This project demonstrates modern React development practices with comprehensive testing, type safety, and user-focused design principles, specifically architected for financial data accuracy and user trust.
