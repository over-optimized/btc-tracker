/**
 * API Cache System Type Definitions
 *
 * Provides TypeScript interfaces for the Bitcoin price caching system
 * including cache strategies, TTL management, and cross-tab synchronization.
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time-to-live in milliseconds
  expiresAt: number; // Absolute expiration time
}

export interface CacheOptions {
  /** Cache duration in milliseconds (default: 5 minutes) */
  ttl?: number;
  /** Cache strategy - how to handle cache hits/misses */
  strategy?: CacheStrategy;
  /** Whether to enable cross-tab synchronization */
  crossTab?: boolean;
  /** Whether to persist cache to localStorage */
  persistent?: boolean;
}

export type CacheStrategy =
  | 'cache-first' // Use cache if available, fallback to network
  | 'network-first' // Try network first, fallback to cache
  | 'cache-only' // Only use cached data, never fetch
  | 'network-only'; // Always fetch from network, bypass cache

export interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
  size: number; // Number of cached entries
  memoryUsage?: number; // Estimated memory usage in bytes
}

export interface ApiCacheInterface<T> {
  /** Get cached data for a key */
  get(key: string): CacheEntry<T> | null;

  /** Set cached data for a key */
  set(key: string, data: T, options?: CacheOptions): void;

  /** Remove specific cache entry */
  delete(key: string): boolean;

  /** Clear all cache entries */
  clear(): void;

  /** Check if key exists and is not expired */
  has(key: string): boolean;

  /** Get cache statistics */
  getStats(): CacheStats;

  /** Clean up expired entries */
  cleanup(): number; // Returns number of cleaned entries
}

export interface BitcoinPriceCacheData {
  price: number;
  currency: 'usd';
  lastUpdated: Date;
  source: 'coingecko';
  rateLimit?: {
    remaining: number;
    resetTime: number;
  };
}

export interface CacheStorageEvent {
  type: 'cache-update' | 'cache-invalidate' | 'cache-clear';
  key?: string;
  data?: unknown;
  timestamp: number;
  source: 'memory' | 'localStorage' | 'sharedWorker';
}

export interface SharedWorkerMessage {
  type: 'get-price' | 'price-update' | 'error' | 'stats' | 'connect' | 'disconnect';
  payload?: {
    price?: number;
    error?: string;
    timestamp?: number;
    stats?: CacheStats;
    clientId?: string;
  };
}

export interface RateLimitInfo {
  /** Remaining requests in current window */
  remaining: number;
  /** When the rate limit resets (Unix timestamp) */
  resetTime: number;
  /** Rate limit window in seconds */
  windowSeconds: number;
  /** Whether we're currently rate limited */
  isLimited: boolean;
}

export interface ApiErrorInfo {
  status: number;
  message: string;
  retryAfter?: number; // Seconds to wait before retry
  rateLimitInfo?: RateLimitInfo;
}

export class ApiCacheError extends Error {
  constructor(
    message: string,
    public code: 'CACHE_MISS' | 'EXPIRED' | 'RATE_LIMITED' | 'NETWORK_ERROR' | 'INVALID_DATA',
    public details?: ApiErrorInfo,
  ) {
    super(message);
    this.name = 'ApiCacheError';
  }
}

export interface CacheConfiguration {
  /** Default TTL for cached entries in milliseconds */
  defaultTtl: number;
  /** Maximum number of entries to keep in memory */
  maxEntries: number;
  /** How often to run cleanup in milliseconds */
  cleanupInterval: number;
  /** Whether to enable localStorage persistence */
  persistent: boolean;
  /** Whether to enable SharedWorker cross-tab coordination */
  sharedWorker: boolean;
  /** Base URL for CoinGecko API */
  apiBaseUrl: string;
  /** Optional API key for CoinGecko Demo plan */
  apiKey?: string;
}
