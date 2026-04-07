const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./src/routes/api');
const errorHandler = require('./src/middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// ─── Middleware ──────────────────────────────────────────────
app.use(cors({
    origin: '*',
    methods: ['GET'],
    optionsSuccessStatus: 200
}));
app.use(express.json());

// ─── Request Logger ──────────────────────────────────────────
app.use((req, _res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    next();
});

// ─── Health Check ────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'Liên Quân Mobile API',
        version: API_VERSION,
        uptime: `${Math.floor(process.uptime())}s`,
        timestamp: new Date().toISOString()
    });
});

// ─── API Root Info ───────────────────────────────────────────
app.get('/', (_req, res) => {
    res.json({
        name: 'Liên Quân Mobile API',
        version: API_VERSION,
        description: 'API cung cấp dữ liệu game Liên Quân Mobile',
        endpoints: {
            health: '/health',
            heroes: `/api/${API_VERSION}/heroes`,
            equipments: `/api/${API_VERSION}/equipments`,
            badges: `/api/${API_VERSION}/badges`,
            runes: `/api/${API_VERSION}/runes`,
            gamemodes: `/api/${API_VERSION}/gamemodes`,
            spells: `/api/${API_VERSION}/spells`
        },
        documentation: 'https://github.com/yourusername/lienquan-api'
    });
});

// ─── API Routes ──────────────────────────────────────────────
app.use(`/api/${API_VERSION}`, apiRoutes);

// ─── 404 Handler ─────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint không tồn tại',
        availableEndpoints: [
            'GET /health',
            'GET /',
            `GET /api/${API_VERSION}/heroes`,
            `GET /api/${API_VERSION}/heroes/:id`,
            `GET /api/${API_VERSION}/heroes/search/:name`,
            `GET /api/${API_VERSION}/equipments`,
            `GET /api/${API_VERSION}/equipments/:id`,
            `GET /api/${API_VERSION}/equipments/search/:name`,
            `GET /api/${API_VERSION}/badges`,
            `GET /api/${API_VERSION}/badges/:id`,
            `GET /api/${API_VERSION}/badges/search/:name`,
            `GET /api/${API_VERSION}/runes`,
            `GET /api/${API_VERSION}/runes/:id`,
            `GET /api/${API_VERSION}/runes/search/:name`,
            `GET /api/${API_VERSION}/gamemodes`,
            `GET /api/${API_VERSION}/gamemodes/:id`,
            `GET /api/${API_VERSION}/gamemodes/search/:name`,
            `GET /api/${API_VERSION}/spells`,
            `GET /api/${API_VERSION}/spells/:id`,
            `GET /api/${API_VERSION}/spells/search/:name`
        ]
    });
});

// ─── Error Handler ───────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────
app.listen(PORT, () => {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║  🏰 LIÊN QUÂN MOBILE API                          ║');
    console.log('╚════════════════════════════════════════════════════╝\n');
    console.log(`📡 Server URL:      http://localhost:${PORT}`);
    console.log(`❤️  Health Check:    http://localhost:${PORT}/health`);
    console.log(`🌍 API Base URL:     http://localhost:${PORT}/api/${API_VERSION}`);
    console.log(`🌐 Environment:      ${process.env.NODE_ENV || 'development'}`);
    console.log('\n📚 Available Endpoints:');
    console.log(`  • Heroes:        GET /api/${API_VERSION}/heroes`);
    console.log(`  • Equipments:    GET /api/${API_VERSION}/equipments`);
    console.log(`  • Badges:        GET /api/${API_VERSION}/badges`);
    console.log(`  • Runes:         GET /api/${API_VERSION}/runes`);
    console.log(`  • Game Modes:    GET /api/${API_VERSION}/gamemodes`);
    console.log(`  • Spells:        GET /api/${API_VERSION}/spells`);
    console.log('\n🔗 Try: curl http://localhost:' + PORT + '/health\n');
});

module.exports = app;