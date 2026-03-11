export default function ConfidenceMeter({ confidence = 0, size = 120, showLabel = true }) {
    const radius = (size - 20) / 2
    const cx = size / 2
    const cy = size / 2 + 10
    const startAngle = Math.PI
    const endAngle = 0

    const clampedConf = Math.max(0, Math.min(100, confidence))
    // Minimum needle position at 3% so it's never stuck at far left
    const displayConf = Math.max(3, clampedConf)
    const angle = startAngle - (displayConf / 100) * Math.PI

    const needleX = cx + radius * 0.75 * Math.cos(angle)
    const needleY = cy - radius * 0.75 * Math.sin(angle)

    let color, label
    if (clampedConf > 66) {
        color = '#00C896'
        label = 'HIGH'
    } else if (clampedConf >= 33) {
        color = '#FFB800'
        label = 'MEDIUM'
    } else {
        color = '#FF4B4B'
        label = 'LOW'
    }

    // Display text: show "< 1%" instead of "0"
    const displayText = clampedConf < 1 ? '< 1%' : `${Math.round(clampedConf)}`

    const arcPath = (sA, eA, r) => {
        const x1 = cx + r * Math.cos(sA)
        const y1 = cy - r * Math.sin(sA)
        const x2 = cx + r * Math.cos(eA)
        const y2 = cy - r * Math.sin(eA)
        return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`
    }

    return (
        <div className="confidence-meter">
            <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`}>
                {/* Track */}
                <path
                    d={arcPath(startAngle, endAngle, radius)}
                    fill="none"
                    stroke="rgba(0,255,128,0.06)"
                    strokeWidth="7"
                    strokeLinecap="round"
                />
                {/* Fill */}
                <path
                    d={arcPath(startAngle, angle, radius)}
                    fill="none"
                    stroke={color}
                    strokeWidth="7"
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
                />
                {/* Needle */}
                <line
                    x1={cx} y1={cy}
                    x2={needleX} y2={needleY}
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                <circle cx={cx} cy={cy} r="3" fill={color} />
                {/* Value */}
                <text
                    x={cx} y={cy - 14}
                    textAnchor="middle"
                    fill="#E8ECE8"
                    fontSize={clampedConf < 1 ? "12" : "16"}
                    fontWeight="700"
                    fontFamily="Space Grotesk"
                >
                    {displayText}
                </text>
            </svg>
            {showLabel && (
                <span className={`confidence-label ${label.toLowerCase()}`}>
                    CONFIDENCE
                </span>
            )}
            {/* Low confidence helper text */}
            {clampedConf < 10 && (
                <div style={{
                    fontSize: '0.68rem',
                    color: 'rgba(255,255,255,0.35)',
                    textAlign: 'center',
                    marginTop: 2,
                    lineHeight: 1.3,
                }}>
                    Models nearly tied — very low signal today
                </div>
            )}
        </div>
    )
}
