/**
 * Web Server Implementation
 * Direct web hosting for browser-based access
 */

const express = require('express');
const path = require('path');
const ChartService = require('../services/chartService');
const CoinGeckoProvider = require('../providers/coinGeckoProvider');
const CacheManager = require('../utils/cache');
const config = require('../utils/config');

class WebServer {
  constructor() {
    config.log('WebServer', 'Initializing Web Server');
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.chartService = new ChartService();
    this.coinGeckoProvider = new CoinGeckoProvider();
    this.cache = new CacheManager();
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.static(path.join(__dirname, 'public')));
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Serve main page
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // API: Get stock chart data for quiz
    this.app.get('/api/chart/stock/:symbol', async (req, res) => {
      try {
        const { symbol } = req.params;
        const { timeframe = '2Y' } = req.query;
        config.log('WebServer', `API request: stock chart quiz`, { symbol, timeframe });
        
        // Check cache first
        const cacheKey = this.cache.getCacheKey('stock', symbol, timeframe);
        const cachedData = this.cache.loadCache(cacheKey);
        
        let allData, stockInfo;
        
        if (cachedData) {
          // Use cached data
          config.log('WebServer', `Using cached data for ${symbol}`);
          allData = cachedData.allData;
          stockInfo = cachedData.stockInfo;
        } else {
          // Fetch fresh data
          config.log('WebServer', `Fetching fresh data for ${symbol}`);
          
          // Fetch at least 2 years of data to ensure we have enough for quiz
          const chartData = await this.chartService.fetchChartData(symbol, timeframe, '1d');
          
          // Get additional stock info for P/E ratio
          stockInfo = await this.chartService.yfinance.fetchStockInfo(symbol);
          
          if (!chartData.data || chartData.data.length === 0) {
            return res.status(400).json({ 
              success: false, 
              error: 'No data available for this symbol. Please try a different symbol.' 
            });
          }
          
          allData = chartData.data;
          
          // Save to cache
          this.cache.saveCache(cacheKey, {
            allData: allData,
            stockInfo: stockInfo,
            metadata: chartData.metadata
          });
        }
        
        if (allData.length < 210) { // Need at least ~7 months (180 days for 6 months + 30 days buffer)
          return res.status(400).json({ 
            success: false, 
            error: `Insufficient data (${allData.length} days). Try a symbol with more historical data.` 
          });
        }
        
        // Select random cutoff point
        // Ensure at least 180 days before cutoff and 30 days after
        const minIndex = Math.max(180, 0);
        const maxIndex = allData.length - 30;
        
        if (maxIndex <= minIndex) {
          return res.status(400).json({ 
            success: false, 
            error: 'Unable to create quiz with available data. Try a different timeframe or symbol.' 
          });
        }
        
        const randomCutoffIndex = Math.floor(Math.random() * (maxIndex - minIndex) + minIndex);
        const cutoffDate = new Date(allData[randomCutoffIndex].timestamp);
        
        // Get 6 months (180 days) before cutoff
        const startIndex = Math.max(0, randomCutoffIndex - 180);
        const visibleData = allData.slice(startIndex, randomCutoffIndex + 1);
        
        // Get up to 30 days after cutoff
        const hiddenData = allData.slice(randomCutoffIndex + 1, randomCutoffIndex + 31);
        
        config.log('WebServer', `Quiz data prepared`, {
          totalData: allData.length,
          visibleData: visibleData.length,
          hiddenData: hiddenData.length,
          cutoffDate: cutoffDate.toISOString(),
          fromCache: !!cachedData
        });
        
        res.json({
          success: true,
          data: visibleData,
          hiddenData: hiddenData,
          cutoffDate: cutoffDate.toISOString(),
          metadata: {
            ...(cachedData?.metadata || {}),
            trailingPE: stockInfo.trailingPE || 0,
            forwardPE: stockInfo.forwardPE || 0
          }
        });
      } catch (error) {
        console.error('Error in stock chart API:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // API: Get crypto chart data for quiz
    this.app.get('/api/chart/crypto/:coinId', async (req, res) => {
      try {
        const { coinId } = req.params;
        const { timeframe = '2Y' } = req.query;
        config.log('WebServer', `API request: crypto chart quiz`, { coinId, timeframe });
        
        // Map timeframe to days for CoinGecko - fetch at least 2 years
        const daysMap = {
          '1D': 730,
          '5D': 730,
          '1M': 730,
          '3M': 730,
          '6M': 730,
          '1Y': 730,
          '2Y': 730,
          '5Y': 1825
        };
        const days = daysMap[timeframe] || 730;
        
        // Check cache first
        const cachedData = await this.cache.loadCache('crypto', coinId, timeframe);
        let chartData, coinData, fromCache = false;
        
        if (cachedData) {
          config.log('WebServer', `Using cached data for ${coinId}`);
          chartData = cachedData.chartData;
          coinData = cachedData.coinData;
          fromCache = true;
        } else {
          config.log('WebServer', `Fetching fresh data for ${coinId}`);
          chartData = await this.coinGeckoProvider.fetchHistoricalData(coinId, 'usd', days);
          coinData = await this.coinGeckoProvider.fetchCoinData(coinId, 'usd');
          
          // Save to cache
          await this.cache.saveCache('crypto', coinId, timeframe, {
            chartData,
            coinData
          });
        }
        
        if (!chartData.data || chartData.data.length === 0) {
          return res.status(400).json({ 
            success: false, 
            error: 'No data available for this coin. Please try a different coin ID.' 
          });
        }
        
        const allData = chartData.data;
        
        if (allData.length < 210) {
          return res.status(400).json({ 
            success: false, 
            error: `Insufficient data (${allData.length} points). Try a coin with more historical data.` 
          });
        }
        
        // Select random cutoff point
        const minIndex = Math.max(180, 0);
        const maxIndex = allData.length - 30;
        
        if (maxIndex <= minIndex) {
          return res.status(400).json({ 
            success: false, 
            error: 'Unable to create quiz with available data. Try a different coin.' 
          });
        }
        
        const randomCutoffIndex = Math.floor(Math.random() * (maxIndex - minIndex) + minIndex);
        const cutoffDate = new Date(allData[randomCutoffIndex].timestamp);
        
        // Get 6 months before cutoff
        const startIndex = Math.max(0, randomCutoffIndex - 180);
        const visibleData = allData.slice(startIndex, randomCutoffIndex + 1);
        
        // Get up to 30 days after cutoff
        const hiddenData = allData.slice(randomCutoffIndex + 1, randomCutoffIndex + 31);
        
        config.log('WebServer', `Quiz data prepared`, {
          totalData: allData.length,
          visibleData: visibleData.length,
          hiddenData: hiddenData.length,
          cutoffDate: cutoffDate.toISOString()
        });
        
        res.json({
          success: true,
          data: visibleData,
          hiddenData: hiddenData,
          cutoffDate: cutoffDate.toISOString(),
          metadata: {
            name: coinData.name || coinId,
            symbol: coinData.symbol || '',
            volume: coinData.volume24h || 0,
            marketCap: coinData.marketCap || 0,
            currentPrice: coinData.currentPrice || 0,
            high24h: coinData.high24h || 0,
            low24h: coinData.low24h || 0,
            change24h: coinData.change24h || 0,
            ath: coinData.ath || 0,
            atl: coinData.atl || 0,
            previousClose: coinData.currentPrice || 0
          }
        });
      } catch (error) {
        console.error('Error in crypto chart API:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  /**
   * Start web server
   */
  start() {
    config.log('WebServer', `Starting server on port ${this.port}`);
    this.app.listen(this.port, () => {
      console.log(`Web Server running at http://localhost:${this.port}`);
      console.log('Available endpoints:');
      console.log(`  GET /api/chart/stock/:symbol?timeframe=3M`);
      console.log(`  GET /api/chart/crypto/:coinId?timeframe=3M`);
      if (config.debug) {
        console.log('\n🐛 DEBUG MODE ENABLED');
        console.log('Set DEBUG=false in .env to disable debug logging\n');
      }
    });
  }
}

// Create and export server instance
const server = new WebServer();

// Start server if running directly
if (require.main === module) {
  server.start();
}

module.exports = server;
