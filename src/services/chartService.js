/**
 * Chart Service
 * Fetches real stock/coin chart data using yfinance
 */

const YFinanceProvider = require('../providers/yfinanceProvider');
const config = require('../utils/config');

class ChartService {
  constructor() {
    config.log('ChartService', 'Initializing ChartService');
    this.yfinance = new YFinanceProvider();
    this.periodMap = {
      '1D': '1d',
      '5D': '5d',
      '1M': '1mo',
      '3M': '3mo',
      '6M': '6mo',
      '1Y': '1y',
      '2Y': '2y',
      '5Y': '5y'
    };
  }

  /**
   * Fetch stock/coin chart data
   * @param {string} symbol - Stock/coin symbol (e.g., 'AAPL', '^GSPC')
   * @param {string} timeRange - Time range for chart data (1D, 5D, 1M, 3M, 6M, 1Y, etc.)
   * @param {string} interval - Data interval (1d, 1h, 5m, etc.)
   * @returns {Promise<Object>} Chart data with prices and timestamps
   */
  async fetchChartData(symbol, timeRange = '1M', interval = '1d') {
    config.log('ChartService', `Fetching chart data for ${symbol}`, { timeRange, interval });
    console.log(`Fetching chart data for ${symbol} (${timeRange})`);
    
    const period = this.periodMap[timeRange] || timeRange.toLowerCase();
    config.log('ChartService', `Mapped timeRange to period: ${period}`);
    
    const data = await this.yfinance.fetchHistoricalData(symbol, period, interval);
    config.log('ChartService', `Received ${data.data.length} data points for ${symbol}`);
    
    return {
      symbol: data.symbol,
      timeRange,
      data: data.data,
      metadata: await this.getMetadata(symbol)
    };
  }

  /**
   * Get current price for a symbol
   * @param {string} symbol - Stock/coin symbol
   * @returns {Promise<number>} Current price
   */
  async getCurrentPrice(symbol) {
    config.log('ChartService', `Getting current price for ${symbol}`);
    try {
      const price = await this.yfinance.getCurrentPrice(symbol);
      config.log('ChartService', `Current price for ${symbol}: $${price}`);
      return price;
    } catch (error) {
      console.error(`Error fetching current price for ${symbol}:`, error);
      config.log('ChartService', `Error getting price for ${symbol}`, { error: error.message });
      return 0;
    }
  }

  /**
   * Get historical metadata (volume, market cap, etc.)
   * @param {string} symbol - Stock/coin symbol
   * @returns {Promise<Object>} Metadata object
   */
  async getMetadata(symbol) {
    config.log('ChartService', `Fetching metadata for ${symbol}`);
    try {
      const info = await this.yfinance.fetchStockInfo(symbol);
      config.log('ChartService', `Metadata received for ${symbol}`, { marketCap: info.marketCap, volume: info.volume });
      return {
        name: info.shortName || info.longName || symbol,
        volume: info.volume,
        marketCap: info.marketCap,
        high52w: info.fiftyTwoWeekHigh,
        low52w: info.fiftyTwoWeekLow,
        dayHigh: info.dayHigh,
        dayLow: info.dayLow,
        previousClose: info.previousClose,
        currency: info.currency,
        exchange: info.exchange
      };
    } catch (error) {
      console.error(`Error fetching metadata for ${symbol}:`, error);
      return {
        volume: 0,
        marketCap: 0,
        dayHigh: 0,
        dayLow: 0
      };
    }
  }

  /**
   * Check if yfinance is available
   * @returns {Promise<boolean>}
   */
  async checkAvailability() {
    return await this.yfinance.checkAvailability();
  }
}

module.exports = ChartService;
