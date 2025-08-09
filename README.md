# Bitcoin DCA Tracker

A comprehensive React + TypeScript web application for tracking Bitcoin Dollar Cost Averaging (DCA) purchases across multiple cryptocurrency exchanges with advanced analytics and visualizations.

![Dashboard Preview](https://via.placeholder.com/800x400/f97316/ffffff?text=Bitcoin+DCA+Tracker+Dashboard)

## 🚀 Features

### 📊 **Advanced Analytics Dashboard**

- **Real-time Portfolio Overview**: Total invested, BTC holdings, average cost basis, and unrealized P&L
- **Live Bitcoin Pricing**: Real-time BTC/USD prices via CoinGecko API with 30-second refresh
- **Interactive Charts**: Portfolio value over time, monthly investment analysis, and P&L trends

### 📁 **Multi-Exchange CSV Import**

- **Strike**: Full support with reference ID-based deduplication
- **Coinbase**: Buy/purchase transaction parsing with multiple format support
- **Kraken**: Trade transaction processing with pair filtering
- **Generic CSV**: Flexible parser for custom formats and other exchanges

### 🧮 **Smart Data Processing**

- **Automatic Deduplication**: Prevents duplicate transactions using stable IDs
- **Exchange Detection**: Intelligent format recognition for seamless imports
- **Data Validation**: Robust parsing with error handling and user feedback

### 📈 **Comprehensive Visualizations**

- **Portfolio Value Chart**: Track your investment growth over time
- **Investment vs P&L**: Monthly breakdown of contributions and returns
- **Cumulative Bitcoin**: Visualize your BTC accumulation journey
- **Cost Basis Analysis**: Compare your average cost to current market price

### 🗂️ **Transaction Management**

- **Paginated History**: View transactions with customizable page sizes (10/25/50/100)
- **Exchange Tagging**: Color-coded transaction sources
- **Sortable Data**: Organize transactions by date, amount, or exchange
- **Import Summaries**: Detailed feedback on each CSV upload

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts for responsive data visualization
- **Routing**: React Router DOM
- **Testing**: Vitest + Testing Library + Jest DOM
- **Code Quality**: ESLint + Prettier
- **Data Processing**: Papa Parse for CSV handling
- **Icons**: Lucide React

## 🚦 Quick Start

### Prerequisites

- Node.js 16+
- PNPM (recommended) or npm

### Installation & Setup

```bash
# Clone the repository
git clone <repository-url>
cd btc-tracker

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:5173`

### Usage

1. **📤 Upload CSV Files**: Navigate to the Upload tab and drag-and-drop your exchange CSV files
2. **📊 View Analytics**: Check your dashboard for real-time portfolio statistics
3. **📈 Explore Charts**: Analyze your DCA strategy with comprehensive visualizations
4. **🗃️ Browse Transactions**: Review your transaction history with detailed filtering

## 📋 Scripts

```bash
pnpm dev        # Start development server
pnpm build      # Build for production
pnpm preview    # Preview production build
pnpm test       # Run tests with coverage
pnpm lint       # Run ESLint
pnpm format     # Format code with Prettier
```

## 📁 Project Structure

```
src/
├── components/         # React components
│   ├── __tests__/     # Component tests
│   └── *.tsx          # UI components
├── types/             # TypeScript definitions
├── utils/             # Utilities & parsers
├── apis/              # External API integrations
└── app.tsx            # Main application
```

## 🔧 Supported CSV Formats

### Strike Format

```csv
Reference,Date & Time (UTC),Transaction Type,Amount USD,Amount BTC,BTC Price
abc-123,Jan 01 2025 14:36:06,Purchase,-50.00,0.00053277,93849.13
```

### Coinbase Format

```csv
Transaction Type,Timestamp,USD Spot Price at Transaction,Quantity Transacted
Buy,2025-01-01T12:00:00Z,40000,0.001
```

### Kraken Format

```csv
type,pair,time,cost,vol,price
trade,XBTUSD,2025-01-01T12:00:00Z,100,0.002,50000
```

### Generic Format

```csv
Date,USD Amount,BTC Amount,Exchange,Type
2025-01-01,20,0.0005,Custom,Buy
```

## 🧪 Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test --run src/components/__tests__/ComponentName.test.tsx

# View coverage report
open coverage/index.html
```

Test coverage includes:

- ✅ Component rendering and interactions
- ✅ Exchange parser logic and edge cases
- ✅ Chart data processing and visualization
- ✅ Transaction deduplication and validation

## 🔒 Privacy & Security

- **Local-First**: All data stored in browser localStorage
- **No Server**: Client-side only application
- **No Tracking**: No analytics or user tracking
- **Open Source**: Full transparency of data handling

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests and ensure code quality (`pnpm test && pnpm lint`)
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Development Guidelines

- Follow the existing code style (ESLint + Prettier)
- Add tests for new features and bug fixes
- Update documentation for significant changes
- Ensure all tests pass before submitting PRs

## 📝 TODO & Roadmap

### High Priority

- [ ] **Enhanced Exchange Support**: Add Binance, Gemini, and other major exchanges
- [ ] **Stable Transaction IDs**: Improve ID generation for Coinbase/Kraken imports
- [ ] **Data Export**: CSV/JSON export functionality for backup/analysis
- [ ] **Advanced Filtering**: Filter transactions by date range, exchange, amount

### Medium Priority

- [ ] **Portfolio Allocation**: Track multiple cryptocurrencies beyond Bitcoin
- [ ] **Tax Reporting**: Generate tax-friendly reports and calculations
- [ ] **Price Alerts**: Set alerts for target price levels
- [ ] **Mobile App**: React Native mobile version

### Nice to Have

- [ ] **Dark Mode**: Toggle between light/dark themes
- [ ] **Data Sync**: Optional cloud backup/sync across devices
- [ ] **Advanced Charts**: Candlestick charts, technical indicators
- [ ] **Performance Optimization**: Virtual scrolling for large datasets

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- [CoinGecko API](https://coingecko.com) for Bitcoin price data
- [Recharts](https://recharts.org) for beautiful chart components
- [Lucide](https://lucide.dev) for clean, consistent icons

---

**Disclaimer**: This tool is for tracking purposes only and does not constitute financial advice. Always do your own research before making investment decisions.
