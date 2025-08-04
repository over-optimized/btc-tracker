import { Bitcoin, Calculator, DollarSign, TrendingUp } from 'lucide-react';
import { Stats } from '../types/Stats';
import { formatBTC } from '../utils/formatBTC';
import { formatCurrency } from '../utils/formatCurrency';

interface DashboardOverviewProps {
  stats: Stats;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-2">
        <DollarSign className="text-blue-500" size={20} />
        <span className="text-sm font-medium text-gray-600">Total Invested</span>
      </div>
      <span className="text-2xl font-bold text-gray-800">
        {formatCurrency(stats.totalInvested)}
      </span>
    </div>
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-2">
        <Bitcoin className="text-orange-500" size={20} />
        <span className="text-sm font-medium text-gray-600">Total Bitcoin</span>
      </div>
      <span className="text-2xl font-bold text-gray-800">{formatBTC(stats.totalBitcoin)}</span>
    </div>
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-2">
        <Calculator className="text-purple-500" size={20} />
        <span className="text-sm font-medium text-gray-600">Avg Cost Basis</span>
      </div>
      <span className="text-2xl font-bold text-gray-800">{formatCurrency(stats.avgCostBasis)}</span>
    </div>
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-2">
        <TrendingUp
          className={stats.unrealizedPnL >= 0 ? 'text-green-500' : 'text-red-500'}
          size={20}
        />
        <span className="text-sm font-medium text-gray-600">Unrealized P&L</span>
      </div>
      <span
        className={`text-2xl font-bold ${stats.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}
      >
        {formatCurrency(stats.unrealizedPnL)}
      </span>
    </div>
  </div>
);

export default DashboardOverview;
