/**
 * Enhanced Bitcoin Price API Tests
 *
 * Tests the fetchBitcoinPrice API with caching, rate limiting,
 * and SharedWorker integration.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchBitcoinPrice,
  fetchBitcoinPriceWithMetadata,
  getBitcoinPriceCacheStats,
  clearBitcoinPriceCache,
  forceRefreshBitcoinPrice,
} from '../fetchBitcoinPrice';
import { ApiCacheError } from '../../types/ApiCache';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock SharedWorker
const mockSharedWorker = {
  port: {
    postMessage: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    start: vi.fn(),
  },
};

// Mock SharedWorker constructor - track calls
const mockSharedWorkerConstructor = vi.fn().mockImplementation(() => mockSharedWorker);
global.SharedWorker = mockSharedWorkerConstructor;

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_COINGECKO_API_KEY: '',
    VITE_BITCOIN_PRICE_CACHE_TTL: '300000',
    VITE_BITCOIN_PRICE_POLL_INTERVAL: '300000',
    VITE_ENABLE_SHARED_WORKER: 'true',
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Enhanced Bitcoin Price API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    localStorageMock.getItem.mockReturnValue(null);
    clearBitcoinPriceCache();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('fetchBitcoinPrice (simple)', () => {
    it('should fetch Bitcoin price successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => ({ bitcoin: { usd: 50000 } }),
      });

      const price = await fetchBitcoinPrice();
      expect(price).toBe(50000);
    });

    it('should use cached price on subsequent calls', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({ bitcoin: { usd: 50000 } }),
      });

      // First call - should fetch
      const price1 = await fetchBitcoinPrice();
      expect(price1).toBe(50000);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const price2 = await fetchBitcoinPrice();
      expect(price2).toBe(50000);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional fetch
    });

    it('should force refresh when requested', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map(),
          json: async () => ({ bitcoin: { usd: 50000 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map(),
          json: async () => ({ bitcoin: { usd: 51000 } }),
        });

      // First call
      await fetchBitcoinPrice();

      // Force refresh
      const price = await fetchBitcoinPrice({ forceRefresh: true });
      expect(price).toBe(51000);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('fetchBitcoinPriceWithMetadata', () => {
    it('should return full metadata', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([
          ['x-ratelimit-remaining', '100'],
          ['x-ratelimit-reset', String(Math.floor(Date.now() / 1000) + 60)],
        ]),
        json: async () => ({ bitcoin: { usd: 50000 } }),
      });

      const result = await fetchBitcoinPriceWithMetadata();

      expect(result.price).toBe(50000);
      expect(result.cached).toBe(false);
      expect(result.source).toBe('api');
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.rateLimitInfo).toBeDefined();
      expect(result.rateLimitInfo?.remaining).toBe(100);
    });

    it('should return cached data with proper metadata', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({ bitcoin: { usd: 50000 } }),
      });

      // First call to populate cache
      await fetchBitcoinPriceWithMetadata();

      // Second call should return cached data
      const result = await fetchBitcoinPriceWithMetadata();

      expect(result.price).toBe(50000);
      expect(result.cached).toBe(true);
      expect(result.source).toBe('cache');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle 429 rate limit error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: {
          get: (key: string) => (key === 'retry-after' ? '60' : null),
        },
        json: async () => ({}),
      });

      await expect(fetchBitcoinPrice()).rejects.toThrow(ApiCacheError);

      try {
        await fetchBitcoinPrice();
      } catch (error) {
        expect(error).toBeInstanceOf(ApiCacheError);
        expect((error as ApiCacheError).code).toBe('RATE_LIMITED');
        expect((error as ApiCacheError).details?.retryAfter).toBe(60);
      }
    });

    it('should extract rate limit info from headers', async () => {
      const resetTime = Math.floor(Date.now() / 1000) + 60;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: (key: string) => {
            if (key === 'x-ratelimit-remaining') return '5';
            if (key === 'x-ratelimit-reset') return String(resetTime);
            return null;
          },
        },
        json: async () => ({ bitcoin: { usd: 50000 } }),
      });

      const result = await fetchBitcoinPriceWithMetadata();

      expect(result.rateLimitInfo).toBeDefined();
      expect(result.rateLimitInfo?.remaining).toBe(5);
      expect(result.rateLimitInfo?.resetTime).toBe(resetTime * 1000);
      expect(result.rateLimitInfo?.isLimited).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchBitcoinPrice()).rejects.toThrow('Network error');
    });

    it('should handle invalid API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({ bitcoin: { usd: 'invalid' } }),
      });

      await expect(fetchBitcoinPrice()).rejects.toThrow(ApiCacheError);
    });

    it('should handle missing bitcoin data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({ ethereum: { usd: 3000 } }),
      });

      await expect(fetchBitcoinPrice()).rejects.toThrow(ApiCacheError);
    });

    it('should handle negative price', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({ bitcoin: { usd: -1000 } }),
      });

      await expect(fetchBitcoinPrice()).rejects.toThrow(ApiCacheError);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on transient errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Temporary error')).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({ bitcoin: { usd: 50000 } }),
      });

      const price = await fetchBitcoinPrice();
      expect(price).toBe(50000);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on rate limit errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Map([['retry-after', '60']]),
      });

      await expect(fetchBitcoinPrice()).rejects.toThrow(ApiCacheError);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retry
    });

    it('should give up after max retries', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockRejectedValueOnce(new Error('Error 3'));

      await expect(fetchBitcoinPrice()).rejects.toThrow('Error 3');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Cache Strategies', () => {
    it('should support cache-first strategy', async () => {
      // Populate cache
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({ bitcoin: { usd: 50000 } }),
      });
      await fetchBitcoinPrice();

      // Use cache-first strategy
      const result = await fetchBitcoinPriceWithMetadata({ strategy: 'cache-first' });
      expect(result.cached).toBe(true);
      expect(result.price).toBe(50000);
    });

    it('should support network-first strategy', async () => {
      // Populate cache
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({ bitcoin: { usd: 50000 } }),
      });
      await fetchBitcoinPrice();

      // Use network-first strategy (should fetch new data)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({ bitcoin: { usd: 51000 } }),
      });

      const result = await fetchBitcoinPriceWithMetadata({ strategy: 'network-first' });
      expect(result.cached).toBe(false);
      expect(result.price).toBe(51000);
    });

    it('should fall back to cache on network-first error', async () => {
      // Populate cache
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({ bitcoin: { usd: 50000 } }),
      });
      await fetchBitcoinPrice();

      // Network error on subsequent call
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchBitcoinPriceWithMetadata({ strategy: 'network-first' });
      expect(result.cached).toBe(true);
      expect(result.price).toBe(50000);
    });
  });

  describe('Utility Functions', () => {
    it('should get cache statistics', async () => {
      const stats = getBitcoinPriceCacheStats();
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('errors');
      expect(stats).toHaveProperty('size');
    });

    it('should clear cache', async () => {
      // Populate cache
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({ bitcoin: { usd: 50000 } }),
      });
      await fetchBitcoinPrice();

      let stats = getBitcoinPriceCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      clearBitcoinPriceCache();

      stats = getBitcoinPriceCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should force refresh', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map(),
          json: async () => ({ bitcoin: { usd: 50000 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map(),
          json: async () => ({ bitcoin: { usd: 51000 } }),
        });

      // Initial fetch
      await fetchBitcoinPrice();

      // Force refresh
      const result = await forceRefreshBitcoinPrice();
      expect(result.price).toBe(51000);
      expect(result.cached).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('API Key Support', () => {
    it('should include API key in headers when provided', async () => {
      // Mock environment with API key
      vi.mocked(import.meta.env).VITE_COINGECKO_API_KEY = 'test-api-key';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({ bitcoin: { usd: 50000 } }),
      });

      await fetchBitcoinPrice();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-cg-demo-api-key': 'test-api-key',
          }),
        }),
      );
    });

    it('should work without API key', async () => {
      // Mock environment without API key
      vi.mocked(import.meta.env).VITE_COINGECKO_API_KEY = '';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({ bitcoin: { usd: 50000 } }),
      });

      const price = await fetchBitcoinPrice();
      expect(price).toBe(50000);
    });
  });

  describe('SharedWorker Integration', () => {
    it('should initialize SharedWorker when enabled', () => {
      // SharedWorker should be created during module initialization
      expect(mockSharedWorkerConstructor).toHaveBeenCalledWith('/price-worker.js');
    });

    it('should configure SharedWorker with environment variables', () => {
      expect(mockSharedWorker.port.postMessage).toHaveBeenCalledWith({
        type: 'update-config',
        payload: expect.objectContaining({
          cacheTTL: 300000,
          pollInterval: 300000,
        }),
      });
    });

    it('should handle SharedWorker errors gracefully', async () => {
      // Mock SharedWorker error
      mockSharedWorker.port.addEventListener.mockImplementation((event, handler) => {
        if (event === 'message') {
          setTimeout(() => {
            handler({ data: { type: 'error', payload: { error: 'Worker error' } } });
          }, 10);
        }
      });

      // Should fall back to direct API call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({ bitcoin: { usd: 50000 } }),
      });

      const result = await fetchBitcoinPriceWithMetadata({ useSharedWorker: true });
      expect(result.price).toBe(50000);
      expect(result.source).toBe('api'); // Fallback to API
    });
  });
});
