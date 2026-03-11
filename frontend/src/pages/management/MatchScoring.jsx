import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, Trophy, Loader2, CheckCircle, Crown } from 'lucide-react'
import { api } from '../../api'

export default function MatchScoring() {
    const navigate = useNavigate()
    const [games, setGames] = useState([])
    const [selectedGame, setSelectedGame] = useState('')
    const [matches, setMatches] = useState([])
    const [saving, setSaving] = useState(null)
    const [saved, setSaved] = useState(null)

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (!['admin', 'management'].includes(user.role)) { navigate('/login'); return }
        api.getGames().then(data => { if (Array.isArray(data)) setGames(data) }).catch(() => { })
    }, [navigate])

    useEffect(() => {
        if (selectedGame) refreshMatches()
    }, [selectedGame])

    const refreshMatches = async () => {
        const data = await api.getMatches(selectedGame)
        if (Array.isArray(data)) setMatches(data.filter(m => m.team_2 !== 'BYE'))
    }

    const updateScore = (idx, field, value) => {
        setMatches(prev => prev.map((m, i) => i === idx ? { ...m, [field]: Number(value) || 0 } : m))
    }

    const saveScore = async (idx) => {
        const match = matches[idx]
        const s1 = match.team_1_score ?? 0
        const s2 = match.team_2_score ?? 0
        if (s1 === s2) return // Scores can't be tied — auto-determine needs a clear winner

        const winner = s1 > s2 ? match.team_1 : match.team_2

        setSaving(idx)
        try {
            await api.updateScore(match.match_id, {
                team_1_score: s1,
                team_2_score: s2,
                winner,
            })
            setMatches(prev => prev.map((m, i) => i === idx ? { ...m, winner, match_status: 'completed' } : m))
            setSaved(idx)
            setTimeout(() => setSaved(null), 2000)
        } catch { }
        setSaving(null)
    }

    const pendingMatches = matches.filter(m => !m.winner)
    const completedMatches = matches.filter(m => m.winner)

    return (
        <div className="min-h-screen pt-20 pb-16">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                <Link to="/admin/tournament" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm">
                    <ArrowLeft size={16} /> Back to Tournament
                </Link>

                <h1 className="font-display text-3xl font-bold text-white mb-2">Match Scoring</h1>
                <p className="text-gray-500 mb-6">Enter scores — winner is determined automatically</p>

                <select
                    value={selectedGame}
                    onChange={e => setSelectedGame(e.target.value)}
                    className="input-field text-sm mb-8"
                >
                    <option value="">Select a game...</option>
                    {games.map(g => <option key={g.id} value={g.id}>{g.game_name}</option>)}
                </select>

                {/* Pending Matches */}
                {pendingMatches.length > 0 && (
                    <div className="space-y-4 mb-8">
                        <h3 className="font-display text-lg font-bold text-white">Pending ({pendingMatches.length})</h3>
                        {pendingMatches.map((match) => {
                            const idx = matches.indexOf(match)
                            const s1 = match.team_1_score ?? 0
                            const s2 = match.team_2_score ?? 0
                            const autoWinner = s1 !== s2 ? (s1 > s2 ? match.team_1 : match.team_2) : null

                            return (
                                <div key={idx} className="glass rounded-2xl p-6 animate-fade-in">
                                    <p className="text-xs text-gray-500 mb-4">Round {match.round} • Match {match.match_number || idx + 1}</p>

                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="flex-1 text-center">
                                            <p className={`font-bold mb-2 truncate ${autoWinner === match.team_1 ? 'text-neon-green' : 'text-white'}`}>{match.team_1}</p>
                                            <input
                                                type="number" min="0"
                                                value={match.team_1_score ?? ''}
                                                onChange={e => updateScore(idx, 'team_1_score', e.target.value)}
                                                className="input-field text-center text-2xl font-bold !py-4"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="text-gray-600 font-display text-xl font-bold py-8">VS</div>
                                        <div className="flex-1 text-center">
                                            <p className={`font-bold mb-2 truncate ${autoWinner === match.team_2 ? 'text-neon-green' : 'text-white'}`}>{match.team_2}</p>
                                            <input
                                                type="number" min="0"
                                                value={match.team_2_score ?? ''}
                                                onChange={e => updateScore(idx, 'team_2_score', e.target.value)}
                                                className="input-field text-center text-2xl font-bold !py-4"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    {/* Auto Winner Display */}
                                    {autoWinner && (
                                        <p className="text-center text-neon-green text-sm mb-3 flex items-center justify-center gap-1">
                                            <Crown size={14} /> Winner: {autoWinner}
                                        </p>
                                    )}
                                    {s1 === s2 && (s1 > 0 || s2 > 0) && (
                                        <p className="text-center text-neon-yellow text-sm mb-3">Scores are tied — enter different scores to determine winner</p>
                                    )}

                                    <button
                                        onClick={() => saveScore(idx)}
                                        disabled={saving === idx || !autoWinner}
                                        className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {saving === idx ? (
                                            <><Loader2 size={16} className="animate-spin" /> Saving...</>
                                        ) : saved === idx ? (
                                            <><CheckCircle size={16} /> Saved!</>
                                        ) : (
                                            <><Save size={16} /> Save Score</>
                                        )}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* No pending */}
                {pendingMatches.length === 0 && selectedGame && (
                    <div className="text-center py-16 mb-8">
                        <Trophy size={48} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-500">No pending matches to score.</p>
                        <Link to="/admin/tournament" className="text-neon-green text-sm hover:underline mt-2 block">
                            Go to Tournament Management →
                        </Link>
                    </div>
                )}

                {/* Completed Matches */}
                {completedMatches.length > 0 && (
                    <div>
                        <h3 className="font-display text-lg font-bold text-gray-400 mb-3">Completed ({completedMatches.length})</h3>
                        <div className="space-y-2">
                            {completedMatches.map((match, i) => (
                                <div key={i} className="glass rounded-xl p-4 opacity-70">
                                    <p className="text-[10px] text-gray-600 mb-1">Round {match.round} • Match {match.match_number || i + 1}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-sm ${match.winner === match.team_1 ? 'text-neon-green font-bold' : 'text-gray-500'}`}>
                                                {match.team_1} ({match.team_1_score})
                                            </span>
                                            <span className="text-gray-600 text-xs">vs</span>
                                            <span className={`text-sm ${match.winner === match.team_2 ? 'text-neon-green font-bold' : 'text-gray-500'}`}>
                                                {match.team_2} ({match.team_2_score})
                                            </span>
                                        </div>
                                        <span className="text-neon-green text-xs flex items-center gap-1"><Crown size={12} /> {match.winner}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
