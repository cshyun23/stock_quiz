/**
 * Test YFinance Provider
 * Simple test to validate yfinance integration
 */

const YFinanceProvider = require('../src/providers/yfinanceProvider');

async function testYFinanceProvider() {
  console.log('=== Testing YFinance Provider ===\n');
  
  const provider = new YFinanceProvider();
  
  // Test 1: Check availability
  console.log('Test 1: Checking yfinance availability...');
  try {
    const available = await provider.checkAvailability();
    console.log(available ? '✓ yfinance is available' : '✗ yfinance is NOT available');
    if (!available) {
      console.log('Please run: pip install -r src/providers/requirements.txt');
      return;
    }
  } catch (error) {
    console.error('✗ Error checking availability:', error.message);
    return;
  }
  
  console.log('\n---\n');
  
  // Test 2: Fetch historical data for a stock
  console.log('Test 2: Fetching historical data for AAPL (Apple)...');
  try {
    const histData = await provider.fetchHistoricalData('AAPL', '5d', '1d');
    console.log('✓ Successfully fetched data');
    console.log(`  Symbol: ${histData.symbol}`);
    console.log(`  Period: ${histData.period}`);
    console.log(`  Interval: ${histData.interval}`);
    console.log(`  Data points: ${histData.data.length}`);
    
    if (histData.data.length > 0) {
      const latest = histData.data[histData.data.length - 1];
      console.log(`  Latest data point:`);
      console.log(`    Date: ${latest.timestamp}`);
      console.log(`    Open: $${latest.open.toFixed(2)}`);
      console.log(`    Close: $${latest.close.toFixed(2)}`);
      console.log(`    High: $${latest.high.toFixed(2)}`);
      console.log(`    Low: $${latest.low.toFixed(2)}`);
      console.log(`    Volume: ${latest.volume.toLocaleString()}`);
    }
  } catch (error) {
    console.error('✗ Error fetching historical data:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 3: Fetch stock info
  console.log('Test 3: Fetching stock info for GOOGL (Google)...');
  try {
    const info = await provider.fetchStockInfo('GOOGL');
    console.log('✓ Successfully fetched stock info');
    console.log(`  Symbol: ${info.symbol}`);
    console.log(`  Name: ${info.shortName || info.longName}`);
    console.log(`  Current Price: $${info.currentPrice || info.regularMarketPrice}`);
    console.log(`  Previous Close: $${info.previousClose}`);
    console.log(`  Day High: $${info.dayHigh}`);
    console.log(`  Day Low: $${info.dayLow}`);
    console.log(`  Volume: ${info.volume.toLocaleString()}`);
    console.log(`  Market Cap: $${(info.marketCap / 1e9).toFixed(2)}B`);
    console.log(`  52W High: $${info.fiftyTwoWeekHigh}`);
    console.log(`  52W Low: $${info.fiftyTwoWeekLow}`);
    console.log(`  Currency: ${info.currency}`);
    console.log(`  Exchange: ${info.exchange}`);
  } catch (error) {
    console.error('✗ Error fetching stock info:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 4: Get current price
  console.log('Test 4: Getting current price for TSLA (Tesla)...');
  try {
    const price = await provider.getCurrentPrice('TSLA');
    console.log(`✓ Current price: $${price.toFixed(2)}`);
  } catch (error) {
    console.error('✗ Error getting current price:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 5: Fetch index data (S&P 500)
  console.log('Test 5: Fetching S&P 500 index data (^GSPC)...');
  try {
    const indexData = await provider.fetchHistoricalData('^GSPC', '1mo', '1d');
    console.log('✓ Successfully fetched index data');
    console.log(`  Symbol: ${indexData.symbol}`);
    console.log(`  Data points: ${indexData.data.length}`);
    
    if (indexData.data.length > 0) {
      const latest = indexData.data[indexData.data.length - 1];
      console.log(`  Latest close: ${latest.close.toFixed(2)}`);
    }
  } catch (error) {
    console.error('✗ Error fetching index data:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 6: Fetch multiple symbols
  console.log('Test 6: Fetching multiple symbols at once...');
  try {
    const symbols = ['AAPL', 'MSFT', 'GOOGL'];
    const multiData = await provider.fetchMultipleSymbols(symbols, '5d', '1d');
    console.log('✓ Successfully fetched multiple symbols');
    
    for (const symbol of symbols) {
      if (multiData[symbol].error) {
        console.log(`  ${symbol}: ✗ ${multiData[symbol].error}`);
      } else {
        console.log(`  ${symbol}: ✓ ${multiData[symbol].data.length} data points`);
      }
    }
  } catch (error) {
    console.error('✗ Error fetching multiple symbols:', error.message);
  }
  
  console.log('\n=== All Tests Complete ===');
}

// Run tests
if (require.main === module) {
  testYFinanceProvider().catch(console.error);
}

module.exports = testYFinanceProvider;
