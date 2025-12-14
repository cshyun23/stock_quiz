/**
 * Web Server Implementation
 * Direct web hosting for browser-based access
 */

const express = require('express');
const path = require('path');
const ChartService = require('../services/chartService');
const CoinGeckoProvider = require('../providers/coinGeckoProvider');
const config = require('../utils/config');

class WebServer {
  constructor() {
    config.log('WebServer', 'Initializing Web Server');
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.chartService = new ChartService();
    this.coinGeckoProvider = new CoinGeckoProvider();
    
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

    // API: Get stock chart data
    this.app.get('/api/chart/stock/:symbol', async (req, res) => {
      try {
        const { symbol } = req.params;
        const { timeframe = '3M' } = req.query;
        config.log('WebServer', `API request: stock chart`, { symbol, timeframe });
        
        const chartData = await this.chartService.fetchChartData(symbol, timeframe, '1d');
        
        // Get additional stock info for P/E ratio
        const stockInfo = await this.chartService.yfinance.fetchStockInfo(symbol);
        
        res.json({
          success: true,
          data: chartData.data,
          metadata: {
            ...chartData.metadata,
            trailingPE: stockInfo.trailingPE || 0,
            forwardPE: stockInfo.forwardPE || 0
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // API: Get crypto chart data
    this.app.get('/api/chart/crypto/:coinId', async (req, res) => {
      try {
        const { coinId } = req.params;
        const { timeframe = '3M' } = req.query;
        config.log('WebServer', `API request: crypto chart`, { coinId, timeframe });
        
        // Map timeframe to days for CoinGecko
        const daysMap = {
          '1D': 1,
          '5D': 5,
          '1M': 30,
          '3M': 90,
          '6M': 180,
          '1Y': 365,
          '2Y': 730,
          '5Y': 1825
        };
        const days = daysMap[timeframe] || 90;
        
        const chartData = await this.coinGeckoProvider.fetchHistoricalData(coinId, 'usd', days);
        const coinData = await this.coinGeckoProvider.fetchCoinData(coinId, 'usd');
        
        res.json({
          success: true,
          data: chartData.data,
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
