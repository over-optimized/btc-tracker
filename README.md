# Bitcoin DCA Tracker

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Actions](https://github.com/over-optimized/btc-tracker/workflows/CI/badge.svg)](https://github.com/over-optimized/btc-tracker/actions)
[![Open Source](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/ellerbrock/open-source-badges/)

An **open source** comprehensive web application for tracking your Bitcoin Dollar Cost Averaging (DCA) strategy across multiple exchanges. Features intelligent transaction classification, professional tax reporting, and self-custody tracking with milestone recommendations.

**🎯 Mission**: Provide free, open source tools to help Bitcoin investors track their DCA strategies and understand tax implications through mathematical calculations (not tax advice).

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
- **Optional Cloud Sync**: Secure authentication with Supabase for data backup (completely optional)

### 🔐 **Smart Authentication System**

- **Context-Aware Authentication**: Intelligent messaging based on your usage patterns
- **Authentication History**: Tracks user preferences to provide personalized experiences
- **Multi-User Device Support**: Detects shared devices and provides appropriate options
- **Space-Efficient Design**: Clean header integration optimized for mobile and desktop

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

| Exchange     | CSV Export Location                      | Supported Transaction Types                |
| ------------ | ---------------------------------------- | ------------------------------------------ |
| **Strike**   | Settings → Transaction History → Export  | Purchases, Withdrawals, Sales              |
| **Coinbase** | Portfolio → Statements → Generate Report | Buys, Sends, Sells                         |
| **Kraken**   | History → Export Ledgers                 | Trades, Withdrawals                        |
| **Others**   | Custom CSV                               | Any format with Date, Amount, Type columns |

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

### 🤝 Contributing to Open Source

**This is an open source project and contributions are welcome!** Whether you're:

- A Bitcoin DCA investor with feature ideas
- A developer who wants to improve cryptocurrency tools
- A tax professional with compliance insights
- Someone who found a bug or wants to improve documentation

#### How to Contribute

1. **Fork and Setup**: Fork the repo and create a feature branch
2. **Development**: Follow the coding standards detailed in [CLAUDE.md](CLAUDE.md)
3. **Testing**: Add comprehensive tests for new features
   - Custom hooks require 85%+ coverage
   - Tax utilities require 95%+ coverage
   - Run `pnpm test:coverage` to verify thresholds
4. **Quality Gates**: Ensure all checks pass
   - Run `pnpm quality` for fast lint + coverage check
   - Run `pnpm ci` for full validation pipeline
5. **Legal Compliance**: For tax-related features, review [legal compliance documentation](docs/legal-compliance-plan.md)
6. **Documentation**: Update relevant docs (see checklist below)
7. **Submit**: Create pull request with clear description

#### Types of Contributions Welcome

- 🐛 **Bug fixes** and performance improvements
- ✨ **New exchange support** (add your favorite exchange's CSV parser)
- 📊 **Analytics features** and portfolio insights
- 🧪 **Testing** improvements and coverage increases
- 📚 **Documentation** improvements and translations
- 🎨 **UI/UX** improvements and accessibility enhancements

#### Documentation Checklist

For significant features or changes, update these files:

- [ ] **CLAUDE.md**: Add new components to project structure, update commands/features
- [ ] **CHANGELOG.md**: Document feature with development metrics (model, tokens, cost)
- [ ] **README.md**: Update user-facing features or setup instructions if needed
- [ ] **Tests**: Ensure new functionality has comprehensive test coverage

## 🎯 Project Status

**Current Version**: v0.3.0-dev (Pre-Alpha Development)  
**Development Status**: Q1 2025 features complete, implementing legal compliance for production deployment ⚖️

Recent major additions:

- ✅ **Intelligent Transaction Classification** - Mixed CSV file support
- ✅ **Self-Custody Tracking** - Security scoring and milestone alerts
- ✅ **Professional Tax Reporting** - Multi-method calculations with TurboTax export
- ✅ **Smart Import Reminders** - Data freshness monitoring for active traders
- 🔄 **Legal Compliance System** - Feature flag implementation for production safety

**🚨 Production Readiness**: Currently implementing feature flag system to ensure all educational content meets legal compliance standards before public deployment.

---

## 📄 License & Disclaimer

**License**: MIT License - see [LICENSE](LICENSE) file for details

**⚠️ IMPORTANT LEGAL NOTICE**: This application is a **portfolio tracking and record-keeping tool only**. It does **NOT** provide financial, tax, legal, or investment advice.

**✅ What This Tool Provides:**

- Portfolio tracking and transaction management
- Mathematical calculations for informational purposes only
- Data export functionality

**❌ What This Tool Does NOT Provide:**

- Tax advice or professional tax preparation services
- Legal guidance or regulatory interpretation
- Financial or investment advice
- Professional consultation services

**🏛️ Professional Consultation Required**: You are solely responsible for:

- Consulting qualified tax professionals (CPA, Enrolled Agent) for tax preparation
- Verifying all information with authoritative sources (IRS.gov)
- Making your own financial and tax decisions
- Ensuring compliance with applicable tax laws

**Legal Protection**: By using this application, you acknowledge these limitations and agree that you will not rely on this tool for professional advice. The developers assume no liability for tax calculation accuracy or financial decisions based on this tool.

## 🙏 Credits

- [CoinGecko API](https://coingecko.com) for real-time Bitcoin price data
- [Recharts](https://recharts.org) for beautiful, responsive chart components
- [Lucide](https://lucide.dev) for clean, consistent icons
