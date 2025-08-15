export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

export type TimeRangeOption =
  | 'last6months'
  | 'last12months'
  | 'ytd'
  | 'year2025'
  | 'year2024'
  | 'year2023'
  | 'alltime';

export function getDateRange(option: TimeRangeOption, referenceDate: Date = new Date()): DateRange {
  const now = referenceDate;

  switch (option) {
    case 'last6months': {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 6);
      start.setDate(1); // Start of month
      start.setHours(0, 0, 0, 0);

      return {
        start,
        end: now,
        label: 'Last 6 Months',
      };
    }

    case 'last12months': {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 12);
      start.setDate(1); // Start of month
      start.setHours(0, 0, 0, 0);

      return {
        start,
        end: now,
        label: 'Last 12 Months',
      };
    }

    case 'ytd': {
      const start = new Date(now.getFullYear(), 0, 1); // January 1st of current year
      start.setHours(0, 0, 0, 0);

      return {
        start,
        end: now,
        label: 'Year to Date',
      };
    }

    case 'year2025': {
      const start = new Date(2025, 0, 1); // January 1, 2025
      const end = new Date(2025, 11, 31, 23, 59, 59, 999); // December 31, 2025

      return {
        start,
        end,
        label: '2025',
      };
    }

    case 'year2024': {
      const start = new Date(2024, 0, 1); // January 1, 2024
      const end = new Date(2024, 11, 31, 23, 59, 59, 999); // December 31, 2024

      return {
        start,
        end,
        label: '2024',
      };
    }

    case 'year2023': {
      const start = new Date(2023, 0, 1); // January 1, 2023
      const end = new Date(2023, 11, 31, 23, 59, 59, 999); // December 31, 2023

      return {
        start,
        end,
        label: '2023',
      };
    }

    case 'alltime': {
      // Use a very early date and current date to capture all transactions
      const start = new Date(2020, 0, 1); // January 1, 2020 (before Bitcoin's major adoption)

      return {
        start,
        end: now,
        label: 'All Time',
      };
    }

    default:
      throw new Error(`Unknown time range option: ${option}`);
  }
}

export function isDateInRange(date: Date, range: DateRange): boolean {
  const dateTime = date.getTime();
  return dateTime >= range.start.getTime() && dateTime <= range.end.getTime();
}

export function getAvailableYearOptions(transactions: { date: Date }[]): TimeRangeOption[] {
  if (transactions.length === 0) {
    return ['last6months', 'last12months', 'ytd', 'alltime'];
  }

  // Get unique years from transactions
  const years = new Set<number>();
  transactions.forEach((tx) => {
    years.add(tx.date.getFullYear());
  });

  const sortedYears = Array.from(years).sort((a, b) => b - a); // Newest first
  const yearOptions: TimeRangeOption[] = [];

  // Add year options for years that have data
  sortedYears.forEach((year) => {
    if (year === 2025) yearOptions.push('year2025');
    if (year === 2024) yearOptions.push('year2024');
    if (year === 2023) yearOptions.push('year2023');
  });

  return ['last6months', 'last12months', 'ytd', ...yearOptions, 'alltime'];
}

export function getDefaultTimeRange(transactions: { date: Date }[]): TimeRangeOption {
  if (transactions.length === 0) {
    return 'alltime';
  }

  // If user has more than 12 months of data, default to last 12 months
  // Otherwise, show all time to avoid empty charts
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const hasDataPastYear = transactions.some((tx) => tx.date < oneYearAgo);

  return hasDataPastYear ? 'last12months' : 'alltime';
}
