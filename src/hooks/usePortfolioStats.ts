import { useMemo } from 'react';
import { Stats } from '../types/Stats';
import { Transaction } from '../types/Transaction';

export const usePortfolioStats = (
  transactions: Transaction[],
  currentPrice: number | null,
): Stats => {
  return useMemo(() => {
    // Ensure transactions is always an array to prevent runtime errors
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const totalInvested = safeTransactions.reduce((sum, tx) => sum + tx.usdAmount, 0);
    const totalBitcoin = safeTransactions.reduce((sum, tx) => sum + tx.btcAmount, 0);
    const avgCostBasis = totalBitcoin > 0 ? totalInvested / totalBitcoin : 0;
    const currentValue = currentPrice ? totalBitcoin * currentPrice : 0;
    const unrealizedPnL = currentValue - totalInvested;

    return {
      totalInvested,
      totalBitcoin,
      avgCostBasis,
      currentValue,
      unrealizedPnL,
    };
  }, [transactions, currentPrice]);
};
