import { useEffect, useState } from 'react';
import { fetchBitcoinPrice } from '../apis/fetchBitcoinPrice';

interface BitcoinPriceResult {
  currentPrice: number | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const useBitcoinPrice = (refreshIntervalMs: number = 30000): BitcoinPriceResult => {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrice = async () => {
    try {
      setError(null);
      const price = await fetchBitcoinPrice();
      setCurrentPrice(price);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Bitcoin price');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchPrice();

    // Set up polling interval
    const interval = setInterval(fetchPrice, refreshIntervalMs);

    return () => clearInterval(interval);
  }, [refreshIntervalMs]);

  return {
    currentPrice,
    loading,
    error,
    lastUpdated,
  };
};