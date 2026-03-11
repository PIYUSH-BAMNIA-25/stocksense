import os
import json
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb

from services.data_fetcher import fetch_stock_data
from services.feature_engineer import engineer_features

# Paths to model files
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")

# Global model cache
_xgb_model = None
_lstm_model = None
_xgb_scalers = None
_lstm_scalers = None
_label_encoder = None
_lstm_features = None

# The 32 features the XGBoost scaler was trained on (NO Ticker_Enc)
XGB_SCALER_FEATURES = [
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
]


def _load_xgb_model():
    """Load XGBoost model from JSON."""
    global _xgb_model
    if _xgb_model is None:
        model_path = os.path.join(MODELS_DIR, "xgb_final_model.json")
        _xgb_model = xgb.Booster()
        _xgb_model.load_model(model_path)
    return _xgb_model


def _load_lstm_model():
    """Load LSTM model from .keras file."""
    global _lstm_model
    if _lstm_model is None:
        try:
            import tensorflow as tf
            model_path = os.path.join(MODELS_DIR, "lstm_final_model_v2.keras")
            _lstm_model = tf.keras.models.load_model(model_path)
        except ImportError:
            print("WARNING: TensorFlow not installed. LSTM predictions will use XGBoost only.")
            _lstm_model = "unavailable"
        except Exception as e:
            print(f"WARNING: Could not load LSTM model: {e}")
            _lstm_model = "unavailable"
    return _lstm_model


def _load_scalers():
    """Load per-ticker scalers for XGBoost and LSTM."""
    global _xgb_scalers, _lstm_scalers
    if _xgb_scalers is None:
        _xgb_scalers = joblib.load(os.path.join(MODELS_DIR, "xgb_final_scalers.pkl"))
    if _lstm_scalers is None:
        _lstm_scalers = joblib.load(os.path.join(MODELS_DIR, "lstm_final_scalers.pkl"))
    return _xgb_scalers, _lstm_scalers


def _load_label_encoder():
    """Load label encoder."""
    global _label_encoder
    if _label_encoder is None:
        _label_encoder = joblib.load(os.path.join(MODELS_DIR, "xgb_label_encoder.pkl"))
    return _label_encoder


def _load_lstm_features():
    """Load LSTM feature list (21 features)."""
    global _lstm_features
    if _lstm_features is None:
        _lstm_features = joblib.load(os.path.join(MODELS_DIR, "lstm_final_features.pkl"))
    return _lstm_features


def predict_xgb(features_df: pd.DataFrame, ticker: str) -> float:
    """
    Run XGBoost prediction, returns probability of UP.
    
    Steps:
    1. Take the 32 scaler features (no Ticker_Enc)
    2. Scale using the per-ticker RobustScaler
    3. Add Ticker_Enc back after scaling
    4. Predict with XGBoost Booster
    """
    model = _load_xgb_model()
    xgb_scalers, _ = _load_scalers()
    
    # Get the latest row — only the 32 features the scaler knows
    latest = features_df.iloc[[-1]][XGB_SCALER_FEATURES].copy()
    
    # Scale using per-ticker scaler
    if ticker in xgb_scalers:
        scaled_values = xgb_scalers[ticker].transform(latest)
    else:
        # Fallback: use first available scaler
        first_key = list(xgb_scalers.keys())[0]
        scaled_values = xgb_scalers[first_key].transform(latest)
    
    # Create scaled DataFrame with correct column names
    scaled_df = pd.DataFrame(scaled_values, columns=XGB_SCALER_FEATURES)
    
    # Add Ticker_Enc back (not scaled — it's a categorical encoding)
    ticker_enc = features_df.iloc[-1]["Ticker_Enc"]
    scaled_df["Ticker_Enc"] = ticker_enc
    
    # All 33 feature names for the XGBoost model
    all_feature_names = XGB_SCALER_FEATURES + ["Ticker_Enc"]
    
    dmatrix = xgb.DMatrix(scaled_df[all_feature_names], feature_names=all_feature_names)
    proba = float(model.predict(dmatrix)[0])
    
    return proba


