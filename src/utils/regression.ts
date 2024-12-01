export interface RegressionPoint {
  time: number;
  value: number;
}

export function calculateLinearRegression(data: RegressionPoint[]): {
  slope: number;
  intercept: number;
  standardDeviation: number;
} {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: 0, standardDeviation: 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  // Normalize timestamps to prevent numerical issues
  const firstTime = data[0].time;
  const normalizedData = data.map((point, index) => ({
    x: index,
    y: point.value,
  }));

  for (const point of normalizedData) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumXX += point.x * point.x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  let sumSquaredResiduals = 0;
  for (const point of normalizedData) {
    const predicted = slope * point.x + intercept;
    const residual = point.y - predicted;
    sumSquaredResiduals += residual * residual;
  }
  const standardDeviation = Math.sqrt(sumSquaredResiduals / n);

  return { slope, intercept, standardDeviation };
}

export function generateRegressionChannelData(
  data: RegressionPoint[],
  regression: { slope: number; intercept: number; standardDeviation: number }
): {
  middle: RegressionPoint[];
  upper: RegressionPoint[];
  lower: RegressionPoint[];
} {
  const { slope, intercept, standardDeviation } = regression;
  const channelData = {
    middle: [] as RegressionPoint[],
    upper: [] as RegressionPoint[],
    lower: [] as RegressionPoint[],
  };

  data.forEach((point, i) => {
    const predicted = slope * i + intercept;
    channelData.middle.push({ time: point.time, value: predicted });
    channelData.upper.push({ time: point.time, value: predicted + 2 * standardDeviation });
    channelData.lower.push({ time: point.time, value: predicted - 2 * standardDeviation });
  });

  return channelData;
}

export async function calculateChannelDistances(symbol: string) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/market/kline?category=linear&symbol=${symbol}&interval=15&limit=100`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    if (data.retCode !== 0) throw new Error(`API error: ${data.retMsg}`);

    const klineData = data.result.list
      .map((item: string[]) => ({
        time: parseInt(item[0], 10) / 1000,
        value: (parseFloat(item[2]) + parseFloat(item[3])) / 2, // (high + low) / 2
      }))
      .sort((a, b) => a.time - b.time); // Ensure proper time ordering

    if (klineData.length < 2) {
      throw new Error('Insufficient data points for regression analysis');
    }

    const regression = calculateLinearRegression(klineData);
    const channels = generateRegressionChannelData(klineData, regression);
    
    const currentPrice = klineData[klineData.length - 1].value;
    const lowerChannel = channels.lower[channels.lower.length - 1].value;
    const upperChannel = channels.upper[channels.upper.length - 1].value;

    return {
      toLower: ((currentPrice - lowerChannel) / currentPrice) * 100,
      toUpper: ((upperChannel - currentPrice) / currentPrice) * 100,
    };
  } catch (error) {
    console.error(`Error calculating channel distances for ${symbol}:`, error);
    throw error;
  }
}