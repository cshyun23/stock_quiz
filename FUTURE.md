# Future Database Migration Plan

## 개요
현재 시스템은 localStorage를 사용하여 클라이언트 측에 데이터를 저장하고 있습니다. 
사용자가 급증할 경우, 중앙화된 데이터베이스로 마이그레이션하여 다음과 같은 이점을 얻을 수 있습니다:
- 사용자 간 데이터 공유 및 리더보드 기능
- 데이터 백업 및 복구
- 고급 통계 및 분석
- 확장 가능한 아키텍처

---

## 1. 현재 데이터 구조 분석

### 1.1 캐시 데이터 (temp/ 폴더)
**현재 저장 위치**: 서버 파일 시스템 (`temp/` 폴더)
**저장 형식**: JSON 파일
**데이터 예시**:
```json
// stock_AAPL_2Y.json
{
  "chartData": {
    "data": [
      { "timestamp": "2023-01-01", "open": 130, "high": 135, "low": 128, "close": 133, "volume": 1000000 }
    ]
  },
  "metadata": { ... },
  "cachedAt": "2025-12-28T10:00:00.000Z"
}
```

**DB 마이그레이션 시 고려사항**:
- ✅ **DB에 저장 권장**: API 호출 비용 절감 (yfinance, CoinGecko rate limit)
- ✅ TTL 기반 자동 만료 (24시간)
- ⚠️ 용량 이슈: 차트 데이터는 대용량일 수 있음 (압축 고려)

---

### 1.2 사용자 누적 통계
**현재 저장 위치**: 클라이언트 localStorage (`quizCumulativeStats`)
**저장 형식**: JSON 객체

**데이터 구조**:
```json
{
  "totalQuizzes": 25,
  "wins": 15,
  "losses": 10,
  "totalProfitLoss": 1250.50,
  "totalProfitLossPercent": 125.5,
  "bestTrade": {
    "profitLoss": 500.00,
    "profitLossPercent": 50.00,
    "symbol": "AAPL",
    "date": "2025-12-20T10:00:00.000Z"
  },
  "worstTrade": {
    "profitLoss": -200.00,
    "profitLossPercent": -20.00,
    "symbol": "TSLA",
    "date": "2025-12-15T10:00:00.000Z"
  },
  "avgHoldingDays": 5.2,
  "totalHoldingDays": 130,
  "firstQuizDate": "2025-12-01T10:00:00.000Z"
}
```

**DB 마이그레이션 시 고려사항**:
- ✅ **DB에 저장 필수**: 사용자별 통계 추적
- ✅ 사용자 인증 시스템과 연동 필요
- ✅ 실시간 업데이트 및 동기화

---

### 1.3 대시보드 데이터
**현재 저장 위치**: 클라이언트 localStorage (`tradingDashboard`)
**저장 형식**: JSON 배열

**데이터 구조**:
```json
[
  {
    "id": "Alice",
    "savedAt": "2025-12-28T10:00:00.000Z",
    "startDate": "2025-12-01T10:00:00.000Z",
    "periodDays": 27,
    "totalQuizzes": 50,
    "wins": 32,
    "losses": 18,
    "winRate": 64.0,
    "totalProfitLoss": 2500.75,
    "totalProfitLossPercent": 250.75,
    "avgProfitLossPercent": 5.015,
    "avgHoldingDays": 6.5,
    "bestTrade": { ... },
    "worstTrade": { ... },
    "profitPerDay": 92.62
  }
]
```

**DB 마이그레이션 시 고려사항**:
- ✅ **DB에 저장 필수**: 글로벌 리더보드
- ✅ 순위 계산 및 정렬 최적화 (인덱싱)
- ✅ 사용자별 다중 스냅샷 지원

---

### 1.4 개별 퀴즈 기록 (현재 미저장)
**현재 상태**: ❌ 저장되지 않음 (휘발성)
**저장 권장**: ✅ **향후 DB에 저장 필수**

**제안 데이터 구조**:
```json
{
  "quizId": "uuid-v4",
  "userId": "user123",
  "assetType": "stock",
  "symbol": "AAPL",
  "startDate": "2025-12-28T10:00:00.000Z",
  "completedAt": "2025-12-28T10:15:00.000Z",
  "cutoffDate": "2024-08-15T00:00:00.000Z",
  "entryPrice": 180.50,
  "exitPrice": 195.25,
  "takeProfitTarget": 200.00,
  "stopLossTarget": 170.00,
  "maxDaysToHold": 15,
  "actualDaysHeld": 8,
  "exitReason": "Profit Target Reached",
  "profitLoss": 14.75,
  "profitLossPercent": 8.17,
  "highestPrice": 196.00,
  "lowestPrice": 178.00,
  "riskRewardRatio": 1.5,
  "metadata": {
    "chartDataPoints": 180,
    "hiddenDataPoints": 30
  }
}
```

