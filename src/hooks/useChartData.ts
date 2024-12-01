import { useState, useEffect, useCallback } from 'react';
import { CandlestickData } from '../types/chart';
import { fetchKlineData } from '../utils/api';

export const useChartData = (symbol: string, interval: string) => {
  const [data, setData] = useState<CandlestickData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const klineData = await fetchKlineData(symbol, interval);
      setData(klineData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
    } finally {
      setIsLoading(false);
    }
  }, [symbol, interval]);

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