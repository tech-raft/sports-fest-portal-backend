import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Users, Zap, ChevronRight, Star } from 'lucide-react'
import { api } from '../api'

const GAME_IMAGES = {
    Cricket: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&q=80',
    Football: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80',
    Volleyball: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=600&q=80',
    Kabaddi: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=600&q=80',
    Chess: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600&q=80',
    Badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80',
}

const FALLBACK_GAMES = [
    { id: 'cricket', game_name: 'Cricket', team_size: 11, registration_fee: 200, team_limit: 10, registration_status: 'open' },
    { id: 'football', game_name: 'Football', team_size: 7, registration_fee: 150, team_limit: 8, registration_status: 'open' },
    { id: 'volleyball', game_name: 'Volleyball', team_size: 6, registration_fee: 120, team_limit: 12, registration_status: 'open' },
    { id: 'kabaddi', game_name: 'Kabaddi', team_size: 7, registration_fee: 150, team_limit: 10, registration_status: 'open' },
    { id: 'chess', game_name: 'Chess', team_size: 2, registration_fee: 50, team_limit: 16, registration_status: 'open' },
    { id: 'badminton', game_name: 'Badminton', team_size: 2, registration_fee: 100, team_limit: 12, registration_status: 'open' },
]

export default function Home() {
    const [games, setGames] = useState(FALLBACK_GAMES)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.getGames()
            .then(data => { if (data && data.length) setGames(data) })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="min-h-screen pt-20 pb-16">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-1/4 w-96 h-96 bg-neon-green/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl"></div>
                </div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/20 text-neon-green text-sm font-medium mb-6 animate-fade-in">
                        <Zap size={14} />
                        <span>Registration Now Open</span>
                    </div>
                    <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black mb-6 animate-slide-up">
                        <span className="text-white">College </span>
                        <span className="gradient-text">Sports Fest</span>
                        <br />
                        <span className="text-white">2026</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-gray-400 text-lg sm:text-xl mb-10 animate-fade-in">
                        Register your team, compete with the best, and claim the championship trophy.
                        Select a sport below to get started.
                    </p>
                    <div className="flex items-center justify-center gap-8 text-sm text-gray-500 animate-fade-in">
                        <div className="flex items-center gap-2">
                            <Trophy size={18} className="text-neon-yellow" />
                            <span>6 Sports</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users size={18} className="text-neon-blue" />
                            <span>100+ Teams</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Star size={18} className="text-neon-pink" />
                            <span>Epic Prizes</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Games Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                        Choose Your Sport
                    </h2>
                    <Link to="/live" className="text-neon-green text-sm hover:underline flex items-center gap-1">
                        Live Dashboard <ChevronRight size={14} />
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {games.map((game, i) => (
                        <Link
                            key={game.id}
                            to={`/game/${game.id}`}
                            className="card-hover group relative rounded-2xl overflow-hidden bg-dark-800 border border-white/5 animate-slide-up"
                            style={{ animationDelay: `${i * 100}ms` }}
                        >
                            {/* Image */}
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={game.game_image || GAME_IMAGES[game.game_name] || 'https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=600&q=80'}
                                    alt={game.game_name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-dark-800 via-transparent to-transparent"></div>
                                <div className="absolute top-3 right-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${game.registration_status === 'open'
                                        ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        }`}>
                                        {game.registration_status === 'open' ? 'Open' : 'Closed'}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <h3 className="font-display text-xl font-bold text-white mb-2 group-hover:text-neon-green transition-colors">
                                    {game.game_name}
                                </h3>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Users size={14} />
                                            {game.team_size} players
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-neon-green font-bold text-lg">₹{game.registration_fee}</span>
                                        <span className="text-gray-500 text-xs block">per team</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Max {game.team_limit} teams</span>
                                    <span className="text-neon-green text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                                        View Details <ChevronRight size={14} />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    )
}
