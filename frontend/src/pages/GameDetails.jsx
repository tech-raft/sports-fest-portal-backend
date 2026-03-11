import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Users, DollarSign, Shield, Clock, ArrowLeft, AlertCircle } from 'lucide-react'
import { api } from '../api'

const GAME_IMAGES = {
    cricket: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&q=80',
    football: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80',
    volleyball: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&q=80',
    kabaddi: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=1200&q=80',
    chess: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=1200&q=80',
    badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&q=80',
}

const GAME_RULES = {
    cricket: {
        instructions: 'Cricket tournament follows a knockout-style format. Each match consists of limited overs. Teams must report 30 minutes before their scheduled match.',
        rules: ['Players must carry valid college ID', 'Follow sportsmanship rules at all times', 'Match format: 6 overs per innings', 'Umpire decisions are final', 'No metal spikes allowed'],
        format: '6-Over Knockout'
    },
    football: {
        instructions: 'Football matches will be played in 7-a-side format. Substitutions are allowed as per tournament rules.',
        rules: ['Carry valid college ID', 'Studs must be rubber/moulded', 'Two halves of 15 minutes each', 'Penalties in case of a draw', 'Fair play policy strictly enforced'],
        format: '7-a-Side Knockout'
    },
    volleyball: {
        instructions: 'Volleyball tournament follows standard indoor rules with a modified set count.',
        rules: ['College ID mandatory', 'Best of 3 sets (25 points each)', 'Rally point scoring', 'Rotation must be followed', 'Net violations will be penalized'],
        format: 'Best of 3 Sets'
    },
    kabaddi: {
        instructions: 'Standard Pro Kabaddi League rules will be followed for all matches.',
        rules: ['College ID required', 'Two halves of 15 minutes', 'Standard court dimensions', 'Touch rules apply', 'Bonus line rules applicable'],
        format: 'Standard PKL Format'
    },
    chess: {
        instructions: 'Chess matches will follow rapid format timing. Both board players must be present.',
        rules: ['College ID mandatory', 'Rapid format: 15+10 per player', 'Touch-move rule applies', 'Standard FIDE rules', 'Electronic devices prohibited'],
        format: 'Rapid 15+10'
    },
    badminton: {
        instructions: 'Doubles badminton tournament with standard BWF scoring.',
        rules: ['College ID mandatory', 'Best of 3 games (21 points)', 'Players must bring own rackets', 'Shuttlecocks provided by organizers', 'BWF rules apply'],
        format: 'Doubles - Best of 3'
    },
}

const FALLBACK_GAMES = {
    cricket: { id: 'cricket', game_name: 'Cricket', team_size: 11, registration_fee: 200, team_limit: 10, registration_status: 'open' },
    football: { id: 'football', game_name: 'Football', team_size: 7, registration_fee: 150, team_limit: 8, registration_status: 'open' },
    volleyball: { id: 'volleyball', game_name: 'Volleyball', team_size: 6, registration_fee: 120, team_limit: 12, registration_status: 'open' },
    kabaddi: { id: 'kabaddi', game_name: 'Kabaddi', team_size: 7, registration_fee: 150, team_limit: 10, registration_status: 'open' },
    chess: { id: 'chess', game_name: 'Chess', team_size: 2, registration_fee: 50, team_limit: 16, registration_status: 'open' },
    badminton: { id: 'badminton', game_name: 'Badminton', team_size: 2, registration_fee: 100, team_limit: 12, registration_status: 'open' },
}

export default function GameDetails() {
    const { gameId } = useParams()
    const navigate = useNavigate()
    const [game, setGame] = useState(FALLBACK_GAMES[gameId] || null)

    useEffect(() => {
        api.getGame(gameId)
            .then(data => { if (data && data.id) setGame(data) })
            .catch(() => { })
    }, [gameId])

    const rules = GAME_RULES[gameId] || GAME_RULES.cricket

    if (!game) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <p className="text-gray-400">Game not found</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-16">
            {/* Banner */}
            <div className="relative h-64 sm:h-80">
                <img
                    src={game.game_image || GAME_IMAGES[game.id] || GAME_IMAGES.cricket}
                    alt={game.game_name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                    <div className="max-w-4xl mx-auto">
                        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors text-sm">
                            <ArrowLeft size={16} /> Back to Sports
                        </Link>
                        <h1 className="font-display text-4xl sm:text-5xl font-black text-white">{game.game_name}</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                    {[
                        { icon: <Users size={20} />, label: 'Team Size', value: `${game.team_size} Players`, color: 'text-neon-blue' },
                        { icon: <DollarSign size={20} />, label: 'Entry Fee', value: `₹${game.registration_fee}`, color: 'text-neon-green' },
                        { icon: <Shield size={20} />, label: 'Max Teams', value: game.team_limit, color: 'text-neon-purple' },
                        { icon: <Clock size={20} />, label: 'Format', value: rules.format, color: 'text-neon-yellow' },
                    ].map((stat, i) => (
                        <div key={i} className="glass rounded-xl p-4 text-center animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className={`${stat.color} mb-2 flex justify-center`}>{stat.icon}</div>
                            <p className="text-white font-bold text-lg">{stat.value}</p>
                            <p className="text-gray-500 text-xs">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Instructions */}
                {(game.description || rules?.instructions) && (
                    <div className="glass rounded-2xl p-6 mb-6 animate-fade-in">
                        <h2 className="font-display text-xl font-bold text-white mb-3">Description</h2>
                        <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">{game.description || rules.instructions}</p>
                    </div>
                )}

                {/* Rules */}
                {(game.rules || rules?.rules) && (
                    <div className="glass rounded-2xl p-6 mb-8 animate-fade-in">
                        <h2 className="font-display text-xl font-bold text-white mb-4">Rules & Regulations</h2>
                        {game.rules ? (
                            <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {game.rules}
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {rules.rules.map((rule, i) => (
                                    <li key={i} className="flex items-start gap-3 text-gray-300">
                                        <span className="w-6 h-6 rounded-full bg-neon-green/10 text-neon-green text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                                            {i + 1}
                                        </span>
                                        {rule}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* CTA */}
                {game.registration_status === 'open' ? (
                    <button
                        onClick={() => navigate(`/register/${gameId}`)}
                        className="w-full btn-primary text-lg py-4 rounded-2xl font-display font-bold"
                    >
                        Proceed to Registration →
                    </button>
                ) : (
                    <div className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400">
                        <AlertCircle size={20} />
                        <span className="font-bold">Registration Closed</span>
                    </div>
                )}
            </div>
        </div>
    )
}
