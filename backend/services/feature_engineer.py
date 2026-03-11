import pandas as pd
import numpy as np


# Label encoding map matching the trained model
TICKER_ENCODING = {
    "CCJ": 0,
    "CEG": 1,
    "GOOGL": 2,
    "NVDA": 3,
    "TCS.NS": 4,
}


def compute_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """Compute Relative Strength Index."""
    delta = series.diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)
    avg_gain = gain.rolling(window=period, min_periods=period).mean()
    avg_loss = loss.rolling(window=period, min_periods=period).mean()
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi


def compute_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    """Compute Average True Range."""
    high = df["high"]
    low = df["low"]
    close = df["close"]
    
    tr1 = high - low
    tr2 = (high - close.shift(1)).abs()
    tr3 = (low - close.shift(1)).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    
    return tr.rolling(window=period, min_periods=period).mean()


def engineer_features(df: pd.DataFrame, ticker: str) -> pd.DataFrame:
    """
    Engineer all 32 features + Ticker_Enc matching the XGBoost model.
    
    Features: SMA_10, SMA_20, SMA_50, EMA_12, EMA_26, Price_to_SMA20,
    Price_to_SMA50, MACD, MACD_Signal, MACD_Hist, RSI, BB_Upper, BB_Lower,
    BB_Width, BB_Position, ATR, ATR_Pct, Vol_10, Vol_30, Volume_SMA_20,
    Volume_Ratio, OBV_Norm, Return_1d, Return_3d, Return_5d, Return_10d,
    Roll_Return_5, Roll_Return_10, DayOfWeek, Month, IsMonthStart,
    IsMonthEnd, Ticker_Enc
    """
    data = df.copy()
    close = data["close"]
    volume = data["volume"]
    
    # --- Moving Averages ---
    data["SMA_10"] = close.rolling(window=10).mean()
    data["SMA_20"] = close.rolling(window=20).mean()
    data["SMA_50"] = close.rolling(window=50).mean()
    data["EMA_12"] = close.ewm(span=12, adjust=False).mean()
    data["EMA_26"] = close.ewm(span=26, adjust=False).mean()
    
    # --- Price Ratios ---
    data["Price_to_SMA20"] = close / data["SMA_20"]
    data["Price_to_SMA50"] = close / data["SMA_50"]
    
    # --- MACD ---
    data["MACD"] = data["EMA_12"] - data["EMA_26"]
    data["MACD_Signal"] = data["MACD"].ewm(span=9, adjust=False).mean()
    data["MACD_Hist"] = data["MACD"] - data["MACD_Signal"]
    
    # --- RSI ---
    data["RSI"] = compute_rsi(close, period=14)
    
    # --- Bollinger Bands ---
    bb_sma = close.rolling(window=20).mean()
    bb_std = close.rolling(window=20).std()
    data["BB_Upper"] = bb_sma + (2 * bb_std)
    data["BB_Lower"] = bb_sma - (2 * bb_std)
    data["BB_Width"] = (data["BB_Upper"] - data["BB_Lower"]) / bb_sma
    data["BB_Position"] = (close - data["BB_Lower"]) / (data["BB_Upper"] - data["BB_Lower"])
    
    # --- ATR ---
    data["ATR"] = compute_atr(data, period=14)
    data["ATR_Pct"] = data["ATR"] / close
    
    # --- Volume Features ---
    data["Vol_10"] = volume.rolling(window=10).std()
    data["Vol_30"] = volume.rolling(window=30).std()
    data["Volume_SMA_20"] = volume.rolling(window=20).mean()
    data["Volume_Ratio"] = volume / data["Volume_SMA_20"]
    
    # --- OBV Normalized ---
    obv = (np.sign(close.diff()) * volume).fillna(0).cumsum()
    data["OBV_Norm"] = (obv - obv.rolling(window=20).mean()) / obv.rolling(window=20).std()
    
    # --- Returns ---
    data["Return_1d"] = close.pct_change(1)
    data["Return_3d"] = close.pct_change(3)
    data["Return_5d"] = close.pct_change(5)
    data["Return_10d"] = close.pct_change(10)
    
    # --- Rolling Returns ---
    data["Roll_Return_5"] = data["Return_1d"].rolling(window=5).mean()
    data["Roll_Return_10"] = data["Return_1d"].rolling(window=10).mean()
    
    # --- Calendar Features ---
    if "date" in data.columns:
        dates = pd.to_datetime(data["date"])
    else:
        dates = data.index
    
    data["DayOfWeek"] = dates.dt.dayofweek
    data["Month"] = dates.dt.month
    data["IsMonthStart"] = dates.dt.is_month_start.astype(int)
    data["IsMonthEnd"] = dates.dt.is_month_end.astype(int)
    
    # --- Ticker Encoding ---
    data["Ticker_Enc"] = TICKER_ENCODING.get(ticker, 0)
    
    # Select only the 33 feature columns in the correct order
    feature_columns = [
        "SMA_10", "SMA_20", "SMA_50", "EMA_12", "EMA_26",
        "Price_to_SMA20", "Price_to_SMA50",
        "MACD", "MACD_Signal", "MACD_Hist",
        "RSI",
        "BB_Upper", "BB_Lower", "BB_Width", "BB_Position",
        "ATR", "ATR_Pct",
        "Vol_10", "Vol_30", "Volume_SMA_20", "Volume_Ratio",
        "OBV_Norm",
        "Return_1d", "Return_3d", "Return_5d", "Return_10d",
        "Roll_Return_5", "Roll_Return_10",
        "DayOfWeek", "Month", "IsMonthStart", "IsMonthEnd",
        "Ticker_Enc",
    ]
    
    result = data[feature_columns].copy()
    
    # Drop rows with NaN (from rolling calculations)
    result = result.dropna()
    
    return result
