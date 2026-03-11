import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import GameDetails from './pages/GameDetails'
import Register from './pages/Register'
import RegistrationSuccess from './pages/RegistrationSuccess'
import TeamPage from './pages/TeamPage'
import TournamentBracket from './pages/TournamentBracket'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageGames from './pages/admin/ManageGames'
import ManageTeams from './pages/admin/ManageTeams'
import ManageTournament from './pages/admin/ManageTournament'
import ManagementDashboard from './pages/management/ManagementDashboard'
import ManagementTeams from './pages/management/ManagementTeams'
import ManagementMatches from './pages/management/ManagementMatches'
import MatchScoring from './pages/management/MatchScoring'
import QRScanner from './pages/management/QRScanner'
import ManagementLiveMonitor from './pages/management/ManagementLiveMonitor'
import MatchHistory from './pages/management/MatchHistory'
import LiveDashboard from './pages/LiveDashboard'

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-dark-900">
                <Navbar />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/game/:gameId" element={<GameDetails />} />
                    <Route path="/register/:gameId" element={<Register />} />
                    <Route path="/success/:teamId" element={<RegistrationSuccess />} />
                    <Route path="/team/:teamCode" element={<TeamPage />} />
                    <Route path="/bracket/:gameId" element={<TournamentBracket />} />
                    <Route path="/live" element={<LiveDashboard />} />
                    <Route path="/login" element={<Login />} />
                    {/* Admin Routes */}
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/games" element={<ManageGames />} />
                    <Route path="/admin/teams" element={<ManageTeams />} />
                    <Route path="/admin/tournament" element={<ManageTournament />} />
                    {/* Management Routes */}
                    <Route path="/management" element={<ManagementDashboard />} />
                    <Route path="/management/teams" element={<ManagementTeams />} />
                    <Route path="/management/matches" element={<ManagementMatches />} />
                    <Route path="/management/scoring" element={<MatchScoring />} />
                    <Route path="/management/scanner" element={<QRScanner />} />
                    <Route path="/management/live" element={<ManagementLiveMonitor />} />
                    <Route path="/management/history" element={<MatchHistory />} />
                </Routes>
            </div>
        </Router>
    )
}

export default App
