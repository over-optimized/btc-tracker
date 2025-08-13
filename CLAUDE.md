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

### Backend & Infrastructure

- **Supabase** - PostgreSQL database, authentication, and real-time APIs
- **Vercel** - Frontend deployment and hosting with automatic CI/CD
- **GitHub Actions** - Automated testing and deployment pipeline
- **Row Level Security** - Database-level user data isolation

### Development Tools

- **ESLint** + **Prettier** for code quality
- **Vitest** + **Testing Library** for comprehensive testing
- **PNPM** as package manager
- **Husky + lint-staged** for git hooks and pre-commit validation
- **Feature Flag System** for legal compliance and risk management

### Key Libraries

- **Papa Parse** for CSV parsing
- **Lucide React** for icons
- **Supabase Client** for database and authentication
- **localStorage** for temporary data persistence (migration to database)

## Project Structure

```
src/
├── apis/                    # External API integrations
├── components/              # React components
│   ├── AdditionalCharts.tsx # Advanced chart visualizations
│   ├── DashboardOverview.tsx # Main stats dashboard
│   ├── TaxDashboard.tsx     # Main tax reporting page
│   ├── TransactionHistory.tsx # Paginated transaction table
│   └── UploadTransactions.tsx # File upload interface
├── hooks/                   # Custom React hooks
│   ├── useBitcoinPrice.ts   # Bitcoin price fetching and polling
│   ├── usePortfolioStats.ts # Portfolio statistics calculations
│   └── useTransactionManager.ts # Transaction state and persistence
├── types/                   # TypeScript type definitions
├── utils/                   # Utility functions
│   ├── enhancedCsvProcessor.ts # Enhanced CSV processor with classification
│   ├── taxCalculator.ts     # Tax calculation engine (multi-method)
│   └── transactionClassifier.ts # AI-powered transaction classification
├── app.tsx                  # Main application component
└── main.tsx                # Application entry point
```

## Quick Setup

### Prerequisites

```bash
node >= 16.0.0
pnpm >= 8.0.0
```

### Installation

```bash
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
pnpm lint       # Run ESLint
pnpm format     # Format code with Prettier

# Testing
pnpm test                    # Run tests
pnpm test:coverage          # Run tests with coverage
pnpm test:e2e               # End-to-end testing

# Quality Gates
pnpm quality    # Run lint + coverage (required before push)
pnpm ci         # Full CI pipeline: lint + test + build
```

## Core Features

### 1. Intelligent Transaction Classification System

- **Mixed CSV Support**: Handles files containing purchases, withdrawals, sales, and transfers
- **Smart Auto-Classification**: Pattern recognition with 90%+ confidence scoring
- **Interactive Classification UI**: User-friendly modal for ambiguous transactions
- **Tax-Aware Processing**: Properly categorizes transactions for tax implications

### 2. Professional Tax Reporting System

- **Multi-Method Calculations**: FIFO, LIFO, HIFO, and Specific Identification
- **Lot-Level Tracking**: Individual purchase lots with partial disposal support
- **Professional Export**: TurboTax-compatible CSV, comprehensive JSON formats
- **Tax Optimization**: Strategy recommendations and hypothetical disposal analysis

### 3. Self-Custody Tracking & Security

- **Milestone Recommendations**: Smart alerts at key BTC thresholds
- **Security Scoring**: Real-time assessment (0-100) based on exchange exposure
- **Withdrawal Recording**: Manual entry for Bitcoin moved to self-custody
- **Risk Analysis**: Visual indicators and educational content

### 4. Enhanced Multi-Exchange Support

- **Strike**: All transaction types with reference IDs
- **Coinbase**: Full transaction parsing with multiple format support
- **Kraken**: Complete trade and withdrawal processing
- **Generic CSV**: Flexible parser for any exchange format

### 5. Advanced Portfolio Analytics

- **Real-Time Dashboard**: Live Bitcoin pricing with portfolio value tracking
- **Interactive Charts**: Portfolio growth, cumulative investment analysis, P&L trends
- **Performance Metrics**: Unrealized gains, average cost basis, total returns

## Data Models

### Core Transaction Interface

```typescript
interface Transaction {
  id: string; // Unique identifier for deduplication
  date: Date; // Transaction timestamp
  exchange: string; // Exchange name
  type: string; // Transaction type (Purchase, Withdrawal, Sale, etc.)
  usdAmount: number; // USD amount (0 for withdrawals)
  btcAmount: number; // Bitcoin amount (positive for acquisitions)
  price: number; // Bitcoin price at transaction time

  // Extended fields for withdrawal tracking
  destinationWallet?: string; // Wallet name or address where Bitcoin was sent
  networkFee?: number; // Network fee in BTC for withdrawals
  isSelfCustody?: boolean; // Flag indicating this is a self-custody movement
  isTaxable?: boolean; // Whether this creates a taxable event
}
```

