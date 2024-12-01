import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, LineStyle } from 'lightweight-charts';
import { useChartData } from '../hooks/useChartData';
import { LoadingSpinner } from './LoadingSpinner';
import { AlertTriangle } from 'lucide-react';
import { calculateLinearRegression, generateRegressionChannelData } from '../utils/regression';
import { CandlestickData } from '../types/chart';

interface CryptoChartProps {
  symbol: string;
  interval: string;
}

export const CryptoChart: React.FC<CryptoChartProps> = ({ symbol, interval }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, error, refetch } = useChartData(symbol, interval);

  useEffect(() => {
    if (!chartContainerRef.current || !data.length) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: number) => {
          const date = new Date(time * 1000);
          // First convert to UTC, then add 1 hour for UTC+1
          const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
          const utcPlus1Date = new Date(utcDate.getTime() + 3600000);
          return utcPlus1Date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
          });
        },
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    candlestickSeries.setData(data);

    // Calculate regression data
    const regressionData = data.map((d: CandlestickData) => ({
      time: d.time,
      value: (d.high + d.low) / 2,
    }));

    const regression = calculateLinearRegression(regressionData);
    const channels = generateRegressionChannelData(regressionData, regression);

    // Add regression lines without titles
    const middleLine = chart.addLineSeries({
      color: '#2962FF',
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
    });

    const upperLine = chart.addLineSeries({
      color: '#26a69a', // Green color for upper channel
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
    });

    const lowerLine = chart.addLineSeries({
      color: '#ef5350', // Red color for lower channel
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
    });

    middleLine.setData(channels.middle);
    upperLine.setData(channels.upper);
    lowerLine.setData(channels.lower);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] bg-red-50 rounded-lg p-4">
        <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
        <p className="text-red-600 text-center mb-4">{error.message}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return <div ref={chartContainerRef} className="w-full h-[400px]" />;
};