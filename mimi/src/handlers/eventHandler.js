// src/handlers/eventHandler.js
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

function getAllJsFiles(dirPath, fileList = []) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            getAllJsFiles(fullPath, fileList);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            fileList.push(fullPath);
        }
    }

    return fileList;
}

async function loadEvents(client) {
    const eventsPath = path.join(__dirname, '../events');

    if (!fs.existsSync(eventsPath)) {
        logger.warn('📁 Events folder not found');
        return;
    }

    const eventFiles = getAllJsFiles(eventsPath);

    for (const filePath of eventFiles) {
        try {
            const event = require(filePath);
            let eventName = event.name;

            if (!eventName) {
                logger.warn(`⚠️ Event file missing 'name': ${filePath}`);
                continue;
            }

            if (eventName === 'clientReady') {
                eventName = 'ready';
            }

            if (event.once) {
                client.once(eventName, (...args) => event.execute(...args, client));
            } else {
                client.on(eventName, (...args) => event.execute(...args, client));
            }

            const relativePath = path.relative(eventsPath, filePath);
            logger.debug(`Loaded event: ${eventName} from ${relativePath}`);
        } catch (err) {
            logger.error(`Failed to load event ${filePath}:`, err);
        }
    }

    logger.info(`✅ Loaded ${eventFiles.length} events`);
}

module.exports = { loadEvents };