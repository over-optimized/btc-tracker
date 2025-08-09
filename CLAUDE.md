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
│   ├── TransactionHistory.tsx # Paginated transaction table
│   └── UploadTransactions.tsx # File upload interface
├── types/                   # TypeScript type definitions
│   ├── Stats.ts            # Portfolio statistics interface
│   └── Transaction.ts      # Transaction data model
├── utils/                   # Utility functions
│   ├── exchangeParsers.ts  # Multi-exchange CSV parsers
│   ├── formatBTC.ts        # Bitcoin amount formatting
│   ├── formatCurrency.ts   # Currency formatting
│   └── storage.ts          # localStorage management
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

## Technical Highlights

### CSV Processing Pipeline

1. **File Upload**: Drag-and-drop or click-to-upload interface
2. **Format Detection**: Automatic exchange format recognition
3. **Data Parsing**: Exchange-specific parsers with validation
4. **Deduplication**: ID-based duplicate prevention
5. **Storage**: Persistent localStorage with proper serialization

### Chart System

- **Responsive Design**: Charts adapt to container sizes
- **Time Series Data**: Proper date handling and sorting
- **Interactive Tooltips**: Formatted currency and BTC values
- **Multiple Chart Types**: Line charts, area charts, bar charts

### Testing Strategy

- **Unit Tests**: Utility functions and parsers
- **Component Tests**: UI components with realistic data
- **Integration Tests**: Chart rendering and interaction
- **Coverage**: Comprehensive test coverage for core logic

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

# View coverage report
open coverage/index.html
```

### Code Quality

```bash
pnpm lint      # ESLint checking
pnpm format    # Prettier formatting
pnpm dev       # Development server
pnpm build     # Production build
```

## Current Limitations & Known Issues

1. **ID Stability**: Coinbase and Kraken parsers use timestamp-based IDs
2. **Exchange Detection**: Could be more robust with better format signatures
3. **Data Validation**: Limited validation of CSV data integrity
4. **Error Handling**: Basic error messages, could be more user-friendly
5. **Performance**: No virtualization for large transaction lists
6. **Offline Support**: No service worker or offline capabilities

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

This project demonstrates modern React development practices with comprehensive testing, type safety, and user-focused design principles.
