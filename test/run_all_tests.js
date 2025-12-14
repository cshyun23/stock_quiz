/**
 * Run All Tests
 * Execute all test files sequentially
 */

const testYFinanceProvider = require('./test_yfinance_provider');
const testChartService = require('./test_chart_service');
const testQuizGeneration = require('./test_quiz_generation');

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         Stock Quiz - Integration Tests                ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log();
  
  try {
    // Test 1: YFinance Provider
    await testYFinanceProvider();
    console.log('\n\n');
    
    // Test 2: Chart Service
    await testChartService();
    console.log('\n\n');
    
    // Test 3: Quiz Generation
    await testQuizGeneration();
    console.log('\n\n');
    
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║           ✓ All Tests Completed Successfully          ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    
  } catch (error) {
    console.error('\n✗ Test suite failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run all tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = runAllTests;
