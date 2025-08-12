/**
 * Enhanced useBitcoinPrice Hook Tests
 *
 * Tests the enhanced Bitcoin price hook with caching, rate limiting,
 * and cross-tab coordination features.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useBitcoinPrice, useBitcoinPriceSimple } from '../useBitcoinPrice';
import { ApiCacheError } from '../../types/ApiCache';

// Mock the enhanced fetchBitcoinPrice API
vi.mock('../../apis/fetchBitcoinPrice', () => ({
  fetchBitcoinPrice: vi.fn(),
  fetchBitcoinPriceWithMetadata: vi.fn(),
  getBitcoinPriceCacheStats: vi.fn(() => ({ hits: 0, misses: 0, errors: 0, size: 0 })),
  clearBitcoinPriceCache: vi.fn(),
}));

const mockFetchBitcoinPriceWithMetadata = vi.mocked(
  await import('../../apis/fetchBitcoinPrice'),
).fetchBitcoinPriceWithMetadata;

const mockGetBitcoinPriceCacheStats = vi.mocked(
  await import('../../apis/fetchBitcoinPrice'),
).getBitcoinPriceCacheStats;

describe('useBitcoinPrice (Enhanced)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should initialize with null price and loading state', () => {
      const { result } = renderHook(() => useBitcoinPrice());

      expect(result.current.currentPrice).toBe(null);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(result.current.cached).toBe(false);
      expect(result.current.source).toBe(null);
    });

    it('should fetch Bitcoin price on mount', async () => {
      const mockResponse = {
        price: 50000,
        cached: false,
        timestamp: new Date(),
        source: 'api' as const,
      };

      mockFetchBitcoinPriceWithMetadata.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useBitcoinPrice());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.currentPrice).toBe(50000);
      expect(result.current.cached).toBe(false);
      expect(result.current.source).toBe('api');
      expect(result.current.lastUpdated).toBeInstanceOf(Date);
      expect(result.current.error).toBe(null);
    });

    it('should handle cached responses', async () => {
      const mockResponse = {
        price: 50000,
        cached: true,
        timestamp: new Date(),
        source: 'cache' as const,
      };

      mockFetchBitcoinPriceWithMetadata.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useBitcoinPrice());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.currentPrice).toBe(50000);
      expect(result.current.cached).toBe(true);
      expect(result.current.source).toBe('cache');
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limit errors', async () => {
      const rateLimitError = new ApiCacheError('Rate limited', 'RATE_LIMITED', {
        status: 429,
        message: 'Too many requests',
        retryAfter: 60,
        rateLimitInfo: {
          remaining: 0,
          resetTime: Date.now() + 60000,
          windowSeconds: 60,
          isLimited: true,
        },
      });

      mockFetchBitcoinPriceWithMetadata.mockRejectedValueOnce(rateLimitError);

      const { result } = renderHook(() => useBitcoinPrice());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toContain('Rate limited');
      expect(result.current.error).toContain('60 seconds');
      expect(result.current.rateLimitInfo?.isLimited).toBe(true);
      expect(result.current.currentPrice).toBe(null);
    });

    it('should handle network errors', async () => {
      const networkError = new ApiCacheError('Network failed', 'NETWORK_ERROR', {
        status: 500,
        message: 'Internal server error',
      });

      mockFetchBitcoinPriceWithMetadata.mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useBitcoinPrice());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toContain('Network error');
      expect(result.current.currentPrice).toBe(null);
    });

    it('should handle cache miss errors', async () => {
      const cacheMissError = new ApiCacheError('No cached data', 'CACHE_MISS');

      mockFetchBitcoinPriceWithMetadata.mockRejectedValueOnce(cacheMissError);

      const { result } = renderHook(() => useBitcoinPrice());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('No cached data available');
      expect(result.current.currentPrice).toBe(null);
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Something went wrong');

      mockFetchBitcoinPriceWithMetadata.mockRejectedValueOnce(genericError);

      const { result } = renderHook(() => useBitcoinPrice());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Something went wrong');
    });
  });

  describe('Configuration Options', () => {
    it('should use custom refresh interval', async () => {
      const mockResponse = {
        price: 50000,
        cached: false,
        timestamp: new Date(),
        source: 'api' as const,
      };

      mockFetchBitcoinPriceWithMetadata.mockResolvedValue(mockResponse);

      renderHook(() => useBitcoinPrice({ refreshIntervalMs: 1000 }));

      // Initial fetch
      expect(mockFetchBitcoinPriceWithMetadata).toHaveBeenCalledTimes(1);

      // Advance timer by 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should trigger another fetch
      expect(mockFetchBitcoinPriceWithMetadata).toHaveBeenCalledTimes(2);
    });

    it('should use force initial refresh option', async () => {
      const mockResponse = {
        price: 50000,
        cached: false,
        timestamp: new Date(),
        source: 'api' as const,
      };

      mockFetchBitcoinPriceWithMetadata.mockResolvedValueOnce(mockResponse);

      renderHook(() => useBitcoinPrice({ forceInitialRefresh: true }));

      expect(mockFetchBitcoinPriceWithMetadata).toHaveBeenCalledWith({
        forceRefresh: true,
        strategy: 'cache-first',
        useSharedWorker: true,
      });
    });

    it('should use custom cache strategy', async () => {
      const mockResponse = {
        price: 50000,
        cached: false,
        timestamp: new Date(),
        source: 'api' as const,
      };

      mockFetchBitcoinPriceWithMetadata.mockResolvedValueOnce(mockResponse);

      renderHook(() => useBitcoinPrice({ strategy: 'network-first' }));

      expect(mockFetchBitcoinPriceWithMetadata).toHaveBeenCalledWith({
        forceRefresh: false,
        strategy: 'network-first',
        useSharedWorker: true,
      });
    });

    it('should disable SharedWorker when requested', async () => {
      const mockResponse = {
        price: 50000,
        cached: false,
        timestamp: new Date(),
        source: 'api' as const,
      };

      mockFetchBitcoinPriceWithMetadata.mockResolvedValueOnce(mockResponse);

      renderHook(() => useBitcoinPrice({ useSharedWorker: false }));

      expect(mockFetchBitcoinPriceWithMetadata).toHaveBeenCalledWith({
        forceRefresh: false,
        strategy: 'cache-first',
        useSharedWorker: false,
      });
    });
  });

  describe('Cache Statistics', () => {
    it('should provide cache statistics', async () => {
      const mockStats = { hits: 5, misses: 2, errors: 1, size: 3 };
      mockGetBitcoinPriceCacheStats.mockReturnValue(mockStats);

      const mockResponse = {
        price: 50000,
        cached: false,
        timestamp: new Date(),
        source: 'api' as const,
      };

      mockFetchBitcoinPriceWithMetadata.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useBitcoinPrice());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.cacheStats).toEqual(mockStats);
    });
  });

  describe('Utility Functions', () => {
    it('should provide forceRefresh function', async () => {
      const mockResponse = {
        price: 50000,
        cached: false,
        timestamp: new Date(),
        source: 'api' as const,
      };

      mockFetchBitcoinPriceWithMetadata.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useBitcoinPrice());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Reset mock call count
      mockFetchBitcoinPriceWithMetadata.mockClear();

      // Call forceRefresh
      await act(async () => {
        await result.current.forceRefresh();
      });

      expect(mockFetchBitcoinPriceWithMetadata).toHaveBeenCalledWith({
        forceRefresh: true,
        strategy: 'cache-first',
        useSharedWorker: true,
      });
    });

    it('should provide clearCache function', async () => {
      const { clearBitcoinPriceCache } = await import('../../apis/fetchBitcoinPrice');
      const mockClearCache = vi.mocked(clearBitcoinPriceCache);

      const mockResponse = {
        price: 50000,
        cached: false,
        timestamp: new Date(),
        source: 'api' as const,
      };

      mockFetchBitcoinPriceWithMetadata.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useBitcoinPrice());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Call clearCache
      act(() => {
        result.current.clearCache();
      });

      expect(mockClearCache).toHaveBeenCalled();
    });
  });

  describe('Rate Limit Information', () => {
    it('should expose rate limit information', async () => {
      const mockResponse = {
        price: 50000,
        cached: false,
        timestamp: new Date(),
        source: 'api' as const,
        rateLimitInfo: {
          remaining: 10,
          resetTime: Date.now() + 60000,
          isLimited: false,
        },
      };

      mockFetchBitcoinPriceWithMetadata.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useBitcoinPrice());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.rateLimitInfo).toEqual({
        remaining: 10,
        resetTime: expect.any(Number),
        isLimited: false,
      });
    });
  });

  describe('Component Unmounting', () => {
    it('should cleanup interval on unmount', async () => {
      const mockResponse = {
        price: 50000,
        cached: false,
        timestamp: new Date(),
        source: 'api' as const,
      };

      mockFetchBitcoinPriceWithMetadata.mockResolvedValue(mockResponse);

      const { unmount } = renderHook(() => useBitcoinPrice({ refreshIntervalMs: 1000 }));

      // Unmount the component
      unmount();

      // Advance timer - should not trigger fetch after unmount
      const initialCallCount = mockFetchBitcoinPriceWithMetadata.mock.calls.length;

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(mockFetchBitcoinPriceWithMetadata).toHaveBeenCalledTimes(initialCallCount);
    });

    it('should ignore responses after unmount', async () => {
      let resolvePromise: (value: any) => void;
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetchBitcoinPriceWithMetadata.mockReturnValueOnce(delayedPromise);

      const { result, unmount } = renderHook(() => useBitcoinPrice());

      // Unmount before promise resolves
      unmount();

      // Resolve promise after unmount
      act(() => {
        resolvePromise!({
          price: 50000,
          cached: false,
          timestamp: new Date(),
          source: 'api' as const,
        });
      });

      await waitFor(() => {
        // State should not have been updated after unmount
        expect(result.current.currentPrice).toBe(null);
      });
    });
  });
});

describe('useBitcoinPriceSimple (Legacy Compatibility)', () => {
  it('should maintain backward compatibility', async () => {
    const mockResponse = {
      price: 50000,
      cached: false,
      timestamp: new Date(),
      source: 'api' as const,
    };

    mockFetchBitcoinPriceWithMetadata.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useBitcoinPriceSimple());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should only return legacy fields
    expect(result.current).toEqual({
      currentPrice: 50000,
      loading: false,
      error: null,
      lastUpdated: expect.any(Date),
    });

    // Should not have new fields
    expect('cached' in result.current).toBe(false);
    expect('source' in result.current).toBe(false);
    expect('forceRefresh' in result.current).toBe(false);
  });

  it('should accept refresh interval parameter', async () => {
    const mockResponse = {
      price: 50000,
      cached: false,
      timestamp: new Date(),
      source: 'api' as const,
    };

    mockFetchBitcoinPriceWithMetadata.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useBitcoinPriceSimple(2000));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetchBitcoinPriceWithMetadata).toHaveBeenCalledWith({
      forceRefresh: false,
      strategy: 'cache-first',
      useSharedWorker: true,
    });
  });
});
