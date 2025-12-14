# Pre-Flight Checklist

Run this checklist before starting the server to ensure everything is set up correctly.

## ✅ Checklist

### 1. Node.js Dependencies

```bash
npm install
```

**Expected output:**
```
added X packages
```

**Verify:**
```bash
npm list express
```

Should show `express@4.18.2` or similar.

### 2. Python Environment

```bash
# Create virtual environment
uv venv

# Activate (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Verify activation - prompt should show (.venv)
```

### 3. Python Dependencies

```bash
# Install dependencies
uv pip install -e .

# Verify
python -c "import yfinance; import pycoingecko; import pandas; import numpy; print('✓ All Python packages installed')"
```

**Expected output:**
```
✓ All Python packages installed
```

### 4. Environment Configuration (Optional)

```bash
# Copy template
cp .env.example .env

# Edit if needed (optional)
```

### 5. Test the Setup

```bash
npm test
```

**All tests should pass:**
```
=== Testing YFinance Provider ===
✓ yfinance is available
✓ Successfully fetched data
...
=== All Tests Complete ===
```

### 6. Start the Server

```bash
npm run serve
```

**Expected output:**
```
Web Server running at http://localhost:3000
Available endpoints:
  GET /api/chart/stock/:symbol?timeframe=3M
  GET /api/chart/crypto/:coinId?timeframe=3M
```

### 7. Test in Browser

Open: http://localhost:3000

**Try:**
1. Select "Stock", enter "AAPL", click "Load Chart"
2. Select "Cryptocurrency", enter "bitcoin", click "Load Chart"

## Common Issues

### Issue: `npm: command not found`
**Solution:** Install Node.js from https://nodejs.org/

### Issue: `uv: command not found`
**Solution:** 
```bash
pip install uv
```

### Issue: Python import errors
**Solution:**
```bash
# Make sure virtual environment is activated
.venv\Scripts\Activate.ps1

# Reinstall
uv pip install -e .
```

### Issue: `ModuleNotFoundError: No module named 'yfinance'`
**Solution:**
```bash
# Activate venv first!
.venv\Scripts\Activate.ps1
uv pip install yfinance pycoingecko pandas numpy
```

### Issue: Port 3000 already in use
**Solution:**
```bash
# Use different port
PORT=3001 npm run serve
```

### Issue: Charts not loading
**Solution:**
1. Check browser console for errors (F12)
2. Verify Python venv is activated
3. Enable debug mode: `DEBUG=true npm run serve`
4. Check network connection

## Quick Commands Reference

```bash
# Install everything
npm install
uv venv
.venv\Scripts\Activate.ps1
uv pip install -e .

# Run server
npm run serve

# Run tests
npm test

# Debug mode
$env:DEBUG="true"
npm run serve
```

## All Set? ✅

If all checks pass, you're ready to go!

```bash
npm run serve
```

Then open http://localhost:3000 in your browser.
