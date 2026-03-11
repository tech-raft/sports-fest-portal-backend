import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Trophy, Crown, Medal } from 'lucide-react'
import { api } from '../api'

export default function TournamentBracket() {
    const { gameId } = useParams()
    const [game, setGame] = useState(null)
    const [matches, setMatches] = useState([])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [gameData, matchData] = await Promise.all([
                    api.getGame(gameId),
                    api.getMatches(gameId)
                ])
                if (gameData?.id) setGame(gameData)
                if (Array.isArray(matchData)) setMatches(matchData)
            } catch { }
        }
        fetchData()
        const interval = setInterval(fetchData, 10000)
        return () => clearInterval(interval)
    }, [gameId])

    // Group by round
    const rounds = matches.reduce((acc, m) => {
        const r = m.round || 1
        if (!acc[r]) acc[r] = []
        acc[r].push(m)
        return acc
    }, {})
    const roundNumbers = Object.keys(rounds).map(Number).sort()

    const getRoundLabel = (rnd) => {
        const total = roundNumbers.length
        if (total >= 2 && rnd === roundNumbers[total - 1]) return 'Final'
        if (total >= 3 && rnd === roundNumbers[total - 2]) return 'Semi-Final'
        if (total >= 4 && rnd === roundNumbers[total - 3]) return 'Quarter-Final'
        return `Round ${rnd}`
    }

    // Find champion
    const maxRound = roundNumbers.length > 0 ? Math.max(...roundNumbers) : 0
    const finalMatches = rounds[maxRound] || []
    const champion = finalMatches.length === 1 && finalMatches[0].winner ? finalMatches[0].winner : null
    const runnerUp = champion && finalMatches[0] ? (finalMatches[0].team_1 === champion ? finalMatches[0].team_2 : finalMatches[0].team_1) : null

    return (
        <div className="min-h-screen pt-20 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm">
                    <ArrowLeft size={16} /> Home
                </Link>

                <div className="text-center mb-8">
                    <h1 className="font-display text-3xl font-bold text-white mb-1">
                        {game?.game_name || gameId} — Tournament Bracket
                    </h1>
                    <p className="text-gray-500">
                        {matches.length} matches • {roundNumbers.length} rounds
                    </p>
                </div>

                {/* Champion Banner */}
                {champion && (
                    <div className="glass rounded-2xl p-6 mb-8 bg-gradient-to-r from-neon-yellow/10 via-neon-green/5 to-neon-blue/10 border-neon-yellow/30 text-center animate-fade-in">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <div className="flex items-center gap-3">
                                <Crown size={32} className="text-neon-yellow" />
                                <div>
                                    <p className="text-xs text-neon-yellow font-bold uppercase tracking-wider">Champion</p>
                                    <p className="text-white font-display text-2xl font-bold">{champion}</p>
                                </div>
                            </div>
                            {runnerUp && runnerUp !== 'BYE' && (
                                <div className="flex items-center gap-3">
                                    <Medal size={24} className="text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Runner-up</p>
                                        <p className="text-gray-300 font-display text-lg">{runnerUp}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Visual Bracket */}
                {roundNumbers.length === 0 ? (
                    <div className="text-center py-20">
                        <Trophy size={48} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-500">No matches scheduled yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto pb-4">
                        <div className="flex gap-6 min-w-max items-start">
                            {roundNumbers.map((rnd) => {
                                const matchList = rounds[rnd]
                                return (
                                    <div key={rnd} className="w-64 flex-shrink-0">
                                        <h4 className="text-center text-sm font-bold text-neon-green uppercase tracking-wider mb-4 font-display">
                                            {getRoundLabel(rnd)}
                                        </h4>
                                        <div className="space-y-3" style={{ paddingTop: rnd > roundNumbers[0] ? `${(rnd - roundNumbers[0]) * 30}px` : '0' }}>
                                            {matchList.map((match, mi) => (
                                                <div key={mi} className="bg-dark-800/80 rounded-xl border border-white/5 overflow-hidden" style={{ marginBottom: rnd > roundNumbers[0] ? `${(rnd - roundNumbers[0]) * 30}px` : '0' }}>
                                                    <div className="px-1 py-0.5 text-center">
                                                        <span className="text-[9px] text-gray-600 uppercase">Match {match.match_number || mi + 1}</span>
                                                    </div>
                                                    {/* Team 1 */}
                                                    <div className={`flex items-center justify-between px-3 py-2 border-b border-dark-600 ${match.winner === match.team_1 ? 'bg-neon-green/10' : ''}`}>
                                                        <span className={`text-sm font-medium truncate ${match.winner === match.team_1 ? 'text-neon-green font-bold' : match.team_1 ? 'text-white' : 'text-gray-600'}`}>
                                                            {match.team_1 || 'TBD'}
                                                        </span>
                                                        <span className={`text-sm font-bold ml-2 ${match.winner === match.team_1 ? 'text-neon-green' : 'text-gray-600'}`}>
                                                            {match.team_1_score ?? ''}
                                                        </span>
                                                    </div>
                                                    {/* Team 2 */}
                                                    <div className={`flex items-center justify-between px-3 py-2 ${match.winner === match.team_2 ? 'bg-neon-green/10' : ''}`}>
                                                        <span className={`text-sm font-medium truncate ${match.team_2 === 'BYE' ? 'text-gray-600 italic' : match.winner === match.team_2 ? 'text-neon-green font-bold' : match.team_2 ? 'text-white' : 'text-gray-600'}`}>
                                                            {match.team_2 || 'TBD'}
                                                        </span>
                                                        <span className={`text-sm font-bold ml-2 ${match.winner === match.team_2 ? 'text-neon-green' : 'text-gray-600'}`}>
                                                            {match.team_2 === 'BYE' ? '' : (match.team_2_score ?? '')}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}

                            {/* Champion Column */}
                            {champion && (
                                <div className="w-48 flex-shrink-0" style={{ paddingTop: `${roundNumbers.length * 30}px` }}>
                                    <h4 className="text-center text-sm font-bold text-neon-yellow uppercase tracking-wider mb-4 font-display">
                                        🏆 Champion
                                    </h4>
                                    <div className="bg-gradient-to-b from-neon-yellow/10 to-neon-green/5 rounded-xl border border-neon-yellow/30 p-4 text-center">
                                        <Crown size={28} className="text-neon-yellow mx-auto mb-2" />
                                        <p className="text-white font-display font-bold text-lg">{champion}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
