import os
import sys
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from rate_limiter import limiter

# Add backend dir to path for imports
sys.path.insert(0, os.path.dirname(__file__))

load_dotenv()


app = FastAPI(
    title="StockSense AI",
    description="AI-powered stock market prediction API with Human vs AI game",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — tightened for security
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    ""
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


# Response time logging middleware
@app.middleware("http")
async def log_response_time(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    if duration > 1.0:
        print(f"⚠️  SLOW: {request.method} {request.url.path} took {duration:.2f}s")
    return response


# Global exception handler — hide internal errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Internal error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "Please try again later",
        },
    )


# Import and include routers
from routers.predictions import router as predictions_router
from routers.game import router as game_router
from routers.history import router as history_router
from routers.stats import router as stats_router

app.include_router(predictions_router)
app.include_router(game_router)
app.include_router(history_router)
app.include_router(stats_router)


@app.get("/")
async def root():
    return {
        "name": "StockSense AI",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "endpoints": {
            "predictions": "/predictions/all",
            "game": "/game/predict",
            "history": "/history/{ticker}",
            "prices": "/prices/{ticker}",
            "accuracy": "/stats/model-accuracy",
            "market": "/market/regime",
            "leaderboard": "/game/leaderboard",
        },
    }


@app.get("/health")
async def health():
    try:
        from database.supabase_client import get_supabase
        supabase = get_supabase()
        result = supabase.table("predictions").select("count", count="exact").execute()
        return {
            "status": "healthy",
            "database": "connected",
            "predictions_count": result.count if result.count is not None else len(result.data),
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": "Check SUPABASE_URL and SUPABASE_KEY in .env",
        }
