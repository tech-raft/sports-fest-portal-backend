import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Users, Search, Eye, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '../../api'

export default function ManagementTeams() {
    const navigate = useNavigate()
    const [games, setGames] = useState([])
    const [selectedGame, setSelectedGame] = useState('')
    const [teams, setTeams] = useState([])
    const [players, setPlayers] = useState({})
    const [search, setSearch] = useState('')
    const [expandedTeam, setExpandedTeam] = useState(null)

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (!['admin', 'management'].includes(user.role)) { navigate('/login'); return }
        api.getGames().then(data => { if (Array.isArray(data)) setGames(data) }).catch(() => { })
    }, [navigate])

    useEffect(() => {
        if (selectedGame) {
            api.getTeams(selectedGame).then(data => {
                if (Array.isArray(data)) setTeams(data)
            }).catch(() => { })
        } else {
            // Load all teams
            api.getTeams().then(data => {
                if (Array.isArray(data)) setTeams(data)
            }).catch(() => { })
        }
    }, [selectedGame])

    const loadPlayers = async (teamId) => {
        if (players[teamId]) return
        try {
            const data = await api.getPlayers(teamId)
            if (Array.isArray(data)) setPlayers(prev => ({ ...prev, [teamId]: data }))
        } catch { }
    }

    const toggleTeam = (teamId) => {
        if (expandedTeam === teamId) {
            setExpandedTeam(null)
        } else {
            setExpandedTeam(teamId)
            loadPlayers(teamId)
        }
    }

    const filtered = teams.filter(t => {
        const q = search.toLowerCase()
        if (!q) return true
        return (
            t.team_name?.toLowerCase().includes(q) ||
            t.team_code?.toLowerCase().includes(q) ||
            t.college?.toLowerCase().includes(q) ||
            t.game?.toLowerCase().includes(q)
        )
    })

    const checkedInCount = teams.filter(t => t.checked_in).length

    return (
        <div className="min-h-screen pt-20 pb-16">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <Link to="/management" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>

                <h1 className="font-display text-3xl font-bold text-white mb-2">Team Management</h1>
                <p className="text-gray-500 mb-6">View teams, players, search, and check-in status</p>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search team name, code, college, USN..."
                            className="input-field pl-10 text-sm"
                        />
                    </div>
                    <select
                        value={selectedGame}
                        onChange={e => setSelectedGame(e.target.value)}
                        className="input-field text-sm w-full sm:w-48"
                    >
                        <option value="">All Games</option>
                        {games.map(g => <option key={g.id} value={g.id}>{g.game_name}</option>)}
                    </select>
                </div>

                {/* Stats bar */}
                <div className="flex gap-4 mb-6 text-sm">
                    <span className="text-gray-400">Total: <span className="text-white font-bold">{filtered.length}</span></span>
                    <span className="text-gray-400">Checked In: <span className="text-neon-green font-bold">{checkedInCount}</span></span>
                    <span className="text-gray-400">Paid: <span className="text-neon-blue font-bold">{teams.filter(t => t.payment_status === 'paid').length}</span></span>
                </div>

                {/* Team Table */}
                {filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <Users size={48} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-500">No teams found.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {/* Header */}
                        <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 text-xs text-gray-500 uppercase tracking-wider">
                            <div className="col-span-3">Team Name</div>
                            <div className="col-span-2">Game</div>
                            <div className="col-span-2">Players</div>
                            <div className="col-span-2">Team Code</div>
                            <div className="col-span-2">Check-in</div>
                            <div className="col-span-1"></div>
                        </div>

                        {filtered.map(team => (
                            <div key={team.team_id} className="glass rounded-xl overflow-hidden">
                                <div
                                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 px-4 py-3 items-center cursor-pointer hover:bg-white/[0.02] transition-colors"
                                    onClick={() => toggleTeam(team.team_id)}
                                >
                                    <div className="sm:col-span-3">
                                        <p className="text-white font-medium text-sm">{team.team_name}</p>
                                        <p className="text-gray-600 text-xs sm:hidden">{team.game} • {team.team_code}</p>
                                    </div>
                                    <div className="sm:col-span-2 hidden sm:block">
                                        <span className="text-gray-300 text-sm">{team.game}</span>
                                    </div>
                                    <div className="sm:col-span-2 hidden sm:block">
                                        <span className="text-gray-400 text-sm">{team.player_count || '-'} players</span>
                                    </div>
                                    <div className="sm:col-span-2 hidden sm:block">
                                        <span className="text-neon-green text-xs font-mono">{team.team_code}</span>
                                    </div>
                                    <div className="sm:col-span-2 hidden sm:block">
                                        {team.checked_in ? (
                                            <span className="inline-flex items-center gap-1 text-neon-green text-xs"><CheckCircle size={12} /> Checked In</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-gray-500 text-xs"><XCircle size={12} /> Not Yet</span>
                                        )}
                                    </div>
                                    <div className="sm:col-span-1 flex justify-end">
                                        {expandedTeam === team.team_id ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                                    </div>
                                </div>

                                {/* Expanded Player Details */}
                                {expandedTeam === team.team_id && (
                                    <div className="px-4 pb-4 border-t border-white/5 pt-3 animate-fade-in">
                                        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                                            <div><span className="text-gray-500">College:</span> <span className="text-white">{team.college || '-'}</span></div>
                                            <div><span className="text-gray-500">Payment:</span> <span className={team.payment_status === 'paid' ? 'text-neon-green' : 'text-red-400'}>{team.payment_status}</span></div>
                                            <div><span className="text-gray-500">Check-in:</span> {team.checked_in ? <span className="text-neon-green">✓ Yes</span> : <span className="text-gray-500">No</span>}</div>
                                            <div><span className="text-gray-500">Code:</span> <span className="text-neon-green font-mono text-xs">{team.team_code}</span></div>
                                        </div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Players</p>
                                        {players[team.team_id] ? (
                                            <div className="space-y-1">
                                                {players[team.team_id].map((p, i) => (
                                                    <div key={i} className="flex items-center justify-between bg-dark-700/50 rounded-lg px-3 py-2">
                                                        <span className="text-white text-sm">{p.name}</span>
                                                        <span className="text-gray-500 text-xs font-mono">{p.usn}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-600 text-sm">Loading players...</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
