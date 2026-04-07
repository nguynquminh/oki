// src/database/connection.js
const mongoose = require('mongoose');
const logger = require('../utils/logger');

let db = null;

/**
 * ========== Kết nối MongoDB ==========
 */
async function connectDatabase() {
    try {
        // Kiểm tra xem đã connect chưa
        if (mongoose.connection.readyState === 1) {
            logger.info('✅ MongoDB đã sẵn sàng (reuse existing connection)');
            db = mongoose.connection;
            return db;
        }

        logger.info('[MongoDB] Đang kết nối...');

        const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://mikubaka2608_db_user:[EMAIL_ADDRESS]/?appName=study';

        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 30000,
            connectTimeoutMS: 30000,
            socketTimeoutMS: 60000,
            maxPoolSize: 10,
            minPoolSize: 2,
            family: 4,
        });

        db = mongoose.connection;

        // ========== Tạo indexes ==========
        const GuildStatsModel = require('./models/GuildStats');
        const DailyStatsModel = require('./models/DailyStats');

        await GuildStatsModel.collection.createIndex({ guildId: 1 });
        await DailyStatsModel.collection.createIndex({ guildId: 1, date: 1 }, { unique: true });

        logger.info('✅ MongoDB kết nối thành công');
        return db;

    } catch (error) {
        logger.error('❌ Lỗi kết nối MongoDB:', error.message);

        // ========== Retry 1 lần ==========
        logger.info('[MongoDB] Retry kết nối sau 5 giây...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        try {
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mikubaka2608_db_user:dPjhprrFZPK0jwVU@study.ub3rvhz.mongodb.net/', {
                serverSelectionTimeoutMS: 30000,
                connectTimeoutMS: 30000,
                socketTimeoutMS: 60000,
                maxPoolSize: 10,
                minPoolSize: 2,
                family: 4,
            });

            db = mongoose.connection;
            logger.info('✅ Retry kết nối thành công!');
            return db;

        } catch (retryError) {
            logger.error('❌ Retry thất bại:', retryError.message);
            process.exit(1);
        }
    }
}

/**
 * ========== Ngắt kết nối ==========
 */
async function disconnectDatabase() {
    try {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            logger.info('✅ MongoDB disconnected');
        }
    } catch (error) {
        logger.error('❌ Error disconnecting MongoDB:', error.message);
    }
}

/**
 * ========== Lấy connection ==========
 */
function getDatabase() {
    return db;
}

module.exports = {
    connectDatabase,
    disconnectDatabase,
    getDatabase,
};