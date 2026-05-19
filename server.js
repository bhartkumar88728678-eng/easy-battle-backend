const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Sabhi static files (images, css, bundle) ko share karne ke liye
app.use(express.static(__dirname));

const DB_FILE = './db.json';

// Initialize Database structure
function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, tournaments: {}, settings: {}, games: {} }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ================= 🛠️ DIRECT HTML FILES ROUTING =================

// 1. User App Router (http://localhost:3000/ or http://localhost:3000/app)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. Admin Panel Router (http://localhost:3000/admin)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// =================================================================

// 🟢 BRANDING SETUP ROUTES
app.get('/api/get-settings', (req, res) => {
    const db = readDB();
    res.json(db.settings || { appName: "Easy Battle", appLogo: "" });
});

app.post('/api/admin/update-settings', (req, res) => {
    const { appName, appLogo } = req.body;
    const db = readDB();
    db.settings = { appName: appName || "Easy Battle", appLogo: appLogo || "" };
    writeDB(db);
    res.send("App settings updated successfully!");
});

// 🟢 AUTHENTICATION ENGINE
app.post('/api/user-auth', (req, res) => {
    const { name, email, password, referral, action } = req.body;
    const db = readDB();

    if (action === 'register') {
        if (db.users[email]) return res.status(400).send("User already exists!");
        db.users[email] = { name, email, password, referral, coins: 5.00, isBanned: false, winnings: 0 };
        writeDB(db);
        return res.send("User registered successfully!");
    }

    if (action === 'login') {
        const user = db.users[email];
        if (!user || user.password !== password) {
            return res.status(400).json({ success: false, message: "Invalid credentials!" });
        }
        return res.json({ success: true, user });
    }
});

// 🟢 DYNAMIC GAMES CATEGORIES
app.post('/api/admin/add-game', (req, res) => {
    const { gameName, gameImg } = req.body;
    if (!gameName || !gameImg) return res.status(400).send("Game Name and Image are required!");

    const db = readDB();
    if (!db.games) db.games = {};
    
    const gameId = 'game_' + Date.now();
    db.games[gameId] = { id: gameId, name: gameName, image: gameImg };
    writeDB(db);
    res.send("Game category added successfully!");
});

app.get('/api/get-games', (req, res) => {
    const db = readDB();
    res.json(db.games || {});
});

// 🟢 TOURNAMENTS CONTROLLER
app.post('/api/admin/add-tournament', (req, res) => {
    const { title, mode, time, entry_fee, prize, per_kill, image } = req.body;
    const db = readDB();
    
    const matchId = 'match_' + Date.now();
    db.tournaments[matchId] = {
        id: matchId, title, mode, time,
        entry_fee: parseFloat(entry_fee || 0),
        prize: parseFloat(prize || 0),
        per_kill: parseFloat(per_kill || 0),
        image: image || 'https://i.imgur.com/EuxYgqA.png'
    };
    writeDB(db);
    res.send("Tournament created successfully!");
});

app.get('/api/get-tournaments', (req, res) => {
    const db = readDB();
    res.json(db.tournaments || {});
});

app.post('/api/join-tournament', (req, res) => {
    const { email, match_id } = req.body;
    const db = readDB();
    
    const user = db.users[email];
    const match = db.tournaments[match_id];
    
    if (!user || !match) return res.status(400).send("Invalid request data.");
    if (user.coins < match.entry_fee) return res.status(400).send("Low Balance!");

    user.coins -= match.entry_fee;
    writeDB(db);
    res.send("Joined match");
});

// 🟢 WALLET DEPOSITS & LEADERBOARD
app.post('/api/wallet/deposit-request', (req, res) => {
    res.send("Request submitted to Admin for verification!");
});

app.get('/api/get-leaderboard', (req, res) => {
    const db = readDB();
    const list = Object.values(db.users).map(u => ({ name: u.name, email: u.email, winnings: u.winnings || 0 }));
    list.sort((a,b) => b.winnings - a.winnings);
    res.json(list.slice(0, 20));
});

app.listen(PORT, () => console.log(`Gaming Backend running on http://127.0.0.1:${PORT}`));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