**활용 가치**:
- 📊 상세한 거래 히스토리 분석
- 🔍 패턴 분석 (어떤 심볼이 가장 많이 선택되는지)
- 📈 시간대별 성과 분석
- 🏆 베스트 트레이드 상세 보기

---

## 2. 권장 데이터베이스 스키마

### 2.1 Users 테이블
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  INDEX idx_username (username),
  INDEX idx_created_at (created_at)
);
```

**필드 설명**:
- `id`: 고유 사용자 식별자
- `username`: 대시보드에 표시될 닉네임
- `email`: (선택) 이메일 기반 인증
- `created_at`: 가입 날짜
- `last_login`: 마지막 로그인 시간

---

### 2.2 Quiz_Records 테이블 (핵심)
```sql
CREATE TABLE quiz_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('stock', 'crypto')),
  symbol VARCHAR(50) NOT NULL,
  
  -- 시간 정보
  created_at TIMESTAMP DEFAULT NOW(),
  cutoff_date TIMESTAMP NOT NULL,
  
  -- 거래 정보
  entry_price DECIMAL(18, 8) NOT NULL,
  exit_price DECIMAL(18, 8) NOT NULL,
  take_profit_target DECIMAL(18, 8) NOT NULL,
  stop_loss_target DECIMAL(18, 8) NOT NULL,
  max_days_to_hold INTEGER NOT NULL,
  actual_days_held INTEGER NOT NULL,
  exit_reason VARCHAR(100) NOT NULL,
  
  -- 성과 지표
  profit_loss DECIMAL(18, 8) NOT NULL,
  profit_loss_percent DECIMAL(10, 4) NOT NULL,
  highest_price DECIMAL(18, 8) NOT NULL,
  lowest_price DECIMAL(18, 8) NOT NULL,
  risk_reward_ratio DECIMAL(10, 4),
  
  -- 메타데이터
  chart_data_points INTEGER,
  hidden_data_points INTEGER,
  
  INDEX idx_user_id (user_id),
  INDEX idx_symbol (symbol),
  INDEX idx_created_at (created_at),
  INDEX idx_profit_loss (profit_loss),
  INDEX idx_asset_type (asset_type)
);
```

**활용 쿼리 예시**:
```sql
-- 사용자별 총 수익
SELECT user_id, SUM(profit_loss) as total_profit
FROM quiz_records
GROUP BY user_id
ORDER BY total_profit DESC;

-- 심볼별 평균 수익률
SELECT symbol, AVG(profit_loss_percent) as avg_return
FROM quiz_records
WHERE asset_type = 'stock'
GROUP BY symbol
ORDER BY avg_return DESC
LIMIT 10;

