/**
 * Simple JSON file-based persistence for demo mode.
 * Data is saved to data.json in the backend directory.
 * Works when Firebase is not configured.
 */
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

const DEFAULT_DATA = {
    games: [
        { id: 'cricket', game_name: 'Cricket', team_size: 11, registration_fee: 200, team_limit: 10, registration_status: 'open', whatsapp_link: 'https://chat.whatsapp.com/cricket-group' },
        { id: 'football', game_name: 'Football', team_size: 7, registration_fee: 150, team_limit: 8, registration_status: 'open', whatsapp_link: 'https://chat.whatsapp.com/football-group' },
        { id: 'volleyball', game_name: 'Volleyball', team_size: 6, registration_fee: 120, team_limit: 12, registration_status: 'open', whatsapp_link: 'https://chat.whatsapp.com/volleyball-group' },
        { id: 'kabaddi', game_name: 'Kabaddi', team_size: 7, registration_fee: 150, team_limit: 10, registration_status: 'open', whatsapp_link: 'https://chat.whatsapp.com/kabaddi-group' },
        { id: 'chess', game_name: 'Chess', team_size: 2, registration_fee: 50, team_limit: 16, registration_status: 'open', whatsapp_link: 'https://chat.whatsapp.com/chess-group' },
        { id: 'badminton', game_name: 'Badminton', team_size: 2, registration_fee: 100, team_limit: 12, registration_status: 'open', whatsapp_link: 'https://chat.whatsapp.com/badminton-group' },
    ],
    teams: [],
    players: [],
    matches: [],
};

function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            const parsed = JSON.parse(raw);
            // Merge with defaults so new fields always exist
            return {
                games: parsed.games || DEFAULT_DATA.games,
                teams: parsed.teams || [],
                players: parsed.players || [],
                matches: parsed.matches || [],
            };
        }
    } catch (err) {
        console.warn('⚠️  Could not load data.json, using defaults:', err.message);
    }
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function saveData(store) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
    } catch (err) {
        console.warn('⚠️  Could not save data.json:', err.message);
    }
}

module.exports = { loadData, saveData, DEFAULT_DATA };
