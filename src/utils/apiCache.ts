/**
 * Generic API Cache Utility with TTL Support
 *
 * Provides a flexible caching system for API responses with:
 * - Time-to-live (TTL) management
 * - Cross-tab synchronization via localStorage
 * - Multiple cache strategies
 * - Automatic cleanup of expired entries
 * - Cache statistics and debugging
 * - Date field hydration for localStorage compatibility
 */

import { hydrateCacheEntry, safeDateConversion, CacheEntryWithDates } from './dateHydration';

import {
  ApiCacheInterface,
  CacheEntry,
  CacheOptions,
  CacheStats,
  CacheStorageEvent,
  CacheConfiguration,
  ApiCacheError,
} from '../types/ApiCache';

class ApiCache<T> implements ApiCacheInterface<T> {
  private memoryCache = new Map<string, CacheEntry<T>>();
  private stats: CacheStats = { hits: 0, misses: 0, errors: 0, size: 0 };
  private config: CacheConfiguration;
  private cleanupTimer?: NodeJS.Timeout;
  private storageKeyPrefix: string;

  constructor(config: Partial<CacheConfiguration> = {}) {
    this.config = {
      defaultTtl: 5 * 60 * 1000, // 5 minutes
      maxEntries: 100,
      cleanupInterval: 60 * 1000, // 1 minute
      persistent: true,
      sharedWorker: false,
      apiBaseUrl: 'https://api.coingecko.com/api/v3',
      ...config,
    };

    this.storageKeyPrefix = 'btc-api-cache-';

    // Set up automatic cleanup
    this.startCleanupTimer();

    // Set up cross-tab synchronization
    if (this.config.persistent && typeof window !== 'undefined') {
      this.setupStorageListener();
    }

    // Load persistent cache on initialization
    this.loadFromStorage();
  }

  /**
   * Get cached data for a key
   */
  get(key: string): CacheEntry<T> | null {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      this.stats.hits++;
      return memoryEntry;
    }

    // Check persistent storage if enabled
    if (this.config.persistent) {
      const storageEntry = this.getFromStorage(key);
      if (storageEntry && !this.isExpired(storageEntry)) {
        // Update memory cache
        this.memoryCache.set(key, storageEntry);
        this.stats.hits++;
        return storageEntry;
      }
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set cached data for a key
   */
  set(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.config.defaultTtl;
    const now = Date.now();

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl,
      expiresAt: now + ttl,
    };

    // Add to memory cache
    this.memoryCache.set(key, entry);

    // Add to persistent storage if enabled
    if (this.config.persistent && options.persistent !== false) {
      this.setToStorage(key, entry);
    }

    // Enforce max entries limit
    this.enforceMaxEntries();

    this.updateStats();

    // Emit storage event for cross-tab sync
    this.emitStorageEvent('cache-update', key, entry);
  }

  /**
   * Remove specific cache entry
   */
  delete(key: string): boolean {
    const memoryDeleted = this.memoryCache.delete(key);

    if (this.config.persistent) {
      this.deleteFromStorage(key);
    }

    this.updateStats();
    this.emitStorageEvent('cache-invalidate', key);

    return memoryDeleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.memoryCache.clear();

    if (this.config.persistent) {
      this.clearStorage();
    }

    this.stats = { hits: 0, misses: 0, errors: 0, size: 0 };
    this.emitStorageEvent('cache-clear');
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.get(key);
    return entry !== null;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    let cleanedCount = 0;

    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    // Clean persistent storage
    if (this.config.persistent) {
      cleanedCount += this.cleanupStorage();
    }

    this.updateStats();
    return cleanedCount;
  }

