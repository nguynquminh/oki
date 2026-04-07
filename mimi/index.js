// index.js
require('dotenv').config();

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { YouTubePlugin } = require('@distube/youtube');
const { connectDatabase } = require('./src/database/connection');
const { loadCommands } = require('./src/handlers/commandHandler');
const { loadEvents } = require('./src/handlers/eventHandler');
const { startApiServer } = require('./src/api/server');
const StatsCollector = require('./src/stats/statsCollector');
const logger = require('./src/utils/logger');
const mongoose = require('mongoose');

// ========== Cấu hình Mongoose ==========
mongoose.set('strictQuery', true);
mongoose.set('bufferCommands', false);
mongoose.set('debug', false);

// ========== Tạo Client ==========
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

// ========== Setup DisTube ==========
client.distube = new DisTube(client, {
    emitNewSongOnly: true,
    plugins: [
        new SpotifyPlugin(),
        new SoundCloudPlugin(),
        new YouTubePlugin(),
    ],
});

// ========== DisTube Events ==========
client.distube
    .on('playSong', (queue, song) => {
        logger.info(`🎵 Đang phát: ${song.name} - ${song.uploader.name}`);
    })
    .on('addSong', (queue, song) => {
        logger.info(`➕ Thêm vào queue: ${song.name}`);
    })
    .on('error', (error, queue, song) => {
        logger.error('🎵 DisTube Error:', error);
        if (queue && queue.textChannel) {
            queue.textChannel.send(`❌ **Lỗi phát nhạc**: ${error.message}`).catch(() => { });
        }
    })
    .on('empty', (queue) => {
        logger.info(`📭 Queue trống, bot rời khỏi voice`);
    })
    .on('finish', (queue) => {
        logger.info(`✅ Hết danh sách phát`);
    });

client.commands = new Collection();

// ========== Hội đồng Cố vấn AI — Study Sessions ==========
// Map lưu trạng thái phiên học: userId → { isStudying, channelId, startedAt }
client.studyingSessions = new Map();

// ========== Event System — State Management ==========
const { eventStore } = require('./src/services/eventStateManager');
client.eventStore = eventStore;

// Dọn state cũ mỗi giờ (tránh memory leak)
setInterval(() => {
    const now = Date.now();
    client.eventStore.sweep((e) => now - e.createdAt > 24 * 60 * 60 * 1000 && e.phase !== 'started');
    logger.info(`🧹 Event state cleanup — còn ${client.eventStore.size} event(s) trong memory`);
}, 60 * 60 * 1000);

logger.info('📅 EventStateManager initialized');


// ========== Stats Collector ==========
const statsCollector = new StatsCollector();
client.statsCollector = statsCollector;
statsCollector.setClient(client);

logger.info('📊 StatsCollector initialized');

// ========== Khởi động Bot ==========
(async () => {
    try {
        // ✅ Kết nối MongoDB
        await connectDatabase();

        // ✅ Load Commands
        await loadCommands(client);
        logger.info('✅ Đã load Commands');

        // ✅ Load Events
        await loadEvents(client);
        logger.info('✅ Đã load Events');

        // ✅ Login Discord
        await client.login(process.env.DISCORD_TOKEN);

    } catch (error) {
        logger.error('❌ Lỗi khởi động bot:', error.message);
        process.exit(1);
    }
})();

// ========== Error Handling ==========
process.on('unhandledRejection', (error) => {
    logger.error('unhandledRejection:', error);
});

process.on('uncaughtException', (error) => {
    logger.error('uncaughtException:', error);
    process.exit(1);
});

module.exports = client;