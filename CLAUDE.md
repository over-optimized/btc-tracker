# CLAUDE.md - Bitcoin DCA Tracker

## Project Overview

The Bitcoin DCA Tracker is a modern React + TypeScript web application designed to help users track their Bitcoin Dollar Cost Averaging (DCA) purchases across multiple cryptocurrency exchanges. The app provides comprehensive analytics, visualizations, and transaction management capabilities.

## Tech Stack

- **React 19** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for styling (via CDN)
- **Recharts** for data visualization
- **Supabase** - PostgreSQL database, authentication, and real-time APIs
- **Vercel** - Frontend deployment and hosting
- **PNPM** as package manager

## Quick Setup

```bash
git clone <repository-url>
cd btc-tracker
pnpm install
pnpm dev        # Start development server (http://localhost:5173)
```

## Project-Specific Commands

```bash
# Testing
pnpm test:e2e               # End-to-end testing with Playwright
pnpm test:e2e:ui            # Interactive test runner

# Analysis
pnpm build:analyze          # Bundle analysis with visualization
```

## Core Features

### 1. Intelligent Transaction Classification System

- **12 Classification Types**: Complete tax-aware categorization system
- **Mixed CSV Support**: Handles purchases, withdrawals, sales, and transfers
- **Smart Auto-Classification**: Pattern recognition with confidence scoring
- **Feature Flag Integration**: Expandable classification system

### 2. Professional Tax Reporting System

- **Multi-Method Calculations**: FIFO, LIFO, HIFO, and Specific Identification
- **Lot-Level Tracking**: Individual purchase lots with partial disposal support
- **Professional Export**: TurboTax-compatible CSV, comprehensive JSON formats

### 3. Enhanced Multi-Exchange Support

- **Strike**: All transaction types with reference IDs
- **Coinbase**: Full transaction parsing with multiple format support
- **Kraken**: Complete trade and withdrawal processing
- **Generic CSV**: Flexible parser for any exchange format

### 4. Advanced Portfolio Analytics

- **Real-Time Dashboard**: Live Bitcoin pricing with portfolio value tracking
- **Interactive Charts**: Portfolio growth, cumulative investment analysis, P&L trends

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

  // Extended fields for enhanced classification
  destinationWallet?: string; // Wallet name or address
  networkFee?: number; // Network fee in BTC
  isSelfCustody?: boolean; // Self-custody movement flag
  isTaxable?: boolean; // Taxable event flag
  counterparty?: string; // P2P transaction counterparty
  goodsServices?: string; // Description for taxable transactions
  sourceExchange?: string; // Source exchange for transfers
  destinationExchange?: string; // Destination exchange for transfers
}
```

## Project-Specific Standards

### Coverage Thresholds (Enforced)

- Overall: 75% minimum
- `src/hooks/`: 85% minimum
- `src/utils/tax*`: 95% minimum

### Feature Flag System

- **Development**: `VITE_ENABLE_EXPANDED_CLASSIFICATIONS=true`
- **Production**: Feature flags control legal compliance and risk management
- **Safe Mode**: High-risk features disabled in production

### Exchange Parser Details

#### Strike Parser

- **Trigger**: `Date & Time (UTC)` and `Transaction Type` fields
- **ID Generation**: Uses `Reference` field for stable IDs
- **Lightning Support**: Proper invoice handling and truncation

#### Coinbase Parser

- **Trigger**: `Transaction Type` field with "Buy" or "Purchase"
- **Multi-Format**: Supports various export format variations

#### Kraken Parser

- **Trigger**: `type: "trade"` with Bitcoin/USD pairs
- **Pair Filtering**: Only processes XBT/USD related trades

## Classification System

### 12 Classification Types

**Income (Non-Taxable)**

- Buy Bitcoin, Lightning Receive, P2P Receive, Mining Reward, Staking Reward, Airdrop

**Disposal (Taxable)**

- Sale, Lightning Send, P2P Send, Donation, Gift

**Transfer (Non-Taxable)**

- Transfer

## Current Development Status

### ✅ Recently Completed

1. **Technical Debt Cleanup** - 18% lint improvement (182→149 warnings), enhanced test coverage for hooks and tax utilities
2. **Phase 1D Test Infrastructure** - 78+ test scenarios across 5 comprehensive test files
3. **Transaction Refresh Optimization** - 60-80% performance improvement via 3-phase optimization
4. **Code Quality Enhancement** - Type safety improvements, unused variable cleanup, comprehensive test suites
5. **Production Readiness** - Clean, maintainable codebase ready for Phase 2 development
6. **Smart Cache Strategy** - Intelligent invalidation with performance monitoring
7. **Comprehensive Testing** - 406+ tests passing with robust coverage enforcement

### 🎯 Next Development Phase

**Phase 2: Beta Security & Multi-User** (Ready to begin)

- Enhanced data backup/export functionality
- Privacy policy and terms of service
- Basic audit logging and monitoring
- Beta user invite system

## Security & Compliance

- **Client-side Only**: No server-side data transmission (current architecture)
- **Local Storage**: All data stays in browser localStorage
- **Feature Flags**: Legal compliance through controlled feature rollout
- **Future**: Row Level Security with Supabase for multi-user production

## Performance Characteristics

- **Bundle Size**: Main bundle ~262KB, charts lazy-loaded ~347KB
- **Chart Rendering**: Recharts provides efficient canvas-based rendering
- **Data Processing**: In-memory processing suitable for thousands of transactions
- **Performance Optimization**: 60-80% improvement in useEffect evaluations and component re-renders
- **Smart Caching**: Intelligent cache invalidation with monitoring and statistics
- **Memory Efficiency**: Optimized React hooks and memoization patterns

---

This project follows the global CLAUDE.md development standards for workflow, testing, and quality gates.

## Git Workflow Standards

### Branch Management

**Required Workflow:**

1. **Feature Branches**: Always create feature branches from `staging` for new work
2. **Branch Naming**: Use descriptive names like `feat/phase-1c-optional-authentication`
3. **Never Direct Commits**: Avoid committing directly to `staging` - use feature branches
4. **Pull Requests**: Create PRs from feature branch to `staging` for code review

**Example Workflow:**

```bash
# Create feature branch from staging
git checkout staging
git pull origin staging
git checkout -b feat/your-feature-name

# Work on feature, commit frequently
git add -A && git commit -m "descriptive message"

# Push feature branch and create PR
git push -u origin feat/your-feature-name
gh pr create --title "feat: Your Feature" --body "Description..."

# After PR approval, merge to staging
```

**Branch Recovery (if commits made directly to staging):**

```bash
# Create feature branch from current HEAD
git checkout -b feat/feature-name

# Reset staging to match origin
git checkout staging
git reset --hard origin/staging

# Push feature branch and create PR
git checkout feat/feature-name
git push -u origin feat/feature-name
```

- Do not use the Generated with Claude Code signature on PRs
- non negotiable, never use --no-verify for git commands
