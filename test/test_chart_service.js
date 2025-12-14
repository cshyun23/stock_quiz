/**
 * Test Chart Service
 * Validate chart service integration with yfinance
 */

const ChartService = require('../src/services/chartService');

async function testChartService() {
  console.log('=== Testing Chart Service ===\n');
  
  const chartService = new ChartService();
  
  // Test 1: Check yfinance availability
  console.log('Test 1: Checking yfinance availability...');
  try {
    const available = await chartService.checkAvailability();
    console.log(available ? '✓ yfinance is available' : '✗ yfinance is NOT available');
    if (!available) {
      console.log('Please run: pip install -r src/providers/requirements.txt');
      return;
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
    return;
  }
  
  console.log('\n---\n');
  
  // Test 2: Fetch chart data
  console.log('Test 2: Fetching chart data for AAPL (1M period)...');
  try {
    const chartData = await chartService.fetchChartData('AAPL', '1M', '1d');
    console.log('✓ Successfully fetched chart data');
    console.log(`  Symbol: ${chartData.symbol}`);
    console.log(`  Time Range: ${chartData.timeRange}`);
    console.log(`  Data points: ${chartData.data.length}`);
    console.log(`  Metadata included: ${Object.keys(chartData.metadata).length} fields`);
    
    console.log('\n  Metadata:');
    console.log(`    Name: ${chartData.metadata.name}`);
    console.log(`    Volume: ${chartData.metadata.volume?.toLocaleString() || 'N/A'}`);
    console.log(`    Market Cap: $${(chartData.metadata.marketCap / 1e9)?.toFixed(2) || 'N/A'}B`);
    console.log(`    Day High: $${chartData.metadata.dayHigh?.toFixed(2) || 'N/A'}`);
    console.log(`    Day Low: $${chartData.metadata.dayLow?.toFixed(2) || 'N/A'}`);
    console.log(`    Previous Close: $${chartData.metadata.previousClose?.toFixed(2) || 'N/A'}`);
    
    if (chartData.data.length > 0) {
      console.log('\n  Sample data points (first 3):');
      chartData.data.slice(0, 3).forEach((point, idx) => {
        console.log(`    ${idx + 1}. ${point.timestamp} - Close: $${point.close.toFixed(2)}`);
      });
    }
  } catch (error) {
    console.error('✗ Error fetching chart data:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 3: Get current price
  console.log('Test 3: Getting current price for TSLA...');
  try {
    const price = await chartService.getCurrentPrice('TSLA');
    console.log(`✓ Current price: $${price.toFixed(2)}`);
  } catch (error) {
    console.error('✗ Error getting current price:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 4: Get metadata only
  console.log('Test 4: Getting metadata for MSFT...');
  try {
    const metadata = await chartService.getMetadata('MSFT');
    console.log('✓ Successfully fetched metadata');
    console.log(`  Name: ${metadata.name}`);
    console.log(`  52W High: $${metadata.high52w?.toFixed(2) || 'N/A'}`);
    console.log(`  52W Low: $${metadata.low52w?.toFixed(2) || 'N/A'}`);
    console.log(`  Currency: ${metadata.currency}`);
    console.log(`  Exchange: ${metadata.exchange}`);
  } catch (error) {
    console.error('✗ Error getting metadata:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 5: Test different time ranges
  console.log('Test 5: Testing different time ranges...');
  const timeRanges = ['1D', '5D', '1M', '3M', '6M', '1Y'];
  
  for (const range of timeRanges) {
    try {
      const data = await chartService.fetchChartData('AAPL', range, '1d');
      console.log(`  ${range}: ✓ ${data.data.length} data points`);
    } catch (error) {
      console.log(`  ${range}: ✗ ${error.message}`);
    }
  }
  
  console.log('\n=== All Tests Complete ===');
}

// Run tests
if (require.main === module) {
  testChartService().catch(console.error);
}

module.exports = testChartService;
