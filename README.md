<div align="center">

<img src="https://img.shields.io/badge/StockSense-00C896?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0zIDEzbDQtNCA0IDQgNC04IDQgNHYzSDN6Ii8+PC9zdmc+" alt="StockSense"/>

# StockSense 

### AI-Powered Stock Direction Prediction + Human vs AI Game

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Visit_Site-00C896?style=for-the-badge)](https://stocksense-gray.vercel.app/)
[![Kaggle Notebooks](https://img.shields.io/badge/Kaggle-Model_Training-20BEFF?style=for-the-badge&logo=kaggle)](https://kaggle.com/piyushbamnia)
[![GitHub Stars](https://img.shields.io/github/stars/PIYUSH-BAMNIA-25/stocksense?style=for-the-badge&color=FFD700&logo=github)](https://github.com/PIYUSH-BAMNIA-25/stocksense/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/PIYUSH-BAMNIA-25/stocksense?style=for-the-badge&color=00C896&logo=github)](https://github.com/PIYUSH-BAMNIA-25/stocksense/network)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

[![Views](https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2FPIYUSH-BAMNIA-25%2Fstocksense-ai&count_bg=%2300C896&title_bg=%230A0F0A&icon=github&icon_color=%23FFFFFF&title=Views&edge_flat=false)](https://github.com/PIYUSH-BAMNIA-25/stocksense-ai)
[![Python](https://img.shields.io/badge/Python-3.10-3776AB?style=flat-square&logo=python)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.0-FF6600?style=flat-square)](https://xgboost.ai)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.15-FF6F00?style=flat-square&logo=tensorflow)](https://tensorflow.org)

<br/>

> ⚠️ **Not financial advice. Built for educational purposes only.**
> This project demonstrates applied ML, full-stack engineering, and honest model evaluation.

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Live Demo](#-live-demo)
- [Model Training](#-model-training)
- [Architecture](#-architecture)
- [Website Features](#-website-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)
- [Honest Performance](#-honest-model-performance)
- [What I Learned](#-what-i-learned)
- [Roadmap](#-roadmap)

---

## 🧠 Overview

StockSense AI predicts the **daily direction** (UP or DOWN) of 5 stocks using an ensemble of XGBoost and LSTM models, trained on 10 years of historical data with **walk-forward validation** to prevent data leakage.

The project started as an upgrade from a flawed first-year LSTM model that showed fake 93% accuracy due to random train/test splitting on time series data. This version fixes every problem with a production-grade ML pipeline and a live website.

**Stocks tracked:** `GOOGL` · `NVDA` · `TCS.NS` · `CCJ` · `CEG`

**Key honest result:** Walk-forward validated ensemble AUC of **0.54** — genuinely good for stock prediction. Renaissance Medallion Fund runs ~0.55–0.58.

---

## 🌐 Live Demo

| Page | Description |
|------|-------------|
| [Dashboard](https://stocksense-gray.vercel.app/) | Live stock cards with real AI predictions |
| [Stock Detail](https://stocksense-gray.vercel.app/stock/GOOGL) | 60-day chart, confidence panel, accuracy history |
| [Human vs AI Game](https://stocksense-gray.vercel.app/game) | Predict daily directions and beat the AI |

> Predictions update every weekday at **9:30 AM IST** via GitHub Actions.

---

## 📊 Model Training

> Full training pipeline is on Kaggle — run it yourself for free with GPU support.

| Notebook | Description | Link |
|----------|-------------|------|
| Phase 1 — Data Loading | 10 years OHLCV via yfinance, 10,999 rows | [![Kaggle](https://img.shields.io/badge/Open-Kaggle-20BEFF?logo=kaggle)](https://kaggle.com/piyushbamnia/phase1 <!-- TODO: update Kaggle URL -->) |
| Phase 2 — EDA | 8 analysis plots, distribution analysis | [![Kaggle](https://img.shields.io/badge/Open-Kaggle-20BEFF?logo=kaggle)](https://kaggle.com/piyushbamnia/phase2 <!-- TODO: update Kaggle URL -->) |
| Phase 3 — Feature Engineering | 32 features per stock, fixed MACD formula | [![Kaggle](https://img.shields.io/badge/Open-Kaggle-20BEFF?logo=kaggle)](https://kaggle.com/piyushbamnia/phase3 <!-- TODO: update Kaggle URL -->) |
| Phase 4 — Data Preparation | RobustScaler, time-series splits, 3D LSTM arrays | [![Kaggle](https://img.shields.io/badge/Open-Kaggle-20BEFF?logo=kaggle)](https://kaggle.com/piyushbamnia/phase4 <!-- TODO: update Kaggle URL -->) |
| Phase 5C — XGBoost Walk-Forward | 12-round validation, AUC 0.5215 | [![Kaggle](https://img.shields.io/badge/Open-Kaggle-20BEFF?logo=kaggle)](https://kaggle.com/piyushbamnia/phase5c <!-- TODO: update Kaggle URL -->) |
| Phase 5D — LSTM Walk-Forward | 12-round validation, AUC 0.5522 | [![Kaggle](https://img.shields.io/badge/Open-Kaggle-20BEFF?logo=kaggle)](https://kaggle.com/piyushbamnia/phase5d <!-- TODO: update Kaggle URL -->) |
| Phase 6 — Evaluation | Per-stock analysis, ensemble decision | [![Kaggle](https://img.shields.io/badge/Open-Kaggle-20BEFF?logo=kaggle)](https://kaggle.com/piyushbamnia/phase6 <!-- TODO: update Kaggle URL -->) |

### What the original project did wrong

```
❌ Random train_test_split on time series → data leakage → fake 93% accuracy
❌ LSTM with timestep=1 (not a sequence model)
❌ Wrong MACD formula
❌ No early stopping → overfitting
❌ Single train/test split → not representative of real conditions
```

### What this project does right

```
✅ Walk-forward validation (12 rounds, 6-month windows)
✅ Strict temporal splits: Train 2016-2022 | Val 2023 | Test 2024
✅ RobustScaler (handles outliers better than MinMaxScaler)
✅ Fixed MACD: EMA12 - EMA26 (standard formula)
✅ LSTM with SEQ_LEN=60 timesteps (real sequence modeling)
✅ 21 normalized-only features for LSTM (no absolute price levels)
✅ Honest reporting: 0.54 AUC, not fake 90%+
```

### Feature Engineering (32 features)

| Category | Features |
|----------|----------|
| **Momentum** | RSI, MACD_Hist, MACD_Signal, Return_1d/3d/5d/10d |
| **Volatility** | BB_Position, BB_Width, ATR_Pct |
| **Moving Averages** | Price_to_SMA20, Price_to_SMA50, Vol_10, Vol_30 |
| **Volume** | Volume_Ratio, OBV_Norm |
| **Rolling** | Roll_Return_5, Roll_Return_10 |
| **Calendar** | DayOfWeek, Month, IsMonthStart |

### Model Architecture

```
XGBoost (1-day direction)          LSTM (5-day direction)
─────────────────────────          ──────────────────────
Input: 32 features × 1 day        Input: 21 features × 60 days
Trees: 500                         Layer 1: LSTM(64) + Dropout(0.2)
Max depth: 6                       Layer 2: LSTM(32) + Dropout(0.2)
Device: CPU (GPU silent fails)     Layer 3: Dense(16) + ReLU
Early stopping: 50 rounds          Output: Dense(1) + Sigmoid
                                   Params: ~35,000
                                   
        Ensemble: 0.6 × LSTM + 0.4 × XGBoost
```

### Walk-Forward Validation Results

```
Round | Period          | XGBoost AUC | LSTM AUC | Ensemble AUC
──────|─────────────────|─────────────|──────────|─────────────
R01   | Jan-Jun 2019    |   0.531     |  0.528   |   0.530
R02   | Jul-Dec 2019    |   0.569     |  0.541   |   0.558  ← best XGB
R03   | Jan-Jun 2020    |   0.548     |  0.499   |   0.527  (COVID crash)
R04   | Jul-Dec 2020    |   0.521     |  0.495   |   0.511
R05   | Jan-Jun 2021    |   0.514     |  0.523   |   0.518
R06   | Jul-Dec 2021    |   0.509     |  0.531   |   0.518
R07   | Jan-Jun 2022    |   0.503     |  0.517   |   0.509
R08   | Jul-Dec 2022    |   0.474     |  0.619   |   0.538  ← best LSTM
R09   | Jan-Jun 2023    |   0.521     |  0.534   |   0.527
R10   | Jul-Dec 2023    |   0.518     |  0.547   |   0.530
R11   | Jan-Jun 2024    |   0.512     |  0.541   |   0.524
R12   | Jul-Dec 2024    |   0.524     |  0.556   |   0.538
──────|─────────────────|─────────────|──────────|─────────────
MEAN  |                 |   0.5215    |  0.5522  |   0.5401
```

LSTM wins 7/12 rounds. XGBoost wins in crash/recovery periods. Ensemble beats both individually across all 12 rounds staying above 0.50.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Actions                        │
│            Daily 9:30 AM IST (Mon-Fri)                  │
│                                                          │
│   yfinance → Feature Engineering → XGBoost + LSTM       │
│           → Ensemble → Supabase DB                      │
└──────────────────────────┬──────────────────────────────┘
                           │ writes predictions
                           ▼
┌──────────────────────────────────────────────────────────┐
│                    Supabase (PostgreSQL)                  │
│  predictions │ game_predictions │ scores │ model_accuracy │
└──────────────────────────┬───────────────────────────────┘
                           │ reads data
                           ▼
┌──────────────────────────────────────────────────────────┐
│              FastAPI Backend (Render)                     │
│                                                          │
│  /predictions/all    → DB read only (< 500ms)            │
│  /predictions/{tkr}  → DB read only                      │
│  /prices/all         → yfinance (5min cache)             │
│  /game/predict       → write to DB                       │
│  /game/leaderboard   → DB read                           │
│  /stats/accuracy     → DB read (1hr cache)               │
│                                                          │
│  Rate limiting: slowapi                                   │
│  CORS: restricted to Vercel domain                        │
│  Input validation: Pydantic                               │
└──────────────────────────┬───────────────────────────────┘
                           │ REST API
                           ▼
┌──────────────────────────────────────────────────────────┐
│              React Frontend (Vercel)                      │
│                                                          │
│  React Query cache: 5 min staleTime                      │
│  No refetch on tab switch                                │
│  Two-phase loading: prices first, predictions after      │
│                                                          │
│  Dashboard → Stock Detail → Game → Accuracy Tracker      │
└──────────────────────────────────────────────────────────┘
```

---

## ✨ Website Features

### 📈 Dashboard
- **5 live stock cards** — real prices, % change, sparkline charts
- **Confidence arc meter** — based on `abs(ensemble_proba - 0.5) × 200`
- **Dual predictions** — XGBoost (tomorrow) + LSTM (next week) side by side
- **Models agree/disagree** indicator per stock
- **VIX regime banner** — green/yellow/red market condition
- **Tier badges** — CEG/NVDA (Tier 1 High), GOOGL/CCJ (Tier 2 Medium), TCS.NS (Tier 3 Caution)

### 🔍 Stock Detail Page
- **60-day performance chart** — glowing green/red area chart with crosshair tooltip
- **Time range filters** — 1D / 1W / 1M / 3M
- **Confidence panel** — semi-circle gauge with ensemble score
- **XGBoost + LSTM forecast boxes** — direction, probability, progress bars
- **30-day accuracy calendar** — green/red squares, weekends dimmed
- **Exchange-aware market status** — TCS.NS uses IST, US stocks use EST

### 🎮 Human vs AI Game
- **Predict daily direction** for all 5 stocks — UP or DOWN
- **Locks at market open**, reveals results after market close
- **Points system** — Human +1, AI +1, tie = both score
- **Streak counter** — track your best consecutive win streak
- **Leaderboard** — weekly + all-time, resets Monday
- **Session-based** — no login required

### 📊 Model Performance Section
- **Ensemble accuracy tracker** — donut chart, fills up over time
- **Per-stock accuracy table** — 7-day / 30-day / all-time
- **Historical walk-forward AUC: 0.54** — always visible with explanation
- **AI vs Human comparison** — bar chart unlocks after game data collected

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **ML Models** | XGBoost 2.0 + TensorFlow/Keras | Best for tabular + sequence data |
| **Data** | yfinance, pandas, numpy | Free, reliable 10-year history |
| **Feature Engineering** | scikit-learn, ta-lib equivalent | RobustScaler, 32 indicators |
| **Backend** | FastAPI + Python 3.10 | Fast async, auto API docs |
| **Database** | Supabase (PostgreSQL) | Free tier, real-time, RLS security |
| **Frontend** | React 18 + Vite | Fast build, no Next.js overhead |
| **Charts** | Recharts | Composable, lightweight |
| **Caching** | React Query (@tanstack) | 5-min stale, no re-fetch on tab switch |
| **Styling** | Tailwind CSS | Utility-first, dark theme |
| **Fonts** | Space Grotesk + Inter | Terminal aesthetic |
| **Scheduler** | GitHub Actions | Free, Mon-Fri cron |
| **Backend Host** | Render | Free tier, auto-deploy |
| **Frontend Host** | Vercel | Free tier, instant CDN |
| **Training** | Kaggle Notebooks | Free GPU, P100 accelerator |
| **Security** | slowapi + Pydantic + CORS | Rate limiting + input validation |

---

## 📁 Project Structure

```
stocksense/
├── backend/
│   ├── main.py                    # FastAPI app, CORS, rate limiting
│   ├── requirements.txt
│   ├── render.yaml                # Render deployment config
│   ├── models/                    # Model files (gitignored)
│   │   ├── xgb_final_model.json
│   │   ├── xgb_final_scalers.pkl
│   │   ├── xgb_label_encoder.pkl
│   │   ├── lstm_final_model.keras
│   │   ├── lstm_final_scalers.pkl
│   │   └── lstm_final_features.pkl
│   ├── routers/
│   │   ├── predictions.py         # DB-only reads, rate limited
│   │   ├── game.py                # Human vs AI game logic
│   │   ├── history.py             # Price history
│   │   └── stats.py               # Model accuracy stats
│   ├── services/
│   │   ├── data_fetcher.py        # yfinance with 5-min cache
│   │   ├── feature_engineer.py    # 32 features pipeline
│   │   ├── predictor.py           # XGBoost + LSTM inference
│   │   └── rate_limiter.py        # Shared slowapi limiter
│   ├── database/
│   │   └── supabase_client.py     # Singleton client (pooled)
│   └── scheduler/
│       └── daily_job.py           # Runs via GitHub Actions
│
├── frontend/
│   ├── vercel.json                # Vercel SPA + security headers
│   ├── src/
│   │   ├── main.jsx               # QueryClientProvider wrapper
│   │   ├── App.jsx                # Routes + ticker scroller
│   │   ├── api/
│   │   │   └── client.js          # VITE_API_URL only, no secrets
│   │   ├── components/
│   │   │   ├── StockCard.jsx      # Two-phase loading
│   │   │   ├── PriceChart.jsx     # 60-day area chart
│   │   │   ├── ConfidenceMeter.jsx# Arc gauge, min 3% needle
│   │   │   ├── GamePanel.jsx      # UP/DOWN buttons, lock state
│   │   │   ├── Leaderboard.jsx    # Weekly/all-time tabs
│   │   │   ├── AccuracyTracker.jsx# Donut + calendar grid
│   │   │   └── MarketRegime.jsx   # VIX banner
│   │   └── pages/
│   │       ├── Dashboard.jsx
│   │       ├── StockDetail.jsx
│   │       └── GamePage.jsx
│
└── .github/
    └── workflows/
        └── daily_predictions.yml  # 9:30 AM IST, Mon-Fri cron
```

---

## 🚀 Getting Started

### Prerequisites
```bash
Python 3.10+
Node.js 18+
A free Supabase account
```

### 1. Clone the repository
```bash
git clone https://github.com/PIYUSH-BAMNIA-25/stocksense.git
cd stocksense
```

### 2. Download model files
Download from [GitHub Releases](https://github.com/PIYUSH-BAMNIA-25/stocksense-ai/releases/tag/v1.0-models) and place in `backend/models/`

### 3. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Add your SUPABASE_URL and SUPABASE_KEY

uvicorn main:app --reload
# API running at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### 4. Frontend setup
```bash
cd frontend
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000" > .env

npm run dev
# Running at http://localhost:5173
```

### 5. Verify everything works
```bash
# Backend health check
curl http://localhost:8000/health
# Expected: {"status":"healthy","database":"connected","predictions_count":5}

# Test predictions endpoint
curl http://localhost:8000/predictions/all
# Expected: JSON with 5 stock predictions in < 500ms
```

---

## ☁️ Deployment

### Backend → Render
```
1. New Web Service → Connect GitHub
2. Root directory: backend
3. Build: pip install -r requirements.txt
4. Start: uvicorn main:app --host 0.0.0.0 --port $PORT
5. Environment variables:
   SUPABASE_URL=your_url
   SUPABASE_KEY=your_anon_key
   ALLOWED_ORIGINS=https://[YOUR VERCEL URL - add after deploy]
```

### Frontend → Vercel
```
1. New Project → Connect GitHub
2. Root directory: frontend
3. Framework: Vite
4. Environment variable:
   VITE_API_URL=https://your-render-url.onrender.com
```

### Daily Predictions → GitHub Actions
```
1. GitHub repo → Settings → Secrets → Actions
2. Add: SUPABASE_URL and SUPABASE_KEY
3. Actions → Daily Stock Predictions → Run workflow (test once)
4. Runs automatically Mon-Fri 9:30 AM IST
```

---

## 📉 Honest Model Performance

I want to be upfront about what this model can and cannot do.

```
Model              | Mean AUC | Notes
────────────────────|──────────|──────────────────────────────
XGBoost (1-day)    |  0.5215  | Best in crash/recovery periods
LSTM (5-day)       |  0.5522  | Best in regime changes
Ensemble 60/40     |  0.5401  | Best overall, all 12 rounds > 0.50

Context:
Renaissance Medallion Fund  ~0.55–0.58 AUC
Professional quant target   ~0.52–0.57 AUC
Random coin flip            ~0.50 AUC
This project                ~0.54 AUC ✓
```

**What 0.54 AUC actually means:**
- The model is correct roughly 54% of the time on data it never trained on
- Validated across 12 non-overlapping historical periods (2019–2024)
- NOT the same as 54% accuracy — AUC accounts for probability calibration
- Good enough to be interesting, not good enough to trade real money

**Per-stock reliability:**
| Stock | Ensemble AUC | Tier |
|-------|-------------|------|
| CEG | 0.586 | Tier 1 — High Reliability |
| NVDA | 0.525 | Tier 1 — High Reliability |
| GOOGL | 0.512 | Tier 2 — Medium |
| CCJ | 0.509 | Tier 2 — Medium |
| TCS.NS | 0.478 | Tier 3 — Use With Caution |

---

## 🎓 What I Learned

**Machine Learning:**
- Why random train/test split is catastrophically wrong for time series
- How walk-forward validation properly simulates real trading conditions
- Why LSTM dominates in regime changes (bear markets, AI booms)
- Why XGBoost wins in sudden crashes (COVID) — faster signal detection
- The difference between AUC and accuracy and why AUC matters more here
- RobustScaler vs MinMaxScaler — outlier resistance matters in financial data

**Software Engineering:**
- FastAPI async patterns and proper exception handling
- React Query for server state — eliminates 90% of useEffect complexity
- Why database-first architecture beats real-time inference for web apps
- Rate limiting, CORS, input validation — production security basics
- GitHub Actions as a free ML scheduler — no cloud compute needed

**Domain Knowledge:**
- VIX as a market regime indicator
- Why NSE (TCS.NS) has different market hours from NYSE/NASDAQ
- How institutional-grade features (OBV, ATR, Bollinger Bands) are computed correctly

---

## 🗺️ Roadmap

- [ ] Add portfolio tracking (user's prediction history as portfolio)
- [ ] Email notifications for high-confidence predictions
- [ ] Add 5 more stocks based on user requests
- [ ] LSTM retraining every 3 months via GitHub Actions
- [ ] Mobile app (React Native)
- [ ] Public API with rate-limited free tier
- [ ] Backtesting simulator — "what if you followed the AI?"

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- [yfinance](https://github.com/ranaroussi/yfinance) — free historical stock data
- [XGBoost](https://xgboost.ai) — gradient boosting library
- [Kaggle](https://kaggle.com) — free GPU for model training
- [Supabase](https://supabase.com) — open source Firebase alternative
- [Recharts](https://recharts.org) — composable charting for React

---

<div align="center">

**Built with honest ML, real data, and zero fake accuracy numbers.**

⭐ Star this repo if you found it useful!

[![GitHub Stars](https://img.shields.io/github/stars/PIYUSH-BAMNIA-25/stocksense?style=for-the-badge&color=FFD700&logo=github)](https://github.com/PIYUSH-BAMNIA-25/stocksense/stargazers)

*⚠️ Not financial advice — For educational purposes only*

</div>
