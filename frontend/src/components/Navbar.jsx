import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Trophy } from 'lucide-react'

export default function Navbar() {
    const [open, setOpen] = useState(false)
    const location = useLocation()

    const links = [
        { to: '/', label: 'Home' },
        { to: '/live', label: 'Live' },
    ]

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-green to-neon-blue flex items-center justify-center">
                            <Trophy size={22} className="text-dark-900" />
                        </div>
                        <div>
                            <span className="font-display font-bold text-lg text-white group-hover:text-neon-green transition-colors">
                                SportsFest
                            </span>
                            <span className="hidden sm:block text-[10px] text-gray-500 -mt-1">Tournament Portal</span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {links.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${location.pathname === link.to
                                    ? 'text-neon-green bg-neon-green/10'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {link.icon}
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        onClick={() => setOpen(!open)}
                        className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
                    >
                        {open ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {open && (
                <div className="md:hidden glass border-t border-white/5 animate-slide-up">
                    <div className="px-4 py-3 space-y-1">
                        {links.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setOpen(false)}
                                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${location.pathname === link.to
                                    ? 'text-neon-green bg-neon-green/10'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {link.icon}
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    )
}
