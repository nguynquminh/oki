// src/database/models/GuildStats.js
const mongoose = require('mongoose');

/**
 * ========== Guild Stats Schema ==========
 * Lưu thống kê tổng quát của mỗi server
 */
const guildStatsSchema = new mongoose.Schema(
    {
        guildId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        guildName: {
            type: String,
            default: 'Unknown Guild',
        },
        totalMessages: {
            type: Number,
            default: 0,
            index: true,
        },
        totalJoins: {
            type: Number,
            default: 0,
        },
        totalLeaves: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true, // createdAt, updatedAt
    }
);

/**
 * ========== Methods ==========
 */

/**
 * Tăng số tin nhắn
 */
guildStatsSchema.methods.incrementMessages = function (count = 1) {
    this.totalMessages += count;
    return this.save();
};

/**
 * Tăng số lần join
 */
guildStatsSchema.methods.incrementJoins = function (count = 1) {
    this.totalJoins += count;
    return this.save();
};

/**
 * Tăng số lần leave
 */
guildStatsSchema.methods.incrementLeaves = function (count = 1) {
    this.totalLeaves += count;
    return this.save();
};

/**
 * ========== Statics ==========
 */

/**
 * Tìm hoặc tạo guild stats
 */
guildStatsSchema.statics.findOrCreate = function (guildId, guildName = 'Unknown') {
    return this.findOneAndUpdate(
        { guildId },
        {
            $set: { guildId, guildName },
            $setOnInsert: {
                totalMessages: 0,
                totalJoins: 0,
                totalLeaves: 0,
            },
        },
        {
            upsert: true,
            returnDocument: 'after'
        }
    );
};

/**
 * Tăng messages cho guild
 */
guildStatsSchema.statics.incrementMessageCount = async function (guildId, count = 1) {
    return this.findOneAndUpdate(
        { guildId },
        { $inc: { totalMessages: count } },
        { returnDocument: 'after' }
    );
};

/**
 * Tăng joins cho guild
 */
guildStatsSchema.statics.incrementJoinCount = async function (guildId, count = 1) {
    return this.findOneAndUpdate(
        { guildId },
        { $inc: { totalJoins: count } },
        { returnDocument: 'after' }
    );
};

/**
 * Tăng leaves cho guild
 */
guildStatsSchema.statics.incrementLeaveCount = async function (guildId, count = 1) {
    return this.findOneAndUpdate(
        { guildId },
        { $inc: { totalLeaves: count } },
        { returnDocument: 'after' }
    );
};

/**
 * Lấy stats của guild
 */
guildStatsSchema.statics.getGuildStats = function (guildId) {
    return this.findOne({ guildId }).lean();
};

/**
 * Cập nhật nhiều chỉ số cùng lúc
 */
guildStatsSchema.statics.updateStats = function (guildId, updates) {
    return this.findOneAndUpdate(
        { guildId },
        { $inc: updates },
        { upsert: true, returnDocument: 'after' }
    );
};

module.exports = mongoose.model('GuildStats', guildStatsSchema);