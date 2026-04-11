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

        // ── 2. Tạo kênh cho từng nhóm ──
        const teamPromises = Object.entries(teams).map(async ([teamIdx, memberIds]) => {
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
        const channels = [];

        // ── 2. Tạo kênh cho từng nhóm (Tối ưu hóa: Bounded Concurrency) ──
        const teamEntries = Object.entries(teams);
        const chunkSize = 3; // Chunks of 3 to avoid rate limits

        for (let i = 0; i < teamEntries.length; i += chunkSize) {
            const chunk = teamEntries.slice(i, i + chunkSize);

            const chunkResults = await Promise.all(chunk.map(async ([teamIdx, memberIds]) => {
                try {
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

                    logger.info(`[ChannelService] Created channels for team ${teamIdx}: text=${textCh.id}, voice=${voiceCh.id}`);

                    return [
                        { id: textCh.id, type: 'text', teamIndex: parseInt(teamIdx) },
                        { id: voiceCh.id, type: 'voice', teamIndex: parseInt(teamIdx) },
                    ];
                } catch (err) {
                    logger.error(`[ChannelService] Error creating channels for team ${teamIdx}:`, err);
                    return null;
                }
            }));

            // Flatten the results and filter out nulls to maintain deterministic ordering within the chunk
            channels.push(...chunkResults.flat().filter(Boolean));
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

            // ⚡ Bolt: Create text and voice channels concurrently per team
            const [textCh, voiceCh] = await Promise.all([
                guild.channels.create({
                    name: `nhóm-${teamIdx}-chat`,
                    type: ChannelType.GuildText,
                    parent: category.id,
                    permissionOverwrites: baseOverwrites,
                    topic: `Kênh chat của Nhóm ${teamIdx} • Sự kiện: ${eventName}`,
                }),
                guild.channels.create({
                    name: `Nhóm ${teamIdx} Voice`,
                    type: ChannelType.GuildVoice,
                    parent: category.id,
                    permissionOverwrites: baseOverwrites,
                })
            ]);

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

            logger.info(`[ChannelService] Created channels for team ${teamIdx}: text=${textCh.id}, voice=${voiceCh.id}`);

            return [
                { id: textCh.id, type: 'text', teamIndex: parseInt(teamIdx) },
                { id: voiceCh.id, type: 'voice', teamIndex: parseInt(teamIdx) },
            ];
        });

        const channelsArrays = await Promise.all(teamPromises);
        const channels = channelsArrays.flat();

        return { categoryId: category.id, channels };
    },

    /**
     * Xóa toàn bộ kênh + category đã tạo.
     * Xóa channels trước rồi mới xóa category (tránh lỗi "category not empty" ở một số edge case).
     */
    async cleanupEventChannels(guild, state) {
        let deletedCount = 0;

        // Parallelize channel deletion using bounded concurrency to prevent rate limits
        const chunkSize = 5;
        const channelsToProcess = [...state.createdChannels];
        let successfulDeletes = 0;

        for (let i = 0; i < channelsToProcess.length; i += chunkSize) {
            const chunk = channelsToProcess.slice(i, i + chunkSize);

            const results = await Promise.all(chunk.map(async (ch) => {
        // ⚡ Bolt: Chunked channel deletion to avoid Discord API rate limits (HTTP 429)
        const results = [];
        const chunkSize = 3;
        for (let i = 0; i < state.createdChannels.length; i += chunkSize) {
            const chunk = state.createdChannels.slice(i, i + chunkSize);
            const chunkPromises = chunk.map(async (ch) => {
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
            }));

            successfulDeletes += results.filter(Boolean).length;
        }
        deletedCount = successfulDeletes;
            });
            const chunkResults = await Promise.all(chunkPromises);
            results.push(...chunkResults);
        }
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