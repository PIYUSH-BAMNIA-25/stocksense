import { useQuery } from '@tanstack/react-query'
import { getPredictions, getPriceHistory } from '../api/client'
import StockCard from '../components/StockCard'
import MarketRegime from '../components/MarketRegime'
import AccuracyTracker from '../components/AccuracyTracker'

export default function Dashboard() {
    const { data: predData, isLoading: predsLoading, isError } = useQuery({
        queryKey: ['predictions'],
        queryFn: () => getPredictions(),
    })

    const predictions = predData?.predictions || []

    // Fetch price history for each prediction's ticker
    const { data: priceData } = useQuery({
        queryKey: ['allPriceHistory'],
        queryFn: async () => {
            const tickers = ['GOOGL', 'NVDA', 'TCS.NS', 'CCJ', 'CEG']
            const prices = {}
            await Promise.all(
                tickers.map(async (ticker) => {
                    try {
                        const priceRes = await getPriceHistory(ticker, 30)
                        prices[ticker] = priceRes.prices || []
                    } catch {
                        prices[ticker] = []
                    }
                })
            )
            return prices
        },
        staleTime: 5 * 60 * 1000,
    })

    return (
        <div className="page-enter">
            {/* Market Regime Banner */}
            <MarketRegime />

            {/* Header */}
            <div className="section-header">
                <h2>Stock Predictions Dashboard</h2>
                <p>✦ Powered by AI ensemble models (XGBoost + LSTM)</p>
            </div>

            {/* Error State */}
            {isError && (
                <div className="regime-banner high" style={{ marginBottom: 'var(--space-md)' }}>
                    ⚠️ Could not connect to API — check back soon
                </div>
            )}

            {/* Stock Cards Grid */}
            <div className="stock-grid">
                {predsLoading
                    ? [0, 1, 2, 3, 4].map(i => <StockCard key={i} prediction={null} index={i} />)
                    : predictions.map((pred, i) => (
                        <StockCard
                            key={pred.ticker}
                            prediction={pred}
                            prices={(priceData && priceData[pred.ticker]) || []}
                            index={i}
                        />
                    ))
                }
            </div>

            {/* Model Performance Section */}
            <div style={{ marginTop: 'var(--space-2xl)' }}>
                <div className="section-header">
                    <h2>📈 Model Performance</h2>
                    <p>Track how well the AI models have been predicting</p>
                </div>
                <AccuracyTracker />
            </div>
        </div>
    )
}
