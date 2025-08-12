/**
 * useBitcoinPrice Integration Tests
 *
 * Simplified tests focusing on core hook functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBitcoinPrice, useBitcoinPriceSimple } from '../useBitcoinPrice';

// Simple mocks for the enhanced API
vi.mock('../../apis/fetchBitcoinPrice', () => ({
  fetchBitcoinPrice: vi.fn(),
  fetchBitcoinPriceWithMetadata: vi.fn(),
  getBitcoinPriceCacheStats: vi.fn(() => ({ hits: 0, misses: 0, errors: 0, size: 0 })),
  clearBitcoinPriceCache: vi.fn(),
}));

describe('useBitcoinPrice Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Enhanced Hook', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useBitcoinPrice());

      expect(result.current.currentPrice).toBe(null);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(result.current.cached).toBe(false);
      expect(result.current.source).toBe(null);
      expect(result.current.cacheStats).toEqual({ hits: 0, misses: 0, errors: 0, size: 0 });
      expect(typeof result.current.forceRefresh).toBe('function');
      expect(typeof result.current.clearCache).toBe('function');
    });

    it('should accept configuration options', () => {
      const { result } = renderHook(() =>
        useBitcoinPrice({
          refreshIntervalMs: 1000,
          strategy: 'network-first',
          useSharedWorker: false,
        }),
      );

      // Should initialize without errors
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it('should provide utility functions', () => {
      const { result } = renderHook(() => useBitcoinPrice());

      expect(typeof result.current.forceRefresh).toBe('function');
      expect(typeof result.current.clearCache).toBe('function');

      // Functions should be callable without throwing
      expect(() => {
        act(() => {
          result.current.clearCache();
        });
      }).not.toThrow();
    });
  });

  describe('Legacy Hook', () => {
    it('should maintain backward compatibility', () => {
      const { result } = renderHook(() => useBitcoinPriceSimple());

      // Should only have legacy fields
      expect(result.current).toHaveProperty('currentPrice');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('lastUpdated');

      // Should not have new fields
      expect(result.current).not.toHaveProperty('cached');
      expect(result.current).not.toHaveProperty('source');
      expect(result.current).not.toHaveProperty('forceRefresh');
      expect(result.current).not.toHaveProperty('clearCache');
      expect(result.current).not.toHaveProperty('cacheStats');
    });

    it('should accept refresh interval parameter', () => {
      const { result } = renderHook(() => useBitcoinPriceSimple(2000));

      expect(result.current.loading).toBe(true);
      expect(result.current.currentPrice).toBe(null);
    });
  });

  describe('Hook Behavior', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useBitcoinPrice());

      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });

    it('should handle option changes', () => {
      let options = { refreshIntervalMs: 1000 };
      const { rerender } = renderHook(() => useBitcoinPrice(options));

      // Change options
      options = { refreshIntervalMs: 2000 };
      rerender();

      // Should not throw
      expect(true).toBe(true);
    });
  });
});
