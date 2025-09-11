import { describe, it, expect } from 'vitest';
import {
  getDateRange,
  isDateInRange,
  getAvailableYearOptions,
  getDefaultTimeRange,
} from '../dateFilters';

describe('dateFilters', () => {
  const testDate = new Date('2025-04-15T12:00:00Z');

  describe('getDateRange', () => {
    it('should return correct range for last6months', () => {
      const range = getDateRange('last6months', testDate);
      expect(range.label).toBe('Last 6 Months');
      expect(range.start.getMonth()).toBe(9); // October (6 months before April)
      expect(range.start.getFullYear()).toBe(2024);
      expect(range.end).toBe(testDate);
    });

    it('should return correct range for last12months', () => {
      const range = getDateRange('last12months', testDate);
      expect(range.label).toBe('Last 12 Months');
      expect(range.start.getMonth()).toBe(3); // April (12 months before)
      expect(range.start.getFullYear()).toBe(2024);
      expect(range.end).toBe(testDate);
    });

    it('should return correct range for ytd', () => {
      const range = getDateRange('ytd', testDate);
      expect(range.label).toBe('Year to Date');
      expect(range.start).toEqual(new Date(2025, 0, 1));
      expect(range.end).toBe(testDate);
    });

    it('should return correct range for year2025', () => {
      const range = getDateRange('year2025', testDate);
      expect(range.label).toBe('2025');
      expect(range.start).toEqual(new Date(2025, 0, 1));
      expect(range.end).toEqual(new Date(2025, 11, 31, 23, 59, 59, 999));
    });

    it('should return correct range for alltime', () => {
      const range = getDateRange('alltime', testDate);
      expect(range.label).toBe('All Time');
      expect(range.start).toEqual(new Date(2020, 0, 1));
      expect(range.end).toBe(testDate);
    });
  });

  describe('isDateInRange', () => {
    it('should correctly identify dates within range', () => {
      const range = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31'),
        label: 'Test Range',
      };

      expect(isDateInRange(new Date('2024-06-15'), range)).toBe(true);
      expect(isDateInRange(new Date('2024-01-01'), range)).toBe(true);
      expect(isDateInRange(new Date('2024-12-31'), range)).toBe(true);
    });

    it('should correctly identify dates outside range', () => {
      const range = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31'),
        label: 'Test Range',
      };

      expect(isDateInRange(new Date('2023-12-31'), range)).toBe(false);
      expect(isDateInRange(new Date('2025-01-01'), range)).toBe(false);
    });
  });

  describe('getAvailableYearOptions', () => {
    it('should return only basic options when no transactions', () => {
      const options = getAvailableYearOptions([]);
      expect(options).toEqual(['last6months', 'last12months', 'ytd', 'alltime']);
    });

    it('should include year options for years with data', () => {
      const transactions = [
        { date: new Date('2024-03-15') },
        { date: new Date('2025-01-10') },
        { date: new Date('2023-11-20') },
      ];

      const options = getAvailableYearOptions(transactions);
      expect(options).toContain('year2025');
      expect(options).toContain('year2024');
      expect(options).toContain('year2023');
      expect(options).toContain('last6months');
      expect(options).toContain('alltime');
    });

    it('should sort years newest first', () => {
      const transactions = [
        { date: new Date(2023, 0, 1) }, // January 1, 2023
        { date: new Date(2025, 0, 1) }, // January 1, 2025
        { date: new Date(2024, 0, 1) }, // January 1, 2024
      ];

      const options = getAvailableYearOptions(transactions);
      const yearOptions = options.filter((opt) => opt.startsWith('year'));

      expect(yearOptions).toEqual(['year2025', 'year2024', 'year2023']);
    });
  });

  describe('getDefaultTimeRange', () => {
    it('should return alltime for empty transactions', () => {
      const defaultRange = getDefaultTimeRange([]);
      expect(defaultRange).toBe('alltime');
    });

    it('should return alltime for recent data only', () => {
      const transactions = [{ date: new Date('2025-01-15') }, { date: new Date('2025-02-10') }];

      const defaultRange = getDefaultTimeRange(transactions);
      expect(defaultRange).toBe('alltime');
    });

    it('should return last12months for data spanning more than a year', () => {
      const transactions = [{ date: new Date('2023-01-15') }, { date: new Date('2025-02-10') }];

      const defaultRange = getDefaultTimeRange(transactions);
      expect(defaultRange).toBe('last12months');
    });
  });
});
