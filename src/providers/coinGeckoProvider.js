/**
 * CoinGecko Provider
 * Fetches cryptocurrency data using CoinGecko API via Python library
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const config = require('../utils/config');

class CoinGeckoProvider {
  constructor() {
    config.log('CoinGeckoProvider', 'Initializing CoinGeckoProvider');
    this.pythonScript = path.join(__dirname, 'coingecko_fetcher.py');
    
    // Try to use venv Python if available
    const venvPython = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
    this.pythonCmd = fs.existsSync(venvPython) ? venvPython : 'python';
    config.log('CoinGeckoProvider', `Using Python: ${this.pythonCmd}`);
  }

  /**
   * Fetch historical market data for a cryptocurrency
   * @param {string} coinId - Coin ID (e.g., 'bitcoin', 'ethereum')
   * @param {string} vsCurrency - Target currency (usd, eur, etc.)
   * @param {number} days - Number of days (1, 7, 14, 30, 90, 180, 365, max)
   * @returns {Promise<Object>} Historical price data
   */
  async fetchHistoricalData(coinId, vsCurrency = 'usd', days = 30) {
    config.log('CoinGeckoProvider', `Fetching historical data`, { coinId, vsCurrency, days });
    return new Promise((resolve, reject) => {
      const python = spawn(this.pythonCmd, [
        this.pythonScript,
        'historical',
        coinId,
        vsCurrency,
        days.toString()
      ]);
      config.log('CoinGeckoProvider', `Spawned Python process for ${coinId}`);

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
   * Fetch current coin data
   * @param {string} coinId - Coin ID
   * @param {string} vsCurrency - Target currency
   * @returns {Promise<Object>} Current coin data
   */
  async fetchCoinData(coinId, vsCurrency = 'usd') {
    config.log('CoinGeckoProvider', `Fetching coin data for ${coinId}`);
    return new Promise((resolve, reject) => {
      const python = spawn(this.pythonCmd, [
        this.pythonScript,
        'current',
        coinId,
        vsCurrency
      ]);
      config.log('CoinGeckoProvider', `Spawned Python process for coin data: ${coinId}`);

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
   * @param {string} coinId - Coin ID
   * @param {string} vsCurrency - Target currency
   * @returns {Promise<number>} Current price
   */
  async getCurrentPrice(coinId, vsCurrency = 'usd') {
    const data = await this.fetchCoinData(coinId, vsCurrency);
    return data.currentPrice || 0;
  }

  /**
   * Search for coins by query
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of matching coins
   */
  async searchCoins(query) {
    return new Promise((resolve, reject) => {
      const python = spawn(this.pythonCmd, [
        this.pythonScript,
        'search',
        query
      ]);

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
   * Get list of supported coins
   * @returns {Promise<Array>} Array of supported coins
   */
  async getSupportedCoins() {
    return new Promise((resolve, reject) => {
      const python = spawn(this.pythonCmd, [
        this.pythonScript,
        'list'
      ]);

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
   * Fetch data for multiple coins
   * @param {Array<string>} coinIds - Array of coin IDs
   * @param {string} vsCurrency - Target currency
   * @param {number} days - Number of days
   * @returns {Promise<Object>} Object with coinId as key and data as value
   */
  async fetchMultipleCoins(coinIds, vsCurrency = 'usd', days = 30) {
    const promises = coinIds.map(coinId => 
      this.fetchHistoricalData(coinId, vsCurrency, days)
        .then(data => ({ coinId, data }))
        .catch(error => ({ coinId, error: error.message }))
    );

    const results = await Promise.all(promises);
    
    const dataMap = {};
    results.forEach(result => {
      dataMap[result.coinId] = result.data || { error: result.error };
    });

    return dataMap;
  }

  /**
   * Check if pycoingecko is available
   * @returns {Promise<boolean>} True if pycoingecko is installed
   */
  async checkAvailability() {
    return new Promise((resolve) => {
      // Try to run a simple list command to check if pycoingecko works
      const python = spawn(this.pythonCmd, [this.pythonScript, 'list']);
      
      let hasData = false;
      python.stdout.on('data', (data) => {
        hasData = true;
      });

      python.on('close', (code) => {
        resolve(code === 0 && hasData);
      });

      // Set timeout to avoid hanging
      setTimeout(() => {
        python.kill();
        resolve(false);
      }, 5000);
    });
  }
}

module.exports = CoinGeckoProvider;
