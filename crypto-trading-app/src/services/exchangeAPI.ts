import type {
  Exchange,
  TradingType,
  Timeframe,
  ExchangeConfig,
  KlineData,
  TickerData,
  SymbolInfo,
  BinanceKlineResponse,
  BybitKlineResponse,
  BinanceTickerResponse,
  BybitTickerResponse,
  ExchangeError
} from '../types/exchange';

// Exchange configurations
const EXCHANGE_CONFIGS: Record<Exchange, Record<TradingType, ExchangeConfig>> = {
  binance: {
    spot: {
      exchange: 'binance',
      tradingType: 'spot',
      baseUrl: 'https://api.binance.com/api/v3',
      endpoints: {
        klines: '/klines',
        ticker: '/ticker/24hr',
        symbols: '/exchangeInfo'
      }
    },
    futures: {
      exchange: 'binance',
      tradingType: 'futures',
      baseUrl: 'https://fapi.binance.com/fapi/v1',
      endpoints: {
        klines: '/klines',
        ticker: '/ticker/24hr',
        symbols: '/exchangeInfo'
      }
    }
  },
  bybit: {
    spot: {
      exchange: 'bybit',
      tradingType: 'spot',
      baseUrl: 'https://api.bybit.com/v5',
      endpoints: {
        klines: '/market/kline',
        ticker: '/market/tickers',
        symbols: '/market/instruments-info'
      }
    },
    futures: {
      exchange: 'bybit',
      tradingType: 'futures',
      baseUrl: 'https://api.bybit.com/v5',
      endpoints: {
        klines: '/market/kline',
        ticker: '/market/tickers',
        symbols: '/market/instruments-info'
      }
    }
  }
};

// Timeframe mapping for different exchanges
const TIMEFRAME_MAPPING = {
  binance: {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '1h': '1h',
    '4h': '4h',
    '1d': '1d',
    '1w': '1w',
    '1M': '1M'
  },
  bybit: {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '30m': '30',
    '1h': '60',
    '4h': '240',
    '1d': 'D',
    '1w': 'W',
    '1M': 'M'
  }
};

// Utility function for making API calls with error handling and retry
async function makeAPICall<T>(url: string, exchange: Exchange): Promise<T> {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`API Call (attempt ${attempt}):`, url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CryptoSignals/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      if (attempt === maxRetries) {
        const exchangeError: ExchangeError = {
          exchange,
          endpoint: url,
          message: `Failed after ${maxRetries} attempts: ${errorMsg}`,
          timestamp: Date.now()
        };
        throw exchangeError;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }
  }

  throw new Error('Unexpected error in makeAPICall');
}

// Get exchange configuration
function getConfig(exchange: Exchange, tradingType: TradingType): ExchangeConfig {
  return EXCHANGE_CONFIGS[exchange][tradingType];
}

// Normalize timeframe for specific exchange
function normalizeTimeframe(exchange: Exchange, timeframe: Timeframe): string {
  return TIMEFRAME_MAPPING[exchange][timeframe];
}

