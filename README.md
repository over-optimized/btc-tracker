# Bitcoin DCA Tracker

A comprehensive web application for tracking your Bitcoin Dollar Cost Averaging (DCA) strategy across multiple exchanges. Features intelligent transaction classification, professional tax reporting, and self-custody tracking with milestone recommendations.

![Dashboard Preview](https://via.placeholder.com/800x400/f97316/ffffff?text=Bitcoin+DCA+Tracker+Dashboard)

## ✨ Key Features

### 🤖 **Intelligent Transaction Import**
- **Mixed CSV Support**: Automatically detects and classifies purchases, withdrawals, sales, and transfers
- **Smart Classification**: AI-powered transaction categorization with user confirmation for ambiguous cases
- **Multi-Exchange Support**: Strike, Coinbase, Kraken, and generic CSV formats
- **Bulk Actions**: One-click classification for common transaction patterns

### 🔐 **Self-Custody Tracking & Security**
- **Milestone Alerts**: Smart recommendations when you hit common self-custody thresholds (0.01, 0.1, 1.0 BTC)
- **Security Scoring**: Real-time assessment of exchange exposure and portfolio risk
- **Withdrawal Tracking**: Record Bitcoin movements to self-custody as non-taxable events
- **Exchange Balance Monitoring**: Track Bitcoin remaining on each exchange

### 💰 **Professional Tax Reporting**
- **Multi-Method Calculations**: FIFO, LIFO, HIFO, and Specific Identification tax methods
- **TurboTax Compatible**: Direct CSV export for seamless tax filing
- **Tax Optimization**: Strategy recommendations and hypothetical disposal analysis
- **Complete Audit Trail**: Lot-level tracking with holding period classification

### 📊 **Advanced Portfolio Analytics**
- **Real-Time Dashboard**: Live Bitcoin pricing with portfolio value tracking
- **Interactive Charts**: Portfolio growth, monthly investment analysis, and P&L trends
- **Data Freshness Alerts**: Smart reminders when transaction data becomes stale
- **Comprehensive History**: Paginated transaction management with detailed filtering

### 🛡️ **Privacy & Security**
- **100% Client-Side**: All data stays in your browser - no server uploads
- **Zero Tracking**: No analytics, cookies, or data collection
- **Local Storage**: Your data never leaves your device

## 🚀 Getting Started

### Installation

```bash
# Clone and setup
git clone <repository-url>
cd btc-tracker
pnpm install
pnpm dev
```

Visit `http://localhost:5173` to start tracking your Bitcoin investments!

### Quick Usage Guide

1. **📤 Import Transactions**: Upload CSV files from Strike, Coinbase, or Kraken
2. **🔍 Classify Mixed Transactions**: Confirm withdrawals as self-custody or sales when prompted
3. **📊 Monitor Portfolio**: View real-time analytics and security recommendations
4. **💰 Generate Tax Reports**: Export professional tax calculations when needed

> **💡 Pro Tip**: For daily DCA users - the app will remind you when your transaction data becomes stale!

## 📱 How It Works

### Smart CSV Import Process
1. **Upload** your exchange CSV file
2. **Auto-Detection** identifies transaction types (purchases, withdrawals, sales)
3. **Classification** prompts you to confirm ambiguous transactions
4. **Integration** merges all data with proper tax treatment

### Self-Custody Workflow  
1. **Milestone Alerts** notify you when you reach common thresholds (0.01 BTC, etc.)
2. **Record Withdrawals** to track Bitcoin moved to personal wallets
3. **Security Monitoring** shows your exchange exposure risk
4. **Tax Compliance** ensures withdrawals are marked as non-taxable events

## 📄 Supported Exchanges

| Exchange | CSV Export Location | Supported Transaction Types |
|----------|-------------------|----------------------------|
| **Strike** | Settings → Transaction History → Export | Purchases, Withdrawals, Sales |
| **Coinbase** | Portfolio → Statements → Generate Report | Buys, Sends, Sells |
| **Kraken** | History → Export Ledgers | Trades, Withdrawals |
| **Others** | Custom CSV | Any format with Date, Amount, Type columns |

> **📋 Mixed Transaction Support**: The app intelligently handles CSV files containing both purchases AND withdrawals/sales - just upload and confirm the transaction types when prompted!

## 🛠️ For Developers

Interested in contributing or running locally? Check out our comprehensive technical documentation:

📖 **[CLAUDE.md](CLAUDE.md)** - Complete development guide including:
- Architecture details and design decisions
- Build, test, and lint instructions  
- Component structure and code organization
- Development standards and best practices

### Quick Development Setup

```bash
# Development commands
pnpm dev                # Start development server
pnpm test               # Run tests (no coverage)
pnpm test:coverage      # Run tests with coverage thresholds
pnpm lint               # Check code quality (ESLint v9)
pnpm lint:fix           # Auto-fix linting issues
pnpm format             # Format code with Prettier
pnpm build              # Build for production

# Quality gates
pnpm quality            # Fast: lint + coverage
pnpm ci                 # Full: lint + coverage + build
```

**Coverage Thresholds (Enforced)**:
- Overall: 75% minimum
- Custom hooks (`src/hooks/`): 85% minimum  
- Tax utilities (`src/utils/tax*`): 95% minimum

### Contributing

1. **Fork and Setup**: Fork the repo and create a feature branch
2. **Development**: Follow the coding standards detailed in [CLAUDE.md](CLAUDE.md)
3. **Testing**: Add comprehensive tests for new features
   - Custom hooks require 85%+ coverage
   - Tax utilities require 95%+ coverage
   - Run `pnpm test:coverage` to verify thresholds
4. **Quality Gates**: Ensure all checks pass
   - Run `pnpm quality` for fast lint + coverage check
   - Run `pnpm ci` for full validation pipeline
5. **Documentation**: Update relevant docs (see checklist below)
6. **Submit**: Create pull request with clear description

#### Documentation Checklist

For significant features or changes, update these files:

- [ ] **CLAUDE.md**: Add new components to project structure, update commands/features
- [ ] **CHANGELOG.md**: Document feature with development metrics (model, tokens, cost)
- [ ] **README.md**: Update user-facing features or setup instructions if needed
- [ ] **Tests**: Ensure new functionality has comprehensive test coverage

## 🎯 Project Status

**Current Version**: v0.3.0-dev (Pre-Alpha Development)  
**Development Status**: Q1 2025 features complete, preparing for Alpha infrastructure deployment ✅

Recent major additions:
- ✅ **Intelligent Transaction Classification** - Mixed CSV file support
- ✅ **Self-Custody Tracking** - Security scoring and milestone alerts  
- ✅ **Professional Tax Reporting** - Multi-method calculations with TurboTax export
- ✅ **Smart Import Reminders** - Data freshness monitoring for active traders

---

## 📄 License & Disclaimer

**License**: MIT License - see [LICENSE](LICENSE) file for details

**⚠️ Important Disclaimer**: This tool is for portfolio tracking and record-keeping purposes only. It does not constitute financial, tax, or investment advice. Always consult with qualified professionals for tax preparation and investment decisions. The tax calculations provided are estimates and should be verified with tax professionals.

## 🙏 Credits

- [CoinGecko API](https://coingecko.com) for real-time Bitcoin price data
- [Recharts](https://recharts.org) for beautiful, responsive chart components  
- [Lucide](https://lucide.dev) for clean, consistent icons
