/**
 * Configuration file for Stock Quiz application
 */

module.exports = {
  // Debug mode
  debug: process.env.DEBUG === 'true' || false,
  // API Configuration
  api: {
    chartApiUrl: process.env.CHART_API_URL || '',
    apiKey: process.env.API_KEY || '',
    timeout: 10000
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },

  // MCP Server Configuration
  mcp: {
    port: process.env.MCP_PORT || 3001,
    version: '1.0.0'
  },

  // Quiz Configuration
  quiz: {
    difficulties: {
      easy: {
        timeRange: '1M',
        visiblePercent: 0.8
      },
      medium: {
        timeRange: '3M',
        visiblePercent: 0.7
      },
      hard: {
        timeRange: '1Y',
        visiblePercent: 0.6
      }
    },
    defaultDifficulty: 'medium',
    maxActiveQuizzes: 100
  },

  // Supported symbols
  symbols: {
    stocks: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'],
    crypto: ['BTC', 'ETH', 'SOL', 'ADA', 'DOT']
  },

  // Chart settings
  chart: {
    maxDataPoints: 1000,
    defaultTimeRange: '1M'
  },

  // Logging helper
  log: function(module, message, data = null) {
    if (this.debug) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${module}]`, message);
      if (data) {
        console.log('  Data:', JSON.stringify(data, null, 2));
      }
    }
  }
};
