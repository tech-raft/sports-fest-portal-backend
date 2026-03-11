require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeFirebase, getDb } = require('./firebase');
const { v4: uuidv4 } = require('uuid');
const { loadData, saveData } = require('./store');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase
initializeFirebase();

// ============================================================
// PERSISTENT STORAGE (JSON file fallback when Firebase not configured)
// ============================================================
const memoryStore = loadData();

// Helper: get storage (Firestore or memory)
const useFirestore = () => !!getDb();

// Auto-save: persist data to JSON file after every write request
app.use((req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (data) => {
        if (['POST', 'PUT', 'DELETE'].includes(req.method) && !useFirestore()) {
            saveData(memoryStore);
        }
        return originalJson(data);
    };
    next();
});

// ============================================================
// GAME CODE GENERATOR
// ============================================================
const GAME_CODES = {
    cricket: 'CRK', football: 'FTB', volleyball: 'VLB',
    kabaddi: 'KBD', chess: 'CHS', badminton: 'BDM',
};

function generateTeamCode(gameId, teamNumber) {
    const code = GAME_CODES[gameId] || gameId.substring(0, 3).toUpperCase();
    const year = new Date().getFullYear();
    const num = String(teamNumber).padStart(3, '0');
    return `${code}-${year}-${num}`;
}

// ============================================================
// ROUTES: AUTH
// ============================================================
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (username === (process.env.ADMIN_USERNAME || 'admin') && password === (process.env.ADMIN_PASSWORD || 'admin123')) {
        return res.json({ user: { username, role: 'admin' } });
    }
    if (username === (process.env.MANAGEMENT_USERNAME || 'management') && password === (process.env.MANAGEMENT_PASSWORD || 'manage123')) {
        return res.json({ user: { username, role: 'management' } });
    }
    return res.json({ error: 'Invalid credentials' });
});

