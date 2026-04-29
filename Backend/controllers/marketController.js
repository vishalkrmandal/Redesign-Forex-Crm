// Backend/controllers/marketController.js
const axios = require('axios');

// Symbol mapping from MT5 to Yahoo Finance
const SYMBOL_MAP = {
  'EURUSD': 'EURUSD=X', 'GBPUSD': 'GBPUSD=X', 'USDJPY': 'JPY=X',
  'USDCHF': 'CHF=X', 'USDCAD': 'CAD=X', 'AUDUSD': 'AUDUSD=X',
  'NZDUSD': 'NZDUSD=X', 'EURGBP': 'EURGBP=X', 'EURJPY': 'EURJPY=X',
  'GBPJPY': 'GBPJPY=X', 'EURCHF': 'EURCHF=X', 'AUDCAD': 'AUDCAD=X',
  'XAUUSD': 'GC=F', 'XAGUSD': 'SI=F', 'XTIUSD': 'CL=F',
  'USOIL': 'CL=F', 'UKOIL': 'BZ=F', 'NATGAS': 'NG=F',
  'US30': '^DJI', 'US500': '^GSPC', 'NAS100': '^NDX',
  'UK100': '^FTSE', 'GER40': '^GDAXI', 'JPN225': '^N225',
  'BTCUSD': 'BTC-USD', 'ETHUSD': 'ETH-USD', 'LTCUSD': 'LTC-USD',
  'XRPUSD': 'XRP-USD',
};

const INTERVAL_MAP = {
  '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
  '1h': '60m', '4h': '1h', '1d': '1d', '1w': '1wk', '1M': '1mo',
};

const RANGE_MAP = {
  '1m': '1d', '5m': '2d', '15m': '5d', '30m': '5d',
  '1h': '1mo', '4h': '3mo', '1d': '6mo', '1w': '2y', '1M': '5y',
};

// Normalize MT5 symbol (remove trailing 'm', '.', etc.)
const normalizeMT5Symbol = (symbol) => {
  if (!symbol) return '';
  return symbol.replace(/[m.]$/i, '').toUpperCase();
};

const getYahooSymbol = (symbol) => {
  const normalized = normalizeMT5Symbol(symbol);
  return SYMBOL_MAP[normalized] || `${normalized}=X`;
};

