import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Download, MessageCircle, CheckCircle, Trophy, Users } from 'lucide-react'
import { saveAs } from 'file-saver'
import { api } from '../api'

const WHATSAPP_LINKS = {
    cricket: 'https://chat.whatsapp.com/cricket-group-invite',
    football: 'https://chat.whatsapp.com/football-group-invite',
    volleyball: 'https://chat.whatsapp.com/volleyball-group-invite',
    kabaddi: 'https://chat.whatsapp.com/kabaddi-group-invite',
    chess: 'https://chat.whatsapp.com/chess-group-invite',
    badminton: 'https://chat.whatsapp.com/badminton-group-invite',
}

export default function RegistrationSuccess() {
    const { teamId } = useParams()
    const [team, setTeam] = useState(null)
    const [downloading, setDownloading] = useState(false)
    const ticketRef = useRef(null)

    useEffect(() => {
        api.getTeam(teamId)
            .then(data => {
                if (data && !data.error) setTeam(data)
                else setTeam({
                    team_name: 'Demo Team',
                    game: 'Cricket',
                    game_id: 'cricket',
                    team_code: 'CRK-2026-001',
                    college: 'AIT Mangalore',
                })
            })
            .catch(() => {
                setTeam({
                    team_name: 'Demo Team',
                    game: 'Cricket',
                    game_id: 'cricket',
                    team_code: 'CRK-2026-001',
                    college: 'AIT Mangalore',
                })
            })
    }, [teamId])

    const downloadTicket = async () => {
        setDownloading(true)
        try {
            const canvas = document.createElement('canvas')
            canvas.width = 800
            canvas.height = 1000
            const ctx = canvas.getContext('2d')

            // Background
            ctx.fillStyle = '#0A0A0F'
            ctx.fillRect(0, 0, 800, 1000)

            // Border
            ctx.strokeStyle = '#39FF14'
            ctx.lineWidth = 3
            ctx.strokeRect(30, 30, 740, 940)

            // Header bar
            ctx.fillStyle = 'rgba(57, 255, 20, 0.08)'
            ctx.fillRect(30, 30, 740, 70)

            // Title
            ctx.fillStyle = '#39FF14'
            ctx.font = 'bold 24px Arial, sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText('COLLEGE SPORTS FEST 2026', 400, 75)

            // Divider
            ctx.strokeStyle = 'rgba(255,255,255,0.15)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(80, 110)
            ctx.lineTo(720, 110)
            ctx.stroke()

            // ENTRY TICKET label
            ctx.fillStyle = '#666666'
            ctx.font = '14px Arial, sans-serif'
            ctx.fillText('ENTRY TICKET', 400, 140)

            // Team Name
            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 32px Arial, sans-serif'
            ctx.fillText(team?.team_name || 'Team', 400, 185)

            // Game | College
            ctx.fillStyle = '#999999'
            ctx.font = '18px Arial, sans-serif'
            ctx.fillText((team?.game || '') + '  |  ' + (team?.college || ''), 400, 220)

            // QR Code - render SVG to image
            const svgEl = document.getElementById('qr-code-svg')
            if (svgEl) {
                const svgStr = new XMLSerializer().serializeToString(svgEl)
                const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
                const svgUrl = URL.createObjectURL(svgBlob)

                await new Promise((resolve) => {
                    const img = new Image()
                    img.onload = () => {
                        // White background for QR
                        ctx.fillStyle = '#ffffff'
                        ctx.fillRect(225, 260, 350, 350)
                        ctx.drawImage(img, 250, 285, 300, 300)
                        URL.revokeObjectURL(svgUrl)
                        resolve()
                    }
                    img.onerror = () => {
                        URL.revokeObjectURL(svgUrl)
                        resolve()
                    }
                    img.src = svgUrl
                })
            }

            // Team Code
            ctx.fillStyle = '#39FF14'
            ctx.font = 'bold 36px Courier, monospace'
            ctx.textAlign = 'center'
            ctx.fillText(team?.team_code || '', 400, 660)

            // Dashed divider
            ctx.strokeStyle = 'rgba(255,255,255,0.15)'
            ctx.setLineDash([6, 4])
            ctx.beginPath()
            ctx.moveTo(80, 700)
            ctx.lineTo(720, 700)
            ctx.stroke()
            ctx.setLineDash([])

            // Instructions
            ctx.fillStyle = '#888888'
            ctx.font = '14px Arial, sans-serif'
            ctx.fillText('Show this QR code at the venue for check-in', 400, 740)
            ctx.fillStyle = '#666666'
            ctx.font = '12px Arial, sans-serif'
            ctx.fillText('Keep this ticket safe - it is your entry pass', 400, 770)

            // Footer
            ctx.fillStyle = 'rgba(57, 255, 20, 0.05)'
            ctx.fillRect(30, 900, 740, 70)
            ctx.fillStyle = '#555555'
            ctx.font = '12px Arial, sans-serif'
            ctx.fillText('sportsfest2026.vercel.app', 400, 942)

            // Download via file-saver for robust cross-browser filename support
            const fileName = (team?.team_code || 'ticket').replace(/[^a-zA-Z0-9-_]/g, '') + '_ticket.png'
            canvas.toBlob(function (blob) {
                if (!blob) return
                saveAs(blob, fileName)
            }, 'image/png')
        } catch (err) {
            console.error('Download failed:', err)
        }
        setDownloading(false)
    }

    if (!team) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-20 pb-16">
            <div className="max-w-lg mx-auto px-4 sm:px-6 text-center">
                {/* Success Header */}
                <div className="mb-8 animate-slide-up">
                    <div className="w-20 h-20 mx-auto rounded-full bg-neon-green/10 border-2 border-neon-green flex items-center justify-center mb-4">
                        <CheckCircle size={40} className="text-neon-green" />
                    </div>
                    <h1 className="font-display text-3xl font-bold text-white mb-2">Registration Successful!</h1>
                    <p className="text-gray-400">Your team has been registered. Here's your ticket.</p>
                </div>

                {/* Ticket Card */}
                <div ref={ticketRef} className="glass rounded-2xl p-6 sm:p-8 mb-6 neon-border animate-fade-in">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Trophy size={20} className="text-neon-yellow" />
                        <span className="text-neon-yellow font-bold text-sm">COLLEGE SPORTS FEST 2026</span>
                    </div>

                    <h2 className="font-display text-2xl font-bold text-white mb-1">{team.team_name}</h2>
                    <p className="text-gray-400 mb-6 flex items-center justify-center gap-2">
                        <Users size={14} />
                        {team.game} • {team.college}
                    </p>

                    <div className="bg-white p-6 rounded-xl inline-block mb-4">
                        <QRCodeSVG
                            id="qr-code-svg"
                            value={team.team_code}
                            size={200}
                            bgColor="#ffffff"
                            fgColor="#000000"
                            level="H"
                            includeMargin={false}
                        />
                    </div>

                    <div className="bg-dark-700 rounded-xl py-3 px-6 inline-block">
                        <p className="text-xs text-gray-500 mb-1">Team Code</p>
                        <p className="text-2xl font-mono font-bold text-neon-green tracking-wider">{team.team_code}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 animate-slide-up">
                    <button
                        onClick={downloadTicket}
                        disabled={downloading}
                        className="w-full btn-primary flex items-center justify-center gap-2 py-4 rounded-2xl disabled:opacity-50"
                    >
                        {downloading ? (
                            <><div className="animate-spin w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full" /> Generating...</>
                        ) : (
                            <><Download size={20} /> Download QR Ticket</>
                        )}
                    </button>

                    <a
                        href={WHATSAPP_LINKS[team.game_id] || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full btn-secondary flex items-center justify-center gap-2 py-4 rounded-2xl"
                    >
                        <MessageCircle size={20} />
                        Join WhatsApp Group
                    </a>

                    <Link
                        to={`/team/${team.team_code}`}
                        className="block w-full text-center py-3 text-gray-400 hover:text-neon-green transition-colors text-sm"
                    >
                        View Team Page →
                    </Link>
                </div>
            </div>
        </div>
    )
}