def predict_lstm(features_df: pd.DataFrame, ticker: str, sequence_length: int = 60) -> float:
    """
    Run LSTM prediction, returns probability of UP.
    
    Steps:
    1. Select only the 21 LSTM features
    2. Scale using per-ticker LSTM scaler
    3. Build sequence of last N rows
    4. Predict
    """
    model = _load_lstm_model()
    
    if model == "unavailable":
        return None
    
    _, lstm_scalers = _load_scalers()
    lstm_feature_list = _load_lstm_features()  # List of 21 feature names
    
    # Select only the LSTM features that exist in our engineered features
    available_features = [f for f in lstm_feature_list if f in features_df.columns]
    if not available_features:
        return None
    
    lstm_data = features_df[available_features].copy()
    
    # Scale using per-ticker LSTM scaler
    if ticker in lstm_scalers:
        scaled = lstm_scalers[ticker].transform(lstm_data)
    else:
        first_key = list(lstm_scalers.keys())[0]
        scaled = lstm_scalers[first_key].transform(lstm_data)
    
    # Build sequence (last N rows)
    if len(scaled) < sequence_length:
        # Pad with zeros if not enough data
        padding = np.zeros((sequence_length - len(scaled), scaled.shape[1]))
        scaled = np.vstack([padding, scaled])
    
    sequence = scaled[-sequence_length:]
    sequence = sequence.reshape(1, sequence_length, -1)
    
    proba = float(model.predict(sequence, verbose=0)[0][0])
    
    return proba


def predict(ticker: str) -> dict:
    """
    Run full ensemble prediction for a ticker.
    
    Returns:
        dict with xgb_proba, lstm_proba, ensemble_proba, direction, confidence
    """
    # Fetch data and engineer features
    raw_data = fetch_stock_data(ticker, days=200)
    features = engineer_features(raw_data, ticker)
    
    if features.empty:
        return {
            "ticker": ticker,
            "error": "Insufficient data for feature engineering",
            "xgb_proba": 0.5,
            "lstm_proba": 0.5,
            "ensemble_proba": 0.5,
            "direction": "NEUTRAL",
            "confidence": 0,
        }
    
    # XGBoost prediction (pass ticker for per-ticker scaler)
    xgb_proba = predict_xgb(features, ticker)
    
    # LSTM prediction (pass ticker for per-ticker scaler)
    lstm_proba = predict_lstm(features, ticker)
    
    # Ensemble: 0.6 * LSTM + 0.4 * XGBoost
    if lstm_proba is not None:
        ensemble_proba = 0.6 * lstm_proba + 0.4 * xgb_proba
    else:
        # Fallback to XGBoost only
        ensemble_proba = xgb_proba
    
    # Direction and confidence
    direction = "UP" if ensemble_proba >= 0.5 else "DOWN"
    confidence = abs(ensemble_proba - 0.5) * 200  # 0-100 scale
    
    # Individual model directions
    xgb_direction = "UP" if xgb_proba >= 0.5 else "DOWN"
    lstm_direction = "UP" if (lstm_proba or 0.5) >= 0.5 else "DOWN"
    
    return {
        "ticker": ticker,
        "xgb_proba": round(xgb_proba, 4),
        "lstm_proba": round(lstm_proba, 4) if lstm_proba is not None else None,
        "ensemble_proba": round(ensemble_proba, 4),
        "direction": direction,
        "xgb_direction": xgb_direction,
        "lstm_direction": lstm_direction,
        "confidence": round(confidence, 1),
    }


def predict_all() -> list[dict]:
    """Run predictions for all 5 tickers."""
    from services.data_fetcher import TICKERS
    
    results = []
    for ticker in TICKERS:
        try:
            result = predict(ticker)
            results.append(result)
        except Exception as e:
            results.append({
                "ticker": ticker,
                "error": str(e),
                "xgb_proba": 0.5,
                "lstm_proba": 0.5,
                "ensemble_proba": 0.5,
                "direction": "NEUTRAL",
                "confidence": 0,
            })
    
    return results