  /**
   * Create a cached fetch function with specific options
   */
  createCachedFetcher<R>(fetcher: () => Promise<R>, key: string, options: CacheOptions = {}) {
    return async (): Promise<R> => {
      const strategy = options.strategy || 'cache-first';

      try {
        switch (strategy) {
          case 'cache-first':
            return await this.cacheFirstStrategy(fetcher, key, options);
          case 'network-first':
            return await this.networkFirstStrategy(fetcher, key, options);
          case 'cache-only':
            return await this.cacheOnlyStrategy(key);
          case 'network-only':
            return await this.networkOnlyStrategy(fetcher, key, options);
          default:
            throw new ApiCacheError('Invalid cache strategy', 'INVALID_DATA');
        }
      } catch (error) {
        this.stats.errors++;
        throw error;
      }
    };
  }

  // Private methods

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() > entry.expiresAt;
  }

  private updateStats(): void {
    this.stats.size = this.memoryCache.size;
    this.stats.memoryUsage = this.estimateMemoryUsage();
  }

  private estimateMemoryUsage(): number {
    // Rough estimate of memory usage
    let usage = 0;
    for (const entry of this.memoryCache.values()) {
      usage += JSON.stringify(entry).length * 2; // Rough character size in bytes
    }
    return usage;
  }

  private enforceMaxEntries(): void {
    if (this.memoryCache.size <= this.config.maxEntries) return;

    // Remove oldest entries first
    const entries = Array.from(this.memoryCache.entries()).sort(
      ([, a], [, b]) => a.timestamp - b.timestamp,
    );

    const toDelete = entries.slice(0, this.memoryCache.size - this.config.maxEntries);
    toDelete.forEach(([key]) => this.memoryCache.delete(key));
  }

  private startCleanupTimer(): void {
    if (typeof window === 'undefined') return; // Skip in SSR

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private setupStorageListener(): void {
    window.addEventListener('storage', (event) => {
      if (!event.key?.startsWith(this.storageKeyPrefix)) return;

      const key = event.key.replace(this.storageKeyPrefix, '');

      if (event.newValue === null) {
        // Entry was deleted
        this.memoryCache.delete(key);
      } else {
        try {
          const parsed = JSON.parse(event.newValue) as CacheEntry<T>;

          // Hydrate date fields for the storage listener
          const timestampDate = safeDateConversion(parsed.timestamp) || new Date();
          const expiresAtDate =
            safeDateConversion(parsed.expiresAt) || new Date(Date.now() + this.config.defaultTtl);

          const entry = {
            ...parsed,
            timestamp: timestampDate.getTime(),
            expiresAt: expiresAtDate.getTime(),
          };

          // Hydrate any date fields in the cached data itself
          if (entry.data && typeof entry.data === 'object') {
            entry.data = hydrateCacheEntry(entry.data as unknown as CacheEntryWithDates) as T;
          }

          if (!this.isExpired(entry)) {
            this.memoryCache.set(key, entry);
          }
        } catch {
          // Ignore invalid JSON
        }
      }

      this.updateStats();
    });
  }

  private loadFromStorage(): void {
    if (!this.config.persistent || typeof window === 'undefined') return;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.storageKeyPrefix)) {
          const cacheKey = key.replace(this.storageKeyPrefix, '');
          const entry = this.getFromStorage(cacheKey);

          if (entry && !this.isExpired(entry)) {
            this.memoryCache.set(cacheKey, entry);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }

  private getFromStorage(key: string): CacheEntry<T> | null {
    if (!this.config.persistent || typeof window === 'undefined') return null;

    try {
      const item = localStorage.getItem(this.storageKeyPrefix + key);
      if (!item) return null;

      const parsed = JSON.parse(item) as CacheEntry<T>;

      // Hydrate date fields that were serialized as strings
      const timestampDate = safeDateConversion(parsed.timestamp) || new Date();
      const expiresAtDate =
        safeDateConversion(parsed.expiresAt) || new Date(Date.now() + this.config.defaultTtl);

      const hydratedEntry = {
        ...parsed,
        timestamp: timestampDate.getTime(),
        expiresAt: expiresAtDate.getTime(),
      };

      // Hydrate any date fields in the cached data itself
      if (hydratedEntry.data && typeof hydratedEntry.data === 'object') {
        hydratedEntry.data = hydrateCacheEntry(
          hydratedEntry.data as unknown as CacheEntryWithDates,
        ) as T;
      }

      return hydratedEntry;
    } catch (error) {
      console.warn('Failed to parse cache entry from localStorage:', error);
      return null;
    }
  }

  private setToStorage(key: string, entry: CacheEntry<T>): void {
    if (!this.config.persistent || typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.storageKeyPrefix + key, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  private deleteFromStorage(key: string): void {
    if (!this.config.persistent || typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.storageKeyPrefix + key);
    } catch (error) {
      console.warn('Failed to delete cache from localStorage:', error);
    }
  }

  private clearStorage(): void {
    if (!this.config.persistent || typeof window === 'undefined') return;

    try {
      const keysToDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.storageKeyPrefix)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear cache from localStorage:', error);
    }
  }

  private cleanupStorage(): number {
    if (!this.config.persistent || typeof window === 'undefined') return 0;

    let cleanedCount = 0;
    try {
      const keysToDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.storageKeyPrefix)) {
          const entry = this.getFromStorage(key.replace(this.storageKeyPrefix, ''));
          if (!entry || this.isExpired(entry)) {
            keysToDelete.push(key);
          }
        }
      }
      keysToDelete.forEach((key) => localStorage.removeItem(key));
      cleanedCount = keysToDelete.length;
    } catch (error) {
      console.warn('Failed to cleanup storage:', error);
    }

    return cleanedCount;
  }

  private emitStorageEvent(type: CacheStorageEvent['type'], key?: string, data?: unknown): void {
    if (typeof window === 'undefined') return;

    const event: CacheStorageEvent = {
      type,
      key,
      data,
      timestamp: Date.now(),
      source: 'memory',
    };

    // Custom event for in-tab communication
    window.dispatchEvent(new CustomEvent('cache-storage-event', { detail: event }));
  }

  // Cache strategy implementations

  private async cacheFirstStrategy<R>(
    fetcher: () => Promise<R>,
    key: string,
    options: CacheOptions,
  ): Promise<R> {
    const cached = this.get(key) as CacheEntry<R> | null;
    if (cached) {
      return cached.data;
    }

    const data = await fetcher();
    this.set(key, data as T, options);
    return data;
  }

  private async networkFirstStrategy<R>(
    fetcher: () => Promise<R>,
    key: string,
    options: CacheOptions,
  ): Promise<R> {
    try {
      const data = await fetcher();
      this.set(key, data as T, options);
      return data;
    } catch (error) {
      const cached = this.get(key) as CacheEntry<R> | null;
      if (cached) {
        return cached.data;
      }
      throw error;
    }
  }

  private async cacheOnlyStrategy<R>(key: string): Promise<R> {
    const cached = this.get(key) as CacheEntry<R> | null;
    if (!cached) {
      throw new ApiCacheError('Cache miss - no data available', 'CACHE_MISS');
    }
    return cached.data;
  }

  private async networkOnlyStrategy<R>(
    fetcher: () => Promise<R>,
    key: string,
    options: CacheOptions,
  ): Promise<R> {
    const data = await fetcher();
    this.set(key, data as T, options);
    return data;
  }

  /**
   * Cleanup resources when cache is destroyed
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
}

// Export a singleton instance for Bitcoin price caching
export const bitcoinPriceCache = new ApiCache<number>({
  defaultTtl: parseInt(import.meta.env.VITE_BITCOIN_PRICE_CACHE_TTL || '300000'), // 5 minutes
  maxEntries: 50,
  persistent: true,
  apiBaseUrl: 'https://api.coingecko.com/api/v3',
});

export { ApiCache };
export type { CacheEntry, CacheOptions, CacheStats };
