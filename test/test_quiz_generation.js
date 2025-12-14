/**
 * Test Quiz Generation
 * Validate quiz generation with real yfinance data
 */

const ChartService = require('../src/services/chartService');
const DataProcessor = require('../src/services/dataProcessor');
const Quiz = require('../src/models/Quiz');

async function testQuizGeneration() {
  console.log('=== Testing Quiz Generation ===\n');
  
  const chartService = new ChartService();
  
  // Check availability
  const available = await chartService.checkAvailability();
  if (!available) {
    console.log('✗ yfinance is not available. Please install requirements.');
    return;
  }
  
  // Test 1: Generate quiz data
  console.log('Test 1: Generating quiz with real data...');
  try {
    const symbol = 'AAPL';
    const chartData = await chartService.fetchChartData(symbol, '3M', '1d');
    const metadata = chartData.metadata;
    
    console.log('✓ Fetched chart data for quiz');
    console.log(`  Symbol: ${symbol}`);
    console.log(`  Data points: ${chartData.data.length}`);
    
    // Create a simple quiz structure
    const visibleDataPoints = Math.floor(chartData.data.length * 0.7); // Show 70% of data
    const visibleUntil = new Date(chartData.data[visibleDataPoints].timestamp);
    const targetPoint = chartData.data[chartData.data.length - 1];
    
    const quizData = {
      id: Date.now(),
      symbol: symbol,
      chartData: chartData.data,
      metadata: {
        name: metadata.name,
        volume: metadata.volume,
        marketCap: metadata.marketCap,
        dayHigh: metadata.dayHigh,
        dayLow: metadata.dayLow
      },
      targetPrice: targetPoint.close,
      targetDate: new Date(targetPoint.timestamp),
      visibleUntil: visibleUntil,
      difficulty: 'medium'
    };
    
    const quiz = new Quiz(quizData);
    
    console.log('\n✓ Created quiz');
    console.log(`  Quiz ID: ${quiz.id}`);
    console.log(`  Symbol: ${quiz.symbol}`);
    console.log(`  Total data points: ${quiz.chartData.length}`);
    console.log(`  Visible until: ${quiz.visibleUntil.toISOString().split('T')[0]}`);
    console.log(`  Target date: ${quiz.targetDate.toISOString().split('T')[0]}`);
    console.log(`  Target price: $${quiz.targetPrice.toFixed(2)}`);
    
    // Test 2: Get quiz data for display
    console.log('\nTest 2: Getting quiz data for display...');
    const displayData = quiz.getQuizData();
    console.log(`✓ Quiz display data`);
    console.log(`  Visible data points: ${displayData.chartData.length}`);
    console.log(`  Hidden data points: ${quiz.chartData.length - displayData.chartData.length}`);
    console.log(`  Metadata fields: ${Object.keys(displayData.metadata).length}`);
    
    // Test 3: Simulate correct answer
    console.log('\nTest 3: Submitting correct answer...');
    const correctAnswer = {
      price: quiz.targetPrice,
      date: quiz.targetDate
    };
    const correctResult = quiz.checkAnswer(correctAnswer);
    console.log(`✓ Answer checked`);
    console.log(`  Correct: ${correctResult.correct}`);
    console.log(`  Price accuracy: ${(correctResult.priceAccuracy * 100).toFixed(2)}%`);
    console.log(`  Date accuracy: ${(correctResult.dateAccuracy * 100).toFixed(2)}%`);
    
    // Test 4: Simulate close answer
    console.log('\nTest 4: Submitting close answer (95% accuracy)...');
    const closeAnswer = {
      price: quiz.targetPrice * 0.95,
      date: quiz.targetDate
    };
    const closeResult = quiz.checkAnswer(closeAnswer);
    console.log(`✓ Answer checked`);
    console.log(`  Correct: ${closeResult.correct}`);
    console.log(`  Price accuracy: ${(closeResult.priceAccuracy * 100).toFixed(2)}%`);
    console.log(`  Date accuracy: ${(closeResult.dateAccuracy * 100).toFixed(2)}%`);
    
    // Test 5: Simulate wrong answer
    console.log('\nTest 5: Submitting wrong answer...');
    const wrongAnswer = {
      price: quiz.targetPrice * 0.5,
      date: new Date(quiz.targetDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days later
    };
    const wrongResult = quiz.checkAnswer(wrongAnswer);
    console.log(`✓ Answer checked`);
    console.log(`  Correct: ${wrongResult.correct}`);
    console.log(`  Price accuracy: ${(wrongResult.priceAccuracy * 100).toFixed(2)}%`);
    console.log(`  Date accuracy: ${(wrongResult.dateAccuracy * 100).toFixed(2)}%`);
    
    // Test 6: Serialize/deserialize
    console.log('\nTest 6: Testing quiz serialization...');
    const serialized = quiz.toJSON();
    const deserialized = Quiz.fromJSON(serialized);
    console.log(`✓ Quiz serialized and deserialized`);
    console.log(`  IDs match: ${serialized.id === deserialized.id}`);
    console.log(`  Symbols match: ${serialized.symbol === deserialized.symbol}`);
    
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error.stack);
  }
  
  console.log('\n=== All Tests Complete ===');
}

// Run tests
if (require.main === module) {
  testQuizGeneration().catch(console.error);
}

module.exports = testQuizGeneration;
