const { startApiServer } = require('../api/server');
const logger = require('../utils/logger');

module.exports = {
    name: 'clientReady', 
    once: true,
    execute(client) {
        logger.info(`✅ Bot logged in as ${client.user.tag}`);
        logger.info(`🎯 Bot is in ${client.guilds.cache.size} guilds`);

        startApiServer(client);

        client.user.setPresence({
            activities: [{ name: 'Tình yêu 💖', type: 'WATCHING' }],
            status: 'online',
        });
    },
};