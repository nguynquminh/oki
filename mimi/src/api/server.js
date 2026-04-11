const express = require('express');
const logger = require('../utils/logger');

function startApiServer(client) {
    const app = express();
    const PORT = process.env.API_PORT || 3000;

    app.use(express.json());

    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        next();
    });

    app.get('/api/stats', (req, res) => {
        try {
            const stats = client.statsCollector.getSnapshot();
            res.json({ success: true, data: stats });
        } catch (err) {
            logger.error('GET /api/stats error:', err);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    app.get('/api/stats/:guildId', (req, res) => {
        try {
            const guildId = req.params.guildId;
            const stats = client.statsCollector.getGuildStats(guildId);
            if (!stats) {
                return res.status(404).json({ success: false, error: 'Guild not found' });
            }
            res.json({ success: true, data: stats });
        } catch (err) {
            logger.error('GET /api/stats/:guildId error:', err);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    app.get('/api/dashboard', async (req, res) => {
        try {
            const area = await client.statsCollector.getAreaChartData();
            const pie = client.statsCollector.getPieChartData();
            const topGuilds = client.statsCollector.getTopGuilds();
            const recentActivity = client.statsCollector.getRecentActivity();

            const areaChart = {
                labels: area.labels,
                datasets: [
                    {
                        label: 'Lệnh thực thi',
                        data: area.currentWeek,
                        borderColor: '#ff6b95',
                        backgroundColor: 'rgba(255,107,149,0.3)',
                    },
                    {
                        label: 'Tuần trước',
                        data: area.previousWeek,
                        borderColor: '#b76e79',
                        backgroundColor: 'rgba(183,110,121,0.2)',
                        borderDash: [6, 4],
                    },
                ],
            };

            const pieChart = {
                labels: pie.labels,
                datasets: [
                    {
                        data: pie.data,
                        backgroundColor: [
                            '#ff6b95',
                            '#ffadc6',
                            '#b76e79',
                            '#ffc2d4',
                            '#ff449f',
                            '#ffe8ef',
                        ],
                    },
                ],
            };

            res.json({
                success: true,
                data: {
                    areaChart,
                    pieChart,
                    topGuilds,
                    recentActivity,
                },
            });
        } catch (err) {
            logger.error('GET /api/dashboard error:', err);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });


    // Placeholder Endpoints for new admin pages
    app.get('/api/servers', (req, res) => {
        try {
            const topGuilds = client.statsCollector ? client.statsCollector.getTopGuilds() : [];
            res.json({ success: true, data: { servers: topGuilds } });
        } catch (err) {
            logger.error('GET /api/servers error:', err);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    app.get('/api/security', (req, res) => {
        res.json({
            success: true,
            data: {
                status: "Secure",
                recentAlerts: [],
                lastScan: new Date().toISOString()
            }
        });
    });

    app.get('/api/logs', (req, res) => {
        try {
            const logs = client.statsCollector ? client.statsCollector.getRecentActivity() : [];
            res.json({ success: true, data: { logs } });
        } catch (err) {
            logger.error('GET /api/logs error:', err);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    app.get('/api/settings', (req, res) => {
        res.json({
            success: true,
            data: {
                maintenanceMode: false,
                version: "2.4.1",
                prefix: "!"
            }
        });
    });

    app.get('/api/full-stats', async (req, res) => {
        try {
            const stats = client.statsCollector ? client.statsCollector.getSnapshot() : {};
            const pie = client.statsCollector ? client.statsCollector.getPieChartData() : { labels: [], data: [] };
            res.json({ success: true, data: { stats, distribution: pie } });
        } catch (err) {
            logger.error('GET /api/full-stats error:', err);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    app.listen(PORT, () => {
        logger.info(`🌐 API Server running on http://localhost:${PORT}`);
    });

    // ========== Ví dụ endpoint để lấy dữ liệu cho Dashboard ==========
    app.get('/api/study/user/:userId', async (req, res) => {
        const user = await StudyModel.findOne({ userId: req.params.userId });
        res.json(user);
    });

    app.get('/api/study/leaderboard', async (req, res) => {
        const leaderboard = await StudyModel.getLeaderboard(10);
        res.json(leaderboard);
    });
}

module.exports = { startApiServer };