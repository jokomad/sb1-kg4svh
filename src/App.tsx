import React from 'react';
import { CoinList } from './components/CoinList';
import { LineChart } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <LineChart className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-800">Bybit USDT Pairs Analysis</h1>
          </div>
          
          <div className="bg-white rounded-lg overflow-hidden">
            <CoinList />
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>Data updates every 15 seconds • Volume greater than $10M • Powered by Bybit API</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;