import time
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta


TICKERS = ["GOOGL", "NVDA", "TCS.NS", "CCJ", "CEG"]

TICKER_TIERS = {
    "CEG": {"tier": 1, "label": "Tier 1 - High Reliability", "color": "green"},
    "NVDA": {"tier": 1, "label": "Tier 1 - High Reliability", "color": "green"},
    "GOOGL": {"tier": 2, "label": "Tier 2 - Medium Reliability", "color": "yellow"},
    "CCJ": {"tier": 2, "label": "Tier 2 - Medium Reliability", "color": "yellow"},
    "TCS.NS": {"tier": 3, "label": "Tier 3 - Use with Caution", "color": "orange"},
}


def fetch_stock_data(ticker: str, days: int = 200) -> pd.DataFrame:
    """Download OHLCV data for a ticker using yfinance."""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days + 50)  # extra buffer for feature calc
    
    df = yf.download(ticker, start=start_date, end=end_date, progress=False)
    
    if df.empty:
        raise ValueError(f"No data returned for ticker {ticker}")
    
    # Flatten MultiIndex columns if present
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    
    df = df.reset_index()
    df = df.rename(columns={
        "Date": "date",
        "Open": "open",
        "High": "high",
        "Low": "low",
        "Close": "close",
        "Adj Close": "adj_close",
        "Volume": "volume",
    })
    
    # Use Adj Close if available, otherwise Close
    if "adj_close" in df.columns:
        df["close"] = df["adj_close"]
    
    return df.sort_values("date").reset_index(drop=True)


def fetch_vix() -> dict:
    """Fetch current VIX value for market regime indicator."""
    try:
        vix = yf.Ticker("^VIX")
        hist = vix.history(period="5d")
        if hist.empty:
            return {"value": 20.0, "status": "moderate", "message": "VIX data unavailable"}
        
        current_vix = float(hist["Close"].iloc[-1])
        
        if current_vix < 15:
            status = "calm"
            message = "Market calm — predictions reliable"
        elif current_vix <= 25:
            status = "moderate"
            message = "Moderate volatility — use caution"
        else:
            status = "high"
            message = "High volatility detected — model accuracy reduced"
        
        return {"value": round(current_vix, 2), "status": status, "message": message}
    except Exception as e:
        return {"value": 20.0, "status": "moderate", "message": f"VIX fetch error: {str(e)}"}


# Price cache: {ticker: (data_dict, timestamp)}
_price_cache = {}
PRICE_CACHE_TTL = 300  # 5 minutes


def get_current_price(ticker: str) -> dict:
    """Get latest price, daily change %, and volume. Cached for 5 minutes."""
    now = time.time()

    # Return cached if fresh
    if ticker in _price_cache:
        data, timestamp = _price_cache[ticker]
        if now - timestamp < PRICE_CACHE_TTL:
            return data

    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period="5d")

        if len(hist) < 2:
            return {"price": 0, "change": 0, "change_pct": 0, "volume": 0}

        current = float(hist["Close"].iloc[-1])
        previous = float(hist["Close"].iloc[-2])
        change = current - previous
        change_pct = (change / previous) * 100 if previous != 0 else 0
        volume = int(hist["Volume"].iloc[-1])

        data = {
            "price": round(current, 2),
            "change": round(change, 2),
            "change_pct": round(change_pct, 2),
            "volume": volume,
        }
        _price_cache[ticker] = (data, now)
        return data
    except Exception as e:
        # Return stale cache on error
        if ticker in _price_cache:
            return _price_cache[ticker][0]
        return {"price": 0, "change": 0, "change_pct": 0, "volume": 0, "error": str(e)}


def get_price_history(ticker: str, days: int = 30) -> list[dict]:
    """Get price history for charts."""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days + 5)
        df = yf.download(ticker, start=start_date, end=end_date, progress=False)
        
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        
        df = df.reset_index()
        records = []
        for _, row in df.iterrows():
            records.append({
                "date": row["Date"].strftime("%Y-%m-%d"),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
            })
        
        return records[-days:]
    except Exception:
        return []


def check_unusual_moves(tickers: list[str] = None) -> list[dict]:
    """Check if any stocks had > 5% move today."""
    if tickers is None:
        tickers = TICKERS
    
    alerts = []
    for ticker in tickers:
        try:
            price_info = get_current_price(ticker)
            if abs(price_info.get("change_pct", 0)) > 5:
                alerts.append({
                    "ticker": ticker,
                    "change_pct": price_info["change_pct"],
                    "message": f"Unusual price movement detected in {ticker} — treat prediction with caution"
                })
        except Exception:
            continue
    
    return alerts
