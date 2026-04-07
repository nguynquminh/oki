const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

async function loadCommands(client) {
    const commandsPath = path.join(__dirname, '../commands');

    if (!fs.existsSync(commandsPath)) {
        fs.mkdirSync(commandsPath, { recursive: true });
        logger.warn('📁 Commands folder created (empty)');
        return;
    }

    const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        try {
            const command = require(filePath);
            client.commands.set(command.name, command);
            logger.debug(`Loaded command: ${command.name}`);
        } catch (err) {
            logger.error(`Failed to load command ${file}:`, err);
        }
    }

    logger.info(`✅ Loaded ${commandFiles.length} commands`);
}

module.exports = { loadCommands };