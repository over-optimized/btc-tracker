import { useEffect, useState, useCallback, useRef } from 'react';
import {
  fetchBitcoinPriceWithMetadata,
  getBitcoinPriceCacheStats,
  clearBitcoinPriceCache,
} from '../apis/fetchBitcoinPrice';
import { CacheStats, ApiCacheError } from '../types/ApiCache';

interface BitcoinPriceResult {
  currentPrice: number | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  cached: boolean;
  source: 'cache' | 'api' | 'sharedWorker' | null;
  rateLimitInfo?: {
    remaining: number;
    resetTime: number;
    isLimited: boolean;
  };
  cacheStats: CacheStats;
  // Utility functions
  forceRefresh: () => Promise<void>;
  clearCache: () => void;
}

interface UseBitcoinPriceOptions {
  /** Refresh interval in milliseconds (default: 5 minutes for cache-aware polling) */
  refreshIntervalMs?: number;
  /** Force refresh on component mount */
  forceInitialRefresh?: boolean;
  /** Cache strategy to use */
  strategy?: 'cache-first' | 'network-first' | 'cache-only' | 'network-only';
  /** Whether to use SharedWorker for cross-tab coordination */
  useSharedWorker?: boolean;
}

export const useBitcoinPrice = (options: UseBitcoinPriceOptions = {}): BitcoinPriceResult => {
  const {
    refreshIntervalMs = 300000, // 5 minutes default (cache-aware)
    forceInitialRefresh = false,
    strategy = 'cache-first',
    useSharedWorker = true,
  } = options;

  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [cached, setCached] = useState(false);
  const [source, setSource] = useState<'cache' | 'api' | 'sharedWorker' | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<BitcoinPriceResult['rateLimitInfo']>();
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    hits: 0,
    misses: 0,
    errors: 0,
    size: 0,
  });

  // Use ref to track if component is mounted
  const mounted = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const updateCacheStats = useCallback(() => {
    setCacheStats(getBitcoinPriceCacheStats());
  }, []);

  const fetchPrice = useCallback(
    async (forceRefresh = false) => {
      if (!mounted.current) return;

      try {
        setError(null);

        const result = await fetchBitcoinPriceWithMetadata({
          forceRefresh,
          strategy,
          useSharedWorker,
        });

        if (!mounted.current) return;

        setCurrentPrice(result.price);
        setLastUpdated(result.timestamp);
        setCached(result.cached);
        setSource(result.source);
        setRateLimitInfo(result.rateLimitInfo);
        updateCacheStats();
      } catch (err) {
        if (!mounted.current) return;

        // Handle specific error types
        if (err instanceof ApiCacheError) {
          switch (err.code) {
            case 'RATE_LIMITED':
              setError(
                `Rate limited. ${err.details?.retryAfter ? `Try again in ${err.details.retryAfter} seconds.` : 'Please wait before retrying.'}`,
              );
              setRateLimitInfo(err.details?.rateLimitInfo);
              break;
            case 'NETWORK_ERROR':
              setError(`Network error: ${err.message}`);
              break;
            case 'CACHE_MISS':
              setError('No cached data available');
              break;
            default:
              setError(err.message);
          }
        } else {
          setError(err instanceof Error ? err.message : 'Failed to fetch Bitcoin price');
        }

        updateCacheStats();
      } finally {
        if (mounted.current) {
          setLoading(false);
        }
      }
    },
    [strategy, useSharedWorker, updateCacheStats],
  );

  // Force refresh function for external use
  const forceRefresh = useCallback(() => {
    setLoading(true);
    return fetchPrice(true);
  }, [fetchPrice]);

  // Clear cache function for external use
  const clearCache = useCallback(() => {
    clearBitcoinPriceCache();
    updateCacheStats();
  }, [updateCacheStats]);

  useEffect(() => {
    mounted.current = true;

    // Initial fetch
    fetchPrice(forceInitialRefresh);

    // Set up polling interval - much longer now due to caching
    intervalRef.current = setInterval(() => {
      if (mounted.current) {
        fetchPrice(false);
      }
    }, refreshIntervalMs);

    return () => {
      mounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchPrice, forceInitialRefresh, refreshIntervalMs]);

  return {
    currentPrice,
    loading,
    error,
    lastUpdated,
    cached,
    source,
    rateLimitInfo,
    cacheStats,
    // Utility functions
    forceRefresh,
    clearCache,
  };
};

/**
 * Legacy compatibility hook that maintains the old simple interface
 * @deprecated Use useBitcoinPrice with options instead
 */
export const useBitcoinPriceSimple = (refreshIntervalMs: number = 300000) => {
  const result = useBitcoinPrice({ refreshIntervalMs });

  // Return only the legacy fields
  return {
    currentPrice: result.currentPrice,
    loading: result.loading,
    error: result.error,
    lastUpdated: result.lastUpdated,
  };
};
