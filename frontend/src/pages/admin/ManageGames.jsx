import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, ToggleLeft, ToggleRight, Loader2, Plus, X, Trash2 } from 'lucide-react'
import { api } from '../../api'

export default function ManageGames() {
    const navigate = useNavigate()
    const [games, setGames] = useState([])
    const [saving, setSaving] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [newGame, setNewGame] = useState({
        game_name: '',
        team_size: 6,
        registration_fee: 100,
        team_limit: 10,
        registration_status: 'open',
    })
    const [addError, setAddError] = useState('')

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (user.role !== 'admin') { navigate('/login'); return }
        fetchGames()
    }, [navigate])

    const fetchGames = async () => {
        try {
            const data = await api.getGames()
            if (Array.isArray(data) && data.length) setGames(data)
        } catch { }
        setLoading(false)
    }

    const toggleRegistration = async (gameId) => {
        const game = games.find(g => g.id === gameId)
        const newStatus = game.registration_status === 'open' ? 'closed' : 'open'
        setSaving(gameId)
        try {
            await api.updateGame(gameId, { registration_status: newStatus })
            setGames(prev => prev.map(g => g.id === gameId ? { ...g, registration_status: newStatus } : g))
        } catch { }
        setSaving(null)
    }

    const updateField = (gameId, field, value) => {
        setGames(prev => prev.map(g => g.id === gameId ? { ...g, [field]: value } : g))
    }

    const saveGame = async (gameId) => {
        const game = games.find(g => g.id === gameId)
        setSaving(gameId)
        try {
            await api.updateGame(gameId, {
                game_name: game.game_name,
                registration_fee: Number(game.registration_fee),
                team_limit: Number(game.team_limit),
                team_size: Number(game.team_size),
            })
        } catch { }
        setSaving(null)
    }

    const addGame = async () => {
        setAddError('')
        if (!newGame.game_name.trim()) {
            setAddError('Game name is required')
            return
        }
        setSaving('new')
        try {
            const res = await fetch('/api/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    game_name: newGame.game_name.trim(),
                    team_size: Number(newGame.team_size),
                    registration_fee: Number(newGame.registration_fee),
                    team_limit: Number(newGame.team_limit),
                    registration_status: newGame.registration_status,
                }),
            })
            const data = await res.json()
            if (data.success) {
                await fetchGames()
                setShowAddForm(false)
                setNewGame({ game_name: '', team_size: 6, registration_fee: 100, team_limit: 10, registration_status: 'open' })
            } else {
                setAddError(data.error || 'Failed to add game')
            }
        } catch {
            setAddError('Failed to add game')
        }
        setSaving(null)
    }

    const deleteGame = async (gameId) => {
        if (!confirm('Are you sure you want to delete this game?')) return
        setSaving(gameId)
        try {
            await fetch(`/api/games/${gameId}`, { method: 'DELETE' })
            setGames(prev => prev.filter(g => g.id !== gameId))
        } catch { }
        setSaving(null)
    }

    if (loading) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-20 pb-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <Link to="/admin" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>

                <div className="flex items-center justify-between mb-8">
                    <h1 className="font-display text-3xl font-bold text-white">Manage Games</h1>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="btn-primary flex items-center gap-2 text-sm"
                    >
                        <Plus size={16} /> Add Game
                    </button>
                </div>

                {/* Add Game Form */}
                {showAddForm && (
                    <div className="glass rounded-2xl p-6 mb-6 neon-border animate-slide-up">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display text-lg font-bold text-neon-green">Add New Game</h3>
                            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {addError && (
                            <p className="text-red-400 text-sm mb-3">{addError}</p>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div className="sm:col-span-2">
                                <label className="text-xs text-gray-500 mb-1 block">Game Name</label>
                                <input
                                    type="text"
                                    value={newGame.game_name}
                                    onChange={e => setNewGame({ ...newGame, game_name: e.target.value })}
                                    placeholder="e.g. Table Tennis"
                                    className="input-field text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Team Size</label>
                                <input
                                    type="number"
                                    value={newGame.team_size}
                                    onChange={e => setNewGame({ ...newGame, team_size: e.target.value })}
                                    className="input-field text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Registration Fee (₹)</label>
                                <input
                                    type="number"
                                    value={newGame.registration_fee}
                                    onChange={e => setNewGame({ ...newGame, registration_fee: e.target.value })}
                                    className="input-field text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Team Limit</label>
                                <input
                                    type="number"
                                    value={newGame.team_limit}
                                    onChange={e => setNewGame({ ...newGame, team_limit: e.target.value })}
                                    className="input-field text-sm"
                                />
                            </div>
                        </div>

                        <button
                            onClick={addGame}
                            disabled={saving === 'new'}
                            className="btn-primary flex items-center gap-1.5 text-sm"
                        >
                            {saving === 'new' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                            Add Game
                        </button>
                    </div>
                )}

                {/* Existing Games */}
                <div className="space-y-4">
                    {games.map(game => (
                        <div key={game.id} className="glass rounded-2xl p-6 animate-fade-in">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-display text-xl font-bold text-white">{game.game_name}</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleRegistration(game.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${game.registration_status === 'open'
                                                ? 'bg-neon-green/10 text-neon-green border border-neon-green/30'
                                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                                            }`}
                                    >
                                        {game.registration_status === 'open' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                        {game.registration_status === 'open' ? 'Open' : 'Closed'}
                                    </button>
                                    <button
                                        onClick={() => deleteGame(game.id)}
                                        className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        title="Delete game"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Team Size</label>
                                    <input
                                        type="number"
                                        value={game.team_size}
                                        onChange={e => updateField(game.id, 'team_size', e.target.value)}
                                        className="input-field text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Registration Fee (₹)</label>
                                    <input
                                        type="number"
                                        value={game.registration_fee}
                                        onChange={e => updateField(game.id, 'registration_fee', e.target.value)}
                                        className="input-field text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Team Limit</label>
                                    <input
                                        type="number"
                                        value={game.team_limit}
                                        onChange={e => updateField(game.id, 'team_limit', e.target.value)}
                                        className="input-field text-sm"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => saveGame(game.id)}
                                disabled={saving === game.id}
                                className="btn-secondary text-sm flex items-center gap-1.5 !px-4 !py-2"
                            >
                                {saving === game.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Save Changes
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
