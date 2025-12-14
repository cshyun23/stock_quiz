/**
 * YFinance Provider
 * Fetches stock/index data using yfinance Python library via child process
 */

const { spawn } = require('child_process');
const path = require('path');
const config = require('../utils/config');

class YFinanceProvider {
  constructor() {
    config.log('YFinanceProvider', 'Initializing YFinanceProvider');
    this.pythonScript = path.join(__dirname, 'yfinance_fetcher.py');
  }

  /**
   * Fetch historical stock data
   * @param {string} symbol - Stock symbol (e.g., 'AAPL', '^GSPC')
   * @param {string} period - Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
   * @param {string} interval - Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
   * @returns {Promise<Object>} Historical data with prices and timestamps
   */
  async fetchHistoricalData(symbol, period = '1mo', interval = '1d') {
    config.log('YFinanceProvider', `Fetching historical data`, { symbol, period, interval });
    return new Promise((resolve, reject) => {
      const python = spawn('python', [
        this.pythonScript,
        'historical',
        symbol,
        period,
        interval
      ]);
      config.log('YFinanceProvider', `Spawned Python process for ${symbol}`);

      let dataString = '';
      let errorString = '';

      python.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorString += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script failed: ${errorString}`));
          return;
        }

        try {
          const result = JSON.parse(dataString);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse data: ${error.message}`));
        }
      });
    });
  }

  /**
   * Fetch current stock info
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Stock information
   */
  async fetchStockInfo(symbol) {
    config.log('YFinanceProvider', `Fetching stock info for ${symbol}`);
    return new Promise((resolve, reject) => {
      const python = spawn('python', [
        this.pythonScript,
        'info',
        symbol
      ]);
      config.log('YFinanceProvider', `Spawned Python process for stock info: ${symbol}`);

      let dataString = '';
      let errorString = '';

      python.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorString += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script failed: ${errorString}`));
          return;
        }

        try {
          const result = JSON.parse(dataString);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse data: ${error.message}`));
        }
      });
    });
  }

  /**
   * Get current price
   * @param {string} symbol - Stock symbol
   * @returns {Promise<number>} Current price
   */
  async getCurrentPrice(symbol) {
    const info = await this.fetchStockInfo(symbol);
    return info.currentPrice || info.regularMarketPrice || 0;
  }

  /**
   * Fetch data for multiple symbols
   * @param {Array<string>} symbols - Array of stock symbols
   * @param {string} period - Time period
   * @param {string} interval - Data interval
   * @returns {Promise<Object>} Object with symbol as key and data as value
   */
  async fetchMultipleSymbols(symbols, period = '1mo', interval = '1d') {
    const promises = symbols.map(symbol => 
      this.fetchHistoricalData(symbol, period, interval)
        .then(data => ({ symbol, data }))
        .catch(error => ({ symbol, error: error.message }))
    );

    const results = await Promise.all(promises);
    
    const dataMap = {};
    results.forEach(result => {
      dataMap[result.symbol] = result.data || { error: result.error };
    });

    return dataMap;
  }

  /**
   * Check if yfinance is available
   * @returns {Promise<boolean>} True if yfinance is installed
   */
  async checkAvailability() {
    return new Promise((resolve) => {
      const python = spawn('python', ['-c', 'import yfinance; print("OK")']);
      
      let output = '';
      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.on('close', (code) => {
        resolve(code === 0 && output.includes('OK'));
      });
    });
  }
}

module.exports = YFinanceProvider;
