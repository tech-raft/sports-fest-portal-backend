import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Search, Trash2, Download, Edit2 } from 'lucide-react'
import { saveAs } from 'file-saver'
import { api } from '../../api'
import EditTeamModal from './EditTeamModal'

export default function ManageTeams() {
    const navigate = useNavigate()
    const [teams, setTeams] = useState([])
    const [search, setSearch] = useState('')
    const [filterGame, setFilterGame] = useState('')
    const [games, setGames] = useState([])
    const [editingTeam, setEditingTeam] = useState(null)

    const fetchTeams = () => {
        api.getTeams().then(data => { if (Array.isArray(data)) setTeams(data) }).catch(() => { })
    }

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (user.role !== 'admin') { navigate('/login'); return }
        fetchTeams()
        api.getGames().then(data => { if (Array.isArray(data)) setGames(data) }).catch(() => { })
    }, [navigate])

    const deleteTeam = async (teamId) => {
        if (!confirm('Are you sure you want to delete this team?')) return
        try {
            await api.deleteTeam(teamId)
            setTeams(prev => prev.filter(t => t.team_id !== teamId))
        } catch { }
    }

    const exportCSV = () => {
        if (filtered.length === 0) return

        const headers = ['Team Name', 'Game', 'College', 'Team Code', 'Payment Status', 'Check-in Status', 'Players']
        const rows = filtered.map(t => [
            t.team_name || '',
            t.game || '',
            t.college || '',
            t.team_code || '',
            t.payment_status || 'pending',
            t.checkin_status || 'pending',
            t.player_count || '-',
        ])

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const fileName = `teams_${filterGame || 'all'}_${new Date().toISOString().slice(0, 10)}.csv`
        saveAs(blob, fileName)
    }

    const filtered = teams.filter(t => {
        const matchSearch = !search || t.team_name?.toLowerCase().includes(search.toLowerCase()) || t.team_code?.toLowerCase().includes(search.toLowerCase())
        const matchGame = !filterGame || t.game === filterGame
        return matchSearch && matchGame
    })

    return (
        <div className="min-h-screen pt-20 pb-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <Link to="/admin" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-white">Manage Teams</h1>
                        <p className="text-gray-500 text-sm mt-1">{filtered.length} teams</p>
                    </div>
                    <button
                        onClick={exportCSV}
                        disabled={filtered.length === 0}
                        className="btn-secondary flex items-center gap-2 text-sm !py-2.5 disabled:opacity-50"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by team name or code..."
                            className="input-field pl-10 text-sm"
                        />
                    </div>
                    <select
                        value={filterGame}
                        onChange={e => setFilterGame(e.target.value)}
                        className="input-field text-sm w-full sm:w-48"
                    >
                        <option value="">All Games</option>
                        {games.map(g => (
                            <option key={g.id} value={g.game_name}>{g.game_name}</option>
                        ))}
                    </select>
                </div>

                {/* Teams Table */}
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Team Name</th>
                                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Game</th>
                                    <th className="text-left px-6 py-3 text-gray-500 font-medium">College</th>
                                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Code</th>
                                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Payment</th>
                                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Check-in</th>
                                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((team, i) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <td className="px-6 py-3 text-white font-medium">{team.team_name}</td>
                                        <td className="px-6 py-3 text-gray-400">{team.game}</td>
                                        <td className="px-6 py-3 text-gray-400">{team.college}</td>
                                        <td className="px-6 py-3 text-neon-green font-mono text-xs">{team.team_code}</td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${team.payment_status === 'paid' ? 'bg-neon-green/10 text-neon-green' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                                {team.payment_status || 'pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${team.checkin_status === 'checked-in' ? 'bg-neon-green/10 text-neon-green' : 'bg-gray-500/10 text-gray-500'}`}>
                                                {team.checkin_status === 'checked-in' ? 'Checked In' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => setEditingTeam(team)} className="p-1.5 rounded-lg text-gray-500 hover:text-neon-blue hover:bg-neon-blue/10 transition-colors">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => deleteTeam(team.team_id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-10 text-center text-gray-500">No teams found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {editingTeam && (
                <EditTeamModal
                    team={editingTeam}
                    onClose={() => setEditingTeam(null)}
                    onUpdate={() => {
                        fetchTeams();
                    }}
                />
            )}
        </div>
    )
}
