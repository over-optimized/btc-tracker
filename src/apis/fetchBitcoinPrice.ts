import { bitcoinPriceCache } from '../utils/apiCache';
import {
  BitcoinPriceCacheData,
  ApiCacheError,
  RateLimitInfo,
  ApiErrorInfo,
} from '../types/ApiCache';

/**
 * Enhanced Bitcoin price fetching with caching, rate limiting, and error handling
 */

interface FetchBitcoinPriceOptions {
  /** Force bypass cache and fetch fresh data */
  forceRefresh?: boolean;
  /** Cache strategy to use */
  strategy?: 'cache-first' | 'network-first' | 'cache-only' | 'network-only';
  /** Custom TTL for this request */
  ttl?: number;
  /** Whether to use SharedWorker if available */
  useSharedWorker?: boolean;
}

interface FetchBitcoinPriceResult {
  price: number;
  cached: boolean;
  timestamp: Date;
  rateLimitInfo?: RateLimitInfo;
  source: 'cache' | 'api' | 'sharedWorker';
}

class BitcoinPriceAPI {
  private baseUrl = 'https://api.coingecko.com/api/v3/simple/price';
  private apiKey?: string;
  private sharedWorker?: SharedWorker;
  private sharedWorkerSupported = false;

  constructor() {
    this.apiKey = import.meta.env.VITE_COINGECKO_API_KEY;
    this.initializeSharedWorker();
  }

  /**
   * Initialize SharedWorker for cross-tab coordination
   */
  private initializeSharedWorker() {
    if (typeof window === 'undefined' || typeof SharedWorker === 'undefined') {
      return;
    }

    const useSharedWorker = import.meta.env.VITE_ENABLE_SHARED_WORKER !== 'false';
    if (!useSharedWorker) {
      return;
    }

    try {
      this.sharedWorker = new SharedWorker('/price-worker.js');
      this.sharedWorkerSupported = true;

      // Configure worker
      this.sharedWorker.port.postMessage({
        type: 'update-config',
        payload: {
          apiKey: this.apiKey,
          cacheTTL: parseInt(import.meta.env.VITE_BITCOIN_PRICE_CACHE_TTL || '300000'),
          pollInterval: parseInt(import.meta.env.VITE_BITCOIN_PRICE_POLL_INTERVAL || '300000'),
        },
      });

      this.sharedWorker.port.start();
    } catch (error) {
      console.warn('SharedWorker not supported or failed to initialize:', error);
      this.sharedWorkerSupported = false;
    }
  }

