import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Users, Trophy, Hash, MapPin, CheckCircle, XCircle } from 'lucide-react'
import { api } from '../api'

export default function TeamPage() {
    const { teamCode } = useParams()
    const [team, setTeam] = useState(null)
    const [players, setPlayers] = useState([])
    const [matches, setMatches] = useState([])

    useEffect(() => {
        api.getTeam(teamCode)
            .then(data => {
                if (data && !data.error) {
                    setTeam(data)
                    if (data.team_id) {
                        api.getPlayers(data.team_id).then(p => { if (Array.isArray(p)) setPlayers(p) }).catch(() => { })
                    }
                    if (data.game_id) {
                        api.getMatches(data.game_id).then(m => {
                            if (Array.isArray(m)) {
                                setMatches(m.filter(match =>
                                    match.team_1 === data.team_name || match.team_2 === data.team_name
                                ))
                            }
                        }).catch(() => { })
                    }
                }
            })
            .catch(() => { })
    }, [teamCode])

    if (!team) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading team details...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-20 pb-16">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                {/* Team Header */}
                <div className="glass rounded-2xl p-6 sm:p-8 mb-6 neon-border animate-slide-up">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h1 className="font-display text-3xl font-bold text-white mb-1">{team.team_name}</h1>
                            <p className="text-gray-400 flex items-center gap-2">
                                <Trophy size={14} className="text-neon-yellow" />
                                {team.game}
                            </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${team.checkin_status === 'checked-in'
                                ? 'bg-neon-green/20 text-neon-green'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                            {team.checkin_status === 'checked-in' ? 'Checked In' : 'Pending'}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="bg-dark-700/50 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-1">College</p>
                            <p className="text-white text-sm font-medium flex items-center gap-1.5">
                                <MapPin size={12} className="text-neon-blue" />
                                {team.college}
                            </p>
                        </div>
                        <div className="bg-dark-700/50 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-1">Team Code</p>
                            <p className="text-neon-green text-sm font-mono font-bold flex items-center gap-1.5">
                                <Hash size={12} />
                                {team.team_code}
                            </p>
                        </div>
                        <div className="bg-dark-700/50 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-1">Payment</p>
                            <p className={`text-sm font-medium flex items-center gap-1.5 ${team.payment_status === 'paid' ? 'text-neon-green' : 'text-yellow-400'
                                }`}>
                                {team.payment_status === 'paid' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                {team.payment_status === 'paid' ? 'Paid' : 'Pending'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Players */}
                <div className="glass rounded-2xl p-6 mb-6 animate-fade-in">
                    <h2 className="font-display text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Users size={20} className="text-neon-blue" />
                        Players
                    </h2>
                    {players.length > 0 ? (
                        <div className="space-y-2">
                            {players.map((player, i) => (
                                <div key={i} className="flex items-center justify-between py-3 px-4 bg-dark-700/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <span className="w-7 h-7 rounded-full bg-neon-green/10 text-neon-green text-xs flex items-center justify-center font-bold">
                                            {i + 1}
                                        </span>
                                        <span className="text-white text-sm font-medium">{player.name}</span>
                                    </div>
                                    <span className="text-gray-500 text-xs font-mono">{player.usn}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">Player details will appear here once loaded.</p>
                    )}
                </div>

                {/* Matches */}
                <div className="glass rounded-2xl p-6 animate-fade-in">
                    <h2 className="font-display text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Trophy size={20} className="text-neon-yellow" />
                        Match Results
                    </h2>
                    {matches.length > 0 ? (
                        <div className="space-y-3">
                            {matches.map((match, i) => (
                                <div key={i} className="bg-dark-700/50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500 mb-2">Round {match.round} • Match #{match.match_id}</p>
                                    <div className="flex items-center justify-between">
                                        <div className={`text-sm font-medium ${match.winner === match.team_1 ? 'text-neon-green' : 'text-white'}`}>
                                            {match.team_1}
                                            <span className="text-lg ml-2 font-bold">{match.team_1_score ?? '-'}</span>
                                        </div>
                                        <span className="text-gray-600 text-xs">VS</span>
                                        <div className={`text-sm font-medium text-right ${match.winner === match.team_2 ? 'text-neon-green' : 'text-white'}`}>
                                            <span className="text-lg mr-2 font-bold">{match.team_2_score ?? '-'}</span>
                                            {match.team_2}
                                        </div>
                                    </div>
                                    {match.winner && (
                                        <p className="text-neon-green text-xs mt-2 text-center">Winner: {match.winner}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">Matches will appear after the tournament draw.</p>
                    )}
                </div>

                <div className="mt-6 text-center">
                    <Link to={`/bracket/${team.game_id}`} className="text-neon-green text-sm hover:underline">
                        View Full Tournament Bracket →
                    </Link>
                </div>
            </div>
        </div>
    )
}
