"""
Weekly XGBoost retrainer — runs every Sunday via GitHub Actions.
Retrains XGBoost on fresh data; LSTM is retrained manually every 3 months.
"""
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pandas as pd
import xgboost as xgb
from services.data_fetcher import fetch_stock_data, TICKERS
from services.feature_engineer import engineer_features


MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")


def retrain_xgboost():
    """Retrain XGBoost model on fresh data for all tickers."""
    print(f"\n{'='*60}")
    print(f"🔄 XGBoost Retraining — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"{'='*60}\n")
    
    all_features = []
    all_targets = []
    
    for ticker in TICKERS:
        try:
            print(f"  📥 Fetching data for {ticker}...")
            df = fetch_stock_data(ticker, days=500)
            features = engineer_features(df, ticker)
            
            # Target: next-day direction (1 = UP, 0 = DOWN)
            close = df.set_index("date")["close"].reindex(
                pd.to_datetime(features.index if hasattr(features.index, 'date') else range(len(features)))
            )
            
            # Simpler approach: use the close prices from the original df
            close_prices = df["close"].values
            # Align with features (features drops first N rows due to rolling)
            offset = len(df) - len(features)
            aligned_close = close_prices[offset:]
            
            if len(aligned_close) > 1:
                targets = (pd.Series(aligned_close).shift(-1) > pd.Series(aligned_close)).astype(int)
                targets = targets.iloc[:-1]  # Drop last (no next-day data)
                features_trimmed = features.iloc[:-1]
                
                all_features.append(features_trimmed)
                all_targets.extend(targets.tolist())
                
                print(f"  ✅ {ticker}: {len(features_trimmed)} samples")
        except Exception as e:
            print(f"  ❌ Error for {ticker}: {e}")
    
    if not all_features:
        print("  ❌ No training data available!")
        return
    
    X = pd.concat(all_features, ignore_index=True)
    y = all_targets
    
    # Time-based split — train on everything except last week
    split_idx = len(X) - (5 * len(TICKERS))  # ~5 trading days * 5 tickers
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    print(f"\n  📊 Training: {len(X_train)} samples, Testing: {len(X_test)} samples")
    
    # Train with same hyperparameters as Phase 3
    dtrain = xgb.DMatrix(X_train, label=y_train, feature_names=list(X.columns))
    dtest = xgb.DMatrix(X_test, label=y_test, feature_names=list(X.columns))
    
    params = {
        "max_depth": 4,
        "learning_rate": 0.05,
        "objective": "binary:logistic",
        "eval_metric": "logloss",
        "seed": 42,
    }
    
    model = xgb.train(
        params,
        dtrain,
        num_boost_round=75,
        evals=[(dtest, "test")],
        verbose_eval=False,
    )
    
    # Evaluate
    preds = model.predict(dtest)
    accuracy = sum((p >= 0.5) == y for p, y in zip(preds, y_test)) / len(y_test) * 100
    
    print(f"  📈 Test Accuracy: {accuracy:.1f}%")
    
    # Save model
    model_path = os.path.join(MODELS_DIR, "xgb_final_model.json")
    model.save_model(model_path)
    print(f"  💾 Model saved to {model_path}")
    
    # Log to Supabase if available
    try:
        from database.supabase_client import get_supabase
        supabase = get_supabase()
        supabase.table("model_accuracy").upsert({
            "ticker": "ALL",
            "date": str(datetime.now().date()),
            "rolling_7d_accuracy": accuracy,
            "total_correct": int(sum((p >= 0.5) == y for p, y in zip(preds, y_test))),
            "total_predictions": len(y_test),
        }, on_conflict="ticker,date").execute()
    except Exception:
        pass
    
    print(f"\n  ✨ Retraining complete!")


if __name__ == "__main__":
    retrain_xgboost()
