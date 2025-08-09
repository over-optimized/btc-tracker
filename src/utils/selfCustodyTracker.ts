import { Transaction } from '../types/Transaction';

export interface ExchangeBalance {
  exchange: string;
  btcAmount: number;
  usdValue: number;
  lastTransactionDate: Date;
  recommendSelfCustody: boolean;
  milestone: SelfCustodyMilestone | null;
}

export interface SelfCustodyMilestone {
  threshold: number; // BTC amount
  label: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  educationalContent: string;
}

export interface SelfCustodyRecommendation {
  exchange: string;
  currentAmount: number;
  milestone: SelfCustodyMilestone;
  daysAtMilestone: number;
  message: string;
  urgency: 'info' | 'warning' | 'urgent';
}

export interface SelfCustodyAnalysis {
  totalOnExchanges: number;
  totalInSelfCustody: number;
  exchangeBalances: ExchangeBalance[];
  recommendations: SelfCustodyRecommendation[];
  securityScore: number; // 0-100, lower is riskier
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
}

// Common self-custody milestones
export const SELF_CUSTODY_MILESTONES: SelfCustodyMilestone[] = [
  {
    threshold: 0.001,
    label: 'First Milestone',
    description: 'Getting familiar with self-custody',
    priority: 'low',
    educationalContent: 'Consider practicing with a small amount first. Learn about hardware wallets and backup procedures.',
  },
  {
    threshold: 0.01,
    label: 'Standard Threshold',
    description: 'The most common recommendation for moving to self-custody',
    priority: 'medium',
    educationalContent: '0.01 BTC is the widely accepted threshold. "Not your keys, not your Bitcoin." Time to take control.',
  },
  {
    threshold: 0.05,
    label: 'Significant Holdings',
    description: 'Substantial amount that should definitely be in self-custody',
    priority: 'high',
    educationalContent: 'With this amount, exchange risk becomes significant. Consider a hardware wallet like Coldcard or Ledger.',
  },
  {
    threshold: 0.1,
    label: 'Major Holdings',
    description: 'Large amount requiring immediate self-custody',
    priority: 'critical',
    educationalContent: 'This is a substantial holding. Keeping this on exchanges is high risk. Move to self-custody immediately.',
  },
  {
    threshold: 1.0,
    label: 'Whole Coiner',
    description: 'Congratulations! You own a full Bitcoin',
    priority: 'critical',
    educationalContent: 'As a whole coiner, security is paramount. Consider multi-sig or advanced cold storage solutions.',
  },
];

/**
 * Calculate current balances on each exchange (excluding self-custody withdrawals)
 */
export function calculateExchangeBalances(
  transactions: Transaction[],
  currentPrice?: number
): ExchangeBalance[] {
  const balanceMap = new Map<string, {
    btcAmount: number;
    lastTransactionDate: Date;
  }>();

  // Process all transactions
  transactions.forEach((tx) => {
    if (!balanceMap.has(tx.exchange)) {
      balanceMap.set(tx.exchange, {
        btcAmount: 0,
        lastTransactionDate: tx.date,
      });
    }

    const balance = balanceMap.get(tx.exchange)!;

    // Update last transaction date
    if (tx.date > balance.lastTransactionDate) {
      balance.lastTransactionDate = tx.date;
    }

    // Handle different transaction types
    if (tx.type === 'Withdrawal' || tx.type === 'Transfer' || tx.isSelfCustody) {
      // Withdrawals reduce exchange balance
      balance.btcAmount -= tx.btcAmount;
    } else if (tx.type === 'Sale' || tx.type === 'Sell') {
      // Sales reduce exchange balance
      balance.btcAmount -= tx.btcAmount;
    } else {
      // Purchases/buys/trades increase exchange balance
      balance.btcAmount += tx.btcAmount;
    }
  });

  // Convert to ExchangeBalance array
  return Array.from(balanceMap.entries())
    .filter(([_, balance]) => balance.btcAmount > 0.00001) // Filter out zero/dust balances
    .map(([exchange, balance]) => {
      const usdValue = currentPrice ? balance.btcAmount * currentPrice : 0;
      const milestone = findApplicableMilestone(balance.btcAmount);
      
      return {
        exchange,
        btcAmount: balance.btcAmount,
        usdValue,
        lastTransactionDate: balance.lastTransactionDate,
        recommendSelfCustody: milestone !== null,
        milestone,
      };
    })
    .sort((a, b) => b.btcAmount - a.btcAmount); // Sort by BTC amount descending
}

/**
 * Find the applicable milestone for a given BTC amount
 */
function findApplicableMilestone(btcAmount: number): SelfCustodyMilestone | null {
  // Find the highest milestone that applies
  const applicable = SELF_CUSTODY_MILESTONES
    .filter(m => btcAmount >= m.threshold)
    .sort((a, b) => b.threshold - a.threshold);
  
  return applicable[0] || null;
}

