const { Router } = require('express');
const GuildStats = require('../../database/models/GuildStats');

const router = Router();

router.get('/:guildId', async (req, res) => {
    try {
        const { guildId } = req.params;
        const guild = req.client.guilds.cache.get(guildId);

        if (!guild) {
            return res.status(404).json({ error: 'Guild không tồn tại hoặc bot chưa join.' });
        }

        const realtime = {
            memberCount: guild.memberCount,
            onlineCount: guild.members.cache.filter(
                (m) => m.presence?.status !== 'offline' && m.presence?.status !== undefined
            ).size,
            channelCount: guild.channels.cache.size,
            roleCount: guild.roles.cache.size,
            boostCount: guild.premiumSubscriptionCount,
            boostTier: guild.premiumTier,
            botPing: req.client.ws.ping,
            botUptime: process.uptime(), 
        };

        const dbStats = await GuildStats.findOne({ guildId });

        return res.json({
            guildId,
            guildName: guild.name,
            guildIcon: guild.iconURL({ dynamic: true }),
            realtime,
            historical: dbStats || {},
            fetchedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;