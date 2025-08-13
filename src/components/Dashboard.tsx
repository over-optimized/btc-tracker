import React, { Suspense } from 'react';
import { TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardOverview from './DashboardOverview';
import DataFreshnessCard from './DataFreshnessCard';
import SelfCustodyCard from './SelfCustodyCard';
import TaxSummaryCard from './TaxSummaryCard';
import ChartSkeleton from './ChartSkeleton';
import { formatCurrency } from '../utils/formatCurrency';
import { Stats } from '../types/Stats';
import { Transaction } from '../types/Transaction';

// Lazy load charts
const PortfolioValueChart = React.lazy(() => import('./PortfolioValueChart'));
const InvestedVsPnLChart = React.lazy(() => import('./InvestedVsPnLChart'));

interface DashboardProps {
  transactions: Transaction[];
  currentPrice: number | null;
  stats: Stats;
  onAddWithdrawal: () => void;

  // Bitcoin price metadata
  lastUpdated?: Date | null;
  cached?: boolean;
  source?: 'cache' | 'api' | 'sharedWorker' | null;
  priceLoading?: boolean;
  priceError?: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  currentPrice,
  stats,
  onAddWithdrawal,
  lastUpdated,
  cached,
  source,
  priceLoading,
  priceError,
}) => {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="max-w-6xl mx-auto">
        {/* Current Price Display */}
        {(currentPrice || priceLoading || priceError) && (
          <div className="card-base p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center gap-2 sm:gap-4">
                <TrendingUp
                  className="text-green-500 dark:text-green-400 flex-shrink-0"
                  size={20}
                />
                <span className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-gray-100 text-center">
                  {priceLoading
                    ? 'Loading...'
                    : priceError
                      ? 'Price unavailable'
                      : `Bitcoin: ${formatCurrency(currentPrice!)}`}
                </span>
              </div>

              {/* Last Updated Info */}
              {!priceLoading && !priceError && lastUpdated && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    Updated{' '}
                    {new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
                      Math.round((lastUpdated.getTime() - Date.now()) / (1000 * 60)),
                      'minute',
                    )}
                  </span>
                  {cached && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {source === 'cache' && '📦 Cached'}
                        {source === 'api' && '🌐 Live'}
                        {source === 'sharedWorker' && '🔄 Synced'}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Error Display */}
              {priceError && (
                <div className="text-xs text-orange-600 dark:text-orange-400 text-center">
                  {priceError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dashboard Overview */}
        {transactions.length > 0 && <DashboardOverview stats={stats} />}

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <TaxSummaryCard transactions={transactions} />
          <DataFreshnessCard
            transactions={transactions}
            onImportClick={() => navigate('/upload')}
          />
          <SelfCustodyCard
            transactions={transactions}
            currentPrice={currentPrice || undefined}
            onAddWithdrawal={onAddWithdrawal}
          />
        </div>

        {/* Charts */}
        <div className="card-base p-3 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4">
            Portfolio Value Over Time
          </h2>
          <Suspense fallback={<ChartSkeleton />}>
            <PortfolioValueChart transactions={transactions} currentPrice={currentPrice} />
          </Suspense>
        </div>

        <div className="card-base p-3 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4">
            Invested vs. Unrealized P&L (Monthly)
          </h2>
          <Suspense fallback={<ChartSkeleton />}>
            <InvestedVsPnLChart transactions={transactions} currentPrice={currentPrice} />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
