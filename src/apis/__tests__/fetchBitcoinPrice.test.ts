/**
 * Bitcoin Price API Tests (Core Functionality)
 *
 * Focus on testing that functions exist and can be called without errors.
 * Detailed behavior is tested in integration tests to avoid cache conflicts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock environment for testing
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_COINGECKO_API_KEY: '',
    VITE_BITCOIN_PRICE_CACHE_TTL: '10000',
    VITE_BITCOIN_PRICE_POLL_INTERVAL: '10000',
    VITE_ENABLE_SHARED_WORKER: 'false', // Simplify for testing
  },
  writable: true,
});

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Import after mocking
import {
  fetchBitcoinPrice,
  fetchBitcoinPriceWithMetadata,
  getBitcoinPriceCacheStats,
  clearBitcoinPriceCache,
  forceRefreshBitcoinPrice,
} from '../fetchBitcoinPrice';

describe('Enhanced Bitcoin Price API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);

    // Provide a consistent mock response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map([
        ['x-ratelimit-remaining', '100'],
        ['x-ratelimit-reset', String(Math.floor(Date.now() / 1000) + 60)],
      ]),
      json: async () => ({ bitcoin: { usd: 50000 } }),
    });
  });

  describe('Core API Functions', () => {
    it('should fetch Bitcoin price successfully', async () => {
      const price = await fetchBitcoinPrice();

      expect(typeof price).toBe('number');
      expect(price).toBeGreaterThan(0);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should return metadata with enhanced fetch', async () => {
      const result = await fetchBitcoinPriceWithMetadata();

      expect(typeof result.price).toBe('number');
      expect(result.price).toBeGreaterThan(0);
      expect(result.source).toEqual(expect.stringMatching(/^(api|cache|sharedWorker)$/));
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(typeof result.cached).toBe('boolean');
    });

    it('should handle force refresh option', async () => {
      const price = await fetchBitcoinPrice({ forceRefresh: true });

      expect(typeof price).toBe('number');
      expect(price).toBeGreaterThan(0);
    });

    it('should handle different configuration options', async () => {
      // Test that all options are accepted without throwing
      const price1 = await fetchBitcoinPrice({ strategy: 'cache-first' });
      const price2 = await fetchBitcoinPrice({ strategy: 'network-first' });
      const price3 = await fetchBitcoinPrice({ useSharedWorker: false });
      const price4 = await fetchBitcoinPrice({ ttl: 30000 });

      expect(typeof price1).toBe('number');
      expect(typeof price2).toBe('number');
      expect(typeof price3).toBe('number');
      expect(typeof price4).toBe('number');
    });
  });

  describe('Utility Functions', () => {
    it('should provide cache statistics', () => {
      const stats = getBitcoinPriceCacheStats();

      expect(stats).toEqual(
        expect.objectContaining({
          hits: expect.any(Number),
          misses: expect.any(Number),
          errors: expect.any(Number),
          size: expect.any(Number),
        }),
      );
    });

    it('should clear cache without errors', () => {
      expect(() => clearBitcoinPriceCache()).not.toThrow();
    });

    it('should force refresh without errors', async () => {
      const result = await forceRefreshBitcoinPrice();

      expect(typeof result.price).toBe('number');
      expect(result.price).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(typeof result.cached).toBe('boolean');
    });
  });

  describe('API Integration', () => {
    it('should call CoinGecko API with correct URL', async () => {
      await fetchBitcoinPrice({ forceRefresh: true });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api.coingecko.com'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: 'application/json',
          }),
        }),
      );
    });

    it('should handle API response format correctly', async () => {
      // Verify that the function can process the expected API response format
      const price = await fetchBitcoinPrice();
      expect(typeof price).toBe('number');
    });
  });
});
