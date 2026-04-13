const logger = require('../utils/logger');
const GuildStats = require('../database/models/GuildStats');
const dailyStats = require('../database/models/dailyStats');

class StatsCollector {
    constructor() {
        this.client = null;
        this.startTime = Date.now();
        this.recentActivities = [];
    }

    setClient(client) {
        this.client = client;
    }

    _getDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    // ⚡ Bolt: Use Promise.all to parallelize independent DB operations and rely on updateStats' upsert capability to eliminate redundant findOrCreate queries.
    // Expected Impact: Reduces database queries per increment from 4 sequential to 2 parallel, significantly improving performance.
    async incrementMessage(guildId) {
        if (!guildId) return;

        try {
            const today = this._getDateKey(new Date());
            await Promise.all([
                GuildStats.updateStats(guildId, { totalMessages: 1 }),
                dailyStats.updateStats(guildId, today, { messages: 1 })
            ]);

            logger.debug(`📝 Message recorded for guild ${guildId}`);
        } catch (err) {
            logger.error('Error incrementing message:', err);
        }
    }

    async incrementCommand(guildId) {
        if (!guildId) return;

        try {
            const today = this._getDateKey(new Date());
            await Promise.all([
                GuildStats.findOrCreate(guildId),
                dailyStats.findOrCreate(guildId, today)
            ]);

            logger.debug(`⚙️  Command recorded for guild ${guildId}`);
        } catch (err) {
            logger.error('Error incrementing command:', err);
        }
    }

    async incrementJoin(guildId) {
        if (!guildId) return;

        try {
            const today = this._getDateKey(new Date());
            await Promise.all([
                GuildStats.updateStats(guildId, { totalJoins: 1 }),
                dailyStats.updateStats(guildId, today, { joins: 1 })
            ]);

            logger.debug(`👋 Join recorded for guild ${guildId}`);
        } catch (err) {
            logger.error('Error incrementing join:', err);
        }
    }

    async incrementLeave(guildId) {
        if (!guildId) return;

        try {
            const today = this._getDateKey(new Date());
            await Promise.all([
                GuildStats.updateStats(guildId, { totalLeaves: 1 }),
                dailyStats.updateStats(guildId, today, { leaves: 1 })
            ]);

            logger.debug(`👋 Leave recorded for guild ${guildId}`);
        } catch (err) {
            logger.error('Error incrementing leave:', err);
        }
    }

    getSnapshot() {
        if (!this.client) {
            return {
                totalGuilds: 0,
                totalMembers: 0,
                totalMessages: 0,
                totalCommands: 0,
                botStatus: 'offline',
                ping: 0,
                uptime: 0,
                newGuildsThisMonth: 0,
                newMembersThisWeek: 0,
                memberGrowthPercent: 0,
            };
        }

        const totalGuilds = this.client.guilds.cache.size;
        const totalMembers = this.client.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0);
        const ping = this.client.ws.ping;
        const uptime = Date.now() - this.startTime;

        return {
            totalGuilds,
            totalMembers,
            totalMessages: 0,
            totalCommands: this.client.commands ? this.client.commands.size : 0,
            botStatus: this.client.user ? 'online' : 'offline',
            ping: Math.round(ping),
            uptime,
            newGuildsThisMonth: 12,
            newMembersThisWeek: 2400,
            memberGrowthPercent: 5.6,
        };
    }

    async getGuildStats(guildId) {
        if (!this.client) return null;

        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) return null;

        try {
            const stats = await GuildStats.findById(guildId);
            return {
                guildId,
                guildName: guild.name,
                memberCount: guild.memberCount,
                totalMessages: stats?.totalMessages || 0,
                totalJoins: stats?.totalJoins || 0,
                totalLeaves: stats?.totalLeaves || 0,
            };
        } catch (err) {
            logger.error('Error getting guild stats:', err);
            return null;
        }
    }

    async getAreaChartData(guildId = null) {
        const labels = [];
        const currentWeek = [];
        const previousWeek = [];

        const today = new Date();

        try {
            const dailyStats = guildId
                ? await dailyStats.getLastDays(guildId, 14)
                : [];

            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                const dateKey = this._getDateKey(d);
                const dayOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];

                labels.push(dayOfWeek);

                const currentStat = dailyStats.find(stat => stat.date === dateKey);
                currentWeek.push(currentStat?.messages || Math.floor(Math.random() * 1000));

                const prevDate = new Date(d);
                prevDate.setDate(d.getDate() - 7);
                const prevKey = this._getDateKey(prevDate);
                const prevStat = dailyStats.find(stat => stat.date === prevKey);
                previousWeek.push(prevStat?.messages || Math.floor(Math.random() * 800));
            }

            return { labels, currentWeek, previousWeek };
        } catch (err) {
            logger.error('Error getting area chart data:', err);
            return { labels, currentWeek, previousWeek };
        }
    }

    getPieChartData() {
        if (!this.client) {
            return { labels: [], data: [] };
        }

        const guilds = Array.from(this.client.guilds.cache.values())
            .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
            .slice(0, 6);

        const labels = [];
        const data = [];

        guilds.forEach((guild) => {
            labels.push(guild.name);
            const members = guild.memberCount || 0;
            data.push(members);
        });

        const total = data.reduce((a, b) => a + b, 1);
        const percentages = data.map((m) => Math.round((m / total) * 100));

        return { labels, data: percentages };
    }

    getTopGuilds() {
        if (!this.client) return [];

        return Array.from(this.client.guilds.cache.values())
            .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
            .slice(0, 5)
            .map((guild) => ({
                id: guild.id,
                name: guild.name,
                memberCount: guild.memberCount || 0,
                status: 'online',
                ping: Math.round(this.client.ws.ping),
                uptimeDays: Math.floor((Date.now() - this.startTime) / (1000 * 60 * 60 * 24)),
            }));
    }

    addActivity(command, user, server) {
        this.recentActivities.unshift({
            icon: 'fa-robot',
            command: command,
            user: user,
            server: server,
            timestamp: new Date().toISOString(),
        });
        if (this.recentActivities.length > 5) {
            this.recentActivities.pop();
        }
    }

    getRecentActivity() {
        return this.recentActivities;
    }
}

module.exports = StatsCollector;