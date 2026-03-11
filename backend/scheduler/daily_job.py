"""
Daily prediction job — runs every morning via GitHub Actions.
Can also be run manually: python scheduler/daily_job.py

Steps:
1. For each ticker: fetch data → engineer features → predict → save to Supabase
2. Check yesterday's predictions: fetch actual → update was_correct → update accuracy
3. Update game scores
"""
import os
import sys
from datetime import date, datetime, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from services.data_fetcher import fetch_stock_data, TICKERS, get_current_price
from services.feature_engineer import engineer_features
from services.predictor import predict


def run_predictions():
    """Generate predictions for all tickers and save to Supabase."""
    from database.supabase_client import get_supabase
    supabase = get_supabase()
    
    today = str(date.today())
    print(f"\n{'='*60}")
    print(f"📊 StockSense AI — Daily Predictions for {today}")
    print(f"{'='*60}\n")
    
    for ticker in TICKERS:
        try:
            print(f"🔄 Processing {ticker}...")
            result = predict(ticker)
            
            # Save to Supabase
            xgb_proba = result.get("xgb_proba") or 0.5
            lstm_proba = result.get("lstm_proba") or xgb_proba
            ensemble_proba = result.get("ensemble_proba") or xgb_proba
            direction = result.get("direction") or ("UP" if ensemble_proba >= 0.5 else "DOWN")
            confidence = result.get("confidence") or round(abs(ensemble_proba - 0.5) * 200, 1)

            record = {
                "ticker": ticker,
                "date": today,
                "xgb_proba": round(float(xgb_proba), 4),
                "lstm_proba": round(float(lstm_proba), 4),
                "ensemble_proba": round(float(ensemble_proba), 4),
                "direction": direction,
                "confidence": round(float(confidence), 1),
                    }
            
            # Upsert (update if exists, insert if not)
            supabase.table("predictions").upsert(
                record, on_conflict="ticker,date"
            ).execute()
            
            lstm_display = f"{result['lstm_proba']:.4f}" if result.get('lstm_proba') is not None else 'N/A'
            conf_display = f"{result['confidence']}" if result.get('confidence') is not None else '0'
            print(f"  ✅ {ticker}: {result['direction']} "
                  f"(confidence: {conf_display}%, "
                  f"XGB: {result['xgb_proba']:.4f}, "
                  f"LSTM: {lstm_display})")
        
        except Exception as e:
            print(f"  ❌ Error for {ticker}: {e}")


def verify_yesterday():
    """Check yesterday's predictions against actual results."""
    from database.supabase_client import get_supabase
    supabase = get_supabase()
    
    yesterday = str(date.today() - timedelta(days=1))
    
    # Handle weekends: go back to last trading day
    today_weekday = date.today().weekday()
    if today_weekday == 0:  # Monday
        yesterday = str(date.today() - timedelta(days=3))
    elif today_weekday == 6:  # Sunday
        yesterday = str(date.today() - timedelta(days=2))
    
    print(f"\n{'='*60}")
    print(f"🔍 Verifying predictions for {yesterday}")
    print(f"{'='*60}\n")
    
    for ticker in TICKERS:
        try:
            # Get yesterday's prediction
            pred = (
                supabase.table("predictions")
                .select("*")
                .eq("ticker", ticker)
                .eq("date", yesterday)
                .limit(1)
                .execute()
            )
            
            if not pred.data:
                print(f"  ⚪ No prediction found for {ticker} on {yesterday}")
                continue
            
            prediction = pred.data[0]
            
            # Get actual closing prices
            import yfinance as yf
            stock_data = yf.download(ticker, period="5d", progress=False)
            if stock_data.empty or len(stock_data) < 2:
                print(f"  ⚪ Insufficient price data for {ticker}")
                continue
            
            # Determine actual direction
            closes = stock_data["Close"].values.flatten()
            if len(closes) >= 2:
                actual_direction = "UP" if closes[-1] > closes[-2] else "DOWN"
            else:
                continue
            
            was_correct = prediction["direction"] == actual_direction
            
            # Update prediction record
            supabase.table("predictions").update({
                "actual_direction": actual_direction,
                "was_correct": was_correct,
            }).eq("id", prediction["id"]).execute()
            
            status = "✅" if was_correct else "❌"
            print(f"  {status} {ticker}: Predicted {prediction['direction']}, "
                  f"Actual {actual_direction} — {'CORRECT' if was_correct else 'WRONG'}")
            
            # Update game predictions too
            game_preds = (
                supabase.table("game_predictions")
                .select("*")
                .eq("ticker", ticker)
                .eq("date", yesterday)
                .execute()
            )
            
            if game_preds.data:
                for gp in game_preds.data:
                    human_correct = gp["human_prediction"] == actual_direction
                    ai_correct = (gp["ai_prediction"] == actual_direction) if gp["ai_prediction"] else False
                    
                    supabase.table("game_predictions").update({
                        "actual_direction": actual_direction,
                        "human_correct": human_correct,
                        "ai_correct": ai_correct,
                    }).eq("id", gp["id"]).execute()
                    
                    # Update scores
                    _update_scores(supabase, gp["user_session_id"], gp.get("username"), human_correct, ai_correct)
        
        except Exception as e:
            print(f"  ❌ Error verifying {ticker}: {e}")
    
    # Update model accuracy stats
    _update_accuracy_stats(supabase)


