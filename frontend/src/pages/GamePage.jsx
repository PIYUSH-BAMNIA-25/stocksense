import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPredictions, getGameScores, getSessionId, getUsername, setUsername } from '../api/client'
import GamePanel from '../components/GamePanel'
import ScoreBoard from '../components/ScoreBoard'
import Leaderboard from '../components/Leaderboard'

export default function GamePage() {
    const [name, setName] = useState(getUsername() || '')
    const [showNameInput, setShowNameInput] = useState(!getUsername())
    const [nameSaved, setNameSaved] = useState(false)

    const { data: predData, isLoading: predsLoading } = useQuery({
        queryKey: ['predictions'],
        queryFn: () => getPredictions(),
    })

    const { data: scoreData } = useQuery({
        queryKey: ['scores', getSessionId()],
        queryFn: () => getGameScores(getSessionId()),
    })

    const predictions = predData?.predictions || []
    const scores = scoreData?.scores || {}

    const handleSetName = () => {
        if (name.trim()) {
            setUsername(name.trim())
            setShowNameInput(false)
            setNameSaved(true)
            setTimeout(() => setNameSaved(false), 2000)
        }
    }

    return (
        <div className="page-enter">
            {/* Header */}
            <div className="section-header">
                <h2>🧠 Human vs 🤖 AI</h2>
                <p>Can you beat the AI? Predict stock directions daily and track your score!</p>
            </div>

            {/* ScoreBoard */}
            <ScoreBoard scores={scores} />

            {/* Two Column Layout */}
            <div className="two-col-layout" style={{ marginTop: 'var(--space-xl)' }}>
                {/* Left: Game Panel */}
                <GamePanel predictions={predictions} />

                {/* Right: Claim Rank + Leaderboard */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    {/* Claim Your Rank */}
                    <div className="card claim-rank-box fade-in">
                        <h3 className="card-title">Claim Your Rank</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                            Set your display name to join the global leaderboard.
                        </p>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Enter display name..."
                            onKeyDown={e => e.key === 'Enter' && handleSetName()}
                        />
                        <button className="btn-save" onClick={handleSetName}>
                            {nameSaved ? '✓ Saved' : 'Save Changes'}
                        </button>
                    </div>

                    {/* Leaderboard */}
                    <Leaderboard />
                </div>
            </div>
        </div>
    )
}
