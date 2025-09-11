/**
 * API Cache System Tests
 *
 * Tests the core caching functionality including TTL management,
 * cross-tab synchronization, and cache strategies.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiCache } from '../apiCache';
import { CacheEntry, CacheStats, ApiCacheError } from '../../types/ApiCache';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

// Mock window and localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ApiCache', () => {
  let cache: ApiCache<string>;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.length = 0;

    cache = new ApiCache<string>({
      defaultTtl: 5000, // 5 seconds for testing
      maxEntries: 3,
      cleanupInterval: 1000,
      persistent: true,
    });
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('Basic Cache Operations', () => {
    it('should set and get cached data', () => {
      cache.set('test-key', 'test-value');

      const result = cache.get('test-key');
      expect(result).toBeTruthy();
      expect(result?.data).toBe('test-value');
      expect(result?.timestamp).toBeTypeOf('number');
      expect(result?.ttl).toBe(5000);
    });

    it('should return null for non-existent keys', () => {
      const result = cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should check if key exists', () => {
      cache.set('test-key', 'test-value');

      expect(cache.has('test-key')).toBe(true);
      expect(cache.has('non-existent')).toBe(false);
    });

    it('should delete specific cache entries', () => {
      cache.set('test-key', 'test-value');
      expect(cache.has('test-key')).toBe(true);

      const deleted = cache.delete('test-key');
      expect(deleted).toBe(true);
      expect(cache.has('test-key')).toBe(false);
    });

    it('should clear all cache entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(true);

      cache.clear();

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
    });
  });

  describe('TTL and Expiration', () => {
    it('should respect custom TTL', () => {
      cache.set('test-key', 'test-value', { ttl: 1000 });

      const result = cache.get('test-key');
      expect(result?.ttl).toBe(1000);
    });

    it('should return null for expired entries', async () => {
      cache.set('test-key', 'test-value', { ttl: 10 }); // 10ms

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 20));

      const result = cache.get('test-key');
      expect(result).toBeNull();
    });

    it('should clean up expired entries', async () => {
      cache.set('expired-key', 'expired-value', { ttl: 10 });
      cache.set('valid-key', 'valid-value', { ttl: 5000 });

      // Wait for first entry to expire
      await new Promise((resolve) => setTimeout(resolve, 20));

      const cleanedCount = cache.cleanup();
      expect(cleanedCount).toBe(1);
      expect(cache.has('expired-key')).toBe(false);
      expect(cache.has('valid-key')).toBe(true);
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache hits and misses', () => {
      cache.set('test-key', 'test-value');

      // Hit
      cache.get('test-key');

      // Miss
      cache.get('non-existent');

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.size).toBe(1);
    });

    it('should track cache size', () => {
      expect(cache.getStats().size).toBe(0);

      cache.set('key1', 'value1');
      expect(cache.getStats().size).toBe(1);

      cache.set('key2', 'value2');
      expect(cache.getStats().size).toBe(2);

      cache.delete('key1');
      expect(cache.getStats().size).toBe(1);
    });
  });

  describe('Max Entries Limit', () => {
    it('should enforce max entries limit', () => {
      // Set up cache with 3 max entries
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(cache.getStats().size).toBe(3);

      // Adding fourth entry should remove oldest
      cache.set('key4', 'value4');

      expect(cache.getStats().size).toBe(3);
      expect(cache.has('key1')).toBe(false); // Oldest removed
      expect(cache.has('key4')).toBe(true); // Newest added
    });
  });

  describe('Persistent Storage Integration', () => {
    it('should save to localStorage when persistent is enabled', () => {
      cache.set('test-key', 'test-value');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'btc-api-cache-test-key',
        expect.stringContaining('"data":"test-value"'),
      );
    });

    it('should load from localStorage on cache miss', () => {
      const mockEntry: CacheEntry<string> = {
        data: 'stored-value',
        timestamp: Date.now(),
        ttl: 5000,
        expiresAt: Date.now() + 5000,
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEntry));

      const result = cache.get('stored-key');
      expect(result?.data).toBe('stored-value');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('btc-api-cache-stored-key');
    });

    it('should delete from localStorage when deleting entries', () => {
      cache.set('test-key', 'test-value');
      cache.delete('test-key');

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('btc-api-cache-test-key');
    });
  });

  describe('Cache Strategies', () => {
    let mockFetcher: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockFetcher = vi.fn().mockResolvedValue('fresh-data');
    });

    it('should implement cache-first strategy', async () => {
      // Set cached data
      cache.set('test-key', 'cached-data');

      const cachedFetcher = cache.createCachedFetcher(mockFetcher, 'test-key', {
        strategy: 'cache-first',
      });

      const result = await cachedFetcher();

      expect(result).toBe('cached-data');
      expect(mockFetcher).not.toHaveBeenCalled();
    });

    it('should implement network-first strategy', async () => {
      // Set cached data
      cache.set('test-key', 'cached-data');

      const cachedFetcher = cache.createCachedFetcher(mockFetcher, 'test-key', {
        strategy: 'network-first',
      });

      const result = await cachedFetcher();

      expect(result).toBe('fresh-data');
      expect(mockFetcher).toHaveBeenCalled();
    });

    it('should fall back to cache on network error with network-first', async () => {
      // Set cached data
      cache.set('test-key', 'cached-data');

      // Mock network error
      mockFetcher.mockRejectedValue(new Error('Network error'));

      const cachedFetcher = cache.createCachedFetcher(mockFetcher, 'test-key', {
        strategy: 'network-first',
      });

      const result = await cachedFetcher();

      expect(result).toBe('cached-data');
      expect(mockFetcher).toHaveBeenCalled();
    });

    it('should implement cache-only strategy', async () => {
      // Set cached data
      cache.set('test-key', 'cached-data');

      const cachedFetcher = cache.createCachedFetcher(mockFetcher, 'test-key', {
        strategy: 'cache-only',
      });

      const result = await cachedFetcher();

      expect(result).toBe('cached-data');
      expect(mockFetcher).not.toHaveBeenCalled();
    });

    it('should throw error on cache-only strategy with no cached data', async () => {
      const cachedFetcher = cache.createCachedFetcher(mockFetcher, 'non-existent-key', {
        strategy: 'cache-only',
      });

      await expect(cachedFetcher()).rejects.toThrow(ApiCacheError);
      expect(mockFetcher).not.toHaveBeenCalled();
    });

    it('should implement network-only strategy', async () => {
      // Set cached data
      cache.set('test-key', 'cached-data');

      const cachedFetcher = cache.createCachedFetcher(mockFetcher, 'test-key', {
        strategy: 'network-only',
      });

      const result = await cachedFetcher();

      expect(result).toBe('fresh-data');
      expect(mockFetcher).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should track errors in statistics', async () => {
      const mockFetcher = vi.fn().mockRejectedValue(new Error('Test error'));

      const cachedFetcher = cache.createCachedFetcher(mockFetcher, 'test-key', {
        strategy: 'network-only',
      });

      await expect(cachedFetcher()).rejects.toThrow('Test error');

      const stats = cache.getStats();
      expect(stats.errors).toBe(1);
    });

    it('should handle invalid strategy', () => {
      expect(() => {
        cache.createCachedFetcher(vi.fn(), 'test-key', { strategy: 'invalid-strategy' as any });
      }).not.toThrow(); // Should not throw during creation
    });
  });

  describe('Edge Cases', () => {
    it('should handle localStorage errors gracefully', () => {
      // Suppress expected console errors for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw
      expect(() => {
        cache.set('test-key', 'test-value');
      }).not.toThrow();

      consoleSpy.mockRestore();
    });

    it('should handle invalid JSON in localStorage', () => {
      // Suppress expected console errors for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      localStorageMock.getItem.mockReturnValue('invalid-json');

      const result = cache.get('test-key');
      expect(result).toBeNull();

      consoleSpy.mockRestore();
    });

    it('should handle concurrent access safely', () => {
      // Set multiple entries concurrently
      Promise.all([
        cache.set('key1', 'value1'),
        cache.set('key2', 'value2'),
        cache.set('key3', 'value3'),
      ]);

      // Should not throw
      expect(cache.getStats().size).toBeGreaterThan(0);
    });
  });
});
