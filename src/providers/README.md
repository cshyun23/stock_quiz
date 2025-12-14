# Data Providers

This module provides stock, index, and cryptocurrency data using Python libraries.

## Providers

### 1. YFinance Provider
Stocks and indices data using the yfinance library.

### 2. CoinGecko Provider
Cryptocurrency data using the pycoingecko library.

## Installation

1. Make sure Python is installed on your system
2. Install required Python packages:

```bash
pip install -r requirements.txt
```

Or use the provided batch file on Windows:
```bash
install_requirements.bat
```

## Usage

### YFinanceProvider (JavaScript - Stocks/Indices)

```javascript
const YFinanceProvider = require('./providers/yfinanceProvider');

const provider = new YFinanceProvider();

// Fetch historical data
const data = await provider.fetchHistoricalData('AAPL', '1mo', '1d');

// Get stock info
const info = await provider.fetchStockInfo('AAPL');

// Get current price
const price = await provider.getCurrentPrice('AAPL');

// Check if yfinance is available
const available = await provider.checkAvailability();
```

### CoinGeckoProvider (JavaScript - Cryptocurrencies)

```javascript
const CoinGeckoProvider = require('./providers/coinGeckoProvider');


**CoinGecko:**
- **Cryptocurrencies**: bitcoin, ethereum, cardano, solana, polkadot, etc.
- Use coin IDs (lowercase), not symbols
const provider = new CoinGeckoProvider();

// Fetch historical data
const data = await provider.fetchHistoricalData('bitcoin', 'usd', 30);

// Get current coin data
const coinData = await provider.fetchCoinData('ethereum', 'usd');

// Get current price
const price = await provider.getCurrentPrice('bitcoin', 'usd');

// Search for coins
const results = await provider.searchCoins('cardano');

// Get supported coins list
const coins = await provider.getSupportedCoins();

// Check if pycoingecko is available
const available = await provider.checkAvailability();
```

### Supported Symbols

**YFinance:**

- **Stocks**: AAPL, GOOGL, MSFT, TSLA, etc.
- **Indices**: ^GSPC (S&P 500), ^DJI (Dow Jones), ^IXIC (NASDAQ), etc.
**YFinance:**
- Periods: `1d`, `5d`, `1mo`, `3mo`, `6mo`, `1y`, `2y`, `5y`, `10y`, `ytd`, `max`
- Intervals: `1m`, `2m`, `5m`, `15m`, `30m`, `60m`, `90m`, `1h`, `1d`, `5d`, `1wk`, `1mo`, `3mo`
- Note: Intraday data (1m, 5m, etc.) is limited to the last 60 days

**CoinGecko:**
- Days: 1, 7, 14, 30, 90, 180, 365, max
- Automatic granularity based on days requested
- VS Currencies: usd, eur, jpy, gbp, aud, cad, etc

- `1m`, `2m`, `5m`, `15m`, `30m`, `60m`, `90m`, `1h`, `1d`, `5d`, `1wk`, `1mo`, `3mo`

Note: Intraday data (1m, 5m, etc.) is limited to the last 60 days.

## Data Format

### Historical Data Response
```json
{
  "symbol": "AAPL",
  "period": "1mo",
  "interval": "1d",
  "data": [
    {
      "timestamp": "2025-11-14T00:00:00",
      "open": 150.25,
      "high": 152.50,
      "low": 149.80,
      "close": 151.20,
      "volume": 75000000
    }
  ]
}
```

### Stock Info Response
```json
{
  "symbol": "AAPL",
  "shortName": "Apple Inc.",
  "currentPrice": 151.20,
  "marketCap": 2400000000000,
  "

### CoinGecko Data Response
```json
{
  "coinId": "bitcoin",
  "vsCurrency": "usd",
  "currentPrice": 42000.50,
  "name": "Bitcoin",
  "symbol": "BTC",
  "marketCap": 820000000000,
  "volume24h": 28000000000,
  "change24h": 2.5,
  "high24h": 42500.00,
  "low24h": 41000.00,
  "ath": 69000.00,
  "atl": 67.81,
  "circulatingSupply": 19500000,
  "totalSupply": 21000000
}
```volume": 75000000,
  "dayHigh": 152.50,
  "dayLow": 149.80,
  "fiftyTwoWeekHigh": 180.00,
  "fiftyTwoWeekLow": 120.00
}
```
