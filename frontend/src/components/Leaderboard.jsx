import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getLeaderboard, getSessionId } from '../api/client'

export default function Leaderboard() {
    const [period, setPeriod] = useState('weekly')
    const sessionId = getSessionId()

    const { data: res, isLoading } = useQuery({
        queryKey: ['leaderboard', period],
        queryFn: () => getLeaderboard(period),
    })

    const data = res?.leaderboard || []

    const getInitials = (name) => {
        return (name || 'U').split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    }

    const getRankIcon = (rank) => {
        if (rank === 1) return '🥇'
        if (rank === 2) return '🥈'
        if (rank === 3) return '🥉'
        return rank
    }

    return (
        <div className="card fade-in">
            <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>Leaderboard</h3>

            <div className="tabs">
                <button className={`tab ${period === 'weekly' ? 'active' : ''}`} onClick={() => setPeriod('weekly')}>
                    This Week
                </button>
                <button className={`tab ${period === 'alltime' ? 'active' : ''}`} onClick={() => setPeriod('alltime')}>
                    All Time
                </button>
            </div>

            {isLoading ? (
                <div>{[1, 2, 3].map(i => <div key={i} className="skeleton skeleton-line" style={{ height: 40, marginBottom: 8 }} />)}</div>
            ) : data.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🏆</div>
                    <div className="empty-text">No players yet</div>
                    <div className="empty-subtext">Be the first to beat the AI!</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {data.map(row => {
                        const isYou = row.session_id === sessionId
                        return (
                            <div
                                key={row.rank}
                                className={isYou ? 'highlighted' : ''}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-md)',
                                    padding: '8px var(--space-md)',
                                    borderRadius: 'var(--radius-sm)',
                                    background: isYou ? 'var(--green-dim)' : 'rgba(0,0,0,0.2)',
                                    border: isYou ? '1px solid rgba(0,200,150,0.2)' : '1px solid transparent',
                                }}
                            >
                                <span className={`rank-badge ${row.rank <= 3 ? ['', 'gold', 'silver', 'bronze'][row.rank] : ''}`} style={{ width: 24, textAlign: 'center' }}>
                                    {getRankIcon(row.rank)}
                                </span>
                                <div className="avatar-initials">{getInitials(row.username)}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                        {row.username} {isYou && <span style={{ color: 'var(--green)', fontSize: '0.7rem' }}>(You)</span>}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        {row.win_rate}% WR{row.streak >= 3 ? ` · 🔥 ${row.streak} streak` : ''}
                                    </div>
                                </div>
                                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--green)', fontSize: '0.9rem' }}>
                                    +{row.human_points} <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>PTS</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
