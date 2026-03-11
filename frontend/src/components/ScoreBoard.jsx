import StreakCounter from './StreakCounter'

export default function ScoreBoard({ scores = {} }) {
    const { human_points = 0, ai_points = 0, streak = 0, best_streak = 0, total_games = 0 } = scores
    const wins = human_points
    const losses = total_games - human_points
    const winRate = total_games > 0 ? Math.round((human_points / total_games) * 100) : 0

    return (
        <div className="fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-lg)', alignItems: 'start' }}>
                {/* Score display */}
                <div className="scoreboard">
                    <div className="score-side human">
                        <div className="score-label">🧠 HUMAN</div>
                        <div className="score-number">{human_points}</div>
                    </div>
                    <div className="vs">vs</div>
                    <div className="score-side ai">
                        <div className="score-label">🤖 AI</div>
                        <div className="score-number">{ai_points}</div>
                    </div>
                </div>

                {/* Stats boxes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                    <div className="stat-box">
                        <div className="stat-icon">🎮</div>
                        <div className="stat-value">{total_games}</div>
                        <div className="stat-label">GAMES PLAYED</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-icon">📊</div>
                        <div className="stat-value" style={{ color: wins >= losses ? 'var(--green)' : 'var(--red)' }}>
                            {wins}-{losses}
                        </div>
                        <div className="stat-label">RECORD</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-icon">🎯</div>
                        <div className="stat-value">{winRate}%</div>
                        <div className="stat-label">WIN RATE</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-icon">🏆</div>
                        <div className="stat-value">{best_streak}</div>
                        <div className="stat-label">BEST STREAK</div>
                    </div>
                </div>
            </div>

            <StreakCounter humanStreak={streak} bestStreak={best_streak} />
        </div>
    )
}