/**
 * Calculate total Bitcoin in self-custody
 */
export function calculateSelfCustodyTotal(transactions: Transaction[]): number {
  return transactions
    .filter(tx => tx.isSelfCustody && (tx.type === 'Withdrawal' || tx.type === 'Transfer'))
    .reduce((total, tx) => total + tx.btcAmount, 0);
}

/**
 * Generate self-custody recommendations based on current balances
 */
export function generateSelfCustodyRecommendations(
  exchangeBalances: ExchangeBalance[]
): SelfCustodyRecommendation[] {
  const recommendations: SelfCustodyRecommendation[] = [];
  const now = new Date();

  exchangeBalances.forEach((balance) => {
    if (!balance.milestone) return;

    const daysAtMilestone = Math.floor(
      (now.getTime() - balance.lastTransactionDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    let urgency: 'info' | 'warning' | 'urgent';
    let message: string;

    switch (balance.milestone.priority) {
      case 'low':
        urgency = 'info';
        message = `You have ${balance.btcAmount.toFixed(6)} BTC on ${balance.exchange}. Consider practicing self-custody.`;
        break;
      case 'medium':
        urgency = daysAtMilestone > 7 ? 'warning' : 'info';
        message = `You have ${balance.btcAmount.toFixed(6)} BTC on ${balance.exchange}. Time to move to self-custody!`;
        break;
      case 'high':
        urgency = daysAtMilestone > 3 ? 'urgent' : 'warning';
        message = `You have ${balance.btcAmount.toFixed(6)} BTC on ${balance.exchange}. This should be in self-custody.`;
        break;
      case 'critical':
        urgency = 'urgent';
        message = `You have ${balance.btcAmount.toFixed(6)} BTC on ${balance.exchange}. Move to self-custody immediately!`;
        break;
    }

    recommendations.push({
      exchange: balance.exchange,
      currentAmount: balance.btcAmount,
      milestone: balance.milestone,
      daysAtMilestone,
      message,
      urgency,
    });
  });

  return recommendations.sort((a, b) => {
    // Sort by priority, then by amount
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.milestone.priority];
    const bPriority = priorityOrder[b.milestone.priority];
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    return b.currentAmount - a.currentAmount;
  });
}

/**
 * Calculate a security score based on exchange exposure
 */
function calculateSecurityScore(
  totalOnExchanges: number,
  totalInSelfCustody: number,
  exchangeBalances: ExchangeBalance[]
): number {
  if (totalOnExchanges === 0 && totalInSelfCustody === 0) return 100; // No Bitcoin = no risk
  if (totalOnExchanges === 0) return 100; // All in self-custody = perfect

  const totalBitcoin = totalOnExchanges + totalInSelfCustody;
  const exchangeRatio = totalOnExchanges / totalBitcoin;

  // Base score starts at 100 and decreases based on exchange exposure
  let score = 100 - (exchangeRatio * 80); // Max 80 point penalty for all on exchanges

  // Additional penalties for large single-exchange concentrations
  exchangeBalances.forEach((balance) => {
    const exchangeRatio = balance.btcAmount / totalBitcoin;
    if (exchangeRatio > 0.5) score -= 10; // Penalty for >50% on single exchange
    if (exchangeRatio > 0.8) score -= 10; // Additional penalty for >80%
  });

  // Additional penalties based on milestone violations
  exchangeBalances.forEach((balance) => {
    if (balance.milestone?.priority === 'critical') score -= 15;
    else if (balance.milestone?.priority === 'high') score -= 10;
    else if (balance.milestone?.priority === 'medium') score -= 5;
  });

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Perform comprehensive self-custody analysis
 */
export function analyzeSelfCustody(
  transactions: Transaction[],
  currentPrice?: number
): SelfCustodyAnalysis {
  const exchangeBalances = calculateExchangeBalances(transactions, currentPrice);
  const totalInSelfCustody = calculateSelfCustodyTotal(transactions);
  const totalOnExchanges = exchangeBalances.reduce((sum, b) => sum + b.btcAmount, 0);
  
  const recommendations = generateSelfCustodyRecommendations(exchangeBalances);
  const securityScore = calculateSecurityScore(totalOnExchanges, totalInSelfCustody, exchangeBalances);

  let overallRisk: 'low' | 'medium' | 'high' | 'critical';
  if (securityScore >= 80) overallRisk = 'low';
  else if (securityScore >= 60) overallRisk = 'medium';
  else if (securityScore >= 40) overallRisk = 'high';
  else overallRisk = 'critical';

  return {
    totalOnExchanges,
    totalInSelfCustody,
    exchangeBalances,
    recommendations,
    securityScore,
    overallRisk,
  };
}