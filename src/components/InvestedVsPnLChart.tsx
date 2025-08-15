import React, { useState, useMemo } from 'react';
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Transaction } from '../types/Transaction';
import TimeRangeSelector from './TimeRangeSelector';
import {
  TimeRangeOption,
  getDateRange,
  getDefaultTimeRange,
  isDateInRange,
} from '../utils/dateFilters';

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
  // Initialize with smart default based on data range
  const [selectedRange, setSelectedRange] = useState<TimeRangeOption>(() =>
    getDefaultTimeRange(transactions),
  );

  // Filter transactions based on selected time range
  const filteredTransactions = useMemo(() => {
    const range = getDateRange(selectedRange);
    return transactions.filter((tx) => isDateInRange(tx.date, range));
  }, [transactions, selectedRange]);

  // Group filtered transactions by month
  const monthMap = new Map<string, { invested: number; btc: number }>();
  filteredTransactions.forEach((tx) => {
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
    <div className="space-y-4">
      {/* Time Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Invested vs. Unrealized P&L (Monthly)
        </h3>
        <TimeRangeSelector
          selectedRange={selectedRange}
          onRangeChange={setSelectedRange}
          transactions={transactions}
          className="justify-start sm:justify-end"
        />
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={20}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            width={60}
            tickFormatter={(v) => {
              if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
              if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
              return `$${v.toFixed(0)}`;
            }}
          />
          <Tooltip
            formatter={(value: number) =>
              value.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
              })
            }
            labelStyle={{ fontSize: 12 }}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="invested" name="Invested" fill="#60a5fa" stackId="a" />
          <Bar dataKey="pnl" name="Unrealized P&L" fill="#34d399" stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default InvestedVsPnLChart;