// @desc    Get market chart data for a symbol
// @route   GET /api/market/chart
// @access  Private
const getMarketData = async (req, res) => {
  const { symbol, interval = '1h' } = req.query;

  if (!symbol) {
    return res.status(400).json({ success: false, message: 'Symbol is required' });
  }

  const yahooSymbol = getYahooSymbol(symbol);
  const yahooInterval = INTERVAL_MAP[interval] || '60m';
  const yahooRange = RANGE_MAP[interval] || '1mo';

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}`;
    const response = await axios.get(url, {
      params: { interval: yahooInterval, range: yahooRange, includePrePost: false },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json,text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 12000,
    });

    const result = response.data?.chart?.result?.[0];
    if (!result || !result.timestamp) {
      return res.status(404).json({ success: false, message: 'No data available for this symbol' });
    }

    const { timestamp, indicators, meta } = result;
    const quote = indicators.quote[0];
    const adjClose = indicators.adjclose?.[0]?.adjclose;

    const chartData = timestamp.map((ts, i) => {
      const close = quote.close[i];
      const open = quote.open[i];
      if (close === null || close === undefined) return null;
      return {
        time: new Date(ts * 1000).toISOString(),
        timestamp: ts * 1000,
        open: open != null ? parseFloat(open.toFixed(5)) : parseFloat(close.toFixed(5)),
        high: quote.high[i] != null ? parseFloat(quote.high[i].toFixed(5)) : parseFloat(close.toFixed(5)),
        low: quote.low[i] != null ? parseFloat(quote.low[i].toFixed(5)) : parseFloat(close.toFixed(5)),
        close: parseFloat(close.toFixed(5)),
        adjClose: adjClose?.[i] != null ? parseFloat(adjClose[i].toFixed(5)) : parseFloat(close.toFixed(5)),
        volume: quote.volume[i] || 0,
      };
    }).filter(Boolean);

    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.previousClose || meta.chartPreviousClose;
    const change = previousClose ? currentPrice - previousClose : 0;
    const changePct = previousClose ? ((change / previousClose) * 100) : 0;

    res.json({
      success: true,
      symbol: normalizeMT5Symbol(symbol),
      yahooSymbol,
      currentPrice: parseFloat(currentPrice.toFixed(5)),
      previousClose: previousClose ? parseFloat(previousClose.toFixed(5)) : null,
      change: parseFloat(change.toFixed(5)),
      changePct: parseFloat(changePct.toFixed(3)),
      currency: meta.currency,
      exchangeName: meta.exchangeName,
      interval: yahooInterval,
      range: yahooRange,
      dataPoints: chartData.length,
      data: chartData,
    });
  } catch (error) {
    console.error('Market data error:', error.message);

    // Try fallback with query2
    try {
      const fallbackUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}`;
      const fallback = await axios.get(fallbackUrl, {
        params: { interval: yahooInterval, range: yahooRange, includePrePost: false },
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        timeout: 10000,
      });

      const result = fallback.data?.chart?.result?.[0];
      if (!result) throw new Error('No fallback data');

      const { timestamp, indicators, meta } = result;
      const quote = indicators.quote[0];

      const chartData = timestamp.map((ts, i) => {
        const close = quote.close[i];
        if (close === null || close === undefined) return null;
        return {
          time: new Date(ts * 1000).toISOString(),
          timestamp: ts * 1000,
          open: quote.open[i] != null ? parseFloat(quote.open[i].toFixed(5)) : parseFloat(close.toFixed(5)),
          high: quote.high[i] != null ? parseFloat(quote.high[i].toFixed(5)) : parseFloat(close.toFixed(5)),
          low: quote.low[i] != null ? parseFloat(quote.low[i].toFixed(5)) : parseFloat(close.toFixed(5)),
          close: parseFloat(close.toFixed(5)),
          volume: quote.volume[i] || 0,
        };
      }).filter(Boolean);

      const currentPrice = meta.regularMarketPrice;
      const previousClose = meta.previousClose || meta.chartPreviousClose;
      const change = previousClose ? currentPrice - previousClose : 0;
      const changePct = previousClose ? ((change / previousClose) * 100) : 0;

      return res.json({
        success: true,
        symbol: normalizeMT5Symbol(symbol),
        yahooSymbol,
        currentPrice: parseFloat(currentPrice.toFixed(5)),
        previousClose: previousClose ? parseFloat(previousClose.toFixed(5)) : null,
        change: parseFloat(change.toFixed(5)),
        changePct: parseFloat(changePct.toFixed(3)),
        currency: meta.currency,
        interval: yahooInterval,
        dataPoints: chartData.length,
        data: chartData,
      });
    } catch (fallbackError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch market data. The symbol may not be available.',
        error: error.message,
      });
    }
  }
};

// @desc    Get default symbols list
// @route   GET /api/market/symbols
// @access  Private
const getDefaultSymbols = async (req, res) => {
  const symbols = [
    { symbol: 'EURUSD', name: 'Euro / US Dollar', category: 'Forex' },
    { symbol: 'GBPUSD', name: 'British Pound / US Dollar', category: 'Forex' },
    { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', category: 'Forex' },
    { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', category: 'Forex' },
    { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar', category: 'Forex' },
    { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', category: 'Forex' },
    { symbol: 'NZDUSD', name: 'New Zealand Dollar / US Dollar', category: 'Forex' },
    { symbol: 'EURGBP', name: 'Euro / British Pound', category: 'Forex' },
    { symbol: 'EURJPY', name: 'Euro / Japanese Yen', category: 'Forex' },
    { symbol: 'GBPJPY', name: 'British Pound / Japanese Yen', category: 'Forex' },
    { symbol: 'XAUUSD', name: 'Gold / US Dollar', category: 'Commodities' },
    { symbol: 'XAGUSD', name: 'Silver / US Dollar', category: 'Commodities' },
    { symbol: 'USOIL', name: 'US Crude Oil', category: 'Commodities' },
    { symbol: 'US30', name: 'Dow Jones 30', category: 'Indices' },
    { symbol: 'US500', name: 'S&P 500', category: 'Indices' },
    { symbol: 'NAS100', name: 'NASDAQ 100', category: 'Indices' },
    { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', category: 'Crypto' },
    { symbol: 'ETHUSD', name: 'Ethereum / US Dollar', category: 'Crypto' },
  ];
  res.json({ success: true, symbols });
};

module.exports = { getMarketData, getDefaultSymbols };
