import { Bitcoin, Calculator, DollarSign, TrendingUp } from 'lucide-react';
import { Stats } from '../types/Stats';
import { formatBTC } from '../utils/formatBTC';
import { formatCurrency } from '../utils/formatCurrency';

interface DashboardOverviewProps {
  stats: Stats;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ stats }) => {

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <div 
        className="card-base p-4 sm:p-6"
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <DollarSign className="text-blue-500 dark:text-blue-400 flex-shrink-0" size={18} />
          <span className="card-label text-xs sm:text-sm">Total Invested</span>
        </div>
        <span className="card-value-small break-words">
          {formatCurrency(stats.totalInvested)}
        </span>
      </div>
      <div 
        className="card-base p-4 sm:p-6"
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <Bitcoin className="text-orange-500 dark:text-orange-400 flex-shrink-0" size={18} />
          <span className="card-label text-xs sm:text-sm">Total Bitcoin</span>
        </div>
        <span className="card-value-small break-words">
          {formatBTC(stats.totalBitcoin)}
        </span>
      </div>
      <div 
        className="card-base p-4 sm:p-6"
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <Calculator className="text-purple-500 dark:text-purple-400 flex-shrink-0" size={18} />
          <span className="card-label text-xs sm:text-sm">Avg Cost Basis</span>
        </div>
        <span className="card-value-small break-words">
          {formatCurrency(stats.avgCostBasis)}
        </span>
      </div>
      <div 
        className="card-base p-4 sm:p-6"
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <TrendingUp
            className={`${stats.unrealizedPnL >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'} flex-shrink-0`}
            size={18}
          />
          <span className="card-label text-xs sm:text-sm">Unrealized P&L</span>
        </div>
        <span
          className={`text-xl sm:text-2xl font-bold break-words ${stats.unrealizedPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
        >
          {formatCurrency(stats.unrealizedPnL)}
        </span>
      </div>
    </div>
  );
};

export default DashboardOverview;