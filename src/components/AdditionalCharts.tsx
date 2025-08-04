import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Transaction } from '../types/Transaction';

interface AdditionalChartsProps {
  transactions: Transaction[];
  currentPrice: number | null;
}

function buildChartData(transactions: Transaction[], currentPrice: number | null) {
  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());
  let cumulativeBTC = 0;
  let cumulativeUSD = 0;
  const data = sorted.map((tx) => {
    cumulativeBTC += tx.btcAmount;
    cumulativeUSD += tx.usdAmount;
    return {
      date: tx.date.toLocaleDateString(),
      btc: cumulativeBTC,
      invested: cumulativeUSD,
      costBasis: cumulativeBTC > 0 ? cumulativeUSD / cumulativeBTC : 0,
      price: currentPrice ?? tx.price,
      pnl: (currentPrice ?? tx.price) * cumulativeBTC - cumulativeUSD,
    };
  });
  return data;
}

const AdditionalCharts: React.FC<AdditionalChartsProps> = ({ transactions, currentPrice }) => {
  const data = buildChartData(transactions, currentPrice);
  if (data.length === 0)
    return (
      <div className="h-72 flex items-center justify-center text-gray-400">No data to chart</div>
    );
  return (
    <div className="space-y-12">
      {/* Cumulative Bitcoin Acquired */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Cumulative Bitcoin Acquired</h2>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" minTickGap={24} />
            <YAxis dataKey="btc" tickFormatter={(v) => v.toFixed(4)} />
            <Tooltip formatter={(v: number) => v.toFixed(8)} />
            <Area type="monotone" dataKey="btc" stroke="#f59e42" fill="#fbbf24" name="BTC" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {/* Cost Basis vs. Current Price */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Cost Basis vs. Current Price</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" minTickGap={24} />
            <YAxis
              tickFormatter={(v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            />
            <Tooltip
              formatter={(v: number) =>
                `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
              }
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="costBasis"
              stroke="#a855f7"
              strokeWidth={2}
              dot={false}
              name="Cost Basis"
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              name="BTC Price"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Unrealized P&L Over Time */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Unrealized P&L Over Time</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" minTickGap={24} />
            <YAxis
              tickFormatter={(v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            />
            <Tooltip
              formatter={(v: number) =>
                `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
              }
            />
            <Line
              type="monotone"
              dataKey="pnl"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="Unrealized P&L"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdditionalCharts;
