import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Trophy, Crown } from 'lucide-react'
import { api } from '../../api'

export default function MatchHistory() {
    const navigate = useNavigate()
    const [games, setGames] = useState([])
    const [selectedGame, setSelectedGame] = useState('')
    const [matches, setMatches] = useState([])

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (!['admin', 'management'].includes(user.role)) { navigate('/login'); return }
        api.getGames().then(data => { if (Array.isArray(data)) setGames(data) }).catch(() => { })
    }, [navigate])

    useEffect(() => {
        if (selectedGame) {
            api.getMatches(selectedGame).then(data => {
                if (Array.isArray(data)) setMatches(data.filter(m => m.winner))
            }).catch(() => { })
        }
    }, [selectedGame])

    const getRoundLabel = (rnd) => {
        if (!matches.length) return `Round ${rnd}`
        const maxR = Math.max(...matches.map(m => m.round || 1))
        if (rnd === maxR) return 'Final'
        if (rnd === maxR - 1) return 'Semi-Final'
        return `Round ${rnd}`
    }

    return (
        <div className="min-h-screen pt-20 pb-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <Link to="/management" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>

                <h1 className="font-display text-3xl font-bold text-white mb-2">Match History</h1>
                <p className="text-gray-500 mb-6">Completed matches with results</p>

                <select
                    value={selectedGame}
                    onChange={e => setSelectedGame(e.target.value)}
                    className="input-field text-sm mb-6"
                >
                    <option value="">Select a game...</option>
                    {games.map(g => <option key={g.id} value={g.id}>{g.game_name}</option>)}
                </select>

                {!selectedGame ? (
                    <div className="text-center py-16">
                        <Trophy size={48} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-500">Select a game to view match history.</p>
                    </div>
                ) : matches.length === 0 ? (
                    <div className="text-center py-16">
                        <Trophy size={48} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-500">No completed matches yet.</p>
                    </div>
                ) : (
                    <>
                        {/* Table Header */}
                        <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 text-xs text-gray-500 uppercase tracking-wider mb-2">
                            <div className="col-span-1">Match</div>
                            <div className="col-span-4">Teams</div>
                            <div className="col-span-2">Score</div>
                            <div className="col-span-3">Winner</div>
                            <div className="col-span-2">Round</div>
                        </div>

                        <div className="space-y-2">
                            {matches.sort((a, b) => (a.round || 1) - (b.round || 1) || (a.match_number || 0) - (b.match_number || 0)).map((match, i) => (
                                <div key={i} className="glass rounded-xl px-4 py-3 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                                    <div className="sm:col-span-1">
                                        <span className="text-xs text-gray-600">{match.match_number || i + 1}</span>
                                    </div>
                                    <div className="sm:col-span-4">
                                        <span className={`text-sm ${match.winner === match.team_1 ? 'text-neon-green font-bold' : 'text-gray-400'}`}>{match.team_1}</span>
                                        <span className="text-gray-600 text-xs mx-2">vs</span>
                                        <span className={`text-sm ${match.team_2 === 'BYE' ? 'text-gray-600 italic' : match.winner === match.team_2 ? 'text-neon-green font-bold' : 'text-gray-400'}`}>{match.team_2}</span>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <span className="text-white text-sm">{match.team_1_score ?? '-'} - {match.team_2 === 'BYE' ? '-' : (match.team_2_score ?? '-')}</span>
                                    </div>
                                    <div className="sm:col-span-3 flex items-center gap-1">
                                        <Crown size={14} className="text-neon-green" />
                                        <span className="text-neon-green text-sm font-bold">{match.winner}</span>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <span className="text-gray-400 text-sm">{getRoundLabel(match.round)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
