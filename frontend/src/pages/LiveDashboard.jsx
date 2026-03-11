import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Crown, Medal, Activity, ChevronRight, Swords, Users } from 'lucide-react'
import { api } from '../api'

export default function LiveDashboard() {
    const [games, setGames] = useState([])
    const [allMatches, setAllMatches] = useState({})
    const [stats, setStats] = useState({ totalTeams: 0, totalMatches: 0, completedMatches: 0, upcomingMatches: 0 })

    useEffect(() => {
        const fetchData = async () => {
            try {
                const gamesData = await api.getGames()
                if (Array.isArray(gamesData)) {
                    setGames(gamesData)
                    const matchesMap = {}
                    let totalM = 0, completedM = 0, upcomingM = 0
                    for (const game of gamesData) {
                        try {
                            const matches = await api.getMatches(game.id)
                            if (Array.isArray(matches)) {
                                matchesMap[game.id] = matches
                                totalM += matches.length
                                completedM += matches.filter(m => m.winner).length
                                upcomingM += matches.filter(m => !m.winner && m.team_2 !== 'BYE').length
                            }
                        } catch { }
                    }
                    setAllMatches(matchesMap)
                    setStats({
                        totalTeams: gamesData.reduce((sum, g) => sum + (g.registered_teams || 0), 0),
                        totalMatches: totalM,
                        completedMatches: completedM,
                        upcomingMatches: upcomingM,
                    })
                }
            } catch { }
        }
        fetchData()
        const interval = setInterval(fetchData, 15000)
        return () => clearInterval(interval)
    }, [])

    const getGameStatus = (matches) => {
        if (!matches || matches.length === 0) return { winner: null, runnerUp: null, status: 'upcoming' }
        const maxRound = Math.max(...matches.map(m => m.round || 1))
        const finalMatches = matches.filter(m => m.round === maxRound)
        if (finalMatches.length === 1 && finalMatches[0].winner) {
            const f = finalMatches[0]
            return { winner: f.winner, runnerUp: f.team_1 === f.winner ? f.team_2 : f.team_1, status: 'completed' }
        }
        const hasAnyMatch = matches.length > 0
        return { winner: null, runnerUp: null, status: hasAnyMatch ? 'in-progress' : 'upcoming' }
    }

    const getRoundName = (rnd, total) => {
        if (total >= 2 && rnd === total) return 'Final'
        if (total >= 3 && rnd === total - 1) return 'Semi-Final'
        if (total >= 4 && rnd === total - 2) return 'Quarter-Final'
        return `Round ${rnd}`
    }

    return (
        <div className="min-h-screen pt-20 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium mb-4">
                        <Activity size={14} className="animate-pulse" />
                        <span>Live Tournament</span>
                    </div>
                    <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2">Tournament Results</h1>
                    <p className="text-gray-400">Live brackets, winners & runner-ups</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                    <div className="glass rounded-xl p-4 text-center">
                        <Users size={20} className="mx-auto text-neon-green mb-1" />
                        <p className="text-2xl font-bold text-white">{stats.totalTeams}</p>
                        <p className="text-xs text-gray-500">Total Teams</p>
                    </div>
                    <div className="glass rounded-xl p-4 text-center">
                        <Swords size={20} className="mx-auto text-neon-blue mb-1" />
                        <p className="text-2xl font-bold text-white">{stats.totalMatches}</p>
                        <p className="text-xs text-gray-500">Total Matches</p>
                    </div>
                    <div className="glass rounded-xl p-4 text-center">
                        <Trophy size={20} className="mx-auto text-neon-yellow mb-1" />
                        <p className="text-2xl font-bold text-white">{stats.completedMatches}</p>
                        <p className="text-xs text-gray-500">Completed</p>
                    </div>
                    <div className="glass rounded-xl p-4 text-center">
                        <Activity size={20} className="mx-auto text-red-400 mb-1" />
                        <p className="text-2xl font-bold text-white">{stats.upcomingMatches}</p>
                        <p className="text-xs text-gray-500">Upcoming</p>
                    </div>
                </div>

                {/* Games */}
                <div className="space-y-6">
                    {games.map((game) => {
                        const matches = allMatches[game.id] || []
                        const { winner, runnerUp, status } = getGameStatus(matches)

                        const rounds = matches.reduce((acc, m) => {
                            const r = m.round || 1
                            if (!acc[r]) acc[r] = []
                            acc[r].push(m)
                            return acc
                        }, {})
                        const roundNumbers = Object.keys(rounds).map(Number).sort()

                        return (
                            <div key={game.id} className="glass rounded-2xl overflow-hidden animate-fade-in">
                                {/* Game Header */}
                                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-green to-neon-blue flex items-center justify-center">
                                            <Trophy size={20} className="text-dark-900" />
                                        </div>
                                        <div>
                                            <h2 className="font-display text-xl font-bold text-white">{game.game_name}</h2>
                                            <span className={`text-xs font-bold ${status === 'completed' ? 'text-neon-green' :
                                                    status === 'in-progress' ? 'text-neon-yellow' : 'text-gray-500'
                                                }`}>
                                                {status === 'completed' ? '🏆 Tournament Complete' :
                                                    status === 'in-progress' ? '⚡ In Progress' : 'Upcoming'}
                                            </span>
                                        </div>
                                    </div>
                                    <Link to={`/bracket/${game.id}`} className="text-neon-green text-sm hover:underline flex items-center gap-1">
                                        Full Bracket <ChevronRight size={14} />
                                    </Link>
                                </div>

                                {/* Champion Banner */}
                                {winner && (
                                    <div className="px-6 py-5 bg-gradient-to-r from-neon-yellow/5 via-neon-green/5 to-neon-blue/5 border-b border-white/5">
                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-neon-yellow/10 border-2 border-neon-yellow flex items-center justify-center">
                                                    <Crown size={24} className="text-neon-yellow" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-wider text-neon-yellow font-bold">Champion</p>
                                                    <p className="text-white font-display font-bold text-lg">{winner}</p>
                                                </div>
                                            </div>
                                            {runnerUp && runnerUp !== 'BYE' && (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-gray-500/10 border-2 border-gray-500 flex items-center justify-center">
                                                        <Medal size={24} className="text-gray-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Runner-up</p>
                                                        <p className="text-white font-display font-bold text-lg">{runnerUp}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Bracket */}
                                {roundNumbers.length > 0 ? (
                                    <div className="p-6 overflow-x-auto">
                                        <div className="flex gap-4 min-w-max">
                                            {roundNumbers.map((rnd) => (
                                                <div key={rnd} className="w-52 flex-shrink-0">
                                                    <h4 className="text-xs font-bold text-neon-green uppercase tracking-wider mb-3 text-center">
                                                        {getRoundName(rnd, roundNumbers.length)}
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {rounds[rnd].map((match, mi) => (
                                                            <div key={mi} className="bg-dark-700/50 rounded-lg overflow-hidden border border-white/5">
                                                                <div className={`flex items-center justify-between px-3 py-1.5 border-b border-dark-600 ${match.winner === match.team_1 ? 'bg-neon-green/5' : ''}`}>
                                                                    <span className={`text-xs font-medium truncate ${match.winner === match.team_1 ? 'text-neon-green' : match.team_1 ? 'text-white' : 'text-gray-600'}`}>
                                                                        {match.team_1 || 'TBD'}
                                                                    </span>
                                                                    <span className={`text-xs font-bold ml-1 ${match.winner === match.team_1 ? 'text-neon-green' : 'text-gray-600'}`}>
                                                                        {match.team_1_score ?? '-'}
                                                                    </span>
                                                                </div>
                                                                <div className={`flex items-center justify-between px-3 py-1.5 ${match.winner === match.team_2 ? 'bg-neon-green/5' : ''}`}>
                                                                    <span className={`text-xs font-medium truncate ${match.team_2 === 'BYE' ? 'text-gray-600 italic' : match.winner === match.team_2 ? 'text-neon-green' : match.team_2 ? 'text-white' : 'text-gray-600'}`}>
                                                                        {match.team_2 || 'TBD'}
                                                                    </span>
                                                                    <span className={`text-xs font-bold ml-1 ${match.winner === match.team_2 ? 'text-neon-green' : 'text-gray-600'}`}>
                                                                        {match.team_2 === 'BYE' ? '-' : (match.team_2_score ?? '-')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center">
                                        <p className="text-gray-600 text-sm">Matches not yet generated</p>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
