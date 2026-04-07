// src/database/models/DailyStats.js
const mongoose = require('mongoose');

/**
 * ========== Daily Stats Schema ==========
 * Lưu thống kê hàng ngày của mỗi server
 */
const dailyStatsSchema = new mongoose.Schema(
    {
        guildId: {
            type: String,
            required: true,
            index: true,
        },
        date: {
            type: String, // Format: YYYY-MM-DD
            required: true,
            index: true,
        },
        messages: {
            type: Number,
            default: 0,
        },
        joins: {
            type: Number,
            default: 0,
        },
        leaves: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// ========== Unique Index ==========
dailyStatsSchema.index({ guildId: 1, date: 1 }, { unique: true });

/**
 * ========== Methods ==========
 */

/**
 * Tăng messages hôm nay
 */
dailyStatsSchema.methods.incrementMessages = function (count = 1) {
    this.messages += count;
    return this.save();
};

/**
 * Tăng joins hôm nay
 */
dailyStatsSchema.methods.incrementJoins = function (count = 1) {
    this.joins += count;
    return this.save();
};

/**
 * Tăng leaves hôm nay
 */
dailyStatsSchema.methods.incrementLeaves = function (count = 1) {
    this.leaves += count;
    return this.save();
};

/**
 * ========== Statics ==========
 */

/**
 * Tìm hoặc tạo daily stats
 */
dailyStatsSchema.statics.findOrCreate = function (guildId, date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    return this.findOneAndUpdate(
        { guildId, date: targetDate },
        {
            $set: { guildId, date: targetDate },
            $setOnInsert: {
                messages: 0,
                joins: 0,
                leaves: 0,
            },
        },
        {
            upsert: true,
            returnDocument: 'after'
        }
    );
};

/**
 * Tăng messages hôm nay
 */
dailyStatsSchema.statics.incrementMessageCount = async function (guildId, count = 1) {
    const today = new Date().toISOString().split('T')[0];

    return this.findOneAndUpdate(
        { guildId, date: today },
        { $inc: { messages: count } },
        { upsert: true, returnDocument: 'after' }
    );
};

/**
 * Tăng joins hôm nay
 */
dailyStatsSchema.statics.incrementJoinCount = async function (guildId, count = 1) {
    const today = new Date().toISOString().split('T')[0];

    return this.findOneAndUpdate(
        { guildId, date: today },
        { $inc: { joins: count } },
        { upsert: true, returnDocument: 'after' }
    );
};

/**
 * Tăng leaves hôm nay
 */
dailyStatsSchema.statics.incrementLeaveCount = async function (guildId, count = 1) {
    const today = new Date().toISOString().split('T')[0];

    return this.findOneAndUpdate(
        { guildId, date: today },
        { $inc: { leaves: count } },
        { upsert: true, returnDocument: 'after' }
    );
};

/**
 * Lấy stats của ngày
 */
dailyStatsSchema.statics.getDailyStats = function (guildId, date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.findOne({ guildId, date: targetDate }).lean();
};

/**
 * Cập nhật nhiều chỉ số cùng lúc
 */
dailyStatsSchema.statics.updateStats = function (guildId, date, updates) {
    return this.findOneAndUpdate(
        { guildId, date },
        { $inc: updates },
        { upsert: true, returnDocument: 'after' }
    );
};

/**
 * Lấy stats của 7 ngày gần nhất
 */
dailyStatsSchema.statics.getWeeklyStats = async function (guildId) {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }

    return this.find({
        guildId,
        date: { $in: dates },
    })
        .sort({ date: 1 })
        .lean();
};

/**
 * Lấy stats của 30 ngày gần nhất
 */
dailyStatsSchema.statics.getMonthlyStats = async function (guildId) {
    const dates = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }

    return this.find({
        guildId,
        date: { $in: dates },
    })
        .sort({ date: 1 })
        .lean();
};

module.exports = mongoose.model('DailyStats', dailyStatsSchema);