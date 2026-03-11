import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Swords, Search, CheckCircle, Clock, XCircle } from 'lucide-react'
import { api } from '../../api'

export default function ManagementMatches() {
    const navigate = useNavigate()
    const [games, setGames] = useState([])
    const [selectedGame, setSelectedGame] = useState('')
    const [matches, setMatches] = useState([])
    const [search, setSearch] = useState('')

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (!['admin', 'management'].includes(user.role)) { navigate('/login'); return }
        api.getGames().then(data => { if (Array.isArray(data)) setGames(data) }).catch(() => { })
    }, [navigate])

    useEffect(() => {
        if (selectedGame) {
            api.getMatches(selectedGame).then(data => { if (Array.isArray(data)) setMatches(data) }).catch(() => { })
        }
    }, [selectedGame])

    const filtered = matches.filter(m => {
        const q = search.toLowerCase()
        if (!q) return true
        return m.team_1?.toLowerCase().includes(q) || m.team_2?.toLowerCase().includes(q)
    })

    const rounds = filtered.reduce((acc, m) => {
        const r = m.round || 1
        if (!acc[r]) acc[r] = []
        acc[r].push(m)
        return acc
    }, {})
    const roundNumbers = Object.keys(rounds).map(Number).sort()

    const getRoundLabel = (rnd) => {
        const total = roundNumbers.length
        if (total >= 2 && rnd === roundNumbers[total - 1]) return '🏆 Final'
        if (total >= 3 && rnd === roundNumbers[total - 2]) return 'Semi-Final'
        if (total >= 4 && rnd === roundNumbers[total - 3]) return 'Quarter-Final'
        return `Round ${rnd}`
    }

    const StatusBadge = ({ match }) => {
        if (match.winner) return <span className="inline-flex items-center gap-1 text-xs text-neon-green"><CheckCircle size={12} /> Completed</span>
        if (match.team_2 === 'BYE') return <span className="text-xs text-gray-500">BYE</span>
        return <span className="inline-flex items-center gap-1 text-xs text-neon-yellow"><Clock size={12} /> Pending</span>
    }

    return (
        <div className="min-h-screen pt-20 pb-16">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <Link to="/management" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>

                <h1 className="font-display text-3xl font-bold text-white mb-2">Match Management</h1>
                <p className="text-gray-500 mb-6">View all matches, rounds, and status</p>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <select
                        value={selectedGame}
                        onChange={e => setSelectedGame(e.target.value)}
                        className="input-field text-sm w-full sm:w-48"
                    >
                        <option value="">Select a game...</option>
                        {games.map(g => <option key={g.id} value={g.id}>{g.game_name}</option>)}
                    </select>
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by team name..."
                            className="input-field pl-10 text-sm"
                        />
                    </div>
                </div>

                {!selectedGame ? (
                    <div className="text-center py-16">
                        <Swords size={48} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-500">Select a game to view matches.</p>
                    </div>
                ) : roundNumbers.length === 0 ? (
                    <div className="text-center py-16">
                        <Swords size={48} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-500">No matches generated yet.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Stats */}
                        <div className="flex gap-4 text-sm">
                            <span className="text-gray-400">Total: <span className="text-white font-bold">{matches.length}</span></span>
                            <span className="text-gray-400">Completed: <span className="text-neon-green font-bold">{matches.filter(m => m.winner).length}</span></span>
                            <span className="text-gray-400">Pending: <span className="text-neon-yellow font-bold">{matches.filter(m => !m.winner && m.team_2 !== 'BYE').length}</span></span>
                        </div>

                        {roundNumbers.map(rnd => (
                            <div key={rnd}>
                                <h3 className="font-display text-sm font-bold text-neon-green uppercase tracking-wider mb-3">
                                    {getRoundLabel(rnd)} <span className="text-gray-600">({rounds[rnd].length} matches)</span>
                                </h3>
                                <div className="space-y-2">
                                    {rounds[rnd].map((match, mi) => (
                                        <div key={mi} className="glass rounded-xl p-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <span className="text-xs text-gray-600 w-16">Match {match.match_number || mi + 1}</span>
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <span className={`text-sm font-medium ${match.winner === match.team_1 ? 'text-neon-green font-bold' : 'text-white'}`}>
                                                            {match.team_1}
                                                        </span>
                                                        {match.team_1_score !== null && match.team_1_score !== undefined && (
                                                            <span className="text-xs text-gray-500">({match.team_1_score})</span>
                                                        )}
                                                        <span className="text-gray-600 text-xs mx-1">vs</span>
                                                        <span className={`text-sm font-medium ${match.team_2 === 'BYE' ? 'text-gray-600 italic' : match.winner === match.team_2 ? 'text-neon-green font-bold' : 'text-white'}`}>
                                                            {match.team_2}
                                                        </span>
                                                        {match.team_2_score !== null && match.team_2_score !== undefined && match.team_2 !== 'BYE' && (
                                                            <span className="text-xs text-gray-500">({match.team_2_score})</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <StatusBadge match={match} />
                                                    {!match.winner && match.team_2 !== 'BYE' && (
                                                        <Link to="/management/scoring" className="text-neon-blue text-xs hover:underline">
                                                            Update Score →
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                            {match.winner && (
                                                <p className="text-neon-green text-xs mt-1 ml-[76px]">Winner: {match.winner}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
