import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Transaction } from '../types/Transaction';
import React from 'react';

interface PortfolioValueChartProps {
  transactions: Transaction[];
  currentPrice: number | null;
}

// Helper to build chart data: [{ date, value }]
function buildPortfolioValueData(transactions: Transaction[], currentPrice: number | null) {
  // Sort by date ascending
  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());
  let cumulativeBTC = 0;
  let cumulativeUSD = 0;
  const data = sorted.map((tx) => {
    cumulativeBTC += tx.btcAmount;
    cumulativeUSD += tx.usdAmount;
    return {
      date: tx.date.toLocaleDateString(),
      value: cumulativeBTC * (currentPrice ?? tx.price),
      btc: cumulativeBTC,
      invested: cumulativeUSD,
    };
  });
  return data;
}

const PortfolioValueChart: React.FC<PortfolioValueChartProps> = ({ transactions, currentPrice }) => {
  const data = buildPortfolioValueData(transactions, currentPrice);
  if (data.length === 0) return <div className="h-72 flex items-center justify-center text-gray-400">No data to chart</div>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" minTickGap={24} />
        <YAxis dataKey="value" tickFormatter={(v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        <Tooltip formatter={(v: number) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
        <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} name="Portfolio Value (USD)" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PortfolioValueChart;
