from fastapi import APIRouter, HTTPException, Query
from datetime import date

router = APIRouter(tags=["history"])


@router.get("/history/{ticker}")
async def get_prediction_history(ticker: str, days: int = Query(30, ge=1, le=365)):
    """Get prediction vs actual history for a stock."""
    try:
        from database.supabase_client import get_supabase
        supabase = get_supabase()
        
        response = (
            supabase.table("predictions")
            .select("date, direction, actual_direction, was_correct, confidence, ensemble_proba")
            .eq("ticker", ticker.upper())
            .order("date", desc=True)
            .limit(days)
            .execute()
        )
        
        return {
            "ticker": ticker.upper(),
            "history": response.data if response.data else [],
            "total": len(response.data) if response.data else 0,
        }
    except ValueError:
        return {"ticker": ticker.upper(), "history": [], "total": 0, "message": "Supabase not configured"}


@router.get("/prices/{ticker}")
async def get_price_history(ticker: str, days: int = Query(30, ge=1, le=365)):
    """Get actual price history for charts."""
    from services.data_fetcher import get_price_history as fetch_prices
    
    prices = fetch_prices(ticker.upper(), days)
    
    if not prices:
        raise HTTPException(status_code=404, detail=f"No price data for {ticker}")
    
    return {
        "ticker": ticker.upper(),
        "prices": prices,
        "total": len(prices),
    }
