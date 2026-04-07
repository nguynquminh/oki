const logger = require('../utils/logger');

module.exports = {
    name: 'guildMemberAdd',
    once: false,
    async execute(member, client) {
        try {
            await client.statsCollector.incrementJoin(member.guild.id);
            logger.info(`✅ Member joined: ${member.user.tag} in ${member.guild.name}`);
        } catch (err) {
            logger.error('Error in guildMemberAdd:', err);
        }
    },
};