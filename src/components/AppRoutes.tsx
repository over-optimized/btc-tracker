import React, { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import Dashboard from './Dashboard';
import SuspenseWrapper from './SuspenseWrapper';
import TransactionHistory from './TransactionHistory';
import UploadTransactions from './UploadTransactions';
import { Stats } from '../types/Stats';
import { Transaction } from '../types/Transaction';

// Lazy load chart components
const AdditionalCharts = lazy(() => import('./AdditionalCharts'));
const TaxDashboard = lazy(() => import('./TaxDashboard'));

interface AppRoutesProps {
  // Data
  transactions: Transaction[];
  transactionCount: number; // Optimized count for components that only need length
  currentPrice: number | null;
  stats: Stats;

  // Bitcoin price metadata
  lastUpdated?: Date | null;
  cached?: boolean;
  source?: 'cache' | 'api' | 'sharedWorker' | null;
  priceLoading?: boolean;
  priceError?: string | null;

  // Upload handlers
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  loading: boolean;
  clearData: () => void;

  // Modal handlers
  onAddWithdrawal: () => void;
}

const AppRoutes: React.FC<AppRoutesProps> = ({
  transactions,
  transactionCount,
  currentPrice,
  stats,
  lastUpdated,
  cached,
  source,
  priceLoading,
  priceError,
  onFileUpload,
  loading,
  clearData,
  onAddWithdrawal,
}) => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Dashboard
            transactions={transactions}
            currentPrice={currentPrice}
            stats={stats}
            lastUpdated={lastUpdated}
            cached={cached}
            source={source}
            priceLoading={priceLoading}
            priceError={priceError}
            onAddWithdrawal={onAddWithdrawal}
          />
        }
      />

      <Route
        path="/transactions"
        element={
          <div className="page-container">
            <div className="max-w-6xl mx-auto">
              <TransactionHistory transactions={transactions} />
            </div>
          </div>
        }
      />

      <Route
        path="/upload"
        element={
          <div className="page-container">
            <div className="max-w-6xl mx-auto">
              <UploadTransactions
                onUpload={onFileUpload}
                loading={loading}
                transactionsCount={transactionCount}
                clearData={clearData}
              />
            </div>
          </div>
        }
      />

      <Route
        path="/charts"
        element={
          <div className="page-container">
            <div className="max-w-6xl mx-auto">
              <SuspenseWrapper
                fallback={
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading charts...</p>
                    </div>
                  </div>
                }
              >
                <AdditionalCharts transactions={transactions} currentPrice={currentPrice} />
              </SuspenseWrapper>
            </div>
          </div>
        }
      />

      <Route
        path="/tax"
        element={
          <SuspenseWrapper
            fullScreen={true}
            fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading tax dashboard...</p>
                </div>
              </div>
            }
          >
            <TaxDashboard transactions={transactions} currentPrice={currentPrice || undefined} />
          </SuspenseWrapper>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
