from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, field_validator
from datetime import date, datetime
import re
from rate_limiter import limiter

router = APIRouter(prefix="/game", tags=["game"])

VALID_TICKERS = ['GOOGL', 'NVDA', 'TCS.NS', 'CCJ', 'CEG']


class GamePredictionInput(BaseModel):
    session_id: str
    username: str | None = None
    ticker: str
    prediction: str  # 'UP' or 'DOWN'
    date: str | None = None  # defaults to today

    @field_validator('ticker')
    @classmethod
    def valid_ticker(cls, v):
        if v not in VALID_TICKERS:
            raise ValueError(f'Invalid ticker. Must be one of: {VALID_TICKERS}')
        return v

    @field_validator('prediction')
    @classmethod
    def valid_prediction(cls, v):
        v = v.upper()
        if v not in ['UP', 'DOWN']:
            raise ValueError('Must be UP or DOWN')
        return v

    @field_validator('username')
    @classmethod
    def safe_username(cls, v):
        if v is None:
            return v
        clean = re.sub(r'[<>"\'/\\]', '', v)
        return clean[:30]

    @field_validator('session_id')
    @classmethod
    def valid_session(cls, v):
        if not re.match(r'^[a-zA-Z0-9_\-]{8,50}$', v):
            raise ValueError('Invalid session ID format')
        return v


@router.post("/predict")
@limiter.limit("10/minute")
async def submit_prediction(body: GamePredictionInput, request: Request):
    """Submit a user prediction for a stock."""
    prediction_date = body.date or str(date.today())

    try:
        from database.supabase_client import get_supabase
        supabase = get_supabase()

        # Check if user already predicted this stock today
        existing = (
            supabase.table("game_predictions")
            .select("id")
            .eq("user_session_id", body.session_id)
            .eq("ticker", body.ticker)
            .eq("date", prediction_date)
            .execute()
        )

        if existing.data:
            raise HTTPException(status_code=409, detail="Already predicted this stock today")

        # Get AI prediction for comparison
        ai_pred = (
            supabase.table("predictions")
            .select("direction")
            .eq("ticker", body.ticker)
            .eq("date", prediction_date)
            .limit(1)
            .execute()
        )

        ai_direction = ai_pred.data[0]["direction"] if ai_pred.data else None

        # Save prediction
        record = {
            "user_session_id": body.session_id,
            "username": body.username or f"Player #{abs(hash(body.session_id)) % 10000}",
            "ticker": body.ticker,
            "date": prediction_date,
            "human_prediction": body.prediction,
            "ai_prediction": ai_direction,
        }

        result = supabase.table("game_predictions").insert(record).execute()

        return {
            "status": "locked",
            "message": "Prediction locked!",
            "data": {
                "ticker": body.ticker,
                "human_prediction": body.prediction,
                "ai_prediction": ai_direction,
                "date": prediction_date,
            }
        }
    except HTTPException:
        raise
    except ValueError:
        # Supabase not configured — store locally (in-memory for demo)
        return {
            "status": "locked",
            "message": "Prediction saved (demo mode — no database)",
            "data": {
                "ticker": body.ticker,
                "human_prediction": body.prediction,
                "ai_prediction": None,
                "date": prediction_date,
            }
        }


@router.get("/results/{date}")
@limiter.limit("30/minute")
async def get_results(date: str, request: Request):
    """Get all game results for a specific date."""
    try:
        from database.supabase_client import get_supabase
        supabase = get_supabase()

        response = (
            supabase.table("game_predictions")
            .select("*")
            .eq("date", date)
            .execute()
        )

        return {
            "date": date,
            "results": response.data if response.data else [],
            "total": len(response.data) if response.data else 0,
        }
    except ValueError:
        return {"date": date, "results": [], "total": 0, "message": "Supabase not configured"}


@router.get("/scores/{session_id}")
@limiter.limit("30/minute")
async def get_scores(session_id: str, request: Request):
    """Get scores, streak, and history for a session."""
    try:
        from database.supabase_client import get_supabase
        supabase = get_supabase()

        # Get score record
        scores = (
            supabase.table("scores")
            .select("*")
            .eq("user_session_id", session_id)
            .limit(1)
            .execute()
        )

        # Get recent game predictions
        history = (
            supabase.table("game_predictions")
            .select("*")
            .eq("user_session_id", session_id)
            .order("date", desc=True)
            .limit(30)
            .execute()
        )

        score_data = scores.data[0] if scores.data else {
            "human_points": 0,
            "ai_points": 0,
            "streak": 0,
            "best_streak": 0,
            "total_games": 0,
        }

        return {
            "session_id": session_id,
            "scores": score_data,
            "history": history.data if history.data else [],
        }
    except ValueError:
        return {
            "session_id": session_id,
            "scores": {"human_points": 0, "ai_points": 0, "streak": 0, "best_streak": 0, "total_games": 0},
            "history": [],
            "message": "Supabase not configured",
        }


@router.get("/leaderboard")
@limiter.limit("30/minute")
async def get_leaderboard(period: str = Query("alltime", pattern="^(weekly|alltime)$"), request: Request = None):
    """Get top 10 leaderboard."""
    try:
        from database.supabase_client import get_supabase
        supabase = get_supabase()

        query = supabase.table("scores").select("*").order("human_points", desc=True).limit(10)

        response = query.execute()

        leaderboard = []
        for i, row in enumerate(response.data or []):
            total = row.get("total_games", 0)
            wins = row.get("human_points", 0)
            leaderboard.append({
                "rank": i + 1,
                "username": row.get("username", "Unknown"),
                "human_points": wins,
                "ai_points": row.get("ai_points", 0),
                "win_rate": round(wins / total * 100, 1) if total > 0 else 0,
                "streak": row.get("streak", 0),
                "best_streak": row.get("best_streak", 0),
                "total_games": total,
            })

        return {
            "period": period,
            "leaderboard": leaderboard,
        }
    except ValueError:
        return {"period": period, "leaderboard": [], "message": "Supabase not configured"}
