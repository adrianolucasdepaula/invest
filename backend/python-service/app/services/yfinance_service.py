"""
YFinance Service - Historical Data Fetching
Descrição: Fetch unlimited free historical data from Yahoo Finance
"""

import yfinance as yf
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
import time
import random

logger = logging.getLogger(__name__)


class YFinanceService:
    """
    Service for fetching historical price data from Yahoo Finance
    """

    def __init__(self):
        """Initialize YFinance service"""
        # Configure yfinance session with proper headers
        self._configure_yfinance()
        logger.info("YFinanceService initialized")

    def _configure_yfinance(self):
        """Configure yfinance with proper headers to avoid rate limiting"""
        import requests

        # Create session with proper headers
        session = requests.Session()
        session.headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        session.headers['Accept'] = '*/*'
        session.headers['Accept-Language'] = 'en-US,en;q=0.9'
        session.headers['Accept-Encoding'] = 'gzip, deflate, br'
        session.headers['Connection'] = 'keep-alive'

        # Store session for reuse
        self.session = session
        logger.debug("YFinance session configured with browser headers")

    def fetch_historical_data(
        self,
        ticker: str,
        period: str = "max",
        interval: str = "1d",
    ) -> List[Dict[str, Any]]:
        """
        Fetch historical price data for a ticker from Yahoo Finance

        Args:
            ticker: Stock ticker symbol (will append .SA for B3 stocks)
            period: Data period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
            interval: Data interval (1d, 1wk, 1mo)

        Returns:
            List of price data points with OHLCV data

        Raises:
            ValueError: If ticker is invalid or no data found
            Exception: If fetching fails
        """
        # Retry logic with exponential backoff
        max_retries = 3
        base_delay = 2  # seconds

        for attempt in range(max_retries):
            try:
                # Add random delay to avoid rate limiting
                if attempt > 0:
                    delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                    logger.info(f"Retrying after {delay:.2f}s (attempt {attempt + 1}/{max_retries})")
                    time.sleep(delay)

                # B3 stocks need .SA suffix for Yahoo Finance
                yahoo_ticker = f"{ticker}.SA" if not ticker.endswith(".SA") else ticker

                logger.info(
                    f"Fetching historical data for {yahoo_ticker} (period={period}, interval={interval})"
                )

                # Create Ticker object with session
                stock = yf.Ticker(yahoo_ticker, session=self.session)

                # Fetch historical data
                hist = stock.history(period=period, interval=interval)

                if hist.empty:
                    if attempt < max_retries - 1:
                        logger.warning(f"Empty data for {ticker}, retrying...")
                        continue
                    else:
                        raise ValueError(
                            f"No historical data found for {ticker}. Check if ticker is valid."
                        )

                logger.info(f"Fetched {len(hist)} data points for {ticker}")

                # Convert to list of dicts
                price_data = []
                for date, row in hist.iterrows():
                    # Convert date to string (YYYY-MM-DD)
                    date_str = date.strftime("%Y-%m-%d")

                    price_data.append(
                        {
                            "date": date_str,
                            "open": float(row["Open"]),
                            "high": float(row["High"]),
                            "low": float(row["Low"]),
                            "close": float(row["Close"]),
                            "volume": float(row["Volume"]),
                            "adjustedClose": float(row.get("Adj Close", row["Close"])),
                        }
                    )

                logger.info(f"Successfully processed {len(price_data)} data points for {ticker}")
                return price_data

            except ValueError as e:
                if attempt < max_retries - 1:
                    logger.warning(f"Validation error for {ticker}, retrying: {str(e)}")
                    continue
                else:
                    logger.error(f"Validation error for {ticker}: {str(e)}")
                    raise

            except Exception as e:
                if attempt < max_retries - 1:
                    logger.warning(f"Error fetching {ticker}, retrying: {str(e)}")
                    continue
                else:
                    logger.error(f"Error fetching data for {ticker}: {str(e)}", exc_info=True)
                    raise Exception(f"Failed to fetch historical data: {str(e)}")

        # This should never be reached, but just in case
        raise Exception(f"Failed to fetch historical data for {ticker} after {max_retries} retries")

    def get_ticker_info(self, ticker: str) -> Dict[str, Any]:
        """
        Get basic ticker information

        Args:
            ticker: Stock ticker symbol

        Returns:
            Dictionary with ticker info (name, sector, currency, etc.)
        """
        try:
            yahoo_ticker = f"{ticker}.SA" if not ticker.endswith(".SA") else ticker
            stock = yf.Ticker(yahoo_ticker)
            info = stock.info

            return {
                "ticker": ticker,
                "longName": info.get("longName", ""),
                "currency": info.get("currency", "BRL"),
                "sector": info.get("sector", ""),
                "industry": info.get("industry", ""),
                "marketCap": info.get("marketCap", 0),
            }

        except Exception as e:
            logger.error(f"Error fetching info for {ticker}: {str(e)}")
            return {"ticker": ticker, "error": str(e)}
