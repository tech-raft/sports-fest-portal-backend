import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Activity, Swords, CheckCircle, Clock, Trophy } from 'lucide-react'
import { api } from '../../api'

export default function ManagementLiveMonitor() {
    const navigate = useNavigate()
    const [games, setGames] = useState([])
    const [allMatches, setAllMatches] = useState([])

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (!['admin', 'management'].includes(user.role)) { navigate('/login'); return }

        const load = async () => {
            try {
                const gamesData = await api.getGames()
                if (Array.isArray(gamesData)) {
                    setGames(gamesData)
                    let all = []
                    for (const g of gamesData) {
                        const m = await api.getMatches(g.id)
                        if (Array.isArray(m)) all = all.concat(m.map(match => ({ ...match, gameName: g.game_name })))
                    }
                    setAllMatches(all)
                }
            } catch { }
        }
        load()
        const iv = setInterval(load, 10000)
        return () => clearInterval(iv)
    }, [navigate])

    const upcoming = allMatches.filter(m => !m.winner && m.team_2 !== 'BYE')
    const completed = allMatches.filter(m => m.winner).sort((a, b) => (b.round || 1) - (a.round || 1))
    const currentMatch = upcoming[0]
    const nextMatches = upcoming.slice(1, 4)

    return (
        <div className="min-h-screen pt-20 pb-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <Link to="/management" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <h1 className="font-display text-3xl font-bold text-white">Live Match Monitor</h1>
                </div>

                {/* Current Match */}
                <div className="mb-8">
                    <h2 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Current Match</h2>
                    {currentMatch ? (
                        <div className="glass rounded-2xl p-6 border-neon-green/20 bg-gradient-to-r from-neon-green/5 to-transparent">
                            <p className="text-xs text-neon-green font-bold uppercase tracking-wider mb-3">{currentMatch.gameName} • Round {currentMatch.round}</p>
                            <div className="flex items-center justify-center gap-6">
                                <div className="text-center flex-1">
                                    <p className="text-white font-display text-2xl font-bold">{currentMatch.team_1}</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-12 h-12 rounded-full bg-neon-green/10 border-2 border-neon-green flex items-center justify-center">
                                        <span className="text-neon-green font-display font-bold text-sm">VS</span>
                                    </div>
                                </div>
                                <div className="text-center flex-1">
                                    <p className="text-white font-display text-2xl font-bold">{currentMatch.team_2}</p>
                                </div>
                            </div>
                            <div className="text-center mt-4">
                                <Link to="/management/scoring" className="text-neon-blue text-sm hover:underline">
                                    Enter Score →
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="glass rounded-xl p-8 text-center">
                            <Trophy size={32} className="mx-auto text-gray-600 mb-2" />
                            <p className="text-gray-500">No ongoing matches</p>
                        </div>
                    )}
                </div>

                {/* Next Matches */}
                <div className="mb-8">
                    <h2 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                        Next Matches <span className="text-gray-600">({upcoming.length > 1 ? upcoming.length - 1 : 0})</span>
                    </h2>
                    {nextMatches.length > 0 ? (
                        <div className="space-y-2">
                            {nextMatches.map((m, i) => (
                                <div key={i} className="glass rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Clock size={16} className="text-neon-yellow" />
                                        <span className="text-xs text-gray-500">{m.gameName} R{m.round}</span>
                                        <span className="text-white text-sm font-medium">{m.team_1}</span>
                                        <span className="text-gray-600 text-xs">vs</span>
                                        <span className="text-white text-sm font-medium">{m.team_2}</span>
                                    </div>
                                    <span className="text-neon-yellow text-xs">Upcoming</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-600 text-sm">No upcoming matches</p>
                    )}
                </div>

                {/* Completed Matches */}
                <div>
                    <h2 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                        Completed <span className="text-gray-600">({completed.length})</span>
                    </h2>
                    {completed.length > 0 ? (
                        <div className="space-y-2">
                            {completed.slice(0, 10).map((m, i) => (
                                <div key={i} className="glass rounded-xl p-4 flex items-center justify-between opacity-70">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle size={16} className="text-neon-green" />
                                        <span className="text-xs text-gray-600">{m.gameName} R{m.round}</span>
                                        <span className={`text-sm ${m.winner === m.team_1 ? 'text-neon-green font-bold' : 'text-gray-400'}`}>
                                            {m.team_1} {m.team_1_score !== null ? `(${m.team_1_score})` : ''}
                                        </span>
                                        <span className="text-gray-600 text-xs">vs</span>
                                        <span className={`text-sm ${m.winner === m.team_2 ? 'text-neon-green font-bold' : 'text-gray-400'}`}>
                                            {m.team_2} {m.team_2 !== 'BYE' && m.team_2_score !== null ? `(${m.team_2_score})` : ''}
                                        </span>
                                    </div>
                                    <span className="text-neon-green text-xs">{m.winner}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-600 text-sm">No completed matches yet</p>
                    )}
                </div>
            </div>
        </div>
    )
}
