from fastapi import APIRouter, HTTPException, Request
from datetime import date, datetime
from services.data_fetcher import TICKERS, get_current_price, TICKER_TIERS
from rate_limiter import limiter

router = APIRouter(prefix="/predictions", tags=["predictions"])

VALID_TICKERS = ['GOOGL', 'NVDA', 'TCS.NS', 'CCJ', 'CEG']


@router.get("/all")
@limiter.limit("60/minute")
async def get_all_predictions(request: Request):
    """Get latest predictions for all 5 stocks — DB only, no ML inference."""
    try:
        from database.supabase_client import get_supabase
        supabase = get_supabase()
        today = date.today().isoformat()

        # Try today's predictions first
        response = (
            supabase.table("predictions")
            .select("*")
            .eq("date", today)
            .execute()
        )

        predictions_data = response.data or []
        is_today = len(predictions_data) > 0
        pred_date = today

        # Fallback: get most recent predictions if none for today
        if not predictions_data:
            fallback = (
                supabase.table("predictions")
                .select("*")
                .order("date", desc=True)
                .limit(5)
                .execute()
            )
            predictions_data = fallback.data or []
            if predictions_data:
                pred_date = predictions_data[0]["date"]

        if not predictions_data:
            return {
                "status": "no_data",
                "predictions": [],
                "message": "Predictions updating soon",
                "updated_at": datetime.now().isoformat(),
            }

        # Enrich each prediction with live price and tier info
        results = []
        for pred in predictions_data:
            ticker = pred["ticker"]
            price_info = get_current_price(ticker)
            tier_info = TICKER_TIERS.get(ticker, {"tier": 2, "label": "Unknown", "color": "gray"})
            results.append({
                **pred,
                "price": price_info,
                "tier": tier_info,
            })

        return {
            "status": "success",
            "is_today": is_today,
            "date": pred_date,
            "predictions": results,
            "updated_at": datetime.now().isoformat(),
            **({"message": "Showing last available predictions"} if not is_today else {}),
        }

    except Exception as e:
        return {
            "status": "error",
            "predictions": [],
            "message": "Unable to load predictions",
            "updated_at": datetime.now().isoformat(),
        }


@router.get("/{ticker}")
@limiter.limit("60/minute")
async def get_prediction(ticker: str, request: Request):
    """Get prediction + history for a specific stock — DB only."""
    ticker = ticker.upper()
    if ticker not in VALID_TICKERS:
        raise HTTPException(status_code=404, detail=f"Ticker {ticker} not supported. Use: {VALID_TICKERS}")

    try:
        from database.supabase_client import get_supabase
        supabase = get_supabase()

        # Latest prediction
        pred_response = (
            supabase.table("predictions")
            .select("*")
            .eq("ticker", ticker)
            .order("date", desc=True)
            .limit(1)
            .execute()
        )

        # Last 30 predictions for history
        history_response = (
            supabase.table("predictions")
            .select("*")
            .eq("ticker", ticker)
            .order("date", desc=True)
            .limit(30)
            .execute()
        )

        price_info = get_current_price(ticker)
        tier_info = TICKER_TIERS.get(ticker, {"tier": 2, "label": "Unknown", "color": "gray"})

        return {
            "ticker": ticker,
            "latest": pred_response.data[0] if pred_response.data else None,
            "history": history_response.data if history_response.data else [],
            "price": price_info,
            "tier": tier_info,
            "prediction": pred_response.data[0] if pred_response.data else None,
        }

    except Exception as e:
        return {
            "ticker": ticker,
            "latest": None,
            "history": [],
            "price": get_current_price(ticker),
            "tier": TICKER_TIERS.get(ticker, {"tier": 2, "label": "Unknown", "color": "gray"}),
            "prediction": None,
            "message": "Unable to load prediction data",
        }
