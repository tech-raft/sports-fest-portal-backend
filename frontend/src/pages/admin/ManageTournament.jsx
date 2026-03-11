import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Swords, Loader2, Zap, ChevronRight, CheckCircle, Trophy, Crown, Trash2, RefreshCw } from 'lucide-react'
import { api } from '../../api'

export default function ManageTournament() {
    const navigate = useNavigate()
    const [games, setGames] = useState([])
    const [selectedGame, setSelectedGame] = useState('')
    const [matches, setMatches] = useState([])
    const [teams, setTeams] = useState([])
    const [generating, setGenerating] = useState(false)
    const [advancing, setAdvancing] = useState(false)
    const [deleting, setDeleting] = useState(null)
    const [msg, setMsg] = useState({ text: '', type: '' })

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (user.role !== 'admin') { navigate('/login'); return }
        api.getGames().then(data => { if (Array.isArray(data)) setGames(data) }).catch(() => { })
    }, [navigate])

    useEffect(() => {
        if (selectedGame) {
            refreshData()
        } else {
            setMatches([])
            setTeams([])
        }
    }, [selectedGame])

    const refreshData = async () => {
        if (!selectedGame) return
        try {
            const [matchData, teamData] = await Promise.all([
                api.getMatches(selectedGame),
                api.getTeams(selectedGame)
            ])
            if (Array.isArray(matchData)) setMatches(matchData)
            if (Array.isArray(teamData)) setTeams(teamData.filter(t => t.payment_status === 'paid'))
        } catch { }
    }

    // Generate Round 1 matches automatically
    const generateMatches = async () => {
        setGenerating(true)
        setMsg({ text: '', type: '' })
        try {
            const res = await api.generateMatches(selectedGame)
            if (res.error) {
                setMsg({ text: res.error, type: 'error' })
            } else {
                setMsg({ text: `Round 1 generated! ${res.matches?.length || 0} matches created.`, type: 'success' })
                refreshData()
            }
        } catch { setMsg({ text: 'Failed to generate matches', type: 'error' }) }
        setGenerating(false)
    }

    // Advance winners to next round automatically
    const advanceToNextRound = async () => {
        setAdvancing(true)
        setMsg({ text: '', type: '' })
        try {
            const res = await api.generateNextRound(selectedGame)
            if (res.error) {
                setMsg({ text: res.error, type: 'error' })
            } else {
                setMsg({ text: `Round ${res.round} created! Winners advanced.`, type: 'success' })
                refreshData()
            }
        } catch { setMsg({ text: 'Failed to advance round', type: 'error' }) }
        setAdvancing(false)
    }

    const deleteMatch = async (matchId) => {
        setDeleting(matchId)
        try { await api.deleteMatch(matchId); refreshData() } catch { }
        setDeleting(null)
    }

    // Group matches by round
    const rounds = matches.reduce((acc, m) => {
        const r = m.round || 1
        if (!acc[r]) acc[r] = []
        acc[r].push(m)
        return acc
    }, {})
    const roundNumbers = Object.keys(rounds).map(Number).sort()
    const maxRound = roundNumbers.length > 0 ? Math.max(...roundNumbers) : 0
    const hasMatches = matches.length > 0

    // Current round status
    const currentRoundMatches = rounds[maxRound] || []
    const allCurrentDone = currentRoundMatches.length > 0 && currentRoundMatches.every(m => m.winner)
    const currentWinners = currentRoundMatches.filter(m => m.winner).map(m => m.winner)
    const pendingCount = currentRoundMatches.filter(m => !m.winner && m.team_2 !== 'BYE').length

    // Tournament complete?
    const isTournamentComplete = allCurrentDone && currentWinners.length === 1
    const champion = isTournamentComplete ? currentWinners[0] : null
    const finalMatch = isTournamentComplete ? currentRoundMatches[0] : null
    const runnerUp = finalMatch ? (finalMatch.team_1 === champion ? finalMatch.team_2 : finalMatch.team_1) : null

    const selectedGameData = games.find(g => g.id === selectedGame)

    const getRoundLabel = (rnd) => {
        const total = roundNumbers.length
        if (total >= 2 && rnd === roundNumbers[total - 1]) return '🏆 Final'
        if (total >= 3 && rnd === roundNumbers[total - 2]) return 'Semi-Final'
        if (total >= 4 && rnd === roundNumbers[total - 3]) return 'Quarter-Final'
        return `Round ${rnd}`
    }

    return (
        <div className="min-h-screen pt-20 pb-16">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <Link to="/admin" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>

                <h1 className="font-display text-3xl font-bold text-white mb-2">Tournament Management</h1>
                <p className="text-gray-500 mb-6">Generate matches, update scores, advance winners</p>

                {/* Game Selector */}
                <select
                    value={selectedGame}
                    onChange={e => { setSelectedGame(e.target.value); setMsg({ text: '', type: '' }) }}
                    className="input-field text-sm mb-6"
                >
                    <option value="">Select a game...</option>
                    {games.map(g => (
                        <option key={g.id} value={g.id}>
                            {g.game_name} — {g.registered_teams || 0} teams ({g.registration_status})
                        </option>
                    ))}
                </select>

                {selectedGame && (
                    <>
                        {/* Status bar */}
                        <div className="glass rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-400">Teams: <span className="text-white font-bold">{teams.length}</span></span>
                                <span className="text-gray-400">Matches: <span className="text-white font-bold">{matches.length}</span></span>
                                <span className="text-gray-400">Rounds: <span className="text-white font-bold">{roundNumbers.length}</span></span>
                                {pendingCount > 0 && (
                                    <span className="text-neon-yellow font-bold">{pendingCount} pending</span>
                                )}
                            </div>
                            <button onClick={refreshData} className="text-gray-500 hover:text-white transition-colors">
                                <RefreshCw size={16} />
                            </button>
                        </div>

                        {/* Champion Banner */}
                        {champion && (
                            <div className="glass rounded-2xl p-6 mb-6 bg-gradient-to-r from-neon-yellow/10 via-neon-green/5 to-neon-blue/10 border-neon-yellow/30 animate-fade-in">
                                <div className="text-center">
                                    <p className="text-neon-yellow text-sm font-bold uppercase tracking-wider mb-2">🏆 Tournament Complete</p>
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                        <div className="flex items-center gap-3">
                                            <Crown size={32} className="text-neon-yellow" />
                                            <div>
                                                <p className="text-xs text-neon-yellow font-bold">CHAMPION</p>
                                                <p className="text-white font-display text-2xl font-bold">{champion}</p>
                                            </div>
                                        </div>
                                        {runnerUp && runnerUp !== 'BYE' && (
                                            <div className="flex items-center gap-3">
                                                <Trophy size={24} className="text-gray-400" />
                                                <div>
                                                    <p className="text-xs text-gray-500 font-bold">RUNNER-UP</p>
                                                    <p className="text-gray-300 font-display text-lg">{runnerUp}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        {!isTournamentComplete && (
                            <div className="flex flex-wrap gap-3 mb-6">
                                {/* Generate Round 1 */}
                                {!hasMatches && teams.length >= 2 && (
                                    <button
                                        onClick={generateMatches}
                                        disabled={generating}
                                        className="btn-primary flex items-center gap-2 !py-3"
                                    >
                                        {generating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                                        Generate Round 1 Matches ({teams.length} teams)
                                    </button>
                                )}

                                {!hasMatches && teams.length < 2 && (
                                    <p className="text-gray-500 text-sm py-3">Need at least 2 registered teams to generate matches.</p>
                                )}

                                {/* Score matches link */}
                                {hasMatches && pendingCount > 0 && (
                                    <Link
                                        to="/management/scoring"
                                        className="btn-primary flex items-center gap-2 !py-3"
                                    >
                                        <Swords size={16} />
                                        Score Matches ({pendingCount} pending)
                                    </Link>
                                )}

                                {/* Advance Winners */}
                                {allCurrentDone && currentWinners.length >= 2 && (
                                    <button
                                        onClick={advanceToNextRound}
                                        disabled={advancing}
                                        className="btn-secondary flex items-center gap-2 !py-3 border-neon-green/30"
                                    >
                                        {advancing ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                                        Advance {currentWinners.length} Winners → Round {maxRound + 1}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Message */}
                        {msg.text && (
                            <div className={`mb-6 px-4 py-3 rounded-xl text-sm ${msg.type === 'success' ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {msg.text}
                            </div>
                        )}

                        {/* Winners Ready Banner */}
                        {allCurrentDone && currentWinners.length >= 2 && !isTournamentComplete && (
                            <div className="glass rounded-xl p-4 mb-6 border-neon-green/20">
                                <p className="text-white font-bold text-sm mb-2">Round {maxRound} Complete — Winners:</p>
                                <div className="flex flex-wrap gap-2">
                                    {currentWinners.map(w => (
                                        <span key={w} className="px-3 py-1 rounded-full bg-neon-green/10 text-neon-green text-xs font-bold border border-neon-green/20">
                                            ✓ {w}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bracket Display */}
                        {roundNumbers.length === 0 ? (
                            <div className="text-center py-16">
                                <Swords size={48} className="mx-auto text-gray-600 mb-4" />
                                <p className="text-gray-500">No matches yet.</p>
                                <p className="text-gray-600 text-sm mt-1">
                                    {teams.length >= 2
                                        ? 'Click "Generate Round 1 Matches" to start the tournament.'
                                        : 'Register at least 2 teams first, then generate matches.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {roundNumbers.map(rnd => {
                                    const matchList = rounds[rnd]
                                    const roundDone = matchList.every(m => m.winner)
                                    return (
                                        <div key={rnd}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <h3 className="font-display text-sm font-bold text-neon-green uppercase tracking-wider">
                                                    {getRoundLabel(rnd)}
                                                </h3>
                                                {roundDone && <CheckCircle size={14} className="text-neon-green" />}
                                                <span className="text-xs text-gray-600">({matchList.length} matches)</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {matchList.map((match, mi) => (
                                                    <div key={mi} className="glass rounded-xl overflow-hidden group">
                                                        <div className="p-4">
                                                            <p className="text-[10px] text-gray-600 mb-2 uppercase tracking-wider">Match {match.match_number || mi + 1}</p>
                                                            {/* Team 1 */}
                                                            <div className={`flex items-center justify-between px-3 py-2 rounded-lg mb-1 ${match.winner === match.team_1 ? 'bg-neon-green/10' : 'bg-dark-700/50'}`}>
                                                                <span className={`text-sm font-medium ${match.winner === match.team_1 ? 'text-neon-green font-bold' : 'text-white'}`}>
                                                                    {match.team_1}
                                                                </span>
                                                                <span className={`text-sm font-bold ${match.winner === match.team_1 ? 'text-neon-green' : 'text-gray-600'}`}>
                                                                    {match.team_1_score ?? '-'}
                                                                </span>
                                                            </div>
                                                            {/* Team 2 */}
                                                            <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${match.winner === match.team_2 ? 'bg-neon-green/10' : match.team_2 === 'BYE' ? 'bg-dark-700/20' : 'bg-dark-700/50'}`}>
                                                                <span className={`text-sm font-medium ${match.team_2 === 'BYE' ? 'text-gray-600 italic' : match.winner === match.team_2 ? 'text-neon-green font-bold' : 'text-white'}`}>
                                                                    {match.team_2}
                                                                </span>
                                                                <span className={`text-sm font-bold ${match.winner === match.team_2 ? 'text-neon-green' : 'text-gray-600'}`}>
                                                                    {match.team_2 === 'BYE' ? '-' : (match.team_2_score ?? '-')}
                                                                </span>
                                                            </div>
                                                            {/* Winner / Score link */}
                                                            <div className="flex items-center justify-between mt-2">
                                                                {match.winner ? (
                                                                    <p className="text-neon-green text-xs flex items-center gap-1"><CheckCircle size={12} /> {match.winner} wins</p>
                                                                ) : match.team_2 !== 'BYE' ? (
                                                                    <Link to="/management/scoring" className="text-neon-blue text-xs hover:underline">Enter Score →</Link>
                                                                ) : (
                                                                    <p className="text-gray-600 text-xs">Auto-advance (BYE)</p>
                                                                )}
                                                                <button
                                                                    onClick={() => deleteMatch(match.match_id)}
                                                                    disabled={deleting === match.match_id}
                                                                    className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                                >
                                                                    {deleting === match.match_id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
