import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, UserPlus, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { api } from '../api'

const COLLEGES = [
    'AIT Mangalore', 'Sahyadri College', 'NMAMIT Nitte', 'St Joseph Engineering College',
    'Canara Engineering College', 'Srinivas Institute of Technology', 'Yenepoya Institute of Technology',
    'P A College of Engineering', 'Bearys Institute of Technology', 'Shree Devi Institute of Technology',
    'Alvas Institute of Engineering', 'MITE Moodabidri', 'Vivekananda College of Engineering',
    'SJEC Mangaluru', 'KVG College of Engineering', 'SDM College of Engineering',
]

const FALLBACK_GAMES = {
    cricket: { id: 'cricket', game_name: 'Cricket', team_size: 11, registration_fee: 200, team_limit: 10, registration_status: 'open' },
    football: { id: 'football', game_name: 'Football', team_size: 7, registration_fee: 150, team_limit: 8, registration_status: 'open' },
    volleyball: { id: 'volleyball', game_name: 'Volleyball', team_size: 6, registration_fee: 120, team_limit: 12, registration_status: 'open' },
    kabaddi: { id: 'kabaddi', game_name: 'Kabaddi', team_size: 7, registration_fee: 150, team_limit: 10, registration_status: 'open' },
    chess: { id: 'chess', game_name: 'Chess', team_size: 2, registration_fee: 50, team_limit: 16, registration_status: 'open' },
    badminton: { id: 'badminton', game_name: 'Badminton', team_size: 2, registration_fee: 100, team_limit: 12, registration_status: 'open' },
}