-- 월별 거래 수 추이
SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as quiz_count
FROM quiz_records
GROUP BY month
ORDER BY month DESC;
```

---

### 2.3 User_Statistics 테이블 (집계 테이블)
```sql
CREATE TABLE user_statistics (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  
  -- 기본 통계
  total_quizzes INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  win_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE WHEN total_quizzes > 0 
    THEN (wins::DECIMAL / total_quizzes * 100) 
    ELSE 0 END
  ) STORED,
  
  -- 수익 통계
  total_profit_loss DECIMAL(18, 8) DEFAULT 0,
  total_profit_loss_percent DECIMAL(18, 8) DEFAULT 0,
  avg_profit_loss_percent DECIMAL(10, 4),
  
  -- 보유 기간 통계
  avg_holding_days DECIMAL(10, 2),
  total_holding_days INTEGER DEFAULT 0,
  
  -- 베스트/워스트
  best_trade_profit DECIMAL(18, 8),
  best_trade_symbol VARCHAR(50),
  best_trade_date TIMESTAMP,
  worst_trade_loss DECIMAL(18, 8),
  worst_trade_symbol VARCHAR(50),
  worst_trade_date TIMESTAMP,
  
  -- 시간 정보
  first_quiz_date TIMESTAMP,
  last_quiz_date TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_total_profit_loss (total_profit_loss),
  INDEX idx_win_rate (win_rate)
);
```

**업데이트 전략**:
- Quiz 완료 시마다 트리거로 자동 업데이트
- 또는 배치 작업으로 주기적 재계산
- 읽기 성능 최적화 (대시보드 로딩 속도 향상)

---

### 2.4 Cache_Data 테이블
```sql
CREATE TABLE cache_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  asset_type VARCHAR(20) NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  timeframe VARCHAR(10) NOT NULL,
  
  -- 캐시 데이터 (JSONB for PostgreSQL)
  chart_data JSONB NOT NULL,
  metadata JSONB,
  
  -- TTL 관리
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  
  -- 성능 모니터링
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP,
  
  INDEX idx_cache_key (cache_key),
  INDEX idx_expires_at (expires_at),
  INDEX idx_symbol_timeframe (symbol, timeframe)
);
```

**자동 만료 설정**:
```sql
-- PostgreSQL: 만료된 캐시 자동 삭제 (크론 작업)
DELETE FROM cache_data WHERE expires_at < NOW();
```

**활용 장점**:
- 🚀 API 호출 최소화
- 📊 캐시 히트율 모니터링
- 🔄 인기 심볼 우선 캐싱 전략

---

### 2.5 Dashboard_Snapshots 테이블
```sql
CREATE TABLE dashboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  snapshot_name VARCHAR(100),
  
  -- 기간 정보
  period_start_date TIMESTAMP NOT NULL,
  period_end_date TIMESTAMP NOT NULL,
  period_days INTEGER GENERATED ALWAYS AS (
    EXTRACT(DAY FROM period_end_date - period_start_date)
  ) STORED,
  
  -- 통계 스냅샷
  total_quizzes INTEGER NOT NULL,
  wins INTEGER NOT NULL,
  losses INTEGER NOT NULL,
  win_rate DECIMAL(5, 2) NOT NULL,
  total_profit_loss DECIMAL(18, 8) NOT NULL,
  avg_profit_loss_percent DECIMAL(10, 4) NOT NULL,
  profit_per_day DECIMAL(18, 8) NOT NULL,
  avg_holding_days DECIMAL(10, 2) NOT NULL,
  
  -- 베스트/워스트 트레이드
  best_trade_info JSONB,
  worst_trade_info JSONB,
  
  -- 메타데이터
  created_at TIMESTAMP DEFAULT NOW(),
  is_public BOOLEAN DEFAULT TRUE,
  
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_total_profit_loss (total_profit_loss)
);
```

**용도**:
- 📸 특정 시점의 성과 저장
- 🏆 시즌별 리더보드
- 📈 성장 추이 비교

---

## 3. 데이터베이스 선택 가이드

### 3.1 PostgreSQL (권장 ⭐)
**장점**:
- ✅ JSONB 타입으로 유연한 데이터 저장
- ✅ 복잡한 쿼리 및 집계 성능 우수
- ✅ 트리거, 함수로 자동화 가능
- ✅ 성숙한 생태계 및 도구

**단점**:
- ⚠️ 설치 및 관리 복잡도
- ⚠️ 수평 확장 제한적

**추천 시나리오**: 수만~수십만 사용자 규모

---

### 3.2 MongoDB (NoSQL 대안)
**장점**:
- ✅ JSON 네이티브 저장
- ✅ 스키마 유연성
- ✅ 수평 확장 용이

**단점**:
- ⚠️ 복잡한 JOIN 쿼리 불편
- ⚠️ 트랜잭션 지원 제한적

**추천 시나리오**: 매우 빠른 확장이 예상되는 경우

---

### 3.3 Redis (캐시 레이어)
**용도**: Cache_Data를 위한 추가 레이어
**장점**:
- ⚡ 초고속 읽기/쓰기
- ✅ TTL 네이티브 지원
- ✅ 인메모리 성능

**권장 구조**:
```
PostgreSQL (영구 데이터) 
    ↓
Redis (24시간 캐시)
    ↓
