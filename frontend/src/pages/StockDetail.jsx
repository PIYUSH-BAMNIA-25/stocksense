import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPrediction, getPriceHistory, getHistory } from '../api/client'
import PriceChart from '../components/PriceChart'
import ConfidenceMeter from '../components/ConfidenceMeter'

const STOCK_NAMES = {
    GOOGL: 'Alphabet Inc.',
    NVDA: 'NVIDIA Corp.',
    'TCS.NS': 'Tata Consultancy Services',
    CCJ: 'Cameco Corporation',
    CEG: 'Constellation Energy Corporation',
}

const STOCK_EXCHANGE = {
    GOOGL: { name: 'NASDAQ', color: 'blue', hours: '9:30 AM – 4:00 PM EST' },
    NVDA: { name: 'NASDAQ', color: 'blue', hours: '9:30 AM – 4:00 PM EST' },
    'TCS.NS': { name: 'NSE', color: 'orange', hours: '9:15 AM – 3:30 PM IST' },
    CCJ: { name: 'NYSE', color: 'blue', hours: '9:30 AM – 4:00 PM EST' },
    CEG: { name: 'NYSE', color: 'blue', hours: '9:30 AM – 4:00 PM EST' },
}

export default function StockDetail() {
    const { ticker } = useParams()
    const [chartRange, setChartRange] = useState('1M')

    const rangeDays = { '1D': 1, '1W': 7, '1M': 30, '3M': 90 }

    const { data, isLoading: predLoading } = useQuery({
        queryKey: ['prediction', ticker],
        queryFn: () => getPrediction(ticker),
    })

    const { data: priceRes } = useQuery({
        queryKey: ['priceHistory', ticker],
        queryFn: () => getPriceHistory(ticker, 60),
    })

    const { data: histRes } = useQuery({
        queryKey: ['history', ticker],
        queryFn: () => getHistory(ticker, 30),
    })

    const prices = priceRes?.prices || []
    const history = histRes?.history || []

    if (predLoading) {
        return (
            <div className="page-enter">
                <div className="skeleton skeleton-line" style={{ height: 32, width: 200 }} />
                <div className="skeleton" style={{ height: 400, marginTop: 16 }} />
            </div>
        )
    }

    const latest = data?.latest || {}
    const price = data?.price || {}
    const tier = data?.tier || {}
    const changePct = price?.change_pct || 0
    const changeClass = changePct >= 0 ? 'up' : 'down'
    const exchange = STOCK_EXCHANGE[ticker] || { name: 'NYSE', color: 'blue', hours: '9:30 AM – 4:00 PM EST' }

    const xgbDir = (latest.xgb_proba || 0.5) >= 0.5 ? 'UP' : 'DOWN'
    const lstmDir = (latest.lstm_proba || 0.5) >= 0.5 ? 'UP' : 'DOWN'
    const modelsAgree = xgbDir === lstmDir

    // Filter prices to selected range
    const filteredPrices = prices.slice(-rangeDays[chartRange])

    const correctCount = history.filter(h => h.was_correct === true).length
    const totalVerified = history.filter(h => h.was_correct !== null).length
    const successRate = totalVerified > 0 ? Math.round((correctCount / totalVerified) * 100) : 0

    // Generate 30-day calendar grid (always show 30 cells)
    const calendarCells = []
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const dayOfWeek = d.getDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
        const isToday = i === 0
        const match = history.find(h => h.date === dateStr)
        calendarCells.push({
            date: dateStr,
            isWeekend,
            isToday,
            was_correct: match?.was_correct ?? null,
            direction: match?.direction ?? null,
        })
    }

    return (
        <div className="page-enter">
            {/* Back link */}
            <Link to="/" style={{ fontSize: '0.85rem' }}>← Back to Dashboard</Link>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 'var(--space-md)', flexWrap: 'wrap', gap: 'var(--space-lg)' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <h1 style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'Space Grotesk' }}>{ticker}</h1>
                        <span style={{
                            padding: '3px 10px',
                            background: exchange.color === 'orange' ? 'rgba(255,165,0,0.1)' : 'rgba(59,130,246,0.1)',
                            border: `1px solid ${exchange.color === 'orange' ? 'rgba(255,165,0,0.3)' : 'rgba(59,130,246,0.3)'}`,
                            borderRadius: 'var(--radius-pill)',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: exchange.color === 'orange' ? '#FFA500' : '#3B82F6',
                        }}>
                            {exchange.name}
                        </span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
                        {STOCK_NAMES[ticker] || ticker}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    {price && (
                        <>
                            <div className="price-display" style={{ justifyContent: 'flex-end' }}>
                                <span className="price" style={{ fontSize: '2.2rem' }}>
                                    {ticker === 'TCS.NS' ? '₹' : '$'}{price.price}
                                </span>
                                <span className={`change ${changeClass}`}>
                                    {changePct >= 0 ? '+' : ''}{changePct}%
                                </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                VOL: {(price.volume || 0).toLocaleString()} · {exchange.hours}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Main content: chart + confidence */}
            <div className="two-col-layout" style={{ marginTop: 'var(--space-xl)' }}>
                <div className="detail-main">
                    {/* Chart */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                            <h3 className="card-title">✦ 60-Day Performance & AI Forecast</h3>
                            <div className="time-range-buttons">
                                {['1D', '1W', '1M', '3M'].map(r => (
                                    <button
                                        key={r}
                                        className={`time-range-btn ${chartRange === r ? 'active' : ''}`}
                                        onClick={() => setChartRange(r)}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <PriceChart prices={filteredPrices} predictions={history} mode="full" height={280} />
                    </div>

                    {/* Forecast Boxes */}
                    <div className="forecast-grid">
                        {/* XGBoost */}
                        <div className="forecast-box">
                            <div className="forecast-title">XGBOOST FORECAST</div>
                            <div className={`forecast-direction ${xgbDir.toLowerCase()}`}>
                                {xgbDir === 'UP' ? '↑ UP' : '↓ DOWN'}
                            </div>
                            <div className="forecast-subtitle">Tomorrow's direction</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
                                Probability: {((latest.xgb_proba || 0) * 100).toFixed(1)}%
                            </div>
                            <div className="progress-bar">
                                <div
                                    className={`progress-fill ${xgbDir === 'UP' ? 'green' : 'red'}`}
                                    style={{ width: `${(latest.xgb_proba || 0.5) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* LSTM */}
                        <div className="forecast-box">
                            <div className="forecast-title">LSTM NEURAL NET</div>
                            <div className={`forecast-direction ${lstmDir.toLowerCase()}`}>
                                {lstmDir === 'UP' ? '↑ UP' : '↓ DOWN'}
                            </div>
                            <div className="forecast-subtitle">Next week's direction</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
                                Probability: {((latest.lstm_proba || 0.5) * 100).toFixed(1)}%
                            </div>
                            <div className="progress-bar">
                                <div
                                    className={`progress-fill ${lstmDir === 'UP' ? 'green' : 'red'}`}
                                    style={{ width: `${(latest.lstm_proba || 0.5) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="detail-sidebar">
                    {/* Confidence Panel */}
                    <div className="card" style={{ textAlign: 'center' }}>
                        <h3 className="card-title" style={{ textAlign: 'left' }}>📊 Confidence Panel</h3>
                        <ConfidenceMeter confidence={latest.confidence || 0} size={160} showLabel={false} />
                        <div style={{ fontFamily: 'Space Grotesk', fontSize: '0.7rem', fontWeight: 600, color: 'var(--green)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            ENSEMBLE SCORE
                        </div>

                        <div style={{ marginTop: 'var(--space-lg)', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>XGBoost Probability</span>
                                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700 }}>{((latest.xgb_proba || 0) * 100).toFixed(1)}%</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>LSTM Probability</span>
                                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700 }}>{((latest.lstm_proba || 0.5) * 100).toFixed(1)}%</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Overall Signal</span>
                                <span style={{ fontWeight: 700, color: modelsAgree ? 'var(--green)' : 'var(--yellow)' }}>
                                    {modelsAgree ? 'MODELS AGREE ✓' : 'CONFLICTED ⚡'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Accuracy History Calendar — always 30 cells */}
                    <div className="card">
                        <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>📅 Accuracy History (30D)</h3>
                        <div className="accuracy-calendar">
                            {calendarCells.map((cell, i) => (
                                <div
                                    key={i}
                                    className={`accuracy-cell ${cell.was_correct === true ? 'correct' : cell.was_correct === false ? 'wrong' : 'none'} ${cell.isToday ? 'today' : ''} ${cell.isWeekend ? 'weekend' : ''}`}
                                    title={`${cell.date}: ${cell.direction ? `${cell.direction} → ${cell.was_correct === true ? '✅' : cell.was_correct === false ? '❌' : '⏳'}` : 'No data'}`}
                                />
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-md)', fontSize: '0.7rem' }}>
                            <div>
                                <span style={{ color: 'var(--green)' }}>●</span> HIT
                                <span style={{ marginLeft: 'var(--space-md)', color: 'var(--red)' }}>●</span> MISS
                            </div>
                            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700 }}>
                                SUCCESS RATE: {successRate}%
                            </span>
                        </div>
                    </div>

                    {/* Tier Badge */}
                    {tier && (
                        <div className="card" style={{ textAlign: 'center' }}>
                            <span className={`tier-badge ${tier.color}`} style={{ fontSize: '0.75rem', padding: '6px 20px' }}>
                                {tier.label}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="timestamp" style={{ marginTop: 'var(--space-xl)' }}>
                🕐 Last updated: {latest.date || 'N/A'}
            </div>
        </div>
    )
}
