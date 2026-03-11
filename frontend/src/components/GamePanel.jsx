import { useState, useEffect } from 'react'
import { submitPrediction, getSessionId, getUsername } from '../api/client'

const TICKERS = ['GOOGL', 'NVDA', 'TCS.NS', 'CCJ', 'CEG']

export default function GamePanel({ predictions = [] }) {
    const [userPicks, setUserPicks] = useState({})
    const [locked, setLocked] = useState({})
    const [countdown, setCountdown] = useState('')
    const [marketOpen, setMarketOpen] = useState(false)

    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date()
            const est = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
            const marketOpenTime = new Date(est)
            marketOpenTime.setHours(9, 30, 0, 0)
            const marketCloseTime = new Date(est)
            marketCloseTime.setHours(16, 0, 0, 0)

            if (est >= marketOpenTime && est < marketCloseTime && est.getDay() >= 1 && est.getDay() <= 5) {
                setMarketOpen(true)
                const diff = marketCloseTime - est
                const h = Math.floor(diff / 3600000)
                const m = Math.floor((diff % 3600000) / 60000)
                const s = Math.floor((diff % 60000) / 1000)
                setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
            } else {
                setMarketOpen(false)
                if (est < marketOpenTime) {
                    const diff = marketOpenTime - est
                    const h = Math.floor(diff / 3600000)
                    const m = Math.floor((diff % 3600000) / 60000)
                    const s = Math.floor((diff % 60000) / 1000)
                    setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
                } else {
                    setCountdown('Market closed')
                }
            }
        }
        updateCountdown()
        const interval = setInterval(updateCountdown, 1000)
        return () => clearInterval(interval)
    }, [])

    const handlePick = async (ticker, direction) => {
        if (locked[ticker]) return
        setUserPicks(prev => ({ ...prev, [ticker]: direction }))
        setLocked(prev => ({ ...prev, [ticker]: true }))
        try {
            await submitPrediction({
                session_id: getSessionId(),
                username: getUsername(),
                ticker,
                prediction: direction,
            })
        } catch (err) {
            console.error('Failed to submit prediction:', err)
        }
    }

    return (
        <div className="fade-in">
            {/* Header with session + timer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.3rem' }}>Active Predictions</h2>
                    <span style={{ padding: '3px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        SESSION #{getSessionId().slice(-6).toUpperCase()}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    ⏱ Ends in: <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--green)' }}>{countdown}</span>
                </div>
            </div>

            {/* Prediction cards - 2 per row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)' }}>
                {TICKERS.map((ticker, i) => {
                    const pred = predictions.find(p => p.ticker === ticker)
                    const pick = userPicks[ticker]
                    const isLocked = locked[ticker]
                    const aiDirection = pred?.direction

                    return (
                        <div key={ticker} className={`card fade-in-delay-${Math.min(i, 4)}`} style={{ padding: 'var(--space-md)' }}>
                            {/* Stock info */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1rem' }}>{ticker}</span>
                                    {pred?.price && (
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {ticker === 'TCS.NS' ? '₹' : '$'}{pred.price.price} <span style={{ color: pred.price.change_pct >= 0 ? 'var(--green)' : 'var(--red)' }}>
                                                {pred.price.change_pct >= 0 ? '+' : ''}{pred.price.change_pct}%
                                            </span>
                                        </span>
                                    )}
                                </div>
                                {isLocked && <span style={{ fontSize: '0.85rem' }}>🔒</span>}
                            </div>

                            {isLocked ? (
                                <div>
                                    {/* Locked prediction — with glow */}
                                    <div style={{
                                        padding: 'var(--space-md)',
                                        borderRadius: 'var(--radius-md)',
                                        textAlign: 'center',
                                        fontWeight: 700,
                                        fontFamily: 'Space Grotesk',
                                        fontSize: '0.95rem',
                                        background: pick === 'UP' ? 'var(--green)' : 'var(--red)',
                                        color: pick === 'UP' ? 'var(--bg-primary)' : '#fff',
                                        boxShadow: pick === 'UP'
                                            ? '0 0 20px rgba(0,200,150,0.4), 0 0 40px rgba(0,200,150,0.15)'
                                            : '0 0 20px rgba(255,75,75,0.4), 0 0 40px rgba(255,75,75,0.15)',
                                    }}>
                                        ✓ {pick === 'UP' ? 'UP' : 'DOWN'} — Locked
                                    </div>
                                    {/* AI prediction */}
                                    {aiDirection && (
                                        <div style={{ marginTop: 'var(--space-sm)', fontSize: '0.75rem', color: 'var(--purple)', textAlign: 'center' }}>
                                            AI predicts: {aiDirection === 'UP' ? '↑' : '↓'} {aiDirection}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="game-buttons" style={{ margin: 0 }}>
                                    <button className="btn btn-up" onClick={() => handlePick(ticker, 'UP')}>
                                        ↑ UP
                                    </button>
                                    <button className="btn btn-down" onClick={() => handlePick(ticker, 'DOWN')}>
                                        ↓ DOWN
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
