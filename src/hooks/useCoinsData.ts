import { useState, useEffect, useCallback } from 'react';
import { fetchMarketData } from '../utils/api';
import { calculateChannelDistances } from '../utils/regression';

interface CoinData {
  symbol: string;
  price: number;
  volume24h: number;
  distanceToLower: number;
  distanceToUpper: number;
}

export const useCoinsData = () => {
  const [data, setData] = useState<CoinData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const marketData = await fetchMarketData();
      const coinsData: CoinData[] = [];

      for (const coin of marketData) {
        if (coin.symbol.endsWith('USDT') && coin.volume24h * coin.lastPrice > 10000000) {
          const distances = await calculateChannelDistances(coin.symbol);
          coinsData.push({
            symbol: coin.symbol,
            price: parseFloat(coin.lastPrice),
            volume24h: parseFloat(coin.volume24h) * parseFloat(coin.lastPrice),
            distanceToLower: distances.toLower,
            distanceToUpper: distances.toUpper,
          });
        }
      }

      setData(coinsData.sort((a, b) => b.volume24h - a.volume24h));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout;

    const initFetch = async () => {
      if (!mounted) return;
      await fetchData();
      
      intervalId = setInterval(async () => {
        if (mounted) {
          await fetchData();
        }
      }, 15000);
    };

    initFetch();

    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchData]);

  return { data, isLoading, error, refetch };
};