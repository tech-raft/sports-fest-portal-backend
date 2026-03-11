import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Users, Swords, ScanLine, Activity, Trophy, ChevronRight, BarChart3, CheckCircle } from 'lucide-react'
import { api } from '../../api'

export default function ManagementDashboard() {
    const navigate = useNavigate()
    const [stats, setStats] = useState(null)
    const [allMatches, setAllMatches] = useState([])
    const [games, setGames] = useState([])

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (!['admin', 'management'].includes(user.role)) { navigate('/login'); return }

        const load = async () => {
            try {
                const [statsData, gamesData] = await Promise.all([
                    api.getDashboardStats(),
                    api.getGames()
                ])
                setStats(statsData)
                if (Array.isArray(gamesData)) {
                    setGames(gamesData)
                    let all = []
                    for (const g of gamesData) {
                        const m = await api.getMatches(g.id)
                        if (Array.isArray(m)) all = all.concat(m)
                    }
                    setAllMatches(all)
                }
            } catch { }
        }
        load()
        const iv = setInterval(load, 20000)
        return () => clearInterval(iv)
    }, [navigate])

    const totalMatches = allMatches.length
    const completedMatches = allMatches.filter(m => m.winner).length
    const upcomingMatches = allMatches.filter(m => !m.winner && m.team_2 !== 'BYE').length
    const maxRound = allMatches.length > 0 ? Math.max(...allMatches.map(m => m.round || 1)) : 0
    const nextMatch = allMatches.find(m => !m.winner && m.team_2 !== 'BYE')

    const cards = [
        { icon: Users, label: 'Total Teams', value: stats?.totalTeams ?? '-', color: 'text-neon-green', bg: 'from-neon-green/10 to-neon-green/5' },
        { icon: CheckCircle, label: 'Checked In', value: stats?.checkedIn ?? '-', color: 'text-neon-blue', bg: 'from-neon-blue/10 to-neon-blue/5' },
        { icon: Swords, label: 'Matches Played', value: completedMatches, color: 'text-neon-yellow', bg: 'from-neon-yellow/10 to-neon-yellow/5' },
        { icon: Activity, label: 'Upcoming', value: upcomingMatches, color: 'text-red-400', bg: 'from-red-500/10 to-red-500/5' },
    ]

    const navLinks = [
        { to: '/management/teams', icon: Users, label: 'Team Management', desc: 'View teams, players, search, check-in status' },
        { to: '/management/matches', icon: Swords, label: 'Match Management', desc: 'View all matches, rounds, status' },
        { to: '/management/scoring', icon: Trophy, label: 'Score Management', desc: 'Enter scores, auto-determine winners' },
        { to: '/management/scanner', icon: ScanLine, label: 'QR Check-in', desc: 'Scan team QR codes for check-in' },
        { to: '/management/live', icon: Activity, label: 'Live Match Monitor', desc: 'Current match, next match, completed' },
        { to: '/management/history', icon: BarChart3, label: 'Match History', desc: 'Completed matches with results' },
    ]

    return (
        <div className="min-h-screen pt-20 pb-16">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <h1 className="font-display text-3xl font-bold text-white mb-2">Management Dashboard</h1>
                <p className="text-gray-500 mb-8">Tournament control and monitoring</p>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                    {cards.map((c, i) => (
                        <div key={i} className={`glass rounded-xl p-4 bg-gradient-to-br ${c.bg} animate-fade-in`} style={{ animationDelay: `${i * 80}ms` }}>
                            <c.icon size={20} className={`${c.color} mb-2`} />
                            <p className="text-2xl font-bold text-white">{c.value}</p>
                            <p className="text-xs text-gray-500">{c.label}</p>
                        </div>
                    ))}
                </div>

                {/* Current Round + Next Match */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="glass rounded-xl p-5">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Round</p>
                        <p className="text-white font-display text-2xl font-bold">{maxRound || '-'}</p>
                    </div>
                    <div className="glass rounded-xl p-5">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Next Match</p>
                        {nextMatch ? (
                            <p className="text-white font-display text-lg font-bold">
                                {nextMatch.team_1} <span className="text-gray-600 text-sm mx-1">vs</span> {nextMatch.team_2}
                            </p>
                        ) : (
                            <p className="text-gray-600 text-lg">No pending</p>
                        )}
                    </div>
                </div>

                {/* Navigation Links */}
                <h2 className="font-display text-xl font-bold text-white mb-4">Quick Access</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {navLinks.map((link, i) => (
                        <Link
                            key={i}
                            to={link.to}
                            className="glass rounded-xl p-5 flex items-center gap-4 hover:border-neon-green/30 transition-all group animate-fade-in"
                            style={{ animationDelay: `${i * 60}ms` }}
                        >
                            <div className="w-10 h-10 rounded-xl bg-neon-green/10 flex items-center justify-center group-hover:bg-neon-green/20 transition-colors">
                                <link.icon size={20} className="text-neon-green" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-bold text-sm">{link.label}</p>
                                <p className="text-gray-500 text-xs truncate">{link.desc}</p>
                            </div>
                            <ChevronRight size={16} className="text-gray-600 group-hover:text-neon-green transition-colors" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
