import React from 'react';
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Transaction } from '../types/Transaction';

interface Props {
  transactions: Transaction[];
  currentPrice: number | null;
}

interface MonthData {
  month: string;
  invested: number;
  pnl: number;
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-');
  return `${year}-${month}`;
}

const InvestedVsPnLChart: React.FC<Props> = ({ transactions, currentPrice }) => {
  // Group transactions by month
  const monthMap = new Map<string, { invested: number; btc: number }>();
  transactions.forEach((tx) => {
    const date = new Date(tx.date);
    const key = getMonthKey(date);
    if (!monthMap.has(key)) {
      monthMap.set(key, { invested: 0, btc: 0 });
    }
    const entry = monthMap.get(key)!;
    entry.invested += tx.usdAmount;
    entry.btc += tx.btcAmount;
  });

  // Prepare chart data with running totals
  let cumulativeInvested = 0;
  let cumulativeBtc = 0;
  
  const data: MonthData[] = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { invested, btc }]) => {
      cumulativeInvested += invested;
      cumulativeBtc += btc;
      
      return {
        month: formatMonthLabel(month),
        invested: cumulativeInvested,
        pnl: currentPrice ? cumulativeBtc * currentPrice - cumulativeInvested : 0,
      };
    });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip
          formatter={(value: number) =>
            value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
          }
        />
        <Legend />
        <Bar dataKey="invested" name="Invested" fill="#60a5fa" stackId="a" />
        <Bar dataKey="pnl" name="Unrealized P&L" fill="#34d399" stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default InvestedVsPnLChart;