### Portfolio Statistics

```typescript
interface Stats {
  totalInvested: number; // Total USD invested
  totalBitcoin: number; // Total BTC acquired
  avgCostBasis: number; // Average cost per BTC
  currentValue: number; // Current portfolio value
  unrealizedPnL: number; // Profit/Loss vs investment
}
```

## Development Standards

### Code Quality Requirements

- **TypeScript**: Strict mode enabled - no implicit any
- **ESLint**: 0 critical errors (warnings acceptable)
- **Testing**: 75% overall coverage, 85% for hooks, 95% for tax calculations
- **Performance**: Main bundle <300KB, lazy loading for heavy components

### Git Workflow

- **Feature Branches**: Always create feature branches for new work
- **Quality Gates**: All tests and linting must pass before push
- **Conventional Commits**: Use standard commit message format
- **No Bypass**: Never use `--no-verify` to bypass quality checks

### Legal Compliance

- **Feature Flags**: All tax education features behind feature flags
- **Safe Mode**: Production runs with high-risk features disabled
- **Disclaimers**: Professional consultation guidance required

## Testing Strategy

### Coverage Thresholds (Enforced)

- Overall: 75% minimum
- `src/hooks/`: 85% minimum
- `src/utils/tax*`: 95% minimum

### Test Commands

```bash
# Specific test groups
pnpm test src/hooks/                    # All custom hook tests
pnpm test src/utils/__tests__/tax       # All tax calculation tests

# Coverage with different output formats
pnpm test:coverage              # CLI summary + HTML report
pnpm test:coverage:html         # Generate and open HTML report

# End-to-End Testing
pnpm test:e2e                   # All Playwright tests
pnpm test:e2e:ui                # Interactive test runner
```

## Exchange Parser Details

### Strike Parser

- **Trigger**: `Date & Time (UTC)` and `Transaction Type` fields
- **ID Generation**: Uses `Reference` field for stable IDs
- **Fields**: Amount USD, Amount BTC, BTC Price

### Coinbase Parser

- **Trigger**: `Transaction Type` field with "Buy" or "Purchase"
- **Fields**: Supports multiple field variations for different export formats

### Kraken Parser

- **Trigger**: `type: "trade"` with Bitcoin/USD pairs
- **Pair Filtering**: Only processes XBT/USD related trades

## Current Status

### ✅ Recently Completed (Q1 2025)

1. **Stable Transaction ID System** - Eliminated duplicate import issues
2. **Comprehensive Error Handling** - Professional-grade CSV import with recovery
3. **Tax Reporting System** - Complete multi-method tax calculations
4. **Intelligent Classification & Self-Custody** - Mixed CSV support and security tracking
5. **Legal Compliance & Feature Flag System** - Risk-based feature management

### 🎯 Current Status

**Legal Compliance Implementation** - All core features implemented with comprehensive testing. Feature flag system implemented for legal risk management.

## Documentation

For detailed information, see:

- **[MCP Setup Guide](docs/mcp-setup.md)** - GitHub MCP server configuration
- **[Deployment Guide](docs/deployment.md)** - Git-based deployment workflow
- **[Performance Guidelines](docs/performance-guidelines.md)** - Bundle optimization standards
- **[Git Workflow](docs/git-workflow.md)** - Branch management and quality gates
- **[Architecture Guide](docs/architecture.md)** - Design principles and technology choices
- **[User Education Guidelines](docs/user-education-guidelines.md)** - UX standards for educational features
- **[Development Tracking](docs/development-tracking.md)** - Cost analysis and documentation workflows
- **[Feature Flags Documentation](docs/feature-flags.md)** - Legal compliance system
- **[Legal Compliance Plan](docs/legal-compliance-plan.md)** - Risk management strategy
- **[Tasks & Planning](docs/tasks.md)** - Current development priorities

## Security Considerations

- **Client-side Only**: No server-side data transmission (current)
- **Local Storage**: All data stays in browser localStorage
- **API Calls**: Only to public CoinGecko API (read-only)
- **Future**: Row Level Security with Supabase for multi-user production

## Performance Characteristics

- **Bundle Size**: Main bundle ~262KB, charts lazy-loaded ~347KB
- **Chart Rendering**: Recharts provides efficient canvas-based rendering
- **Data Processing**: In-memory processing suitable for thousands of transactions
- **Browser Support**: Modern browsers with ES2021+ features

---

This documentation provides essential information for development. For comprehensive details on specific topics, refer to the linked documentation files in the `docs/` directory.
