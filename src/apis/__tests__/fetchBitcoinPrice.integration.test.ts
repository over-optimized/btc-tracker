/**
 * Bitcoin Price API Integration Tests
 *
 * Simplified tests focusing on core functionality without complex mocking.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiCache } from '../../utils/apiCache';

// Mock environment
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_COINGECKO_API_KEY: '',
    VITE_BITCOIN_PRICE_CACHE_TTL: '10000', // 10 seconds for testing
    VITE_BITCOIN_PRICE_POLL_INTERVAL: '10000',
    VITE_ENABLE_SHARED_WORKER: 'false', // Disable for simpler testing
  },
  writable: true,
});

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

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

// Mock SharedWorker to prevent initialization
global.SharedWorker = vi.fn();

describe('Bitcoin Price API Integration', () => {
  let testCache: ApiCache<number>;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockFetch.mockClear();

    // Create a new cache instance for each test
    testCache = new ApiCache<number>({
      defaultTtl: 10000,
      maxEntries: 10,
      persistent: true,
    });
  });

  describe('Cache System', () => {
    it('should cache Bitcoin price data', () => {
      // Test basic cache operations
      testCache.set('test-price', 50000, { ttl: 10000 });

      const cached = testCache.get('test-price');
      expect(cached).toBeTruthy();
      expect(cached?.data).toBe(50000);
    });

    it('should respect TTL expiration', async () => {
      testCache.set('test-price', 50000, { ttl: 10 }); // 10ms

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 20));

      const expired = testCache.get('test-price');
      expect(expired).toBeNull();
    });

    it('should provide cache statistics', () => {
      const stats = testCache.getStats();
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('errors');
      expect(stats).toHaveProperty('size');
    });

    it('should clear cache', () => {
      testCache.set('test-price', 50000);
      expect(testCache.getStats().size).toBeGreaterThan(0);

      testCache.clear();
      expect(testCache.getStats().size).toBe(0);
    });
  });

  describe('Cache Strategies', () => {
    it('should implement cache-first strategy', async () => {
      const mockFetcher = vi.fn().mockResolvedValue('fresh-data');

      // Set cached data
      testCache.set('test-key', 'cached-data');

      const cachedFetcher = testCache.createCachedFetcher(mockFetcher, 'test-key', {
        strategy: 'cache-first',
      });

      const result = await cachedFetcher();

      expect(result).toBe('cached-data');
      expect(mockFetcher).not.toHaveBeenCalled();
    });

    it('should implement network-first strategy', async () => {
      const mockFetcher = vi.fn().mockResolvedValue('fresh-data');

      // Set cached data
      testCache.set('test-key', 'cached-data');

      const cachedFetcher = testCache.createCachedFetcher(mockFetcher, 'test-key', {
        strategy: 'network-first',
      });

      const result = await cachedFetcher();

      expect(result).toBe('fresh-data');
      expect(mockFetcher).toHaveBeenCalled();
    });

    it('should fall back to cache on network error', async () => {
      const mockFetcher = vi.fn().mockRejectedValue(new Error('Network error'));

      // Set cached data
      testCache.set('test-key', 'cached-data');

      const cachedFetcher = testCache.createCachedFetcher(mockFetcher, 'test-key', {
        strategy: 'network-first',
      });

      const result = await cachedFetcher();

      expect(result).toBe('cached-data');
      expect(mockFetcher).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw
      expect(() => {
        testCache.set('test-key', 'test-value');
      }).not.toThrow();
    });

    it('should handle invalid JSON in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      const result = testCache.get('test-key');
      expect(result).toBeNull();
    });
  });
});
