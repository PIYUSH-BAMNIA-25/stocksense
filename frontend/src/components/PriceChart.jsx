import { useMemo } from 'react'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts'

/**
 * Sparkline mode: tiny chart for stock cards (no axes)
 * Full mode: detailed chart for stock detail page
 */
export default function PriceChart({ prices = [], predictions = [], mode = 'sparkline', height = 100 }) {
    const chartData = useMemo(() => {
        if (!prices.length) return []
        return prices.map((p) => {
            const pred = predictions.find((pr) => pr.date === p.date)
            return {
                date: p.date,
                close: p.close,
                predDirection: pred?.direction || null,
                wasCorrect: pred?.was_correct ?? null,
            }
        })
    }, [prices, predictions])

    if (!chartData.length) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: '12px' }} />
            </div>
        )
    }

    const lastPrice = chartData[chartData.length - 1]?.close || 0
    const firstPrice = chartData[0]?.close || 0
    const isUp = lastPrice >= firstPrice
    const strokeColor = isUp ? '#00C896' : '#FF4B4B'
    const fillColor = isUp ? 'url(#greenGrad)' : 'url(#redGrad)'

    if (mode === 'sparkline') {
        return (
            <div style={{ width: '100%', height }}>
                <ResponsiveContainer>
                    <AreaChart data={chartData} margin={{ top: 5, right: 0, bottom: 0, left: 0 }}>
                        <defs>
                            <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#00C896" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#00C896" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#FF4B4B" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#FF4B4B" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="close"
                            stroke={strokeColor}
                            strokeWidth={2}
                            fill={fillColor}
                            dot={false}
                            style={{ filter: `drop-shadow(0 0 4px ${isUp ? 'rgba(0,200,150,0.5)' : 'rgba(255,75,75,0.5)'})` }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        )
    }

    // Full mode with axes
    const minP = Math.min(...chartData.map(d => d.close)) * 0.995
    const maxP = Math.max(...chartData.map(d => d.close)) * 1.005

    // Build colored areas for predictions
    const areas = []
    chartData.forEach((d, i) => {
        if (d.predDirection && i < chartData.length - 1) {
            areas.push({
                x1: d.date,
                x2: chartData[i + 1]?.date || d.date,
                fill: d.predDirection === 'UP' ? 'rgba(0,200,150,0.06)' : 'rgba(255,75,75,0.06)',
            })
        }
    })

    return (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 5 }}>
                    <defs>
                        <linearGradient id="greenGradFull" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00C896" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#00C896" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    {areas.map((a, i) => (
                        <ReferenceArea key={i} x1={a.x1} x2={a.x2} fill={a.fill} />
                    ))}
                    <XAxis
                        dataKey="date"
                        tick={{ fill: '#4A5A4A', fontSize: 10, fontFamily: 'Inter' }}
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(0,255,128,0.08)' }}
                        tickFormatter={(v) => {
                            const d = new Date(v)
                            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        }}
                    />
                    <YAxis
                        domain={[minP, maxP]}
                        tick={{ fill: '#4A5A4A', fontSize: 10, fontFamily: 'Space Grotesk' }}
                        tickLine={false}
                        axisLine={false}
                        width={60}
                        orientation="right"
                        tickFormatter={(v) => `$${v.toFixed(0)}`}
                    />
                    <Tooltip
                        contentStyle={{
                            background: '#0d1a0d',
                            border: '1px solid rgba(0,255,128,0.15)',
                            borderRadius: 10,
                            fontSize: 12,
                            fontFamily: 'Space Grotesk',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        }}
                        labelStyle={{ color: '#7A8A7A' }}
                        formatter={(val) => [`$${val.toFixed(2)}`, 'Close']}
                        labelFormatter={(label) => {
                            const d = new Date(label)
                            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="close"
                        stroke="#00C896"
                        strokeWidth={2}
                        fill="url(#greenGradFull)"
                        dot={false}
                        activeDot={{ r: 4, fill: '#00C896', stroke: '#0a0f0a', strokeWidth: 2 }}
                        style={{ filter: 'drop-shadow(0 0 6px rgba(0,200,150,0.4))' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