export default function Register() {
    const { gameId } = useParams()
    const navigate = useNavigate()
    const [game, setGame] = useState(FALLBACK_GAMES[gameId] || null)
    const [teamName, setTeamName] = useState('')
    const [college, setCollege] = useState('')
    const [collegeSearch, setCollegeSearch] = useState('')
    const [showOther, setShowOther] = useState(false)
    const [customCollege, setCustomCollege] = useState('')
    const [showDropdown, setShowDropdown] = useState(false)
    const [players, setPlayers] = useState([])
    const [errors, setErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)
    const [globalError, setGlobalError] = useState('')

    useEffect(() => {
        api.getGame(gameId)
            .then(data => { if (data && data.id) setGame(data) })
            .catch(() => { })
    }, [gameId])

    useEffect(() => {
        if (game) {
            setPlayers(Array.from({ length: game.team_size }, () => ({ name: '', usn: '' })))
        }
    }, [game])

    const filteredColleges = collegeSearch.length >= 3
        ? COLLEGES.filter(c => c.toLowerCase().includes(collegeSearch.toLowerCase()))
        : []

    const selectCollege = (c) => {
        if (c === '__other__') {
            setShowOther(true)
            setCollege('')
            setCollegeSearch('Other')
        } else {
            setCollege(c)
            setCollegeSearch(c)
            setShowOther(false)
        }
        setShowDropdown(false)
    }

    const updatePlayer = (index, field, value) => {
        const updated = [...players]
        updated[index] = { ...updated[index], [field]: value }
        setPlayers(updated)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setGlobalError('')
        setErrors({})

        // Validate
        const newErrors = {}
        if (!teamName.trim()) newErrors.teamName = 'Team name is required'
        const finalCollege = showOther ? customCollege : college
        if (!finalCollege.trim()) newErrors.college = 'College is required'

        players.forEach((p, i) => {
            if (!p.name.trim()) newErrors[`player_${i}_name`] = 'Name required'
            if (!p.usn.trim()) newErrors[`player_${i}_usn`] = 'USN required'
        })

        if (Object.keys(newErrors).length) {
            setErrors(newErrors)
            return
        }

        setSubmitting(true)

        try {
            const regData = {
                teamName: teamName.trim(),
                college: finalCollege.trim(),
                gameId: game.id,
                gameName: game.game_name,
                players: players.map(p => ({ name: p.name.trim(), usn: p.usn.trim().toUpperCase() })),
                freeRegistration: game.registration_fee === 0,
            }

            const regResult = await api.registerTeam(regData)
            if (regResult.error) {
                setGlobalError(regResult.error)
                setSubmitting(false)
                return
            }

            // If Free Game, skip payment
            if (game.registration_fee === 0) {
                navigate(`/success/${regResult.teamId}`)
                return
            }

            // Initiate Payment
            const orderResult = await api.createPaymentOrder({
                amount: game.registration_fee,
                teamId: regResult.teamId,
                gameName: game.game_name
            })

            if (orderResult.error) {
                setGlobalError('Failed to initialize payment gateway')
                setSubmitting(false)
                return
            }

            if (orderResult.demo) {
                setTimeout(() => navigate(`/success/${regResult.teamId}`), 1000)
                return
            }

            const options = {
                key: orderResult.razorpayKeyId,
                amount: orderResult.amount,
                currency: "INR",
                name: "College Sports Fest 2026",
                description: `Registration for ${game.game_name}`,
                order_id: orderResult.orderId,
                handler: async function (response) {
                    try {
                        const verifyResult = await api.verifyPayment({
                            teamId: regResult.teamId,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        })
                        if (verifyResult.error) throw new Error(verifyResult.error)
                        navigate(`/success/${regResult.teamId}`)
                    } catch (err) {
                        setGlobalError('Payment verification failed. Please contact support.')
                        setSubmitting(false)
                    }
                },
                prefill: {
                    name: players[0]?.name || '',
                },
                theme: {
                    color: "#00FF66"
                },
                modal: {
                    ondismiss: function () {
                        setSubmitting(false)
                        setGlobalError('Payment was cancelled. Your registration is pending payment.')
                    }
                }
            }

            const rzp = new window.Razorpay(options)
            rzp.on('payment.failed', function (response) {
                setSubmitting(false)
                setGlobalError('Payment failed. Please try again.')
            })
            rzp.open()

        } catch (err) {
            setGlobalError('Registration failed. Please try again.')
            setSubmitting(false)
        }
    }

    if (!game) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <p className="text-gray-400">Game not found</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-20 pb-16">
            <div className="max-w-2xl mx-auto px-4 sm:px-6">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm transition-colors">
                    <ArrowLeft size={16} /> Back
                </button>

                <div className="glass rounded-2xl p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-green to-neon-blue flex items-center justify-center">
                            <UserPlus size={24} className="text-dark-900" />
                        </div>
                        <div>
                            <h1 className="font-display text-2xl font-bold text-white">Register for {game.game_name}</h1>
                            <p className="text-gray-500 text-sm">FREE Registration • {game.team_size} players</p>
                        </div>
                    </div>

                    {globalError && (
                        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            <AlertTriangle size={18} />
                            {globalError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Team Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Team Name</label>
                            <input
                                type="text"
                                value={teamName}
                                onChange={e => setTeamName(e.target.value)}
                                placeholder="Enter your team name"
                                className="input-field"
                            />
                            {errors.teamName && <p className="text-red-400 text-xs mt-1">{errors.teamName}</p>}
                        </div>

                        {/* College */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-300 mb-2">College Name</label>
                            <input
                                type="text"
                                value={collegeSearch}
                                onChange={e => {
                                    setCollegeSearch(e.target.value)
                                    setShowDropdown(true)
                                    setShowOther(false)
                                    setCollege('')
                                }}
                                placeholder="Type at least 3 letters to search..."
                                className="input-field"
                            />
                            {showDropdown && filteredColleges.length > 0 && (
                                <div className="absolute z-20 w-full mt-1 bg-dark-700 border border-dark-500 rounded-xl overflow-hidden shadow-2xl max-h-48 overflow-y-auto">
                                    {filteredColleges.map(c => (
                                        <button key={c} type="button" onClick={() => selectCollege(c)} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-neon-green/10 hover:text-neon-green transition-colors">
                                            {c}
                                        </button>
                                    ))}
                                    <button type="button" onClick={() => selectCollege('__other__')} className="w-full text-left px-4 py-2.5 text-sm text-neon-yellow hover:bg-neon-yellow/10 transition-colors border-t border-dark-500">
                                        Other – Enter college name
                                    </button>
                                </div>
                            )}
                            {collegeSearch.length >= 3 && filteredColleges.length === 0 && showDropdown && (
                                <div className="absolute z-20 w-full mt-1 bg-dark-700 border border-dark-500 rounded-xl overflow-hidden shadow-2xl">
                                    <button type="button" onClick={() => selectCollege('__other__')} className="w-full text-left px-4 py-2.5 text-sm text-neon-yellow hover:bg-neon-yellow/10 transition-colors">
                                        Other – Enter college name
                                    </button>
                                </div>
                            )}
                            {showOther && (
                                <input
                                    type="text"
                                    value={customCollege}
                                    onChange={e => setCustomCollege(e.target.value)}
                                    placeholder="Enter your college name"
                                    className="input-field mt-2"
                                />
                            )}
                            {errors.college && <p className="text-red-400 text-xs mt-1">{errors.college}</p>}
                        </div>

                        {/* Game (autofilled) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Game</label>
                            <input type="text" value={game.game_name} disabled className="input-field opacity-60 cursor-not-allowed" />
                        </div>

                        {/* Players */}
                        <div>
                            <h3 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                                Player Details
                                <span className="text-sm font-normal text-gray-500">({game.team_size} players)</span>
                            </h3>
                            <div className="space-y-4">
                                {players.map((player, i) => (
                                    <div key={i} className="bg-dark-700/50 rounded-xl p-4 border border-white/5 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                                        <p className="text-xs text-neon-green font-bold mb-3">Player {i + 1} {i === 0 && '(Captain)'}</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <input
                                                    type="text"
                                                    value={player.name}
                                                    onChange={e => updatePlayer(i, 'name', e.target.value)}
                                                    placeholder="Player Name"
                                                    className="input-field text-sm"
                                                />
                                                {errors[`player_${i}_name`] && <p className="text-red-400 text-xs mt-1">{errors[`player_${i}_name`]}</p>}
                                            </div>
                                            <div>
                                                <input
                                                    type="text"
                                                    value={player.usn}
                                                    onChange={e => updatePlayer(i, 'usn', e.target.value)}
                                                    placeholder="USN (University Seat Number)"
                                                    className="input-field text-sm"
                                                />
                                                {errors[`player_${i}_usn`] && <p className="text-red-400 text-xs mt-1">{errors[`player_${i}_usn`]}</p>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Fee Summary */}
                        <div className="glass rounded-xl p-4 flex items-center justify-between">
                            <span className="text-gray-400">Registration Fee</span>
                            <span className="text-2xl font-bold text-neon-green">
                                {game.registration_fee === 0 ? 'FREE' : `₹${game.registration_fee}`}
                            </span>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full btn-primary text-lg py-4 rounded-2xl font-display font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <><Loader2 size={20} className="animate-spin" /> Processing...</>
                            ) : (
                                <>{game.registration_fee === 0 ? 'Register Now (Free)' : `Pay ₹${game.registration_fee} & Register`}</>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
