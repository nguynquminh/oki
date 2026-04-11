// src/services/eventArchiveService.js
const { EmbedBuilder } = require('discord.js');
const discordTranscripts = require('discord-html-transcripts');
const EventModel = require('../models/Event');
const logger = require('../utils/logger');

// Kênh archive — đặt trong .env
const ARCHIVE_CHANNEL_ID = process.env.EVENT_ARCHIVE_CHANNEL_ID;

module.exports = {
    /**
     * 6a. Tạo transcript HTML cho từng kênh text trước khi xóa.
     * @returns {Array<{ teamIndex, attachment, fileName }>}
     */
    async generateTranscripts(guild, state) {
        const results = [];
        const textChannels = state.createdChannels.filter((c) => c.type === 'text');

        // Lô xử lý song song để tối ưu tốc độ trong khi tránh rate limit của Discord
        const BATCH_SIZE = 3;

        for (let i = 0; i < textChannels.length; i += BATCH_SIZE) {
            const batch = textChannels.slice(i, i + BATCH_SIZE);

            const batchPromises = batch.map(async (ch) => {
                try {
                    const channel = await guild.channels.fetch(ch.id).catch(() => null);
                    if (!channel) {
                        logger.warn(`[Archive] Channel ${ch.id} not found, skipping transcript`);
                        return null;
                    }

                    const fileName = `transcript-${state.eventId}-nhom-${ch.teamIndex}.html`;

                    const transcript = await discordTranscripts.createTranscript(channel, {
                        limit: -1,
                        returnType: 'attachment',
                        filename: fileName,
                        poweredBy: false,
                        saveImages: false,
                        footerText: `Event: ${state.name} • Nhóm ${ch.teamIndex} • {number} tin nhắn`,
                    });

                    logger.info(`[Archive] Transcript created for team ${ch.teamIndex}`);

                    return {
                        teamIndex: ch.teamIndex,
                        attachment: transcript,
                        fileName,
                    };
                } catch (err) {
                    logger.error(`[Archive] Transcript error for channel ${ch.id}:`, err);
                    return null;
                }
            });

            // Chờ lô hiện tại hoàn thành trước khi chuyển sang lô tiếp theo
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults.filter(Boolean));
        }

        return results;
    },

    /**
     * 6b. Lưu metadata sự kiện vào MongoDB.
     */
    async saveToDatabase(state, guild) {
        const teamsArray = Object.entries(state.teams).map(([idx, memberIds]) => ({
            teamIndex: parseInt(idx),
            members: memberIds.map((userId) => {
                const member = guild.members.cache.get(userId);
                return {
                    userId,
                    username: member?.user?.tag ?? member?.user?.username ?? 'Unknown',
                };
            }),
        }));

        const host = guild.members.cache.get(state.hostId);
        const totalParticipants = Object.values(state.teams).flat().length;

        const doc = new EventModel({
            eventId: state.eventId,
            guildId: state.guildId,
            hostId: state.hostId,
            hostTag: host?.user?.tag ?? 'Unknown',
            name: state.name,
            description: state.description,
            mode: state.mode,
            teamCount: state.teamCount,
            teams: teamsArray,
            participantCount: totalParticipants,
            transcriptFiles: state.createdChannels
                .filter((c) => c.type === 'text')
                .map((c) => ({
                    teamIndex: c.teamIndex,
                    fileName: `transcript-${state.eventId}-nhom-${c.teamIndex}.html`,
                })),
            timestamps: {
                created: new Date(state.createdAt),
                started: state.startedAt ? new Date(state.startedAt) : undefined,
                ended: new Date(state.endedAt ?? Date.now()),
            },
        });

        await doc.save();
        logger.info(`[Archive] Event ${state.eventId} saved to database`);
        return doc;
    },

    /**
     * 6d. Gửi embed tổng kết + transcript files vào kênh archive.
     */
    async sendSummary(guild, state, transcripts) {
        if (!ARCHIVE_CHANNEL_ID) {
            logger.warn('[Archive] EVENT_ARCHIVE_CHANNEL_ID not set in .env — skipping summary');
            return;
        }

        const archiveChannel = await guild.channels.fetch(ARCHIVE_CHANNEL_ID).catch(() => null);
        if (!archiveChannel) {
            logger.warn(`[Archive] Archive channel ${ARCHIVE_CHANNEL_ID} not found`);
            return;
        }

        // Tính thời lượng
        const durationMs = (state.endedAt ?? Date.now()) - (state.startedAt ?? state.createdAt);
        const durationMin = Math.round(durationMs / 60000);
        const durationStr = durationMin >= 60
            ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`
            : `${durationMin} phút`;

        const totalParticipants = Object.values(state.teams).flat().length;

        const embed = new EmbedBuilder()
            .setTitle(`📋 Báo cáo: ${state.name}`)
            .setColor(0x2b2d31)
            .setDescription(state.description ?? '_Không có mô tả_')
            .addFields(
                { name: '👑 Host', value: `<@${state.hostId}>`, inline: true },
                {
                    name: '🎯 Phương thức',
                    value: state.mode === 'random' ? '🎲 Ngẫu nhiên' : '✋ Tự chọn',
                    inline: true,
                },
                { name: '⏱️ Thời lượng', value: durationStr, inline: true },
                { name: '👥 Tổng người tham gia', value: `${totalParticipants}`, inline: true },
                { name: '📊 Số nhóm', value: `${state.teamCount}`, inline: true },
                {
                    name: '📅 Thời gian',
                    value: `Bắt đầu: <t:${Math.floor((state.startedAt ?? state.createdAt) / 1000)}:F>\n`
                        + `Kết thúc: <t:${Math.floor((state.endedAt ?? Date.now()) / 1000)}:F>`,
                    inline: false,
                },
            )
            .setTimestamp();

        // Thêm fields cho từng nhóm
        for (const [idx, memberIds] of Object.entries(state.teams)) {
            embed.addFields({
                name: `🏷️ Nhóm ${idx} (${memberIds.length})`,
                value: memberIds.length > 0
                    ? memberIds.map((id) => `<@${id}>`).join(', ')
                    : '_Trống_',
                inline: false,
            });
        }

        embed.setFooter({
            text: `Event ID: ${state.eventId} • ${totalParticipants} người • ${transcripts.length} transcript(s)`,
        });

        const files = transcripts.map((t) => t.attachment);

        await archiveChannel.send({
            content: `📁 **Lưu trữ sự kiện** • <t:${Math.floor(Date.now() / 1000)}:R>`,
            embeds: [embed],
            files,
        });

        logger.info(`[Archive] Summary sent to #${archiveChannel.name}`);
    },
};