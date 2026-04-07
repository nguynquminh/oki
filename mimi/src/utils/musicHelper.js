// src/utils/musicHelper.js
const { EmbedBuilder } = require('discord.js');
const logger = require('./logger');

/**
 * ========== Music Helper Functions ==========
 */

/**
 * Kiểm tra xem user có đang trong phiên study không
 */
function isUserStudying(userId, activeStudySessions) {
    return activeStudySessions.has(userId);
}

/**
 * Kiểm tra xem user có ở trong đúng voice channel không
 */
function isUserInCorrectVoiceChannel(member, voiceChannelId) {
    if (!member.voice.channel) {
        return false;
    }
    return member.voice.channel.id === voiceChannelId;
}

/**
 * Gửi embed xác nhận phát nhạc
 */
async function sendNowPlayingEmbed(textChannel, song) {
    try {
        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('🎵 Đang Phát')
            .setDescription(`[${song.name}](${song.url})`)
            .addFields(
                {
                    name: '🎤 Nghệ sĩ',
                    value: song.uploader.name || 'Unknown',
                    inline: true,
                },
                {
                    name: '⏱️ Thời lượng',
                    value: formatDuration(song.duration),
                    inline: true,
                },
                {
                    name: '📺 Nguồn',
                    value: song.source || 'YouTube',
                    inline: true,
                }
            )
            .setThumbnail(song.thumbnail)
            .setFooter({ text: 'Hãy tập trung vào bài học! 📚' })
            .setTimestamp();

        await textChannel.send({ embeds: [embed] });
    } catch (error) {
        logger.error('Error sending nowPlaying embed:', error.message);
    }
}

/**
 * Gửi embed queue hiện tại
 */
async function sendQueueEmbed(textChannel, queue) {
    try {
        const songs = queue.songs.slice(0, 10);
        const description = songs
            .map((song, index) => `${index + 1}. [${song.name}](${song.url})`)
            .join('\n') || 'Queue trống';

        const embed = new EmbedBuilder()
            .setColor('#6C63FF')
            .setTitle('📋 Queue Hiện Tại')
            .setDescription(description)
            .addFields({
                name: '📊 Thống kê',
                value: `Tổng: ${queue.songs.length} bài | Thời gian: ${formatDuration(queue.duration)}`,
                inline: false,
            })
            .setFooter({ text: queue.songs.length > 10 ? `...và ${queue.songs.length - 10} bài khác` : '' })
            .setTimestamp();

        await textChannel.send({ embeds: [embed] });
    } catch (error) {
        logger.error('Error sending queue embed:', error.message);
    }
}

/**
 * Format thời gian (milliseconds → MM:SS)
 */
function formatDuration(ms) {
    if (!ms) return '0:00';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Tạo embed lỗi
 */
function createErrorEmbed(message) {
    return new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('❌ Lỗi')
        .setDescription(message)
        .setTimestamp();
}

/**
 * Tạo embed thành công
 */
function createSuccessEmbed(title, description) {
    return new EmbedBuilder()
        .setColor('#51CF66')
        .setTitle(title)
        .setDescription(description)
        .setTimestamp();
}

module.exports = {
    isUserStudying,
    isUserInCorrectVoiceChannel,
    sendNowPlayingEmbed,
    sendQueueEmbed,
    formatDuration,
    createErrorEmbed,
    createSuccessEmbed,
};