/**
 * Quick Test - CoinGecko Provider with Dummy Data
 * 더미 데이터로 CoinGecko 프로바이더 테스트
 */

const CoinGeckoProvider = require('../src/providers/coinGeckoProvider');

async function testCoinGeckoWithDummy() {
  console.log('=== CoinGecko 프로바이더 테스트 (더미 데이터) ===\n');
  
  const provider = new CoinGeckoProvider();
  
  // 테스트 1: CoinGeckoProvider 구조 확인
  console.log('테스트 1: CoinGeckoProvider 객체 확인');
  console.log('  Python fetcher:', provider.pythonScript);
  console.log('');
  
  // 테스트 2: 더미 암호화폐 데이터 생성
  console.log('테스트 2: 더미 암호화폐 차트 데이터 생성');
  const dummyCryptoData = generateDummyCryptoData('bitcoin', 30);
  console.log(`  생성된 데이터 포인트: ${dummyCryptoData.length}개`);
  console.log('  첫 번째 데이터:', dummyCryptoData[0]);
  console.log('  마지막 데이터:', dummyCryptoData[dummyCryptoData.length - 1]);
  console.log('');
  
  // 테스트 3: 더미 암호화폐 메타데이터 생성
  console.log('테스트 3: 더미 암호화폐 메타데이터 생성');
  const dummyMetadata = generateDummyCryptoMetadata('bitcoin');
  console.log('  메타데이터:');
  console.log(`    이름: ${dummyMetadata.name} (${dummyMetadata.symbol})`);
  console.log(`    현재가: $${dummyMetadata.currentPrice.toLocaleString()}`);
  console.log(`    24h 거래량: $${(dummyMetadata.volume / 1e9).toFixed(2)}B`);
  console.log(`    시가총액: $${(dummyMetadata.marketCap / 1e9).toFixed(2)}B`);
  console.log(`    24h 변동률: ${dummyMetadata.priceChange24h > 0 ? '+' : ''}${dummyMetadata.priceChange24h.toFixed(2)}%`);
  console.log('');
  
  // 테스트 4: 인기 암호화폐 목록 (더미)
  console.log('테스트 4: 인기 암호화폐 목록 (더미)');
  const popularCoins = getPopularCoins();
  console.log('  상위 5개:');
  popularCoins.slice(0, 5).forEach((coin, i) => {
    console.log(`    ${i + 1}. ${coin.name} (${coin.id})`);
  });
  console.log('');
  
  // 테스트 5: CoinGecko API 가용성 확인
  console.log('테스트 5: CoinGecko API 연결 확인');
  try {
    // Windows venv에서 직접 Python 경로 확인
    const venvPython = '.venv\\Scripts\\python.exe';
    const fs = require('fs');
    const useVenv = fs.existsSync(venvPython);
    
    if (useVenv) {
      console.log('  ✓ 가상환경 Python 발견:', venvPython);
      // Python 경로를 변경하여 테스트
      const { spawn } = require('child_process');
      const python = spawn(venvPython, ['-c', 'import pycoingecko; print("OK")']);
      
      let output = '';
      python.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      python.on('close', async (code) => {
        if (code === 0 && output.includes('OK')) {
          console.log('  ✓ pycoingecko 설치 확인');
          
          await runRealAPITests(venvPython);
        } else {
          console.log('  ✗ pycoingecko가 설치되지 않았습니다');
        }
      });
    } else {
      const available = await provider.checkAvailability();
      if (available) {
        console.log('  ✓ CoinGecko API 사용 가능');
        await runRealAPITests('python');
      } else {
        console.log('  ✗ pycoingecko가 설치되지 않았습니다');
        console.log('  → 가상환경 활성화 후: uv pip install -e .');
      }
    }
  } catch (error) {
    console.log(`  ✗ API 확인 실패: ${error.message}`);
  }
  
  console.log('\n=== 테스트 완료 ===');
}

/**
 * 실제 API 테스트 실행
 */
