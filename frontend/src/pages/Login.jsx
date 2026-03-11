import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { api } from '../api'

export default function Login() {
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await api.login({ username, password })
            if (res.error) {
                setError(res.error)
            } else {
                localStorage.setItem('user', JSON.stringify(res.user))
                if (res.user.role === 'admin') {
                    navigate('/admin')
                } else {
                    navigate('/management')
                }
            }
        } catch {
            // Demo fallback
            if (username === 'admin' && password === 'admin123') {
                localStorage.setItem('user', JSON.stringify({ username: 'admin', role: 'admin' }))
                navigate('/admin')
            } else if (username === 'management' && password === 'manage123') {
                localStorage.setItem('user', JSON.stringify({ username: 'management', role: 'management' }))
                navigate('/management')
            } else {
                setError('Invalid credentials')
            }
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen pt-20 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="glass rounded-2xl p-8 animate-slide-up">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-neon-green to-neon-blue flex items-center justify-center mb-4">
                            <Shield size={32} className="text-dark-900" />
                        </div>
                        <h1 className="font-display text-2xl font-bold text-white">Panel Login</h1>
                        <p className="text-gray-500 text-sm mt-1">Admin or Management access</p>
                    </div>

                    {error && (
                        <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="Enter username"
                                className="input-field"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    className="input-field pr-12"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                >
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-4 rounded-2xl font-display font-bold disabled:opacity-50"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 p-4 rounded-xl bg-dark-700/50 border border-white/5">
                        <p className="text-xs text-gray-500 mb-2 font-medium">Demo Credentials:</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <p className="text-neon-green font-mono">admin / admin123</p>
                                <p className="text-gray-600">Full access</p>
                            </div>
                            <div>
                                <p className="text-neon-blue font-mono">management / manage123</p>
                                <p className="text-gray-600">View & scan</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
