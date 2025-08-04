# Bitcoin DCA Tracker

A modern React + TypeScript web app to track your Bitcoin DCA (Dollar Cost Averaging) purchases across multiple exchanges.

## Features

- 📈 **Dashboard Overview**: See your total invested, total bitcoin, average cost basis, and unrealized P&L at a glance.
- 💸 **Live Bitcoin Price**: Real-time BTC/USD price updates (via CoinGecko).
- 📂 **Multi-Exchange CSV Import**: Upload transaction files from Strike, Coinbase, Kraken, or generic CSVs.
- 🧮 **Automatic Parsing**: Smart detection and parsing of supported exchange formats.
- 🗃️ **Transaction History**: View your latest 50 transactions in a sortable table.
- 🧹 **Clear Data**: Easily clear all imported transactions.
- 🧑‍💻 **TypeScript, Vite, ESLint, Prettier, and Vitest**: Modern tooling for fast development and code quality.

## Project Structure

- `src/components/` — Modular UI components (DashboardOverview, UploadTransactions, TransactionHistory)
- `src/types/` — TypeScript types for transactions and stats
- `src/utils/` — Utility functions (e.g., exchange parsers)
- `src/apis/` — API helpers (e.g., fetchBitcoinPrice)

## Scripts

- `pnpm dev` — Start development server
- `pnpm build` — Build for production
- `pnpm preview` — Preview production build
- `pnpm lint` — Run ESLint
- `pnpm format` — Run Prettier
- `pnpm test` — Run tests

## Usage

1. **Start the app:**
   ```sh
   pnpm install
   pnpm dev
   ```
2. **Upload your CSV files** from supported exchanges to see your DCA stats and history.
3. **Clear data** with the button if you want to reset your dashboard.

## Supported CSV Formats

- Strike
- Coinbase
- Kraken
- Generic CSVs (with columns for date, USD amount, BTC amount, etc.)

## Contributing

Pull requests and issues are welcome! Please lint and format your code before submitting.

---

MIT License
