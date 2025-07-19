// Exchange types and interfaces

export type Exchange = 'binance' | 'bybit';
export type TradingType = 'spot' | 'futures';
export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';

export interface ExchangeConfig {
  exchange: Exchange;
  tradingType: TradingType;
  baseUrl: string;
  endpoints: {
    klines: string;
    ticker: string;
    symbols: string;
  };
}

export interface KlineData {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume?: string;
  numberOfTrades?: number;
  takerBuyBaseAssetVolume?: string;
  takerBuyQuoteAssetVolume?: string;
}

export interface TickerData {
  symbol: string;
  price: string;
  priceChange: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openPrice: string;
  prevClosePrice: string;
  bidPrice?: string;
  askPrice?: string;
  weightedAvgPrice?: string;
  lastUpdateId?: number;
}

export interface SymbolInfo {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
  minPrice?: string;
  maxPrice?: string;
  stepSize?: string;
  minQty?: string;
  maxQty?: string;
}

// Technical Analysis Types
export interface EMAData {
  timestamp: number;
  ema9: number;
  ema20: number;
  ema200: number;
}

export interface VWAPData {
  timestamp: number;
  vwap: number;
  volume: number;
}

export interface MACDData {
  timestamp: number;
  macd: number;
  signal: number;
  histogram: number;
}

export interface SupplyDemandZone {
  type: 'supply' | 'demand';
  high: number;
  low: number;
  timestamp: number;
  strength: 'weak' | 'medium' | 'strong';
  zoneType: 'RBR' | 'DBD' | 'DBR' | 'RBD'; // Rally-Base-Rally, Drop-Base-Drop, etc.
  isValid: boolean;
}

// Signal Types
export interface EMABounceSignal {
  timestamp: number;
  type: 'buy' | 'sell';
  price: number;
  ema9: number;
  ema20: number;
  ema200: number;
  vwap: number;
  macdLine: number;
  macdSignal: number;
  bullishStack: boolean;
  priceAboveVWAP: boolean;
  macdBullish: boolean;
  bounceConfirmed: boolean;
  confidence: number; // 0-100
}

export interface SupplyDemandSignal {
  timestamp: number;
  type: 'buy' | 'sell';
  price: number;
  zone: SupplyDemandZone;
  entryReason: string;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  confidence: number; // 0-100
}

export interface TradingSignal {
  id: string;
  symbol: string;
  exchange: Exchange;
  tradingType: TradingType;
  timeframe: Timeframe;
  timestamp: number;
  type: 'buy' | 'sell';
  price: number;
  strategy: 'ema_bounce' | 'supply_demand';
  signalData: EMABounceSignal | SupplyDemandSignal;
  isActive: boolean;
  confidence: number;
}

// API Response Types
export interface BinanceKlineResponse {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
  ignore: string;
}

export interface BybitKlineResponse {
  symbol: string;
  category: string;
  list: Array<[string, string, string, string, string, string, string]>; // [startTime, open, high, low, close, volume, turnover]
}

export interface BinanceTickerResponse {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export interface BybitTickerResponse {
  retCode: number;
  retMsg: string;
  result: {
    category: string;
    list: Array<{
      symbol: string;
      bid1Price: string;
      bid1Size: string;
      ask1Price: string;
      ask1Size: string;
      lastPrice: string;
      prevPrice24h: string;
      price24hPcnt: string;
      highPrice24h: string;
      lowPrice24h: string;
      turnover24h: string;
      volume24h: string;
      usdIndexPrice: string;
      change24h: string;
    }>;
  };
}

// Error handling
export interface ExchangeError {
  exchange: Exchange;
  endpoint: string;
  message: string;
  code?: number;
  timestamp: number;
}