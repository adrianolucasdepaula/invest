"""
Data Aggregation and Consolidation System
B3 AI Analysis Platform

This module aggregates data from multiple scrapers, normalizes it,
cross-validates values, and calculates confidence scores.
"""

import sys
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from collections import defaultdict
import statistics
import json
from loguru import logger
import redis

# Add python-scrapers to path
sys.path.insert(0, str(Path(__file__).parent.parent / "python-scrapers"))

from database import db
from config import settings


class DataAggregator:
    """
    Aggregates data from multiple scrapers for comprehensive stock analysis.

    Features:
    - Fetch data from PostgreSQL (scraper_results table)
    - Normalize data from different sources
    - Cross-validate values across sources
    - Calculate confidence scores
    - Handle missing data gracefully
    - Cache results in Redis
    """

    # Data categories mapping
    FUNDAMENTAL_METRICS = [
        'p_l', 'pl', 'price_earnings', 'pe_ratio',
        'p_vp', 'pvp', 'price_book', 'pb_ratio',
        'dividend_yield', 'dy', 'yield',
        'roe', 'return_on_equity',
        'roa', 'return_on_assets',
        'ebitda', 'ebitda_margin',
        'net_margin', 'profit_margin',
        'debt_equity', 'debt_to_equity',
        'current_ratio', 'liquidity',
        'peg_ratio',
        'revenue', 'receita',
        'net_income', 'lucro_liquido',
        'equity', 'patrimonio_liquido',
        'market_cap', 'valor_mercado',
    ]

    TECHNICAL_METRICS = [
        'price', 'last_price', 'ultimo_preco',
        'open', 'abertura',
        'high', 'maxima',
        'low', 'minima',
        'volume', 'volume_negociado',
        'variation', 'variacao',
        'avg_volume', 'volume_medio',
        'rsi', 'rsi14',
        'macd', 'signal_line',
        'sma_20', 'sma_50', 'sma_200',
        'ema_20', 'ema_50',
        'bollinger_upper', 'bollinger_lower',
    ]

    # Percentage metrics (need normalization)
    PERCENTAGE_METRICS = [
        'dividend_yield', 'dy', 'yield',
        'roe', 'roa',
        'ebitda_margin', 'net_margin', 'profit_margin',
        'variation', 'variacao',
    ]

    def __init__(self):
        """Initialize DataAggregator with database and Redis connections"""
        self.redis_client = None
        self._init_redis()

    def _init_redis(self):
        """Initialize Redis connection"""
        try:
            self.redis_client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                decode_responses=True,
            )
            # Test connection
            self.redis_client.ping()
            logger.info("Redis connection established")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Caching will be disabled.")
            self.redis_client = None

    def _get_cache_key(self, prefix: str, ticker: str, **kwargs) -> str:
        """Generate cache key"""
        key_parts = [prefix, ticker.upper()]
        for k, v in sorted(kwargs.items()):
            key_parts.append(f"{k}:{v}")
        return ":".join(key_parts)

    def _get_cached(self, key: str) -> Optional[Dict]:
        """Get cached data"""
        if not self.redis_client:
            return None

        try:
            data = self.redis_client.get(key)
            if data:
                return json.loads(data)
        except Exception as e:
            logger.warning(f"Cache read error: {e}")

        return None

    def _set_cache(self, key: str, data: Dict, ttl: int):
        """Set cached data with TTL in seconds"""
        if not self.redis_client:
            return

        try:
            self.redis_client.setex(key, ttl, json.dumps(data))
        except Exception as e:
            logger.warning(f"Cache write error: {e}")

    def _normalize_percentage(self, value: Any) -> Optional[float]:
        """
        Normalize percentage values to decimal format (0.05 for 5%)

        Args:
            value: Percentage value (can be 5, 0.05, "5%", etc.)

        Returns:
            Normalized decimal value or None
        """
        if value is None:
            return None

        try:
            # Handle string values
            if isinstance(value, str):
                value = value.strip().replace('%', '').replace(',', '.')
                value = float(value)
            else:
                value = float(value)

            # If value is > 1, assume it's in percentage format (5 = 5%)
            if value > 1:
                value = value / 100

            return value
        except (ValueError, TypeError):
            return None

    def _normalize_currency(self, value: Any) -> Optional[float]:
        """
        Normalize currency values to float

        Args:
            value: Currency value (can have R$, commas, etc.)

        Returns:
            Normalized float value or None
        """
        if value is None:
            return None

        try:
            if isinstance(value, str):
                # Remove currency symbols and formatting
                value = value.replace('R$', '').replace('$', '')
                value = value.replace('.', '').replace(',', '.')
                value = value.strip()
                value = float(value)
            else:
                value = float(value)

            return value
        except (ValueError, TypeError):
            return None

    def _normalize_date(self, value: Any) -> Optional[datetime]:
        """
        Normalize date values to datetime objects

        Args:
            value: Date value in various formats

        Returns:
            datetime object or None
        """
        if value is None:
            return None

        if isinstance(value, datetime):
            return value

        # Common date formats
        date_formats = [
            '%Y-%m-%d',
            '%d/%m/%Y',
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%dT%H:%M:%S',
            '%Y-%m-%dT%H:%M:%S.%f',
        ]

        for fmt in date_formats:
            try:
                return datetime.strptime(str(value), fmt)
            except (ValueError, TypeError):
                continue

        return None

    def _normalize_metric_value(self, metric: str, value: Any) -> Optional[float]:
        """
        Normalize a metric value based on its type

        Args:
            metric: Metric name
            value: Raw value

        Returns:
            Normalized value or None
        """
        if value is None:
            return None

        # Check if it's a percentage metric
        if any(m in metric.lower() for m in self.PERCENTAGE_METRICS):
            return self._normalize_percentage(value)

        # Otherwise, treat as currency/number
        return self._normalize_currency(value)

    def cross_validate(self, values: List[float], metric: str) -> Dict[str, Any]:
        """
        Cross-validate values from multiple sources

        Args:
            values: List of values from different sources
            metric: Metric name

        Returns:
            Dict with validated value, confidence, and statistics
        """
        if not values:
            return {
                'value': None,
                'confidence': 0.0,
                'source_count': 0,
                'agreement': 0.0,
                'stats': {}
            }

        # Remove None values
        valid_values = [v for v in values if v is not None]

        if not valid_values:
            return {
                'value': None,
                'confidence': 0.0,
                'source_count': 0,
                'agreement': 0.0,
                'stats': {}
            }

        # Calculate statistics
        mean_val = statistics.mean(valid_values)
        median_val = statistics.median(valid_values)

        stats = {
            'mean': mean_val,
            'median': median_val,
            'min': min(valid_values),
            'max': max(valid_values),
            'count': len(valid_values),
        }

        # Calculate standard deviation if more than one value
        if len(valid_values) > 1:
            stdev = statistics.stdev(valid_values)
            stats['stdev'] = stdev
            stats['cv'] = stdev / mean_val if mean_val != 0 else 0  # Coefficient of variation
        else:
            stats['stdev'] = 0
            stats['cv'] = 0

        # Calculate agreement (how close values are to each other)
        # Lower CV = higher agreement
        if stats['cv'] < 0.05:  # Less than 5% variation
            agreement = 1.0
        elif stats['cv'] < 0.1:  # Less than 10% variation
            agreement = 0.9
        elif stats['cv'] < 0.2:  # Less than 20% variation
            agreement = 0.7
        elif stats['cv'] < 0.5:  # Less than 50% variation
            agreement = 0.5
        else:
            agreement = 0.3

        # Calculate confidence based on source count and agreement
        source_score = min(len(valid_values) / 5.0, 1.0)  # Max confidence at 5+ sources
        confidence = (source_score * 0.4) + (agreement * 0.6)

        # Use median as the validated value (more robust to outliers)
        validated_value = median_val

        return {
            'value': validated_value,
            'confidence': confidence,
            'source_count': len(valid_values),
            'agreement': agreement,
            'stats': stats,
        }

    def calculate_confidence(self, data: Dict[str, Any]) -> float:
        """
        Calculate overall confidence score for aggregated data

        Args:
            data: Aggregated data dictionary

        Returns:
            Confidence score (0-1)
        """
        if not data:
            return 0.0

        # Collect all confidence scores
        confidence_scores = []

        # Check fundamental data
        if 'fundamental' in data:
            for metric, info in data['fundamental'].items():
                if isinstance(info, dict) and 'confidence' in info:
                    confidence_scores.append(info['confidence'])

        # Check technical data
        if 'technical' in data:
            for metric, info in data['technical'].items():
                if isinstance(info, dict) and 'confidence' in info:
                    confidence_scores.append(info['confidence'])

        # Calculate average confidence
        if confidence_scores:
            return statistics.mean(confidence_scores)

        return 0.0

    def _fetch_scraper_results(
        self,
        ticker: str,
        hours: int = 24,
        success_only: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Fetch scraper results from database

        Args:
            ticker: Stock ticker
            hours: Number of hours to look back
            success_only: Only fetch successful results

        Returns:
            List of scraper results
        """
        try:
            # Calculate time threshold
            time_threshold = datetime.now() - timedelta(hours=hours)

            # Build query
            query = """
                SELECT
                    id,
                    job_id,
                    scraper_name,
                    ticker,
                    success,
                    data,
                    error,
                    response_time,
                    executed_at,
                    metadata,
                    created_at
                FROM scraper_results
                WHERE
                    ticker = :ticker
                    AND executed_at >= :time_threshold
            """

            if success_only:
                query += " AND success = true"

            query += " ORDER BY executed_at DESC"

            params = {
                'ticker': ticker.upper(),
                'time_threshold': time_threshold,
            }

            results = db.execute_query(query, params)

            # Convert to dict list
            scraper_results = []
            for row in results:
                scraper_results.append({
                    'id': row[0],
                    'job_id': row[1],
                    'scraper_name': row[2],
                    'ticker': row[3],
                    'success': row[4],
                    'data': row[5],
                    'error': row[6],
                    'response_time': row[7],
                    'executed_at': row[8],
                    'metadata': row[9],
                    'created_at': row[10],
                })

            return scraper_results

        except Exception as e:
            logger.error(f"Error fetching scraper results: {e}")
            return []

    def _aggregate_metric(
        self,
        scraper_results: List[Dict],
        metric_names: List[str]
    ) -> Dict[str, Any]:
        """
        Aggregate a specific metric from multiple scraper results

        Args:
            scraper_results: List of scraper results
            metric_names: List of possible metric names

        Returns:
            Aggregated metric data with cross-validation
        """
        values = []
        sources = []

        for result in scraper_results:
            if not result.get('data'):
                continue

            data = result['data']
            scraper_name = result['scraper_name']

            # Look for metric in data (case-insensitive)
            for metric_name in metric_names:
                # Check direct key
                if metric_name in data:
                    value = self._normalize_metric_value(metric_name, data[metric_name])
                    if value is not None:
                        values.append(value)
                        sources.append(scraper_name)
                        break

                # Check nested in 'fundamentals' or 'indicators'
                for section in ['fundamentals', 'indicators', 'data', 'metrics']:
                    if section in data and isinstance(data[section], dict):
                        if metric_name in data[section]:
                            value = self._normalize_metric_value(
                                metric_name,
                                data[section][metric_name]
                            )
                            if value is not None:
                                values.append(value)
                                sources.append(scraper_name)
                                break

        # Cross-validate values
        validation = self.cross_validate(values, metric_names[0])
        validation['sources'] = sources

        return validation

    def aggregate_stock_data(self, ticker: str) -> Dict[str, Any]:
        """
        Aggregate all available data for a stock

        Args:
            ticker: Stock ticker symbol

        Returns:
            Complete aggregated data
        """
        # Check cache (5 minutes TTL for complete data)
        cache_key = self._get_cache_key('stock_data', ticker)
        cached = self._get_cached(cache_key)
        if cached:
            logger.info(f"Returning cached data for {ticker}")
            return cached

        logger.info(f"Aggregating data for {ticker}")

        # Fetch scraper results
        scraper_results = self._fetch_scraper_results(ticker, hours=24)

        if not scraper_results:
            return {
                'ticker': ticker.upper(),
                'success': False,
                'error': 'No data available',
                'timestamp': datetime.now().isoformat(),
            }

        # Aggregate different data types
        fundamental = self.get_fundamental_data(ticker, scraper_results=scraper_results)
        technical = self.get_technical_data(ticker, scraper_results=scraper_results)

        # Build result
        result = {
            'ticker': ticker.upper(),
            'success': True,
            'fundamental': fundamental,
            'technical': technical,
            'sources': {
                'count': len(set(r['scraper_name'] for r in scraper_results)),
                'names': list(set(r['scraper_name'] for r in scraper_results)),
            },
            'timestamp': datetime.now().isoformat(),
        }

        # Calculate overall confidence
        result['confidence'] = self.calculate_confidence(result)

        # Cache result
        self._set_cache(cache_key, result, ttl=300)  # 5 minutes

        return result

    def get_fundamental_data(
        self,
        ticker: str,
        scraper_results: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Aggregate fundamental indicators for a stock

        Args:
            ticker: Stock ticker symbol
            scraper_results: Optional pre-fetched results

        Returns:
            Aggregated fundamental data
        """
        # Check cache (1 day TTL for fundamentals)
        cache_key = self._get_cache_key('fundamental', ticker)
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        # Fetch results if not provided
        if scraper_results is None:
            scraper_results = self._fetch_scraper_results(ticker, hours=24)

        # Aggregate key metrics
        fundamental = {}

        # P/L ratio
        fundamental['p_l'] = self._aggregate_metric(
            scraper_results,
            ['p_l', 'pl', 'price_earnings', 'pe_ratio']
        )

        # P/VP ratio
        fundamental['p_vp'] = self._aggregate_metric(
            scraper_results,
            ['p_vp', 'pvp', 'price_book', 'pb_ratio']
        )

        # Dividend Yield
        fundamental['dividend_yield'] = self._aggregate_metric(
            scraper_results,
            ['dividend_yield', 'dy', 'yield']
        )

        # ROE
        fundamental['roe'] = self._aggregate_metric(
            scraper_results,
            ['roe', 'return_on_equity']
        )

        # Market Cap
        fundamental['market_cap'] = self._aggregate_metric(
            scraper_results,
            ['market_cap', 'valor_mercado']
        )

        # EBITDA
        fundamental['ebitda'] = self._aggregate_metric(
            scraper_results,
            ['ebitda']
        )

        # Debt/Equity
        fundamental['debt_equity'] = self._aggregate_metric(
            scraper_results,
            ['debt_equity', 'debt_to_equity']
        )

        # Cache result
        self._set_cache(cache_key, fundamental, ttl=86400)  # 1 day

        return fundamental

    def get_technical_data(
        self,
        ticker: str,
        scraper_results: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Aggregate technical analysis data for a stock

        Args:
            ticker: Stock ticker symbol
            scraper_results: Optional pre-fetched results

        Returns:
            Aggregated technical data
        """
        # Check cache (5 minutes TTL for technical)
        cache_key = self._get_cache_key('technical', ticker)
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        # Fetch results if not provided
        if scraper_results is None:
            scraper_results = self._fetch_scraper_results(ticker, hours=24)

        # Aggregate key metrics
        technical = {}

        # Price
        technical['price'] = self._aggregate_metric(
            scraper_results,
            ['price', 'last_price', 'ultimo_preco']
        )

        # Volume
        technical['volume'] = self._aggregate_metric(
            scraper_results,
            ['volume', 'volume_negociado']
        )

        # Variation
        technical['variation'] = self._aggregate_metric(
            scraper_results,
            ['variation', 'variacao']
        )

        # RSI
        technical['rsi'] = self._aggregate_metric(
            scraper_results,
            ['rsi', 'rsi14']
        )

        # MACD
        technical['macd'] = self._aggregate_metric(
            scraper_results,
            ['macd']
        )

        # Cache result
        self._set_cache(cache_key, technical, ttl=300)  # 5 minutes

        return technical

    def get_news_data(self, ticker: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Get recent news for a stock

        Args:
            ticker: Stock ticker symbol
            limit: Maximum number of news items

        Returns:
            List of news items with metadata
        """
        # Check cache (10 minutes TTL)
        cache_key = self._get_cache_key('news', ticker, limit=limit)
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        # Fetch scraper results from news sources
        scraper_results = self._fetch_scraper_results(ticker, hours=72)  # 3 days

        news_items = []
        seen_titles = set()  # Deduplicate by title

        for result in scraper_results:
            if not result.get('data'):
                continue

            data = result['data']
            scraper_name = result['scraper_name']

            # Look for news in data
            news_list = None
            if 'news' in data:
                news_list = data['news']
            elif 'articles' in data:
                news_list = data['articles']
            elif isinstance(data, list):
                news_list = data

            if news_list and isinstance(news_list, list):
                for news in news_list:
                    if isinstance(news, dict):
                        title = news.get('title', news.get('headline', ''))

                        # Deduplicate
                        if title and title not in seen_titles:
                            seen_titles.add(title)

                            news_items.append({
                                'title': title,
                                'description': news.get('description', news.get('summary', '')),
                                'url': news.get('url', news.get('link', '')),
                                'published_at': news.get('published_at', news.get('date', '')),
                                'source': scraper_name,
                            })

                    if len(news_items) >= limit:
                        break

            if len(news_items) >= limit:
                break

        # Sort by date (most recent first)
        news_items.sort(
            key=lambda x: x.get('published_at', ''),
            reverse=True
        )

        # Cache result
        self._set_cache(cache_key, news_items[:limit], ttl=600)  # 10 minutes

        return news_items[:limit]

    def get_insider_data(self, ticker: str) -> Dict[str, Any]:
        """
        Get insider trading data for a stock

        Args:
            ticker: Stock ticker symbol

        Returns:
            Aggregated insider trading data
        """
        # Check cache (1 hour TTL)
        cache_key = self._get_cache_key('insider', ticker)
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        # Fetch scraper results
        scraper_results = self._fetch_scraper_results(ticker, hours=168)  # 7 days

        insider_data = {
            'transactions': [],
            'summary': {
                'total_transactions': 0,
                'buy_count': 0,
                'sell_count': 0,
                'total_value': 0,
            }
        }

        for result in scraper_results:
            if not result.get('data'):
                continue

            data = result['data']

            # Look for insider trading data
            if 'insider_trading' in data:
                transactions = data['insider_trading']
            elif 'transactions' in data:
                transactions = data['transactions']
            else:
                continue

            if isinstance(transactions, list):
                for txn in transactions:
                    if isinstance(txn, dict):
                        insider_data['transactions'].append({
                            'date': txn.get('date', ''),
                            'insider': txn.get('insider', txn.get('name', '')),
                            'type': txn.get('type', ''),
                            'quantity': txn.get('quantity', 0),
                            'price': txn.get('price', 0),
                            'value': txn.get('value', 0),
                            'source': result['scraper_name'],
                        })

        # Calculate summary
        insider_data['summary']['total_transactions'] = len(insider_data['transactions'])

        for txn in insider_data['transactions']:
            if txn['type'].lower() in ['buy', 'compra']:
                insider_data['summary']['buy_count'] += 1
            elif txn['type'].lower() in ['sell', 'venda']:
                insider_data['summary']['sell_count'] += 1

            insider_data['summary']['total_value'] += txn.get('value', 0)

        # Cache result
        self._set_cache(cache_key, insider_data, ttl=3600)  # 1 hour

        return insider_data

    def compare_stocks(self, tickers: List[str]) -> Dict[str, Any]:
        """
        Compare multiple stocks

        Args:
            tickers: List of stock ticker symbols

        Returns:
            Comparison data for all stocks
        """
        comparison = {
            'tickers': tickers,
            'data': {},
            'timestamp': datetime.now().isoformat(),
        }

        for ticker in tickers:
            stock_data = self.aggregate_stock_data(ticker)
            comparison['data'][ticker.upper()] = stock_data

        return comparison

    def get_sector_overview(self, sector: str) -> Dict[str, Any]:
        """
        Get overview of a sector

        Args:
            sector: Sector name

        Returns:
            Sector overview data
        """
        # This is a placeholder - would need a sector-to-tickers mapping
        # For now, return structure
        return {
            'sector': sector,
            'success': False,
            'error': 'Sector overview not yet implemented - requires sector mapping',
            'timestamp': datetime.now().isoformat(),
        }


# Global aggregator instance
aggregator = DataAggregator()
