import { useQuery } from '@tanstack/react-query'
import { getMarketRegime } from '../api/client'

export default function MarketRegime() {
    const { data: regime, isLoading } = useQuery({
        queryKey: ['marketRegime'],
        queryFn: () => getMarketRegime(),
    })

    if (isLoading || !regime) return null

    const { vix, alerts } = regime
    const bannerClass = vix.status === 'calm' ? 'calm' : vix.status === 'high' ? 'high' : 'moderate'
    const icon = vix.status === 'calm' ? '🟢' : vix.status === 'high' ? '🔴' : '⚠️'

    return (
        <div className="fade-in">
            <div className={`regime-banner ${bannerClass}`}>
                <span style={{ fontSize: '1rem' }}>{icon}</span>
                <div style={{ flex: 1 }}>
                    <strong>VIX: {vix.value}</strong> — {vix.message}
                </div>
            </div>
            {alerts?.map((alert, i) => (
                <div key={i} className="regime-banner high" style={{ marginTop: 4 }}>
                    ⚠️ {alert.message}
                </div>
            ))}
        </div>
    )
}
