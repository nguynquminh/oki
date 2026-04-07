const logger = require('../utils/logger');

module.exports = {
    name: 'messageCreate',
    once: false,
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        try {
            await client.statsCollector.incrementMessage(message.guildId);

            const prefix = process.env.PREFIX || '!';
            if (!message.content.startsWith(prefix)) return;

            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            const command = client.commands.get(commandName) ||
                client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

            if (!command) return;

            if (command.adminOnly && !message.member.permissions.has('ADMINISTRATOR')) {
                return message.reply('❌ Lệnh này chỉ dành cho admin!');
            }

            const cooldownKey = `${message.author.id}-${commandName}`;
            if (client.cooldowns && client.cooldowns.has(cooldownKey)) {
                const expirationTime = client.cooldowns.get(cooldownKey);
                if (Date.now() < expirationTime) {
                    const timeLeft = ((expirationTime - Date.now()) / 1000).toFixed(1);
                    return message.reply(`⏱️ Vui lòng chờ ${timeLeft}s trước khi sử dụng lệnh này!`);
                }
            }

            try {
                await command.execute(message, args, client);

                await client.statsCollector.incrementCommand(message.guildId);

                if (client.statsCollector.addActivity) {
                    client.statsCollector.addActivity(
                        `${prefix}${commandName}`,
                        `@${message.author.username}`,
                        message.guild.name
                    );
                }

                const cooldown = (command.cooldown || 3) * 1000;
                if (!client.cooldowns) client.cooldowns = new Map();
                client.cooldowns.set(cooldownKey, Date.now() + cooldown);

                setTimeout(() => client.cooldowns.delete(cooldownKey), cooldown);

                logger.info(`Command executed: ${commandName} by ${message.author.tag}`);
            } catch (err) {
                logger.error(`Error executing command ${commandName}:`, err);
                await message.reply('❌ Có lỗi xảy ra khi thực thi lệnh');
            }
        } catch (err) {
            logger.error(`Error in messageCreate:`, err);
        }
    },
};