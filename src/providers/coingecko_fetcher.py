"""
CoinGecko Data Fetcher
Python script to fetch cryptocurrency data using pycoingecko library
"""

import sys
import json
import logging
import os
from pycoingecko import CoinGeckoAPI
from datetime import datetime

# Setup logging
DEBUG_MODE = os.getenv('DEBUG', 'false').lower() == 'true'
logging.basicConfig(
    level=logging.DEBUG if DEBUG_MODE else logging.WARNING,
    format='[%(asctime)s] [%(name)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('CoinGeckoFetcher')

# Initialize CoinGecko API
logger.debug('Initializing CoinGecko API')
cg = CoinGeckoAPI()

def fetch_historical_data(coin_id, vs_currency, days):
    """Fetch historical market data for a cryptocurrency"""
    logger.debug(f'Fetching historical data for {coin_id}, vs_currency={vs_currency}, days={days}')
    try:
        # Get market chart data
        logger.debug(f'Calling CoinGecko API for {coin_id}')
        market_data = cg.get_coin_market_chart_by_id(
            id=coin_id,
            vs_currency=vs_currency,
            days=days
        )
        logger.debug(f'Received market data for {coin_id}')
        
        # Process price data
        data = []
        prices = market_data.get('prices', [])
        volumes = market_data.get('total_volumes', [])
        logger.debug(f'Processing {len(prices)} price points')
        
        # Combine prices and volumes
        for i, price_point in enumerate(prices):
            timestamp_ms = price_point[0]
            price = price_point[1]
            
            # Get corresponding volume
            volume = 0
            if i < len(volumes):
                volume = volumes[i][1]
            
            data.append({
                'timestamp': datetime.fromtimestamp(timestamp_ms / 1000).isoformat(),
                'price': float(price),
                'volume': float(volume)
            })
        
        result = {
            'coinId': coin_id,
            'vsCurrency': vs_currency,
            'days': days,
            'data': data
        }
        
        logger.debug(f'Successfully processed {len(data)} data points for {coin_id}')
        print(json.dumps(result))
        
    except Exception as e:
        logger.error(f'Error fetching historical data for {coin_id}: {str(e)}')
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)

def fetch_current_data(coin_id, vs_currency):
    """Fetch current coin data"""
    logger.debug(f'Fetching current data for {coin_id}, vs_currency={vs_currency}')
    try:
        # Get current data
        logger.debug(f'Calling CoinGecko price API for {coin_id}')
        data = cg.get_price(
            ids=coin_id,
            vs_currencies=vs_currency,
            include_market_cap=True,
            include_24hr_vol=True,
            include_24hr_change=True,
            include_last_updated_at=True
        )
        logger.debug(f'Received price data for {coin_id}')
        
        coin_data = data.get(coin_id, {})
        
        result = {
            'coinId': coin_id,
            'vsCurrency': vs_currency,
            'currentPrice': coin_data.get(vs_currency, 0),
            'marketCap': coin_data.get(f'{vs_currency}_market_cap', 0),
            'volume24h': coin_data.get(f'{vs_currency}_24h_vol', 0),
            'change24h': coin_data.get(f'{vs_currency}_24h_change', 0),
            'lastUpdated': coin_data.get('last_updated_at', 0)
        }
        
        # Get additional info from coin endpoint
        try:
            coin_info = cg.get_coin_by_id(coin_id)
            market_data = coin_info.get('market_data', {})
            
            result['name'] = coin_info.get('name', '')
            result['symbol'] = coin_info.get('symbol', '').upper()
            result['high24h'] = market_data.get('high_24h', {}).get(vs_currency, 0)
            result['low24h'] = market_data.get('low_24h', {}).get(vs_currency, 0)
            result['ath'] = market_data.get('ath', {}).get(vs_currency, 0)
            result['atl'] = market_data.get('atl', {}).get(vs_currency, 0)
            result['circulatingSupply'] = market_data.get('circulating_supply', 0)
            result['totalSupply'] = market_data.get('total_supply', 0)
        except:
            pass
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)

def search_coins(query):
    """Search for coins by query"""
    try:
        results = cg.search(query)
        coins = results.get('coins', [])
        
        # Format results
        formatted = []
        for coin in coins[:10]:  # Limit to top 10 results
            formatted.append({
                'id': coin.get('id', ''),
                'name': coin.get('name', ''),
                'symbol': coin.get('symbol', '').upper(),
                'marketCapRank': coin.get('market_cap_rank', 0)
            })
        
        print(json.dumps(formatted))
        
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)

def list_coins():
    """Get list of all supported coins"""
    try:
        coins = cg.get_coins_list()
        
        # Limit to top coins by including only those with rank
        formatted = []
        for coin in coins[:100]:  # Limit to first 100
            formatted.append({
                'id': coin.get('id', ''),
                'symbol': coin.get('symbol', '').upper(),
                'name': coin.get('name', '')
            })
        
        print(json.dumps(formatted))
        
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Invalid arguments'}), file=sys.stderr)
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'historical':
        if len(sys.argv) < 5:
            print(json.dumps({'error': 'Missing arguments for historical command'}), file=sys.stderr)
            sys.exit(1)
        coin_id = sys.argv[2]
        vs_currency = sys.argv[3]
        days = int(sys.argv[4])
        fetch_historical_data(coin_id, vs_currency, days)
    
    elif command == 'current':
        if len(sys.argv) < 4:
            print(json.dumps({'error': 'Missing arguments for current command'}), file=sys.stderr)
            sys.exit(1)
        coin_id = sys.argv[2]
        vs_currency = sys.argv[3]
        fetch_current_data(coin_id, vs_currency)
    
    elif command == 'search':
        if len(sys.argv) < 3:
            print(json.dumps({'error': 'Missing query for search command'}), file=sys.stderr)
            sys.exit(1)
        query = sys.argv[2]
        search_coins(query)
    
    elif command == 'list':
        list_coins()
    
    else:
        print(json.dumps({'error': f'Unknown command: {command}'}), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
