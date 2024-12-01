import { API_CONFIG } from '../config/api.config';
import { CandlestickData } from '../types/chart';

interface BybitResponse {
  retCode: number;
  retMsg: string;
  result: {
    list: any[];
  };
}

export async function fetchKlineData(
  symbol: string,
  interval: string
): Promise<CandlestickData[]> {
  try {
    const params = new URLSearchParams({
      category: 'linear',
      symbol,
      interval,
      limit: '100',
    });

    const response = await fetch(
      `${API_CONFIG.BASE_URL}/market/kline?${params}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: BybitResponse = await response.json();

    if (data.retCode !== 0) {
      throw new Error(`API error: ${data.retMsg}`);
    }

    // Ensure the data is properly sorted by timestamp
    const processedData = data.result.list
      .map((item: string[]) => ({
        time: parseInt(item[0], 10) / 1000,
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
      }))
      .sort((a, b) => a.time - b.time); // Sort by timestamp ascending

    return processedData;
  } catch (error) {
    console.error('Error fetching kline data:', error);
    throw error;
  }
}

export async function fetchMarketData() {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/market/tickers?category=linear`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: BybitResponse = await response.json();

    if (data.retCode !== 0) {
      throw new Error(`API error: ${data.retMsg}`);
    }

    return data.result.list.filter(item => 
      item.symbol.endsWith('USDT') && 
      parseFloat(item.volume24h) * parseFloat(item.lastPrice) > 10000000
    );
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw error;
  }
}