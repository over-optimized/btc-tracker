import { useMemo } from 'react';
import { Stats } from '../types/Stats';
import { Transaction } from '../types/Transaction';

export const usePortfolioStats = (
  transactions: Transaction[],
  currentPrice: number | null
): Stats => {
  return useMemo(() => {
    const totalInvested = transactions.reduce((sum, tx) => sum + tx.usdAmount, 0);
    const totalBitcoin = transactions.reduce((sum, tx) => sum + tx.btcAmount, 0);
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