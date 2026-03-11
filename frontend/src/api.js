const API_BASE = '/api';

export const api = {
    // Games
    getGames: () => fetch(`${API_BASE}/games`).then(r => r.json()),
    getGame: (id) => fetch(`${API_BASE}/games/${id}`).then(r => r.json()),
    updateGame: (id, data) => fetch(`${API_BASE}/games/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),

    // Teams
    getTeams: (gameId) => fetch(`${API_BASE}/teams${gameId ? `?gameId=${gameId}` : ''}`).then(r => r.json()),
    getTeam: (teamCode) => fetch(`${API_BASE}/teams/${teamCode}`).then(r => r.json()),
    registerTeam: (data) => fetch(`${API_BASE}/teams/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
    deleteTeam: (teamId) => fetch(`${API_BASE}/teams/${teamId}`, { method: 'DELETE' }).then(r => r.json()),

    // Players
    getPlayers: (teamId) => fetch(`${API_BASE}/players${teamId ? `?teamId=${teamId}` : ''}`).then(r => r.json()),
    checkUSN: (usn, gameId) => fetch(`${API_BASE}/players/check-usn?usn=${usn}&gameId=${gameId}`).then(r => r.json()),

    // Payment
    createOrder: (data) => fetch(`${API_BASE}/payment/create-order`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
    verifyPayment: (data) => fetch(`${API_BASE}/payment/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),

    // Check-in
    checkIn: (teamCode) => fetch(`${API_BASE}/checkin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teamCode }) }).then(r => r.json()),

    // Matches
    getMatches: (gameId) => fetch(`${API_BASE}/matches${gameId ? `?gameId=${gameId}` : ''}`).then(r => r.json()),
    generateMatches: (gameId) => fetch(`${API_BASE}/matches/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gameId }) }).then(r => r.json()),
    updateScore: (matchId, data) => fetch(`${API_BASE}/matches/${matchId}/score`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
    generateNextRound: (gameId) => fetch(`${API_BASE}/matches/next-round`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gameId }) }).then(r => r.json()),
    addMatch: (data) => fetch(`${API_BASE}/matches`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
    deleteMatch: (matchId) => fetch(`${API_BASE}/matches/${matchId}`, { method: 'DELETE' }).then(r => r.json()),

    // Dashboard
    getDashboardStats: () => fetch(`${API_BASE}/dashboard/stats`).then(r => r.json()),

    // Auth
    login: (credentials) => fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) }).then(r => r.json()),
};