// Binance API functions
async function getBinanceKlines(
  symbol: string,
  timeframe: Timeframe,
  tradingType: TradingType,
  limit: number = 500
): Promise<KlineData[]> {
  const config = getConfig('binance', tradingType);
  const interval = normalizeTimeframe('binance', timeframe);
  
  const url = `${config.baseUrl}${config.endpoints.klines}?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  
  const response = await makeAPICall<BinanceKlineResponse[]>(url, 'binance');
  
  return response.map(item => ({
    openTime: item[0],
    open: item[1],
    high: item[2],
    low: item[3],
    close: item[4],
    volume: item[5],
    closeTime: item[6],
    quoteAssetVolume: item[7],
    numberOfTrades: item[8],
    takerBuyBaseAssetVolume: item[9],
    takerBuyQuoteAssetVolume: item[10]
  }));
}

async function getBinanceTicker(symbol: string, tradingType: TradingType): Promise<TickerData> {
  const config = getConfig('binance', tradingType);
  const url = `${config.baseUrl}${config.endpoints.ticker}?symbol=${symbol}`;
  
  const response = await makeAPICall<BinanceTickerResponse>(url, 'binance');
  
  return {
    symbol: response.symbol,
    price: response.lastPrice,
    priceChange: response.priceChange,
    priceChangePercent: response.priceChangePercent,
    highPrice: response.highPrice,
    lowPrice: response.lowPrice,
    volume: response.volume,
    quoteVolume: response.quoteVolume,
    openPrice: response.openPrice,
    prevClosePrice: response.prevClosePrice,
    bidPrice: response.bidPrice,
    askPrice: response.askPrice,
    weightedAvgPrice: response.weightedAvgPrice
  };
}

async function getBinanceSymbols(tradingType: TradingType): Promise<string[]> {
  const config = getConfig('binance', tradingType);
  const url = `${config.baseUrl}${config.endpoints.symbols}`;
  
  const response = await makeAPICall<{ symbols: Array<{ symbol: string; status: string; quoteAsset: string }> }>(url, 'binance');
  
  return response.symbols
    .filter(s => s.status === 'TRADING' && s.quoteAsset === 'USDT')
    .map(s => s.symbol);
}

// Bybit API functions
async function getBybitKlines(
  symbol: string,
  timeframe: Timeframe,
  tradingType: TradingType,
  limit: number = 500
): Promise<KlineData[]> {
  const config = getConfig('bybit', tradingType);
  const interval = normalizeTimeframe('bybit', timeframe);
  const category = tradingType === 'spot' ? 'spot' : 'linear';
  
  const url = `${config.baseUrl}${config.endpoints.klines}?category=${category}&symbol=${symbol}&interval=${interval}&limit=${limit}`;
  
  const response = await makeAPICall<BybitKlineResponse>(url, 'bybit');
  
  return response.list.map(item => ({
    openTime: parseInt(item[0]),
    open: item[1],
    high: item[2],
    low: item[3],
    close: item[4],
    volume: item[5],
    closeTime: parseInt(item[0]) + getTimeframeMs(timeframe) - 1
  }));
}

async function getBybitTicker(symbol: string, tradingType: TradingType): Promise<TickerData> {
  const config = getConfig('bybit', tradingType);
  const category = tradingType === 'spot' ? 'spot' : 'linear';
  const url = `${config.baseUrl}${config.endpoints.ticker}?category=${category}&symbol=${symbol}`;
  
  const response = await makeAPICall<BybitTickerResponse>(url, 'bybit');
  
  if (response.result.list.length === 0) {
    throw new Error(`No ticker data found for ${symbol}`);
  }
  
  const ticker = response.result.list[0];
  const priceChange = (parseFloat(ticker.lastPrice) - parseFloat(ticker.prevPrice24h)).toString();
  
  return {
    symbol: ticker.symbol,
    price: ticker.lastPrice,
    priceChange,
    priceChangePercent: ticker.price24hPcnt,
    highPrice: ticker.highPrice24h,
    lowPrice: ticker.lowPrice24h,
    volume: ticker.volume24h,
    quoteVolume: ticker.turnover24h,
    openPrice: ticker.prevPrice24h,
    prevClosePrice: ticker.prevPrice24h,
    bidPrice: ticker.bid1Price,
    askPrice: ticker.ask1Price
  };
}

async function getBybitSymbols(tradingType: TradingType): Promise<string[]> {
  const config = getConfig('bybit', tradingType);
  const category = tradingType === 'spot' ? 'spot' : 'linear';
  const url = `${config.baseUrl}${config.endpoints.symbols}?category=${category}`;
  
  const response = await makeAPICall<{ 
    result: { 
      list: Array<{ symbol: string; status: string; quoteCoin: string }> 
    } 
  }>(url, 'bybit');
  
  return response.result.list
    .filter(s => s.status === 'Trading' && s.quoteCoin === 'USDT')
    .map(s => s.symbol);
}

// Helper function to convert timeframe to milliseconds
function getTimeframeMs(timeframe: Timeframe): number {
  const timeframes: Record<Timeframe, number> = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
    '1M': 30 * 24 * 60 * 60 * 1000
  };
  return timeframes[timeframe];
}

// Main API class
export class ExchangeAPI {
  static async getKlineData(
    exchange: Exchange,
    tradingType: TradingType,
    symbol: string,
    timeframe: Timeframe,
    limit: number = 500
  ): Promise<KlineData[]> {
    switch (exchange) {
      case 'binance':
        return getBinanceKlines(symbol, timeframe, tradingType, limit);
      case 'bybit':
        return getBybitKlines(symbol, timeframe, tradingType, limit);
      default:
        throw new Error(`Unsupported exchange: ${exchange}`);
    }
  }

  static async getTickerData(
    exchange: Exchange,
    tradingType: TradingType,
    symbol: string
  ): Promise<TickerData> {
    switch (exchange) {
      case 'binance':
        return getBinanceTicker(symbol, tradingType);
      case 'bybit':
        return getBybitTicker(symbol, tradingType);
      default:
        throw new Error(`Unsupported exchange: ${exchange}`);
    }
  }

  static async getAvailableSymbols(
    exchange: Exchange,
    tradingType: TradingType
  ): Promise<string[]> {
    switch (exchange) {
      case 'binance':
        return getBinanceSymbols(tradingType);
      case 'bybit':
        return getBybitSymbols(tradingType);
      default:
        throw new Error(`Unsupported exchange: ${exchange}`);
    }
  }

  static async getAllTickers(
    exchange: Exchange,
    tradingType: TradingType
  ): Promise<TickerData[]> {
    const symbols = await this.getAvailableSymbols(exchange, tradingType);
    const tickers: TickerData[] = [];
    
    // Fetch tickers in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const batchPromises = batch.map(symbol => 
        this.getTickerData(exchange, tradingType, symbol).catch(error => {
          console.warn(`Failed to fetch ticker for ${symbol}:`, error);
          return null;
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      tickers.push(...batchResults.filter(ticker => ticker !== null) as TickerData[]);
      
      // Small delay between batches
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    return tickers;
  }
}

// Export utility functions
export { getTimeframeMs, normalizeTimeframe };