// ============================================================
// ROUTES: GAMES
// ============================================================
app.get('/api/games', async (req, res) => {
    try {
        if (useFirestore()) {
            const snapshot = await getDb().collection('games').get();
            const games = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Calculate registered_teams count
            for (const game of games) {
                const teamsSnap = await getDb().collection('teams').where('game_id', '==', game.id).where('payment_status', '==', 'paid').get();
                game.registered_teams = teamsSnap.size;
            }
            return res.json(games);
        }
        // Memory fallback
        const games = memoryStore.games.map(g => ({
            ...g,
            registered_teams: memoryStore.teams.filter(t => t.game_id === g.id && t.payment_status === 'paid').length,
        }));
        return res.json(games);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/games/:id', async (req, res) => {
    try {
        if (useFirestore()) {
            const doc = await getDb().collection('games').doc(req.params.id).get();
            if (!doc.exists) return res.status(404).json({ error: 'Game not found' });
            return res.json({ id: doc.id, ...doc.data() });
        }
        const game = memoryStore.games.find(g => g.id === req.params.id);
        return game ? res.json(game) : res.status(404).json({ error: 'Game not found' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/games/:id', async (req, res) => {
    try {
        const { id, ...updates } = req.body;

        if (useFirestore()) {
            await getDb().collection('games').doc(req.params.id).update(updates);
            return res.json({ success: true });
        }
        const idx = memoryStore.games.findIndex(g => g.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'Game not found' });
        memoryStore.games[idx] = { ...memoryStore.games[idx], ...updates };
        return res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/games', async (req, res) => {
    try {
        const gameData = req.body;
        // Basic slugification for ID
        const newId = gameData.game_name.toLowerCase().replace(/[^a-z0-9]/g, '-');

        if (useFirestore()) {
            await getDb().collection('games').doc(newId).set({ ...gameData, id: newId });
            return res.json({ success: true, id: newId });
        }

        memoryStore.games.push({ ...gameData, id: newId });
        return res.json({ success: true, id: newId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/games/:id', async (req, res) => {
    try {
        if (useFirestore()) {
            await getDb().collection('games').doc(req.params.id).delete();
            return res.json({ success: true });
        }

        memoryStore.games = memoryStore.games.filter(g => g.id !== req.params.id);
        return res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// ROUTES: TEAMS
// ============================================================
app.get('/api/teams', async (req, res) => {
    try {
        const gameId = req.query.gameId;
        if (useFirestore()) {
            let query = getDb().collection('teams');
            if (gameId) query = query.where('game_id', '==', gameId);
            const snapshot = await query.get();
            const teams = snapshot.docs.map(doc => ({ team_id: doc.id, ...doc.data() }));

            // Attach player counts
            for (const team of teams) {
                const pSnap = await getDb().collection('players').where('team_id', '==', team.team_id).get();
                team.player_count = pSnap.size;
            }
            return res.json(teams);
        }
        let teams = memoryStore.teams;
        if (gameId) teams = teams.filter(t => t.game_id === gameId);

        const teamsWithPlayers = teams.map(t => ({
            ...t,
            player_count: memoryStore.players.filter(p => p.team_id === t.team_id).length
        }));

        return res.json(teamsWithPlayers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/teams/:teamId', async (req, res) => {
    try {
        const { teamId } = req.params;
        const updates = req.body; // e.g., { team_name, college, game_id, game }

        if (useFirestore()) {
            await getDb().collection('teams').doc(teamId).update(updates);

            // If game or team name changes, we also need to update player records
            if (updates.game_id || updates.team_name || updates.game) {
                const pSnap = await getDb().collection('players').where('team_id', '==', teamId).get();
                const batch = getDb().batch();
                pSnap.docs.forEach(doc => {
                    batch.update(doc.ref, {
                        game_id: updates.game_id || doc.data().game_id,
                        game: updates.game || doc.data().game,
                        team_name: updates.team_name || doc.data().team_name
                    });
                });
                await batch.commit();
            }

            return res.json({ success: true });
        }

        // Memory fallback
        const idx = memoryStore.teams.findIndex(t => t.team_id === teamId);
        if (idx === -1) return res.status(404).json({ error: 'Team not found' });

        memoryStore.teams[idx] = { ...memoryStore.teams[idx], ...updates };

        if (updates.game_id || updates.team_name || updates.game) {
            memoryStore.players = memoryStore.players.map(p => {
                if (p.team_id === teamId) {
                    return {
                        ...p,
                        game_id: updates.game_id || p.game_id,
                        game: updates.game || p.game,
                        team_name: updates.team_name || p.team_name
                    };
                }
                return p;
            });
        }

        return res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/teams/:teamCode', async (req, res) => {
    try {
        const teamCode = req.params.teamCode;
        if (useFirestore()) {
            const snapshot = await getDb().collection('teams').where('team_code', '==', teamCode).limit(1).get();
            if (snapshot.empty) {
                // Try as team_id
                const doc = await getDb().collection('teams').doc(teamCode).get();
                if (!doc.exists) return res.status(404).json({ error: 'Team not found' });
                return res.json({ team_id: doc.id, ...doc.data() });
            }
            const doc = snapshot.docs[0];
            return res.json({ team_id: doc.id, ...doc.data() });
        }
        const team = memoryStore.teams.find(t => t.team_code === teamCode || t.team_id === teamCode);
        return team ? res.json(team) : res.status(404).json({ error: 'Team not found' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/teams/register', async (req, res) => {
    try {
        const { teamName, college, gameId, gameName, players, freeRegistration } = req.body;

        // Check game status and limits
        let game;
        if (useFirestore()) {
            const gameDoc = await getDb().collection('games').doc(gameId).get();
            game = gameDoc.exists ? { id: gameDoc.id, ...gameDoc.data() } : null;
        } else {
            game = memoryStore.games.find(g => g.id === gameId);
        }

        if (!game) return res.json({ error: 'Game not found' });
        if (game.registration_status !== 'open') return res.json({ error: 'Registration Closed' });

        // Count existing teams
        let existingTeamCount;
        if (useFirestore()) {
            const existingSnap = await getDb().collection('teams').where('game_id', '==', gameId).where('payment_status', '==', 'paid').get();
            existingTeamCount = existingSnap.size;
        } else {
            existingTeamCount = memoryStore.teams.filter(t => t.game_id === gameId && t.payment_status === 'paid').length;
        }

        if (existingTeamCount >= game.team_limit) {
            return res.json({ error: `Team limit reached for ${gameName}. Maximum ${game.team_limit} teams allowed.` });
        }

        // Check duplicate team name
        let duplicateTeam;
        if (useFirestore()) {
            const dupSnap = await getDb().collection('teams').where('game_id', '==', gameId).where('team_name', '==', teamName).get();
            duplicateTeam = !dupSnap.empty;
        } else {
            duplicateTeam = memoryStore.teams.some(t => t.game_id === gameId && t.team_name === teamName);
        }

        if (duplicateTeam) return res.json({ error: 'Team already registered.' });

        // Check duplicate USN
        for (const player of players) {
            let usnExists;
            if (useFirestore()) {
                const usnSnap = await getDb().collection('players').where('game_id', '==', gameId).where('usn', '==', player.usn).get();
                usnExists = !usnSnap.empty;
            } else {
                usnExists = memoryStore.players.some(p => p.game_id === gameId && p.usn === player.usn);
            }
            if (usnExists) {
                return res.json({ error: `This player is already registered in another team. (USN: ${player.usn})` });
            }
        }

        // Create team (payment pending)
        const teamId = uuidv4();
        const teamNumber = existingTeamCount + 1;
        const teamCode = generateTeamCode(gameId, teamNumber);

        const teamData = {
            team_name: teamName,
            college,
            game: gameName,
            game_id: gameId,
            team_code: teamCode,
            payment_status: freeRegistration ? 'paid' : 'pending',
            checkin_status: 'pending',
            created_at: new Date().toISOString(),
        };

        if (useFirestore()) {
            await getDb().collection('teams').doc(teamId).set(teamData);
            // Save players
            for (const player of players) {
                await getDb().collection('players').add({
                    team_id: teamId,
                    team_name: teamName,
                    game: gameName,
                    game_id: gameId,
                    name: player.name,
                    usn: player.usn,
                });
            }
        } else {
            memoryStore.teams.push({ team_id: teamId, ...teamData });
            for (const player of players) {
                memoryStore.players.push({
                    player_id: uuidv4(),
                    team_id: teamId,
                    team_name: teamName,
                    game: gameName,
                    game_id: gameId,
                    name: player.name,
                    usn: player.usn,
                });
            }
        }

        return res.json({ success: true, teamId, teamCode });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/teams/:teamId', async (req, res) => {
    try {
        if (useFirestore()) {
            await getDb().collection('teams').doc(req.params.teamId).delete();
            // Delete associated players
            const playerSnap = await getDb().collection('players').where('team_id', '==', req.params.teamId).get();
            const batch = getDb().batch();
            playerSnap.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        } else {
            memoryStore.teams = memoryStore.teams.filter(t => t.team_id !== req.params.teamId);
            memoryStore.players = memoryStore.players.filter(p => p.team_id !== req.params.teamId);
        }
        return res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/teams/:teamId', async (req, res) => {
    try {
        const { teamId } = req.params;

        if (useFirestore()) {
            // 1. Delete all players belonging to this team
            const pSnap = await getDb().collection('players').where('team_id', '==', teamId).get();
            const batch = getDb().batch();
            pSnap.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();

            // 2. Delete the team itself
            await getDb().collection('teams').doc(teamId).delete();

            return res.json({ success: true });
        }

        // Memory fallback
        const teamExists = memoryStore.teams.some(t => t.team_id === teamId);
        if (!teamExists) return res.status(404).json({ error: 'Team not found' });

        memoryStore.teams = memoryStore.teams.filter(t => t.team_id !== teamId);
        memoryStore.players = memoryStore.players.filter(p => p.team_id !== teamId);

        return res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// ROUTES: PLAYERS
// ============================================================
app.get('/api/players', async (req, res) => {
    try {
        const teamId = req.query.teamId;
        if (useFirestore()) {
            let query = getDb().collection('players');
            if (teamId) query = query.where('team_id', '==', teamId);
            const snapshot = await query.get();
            return res.json(snapshot.docs.map(doc => ({ player_id: doc.id, ...doc.data() })));
        }
        let players = memoryStore.players;
        if (teamId) players = players.filter(p => p.team_id === teamId);
        return res.json(players);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/players/:playerId', async (req, res) => {
    try {
        const updates = req.body;

        if (useFirestore()) {
            await getDb().collection('players').doc(req.params.playerId).update(updates);
            return res.json({ success: true });
        }

        const idx = memoryStore.players.findIndex(p => p.player_id === req.params.playerId);
        if (idx === -1) return res.status(404).json({ error: 'Player not found' });
        memoryStore.players[idx] = { ...memoryStore.players[idx], ...updates };
        return res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/players/:playerId', async (req, res) => {
    try {
        if (useFirestore()) {
            await getDb().collection('players').doc(req.params.playerId).delete();
            return res.json({ success: true });
        }

        memoryStore.players = memoryStore.players.filter(p => p.player_id !== req.params.playerId);
        return res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/players/check-usn', async (req, res) => {
    try {
        const { usn, gameId } = req.query;
        let exists;
        if (useFirestore()) {
            const snap = await getDb().collection('players').where('game_id', '==', gameId).where('usn', '==', usn).get();
            exists = !snap.empty;
        } else {
            exists = memoryStore.players.some(p => p.game_id === gameId && p.usn === usn);
        }
        return res.json({ exists });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// ROUTES: PAYMENT (Razorpay)
// ============================================================
let razorpayInstance;
try {
    const Razorpay = require('razorpay');
    if (process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('your_')) {
        razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        console.log('✅ Razorpay connected');
    }
} catch {
    console.warn('⚠️  Razorpay not configured');
}

app.post('/api/payment/create-order', async (req, res) => {
    try {
        const { amount, teamId, gameName } = req.body;

        if (razorpayInstance) {
            const order = await razorpayInstance.orders.create({
                amount: amount * 100,
                currency: 'INR',
                receipt: `${teamId}_${Date.now()}`,
                notes: { teamId, gameName },
            });
            return res.json({
                orderId: order.id,
                amount: order.amount,
                razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            });
        }

        // Demo mode: simulate payment
        return res.json({
            orderId: `demo_order_${Date.now()}`,
            amount: amount * 100,
            razorpayKeyId: 'rzp_test_demo',
            demo: true,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/payment/verify', async (req, res) => {
    try {
        const { teamId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (razorpayInstance && razorpay_signature) {
            const crypto = require('crypto');
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest('hex');

            if (expectedSignature !== razorpay_signature) {
                return res.json({ error: 'Payment verification failed' });
            }
        }

        // Mark team as paid
        if (useFirestore()) {
            await getDb().collection('teams').doc(teamId).update({ payment_status: 'paid' });
        } else {
            const team = memoryStore.teams.find(t => t.team_id === teamId);
            if (team) team.payment_status = 'paid';
        }

        // Auto-close registration if limit is reached
        let team;
        if (useFirestore()) {
            const teamDoc = await getDb().collection('teams').doc(teamId).get();
            team = teamDoc.data();
        } else {
            team = memoryStore.teams.find(t => t.team_id === teamId);
        }

        if (team) {
            let paidCount;
            if (useFirestore()) {
                const paidSnap = await getDb().collection('teams').where('game_id', '==', team.game_id).where('payment_status', '==', 'paid').get();
                paidCount = paidSnap.size;
            } else {
                paidCount = memoryStore.teams.filter(t => t.game_id === team.game_id && t.payment_status === 'paid').length;
            }

            let game;
            if (useFirestore()) {
                const gameDoc = await getDb().collection('games').doc(team.game_id).get();
                game = gameDoc.data();
            } else {
                game = memoryStore.games.find(g => g.id === team.game_id);
            }

            if (game && paidCount >= game.team_limit) {
                if (useFirestore()) {
                    await getDb().collection('games').doc(team.game_id).update({ registration_status: 'closed' });
                } else {
                    game.registration_status = 'closed';
                }
            }
        }

        return res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// ROUTES: CHECK-IN
// ============================================================
app.post('/api/checkin', async (req, res) => {
    try {
        const { teamCode } = req.body;

        let team, teamId;
        if (useFirestore()) {
            const snap = await getDb().collection('teams').where('team_code', '==', teamCode).limit(1).get();
            if (snap.empty) return res.json({ error: 'Team not found' });
            teamId = snap.docs[0].id;
            team = snap.docs[0].data();
        } else {
            team = memoryStore.teams.find(t => t.team_code === teamCode);
            if (!team) return res.json({ error: 'Team not found' });
            teamId = team.team_id;
        }

        if (team.checkin_status === 'checked-in') {
            return res.json({ error: 'Team already checked in.', team: { ...team, team_id: teamId } });
        }

        if (useFirestore()) {
            await getDb().collection('teams').doc(teamId).update({ checkin_status: 'checked-in' });
        } else {
            team.checkin_status = 'checked-in';
        }

        return res.json({ success: true, team: { ...team, checkin_status: 'checked-in', team_id: teamId } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// ROUTES: MATCHES
// ============================================================
app.get('/api/matches', async (req, res) => {
    try {
        const gameId = req.query.gameId;
        if (useFirestore()) {
            let query = getDb().collection('matches');
            if (gameId) query = query.where('game_id', '==', gameId);
            const snapshot = await query.orderBy('round').orderBy('match_number').get();
            return res.json(snapshot.docs.map(doc => ({ match_id: doc.id, ...doc.data() })));
        }
        let matches = memoryStore.matches;
        if (gameId) matches = matches.filter(m => m.game_id === gameId);
        return res.json(matches.sort((a, b) => a.round - b.round || a.match_number - b.match_number));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/matches/generate', async (req, res) => {
    try {
        const { gameId } = req.body;

        // Get registered teams
        let teams;
        if (useFirestore()) {
            const snap = await getDb().collection('teams').where('game_id', '==', gameId).where('payment_status', '==', 'paid').get();
            teams = snap.docs.map(doc => ({ team_id: doc.id, ...doc.data() }));
        } else {
            teams = memoryStore.teams.filter(t => t.game_id === gameId && t.payment_status === 'paid');
        }

        if (teams.length < 2) return res.json({ error: 'Need at least 2 teams to generate matches' });

        // Shuffle teams
        const shuffled = [...teams].sort(() => Math.random() - 0.5);
        const matches = [];

        for (let i = 0; i < shuffled.length; i += 2) {
            const team1 = shuffled[i];
            const team2 = shuffled[i + 1] || null;

            const matchData = {
                game_id: gameId,
                game: team1.game,
                round: 1,
                match_number: Math.floor(i / 2) + 1,
                team_1: team1.team_name,
                team_2: team2 ? team2.team_name : 'BYE',
                team_1_score: null,
                team_2_score: null,
                winner: team2 ? null : team1.team_name, // Auto-win for BYE
                match_status: team2 ? 'pending' : 'completed',
            };

            if (useFirestore()) {
                const ref = await getDb().collection('matches').add(matchData);
                matches.push({ match_id: ref.id, ...matchData });
            } else {
                const matchId = uuidv4();
                memoryStore.matches.push({ match_id: matchId, ...matchData });
                matches.push({ match_id: matchId, ...matchData });
            }
        }

        return res.json({ success: true, matches });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a single match manually
app.post('/api/matches', async (req, res) => {
    try {
        const { gameId, game, round, team_1, team_2 } = req.body;
        if (!gameId || !team_1 || !team_2) return res.json({ error: 'Missing required fields' });

        // Count existing matches in this round for match_number
        let existingCount;
        if (useFirestore()) {
            const snap = await getDb().collection('matches').where('game_id', '==', gameId).where('round', '==', round).get();
            existingCount = snap.size;
        } else {
            existingCount = memoryStore.matches.filter(m => m.game_id === gameId && m.round === round).length;
        }

        const matchData = {
            game_id: gameId,
            game: game || '',
            round: round || 1,
            match_number: existingCount + 1,
            team_1,
            team_2,
            team_1_score: null,
            team_2_score: null,
            winner: team_2 === 'BYE' ? team_1 : null,
            match_status: team_2 === 'BYE' ? 'completed' : 'pending',
        };

        if (useFirestore()) {
            const ref = await getDb().collection('matches').add(matchData);
            return res.json({ success: true, match: { match_id: ref.id, ...matchData } });
        } else {
            const matchId = uuidv4();
            memoryStore.matches.push({ match_id: matchId, ...matchData });
            return res.json({ success: true, match: { match_id: matchId, ...matchData } });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a match
app.delete('/api/matches/:matchId', async (req, res) => {
    try {
        const matchId = req.params.matchId;
        if (useFirestore()) {
            await getDb().collection('matches').doc(matchId).delete();
        } else {
            memoryStore.matches = memoryStore.matches.filter(m => m.match_id !== matchId);
        }
        return res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/matches/:matchId/score', async (req, res) => {
    try {
        const { team_1_score, team_2_score, winner } = req.body;
        const matchId = req.params.matchId;

        const updates = {
            team_1_score,
            team_2_score,
            winner,
            match_status: 'completed',
        };

        if (useFirestore()) {
            await getDb().collection('matches').doc(matchId).update(updates);
        } else {
            const match = memoryStore.matches.find(m => m.match_id === matchId);
            if (match) Object.assign(match, updates);
        }

        return res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/matches/next-round', async (req, res) => {
    try {
        const { gameId } = req.body;

        // Get all matches for this game
        let allMatches;
        if (useFirestore()) {
            const snap = await getDb().collection('matches').where('game_id', '==', gameId).get();
            allMatches = snap.docs.map(doc => ({ match_id: doc.id, ...doc.data() }));
        } else {
            allMatches = memoryStore.matches.filter(m => m.game_id === gameId);
        }

        // Find the latest round
        const maxRound = Math.max(...allMatches.map(m => m.round));
        const currentRoundMatches = allMatches.filter(m => m.round === maxRound);

        // Check if all current round matches are completed
        const allCompleted = currentRoundMatches.every(m => m.match_status === 'completed' && m.winner);
        if (!allCompleted) return res.json({ error: 'Complete all current round matches first' });

        // Get winners
        const winners = currentRoundMatches.map(m => m.winner).filter(Boolean);
        if (winners.length < 2) return res.json({ error: 'Tournament complete! Champion: ' + (winners[0] || 'TBD') });

        // Generate next round
        const nextRound = maxRound + 1;
        const newMatches = [];

        for (let i = 0; i < winners.length; i += 2) {
            const team1 = winners[i];
            const team2 = winners[i + 1] || null;

            const gameName = currentRoundMatches[0]?.game || '';
            const matchData = {
                game_id: gameId,
                game: gameName,
                round: nextRound,
                match_number: Math.floor(i / 2) + 1,
                team_1: team1,
                team_2: team2 || 'BYE',
                team_1_score: null,
                team_2_score: null,
                winner: team2 ? null : team1,
                match_status: team2 ? 'pending' : 'completed',
            };

            if (useFirestore()) {
                const ref = await getDb().collection('matches').add(matchData);
                newMatches.push({ match_id: ref.id, ...matchData });
            } else {
                const matchId = uuidv4();
                memoryStore.matches.push({ match_id: matchId, ...matchData });
                newMatches.push({ match_id: matchId, ...matchData });
            }
        }

        return res.json({ success: true, matches: newMatches, round: nextRound });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// ROUTES: DASHBOARD STATS
// ============================================================
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        let totalTeams, totalPlayers, totalRevenue, teamsPerSport;

        if (useFirestore()) {
            const teamsSnap = await getDb().collection('teams').where('payment_status', '==', 'paid').get();
            totalTeams = teamsSnap.size;
            const playersSnap = await getDb().collection('players').get();
            totalPlayers = playersSnap.size;

            // Revenue
            teamsPerSport = {};
            totalRevenue = 0;
            const gamesSnap = await getDb().collection('games').get();
            const gamesMap = {};
            gamesSnap.docs.forEach(doc => {
                gamesMap[doc.id] = doc.data();
            });

            teamsSnap.docs.forEach(doc => {
                const team = doc.data();
                const game = gamesMap[team.game_id];
                if (game) {
                    totalRevenue += game.registration_fee || 0;
                    teamsPerSport[team.game] = (teamsPerSport[team.game] || 0) + 1;
                }
            });
        } else {
            const paidTeams = memoryStore.teams.filter(t => t.payment_status === 'paid');
            totalTeams = paidTeams.length;
            totalPlayers = memoryStore.players.length;
            teamsPerSport = {};
            totalRevenue = 0;

            paidTeams.forEach(team => {
                const game = memoryStore.games.find(g => g.id === team.game_id);
                if (game) totalRevenue += game.registration_fee;
                teamsPerSport[team.game] = (teamsPerSport[team.game] || 0) + 1;
            });
        }

        return res.json({ totalTeams, totalPlayers, totalRevenue, teamsPerSport, checkedIn: useFirestore() ? 0 : memoryStore.teams.filter(t => t.checked_in).length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// SEED GAMES (initialize Firestore with game data)
// ============================================================
app.post('/api/seed', async (req, res) => {
    try {
        if (!useFirestore()) return res.json({ message: 'Using in-memory storage, no seeding needed' });

        for (const game of memoryStore.games) {
            await getDb().collection('games').doc(game.id).set(game);
        }
        return res.json({ success: true, message: 'Games seeded to Firestore' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// SERVE FRONTEND (production build)
// ============================================================
const frontendBuild = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendBuild));
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(frontendBuild, 'index.html'));
    }
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`\n🏆 Sports Fest API running on http://localhost:${PORT}`);
    console.log(`📋 ${useFirestore() ? 'Firestore' : 'JSON File'} storage active`);
    console.log(`💳 Razorpay ${razorpayInstance ? 'connected' : 'demo mode'}\n`);
});
