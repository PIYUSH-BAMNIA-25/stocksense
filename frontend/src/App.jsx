import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Dashboard from './pages/Dashboard'
import GamePage from './pages/GamePage'
import StockDetail from './pages/StockDetail'
import Footer from './components/Footer'
import { getPredictions } from './api/client'

function TickerScroller() {
    const { data } = useQuery({
        queryKey: ['predictions'],
        queryFn: () => getPredictions(),
    })

    const predictions = data?.predictions || []
    if (!predictions.length) return null

    // Duplicate for seamless loop
    const items = [...predictions, ...predictions]

    return (
        <div className="ticker-scroller">
            <div className="ticker-track">
                {items.map((p, i) => {
                    const changePct = p.price?.change_pct || 0
                    return (
                        <div className="ticker-item" key={i}>
                            <span className="ticker-symbol">{p.ticker}</span>
                            <span className={`ticker-change ${changePct >= 0 ? 'up' : 'down'}`}>
                                {changePct >= 0 ? '+' : ''}{changePct}%
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function MarketStatusPill() {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        const check = () => {
            const now = new Date()
            const est = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
            const hour = est.getHours()
            const min = est.getMinutes()
            const day = est.getDay()
            const timeValue = hour * 60 + min
            setIsOpen(day >= 1 && day <= 5 && timeValue >= 570 && timeValue < 960)
        }
        check()
        const interval = setInterval(check, 30000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className={`market-status-pill ${isOpen ? 'open' : 'closed'}`}>
            <div className="status-dot" />
            {isOpen ? 'MARKET OPEN' : 'MARKET CLOSED'}
        </div>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <nav className="navbar">
                <div className="navbar-brand">
                    <span className="logo-icon">📊</span>
                    <h1>StockSense AI</h1>
                    <div className="live-indicator">
                        <div className="live-dot" />
                        <span className="live-text">LIVE</span>
                    </div>
                </div>

                <TickerScroller />

                <div className="navbar-right">
                    <MarketStatusPill />
                    <ul className="nav-links">
                        <li><NavLink to="/" end>Dashboard</NavLink></li>
                        <li><NavLink to="/game">🎮 Game</NavLink></li>
                    </ul>
                </div>
            </nav>

            <div className="app-container">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/game" element={<GamePage />} />
                    <Route path="/stock/:ticker" element={<StockDetail />} />
                </Routes>
            </div>

            <Footer />
        </BrowserRouter>
    )
}