Client
```

---

## 4. API 엔드포인트 설계 (향후)

### 4.1 인증 API
```
POST   /api/auth/register        - 회원가입
POST   /api/auth/login           - 로그인
POST   /api/auth/logout          - 로그아웃
GET    /api/auth/me              - 현재 사용자 정보
```

### 4.2 퀴즈 API
```
POST   /api/quiz/start           - 퀴즈 시작 (차트 데이터 로드)
POST   /api/quiz/submit          - 퀴즈 제출 (결과 저장)
GET    /api/quiz/history         - 사용자 퀴즈 히스토리
GET    /api/quiz/:id             - 특정 퀴즈 상세 보기
```

### 4.3 통계 API
```
GET    /api/stats/user/:userId   - 사용자 누적 통계
GET    /api/stats/leaderboard    - 전체 리더보드
GET    /api/stats/trends         - 심볼별/시간별 트렌드
```

### 4.4 대시보드 API
```
POST   /api/dashboard/snapshot   - 스냅샷 저장
GET    /api/dashboard/list       - 스냅샷 목록
DELETE /api/dashboard/:id        - 스냅샷 삭제
GET    /api/dashboard/compare    - 스냅샷 비교
```

---

## 5. 마이그레이션 로드맵

### Phase 1: 기본 인프라 (1-2주)
- [ ] 데이터베이스 선택 및 설치 (PostgreSQL 권장)
- [ ] 사용자 인증 시스템 구축
- [ ] 기본 테이블 생성 (Users, Quiz_Records)

### Phase 2: 코어 기능 마이그레이션 (2-3주)
- [ ] 퀴즈 제출 시 DB 저장 로직 추가
- [ ] 사용자 통계 자동 집계 (트리거/배치)
- [ ] 캐시 시스템을 DB로 이관

### Phase 3: 고급 기능 (3-4주)
- [ ] 리더보드 구현
- [ ] 상세 통계 및 분석 대시보드
- [ ] 스냅샷 비교 기능

### Phase 4: 최적화 (2-3주)
- [ ] Redis 캐시 레이어 추가
- [ ] 쿼리 최적화 및 인덱싱
- [ ] 성능 모니터링 도구 통합

---

## 6. 예상 데이터 볼륨 및 비용

### 소규모 (1,000 사용자)
- Quiz_Records: ~50,000 rows (50 quizzes/user)
- Cache_Data: ~500 entries
- 저장 공간: ~500 MB
- **추천**: PostgreSQL 단일 인스턴스

### 중규모 (10,000 사용자)
- Quiz_Records: ~500,000 rows
- Cache_Data: ~2,000 entries
- 저장 공간: ~5 GB
- **추천**: PostgreSQL + Redis 캐시

### 대규모 (100,000+ 사용자)
- Quiz_Records: 5M+ rows
- Cache_Data: ~20,000 entries
- 저장 공간: ~50+ GB
- **추천**: PostgreSQL 클러스터 + Redis + CDN

---

## 7. 보안 고려사항

### 7.1 필수 보안 조치
- 🔐 **비밀번호 해싱**: bcrypt 또는 Argon2 사용
- 🎫 **JWT 토큰**: 인증 토큰 만료 시간 설정
- 🛡️ **SQL Injection 방지**: Prepared Statements 사용
- 🔒 **HTTPS**: 모든 통신 암호화
- 📝 **Rate Limiting**: API 남용 방지

### 7.2 데이터 프라이버시
- 개인 식별 정보(PII) 최소화
- GDPR 준수 (유럽 사용자)
- 사용자 데이터 삭제 요청 처리 메커니즘

---

## 8. 백업 및 복구 전략

### 8.1 백업 계획
```bash
# 일일 자동 백업 (PostgreSQL)
pg_dump -U username -d stock_quiz > backup_$(date +%Y%m%d).sql

