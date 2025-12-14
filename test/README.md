# Test Suite

This directory contains tests for the Stock Quiz application.

## Running Tests

### Run all tests:
```bash
node test/run_all_tests.js
```

### Run individual tests:

**YFinance Provider Test:**
```bash
node test/test_yfinance_provider.js
```

**Chart Service Test:**
```bash
node test/test_chart_service.js
```

**Quiz Generation Test:**
```bash
node test/test_quiz_generation.js
```

## Prerequisites

Make sure you have installed the Python dependencies:
```bash
pip install -r src/providers/requirements.txt
```

Or use:
```bash
install_requirements.bat
```

## Test Coverage

### test_yfinance_provider.js
- ✓ Check yfinance availability
- ✓ Fetch historical stock data
- ✓ Fetch stock information
- ✓ Get current price
- ✓ Fetch index data (S&P 500)
- ✓ Fetch multiple symbols

### test_chart_service.js
- ✓ Verify yfinance integration
- ✓ Fetch chart data with metadata
- ✓ Get current prices
- ✓ Get metadata only
- ✓ Test different time ranges

### test_quiz_generation.js
- ✓ Generate quiz from real data
- ✓ Get quiz display data
- ✓ Validate correct answers
- ✓ Test answer accuracy scoring
- ✓ Serialize/deserialize quizzes

## Expected Output

Tests will display:
- ✓ for successful operations
- ✗ for failures
- Detailed information about fetched data
- Sample data points from yfinance

## Troubleshooting

**Error: yfinance is NOT available**
- Install Python dependencies: `pip install -r src/providers/requirements.txt`

**Error: Python script failed**
- Make sure Python is in your PATH
- Verify yfinance installation: `python -c "import yfinance; print('OK')"`

**Error: Symbol not found**
- Check that the stock symbol is valid
- Try common symbols: AAPL, GOOGL, MSFT, TSLA