def _update_scores(supabase, session_id: str, username: str, human_correct: bool, ai_correct: bool):
    """Update the scores table for a user."""
    try:
        existing = (
            supabase.table("scores")
            .select("*")
            .eq("user_session_id", session_id)
            .limit(1)
            .execute()
        )
        
        if existing.data:
            score = existing.data[0]
            new_human = score["human_points"] + (1 if human_correct else 0)
            new_ai = score["ai_points"] + (1 if ai_correct else 0)
            new_streak = (score["streak"] + 1) if human_correct else 0
            new_best = max(score["best_streak"], new_streak)
            
            supabase.table("scores").update({
                "human_points": new_human,
                "ai_points": new_ai,
                "streak": new_streak,
                "best_streak": new_best,
                "total_games": score["total_games"] + 1,
                "updated_at": datetime.now().isoformat(),
            }).eq("user_session_id", session_id).execute()
        else:
            supabase.table("scores").insert({
                "user_session_id": session_id,
                "username": username or f"Player #{abs(hash(session_id)) % 10000}",
                "human_points": 1 if human_correct else 0,
                "ai_points": 1 if ai_correct else 0,
                "streak": 1 if human_correct else 0,
                "best_streak": 1 if human_correct else 0,
                "total_games": 1,
            }).execute()
    except Exception as e:
        print(f"  ⚠ Error updating scores: {e}")


def _update_accuracy_stats(supabase):
    """Update the model_accuracy table with rolling stats."""
    today = str(date.today())
    
    for ticker in TICKERS:
        try:
            # Get all predictions with results
            all_preds = (
                supabase.table("predictions")
                .select("date, was_correct")
                .eq("ticker", ticker)
                .not_.is_("was_correct", "null")
                .order("date", desc=True)
                .execute()
            )
            
            if not all_preds.data:
                continue
            
            total = len(all_preds.data)
            total_correct = sum(1 for p in all_preds.data if p["was_correct"])
            
            # 7-day rolling
            recent_7 = all_preds.data[:7]
            correct_7 = sum(1 for p in recent_7 if p["was_correct"])
            
            # 30-day rolling
            recent_30 = all_preds.data[:30]
            correct_30 = sum(1 for p in recent_30 if p["was_correct"])
            
            supabase.table("model_accuracy").upsert({
                "ticker": ticker,
                "date": today,
                "rolling_7d_accuracy": round(correct_7 / len(recent_7) * 100, 1) if recent_7 else 0,
                "rolling_30d_accuracy": round(correct_30 / len(recent_30) * 100, 1) if recent_30 else 0,
                "total_correct": total_correct,
                "total_predictions": total,
            }, on_conflict="ticker,date").execute()
            
        except Exception as e:
            print(f"  ⚠ Error updating accuracy for {ticker}: {e}")


if __name__ == "__main__":
    print("🚀 Starting StockSense AI Daily Job...\n")
    
    # Step 1: Generate today's predictions
    run_predictions()
    
    # Step 2: Verify yesterday's predictions
    verify_yesterday()
    
    print(f"\n{'='*60}")
    print("✨ Daily job complete!")
    print(f"{'='*60}")
