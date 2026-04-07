// src/services/eventChannelService.js
const { ChannelType, PermissionFlagsBits } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
    /**
     * Tạo Category + Text/Voice channels với permission overwrites.
     * @returns {{ categoryId: string, channels: Array<{id, type, teamIndex}> }}
     */
    async createEventChannels(guild, eventName, teams, hostId) {
        // ── 1. Tạo Category ──
        const category = await guild.channels.create({
            name: `[Sự kiện] ${eventName}`.slice(0, 100), // Discord giới hạn 100 chars
            type: ChannelType.GuildCategory,
            permissionOverwrites: [
                {
                    id: guild.id, // @everyone
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: hostId,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.ManageChannels,
                        PermissionFlagsBits.SendMessages,
                    ],
                },
                {
                    id: guild.client.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.ManageChannels,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.Connect,
                        PermissionFlagsBits.Speak,
                    ],
                },
            ],
        });

        logger.info(`[ChannelService] Created category: ${category.name} (${category.id})`);

        const channels = [];

        // ── 2. Tạo kênh cho từng nhóm ──
        for (const [teamIdx, memberIds] of Object.entries(teams)) {
            const memberOverwrites = memberIds.map((userId) => ({
                id: userId,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.Connect,
                    PermissionFlagsBits.Speak,
                    PermissionFlagsBits.AttachFiles,
                    PermissionFlagsBits.AddReactions,
                ],
            }));

            const baseOverwrites = [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: hostId,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                    ],
                },
                {
                    id: guild.client.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.ManageChannels,
                        PermissionFlagsBits.Connect,
                        PermissionFlagsBits.Speak,
                    ],
                },
                ...memberOverwrites,
            ];

            // Text channel
            const textCh = await guild.channels.create({
                name: `nhóm-${teamIdx}-chat`,
                type: ChannelType.GuildText,
                parent: category.id,
                permissionOverwrites: baseOverwrites,
                topic: `Kênh chat của Nhóm ${teamIdx} • Sự kiện: ${eventName}`,
            });

            // Voice channel
            const voiceCh = await guild.channels.create({
                name: `Nhóm ${teamIdx} Voice`,
                type: ChannelType.GuildVoice,
                parent: category.id,
                permissionOverwrites: baseOverwrites,
            });

            // Gửi tin chào mừng
            const memberMentions = memberIds.map((id) => `<@${id}>`).join(', ');
            await textCh.send({
                embeds: [
                    {
                        title: `👋 Chào mừng đến Nhóm ${teamIdx}!`,
                        description: `**Thành viên:** ${memberMentions}\n\n`
                            + `Đây là kênh riêng của nhóm. Hãy phối hợp với nhau tại đây.\n`
                            + `🔊 Voice channel: <#${voiceCh.id}>\n\n`
                            + `Chúc may mắn! 🍀`,
                        color: 0x57f287,
                    },
                ],
            });

            channels.push(
                { id: textCh.id, type: 'text', teamIndex: parseInt(teamIdx) },
                { id: voiceCh.id, type: 'voice', teamIndex: parseInt(teamIdx) },
            );

            logger.info(`[ChannelService] Created channels for team ${teamIdx}: text=${textCh.id}, voice=${voiceCh.id}`);
        }

        return { categoryId: category.id, channels };
    },

    /**
     * Xóa toàn bộ kênh + category đã tạo.
     * Xóa channels trước rồi mới xóa category (tránh lỗi "category not empty" ở một số edge case).
     */
    async cleanupEventChannels(guild, state) {
        let deletedCount = 0;

        // Parallelize channel deletion
        const deletePromises = state.createdChannels.map(async (ch) => {
            try {
                const channel = await guild.channels.fetch(ch.id).catch(() => null);
                if (channel) {
                    await channel.delete(`[Event Cleanup] ${state.eventId}`);
                    return true;
                }
            } catch (err) {
                logger.warn(`[ChannelService] Could not delete channel ${ch.id}: ${err.message}`);
            }
            return false;
        });

        const results = await Promise.all(deletePromises);
        deletedCount = results.filter(Boolean).length;

        if (state.categoryId) {
            try {
                const category = await guild.channels.fetch(state.categoryId).catch(() => null);
                if (category) {
                    await category.delete(`[Event Cleanup] ${state.eventId}`);
                    deletedCount++;
                }
            } catch (err) {
                logger.warn(`[ChannelService] Could not delete category: ${err.message}`);
            }
        }

        logger.info(`[ChannelService] Cleanup done: ${deletedCount} channel(s) deleted`);
    },
};