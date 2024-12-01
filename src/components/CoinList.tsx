import React from 'react';
import { useCoinsData } from '../hooks/useCoinsData';
import { LoadingSpinner } from './LoadingSpinner';
import { AlertTriangle, ArrowUpCircle, ArrowDownCircle, RefreshCw } from 'lucide-react';

export const CoinList: React.FC = () => {
  const { data, isLoading, error, refetch } = useCoinsData();

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

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-end mb-4">
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Symbol
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              24h Volume
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Distance to Lower Channel
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Distance to Upper Channel
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((coin) => (
            <tr key={coin.symbol} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{coin.symbol}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">${coin.price.toFixed(4)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">${(coin.volume24h / 1000000).toFixed(2)}M</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <ArrowDownCircle className={`w-4 h-4 mr-2 ${coin.distanceToLower < 0 ? 'text-red-500' : 'text-green-500'}`} />
                  <span className="text-sm text-gray-900">{Math.abs(coin.distanceToLower).toFixed(2)}%</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <ArrowUpCircle className={`w-4 h-4 mr-2 ${coin.distanceToUpper < 0 ? 'text-red-500' : 'text-green-500'}`} />
                  <span className="text-sm text-gray-900">{Math.abs(coin.distanceToUpper).toFixed(2)}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};