# 주간 전체 백업 + S3 업로드
pg_dump -U username -d stock_quiz | gzip | aws s3 cp - s3://backups/weekly/
```

### 8.2 복구 테스트
- 월 1회 복구 테스트 실시
- RPO (Recovery Point Objective): 1시간
- RTO (Recovery Time Objective): 4시간

---

## 9. 모니터링 지표

### 9.1 데이터베이스 모니터링
- 쿼리 실행 시간 (avg, p95, p99)
- 커넥션 풀 사용률
- 테이블 크기 증가율
- 인덱스 효율성

### 9.2 애플리케이션 모니터링
- API 응답 시간
- 퀴즈 완료율
- 캐시 히트율
- 일일 활성 사용자 (DAU)

### 9.3 추천 도구
- **PostgreSQL**: pgAdmin, DataGrip
- **모니터링**: Grafana + Prometheus
- **로깅**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **APM**: New Relic 또는 Datadog

---

## 10. 결론 및 우선순위

### 최우선 저장 데이터 (P0)
1. ✅ **Quiz_Records**: 모든 퀴즈 상세 기록
2. ✅ **User_Statistics**: 사용자별 집계 통계
3. ✅ **Users**: 기본 사용자 정보

### 중요 데이터 (P1)
4. ✅ **Cache_Data**: API 호출 비용 절감
5. ✅ **Dashboard_Snapshots**: 리더보드 및 비교

### 선택적 데이터 (P2)
6. ⚪ 사용자 활동 로그
7. ⚪ A/B 테스트 데이터
8. ⚪ 추천 알고리즘 학습 데이터

### 최종 권장사항
> **PostgreSQL + Redis + 클라우드 호스팅 (AWS RDS/DigitalOcean)**
> 
> 이 조합은 비용 대비 성능이 우수하며, 수만 명의 동시 사용자를 무리 없이 처리할 수 있습니다.

---

## 11. 비동기 처리 및 병렬화 최적화

### 11.1 현재 코드의 비효율적인 부분 분석

#### 🐌 문제점 1: 순차적 API 호출 (Stock API)
**현재 코드** (`src/web/server.js:65-68`):
```javascript
// 순차 실행 - 비효율적!
const chartData = await this.chartService.fetchChartData(symbol, timeframe, '1d');
const stockInfo = await this.chartService.yfinance.fetchStockInfo(symbol);
```

**문제**:
- `fetchChartData` 완료를 기다린 후 `fetchStockInfo` 실행
- 두 API 호출이 독립적임에도 순차 실행
- 총 대기 시간 = API1 시간 + API2 시간

**예상 시간**:
- `fetchChartData`: ~2초
- `fetchStockInfo`: ~1.5초
- **총 소요 시간**: ~3.5초 ❌

---

#### ✅ 해결책 1: Promise.all로 병렬 실행
```javascript
// 병렬 실행 - 효율적!
const [chartData, stockInfo] = await Promise.all([
  this.chartService.fetchChartData(symbol, timeframe, '1d'),
  this.chartService.yfinance.fetchStockInfo(symbol)
]);
```

**개선 효과**:
- 두 API 호출을 동시에 실행
- 총 대기 시간 = max(API1 시간, API2 시간)
- **총 소요 시간**: ~2초 ✅
- **성능 향상**: ~43% 단축

---

#### 🐌 문제점 2: 순차적 API 호출 (Crypto API)
**현재 코드** (`src/web/server.js:175-176`):
```javascript
// 순차 실행
chartData = await this.coinGeckoProvider.fetchHistoricalData(coinId, 'usd', days);
coinData = await this.coinGeckoProvider.fetchCoinData(coinId, 'usd');
```

**문제**: Stock API와 동일한 순차 실행 문제

---

#### ✅ 해결책 2: Crypto API 병렬화
```javascript
const [chartData, coinData] = await Promise.all([
  this.coinGeckoProvider.fetchHistoricalData(coinId, 'usd', days),
  this.coinGeckoProvider.fetchCoinData(coinId, 'usd')
]);
```

**개선 효과**:
- **성능 향상**: ~40% 단축

---

#### 🐌 문제점 3: 차트 렌더링 순차 실행 (Frontend)
**현재 코드** (`src/web/public/app.js:298-299`, `687-688`):
```javascript
// 순차 렌더링
this.renderPriceChart(data);
this.renderVolumeChart(data);
```

**문제**:
- Price Chart 렌더링 완료 후 Volume Chart 렌더링 시작
- 두 차트는 독립적이며 동시 렌더링 가능

**예상 시간**:
- `renderPriceChart`: ~300ms
- `renderVolumeChart`: ~150ms
- **총 소요 시간**: ~450ms ❌

---

#### ✅ 해결책 3: 차트 병렬 렌더링
```javascript
// 병렬 렌더링
await Promise.all([
  this.renderPriceChart(data),
  this.renderVolumeChart(data)
]);
```

**개선 효과**:
- **총 소요 시간**: ~300ms ✅
- **성능 향상**: ~33% 단축
- 사용자 체감 응답성 대폭 향상

---

#### 🐌 문제점 4: 대시보드 렌더링 시 반복적 DOM 접근
**현재 코드** (`src/web/public/app.js:1000-1030`):
```javascript
// 반복문 내부에서 DOM 조작
data.forEach((entry, index) => {
  html += `<tr>...</tr>`; // 문자열 연결
});
dashboardList.innerHTML = html; // 단일 DOM 업데이트
```

**현재는 최적화되어 있지만**, 대규모 데이터(1000+ 엔트리) 시 고려사항:
- 가상 스크롤링 (Virtual Scrolling) 도입
- 페이지네이션
- 데이터 청킹 (Chunking)

---

#### 🐌 문제점 5: 캐시 파일 I/O 순차 처리
**현재 코드** (`src/utils/cache.js`):
```javascript
// 파일 읽기/쓰기 동기 처리
const data = fs.readFileSync(filePath, 'utf8');
fs.writeFileSync(filePath, JSON.stringify(data));
```

**문제**:
- 동기 I/O는 Node.js 이벤트 루프를 블로킹
- 다른 요청 처리 지연 발생

---

#### ✅ 해결책 5: 비동기 I/O로 전환
```javascript
// 비동기 I/O
const fs = require('fs').promises;

