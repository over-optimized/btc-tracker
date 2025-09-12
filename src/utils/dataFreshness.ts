import { Transaction } from '../types/Transaction';

export interface DataFreshnessInfo {
  lastTransactionDate: Date | null;
  daysSinceLastTransaction: number;
  isStale: boolean;
  staleness: 'fresh' | 'aging' | 'stale' | 'very_stale' | 'empty';
  message: string;
  recommendation?: string;
}

/**
 * Analyze transaction data freshness for Strike users who make daily purchases
 */
export function analyzeDataFreshness(transactions: Transaction[]): DataFreshnessInfo {
  // Defensive programming: ensure transactions is a valid array
  if (!Array.isArray(transactions)) {
    console.warn('⚠️ analyzeDataFreshness: transactions is not an array:', typeof transactions);
    return {
      lastTransactionDate: null,
      daysSinceLastTransaction: 0,
      isStale: false,
      staleness: 'empty',
      message: 'Loading transaction data...',
    };
  }

  if (transactions.length === 0) {
    return {
      lastTransactionDate: null,
      daysSinceLastTransaction: 0,
      isStale: false,
      staleness: 'empty',
      message: 'No transactions imported yet',
      recommendation: 'Import your first batch of Strike transactions to get started',
    };
  }

  // Find the most recent transaction
  const sortedTransactions = [...transactions].sort((a, b) => b.date.getTime() - a.date.getTime());
  const lastTransaction = sortedTransactions[0];
  const now = new Date();
  const daysSinceLastTransaction = Math.floor(
    (now.getTime() - lastTransaction.date.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Determine staleness level
  let staleness: DataFreshnessInfo['staleness'];
  let message: string;
  let recommendation: string | undefined;
  let isStale = false;

  if (daysSinceLastTransaction <= 2) {
    staleness = 'fresh';
    message = `Data is current (last transaction ${daysSinceLastTransaction === 0 ? 'today' : `${daysSinceLastTransaction} day${daysSinceLastTransaction === 1 ? '' : 's'} ago`})`;
  } else if (daysSinceLastTransaction <= 7) {
    staleness = 'aging';
    message = `Data is ${daysSinceLastTransaction} days old`;
    recommendation = 'Consider importing recent Strike transactions to keep data current';
    isStale = true;
  } else if (daysSinceLastTransaction <= 14) {
    staleness = 'stale';
    message = `Data is ${daysSinceLastTransaction} days old`;
    recommendation = 'Import recent Strike transactions to update your portfolio tracking';
    isStale = true;
  } else {
    staleness = 'very_stale';
    message = `Data is ${daysSinceLastTransaction} days old`;
    recommendation =
      'Your data is significantly outdated. Import recent Strike transactions for accurate tracking';
    isStale = true;
  }

  return {
    lastTransactionDate: lastTransaction.date,
    daysSinceLastTransaction,
    isStale,
    staleness,
    message,
    recommendation,
  };
}

/**
 * Detect gaps in transaction history that might indicate missing imports
 */
export function detectTransactionGaps(
  transactions: Transaction[],
  gapThresholdDays: number = 3,
): {
  gaps: Array<{
    startDate: Date;
    endDate: Date;
    daysMissing: number;
    message: string;
  }>;
  hasSignificantGaps: boolean;
} {
  // Defensive programming: ensure transactions is a valid array
  if (!Array.isArray(transactions) || transactions.length < 2) {
    return { gaps: [], hasSignificantGaps: false };
  }

  // Sort transactions by date
  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());
  const gaps = [];

  for (let i = 1; i < sorted.length; i++) {
    const prevDate = sorted[i - 1].date;
    const currentDate = sorted[i].date;
    const daysBetween = Math.floor(
      (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysBetween > gapThresholdDays) {
      gaps.push({
        startDate: prevDate,
        endDate: currentDate,
        daysMissing: daysBetween,
        message: `${daysBetween}-day gap between ${prevDate.toLocaleDateString()} and ${currentDate.toLocaleDateString()}`,
      });
    }
  }

  return {
    gaps,
    hasSignificantGaps: gaps.length > 0,
  };
}

/**
 * Get import reminder preferences from localStorage
 */
export function getImportReminderPreferences(): {
  enabled: boolean;
  reminderDays: number;
  lastReminderShown?: Date;
} {
  const stored = localStorage.getItem('btc-tracker:import-reminders');
  if (!stored) {
    return { enabled: true, reminderDays: 3 }; // Default: remind after 3 days
  }

  try {
    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      lastReminderShown: parsed.lastReminderShown ? new Date(parsed.lastReminderShown) : undefined,
    };
  } catch {
    return { enabled: true, reminderDays: 3 };
  }
}

/**
 * Update import reminder preferences
 */
export function setImportReminderPreferences(preferences: {
  enabled: boolean;
  reminderDays: number;
  lastReminderShown?: Date;
}): void {
  localStorage.setItem('btc-tracker:import-reminders', JSON.stringify(preferences));
}

/**
 * Check if we should show an import reminder
 */
export function shouldShowImportReminder(transactions: Transaction[]): boolean {
  // Defensive programming: don't show reminders for invalid data
  if (!Array.isArray(transactions)) return false;

  const preferences = getImportReminderPreferences();
  if (!preferences.enabled) return false;

  const freshness = analyzeDataFreshness(transactions);
  if (!freshness.isStale) return false;

  // Only show if we haven't shown a reminder recently
  if (preferences.lastReminderShown) {
    const daysSinceLastReminder = Math.floor(
      (Date.now() - preferences.lastReminderShown.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSinceLastReminder < 1) return false; // Don't spam daily
  }

  return freshness.daysSinceLastTransaction >= preferences.reminderDays;
}
