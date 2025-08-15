import { describe, it, expect } from 'vitest';
import {
  safeDateConversion,
  hydrateCacheEntry,
  deepHydrateDates,
  isValidDate,
  getStorageTimestamp,
} from '../dateHydration';

describe('dateHydration', () => {
  describe('safeDateConversion', () => {
    it('should handle null and undefined', () => {
      expect(safeDateConversion(null)).toBe(null);
      expect(safeDateConversion(undefined)).toBe(null);
    });

    it('should pass through valid Date objects', () => {
      const date = new Date('2025-01-01');
      expect(safeDateConversion(date)).toBe(date);
    });

    it('should return null for invalid Date objects', () => {
      const invalidDate = new Date('invalid');
      expect(safeDateConversion(invalidDate)).toBe(null);
    });

    it('should convert numeric timestamps', () => {
      const timestamp = Date.now();
      const result = safeDateConversion(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(timestamp);
    });

    it('should convert ISO string dates', () => {
      const isoString = '2025-01-01T00:00:00.000Z';
      const result = safeDateConversion(isoString);
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe(isoString);
    });

    it('should handle empty strings', () => {
      expect(safeDateConversion('')).toBe(null);
      expect(safeDateConversion('   ')).toBe(null);
    });

    it('should handle invalid string dates', () => {
      expect(safeDateConversion('not a date')).toBe(null);
      expect(safeDateConversion('2025-13-45')).toBe(null);
    });
  });

  describe('hydrateCacheEntry', () => {
    it('should hydrate timestamp fields', () => {
      const entry = {
        timestamp: '2025-01-01T00:00:00.000Z',
        lastUpdated: Date.now(),
        data: { value: 123 },
      };

      const hydrated = hydrateCacheEntry(entry);

      expect(hydrated.timestamp).toBeInstanceOf(Date);
      expect(hydrated.lastUpdated).toBeInstanceOf(Date);
      expect(hydrated.data).toEqual({ value: 123 });
    });

    it('should handle missing date fields gracefully', () => {
      const entry = {
        data: { value: 123 },
        someOtherField: 'test',
      };

      const hydrated = hydrateCacheEntry(entry);
      expect(hydrated).toEqual(entry);
    });

    it('should preserve original object structure', () => {
      const entry = {
        timestamp: Date.now(),
        data: { nested: { value: 123 } },
        metadata: { version: 1 },
      };

      const hydrated = hydrateCacheEntry(entry);
      expect(hydrated.data).toEqual(entry.data);
      expect(hydrated.metadata).toEqual(entry.metadata);
    });
  });

  describe('deepHydrateDates', () => {
    it('should hydrate nested date fields', () => {
      const obj = {
        timestamp: '2025-01-01T00:00:00.000Z',
        nested: {
          lastUpdated: Date.now(),
          createdAt: '2025-01-01T12:00:00.000Z',
        },
        array: [1, 2, 3],
      };

      const hydrated = deepHydrateDates(obj);

      expect(hydrated.timestamp).toBeInstanceOf(Date);
      expect(hydrated.nested.lastUpdated).toBeInstanceOf(Date);
      expect(hydrated.nested.createdAt).toBeInstanceOf(Date);
      expect(hydrated.array).toEqual([1, 2, 3]);
    });

    it('should handle non-objects gracefully', () => {
      expect(deepHydrateDates(null as any)).toBe(null);
      expect(deepHydrateDates('string' as any)).toBe('string');
      expect(deepHydrateDates(123 as any)).toBe(123);
    });
  });

  describe('isValidDate', () => {
    it('should validate proper Date objects', () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate(new Date('2025-01-01'))).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
      expect(isValidDate(new Date('invalid'))).toBe(false);
      expect(isValidDate('2025-01-01' as any)).toBe(false);
    });

    it('should reject dates outside reasonable bounds', () => {
      const veryOld = new Date('1900-01-01');
      const veryFuture = new Date('2030-01-01');

      expect(isValidDate(veryOld)).toBe(false);
      expect(isValidDate(veryFuture)).toBe(false);
    });

    it('should accept recent dates', () => {
      const recentPast = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const nearFuture = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      expect(isValidDate(recentPast)).toBe(true);
      expect(isValidDate(nearFuture)).toBe(true);
    });
  });

  describe('getStorageTimestamp', () => {
    it('should return a numeric timestamp', () => {
      const timestamp = getStorageTimestamp();
      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBeGreaterThan(0);
    });

    it('should return current time approximately', () => {
      const before = Date.now();
      const timestamp = getStorageTimestamp();
      const after = Date.now();

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('localStorage simulation', () => {
    it('should handle the full localStorage round trip', () => {
      // Simulate what happens with localStorage
      const originalEntry = {
        timestamp: new Date(),
        lastUpdated: new Date('2025-01-01'),
        data: { price: 50000 },
      };

      // Simulate JSON.stringify (what localStorage does)
      const serialized = JSON.stringify(originalEntry);

      // Simulate JSON.parse (what we get back from localStorage)
      const parsed = JSON.parse(serialized);

      // Verify dates became strings
      expect(typeof parsed.timestamp).toBe('string');
      expect(typeof parsed.lastUpdated).toBe('string');

      // Apply our hydration
      const hydrated = hydrateCacheEntry(parsed);

      // Verify dates are restored
      expect(hydrated.timestamp).toBeInstanceOf(Date);
      expect(hydrated.lastUpdated).toBeInstanceOf(Date);
      expect(hydrated.timestamp.getTime()).toBe(originalEntry.timestamp.getTime());
      expect(hydrated.lastUpdated.getTime()).toBe(originalEntry.lastUpdated.getTime());
    });
  });
});
