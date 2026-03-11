import { useState, useEffect } from 'react'
import { X, Save, Edit2, Trash2 } from 'lucide-react'
import { api } from '../../api'

export default function EditTeamModal({ team, onClose, onUpdate }) {
    const [teamData, setTeamData] = useState({
        team_name: team.team_name || '',
        college: team.college || '',
        game_id: team.game_id || '',
        game: team.game || '',
    })
    const [players, setPlayers] = useState([])
    const [games, setGames] = useState([])
    const [loading, setLoading] = useState(true)

    // Player edit state
    const [editingPlayerId, setEditingPlayerId] = useState(null)
    const [editPlayerForm, setEditPlayerForm] = useState({ name: '', usn: '' })

    useEffect(() => {
        Promise.all([
            api.getPlayers(team.team_id),
            api.getGames()
        ]).then(([playersData, gamesData]) => {
            if (Array.isArray(playersData)) setPlayers(playersData)
            if (Array.isArray(gamesData)) setGames(gamesData)
        }).finally(() => setLoading(false))
    }, [team.team_id])

    const handleTeamChange = (e) => {
        const { name, value } = e.target
        if (name === 'game_id') {
            const selectedGame = games.find(g => g.id === value)
            setTeamData(prev => ({ ...prev, game_id: value, game: selectedGame?.game_name || '' }))
        } else {
            setTeamData(prev => ({ ...prev, [name]: value }))
        }
    }

    const saveTeamDetails = async () => {
        try {
            await fetch(`${api.baseURL}/teams/${team.team_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(teamData)
            })
            onUpdate()
        } catch (err) {
            alert('Failed to update team details')
        }
    }

    const startPlayerEdit = (player) => {
        setEditingPlayerId(player.player_id)
        setEditPlayerForm({ name: player.name, usn: player.usn })
    }

    const savePlayerEdit = async (playerId) => {
        try {
            await fetch(`${api.baseURL}/players/${playerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editPlayerForm)
            })
            setPlayers(prev => prev.map(p => p.player_id === playerId ? { ...p, ...editPlayerForm } : p))
            setEditingPlayerId(null)
        } catch (err) {
            alert('Failed to update player')
        }
    }

    const deletePlayer = async (playerId) => {
        if (!confirm('Are you sure you want to remove this player?')) return
        try {
            await fetch(`${api.baseURL}/players/${playerId}`, { method: 'DELETE' })
            setPlayers(prev => prev.filter(p => p.player_id !== playerId))
            onUpdate() // to refresh count
        } catch (err) {
            alert('Failed to delete player')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-dark-800 border border-white/10 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">

                <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white font-display">Edit Team: {team.team_name}</h2>
                        <p className="text-sm text-neon-green font-mono mt-1">{team.team_code}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                    {/* Primary Details Section */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">Team Details</h3>
                            <button onClick={saveTeamDetails} className="btn-primary text-xs !py-1.5 !px-3 flex items-center gap-1.5">
                                <Save size={14} /> Save Details
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Team Name</label>
                                <input
                                    type="text" name="team_name" value={teamData.team_name} onChange={handleTeamChange}
                                    className="input-field w-full text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">College</label>
                                <input
                                    type="text" name="college" value={teamData.college} onChange={handleTeamChange}
                                    className="input-field w-full text-sm"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-400 mb-1">Registered Game</label>
                                <select
                                    name="game_id" value={teamData.game_id} onChange={handleTeamChange}
                                    className="input-field w-full text-sm"
                                >
                                    {games.map(g => (
                                        <option key={g.id} value={g.id}>{g.game_name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-yellow-500/80 mt-1">Warning: Changing the game will migrate all players. Ensure team size requirements match.</p>
                            </div>
                        </div>
                    </section>

                    <div className="h-px bg-white/10 w-full" />

                    {/* Roster Section */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">Player Roster</h3>
                            <span className="text-xs bg-white/10 text-white px-2 py-1 rounded-full">{players.length} Players</span>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin w-6 h-6 border-2 border-neon-green border-t-transparent rounded-full"></div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {players.map(player => (
                                    <div key={player.player_id} className="glass rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">

                                        {/* Edit Mode vs View Mode */}
                                        {editingPlayerId === player.player_id ? (
                                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                                <input
                                                    type="text" value={editPlayerForm.name}
                                                    onChange={e => setEditPlayerForm(prev => ({ ...prev, name: e.target.value }))}
                                                    className="input-field text-sm !py-2" placeholder="Player Name"
                                                />
                                                <input
                                                    type="text" value={editPlayerForm.usn}
                                                    onChange={e => setEditPlayerForm(prev => ({ ...prev, usn: e.target.value }))}
                                                    className="input-field text-sm !py-2 uppercase font-mono" placeholder="USN"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex-1">
                                                <p className="text-white font-medium">{player.name}</p>
                                                <p className="text-gray-400 font-mono text-xs mt-0.5">{player.usn}</p>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                            {editingPlayerId === player.player_id ? (
                                                <>
                                                    <button onClick={() => savePlayerEdit(player.player_id)} className="p-2 bg-neon-green/10 text-neon-green hover:bg-neon-green/20 rounded-lg transition-colors">
                                                        <Save size={16} />
                                                    </button>
                                                    <button onClick={() => setEditingPlayerId(null)} className="p-2 bg-dark-600 text-gray-400 hover:text-white rounded-lg transition-colors">
                                                        <X size={16} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => startPlayerEdit(player)} className="p-2 text-gray-400 hover:text-white bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => deletePlayer(player.player_id)} className="p-2 text-gray-400 hover:text-red-400 bg-dark-700 hover:bg-red-500/10 rounded-lg transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                    </div>
                                ))}
                                {players.length === 0 && (
                                    <p className="text-gray-500 text-sm text-center py-4 italic">No players found</p>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    )
}
