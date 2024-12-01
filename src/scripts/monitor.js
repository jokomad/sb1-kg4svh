import TelegramBot from 'node-telegram-bot-api';
import { createCanvas } from 'canvas';
import { createChart } from 'lightweight-charts';
import { TELEGRAM_CONFIG } from '../config/telegram.config.js';
import { API_CONFIG } from '../config/api.config.js';
import { fetchKlineData } from '../utils/api.js';
import { calculateLinearRegression, generateRegressionChannelData } from '../utils/regression.js';

const bot = new TelegramBot(TELEGRAM_CONFIG.BOT_TOKEN, { polling: false });

async function getAllUSDTPairs() {
  const response = await fetch(`${API_CONFIG.BASE_URL}/market/tickers?category=linear`);
  const data = await response.json();
  return data.result.list
    .filter(ticker => 
      ticker.symbol.endsWith('USDT') && 
      parseFloat(ticker.volume24h) * parseFloat(ticker.lastPrice) > 10000000
    )
    .map(ticker => ticker.symbol);
}

async function generateChartImage(symbol, klineData) {
  const canvas = createCanvas(800, 400);
  const chart = createChart(canvas, {
    width: 800,
    height: 400,
    layout: { background: { color: '#ffffff' } },
  });

  const candlestickSeries = chart.addCandlestickSeries();
  candlestickSeries.setData(klineData);

  const regressionData = klineData.map(d => ({
    time: d.time,
    value: (d.high + d.low) / 2,
  }));

  const regression = calculateLinearRegression(regressionData);
  const channels = generateRegressionChannelData(regressionData, regression);

  const lowerLine = chart.addLineSeries({
    color: '#ef5350',
    lineWidth: 1,
    lineStyle: 2,
  });

  lowerLine.setData(channels.lower);

  return canvas.toBuffer();
}

async function checkPriceAndAlert(symbol) {
  try {
    const klineData = await fetchKlineData(symbol, '15');
    if (klineData.length < 2) return;

    const currentPrice = klineData[klineData.length - 1].close;
    const regressionData = klineData.map(d => ({
      time: d.time,
      value: (d.high + d.low) / 2,
    }));

    const regression = calculateLinearRegression(regressionData);
    const channels = generateRegressionChannelData(regressionData, regression);
    const lowerChannel = channels.lower[channels.lower.length - 1].value;

    const previousPrice = klineData[klineData.length - 2].close;
    const previousLowerChannel = channels.lower[channels.lower.length - 2].value;

    if (previousPrice < previousLowerChannel && currentPrice > lowerChannel) {
      const chartImage = await generateChartImage(symbol, klineData);
      const tradingViewUrl = `https://www.tradingview.com/chart/fXAbfBjQ/?symbol=BYBIT:${symbol}.P`;
      
      await bot.sendPhoto(TELEGRAM_CONFIG.CHAT_ID, chartImage, {
        caption: `🚨 ${symbol} crossed above lower regression channel!\n\nTrading View Chart: ${tradingViewUrl}`,
      });
    }
  } catch (error) {
    console.error(`Error processing ${symbol}:`, error);
  }
}

async function startMonitoring() {
  console.log('Starting monitoring system...');
  
  setInterval(async () => {
    try {
      const pairs = await getAllUSDTPairs();
      console.log(`Monitoring ${pairs.length} pairs...`);
      
      await Promise.all(pairs.map(symbol => checkPriceAndAlert(symbol)));
    } catch (error) {
      console.error('Error in monitoring loop:', error);
    }
  }, 60000); // Run every 60 seconds
}

startMonitoring().catch(console.error);