  /**
   * Fetch Bitcoin price using SharedWorker
   */
  private async fetchFromSharedWorker(): Promise<FetchBitcoinPriceResult> {
    if (!this.sharedWorker) {
      throw new Error('SharedWorker not available');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('SharedWorker timeout'));
      }, 10000);

      const handleMessage = (event: MessageEvent) => {
        const { type, payload } = event.data;

        if (type === 'price-update') {
          clearTimeout(timeout);
          this.sharedWorker!.port.removeEventListener('message', handleMessage);

          resolve({
            price: payload.price,
            cached: false,
            timestamp: new Date(payload.timestamp),
            source: 'sharedWorker',
          });
        } else if (type === 'error') {
          clearTimeout(timeout);
          this.sharedWorker!.port.removeEventListener('message', handleMessage);
          reject(new Error(payload.error));
        }
      };

      this.sharedWorker.port.addEventListener('message', handleMessage);
      this.sharedWorker.port.postMessage({ type: 'get-price' });
    });
  }

  /**
   * Fetch Bitcoin price directly from CoinGecko API
   */
  private async fetchFromAPI(): Promise<FetchBitcoinPriceResult> {
    const url = new URL(this.baseUrl);
    url.searchParams.set('ids', 'bitcoin');
    url.searchParams.set('vs_currencies', 'usd');

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (this.apiKey) {
      headers['x-cg-demo-api-key'] = this.apiKey;
    }

    const response = await fetch(url.toString(), { headers });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      const rateLimitInfo: RateLimitInfo = {
        remaining: 0,
        resetTime: Date.now() + (retryAfter ? parseInt(retryAfter) * 1000 : 60000),
        windowSeconds: retryAfter ? parseInt(retryAfter) : 60,
        isLimited: true,
      };

      const error: ApiErrorInfo = {
        status: 429,
        message: 'Rate limit exceeded',
        retryAfter: retryAfter ? parseInt(retryAfter) : 60,
        rateLimitInfo,
      };

      throw new ApiCacheError('Rate limit exceeded', 'RATE_LIMITED', error);
    }

    if (!response.ok) {
      const error: ApiErrorInfo = {
        status: response.status,
        message: response.statusText || `HTTP ${response.status}`,
      };
      throw new ApiCacheError(`API request failed: ${error.message}`, 'NETWORK_ERROR', error);
    }

    const data = await response.json();
    const price = data.bitcoin?.usd;

    if (typeof price !== 'number' || price <= 0) {
      throw new ApiCacheError('Invalid price data received', 'INVALID_DATA');
    }

    // Extract rate limit info from headers
    const rateLimitInfo: RateLimitInfo | undefined = this.extractRateLimitInfo(response);

    return {
      price,
      cached: false,
      timestamp: new Date(),
      rateLimitInfo,
      source: 'api',
    };
  }

  /**
   * Extract rate limit information from response headers
   */
  private extractRateLimitInfo(response: Response): RateLimitInfo | undefined {
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');

    if (remaining !== null && reset !== null) {
      return {
        remaining: parseInt(remaining),
        resetTime: parseInt(reset) * 1000, // Convert to milliseconds
        windowSeconds: 60, // Assume 1 minute window
        isLimited: parseInt(remaining) === 0,
      };
    }

    return undefined;
  }

  /**
   * Create cached fetcher with exponential backoff
   */
  private createCachedFetcher(options: FetchBitcoinPriceOptions) {
    const cacheKey = 'bitcoin-price-usd';

    return bitcoinPriceCache.createCachedFetcher(
      async () => {
        // Try SharedWorker first if enabled and available
        if (options.useSharedWorker && this.sharedWorkerSupported) {
          try {
            return await this.fetchFromSharedWorker();
          } catch (error) {
            console.warn('SharedWorker fetch failed, falling back to direct API:', error);
          }
        }

        // Fallback to direct API call with retry logic
        return await this.fetchWithRetry();
      },
      cacheKey,
      {
        ttl: options.ttl,
        strategy: options.strategy,
        crossTab: true,
        persistent: true,
      },
    );
  }

  /**
   * Fetch with exponential backoff retry
   */
  private async fetchWithRetry(maxRetries = 3): Promise<FetchBitcoinPriceResult> {
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.fetchFromAPI();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on rate limit errors
        if (error instanceof ApiCacheError && error.code === 'RATE_LIMITED') {
          throw error;
        }

        // Don't retry on the last attempt
        if (attempt === maxRetries - 1) {
          break;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`Fetch attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error);

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Main fetch method with comprehensive options
   */
  async fetchPrice(options: FetchBitcoinPriceOptions = {}): Promise<FetchBitcoinPriceResult> {
    const { forceRefresh = false, strategy = 'cache-first', ttl, useSharedWorker = true } = options;

    // Force refresh bypasses cache
    if (forceRefresh) {
      const result = await this.fetchWithRetry();

      // Update cache with fresh data
      const cacheData: BitcoinPriceCacheData = {
        price: result.price,
        currency: 'usd',
        lastUpdated: result.timestamp,
        source: 'coingecko',
        rateLimit: result.rateLimitInfo
          ? {
              remaining: result.rateLimitInfo.remaining,
              resetTime: result.rateLimitInfo.resetTime,
            }
          : undefined,
      };

      bitcoinPriceCache.set('bitcoin-price-usd', cacheData.price, { ttl, persistent: true });

      return result;
    }

    try {
      const cachedFetcher = this.createCachedFetcher(options);
      const result = await cachedFetcher();

      // If result is from cache, mark it as cached
      if (typeof result === 'number') {
        const cacheEntry = bitcoinPriceCache.get('bitcoin-price-usd');
        return {
          price: result,
          cached: true,
          timestamp: cacheEntry ? new Date(cacheEntry.timestamp) : new Date(),
          source: 'cache',
        };
      }

      return result as FetchBitcoinPriceResult;
    } catch (error) {
      // Try to return stale cache data on error
      if (strategy !== 'network-only') {
        const staleEntry = bitcoinPriceCache.get('bitcoin-price-usd');
        if (staleEntry) {
          console.warn('Using stale cache data due to fetch error:', error);
          return {
            price: staleEntry.data,
            cached: true,
            timestamp: new Date(staleEntry.timestamp),
            source: 'cache',
          };
        }
      }

      throw error;
    }
  }
}

// Create singleton instance
const bitcoinAPI = new BitcoinPriceAPI();

/**
 * Simple fetch function that returns just the price (backward compatibility)
 */
export const fetchBitcoinPrice = async (options?: FetchBitcoinPriceOptions): Promise<number> => {
  const result = await bitcoinAPI.fetchPrice(options);
  return result.price;
};

/**
 * Enhanced fetch function that returns full result with metadata
 */
export const fetchBitcoinPriceWithMetadata = async (
  options?: FetchBitcoinPriceOptions,
): Promise<FetchBitcoinPriceResult> => {
  return bitcoinAPI.fetchPrice(options);
};

/**
 * Get cache statistics
 */
export const getBitcoinPriceCacheStats = () => {
  return bitcoinPriceCache.getStats();
};

/**
 * Clear Bitcoin price cache
 */
export const clearBitcoinPriceCache = () => {
  bitcoinPriceCache.clear();
};

/**
 * Force refresh Bitcoin price (bypass cache)
 */
export const forceRefreshBitcoinPrice = async (): Promise<FetchBitcoinPriceResult> => {
  return bitcoinAPI.fetchPrice({ forceRefresh: true });
};