async loadCache(cacheKey) {
  const filePath = this.getCacheFilePath(cacheKey);
  if (!fs.existsSync(filePath)) return null;
  
  const data = await fs.readFile(filePath, 'utf8');
  return JSON.parse(data);
}

async saveCache(cacheKey, data) {
  const filePath = this.getCacheFilePath(cacheKey);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}
```

**개선 효과**:
- 이벤트 루프 블로킹 제거
- 동시 요청 처리 능력 향상
- 서버 응답성 개선

---

### 11.2 최적화된 코드 예시

#### Stock API 최적화 버전
```javascript
// src/web/server.js - 최적화 버전
this.app.get('/api/chart/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '2Y' } = req.query;
    
    // 1. 캐시 체크
    const cacheKey = this.cache.getCacheKey('stock', symbol, timeframe);
    const cachedData = await this.cache.loadCache(cacheKey); // 비동기 I/O
    
    let allData, stockInfo;
    
    if (cachedData) {
      allData = cachedData.allData;
      stockInfo = cachedData.stockInfo;
    } else {
      // 2. 병렬 API 호출 ⚡
      const [chartData, stockInfoData] = await Promise.all([
        this.chartService.fetchChartData(symbol, timeframe, '1d'),
        this.chartService.yfinance.fetchStockInfo(symbol)
      ]);
      
      if (!chartData.data || chartData.data.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'No data available' 
        });
      }
      
      allData = chartData.data;
      stockInfo = stockInfoData;
      
      // 3. 비동기 캐시 저장 (응답 블로킹하지 않음)
      this.cache.saveCache(cacheKey, {
        allData,
        stockInfo,
        metadata: chartData.metadata
      }).catch(err => console.error('Cache save error:', err));
    }
    
    // ... 나머지 로직
    
    res.json({ success: true, data: visibleData, ... });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

**개선 사항**:
- ✅ Promise.all로 API 병렬 호출
- ✅ 비동기 캐시 I/O
- ✅ 캐시 저장을 응답과 분리 (fire-and-forget)

---

#### Frontend 차트 렌더링 최적화
```javascript
// src/web/public/app.js - 최적화 버전
async displayChartData(data, metadata) {
  this.currentData = data;
  this.currentMetadata = metadata;
  
  // 병렬 차트 렌더링 ⚡
  await Promise.all([
    this.renderPriceChart(data),
    this.renderVolumeChart(data)
  ]);
  
  // 메타데이터 업데이트는 차트 렌더링 후
  this.updateMetadata(metadata);
  
  // UI 표시
  document.getElementById('chart-display').classList.remove('hidden');
}

// 차트 렌더링 함수를 Promise 반환하도록 수정
renderPriceChart(data, profitPrice = null, stopLossPrice = null) {
  return new Promise((resolve) => {
    // 차트 생성 로직
    if (this.priceChart) {
      this.priceChart.destroy();
    }
    
    // ... Chart.js 설정
    
    this.priceChart = new Chart(ctx, config);
    
    // 렌더링 완료 후 resolve
    requestAnimationFrame(() => resolve());
  });
}
```

---

### 11.3 대량 데이터 처리 최적화

#### 시나리오: 여러 심볼 동시 로드
**사용 사례**: 대시보드에서 여러 사용자의 최근 거래 차트 미리보기

**현재 방식** (순차 실행):
```javascript
// ❌ 비효율적
for (const symbol of symbols) {
  const data = await fetchChartData(symbol);
  renderPreview(data);
}
// 10개 심볼 × 2초 = 20초 소요
```

