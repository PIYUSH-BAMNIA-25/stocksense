from fastapi import APIRouter
from services.data_fetcher import fetch_vix, check_unusual_moves, TICKERS

router = APIRouter(tags=["stats"])


@router.get("/stats/model-accuracy")
async def get_model_accuracy():
    """Get per-stock accuracy stats."""
    try:
        from database.supabase_client import get_supabase
        supabase = get_supabase()
        
        response = (
            supabase.table("model_accuracy")
            .select("*")
            .order("date", desc=True)
            .execute()
        )
        
        # Group by ticker, take latest
        accuracy_map = {}
        if response.data:
            for row in response.data:
                ticker = row["ticker"]
                if ticker not in accuracy_map:
                    accuracy_map[ticker] = row
        
        # Also get overall stats
        all_preds = (
            supabase.table("predictions")
            .select("ticker, was_correct")
            .not_.is_("was_correct", "null")
            .execute()
        )
        
        overall = {"correct": 0, "total": 0}
        per_stock = {}
        
        if all_preds.data:
            for row in all_preds.data:
                ticker = row["ticker"]
                if ticker not in per_stock:
                    per_stock[ticker] = {"correct": 0, "total": 0}
                per_stock[ticker]["total"] += 1
                overall["total"] += 1
                if row["was_correct"]:
                    per_stock[ticker]["correct"] += 1
                    overall["correct"] += 1
        
        return {
            "overall": {
                **overall,
                "accuracy": round(overall["correct"] / overall["total"] * 100, 1) if overall["total"] > 0 else 0,
            },
            "per_stock": {
                ticker: {
                    **stats,
                    "accuracy": round(stats["correct"] / stats["total"] * 100, 1) if stats["total"] > 0 else 0,
                }
                for ticker, stats in per_stock.items()
            },
            "rolling": accuracy_map,
        }
    except ValueError:
        return {
            "overall": {"correct": 0, "total": 0, "accuracy": 0},
            "per_stock": {},
            "rolling": {},
            "message": "Supabase not configured — no historical accuracy data",
        }


@router.get("/market/regime")
async def get_market_regime():
    """Get VIX level and volatility warnings."""
    vix = fetch_vix()
    alerts = check_unusual_moves()
    
    return {
        "vix": vix,
        "alerts": alerts,
        "tickers_checked": TICKERS,
    }
