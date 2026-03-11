import { useNavigate } from 'react-router-dom'
import PriceChart from './PriceChart'
import ConfidenceMeter from './ConfidenceMeter'

export default function StockCard({ prediction, prices = [], history = [], index = 0 }) {
    const navigate = useNavigate()

    if (!prediction) {
        return (
            <div className={`card fade-in-delay-${index}`}>
                <div className="skeleton skeleton-line" />
                <div className="skeleton skeleton-line medium" />
                <div className="skeleton" style={{ height: 100, marginTop: 12 }} />
            </div>
        )
    }

    const { ticker, direction, confidence, xgb_proba, lstm_proba, ensemble_proba, price, tier } = prediction
    const xgbDir = xgb_proba != null && xgb_proba >= 0.5 ? 'UP' : 'DOWN'
    const lstmDir = lstm_proba != null && lstm_proba >= 0.5 ? 'UP' : 'DOWN'
    const modelsAgree = xgbDir === lstmDir
    const changePct = price?.change_pct || 0
    const changeClass = changePct >= 0 ? 'up' : 'down'

    return (
        <div
            className={`card card-clickable fade-in-delay-${Math.min(index, 4)}`}
            onClick={() => navigate(`/stock/${ticker}`)}
        >
            {/* ROW 1: Ticker + Tier */}
            <div className="card-header" style={{ marginBottom: 'var(--space-sm)' }}>
                <h3 className="card-title" style={{ fontSize: '1rem' }}>{ticker}</h3>
                {tier && <span className={`tier-badge ${tier.color}`}>{tier.label}</span>}
            </div>

            {/* ROW 2: Price */}
            {price && (
                <div className="price-display" style={{ marginBottom: 'var(--space-sm)' }}>
                    <span className="price" style={{ fontSize: '1.6rem' }}>
                        {ticker === 'TCS.NS' ? '₹' : '$'}{price.price?.toLocaleString()}
                    </span>
                    <span className={`change ${changeClass}`}>
                        {changePct >= 0 ? '↑' : '↓'} {changePct >= 0 ? '+' : ''}{changePct}%
                    </span>
                </div>
            )}

            {/* ROW 3: Sparkline */}
            <PriceChart prices={prices} mode="sparkline" height={80} />

            {/* ROW 4: Confidence */}
            {confidence != null && (
                <ConfidenceMeter confidence={confidence} size={100} />
            )}

            {/* ROW 5: XGBoost + LSTM boxes */}
            <div className="prediction-boxes">
                <div className={`prediction-box ${xgbDir.toLowerCase()}`}>
                    <div className="label purple">XGBOOST</div>
                    <div className="direction">{xgbDir === 'UP' ? '↑' : '↓'} {xgbDir}</div>
                    <div className="prob-text">Prob: {((xgb_proba || 0) * 100).toFixed(1)}%</div>
                </div>
                <div className={`prediction-box ${lstmDir.toLowerCase()}`}>
                    <div className="label blue">LSTM</div>
                    <div className="direction">{lstmDir === 'UP' ? '↑' : '↓'} {lstmDir}</div>
                    <div className="prob-text">Prob: {((lstm_proba || 0.5) * 100).toFixed(1)}%</div>
                </div>
            </div>

            {/* ROW 6: Agreement indicator */}
            <div style={{ textAlign: 'center', marginTop: 'var(--space-sm)' }}>
                {modelsAgree ? (
                    <span className="agreement-pill agree">✓ Models agree</span>
                ) : (
                    <span className="agreement-pill disagree">⚡ Models disagree</span>
                )}
            </div>
        </div>
    )
}
