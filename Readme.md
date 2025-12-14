# Stock & Crypto Chart Viewer

A comprehensive stock and cryptocurrency chart viewer with interactive analysis tools and trading strategy planning.

## Overview

This project provides an interactive web application for viewing and analyzing stock and cryptocurrency charts. Users can view historical price data with interactive zoom/pan controls, examine market metadata, and plan trading strategies with take-profit and stop-loss calculations.

### Main Features
- **Interactive Chart Display**: Zoomable/pannable price and volume charts
- **Real-time Data**: Stock data via YFinance, crypto data via CoinGecko
- **Market Information**: P/E ratios, market cap, volume, 52-week ranges
- **Trading Strategy Tools**: Calculate risk/reward ratios with take-profit, stop-loss, and holding period analysis
- **Dual Asset Support**: Stocks/indices and cryptocurrencies

## Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **Python** (>=3.10)
- **uv** (Python package manager) - Install: `pip install uv`

### Installation

1. **Clone the repository**
```bash
cd stock_quiz
```

2. **Install Node.js dependencies**
```bash
npm install
```

3. **Set up Python environment**
```bash
# Create virtual environment
uv venv

# Activate virtual environment
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# Windows CMD:
.venv\Scripts\activate.bat
# Linux/Mac:
source .venv/bin/activate

# Install Python dependencies
uv pip install -e .
```

4. **Configure environment (optional)**
```bash
# Copy example environment file
cp .env.example .env

# Edit .env to enable debug mode if needed
# DEBUG=true
```

### Running the Application

**Start the web server:**
```bash
npm run serve
```

**Open your browser:**
```
http://localhost:3000
```

### Testing the Setup

**Run all tests:**
```bash
npm test
```

**Run individual tests:**
```bash
npm run test:provider   # Test YFinance and CoinGecko providers
npm run test:chart      # Test chart service
npm run test:quiz       # Test quiz generation
```

## Usage Guide

### Viewing Stock Charts

1. Select **Asset Type**: Stock
2. Enter a stock symbol (e.g., `AAPL`, `GOOGL`, `MSFT`, `TSLA`)
3. Choose a timeframe (1M, 3M, 6M, 1Y, 2Y, 5Y)
4. Click **Load Chart**

**Supported Stock Symbols:**
- US Stocks: AAPL, GOOGL, MSFT, TSLA, AMZN, etc.
- Indices: ^GSPC (S&P 500), ^DJI (Dow Jones), ^IXIC (NASDAQ)

### Viewing Crypto Charts

1. Select **Asset Type**: Cryptocurrency
2. Enter a coin ID (e.g., `bitcoin`, `ethereum`, `cardano`, `solana`)
3. Choose a timeframe
4. Click **Load Chart**

**Supported Cryptocurrencies:**
- Use CoinGecko IDs (lowercase): bitcoin, ethereum, cardano, solana, polkadot, etc.

### Interactive Chart Controls

- **Zoom**: Use mouse wheel or pinch gesture
- **Pan**: Click and drag the chart
- **Reset**: Click "Reset Zoom" button
- **Sync**: Price and volume charts zoom/pan together

### Trading Strategy Analysis

1. Load a chart
2. Scroll to **Trading Strategy** section
3. Enter values:
   - **Take-Profit Price**: Your profit target
   - **Stop-Loss Price**: Your loss limit
   - **Max Days to Hold**: Maximum holding period
4. Click **Calculate Strategy**

**Strategy Analysis Shows:**
- Current price vs. your targets
- Profit/Loss percentages
- Risk/Reward ratio
- Strategy quality assessment

## Deployment Versions

The application is available in two publish versions:

### Version 1: MCP Server

Model Context Protocol (MCP) server implementation that allows AI assistants to interact with the stock quiz functionality.

#### Features
- MCP-compliant server interface
- Integration with AI assistants (Claude, etc.)
- Programmatic access to quiz functionality
- Real-time stock/crypto chart data

#### Installation

```bash
npm install
```

#### Usage

```bash
npm start
```

### Version 2: Web Server

Direct web hosting implementation for browser-based access.

#### Features
- Web-based user interface
- Direct browser access without additional setup
- Interactive chart visualization
- User-friendly input forms for price and date predictions
- Real-time quiz feedback

#### Installation

```bash
npm install
```

#### Usage

```bash
npm run serve
```

Access the application at `http://localhost:3000` (or configured port).

## Project Structure

```
stock_quiz/
├── Readme.md
└── [Additional files to be added]
```

## Development

### Running in Development Mode

```bash
# Auto-restart on file changes
npm run dev
```

### Running Tests

```bash
# All tests
npm test

# Individual tests
npm run test:provider
npm run test:chart
npm run test:quiz
```

### Adding New Features

1. **Backend**: Edit `src/services/` or `src/providers/`
2. **Frontend**: Edit `src/web/public/`
3. **API**: Add routes in `src/web/server.js`
4. **Tests**: Add to `test/` directory

## Deployment Versions

### Version 1: MCP Server (Coming Soon)

Model Context Protocol server for AI assistant integration.

```bash
npm start
```

### Version 2: Web Server (Current)

Browser-based interactive chart viewer.

```bash
npm run serve
```

## Dependencies

### Node.js
- express: Web framework
- nodemon: Dev auto-reload

### Python
- yfinance: Stock data
- pycoingecko: Crypto data
- pandas, numpy: Data processing

### Frontend (CDN)
- Chart.js: Charting
- chartjs-plugin-zoom: Zoom/pan
- Hammer.js: Touch gestures

## Dependencies

### Node.js
- express: Web framework
- nodemon: Dev auto-reload

### Python
- yfinance: Stock data
- pycoingecko: Crypto data
- pandas, numpy: Data processing

### Frontend (CDN)
- Chart.js: Charting
- chartjs-plugin-zoom: Zoom/pan
- Hammer.js: Touch gestures

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues:
1. Check [DEBUG.md](DEBUG.md)
2. Review [src/providers/README.md](src/providers/README.md)
3. Enable debug mode
4. Run tests: `npm test`

---

**Last Updated:** December 14, 2025