**최적화 방식** (병렬 실행 + 배치 처리):
```javascript
// ✅ 효율적
const BATCH_SIZE = 5; // 동시 요청 제한

async function fetchMultipleCharts(symbols) {
  const results = [];
  
  // 배치로 나누어 처리
  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    const batch = symbols.slice(i, i + BATCH_SIZE);
    
    // 배치 내에서 병렬 실행
    const batchResults = await Promise.allSettled(
      batch.map(symbol => fetchChartData(symbol))
    );
    
    results.push(...batchResults);
  }
  
  // 성공한 데이터만 필터링
  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
}

// 10개 심볼 ÷ 5개 배치 × 2초 = 4초 소요 (5배 향상!)
```

**개선 효과**:
- API rate limit 준수 (CoinGecko: 50 calls/min)
- 에러 핸들링 개선 (Promise.allSettled)
- **성능 향상**: ~80% 단축

---

### 11.4 실시간 데이터 업데이트 (WebSocket)

#### 현재 한계
- 폴링 방식: 주기적으로 API 호출
- 불필요한 네트워크 트래픽
- 실시간성 부족

#### WebSocket 도입 제안
```javascript
// 서버 측 (WebSocket)
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const { type, symbol } = JSON.parse(message);
    
    if (type === 'subscribe') {
      // 실시간 가격 구독
      subscribeToPrice(symbol, (priceUpdate) => {
        ws.send(JSON.stringify({
          type: 'price_update',
          symbol,
          price: priceUpdate.price,
          timestamp: Date.now()
        }));
      });
    }
  });
});
```

```javascript
// 클라이언트 측
const ws = new WebSocket('ws://localhost:8080');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'price_update') {
    updatePriceDisplay(data.symbol, data.price);
  }
};

// 심볼 구독
ws.send(JSON.stringify({
  type: 'subscribe',
  symbol: 'AAPL'
}));
```

**활용 사례**:
- 실시간 가격 업데이트
- 퀴즈 리더보드 실시간 갱신
- 사용자 활동 알림

---

### 11.5 데이터베이스 쿼리 최적화 (향후)

#### N+1 쿼리 문제 방지
**나쁜 예**:
```javascript
// ❌ N+1 쿼리 문제
const users = await db.query('SELECT * FROM users');
for (const user of users) {
  const stats = await db.query('SELECT * FROM user_statistics WHERE user_id = ?', [user.id]);
  user.stats = stats;
}
// 사용자 100명 = 101번의 쿼리
```

**좋은 예**:
```javascript
// ✅ JOIN으로 단일 쿼리
const usersWithStats = await db.query(`
  SELECT u.*, s.* 
  FROM users u
  LEFT JOIN user_statistics s ON u.id = s.user_id
`);
// 단 1번의 쿼리
```

---

#### 배치 삽입 최적화
**나쁜 예**:
```javascript
// ❌ 개별 삽입
for (const quiz of quizzes) {
  await db.query('INSERT INTO quiz_records (...) VALUES (?)', [quiz]);
}
// 100개 퀴즈 = 100번의 INSERT
```

**좋은 예**:
```javascript
// ✅ 배치 삽입
const values = quizzes.map(q => [q.userId, q.symbol, q.profitLoss]);
await db.query(`
  INSERT INTO quiz_records (user_id, symbol, profit_loss) 
  VALUES ?
`, [values]);
// 100개 퀴즈 = 1번의 INSERT (100배 향상!)
```

---

### 11.6 캐싱 전략 고도화

#### 다층 캐싱 구조
```
┌─────────────────┐
│  Client Cache   │ ← localStorage (즉시 응답)
│  (localStorage) │
└────────┬────────┘
         │ miss
┌────────▼────────┐
│  Redis Cache    │ ← 인메모리 (~5ms)
│  (In-Memory)    │
└────────┬────────┘
         │ miss
┌────────▼────────┐
│   PostgreSQL    │ ← 디스크 (~50ms)
│  (Persistent)   │
└────────┬────────┘
         │ miss
┌────────▼────────┐
│  External API   │ ← yfinance, CoinGecko (~2000ms)
│  (yfinance/CG)  │
└─────────────────┘
```

