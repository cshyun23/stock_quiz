/**
 * Quick Test - Chart Service with Dummy Data
 * 더미 데이터로 차트 서비스 테스트
 */

const ChartService = require('../src/services/chartService');

async function testWithDummyData() {
  console.log('=== 주식 차트 서비스 테스트 (더미 데이터) ===\n');
  
  const chartService = new ChartService();
  
  // 테스트 1: 실제 API 호출 없이 구조 확인
  console.log('테스트 1: ChartService 객체 구조 확인');
  console.log('  periodMap:', Object.keys(chartService.periodMap));
  console.log('  yfinance provider:', chartService.yfinance ? '✓' : '✗');
  console.log('');
  
  // 테스트 2: 더미 데이터 생성
  console.log('테스트 2: 더미 차트 데이터 생성');
  const dummyData = generateDummyChartData('AAPL', 30);
  console.log(`  생성된 데이터 포인트: ${dummyData.length}개`);
  console.log('  첫 번째 데이터:', dummyData[0]);
  console.log('  마지막 데이터:', dummyData[dummyData.length - 1]);
  console.log('');
  
  // 테스트 3: 더미 메타데이터 생성
  console.log('테스트 3: 더미 메타데이터 생성');
  const dummyMetadata = generateDummyMetadata('AAPL');
  console.log('  메타데이터:');
  console.log(`    이름: ${dummyMetadata.name}`);
  console.log(`    현재가: $${dummyMetadata.currentPrice}`);
  console.log(`    거래량: ${dummyMetadata.volume.toLocaleString()}`);
  console.log(`    시가총액: $${(dummyMetadata.marketCap / 1e9).toFixed(2)}B`);
  console.log(`    P/E 비율: ${dummyMetadata.trailingPE}`);
  console.log('');
  
  // 테스트 4: yfinance 가용성 확인 (실제 API)
  console.log('테스트 4: YFinance API 연결 확인');
  try {
    const available = await chartService.checkAvailability();
    if (available) {
      console.log('  ✓ YFinance API 사용 가능');
      
      // 테스트 5: 실제 데이터 가져오기 (간단한 테스트)
      console.log('\n테스트 5: 실제 AAPL 데이터 가져오기 (5일)');
      try {
        const realData = await chartService.fetchChartData('AAPL', '5D', '1d');
        console.log(`  ✓ 실제 데이터 수신: ${realData.data.length}개 포인트`);
        if (realData.data.length > 0) {
          const latest = realData.data[realData.data.length - 1];
          console.log(`  최신 종가: $${latest.close.toFixed(2)}`);
          console.log(`  거래량: ${latest.volume.toLocaleString()}`);
        }
        console.log(`  메타데이터: ${realData.metadata.name || 'N/A'}`);
      } catch (error) {
        console.log(`  ✗ 실제 데이터 가져오기 실패: ${error.message}`);
      }
    } else {
      console.log('  ✗ YFinance가 설치되지 않았습니다');
      console.log('  → 가상환경 활성화 후: uv pip install -e .');
    }
  } catch (error) {
    console.log(`  ✗ API 확인 실패: ${error.message}`);
  }
  
  console.log('\n=== 테스트 완료 ===');
}

/**
 * 더미 차트 데이터 생성
 */
function generateDummyChartData(symbol, days) {
  const data = [];
  const basePrice = 150; // 기준 가격
  let currentPrice = basePrice;
  
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // 랜덤 변동 (-2% ~ +2%)
    const change = (Math.random() - 0.5) * 0.04;
    currentPrice = currentPrice * (1 + change);
    
    const open = currentPrice * (1 + (Math.random() - 0.5) * 0.01);
    const close = currentPrice;
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);
    const volume = Math.floor(50000000 + Math.random() * 50000000);
    
    data.push({
      timestamp: date.toISOString(),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: volume
    });
  }
  
  return data;
}

/**
 * 더미 메타데이터 생성
 */
function generateDummyMetadata(symbol) {
  const stockNames = {
    'AAPL': 'Apple Inc.',
    'GOOGL': 'Alphabet Inc.',
    'MSFT': 'Microsoft Corporation',
    'TSLA': 'Tesla, Inc.',
    'AMZN': 'Amazon.com, Inc.'
  };
  
  return {
    name: stockNames[symbol] || `${symbol} Inc.`,
    currentPrice: 150 + Math.random() * 50,
    volume: Math.floor(50000000 + Math.random() * 100000000),
    marketCap: Math.floor(2000000000000 + Math.random() * 1000000000000),
    dayHigh: 155,
    dayLow: 148,
    high52w: 180,
    low52w: 120,
    previousClose: 149.50,
    trailingPE: 25 + Math.random() * 10,
    forwardPE: 22 + Math.random() * 8,
    currency: 'USD',
    exchange: 'NASDAQ'
  };
}

// 테스트 실행
if (require.main === module) {
  testWithDummyData().catch(console.error);
}

module.exports = { generateDummyChartData, generateDummyMetadata };
