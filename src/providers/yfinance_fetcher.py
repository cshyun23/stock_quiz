"""
YFinance Data Fetcher
Python script to fetch stock data using yfinance library
"""

import sys
import json
import yfinance as yf
import logging
from datetime import datetime
import os

# Setup logging
DEBUG_MODE = os.getenv('DEBUG', 'false').lower() == 'true'
logging.basicConfig(
    level=logging.DEBUG if DEBUG_MODE else logging.WARNING,
    format='[%(asctime)s] [%(name)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('YFinanceFetcher')

def fetch_historical_data(symbol, period, interval):
    """Fetch historical stock data"""
    logger.debug(f'Fetching historical data for {symbol}, period={period}, interval={interval}')
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period, interval=interval)
        
        # Convert DataFrame to JSON-serializable format
        data = []
        for index, row in hist.iterrows():
            data.append({
                'timestamp': index.isoformat(),
                'open': float(row['Open']),
                'high': float(row['High']),
                'low': float(row['Low']),
                'close': float(row['Close']),
                'volume': int(row['Volume'])
            })
        
        result = {
            'symbol': symbol,
            'period': period,
            'interval': interval,
            'data': data
        }
        
        logger.debug(f'Successfully processed {len(data)} data points for {symbol}')
        print(json.dumps(result))
        
    except Exception as e:
        logger.error(f'Error fetching historical data for {symbol}: {str(e)}')
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)

def fetch_stock_info(symbol):
    """Fetch stock information"""
    logger.debug(f'Fetching stock info for {symbol}')
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        logger.debug(f'Retrieved info for {symbol}, keys: {len(info)} fields')
        
        # Extract relevant information
        result = {
            'symbol': symbol,
            'shortName': info.get('shortName', ''),
            'longName': info.get('longName', ''),
            'currentPrice': info.get('currentPrice', 0),
            'regularMarketPrice': info.get('regularMarketPrice', 0),
            'previousClose': info.get('previousClose', 0),
            'open': info.get('open', 0),
            'dayHigh': info.get('dayHigh', 0),
            'dayLow': info.get('dayLow', 0),
            'volume': info.get('volume', 0),
            'marketCap': info.get('marketCap', 0),
            'fiftyTwoWeekHigh': info.get('fiftyTwoWeekHigh', 0),
            'fiftyTwoWeekLow': info.get('fiftyTwoWeekLow', 0),
            'trailingPE': info.get('trailingPE', 0),
            'forwardPE': info.get('forwardPE', 0),
            'currency': info.get('currency', 'USD'),
            'exchange': info.get('exchange', '')
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)

def main():
    if len(sys.argv) < 3:
        print(json.dumps({'error': 'Invalid arguments'}), file=sys.stderr)
        sys.exit(1)
    
    command = sys.argv[1]
    symbol = sys.argv[2]
    
    if command == 'historical':
        period = sys.argv[3] if len(sys.argv) > 3 else '1mo'
        interval = sys.argv[4] if len(sys.argv) > 4 else '1d'
        fetch_historical_data(symbol, period, interval)
    
    elif command == 'info':
        fetch_stock_info(symbol)
    
    else:
        print(json.dumps({'error': f'Unknown command: {command}'}), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
