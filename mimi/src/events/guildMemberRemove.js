
const logger = require('../utils/logger');

module.exports = {
    name: 'guildMemberRemove',
    once: false,
    async execute(member, client) {
        try {
            await client.statsCollector.incrementLeave(member.guild.id);
            logger.info(`👋 Member left: ${member.user.tag} from ${member.guild.name}`);
        } catch (err) {
            logger.error('Error in guildMemberRemove:', err);
        }
    },
};