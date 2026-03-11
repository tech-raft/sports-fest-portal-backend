import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Camera, CheckCircle, XCircle, ScanLine, AlertTriangle, Users, Loader2 } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import { api } from '../../api'

export default function QRScanner() {
    const navigate = useNavigate()
    const [scanning, setScanning] = useState(false)
    const [scanResult, setScanResult] = useState(null)
    const [scanStatus, setScanStatus] = useState(null)
    const [teamDetails, setTeamDetails] = useState(null)
    const [players, setPlayers] = useState([])
    const [manualCode, setManualCode] = useState('')
    const [loading, setLoading] = useState(false)
    const scannerRef = useRef(null)
    const scannerContainerId = 'qr-reader'

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (!['admin', 'management'].includes(user.role)) { navigate('/login'); return }
        return () => stopCamera()
    }, [navigate])

    const startCamera = async () => {
        setScanResult(null)
        setScanStatus(null)
        setTeamDetails(null)
        setPlayers([])
        setScanning(true)

        // Small delay to let React render the container div
        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode(scannerContainerId)
                scannerRef.current = html5QrCode

                await html5QrCode.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText) => {
                        // QR code scanned successfully
                        handleCheckIn(decodedText)
                        stopCamera()
                    },
                    () => { } // ignore scan failures
                )
            } catch (err) {
                console.error('Camera error:', err)
                setScanning(false)
                setScanStatus('error')
                setScanResult({ message: 'Camera access denied or not available. Use manual entry below.' })
            }
        }, 300)
    }

    const stopCamera = async () => {
        try {
            if (scannerRef.current && scannerRef.current.isScanning) {
                await scannerRef.current.stop()
            }
        } catch { }
        scannerRef.current = null
        setScanning(false)
    }

    const handleCheckIn = async (code) => {
        if (!code || loading) return
        setLoading(true)
        setScanResult(null)
        setScanStatus(null)
        setTeamDetails(null)
        setPlayers([])

        try {
            const res = await api.checkIn(code.trim())
            if (res.error) {
                if (res.error.includes('already')) {
                    setScanStatus('already')
                    setScanResult({ message: 'Team already checked in' })
                    // Still show team details
                    if (res.team) {
                        setTeamDetails(res.team)
                        loadPlayers(res.team.team_id)
                    }
                } else {
                    setScanStatus('error')
                    setScanResult({ message: res.error })
                }
            } else {
                setScanStatus('success')
                setScanResult({ message: 'Team successfully checked in!' })
                if (res.team) {
                    setTeamDetails(res.team)
                    loadPlayers(res.team.team_id)
                }
            }
        } catch {
            setScanStatus('error')
            setScanResult({ message: 'Check-in failed. Please try again.' })
        }
        setLoading(false)
    }

    const loadPlayers = async (teamId) => {
        try {
            const data = await api.getPlayers(teamId)
            if (Array.isArray(data)) setPlayers(data)
        } catch { }
    }

    const handleManualSubmit = (e) => {
        e.preventDefault()
        if (manualCode.trim()) {
            handleCheckIn(manualCode.trim().toUpperCase())
            setManualCode('')
        }
    }

    const resetScanner = () => {
        setScanResult(null)
        setScanStatus(null)
        setTeamDetails(null)
        setPlayers([])
    }

    return (
        <div className="min-h-screen pt-20 pb-16">
            <div className="max-w-lg mx-auto px-4 sm:px-6">
                <Link to="/management" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-neon-blue to-neon-green flex items-center justify-center mb-4">
                        <ScanLine size={32} className="text-dark-900" />
                    </div>
                    <h1 className="font-display text-2xl font-bold text-white">QR Check-In Scanner</h1>
                    <p className="text-gray-500 text-sm">Scan team QR codes or enter codes manually</p>
                </div>

                {/* Camera Scanner */}
                <div className="glass rounded-2xl p-6 mb-6">
                    {scanning ? (
                        <div>
                            <div id={scannerContainerId} className="rounded-xl overflow-hidden mb-3" />
                            <button onClick={stopCamera} className="w-full btn-secondary text-sm py-2">
                                Stop Camera
                            </button>
                            <p className="text-center text-gray-500 text-xs mt-2">
                                Position QR code within the frame
                            </p>
                        </div>
                    ) : (
                        <button onClick={startCamera} className="w-full btn-primary flex items-center justify-center gap-2 py-4">
                            <Camera size={20} />
                            Open Camera Scanner
                        </button>
                    )}
                </div>

                {/* Manual Entry */}
                <div className="glass rounded-2xl p-6 mb-6">
                    <h3 className="text-sm font-bold text-gray-300 mb-3">Manual Entry</h3>
                    <form onSubmit={handleManualSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={manualCode}
                            onChange={e => setManualCode(e.target.value)}
                            placeholder="Enter team code (e.g., CRK-2026-001)"
                            className="input-field text-sm flex-1"
                        />
                        <button type="submit" disabled={loading} className="btn-primary !px-5 text-sm whitespace-nowrap disabled:opacity-50">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Check In'}
                        </button>
                    </form>
                </div>

                {/* Result Banner */}
                {scanResult && (
                    <div className={`rounded-2xl p-5 mb-6 animate-slide-up ${scanStatus === 'success' ? 'bg-neon-green/10 border border-neon-green/30' :
                            scanStatus === 'already' ? 'bg-yellow-500/10 border border-yellow-500/30' :
                                'bg-red-500/10 border border-red-500/30'
                        }`}>
                        <div className="flex items-center gap-3">
                            {scanStatus === 'success' && <CheckCircle size={24} className="text-neon-green flex-shrink-0" />}
                            {scanStatus === 'already' && <AlertTriangle size={24} className="text-yellow-400 flex-shrink-0" />}
                            {scanStatus === 'error' && <XCircle size={24} className="text-red-400 flex-shrink-0" />}
                            <p className={`font-bold text-sm ${scanStatus === 'success' ? 'text-neon-green' :
                                    scanStatus === 'already' ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                {scanResult.message}
                            </p>
                        </div>
                    </div>
                )}

                {/* Team Details */}
                {teamDetails && (
                    <div className="glass rounded-2xl p-6 animate-fade-in">
                        <h3 className="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Users size={18} className="text-neon-green" /> Team Details
                        </h3>

                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <div className="bg-dark-700/50 rounded-xl p-3">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Team Name</p>
                                <p className="text-white font-bold text-sm">{teamDetails.team_name}</p>
                            </div>
                            <div className="bg-dark-700/50 rounded-xl p-3">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Game</p>
                                <p className="text-white font-bold text-sm">{teamDetails.game}</p>
                            </div>
                            <div className="bg-dark-700/50 rounded-xl p-3">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">College</p>
                                <p className="text-white text-sm">{teamDetails.college || '-'}</p>
                            </div>
                            <div className="bg-dark-700/50 rounded-xl p-3">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Team Code</p>
                                <p className="text-neon-green font-mono text-sm">{teamDetails.team_code}</p>
                            </div>
                            <div className="bg-dark-700/50 rounded-xl p-3">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Payment</p>
                                <p className={`text-sm font-bold ${teamDetails.payment_status === 'paid' ? 'text-neon-green' : 'text-red-400'}`}>
                                    {teamDetails.payment_status === 'paid' ? '✓ Paid' : 'Pending'}
                                </p>
                            </div>
                            <div className="bg-dark-700/50 rounded-xl p-3">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Check-in</p>
                                <p className={`text-sm font-bold ${teamDetails.checkin_status === 'checked-in' ? 'text-neon-green' : 'text-yellow-400'}`}>
                                    {teamDetails.checkin_status === 'checked-in' ? '✓ Checked In' : 'Pending'}
                                </p>
                            </div>
                        </div>

                        {/* Players List */}
                        {players.length > 0 && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Players ({players.length})</p>
                                <div className="space-y-1.5">
                                    {players.map((p, i) => (
                                        <div key={i} className="flex items-center justify-between bg-dark-700/50 rounded-lg px-3 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-neon-green/10 flex items-center justify-center text-neon-green text-xs font-bold">
                                                    {i + 1}
                                                </div>
                                                <span className="text-white text-sm">{p.name}</span>
                                            </div>
                                            <span className="text-gray-500 text-xs font-mono">{p.usn}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Scan Another */}
                        <button
                            onClick={resetScanner}
                            className="w-full mt-5 btn-secondary text-sm py-3"
                        >
                            Scan Another Team
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
