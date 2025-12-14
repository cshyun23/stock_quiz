# Debug Mode Guide

## Enabling Debug Mode

Debug mode adds detailed logging to track the flow of data through the application.

### Method 1: Environment Variable

Create a `.env` file in the project root:

```bash
DEBUG=true
```

### Method 2: Set in Terminal (Windows)

```powershell
$env:DEBUG="true"
npm run serve
```

### Method 3: Set in Terminal (Linux/Mac)

```bash
export DEBUG=true
npm run serve
```

## What Gets Logged

When debug mode is enabled, you'll see detailed logs for:

### JavaScript Modules:
- **ChartService**: Chart data fetching, price retrieval, metadata processing
- **YFinanceProvider**: Python process spawning, data retrieval for stocks
- **CoinGeckoProvider**: Python process spawning, data retrieval for crypto
- **WebServer**: API endpoint calls, request parameters

### Python Scripts:
- **yfinance_fetcher.py**: Stock data fetching, ticker operations, data processing
- **coingecko_fetcher.py**: Crypto data fetching, API calls, data processing

## Log Format

**JavaScript:**
```
[2025-12-14T10:30:45.123Z] [ModuleName] Message
  Data: { key: "value" }
```

**Python:**
```
[2025-12-14 10:30:45] [ModuleName] Message
```

## Example Output

When fetching stock data with debug enabled:

```
[2025-12-14T10:30:45.123Z] [WebServer] API request: stock chart
  Data: { symbol: "AAPL", timeframe: "3M" }
[2025-12-14T10:30:45.124Z] [ChartService] Fetching chart data for AAPL
  Data: { timeRange: "3M", interval: "1d" }
[2025-12-14T10:30:45.125Z] [YFinanceProvider] Fetching historical data
  Data: { symbol: "AAPL", period: "3mo", interval: "1d" }
[2025-12-14 10:30:45] [YFinanceFetcher] Fetching historical data for AAPL, period=3mo, interval=1d
[2025-12-14 10:30:46] [YFinanceFetcher] Received 63 data points
[2025-12-14T10:30:46.789Z] [ChartService] Received 63 data points for AAPL
```

## Disabling Debug Mode

Set `DEBUG=false` in `.env` or unset the environment variable:

```powershell
# Windows
$env:DEBUG="false"

# Linux/Mac
export DEBUG=false
```

## Performance Impact

Debug mode adds minimal overhead:
- Additional console logging
- JSON stringification for data display
- Recommended to disable in production

## Tips

1. Use debug mode when troubleshooting API issues
2. Check logs when data doesn't load correctly
3. Verify Python scripts are executing properly
4. Monitor request/response flow through the system