async function runRealAPITests(pythonPath) {
  const provider = new CoinGeckoProvider();
  
  // 테스트 6: 실제 암호화폐 목록 가져오기
  console.log('\n테스트 6: 실제 암호화폐 목록 가져오기');
  try {
    const coinList = await provider.getSupportedCoins();
    console.log(`  ✓ 암호화폐 목록 수신: ${coinList.length}개`);
    console.log('  상위 5개:');
    coinList.slice(0, 5).forEach((coin, i) => {
      console.log(`    ${i + 1}. ${coin.name} (${coin.id})`);
    });
  } catch (error) {
    console.log(`  ✗ 목록 가져오기 실패: ${error.message}`);
  }
  
  // 테스트 7: 실제 비트코인 데이터 가져오기
  console.log('\n테스트 7: 실제 Bitcoin 데이터 가져오기 (7일)');
  try {
    const bitcoinData = await provider.fetchHistoricalData('bitcoin', 'usd', 7);
    console.log(`  ✓ 실제 데이터 수신: ${bitcoinData.data.length}개 포인트`);
    if (bitcoinData.data.length > 0) {
      const latest = bitcoinData.data[bitcoinData.data.length - 1];
      console.log(`  최신 가격: $${latest.price.toLocaleString()}`);
      console.log(`  시간: ${latest.timestamp}`);
    }
  } catch (error) {
    console.log(`  ✗ 데이터 가져오기 실패: ${error.message}`);
  }
  
  // 테스트 8: 실제 현재 가격 가져오기
  console.log('\n테스트 8: 실제 Bitcoin 현재 가격 가져오기');
  try {
    const currentPrice = await provider.getCurrentPrice('bitcoin', 'usd');
    console.log('  ✓ 현재 가격 수신:');
    console.log('  데이터 구조:', currentPrice);
    
    if (typeof currentPrice === 'number') {
      console.log(`    가격: $${currentPrice.toLocaleString()}`);
    } else if (currentPrice && currentPrice.price) {
      console.log(`    가격: $${currentPrice.price.toLocaleString()}`);
      if (currentPrice.market_cap) {
        console.log(`    시가총액: $${(currentPrice.market_cap / 1e9).toFixed(2)}B`);
      }
      if (currentPrice.volume_24h) {
        console.log(`    24h 거래량: $${(currentPrice.volume_24h / 1e9).toFixed(2)}B`);
      }
    } else {
      console.log('    전체 데이터:', JSON.stringify(currentPrice, null, 2));
    }
  } catch (error) {
    console.log(`  ✗ 현재 가격 가져오기 실패: ${error.message}`);
  }
  
  console.log('\n=== 테스트 완료 ===');
}

/**
 * 더미 암호화폐 차트 데이터 생성
 */
function generateDummyCryptoData(coinId, days) {
  const data = [];
  const basePrice = coinId === 'bitcoin' ? 40000 : 2000; // BTC or ETH
  let currentPrice = basePrice;
  
  const now = Date.now();
  
  for (let i = days - 1; i >= 0; i--) {
    const timestamp = now - (i * 24 * 60 * 60 * 1000);
    
    // 암호화폐는 변동성이 크므로 -5% ~ +5%
    const change = (Math.random() - 0.5) * 0.10;
    currentPrice = currentPrice * (1 + change);
    
    const price = parseFloat(currentPrice.toFixed(2));
    const volume = Math.floor(20000000000 + Math.random() * 30000000000);
    
    data.push({
      timestamp: new Date(timestamp).toISOString(),
      price: price,
      volume: volume
    });
  }
  
  return data;
}

/**
 * 더미 암호화폐 메타데이터 생성
 */
function generateDummyCryptoMetadata(coinId) {
  const cryptoData = {
    'bitcoin': {
      name: 'Bitcoin',
      symbol: 'BTC',
      basePrice: 42000,
      marketCap: 820000000000
    },
    'ethereum': {
      name: 'Ethereum',
      symbol: 'ETH',
      basePrice: 2200,
      marketCap: 265000000000
    },
    'ripple': {
      name: 'XRP',
      symbol: 'XRP',
      basePrice: 0.62,
      marketCap: 33000000000
    }
  };
  
  const data = cryptoData[coinId] || {
    name: coinId.charAt(0).toUpperCase() + coinId.slice(1),
    symbol: coinId.substring(0, 3).toUpperCase(),
    basePrice: 100,
    marketCap: 10000000000
  };
  
  const priceChange = (Math.random() - 0.5) * 10; // -5% ~ +5%
  
  return {
    name: data.name,
    symbol: data.symbol,
    currentPrice: data.basePrice * (1 + priceChange / 100),
    volume: Math.floor(20000000000 + Math.random() * 30000000000),
    marketCap: data.marketCap * (1 + priceChange / 100),
    priceChange24h: priceChange,
    high24h: data.basePrice * 1.05,
    low24h: data.basePrice * 0.95,
    ath: data.basePrice * 1.5,
    atl: data.basePrice * 0.3,
    circulatingSupply: data.marketCap / data.basePrice,
    totalSupply: data.marketCap / data.basePrice * 1.2
  };
}

/**
 * 인기 암호화폐 목록 (더미)
 */
function getPopularCoins() {
  return [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
    { id: 'tether', name: 'Tether', symbol: 'USDT' },
    { id: 'binancecoin', name: 'BNB', symbol: 'BNB' },
    { id: 'ripple', name: 'XRP', symbol: 'XRP' },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
    { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE' },
    { id: 'solana', name: 'Solana', symbol: 'SOL' },
    { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
    { id: 'matic-network', name: 'Polygon', symbol: 'MATIC' }
  ];
}

// 테스트 실행
if (require.main === module) {
  testCoinGeckoWithDummy().catch(console.error);
}

module.exports = { 
  generateDummyCryptoData, 
  generateDummyCryptoMetadata,
  getPopularCoins
};
