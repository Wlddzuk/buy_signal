import type {
  KlineData,
  EMAData,
  VWAPData,
  MACDData,
  SupplyDemandZone,
  EMABounceSignal,
  SupplyDemandSignal,
  TradingSignal,
  Exchange,
  TradingType,
  Timeframe
} from '../types/exchange';

// Technical Analysis Calculations

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): number[] {
  if (data.length < period) return [];
  
  const multiplier = 2 / (period + 1);
  const ema: number[] = [];
  
  // First EMA is SMA
  const sma = data.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
  ema.push(sma);
  
  // Calculate subsequent EMAs
  for (let i = period; i < data.length; i++) {
    const currentEMA = (data[i] * multiplier) + (ema[ema.length - 1] * (1 - multiplier));
    ema.push(currentEMA);
  }
  
  return ema;
}

/**
 * Calculate VWAP (Volume Weighted Average Price)
 */
export function calculateVWAP(klineData: KlineData[]): VWAPData[] {
  const vwapData: VWAPData[] = [];
  let cumulativeTPV = 0; // Typical Price * Volume
  let cumulativeVolume = 0;
  
  for (const candle of klineData) {
    const high = parseFloat(candle.high);
    const low = parseFloat(candle.low);
    const close = parseFloat(candle.close);
    const volume = parseFloat(candle.volume);
    
    const typicalPrice = (high + low + close) / 3;
    const tpv = typicalPrice * volume;
    
    cumulativeTPV += tpv;
    cumulativeVolume += volume;
    
    const vwap = cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : typicalPrice;
    
    vwapData.push({
      timestamp: candle.closeTime,
      vwap,
      volume
    });
  }
  
  return vwapData;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(
  prices: number[], 
  fastPeriod: number = 12, 
  slowPeriod: number = 26, 
  signalPeriod: number = 9
): MACDData[] {
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  
  if (fastEMA.length === 0 || slowEMA.length === 0) return [];
  
  // Calculate MACD line
  const macdLine: number[] = [];
  const startIndex = slowPeriod - fastPeriod;
  
  for (let i = 0; i < slowEMA.length; i++) {
    macdLine.push(fastEMA[i + startIndex] - slowEMA[i]);
  }
  
  // Calculate signal line (EMA of MACD)
  const signalLine = calculateEMA(macdLine, signalPeriod);
  
  const macdData: MACDData[] = [];
  const signalStartIndex = macdLine.length - signalLine.length;
  
  for (let i = 0; i < signalLine.length; i++) {
    const macdIndex = i + signalStartIndex;
    macdData.push({
      timestamp: Date.now() - (signalLine.length - i - 1) * 60000, // Approximate timestamp
      macd: macdLine[macdIndex],
      signal: signalLine[i],
      histogram: macdLine[macdIndex] - signalLine[i]
    });
  }
  
  return macdData;
}

/**
 * Detect Supply and Demand Zones based on the strategy from PDF
 */
export function detectSupplyDemandZones(klineData: KlineData[]): SupplyDemandZone[] {
  const zones: SupplyDemandZone[] = [];
  
  if (klineData.length < 10) return zones;
  
  for (let i = 2; i < klineData.length - 2; i++) {
    const current = klineData[i];\n    const prev = klineData[i - 1];\n    const next = klineData[i + 1];\n    const prev2 = klineData[i - 2];\n    const next2 = klineData[i + 1];\n    \n    // Convert price strings to numbers\n    const currentHigh = parseFloat(current.high);\n    const currentLow = parseFloat(current.low);\n    const currentOpen = parseFloat(current.open);\n    const currentClose = parseFloat(current.close);\n    \n    const prevHigh = parseFloat(prev.high);\n    const prevLow = parseFloat(prev.low);\n    const prevClose = parseFloat(prev.close);\n    \n    const nextHigh = parseFloat(next.high);\n    const nextLow = parseFloat(next.low);\n    \n    // Detect Bullish Engulfing (Strong Demand Zone)\n    if (prevClose < currentOpen && currentClose > prevHigh) {\n      zones.push({\n        type: 'demand',\n        high: currentHigh,\n        low: Math.min(currentLow, prevLow),\n        timestamp: current.closeTime,\n        strength: 'strong',\n        zoneType: 'DBR', // Drop-Base-Rally reversal pattern\n        isValid: true\n      });\n    }\n    \n    // Detect Bearish Engulfing (Strong Supply Zone)\n    if (prevClose > currentOpen && currentClose < prevLow) {\n      zones.push({\n        type: 'supply',\n        high: Math.max(currentHigh, prevHigh),\n        low: currentLow,\n        timestamp: current.closeTime,\n        strength: 'strong',\n        zoneType: 'RBD', // Rally-Base-Drop reversal pattern\n        isValid: true\n      });\n    }\n    \n    // Detect Pin Bar patterns\n    const bodySize = Math.abs(currentClose - currentOpen);\n    const upperWick = currentHigh - Math.max(currentOpen, currentClose);\n    const lowerWick = Math.min(currentOpen, currentClose) - currentLow;\n    const totalRange = currentHigh - currentLow;\n    \n    // Bullish Pin Bar (Demand Zone)\n    if (lowerWick > bodySize * 2 && lowerWick > upperWick * 2 && totalRange > 0) {\n      zones.push({\n        type: 'demand',\n        high: Math.max(currentOpen, currentClose),\n        low: currentLow,\n        timestamp: current.closeTime,\n        strength: lowerWick > bodySize * 3 ? 'strong' : 'medium',\n        zoneType: 'DBR',\n        isValid: true\n      });\n    }\n    \n    // Bearish Pin Bar (Supply Zone)\n    if (upperWick > bodySize * 2 && upperWick > lowerWick * 2 && totalRange > 0) {\n      zones.push({\n        type: 'supply',\n        high: currentHigh,\n        low: Math.min(currentOpen, currentClose),\n        timestamp: current.closeTime,\n        strength: upperWick > bodySize * 3 ? 'strong' : 'medium',\n        zoneType: 'RBD',\n        isValid: true\n      });\n    }\n  }\n  \n  // Remove overlapping zones and keep the strongest\n  return consolidateZones(zones);\n}\n\n/**\n * Consolidate overlapping zones and keep the strongest ones\n */\nfunction consolidateZones(zones: SupplyDemandZone[]): SupplyDemandZone[] {\n  const consolidated: SupplyDemandZone[] = [];\n  \n  for (const zone of zones) {\n    let shouldAdd = true;\n    \n    for (let i = consolidated.length - 1; i >= 0; i--) {\n      const existingZone = consolidated[i];\n      \n      // Check if zones overlap\n      const overlap = (\n        zone.type === existingZone.type &&\n        ((zone.low <= existingZone.high && zone.high >= existingZone.low))\n      );\n      \n      if (overlap) {\n        // Keep the stronger zone\n        const zoneStrength = getZoneStrengthValue(zone.strength);\n        const existingStrength = getZoneStrengthValue(existingZone.strength);\n        \n        if (zoneStrength > existingStrength) {\n          consolidated[i] = zone;\n        }\n        shouldAdd = false;\n        break;\n      }\n    }\n    \n    if (shouldAdd) {\n      consolidated.push(zone);\n    }\n  }\n  \n  return consolidated.slice(-20); // Keep only the 20 most recent zones\n}\n\nfunction getZoneStrengthValue(strength: 'weak' | 'medium' | 'strong'): number {\n  return { weak: 1, medium: 2, strong: 3 }[strength];\n}\n\n/**\n * EMA Bounce Strategy Implementation\n */\nexport function detectEMABounceSignal(\n  klineData: KlineData[],\n  vwapData: VWAPData[],\n  fastLen: number = 9,\n  medLen: number = 20,\n  slowLen: number = 200,\n  macdFast: number = 12,\n  macdSlow: number = 26,\n  macdSig: number = 9,\n  tolPct: number = 0.05,\n  maxWait: number = 30\n): EMABounceSignal[] {\n  if (klineData.length < slowLen) return [];\n  \n  const closePrices = klineData.map(k => parseFloat(k.close));\n  const lowPrices = klineData.map(k => parseFloat(k.low));\n  \n  const ema9 = calculateEMA(closePrices, fastLen);\n  const ema20 = calculateEMA(closePrices, medLen);\n  const ema200 = calculateEMA(closePrices, slowLen);\n  const macdData = calculateMACD(closePrices, macdFast, macdSlow, macdSig);\n  \n  const signals: EMABounceSignal[] = [];\n  \n  // We need to align all arrays to the same length\n  const minLength = Math.min(ema200.length, macdData.length, vwapData.length);\n  const startIndex = klineData.length - minLength;\n  \n  let waitBounce = false;\n  let barsWaited = 0;\n  \n  for (let i = 1; i < minLength; i++) {\n    const currentIndex = startIndex + i;\n    const prevIndex = startIndex + i - 1;\n    \n    const current = klineData[currentIndex];\n    const currentClose = parseFloat(current.close);\n    const currentLow = parseFloat(current.low);\n    \n    const currentEma9 = ema9[ema9.length - minLength + i];\n    const currentEma20 = ema20[ema20.length - minLength + i];\n    const currentEma200 = ema200[i];\n    const prevEma9 = ema9[ema9.length - minLength + i - 1];\n    const prevEma20 = ema20[ema20.length - minLength + i - 1];\n    \n    const currentVwap = vwapData[vwapData.length - minLength + i]?.vwap || 0;\n    const currentMacd = macdData[i];\n    \n    // Check bullish stack alignment\n    const bullStack = currentEma9 > currentEma20 && currentEma20 > currentEma200;\n    \n    // Check for EMA cross (fast crossing above medium, both above slow)\n    const emaCrossUp = prevEma9 <= prevEma20 && currentEma9 > currentEma20 && currentEma9 > currentEma200;\n    \n    // Bounce definition\n    const tolPrice = currentEma9 * (1 + tolPct / 100);\n    const bounce = currentLow <= tolPrice && currentClose > currentEma9;\n    \n    // Filters\n    const priceAboveVWAP = currentClose > currentVwap;\n    const macdBull = currentMacd.macd > currentMacd.signal;\n    \n    // State machine logic\n    if (emaCrossUp) {\n      waitBounce = true;\n      barsWaited = 0;\n    } else if (waitBounce) {\n      barsWaited++;\n    }\n    \n    // Abort waiting if conditions break\n    if (!bullStack || (maxWait > 0 && barsWaited > maxWait)) {\n      waitBounce = false;\n      barsWaited = 0;\n    }\n    \n    // Generate buy signal\n    const buySignal = waitBounce && bounce && priceAboveVWAP && macdBull;\n    \n    if (buySignal) {\n      const confidence = calculateSignalConfidence({\n        bullStack,\n        priceAboveVWAP,\n        macdBull,\n        bounceQuality: (tolPrice - currentLow) / tolPrice,\n        volumeConfirmation: parseFloat(current.volume) > 0\n      });\n      \n      signals.push({\n        timestamp: current.closeTime,\n        type: 'buy',\n        price: currentClose,\n        ema9: currentEma9,\n        ema20: currentEma20,\n        ema200: currentEma200,\n        vwap: currentVwap,\n        macdLine: currentMacd.macd,\n        macdSignal: currentMacd.signal,\n        bullishStack: bullStack,\n        priceAboveVWAP,\n        macdBullish: macdBull,\n        bounceConfirmed: bounce,\n        confidence\n      });\n      \n      waitBounce = false;\n      barsWaited = 0;\n    }\n  }\n  \n  return signals;\n}\n\nfunction calculateSignalConfidence(factors: {\n  bullStack: boolean;\n  priceAboveVWAP: boolean;\n  macdBull: boolean;\n  bounceQuality: number;\n  volumeConfirmation: boolean;\n}): number {\n  let confidence = 0;\n  \n  if (factors.bullStack) confidence += 25;\n  if (factors.priceAboveVWAP) confidence += 20;\n  if (factors.macdBull) confidence += 20;\n  if (factors.volumeConfirmation) confidence += 15;\n  \n  // Bounce quality (closer to EMA9 = higher confidence)\n  confidence += Math.max(0, 20 - (factors.bounceQuality * 100));\n  \n  return Math.min(100, Math.max(0, confidence));\n}\n\n/**\n * Supply & Demand Strategy Signal Detection\n */\nexport function detectSupplyDemandSignals(\n  klineData: KlineData[],\n  zones: SupplyDemandZone[]\n): SupplyDemandSignal[] {\n  const signals: SupplyDemandSignal[] = [];\n  \n  if (klineData.length === 0 || zones.length === 0) return signals;\n  \n  const recentCandles = klineData.slice(-50); // Check last 50 candles\n  \n  for (const candle of recentCandles) {\n    const currentPrice = parseFloat(candle.close);\n    const currentLow = parseFloat(candle.low);\n    const currentHigh = parseFloat(candle.high);\n    \n    for (const zone of zones) {\n      if (!zone.isValid) continue;\n      \n      // Check if price is interacting with zone\n      const priceInZone = currentLow <= zone.high && currentHigh >= zone.low;\n      \n      if (priceInZone) {\n        if (zone.type === 'demand' && currentPrice > zone.low) {\n          // Buy signal from demand zone\n          const stopLoss = zone.low * 0.99; // 1% below zone\n          const takeProfit = zone.high + (zone.high - zone.low) * 2; // 2:1 R:R\n          const riskReward = (takeProfit - currentPrice) / (currentPrice - stopLoss);\n          \n          signals.push({\n            timestamp: candle.closeTime,\n            type: 'buy',\n            price: currentPrice,\n            zone,\n            entryReason: `Price bounced from ${zone.zoneType} demand zone`,\n            stopLoss,\n            takeProfit,\n            riskReward,\n            confidence: getZoneConfidence(zone)\n          });\n        } else if (zone.type === 'supply' && currentPrice < zone.high) {\n          // Sell signal from supply zone\n          const stopLoss = zone.high * 1.01; // 1% above zone\n          const takeProfit = zone.low - (zone.high - zone.low) * 2; // 2:1 R:R\n          const riskReward = (currentPrice - takeProfit) / (stopLoss - currentPrice);\n          \n          signals.push({\n            timestamp: candle.closeTime,\n            type: 'sell',\n            price: currentPrice,\n            zone,\n            entryReason: `Price rejected from ${zone.zoneType} supply zone`,\n            stopLoss,\n            takeProfit,\n            riskReward,\n            confidence: getZoneConfidence(zone)\n          });\n        }\n      }\n    }\n  }\n  \n  return signals;\n}\n\nfunction getZoneConfidence(zone: SupplyDemandZone): number {\n  let confidence = 50; // Base confidence\n  \n  // Zone strength factor\n  if (zone.strength === 'strong') confidence += 30;\n  else if (zone.strength === 'medium') confidence += 15;\n  \n  // Zone type factor (reversals are stronger)\n  if (zone.zoneType === 'DBR' || zone.zoneType === 'RBD') confidence += 20;\n  \n  return Math.min(100, confidence);\n}\n\n/**\n * Main Technical Analysis Service\n */\nexport class TechnicalAnalysisService {\n  static analyzeData(\n    exchange: Exchange,\n    tradingType: TradingType,\n    symbol: string,\n    timeframe: Timeframe,\n    klineData: KlineData[]\n  ): {\n    emaData: EMAData[];\n    vwapData: VWAPData[];\n    macdData: MACDData[];\n    supplyDemandZones: SupplyDemandZone[];\n    emaBounceSignals: EMABounceSignal[];\n    supplyDemandSignals: SupplyDemandSignal[];\n    allSignals: TradingSignal[];\n  } {\n    // Calculate technical indicators\n    const closePrices = klineData.map(k => parseFloat(k.close));\n    \n    const ema9 = calculateEMA(closePrices, 9);\n    const ema20 = calculateEMA(closePrices, 20);\n    const ema200 = calculateEMA(closePrices, 200);\n    \n    const emaData: EMAData[] = [];\n    const minLength = Math.min(ema9.length, ema20.length, ema200.length);\n    const startIndex = klineData.length - minLength;\n    \n    for (let i = 0; i < minLength; i++) {\n      emaData.push({\n        timestamp: klineData[startIndex + i].closeTime,\n        ema9: ema9[ema9.length - minLength + i],\n        ema20: ema20[ema20.length - minLength + i],\n        ema200: ema200[i]\n      });\n    }\n    \n    const vwapData = calculateVWAP(klineData);\n    const macdData = calculateMACD(closePrices);\n    const supplyDemandZones = detectSupplyDemandZones(klineData);\n    \n    // Generate trading signals\n    const emaBounceSignals = detectEMABounceSignal(klineData, vwapData);\n    const supplyDemandSignals = detectSupplyDemandSignals(klineData, supplyDemandZones);\n    \n    // Combine all signals\n    const allSignals: TradingSignal[] = [\n      ...emaBounceSignals.map(signal => ({\n        id: `ema_${signal.timestamp}`,\n        symbol,\n        exchange,\n        tradingType,\n        timeframe,\n        timestamp: signal.timestamp,\n        type: signal.type,\n        price: signal.price,\n        strategy: 'ema_bounce' as const,\n        signalData: signal,\n        isActive: true,\n        confidence: signal.confidence\n      })),\n      ...supplyDemandSignals.map(signal => ({\n        id: `sd_${signal.timestamp}`,\n        symbol,\n        exchange,\n        tradingType,\n        timeframe,\n        timestamp: signal.timestamp,\n        type: signal.type,\n        price: signal.price,\n        strategy: 'supply_demand' as const,\n        signalData: signal,\n        isActive: true,\n        confidence: signal.confidence\n      }))\n    ];\n    \n    return {\n      emaData,\n      vwapData,\n      macdData,\n      supplyDemandZones,\n      emaBounceSignals,\n      supplyDemandSignals,\n      allSignals\n    };\n  }\n}