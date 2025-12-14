/**
 * Quick Test - Current Price Only
 */

const CoinGeckoProvider = require('../src/providers/coinGeckoProvider');

async function testCurrentPrice() {
  console.log('=== Bitcoin 현재 가격 테스트 ===\n');
  
  const provider = new CoinGeckoProvider();
  
  console.log('Bitcoin 현재 가격 가져오기...');
  try {
    const currentPrice = await provider.getCurrentPrice('bitcoin', 'usd');
    
    console.log('\n반환된 데이터 타입:', typeof currentPrice);
    console.log('반환된 데이터:', JSON.stringify(currentPrice, null, 2));
    
    if (typeof currentPrice === 'number') {
      console.log(`\n✓ 가격: $${currentPrice.toLocaleString()}`);
    } else if (currentPrice && currentPrice.price) {
      console.log(`\n✓ 가격: $${currentPrice.price.toLocaleString()}`);
    }
  } catch (error) {
    console.log(`\n✗ 에러: ${error.message}`);
    console.log('스택:', error.stack);
  }
}

testCurrentPrice().catch(console.error);
