export default function StreakCounter({ humanStreak = 0, bestStreak = 0 }) {
    if (humanStreak < 3 && bestStreak < 3) return null

    return (
        <div className="streak-banner">
            <div className="streak-icon">
                {humanStreak >= 5 ? '🔥🔥' : humanStreak >= 3 ? '🔥' : '🏅'}
            </div>
            <div className="streak-text">
                {humanStreak >= 3 ? (
                    <>
                        <div className="streak-title">You're on a {humanStreak}-day winning streak!</div>
                        <div className="streak-subtitle">Keep it going — can you beat your best of {bestStreak}?</div>
                    </>
                ) : (
                    <>
                        <div className="streak-title">Best streak: {bestStreak} days</div>
                        <div className="streak-subtitle">Start a new winning streak today!</div>
                    </>
                )}
            </div>
        </div>
    )
}
