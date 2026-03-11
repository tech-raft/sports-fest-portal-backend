import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BarChart3, Users, DollarSign, Trophy, Gamepad2, Settings, LogOut, UserCheck, Swords, Download } from 'lucide-react'
import { api } from '../../api'

export default function AdminDashboard() {
    const navigate = useNavigate()
    const [stats, setStats] = useState({ totalTeams: 0, totalPlayers: 0, totalRevenue: 0, teamsPerSport: {} })
    const [teams, setTeams] = useState([])
    const [players, setPlayers] = useState([])
    const [matches, setMatches] = useState([])
    const [tab, setTab] = useState('teams')

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (user.role !== 'admin') { navigate('/login'); return }

        api.getDashboardStats().then(data => { if (data) setStats(data) }).catch(() => { })
        api.getTeams().then(data => { if (Array.isArray(data)) setTeams(data) }).catch(() => { })
        api.getPlayers().then(data => { if (Array.isArray(data)) setPlayers(data) }).catch(() => { })
        api.getMatches().then(data => { if (Array.isArray(data)) setMatches(data) }).catch(() => { })
    }, [navigate])

    const logout = () => {
        localStorage.removeItem('user')
        navigate('/login')
    }

    const exportCSV = (data, filename) => {
        if (!data.length) return
        const headers = Object.keys(data[0]).join(',')
        const rows = data.map(r => Object.values(r).join(',')).join('\n')
        const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
    }

    return (
        <div className="min-h-screen pt-20 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-white">Admin Dashboard</h1>
                        <p className="text-gray-500">Manage your tournament</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/admin/games" className="btn-secondary text-sm flex items-center gap-1.5 !px-4 !py-2">
                            <Gamepad2 size={16} /> Games
                        </Link>
                        <Link to="/admin/tournament" className="btn-secondary text-sm flex items-center gap-1.5 !px-4 !py-2">
                            <Swords size={16} /> Tournament
                        </Link>
                        <button onClick={logout} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    {[
                        { icon: <Users size={20} />, label: 'Total Teams', value: stats.totalTeams, color: 'text-neon-blue' },
                        { icon: <UserCheck size={20} />, label: 'Total Players', value: stats.totalPlayers, color: 'text-neon-green' },
                        { icon: <DollarSign size={20} />, label: 'Revenue', value: `₹${(stats.totalRevenue || 0).toLocaleString()}`, color: 'text-neon-yellow' },
                        { icon: <Trophy size={20} />, label: 'Sports', value: Object.keys(stats.teamsPerSport || {}).length || 6, color: 'text-neon-pink' },
                    ].map((stat, i) => (
                        <div key={i} className="glass rounded-xl p-5 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className={`${stat.color} mb-2`}>{stat.icon}</div>
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                            <p className="text-gray-500 text-xs">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Teams per Sport Bar */}
                {Object.keys(stats.teamsPerSport || {}).length > 0 && (
                    <div className="glass rounded-2xl p-6 mb-8">
                        <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
                            <BarChart3 size={18} className="text-neon-green" />
                            Teams Per Sport
                        </h3>
                        <div className="space-y-3">
                            {Object.entries(stats.teamsPerSport).map(([sport, count]) => (
                                <div key={sport} className="flex items-center gap-3">
                                    <span className="text-gray-400 text-sm w-24 truncate">{sport}</span>
                                    <div className="flex-1 h-6 bg-dark-600 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-neon-green to-neon-blue rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min((count / 12) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-white font-bold text-sm w-8 text-right">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-dark-800 rounded-xl p-1 inline-flex">
                    {['teams', 'players', 'matches'].map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-5 py-2.5 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-neon-green/10 text-neon-green' : 'text-gray-500 hover:text-white'
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* Table Content */}
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
                        <span className="text-sm text-gray-400 capitalize">{tab} ({tab === 'teams' ? teams.length : tab === 'players' ? players.length : matches.length})</span>
                        <button
                            onClick={() => exportCSV(tab === 'teams' ? teams : tab === 'players' ? players : matches, `${tab}.csv`)}
                            className="text-xs text-neon-green hover:underline flex items-center gap-1"
                        >
                            <Download size={12} /> Export CSV
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        {tab === 'teams' && (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="text-left px-6 py-3 text-gray-500 font-medium">Team Name</th>
                                        <th className="text-left px-6 py-3 text-gray-500 font-medium">Game</th>
                                        <th className="text-left px-6 py-3 text-gray-500 font-medium">College</th>
                                        <th className="text-left px-6 py-3 text-gray-500 font-medium">Team Code</th>
                                        <th className="text-left px-6 py-3 text-gray-500 font-medium">Payment</th>
                                        <th className="text-left px-6 py-3 text-gray-500 font-medium">Check-in</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teams.map((team, i) => (
                                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                                            <td className="px-6 py-3 text-white font-medium">{team.team_name}</td>
                                            <td className="px-6 py-3 text-gray-400">{team.game}</td>
                                            <td className="px-6 py-3 text-gray-400">{team.college}</td>
                                            <td className="px-6 py-3 text-neon-green font-mono text-xs">{team.team_code}</td>
                                            <td className="px-6 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${team.payment_status === 'paid' ? 'bg-neon-green/10 text-neon-green' : 'bg-yellow-500/10 text-yellow-400'
                                                    }`}>{team.payment_status}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${team.checkin_status === 'checked-in' ? 'bg-neon-blue/10 text-neon-blue' : 'bg-gray-500/10 text-gray-500'
                                                    }`}>{team.checkin_status || 'pending'}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {tab === 'players' && (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="text-left px-6 py-3 text-gray-500 font-medium">Player Name</th>
                                        <th className="text-left px-6 py-3 text-gray-500 font-medium">USN</th>
                                        <th className="text-left px-6 py-3 text-gray-500 font-medium">Team</th>
                                        <th className="text-left px-6 py-3 text-gray-500 font-medium">Game</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {players.map((player, i) => (
                                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                                            <td className="px-6 py-3 text-white">{player.name}</td>
                                            <td className="px-6 py-3 text-gray-400 font-mono text-xs">{player.usn}</td>
                                            <td className="px-6 py-3 text-gray-400">{player.team_name || player.team_id}</td>
                                            <td className="px-6 py-3 text-gray-400">{player.game}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {tab === 'matches' && (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="text-left px-6 py-3 text-gray-500 font-medium">Match</th>
                                        <th className="text-left px-6 py-3 text-gray-500 font-medium">Teams</th>
                                        <th className="text-left px-6 py-3 text-gray-500 font-medium">Scores</th>
                                        <th className="text-left px-6 py-3 text-gray-500 font-medium">Winner</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {matches.map((m, i) => (
                                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                                            <td className="px-6 py-3 text-gray-400">R{m.round} - M{m.match_id}</td>
                                            <td className="px-6 py-3 text-white">{m.team_1} vs {m.team_2}</td>
                                            <td className="px-6 py-3 text-gray-400">{m.team_1_score ?? '-'} : {m.team_2_score ?? '-'}</td>
                                            <td className="px-6 py-3 text-neon-green font-medium">{m.winner || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