**구현 예시**:
```javascript
async function getCachedChartData(symbol, timeframe) {
  // L1: Client Cache (localStorage)
  let data = localStorage.getItem(`chart_${symbol}_${timeframe}`);
  if (data) return JSON.parse(data);
  
  // L2: Redis Cache
  data = await redis.get(`chart:${symbol}:${timeframe}`);
  if (data) {
    localStorage.setItem(`chart_${symbol}_${timeframe}`, data);
    return JSON.parse(data);
  }
  
  // L3: PostgreSQL
  data = await db.query('SELECT * FROM cache_data WHERE cache_key = ?', [key]);
  if (data) {
    await redis.setex(`chart:${symbol}:${timeframe}`, 3600, JSON.stringify(data));
    return data;
  }
  
  // L4: External API
  data = await fetchFromExternalAPI(symbol, timeframe);
  
  // 역방향 캐싱
  await db.query('INSERT INTO cache_data ...', [data]);
  await redis.setex(`chart:${symbol}:${timeframe}`, 3600, JSON.stringify(data));
  localStorage.setItem(`chart_${symbol}_${timeframe}`, JSON.stringify(data));
  
  return data;
}
```

---

### 11.7 성능 측정 및 모니터링

#### 성능 메트릭 추적
```javascript
// 성능 측정 미들웨어
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${duration}ms`);
    
    // 메트릭 수집 (Prometheus, DataDog 등)
    metrics.recordApiLatency(req.route.path, duration);
  });
  
  next();
});
```

#### 프론트엔드 성능 모니터링
```javascript
// Performance API 활용
const perfObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'measure') {
      console.log(`${entry.name}: ${entry.duration}ms`);
    }
  }
});

perfObserver.observe({ entryTypes: ['measure'] });

// 측정 시작
performance.mark('chart-render-start');

// 차트 렌더링
renderChart(data);

// 측정 종료
performance.mark('chart-render-end');
performance.measure('chart-render', 'chart-render-start', 'chart-render-end');
```

---

### 11.8 최적화 우선순위 및 예상 효과

| 우선순위 | 최적화 항목 | 난이도 | 예상 개선 | 구현 시간 |
|---------|------------|--------|----------|----------|
| **P0** | API 호출 병렬화 | 낮음 | 40-50% | 2시간 |
| **P0** | 비동기 파일 I/O | 낮음 | 30-40% | 3시간 |
| **P1** | 차트 병렬 렌더링 | 낮음 | 20-30% | 2시간 |
| **P1** | 캐시 전략 고도화 | 중간 | 50-70% | 1주 |
| **P2** | WebSocket 실시간 | 높음 | 사용자 경험 향상 | 2주 |
| **P2** | DB 쿼리 최적화 | 중간 | 60-80% | 1주 |
| **P3** | 배치 처리 시스템 | 높음 | 확장성 향상 | 2주 |

**즉시 적용 가능 (Quick Wins)**:
1. ✅ API 병렬 호출 (Promise.all)
2. ✅ 비동기 I/O 전환 (fs.promises)
3. ✅ 차트 병렬 렌더링

**예상 총 개선 효과**:
- **API 응답 시간**: 3.5초 → 2초 (**43% 개선**)
- **페이지 로딩 시간**: 4초 → 2.5초 (**37% 개선**)
- **동시 사용자 처리**: 100명 → 300명 (**200% 향상**)

---

### 11.9 코드 리팩토링 체크리스트

#### 백엔드 최적화
- [ ] Stock API: Promise.all로 병렬 호출
- [ ] Crypto API: Promise.all로 병렬 호출
- [ ] Cache I/O: fs.promises로 비동기 전환
- [ ] Error handling: Promise.allSettled 활용
- [ ] 응답 스트리밍: 대용량 데이터는 스트리밍으로 전송

#### 프론트엔드 최적화
- [ ] 차트 렌더링: 병렬 처리
- [ ] 대시보드: 가상 스크롤링 도입
- [ ] 이미지 로딩: Lazy loading
- [ ] 번들 최적화: Code splitting
- [ ] Web Workers: 무거운 계산 작업 분리

#### 데이터베이스 최적화 (향후)
- [ ] 인덱싱: 자주 조회되는 컬럼
- [ ] JOIN 최적화: N+1 쿼리 제거
- [ ] 배치 삽입: 대량 데이터 처리
- [ ] Connection pooling: 커넥션 재사용
- [ ] Read replica: 읽기 부하 분산

---

**작성일**: 2025-12-28  
**버전**: 1.0  
**작성자**: Stock Quiz Development Team
