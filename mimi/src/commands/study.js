// commands/study.js
const {
    EmbedBuilder,
    ChannelType,
    PermissionFlagsBits,
} = require('discord.js');
const {
    isUserStudying,
    isUserInCorrectVoiceChannel,
    sendNowPlayingEmbed,
    sendQueueEmbed,
    formatDuration,
    createErrorEmbed,
    createSuccessEmbed,
} = require('../utils/musicHelper');
const logger = require('../utils/logger');

const activeStudySessions = new Map();

/**
 * ========== HELPER: Reply an toàn ==========
 */
async function safeReply(message, payload) {
    try {
        if (payload instanceof EmbedBuilder) {
            payload = { embeds: [payload] };
        }
        return await message.channel.send(payload);
    } catch (err) {
        logger.error('safeReply error:', err.message);
        try {
            const ch = await message.client.channels.fetch(message.channelId);
            return await ch.send(payload);
        } catch (e) {
            logger.error('safeReply fallback failed:', e.message);
            return null;
        }
    }
}

/**
 * ========== HELPER: Fetch channel an toàn ==========
 */
async function safeFetchChannel(guild, channelId) {
    if (!channelId) return null;
    try {
        return guild.channels.cache.get(channelId) ||
            await guild.channels.fetch(channelId);
    } catch (err) {
        logger.warn(`Channel ${channelId} not found:`, err.message);
        return null;
    }
}

// ★ MỚI: Helper cắt ngắn text cho Discord embed (giới hạn ký tự)
function truncateText(text, maxLength = 1024) {
    if (!text) return '*Không có dữ liệu.*';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 30) + '\n\n*... (đã rút gọn)*';
}

module.exports = {
    name: 'study',
    aliases: ['focus'],
    description: 'Hệ thống học tập/làm việc với Pomodoro timer + điều khiển nhạc',
    usage: '!study <start|stop|play|skip|pause|resume|queue|stats> [tùy_chọn]',
    async execute(message, args) {
        try {
            if (args.length === 0) {
                return safeReply(message, {
                    embeds: [getStudyHelpEmbed()],
                });
            }

            const subcommand = args[0]?.toLowerCase();

            switch (subcommand) {
                case 'start':
                    await handleStudyStart(message, args[1]);
                    break;

                case 'stop':
                    await handleStudyStop(message);
                    break;

                case 'play':
                    await handlePlayMusic(message, args.slice(1));
                    break;

                case 'skip':
                    await handleSkip(message);
                    break;

                case 'pause':
                    await handlePause(message);
                    break;

                case 'resume':
                    await handleResume(message);
                    break;

                case 'queue':
                    await handleQueue(message);
                    break;

                case 'stats':
                    await handleStudyStats(message);
                    break;

                default:
                    return safeReply(message, {
                        embeds: [getStudyHelpEmbed()],
                    });
            }

        } catch (error) {
            logger.error('Lỗi trong lệnh study:', error.message);

            return safeReply(message,
                '❌ **Lỗi**: Đã xảy ra sự cố. Vui lòng thử lại sau!'
            );
        }
    },
};

/**
 * ========== HANDLER 1: Bắt đầu phiên học ==========
 */
async function handleStudyStart(message, timeInput) {
    try {
        const userId = message.author.id;
        const username = message.author.username;

        if (activeStudySessions.has(userId)) {
            return safeReply(message,
                '❌ Bạn đang có một phiên học đang hoạt động!\n' +
                'Vui lòng gõ `!study stop` để kết thúc phiên học trước.'
            );
        }

        let studyMinutes = 25;
        if (timeInput) {
            const parsed = parseInt(timeInput, 10);
            if (!isNaN(parsed) && parsed > 0 && parsed <= 480) {
                studyMinutes = parsed;
            } else {
                return safeReply(message,
                    '❌ Thời gian không hợp lệ! Vui lòng nhập một số từ 1 đến 480 (phút).'
                );
            }
        }

        const loadingMsg = await safeReply(message,
            '⏳ Đang tạo không gian học tập của bạn...'
        );

        if (!loadingMsg) {
            return;
        }

        // ========== Tìm hoặc tạo Category ==========
        let studyCategory = message.guild.channels.cache.find(
            (c) => c.type === ChannelType.GuildCategory && c.name === '📖 Khu Vực Học Tập'
        );

        if (!studyCategory) {
            studyCategory = await message.guild.channels.create({
                name: '📖 Khu Vực Học Tập',
                type: ChannelType.GuildCategory,
                reason: 'Tạo category cho phiên học',
            });
        }

        // ========== Tạo Voice Channel ==========
        const voiceChannel = await message.guild.channels.create({
            name: `📖-study-${username}`,
            type: ChannelType.GuildVoice,
            parent: studyCategory.id,
            reason: `Phiên học của ${username}`,
        });

        // ========== Tạo Text Channel ==========
        const textChannel = await message.guild.channels.create({
            name: `study-${username}`,
            type: ChannelType.GuildText,
            parent: studyCategory.id,
            reason: `Phiên học của ${username}`,
        });

        // ========== Cấu hình Permission ==========
        try {
            await voiceChannel.permissionOverwrites.create(
                message.guild.roles.everyone,
                {
                    ViewChannel: false,
                    Connect: false,
                }
            );

            await textChannel.permissionOverwrites.create(
                message.guild.roles.everyone,
                {
                    ViewChannel: false,
                    SendMessages: false,
                }
            );

            await voiceChannel.permissionOverwrites.create(userId, {
                ViewChannel: true,
                Connect: true,
                Speak: true,
                Stream: true,
            });

            await textChannel.permissionOverwrites.create(userId, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
            });

            await voiceChannel.permissionOverwrites.create(
                message.guild.members.me.id,
                {
                    ViewChannel: true,
                    Connect: true,
                    Speak: true,
                    ManageChannels: true,
                }
            );

            await textChannel.permissionOverwrites.create(
                message.guild.members.me.id,
                {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true,
                    ManageChannels: true,
                }
            );

        } catch (permError) {
            logger.error('Lỗi cấu hình permission:', permError.message);
            await voiceChannel.delete().catch(() => { });
            await textChannel.delete().catch(() => { });
            return await loadingMsg.edit(
                '❌ Lỗi khi cấu hình quyền. Vui lòng thử lại!'
            );
        }

        // ========== Gửi Embed bắt đầu ==========
        const startEmbed = new EmbedBuilder()
            .setColor('#10B981')
            .setTitle('🍅 Phiên Học Bắt Đầu!')
            .setDescription(
                `Xin chào ${message.author}! 👋\n\n` +
                `⏱️ **Thời gian**: ${studyMinutes} phút\n\n` +
                `📚 Hãy tập trung cao độ và làm việc một cách hiệu quả!\n` +
                `🎵 Bạn có thể phát nhạc để tập trung hơn!\n` +
                `💪 Bạn có thể làm được điều này!`
            )
            .addFields(
                {
                    name: '🎯 Mục tiêu',
                    value: 'Tập trung cao độ và hoàn thành công việc trong khoảng thời gian này.',
                    inline: false,
                },
                {
                    name: '🎵 Phát Nhạc',
                    value: '`!study play <tên_bài_hát_hoặc_YouTube_link>`',
                    inline: false,
                },

                {
                    name: '⏸️ Điều Khiển',
                    value: '`!study skip` | `!study pause` | `!study resume` | `!study queue`',
                    inline: false,
                },
                {
                    name: '⏹️ Kết Thúc',
                    value: '`!study stop` để kết thúc phiên học',
                    inline: false,
                }
            )
            .setFooter({ text: 'Hãy làm tốt nhé! 🌟' })
            .setTimestamp();

        await textChannel.send({ embeds: [startEmbed] });

        // ========== Lưu vào Map ==========
        const timeoutId = setTimeout(() => {
            handlePomodoroEnd(message, userId, username, textChannel, voiceChannel);
        }, studyMinutes * 60 * 1000);

        activeStudySessions.set(userId, {
            startTime: Date.now(),
            textChannelId: textChannel.id,
            voiceChannelId: voiceChannel.id,
            categoryId: studyCategory.id,
            timeoutId: timeoutId,
            studyMinutes: studyMinutes,
            guildId: message.guildId,
            isPlaying: false,
        });

        // ========== Update loading message ==========
        await loadingMsg.edit({
            content: null,
            embeds: [
                new EmbedBuilder()
                    .setColor('#3B82F6')
                    .setTitle('✅ Phiên Học Đã Được Tạo!')
                    .setDescription(
                        `🎤 Voice Channel: ${voiceChannel}\n` +
                        `💬 Text Channel: ${textChannel}\n\n` +
                        `⏱️ Thời gian: **${studyMinutes}** phút\n\n` +
                        `📍 Hãy vào **${voiceChannel}** để bắt đầu!`
                    )
                    .setFooter({ text: 'Chúc bạn học tập hiệu quả! 🚀' })
                    .setTimestamp(),
            ],
        });

        // ========== Lưu vào DB (async, không chặn) ==========
        StudyModel.findOrCreate(userId, username, message.author.displayAvatarURL())
            .catch((err) => {
                logger.error('Lỗi lưu DB (findOrCreate):', err.message);
            });

    } catch (error) {
        logger.error('Lỗi handleStudyStart:', error.message);

        return safeReply(message,
            '❌ **Lỗi khi tạo phòng học**: ' + error.message
        );
    }
}

/**
 * ========== HANDLER 2: Phát Nhạc ==========
 */
async function handlePlayMusic(message, args) {
    try {
        const userId = message.author.id;

        if (!isUserStudying(userId, activeStudySessions)) {
            return safeReply(message,
                '❌ **Lỗi**: Bạn cần mở phòng học trước bằng lệnh `!study start`'
            );
        }

        const session = activeStudySessions.get(userId);

        if (!isUserInCorrectVoiceChannel(message.member, session.voiceChannelId)) {
            return safeReply(message,
                `❌ **Lỗi**: Bạn phải ở trong voice channel <#${session.voiceChannelId}> để phát nhạc!`
            );
        }

        if (args.length === 0) {
            return safeReply(message,
                '❌ Vui lòng nhập tên bài hát hoặc link YouTube!\n' +
                'Ví dụ: `!study play Never Gonna Give You Up`'
            );
        }

        const searchQuery = args.join(' ');

        const voiceChannel = await safeFetchChannel(message.guild, session.voiceChannelId);
        if (!voiceChannel) {
            return safeReply(message,
                '❌ Không thể tìm thấy voice channel!'
            );
        }

        const textChannel = await safeFetchChannel(message.guild, session.textChannelId);
        if (!textChannel) {
            return safeReply(message,
                '❌ Không thể tìm thấy text channel!'
            );
        }

        const loadingMsg = await safeReply(message,
            new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('🔍 Đang tìm bài hát...')
                .setDescription(`Đang tìm: **${searchQuery}**`)
                .setTimestamp()
        );

        try {
            await message.client.distube.play(voiceChannel, searchQuery, {
                member: message.member,
                textChannel: textChannel,
            });

            session.isPlaying = true;

            await loadingMsg.delete().catch(() => { });

        } catch (playError) {
            logger.error('DisTube play error:', playError.message);

            await loadingMsg.edit({
                embeds: [createErrorEmbed(
                    `❌ **Không thể phát bài hát**: ${playError.message}\n\n` +
                    `Hãy thử lại với tên khác hoặc link YouTube hợp lệ.`
                )]
            });
        }

    } catch (error) {
        logger.error('Lỗi handlePlayMusic:', error.message);

        return safeReply(message,
            new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ Lỗi Phát Nhạc')
                .setDescription(error.message)
                .setTimestamp()
        );
    }
}

/**
 * ========== HANDLER 3: Skip Bài Hát ==========
 */
async function handleSkip(message) {
    try {
        const userId = message.author.id;

        if (!isUserStudying(userId, activeStudySessions)) {
            return safeReply(message,
                '❌ Bạn không có phiên học nào đang hoạt động!'
            );
        }

        const session = activeStudySessions.get(userId);

        if (!isUserInCorrectVoiceChannel(message.member, session.voiceChannelId)) {
            return safeReply(message,
                `❌ Bạn phải ở trong voice channel <#${session.voiceChannelId}> để điều khiển nhạc!`
            );
        }

        try {
            const queue = message.client.distube.getQueue(message);

            if (!queue || queue.songs.length === 0) {
                return safeReply(message,
                    '❌ Không có bài hát nào đang phát!'
                );
            }

            queue.skip();

            return safeReply(message,
                new EmbedBuilder()
                    .setColor('#51CF66')
                    .setTitle('⏭️ Bỏ Qua Bài Hát')
                    .setDescription('Đã bỏ qua bài hát hiện tại.')
                    .setTimestamp()
            );

        } catch (skipError) {
            logger.error('DisTube skip error:', skipError.message);

            return safeReply(message,
                new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Lỗi')
                    .setDescription(`Không thể bỏ qua: ${skipError.message}`)
                    .setTimestamp()
            );
        }

    } catch (error) {
        logger.error('Lỗi handleSkip:', error.message);

        return safeReply(message,
            '❌ Đã xảy ra lỗi khi bỏ qua bài hát.'
        );
    }
}

/**
 * ========== HANDLER 4: Tạm Dừng Nhạc ==========
 */
async function handlePause(message) {
    try {
        const userId = message.author.id;

        if (!isUserStudying(userId, activeStudySessions)) {
            return safeReply(message,
                '❌ Bạn không có phiên học nào đang hoạt động!'
            );
        }

        const session = activeStudySessions.get(userId);

        if (!isUserInCorrectVoiceChannel(message.member, session.voiceChannelId)) {
            return safeReply(message,
                `❌ Bạn phải ở trong voice channel <#${session.voiceChannelId}>`
            );
        }

        try {
            const queue = message.client.distube.getQueue(message);

            if (!queue) {
                return safeReply(message,
                    '❌ Không có bài hát nào đang phát!'
                );
            }

            if (queue.paused) {
                return safeReply(message,
                    '❌ Nhạc đã được tạm dừng rồi! Gõ `!study resume` để tiếp tục.'
                );
            }

            queue.pause();

            return safeReply(message,
                new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('⏸️ Tạm Dừng')
                    .setDescription('Nhạc đã được tạm dừng. Gõ `!study resume` để tiếp tục.')
                    .setTimestamp()
            );

        } catch (pauseError) {
            logger.error('DisTube pause error:', pauseError.message);

            return safeReply(message,
                new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Lỗi')
                    .setDescription(`Không thể tạm dừng: ${pauseError.message}`)
                    .setTimestamp()
            );
        }

    } catch (error) {
        logger.error('Lỗi handlePause:', error.message);

        return safeReply(message,
            '❌ Đã xảy ra lỗi khi tạm dừng nhạc.'
        );
    }
}

/**
 * ========== HANDLER 5: Phát Tiếp Nhạc ==========
 */
async function handleResume(message) {
    try {
        const userId = message.author.id;

        if (!isUserStudying(userId, activeStudySessions)) {
            return safeReply(message,
                '❌ Bạn không có phiên học nào đang hoạt động!'
            );
        }

        const session = activeStudySessions.get(userId);

        if (!isUserInCorrectVoiceChannel(message.member, session.voiceChannelId)) {
            return safeReply(message,
                `❌ Bạn phải ở trong voice channel <#${session.voiceChannelId}>`
            );
        }

        try {
            const queue = message.client.distube.getQueue(message);

            if (!queue) {
                return safeReply(message,
                    '❌ Không có bài hát nào đang phát!'
                );
            }

            if (!queue.paused) {
                return safeReply(message,
                    '❌ Nhạc đang phát bình thường rồi! Gõ `!study pause` để tạm dừng.'
                );
            }

            queue.resume();

            return safeReply(message,
                new EmbedBuilder()
                    .setColor('#51CF66')
                    .setTitle('▶️ Phát Tiếp')
                    .setDescription('Nhạc đã tiếp tục phát.')
                    .setTimestamp()
            );

        } catch (resumeError) {
            logger.error('DisTube resume error:', resumeError.message);

            return safeReply(message,
                new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Lỗi')
                    .setDescription(`Không thể phát tiếp: ${resumeError.message}`)
                    .setTimestamp()
            );
        }

    } catch (error) {
        logger.error('Lỗi handleResume:', error.message);

        return safeReply(message,
            '❌ Đã xảy ra lỗi khi phát tiếp nhạc.'
        );
    }
}

/**
 * ========== HANDLER 6: Xem Queue ==========
 */
async function handleQueue(message) {
    try {
        const userId = message.author.id;

        if (!isUserStudying(userId, activeStudySessions)) {
            return safeReply(message,
                '❌ Bạn không có phiên học nào đang hoạt động!'
            );
        }

        try {
            const queue = message.client.distube.getQueue(message);

            if (!queue || queue.songs.length === 0) {
                return safeReply(message,
                    new EmbedBuilder()
                        .setColor('#FFD60A')
                        .setTitle('📋 Queue')
                        .setDescription('Queue trống! Gõ `!study play <bài_hát>` để thêm bài hát.')
                        .setTimestamp()
                );
            }

            await sendQueueEmbed(message.channel, queue);

        } catch (queueError) {
            logger.error('Error getting queue:', queueError.message);

            return safeReply(message,
                new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Lỗi')
                    .setDescription('Không thể lấy queue.')
                    .setTimestamp()
            );
        }

    } catch (error) {
        logger.error('Lỗi handleQueue:', error.message);

        return safeReply(message,
            '❌ Đã xảy ra lỗi khi lấy queue.'
        );
    }
}

/**
 * ========== HANDLER 7: Kết thúc phiên học ==========
 */
async function handleStudyStop(message) {
    try {
        const userId = message.author.id;
        const username = message.author.username;

        if (!activeStudySessions.has(userId)) {
            return safeReply(message,
                '❌ Bạn không có phiên học nào đang hoạt động!\n' +
                'Gõ `!study start` để bắt đầu một phiên học mới.'
            );
        }

        const session = activeStudySessions.get(userId);

        const studiedMs = Date.now() - session.startTime;
        const studiedMinutes = Math.round(studiedMs / (60 * 1000));

        clearTimeout(session.timeoutId);

        try {
            const queue = message.client.distube.getQueue(message);
            if (queue) {
                logger.info('🎵 Dừng phát nhạc và cleanup queue...');
                queue.stop();
                message.client.distube.stop(message);
            }
        } catch (cleanupError) {
            logger.warn('Lỗi cleanup queue:', cleanupError.message);
        }

        const textChannel = await safeFetchChannel(message.guild, session.textChannelId);
        const voiceChannel = await safeFetchChannel(message.guild, session.voiceChannelId);

        const summaryEmbed = new EmbedBuilder()
            .setColor('#10B981')
            .setTitle('✅ Phiên Học Kết Thúc')
            .setDescription(`Bạn đã tập trung được **${studiedMinutes}** phút. 🎉`)
            .addFields(
                {
                    name: '📊 Thống kê',
                    value:
                        `⏱️ Thời gian đã học: **${studiedMinutes}** phút\n` +
                        `📅 Ngày: ${new Date().toLocaleDateString('vi-VN')}\n` +
                        `⭐ Dữ liệu đã được lưu vào Bảng Xếp Hạng!`,
                    inline: false,
                },
                {
                    name: '💡 Tiếp theo',
                    value: 'Bạn có thể tiếp tục học bằng cách gõ `!study start` để bắt đầu một phiên học mới!',
                    inline: false,
                }
            )
            .setFooter({ text: 'Chúc mừng bạn đã hoàn thành phiên học!' })
            .setTimestamp();

        if (textChannel) {
            await textChannel.send({
                content: `${message.author} kênh sẽ đóng sau 10 giây...\n\n`,
                embeds: [summaryEmbed],
            }).catch(() => { });
        }

        try {
            const user = await StudyModel.findOrCreate(userId, username);
            await user.addStudyTime(studiedMinutes);
        } catch (dbError) {
            logger.error('Lỗi lưu DB (stop):', dbError.message);
        }

        activeStudySessions.delete(userId);

        setTimeout(async () => {
            try {
                if (textChannel) {
                    await textChannel.delete({ reason: 'Phiên học kết thúc' });
                }
                if (voiceChannel) {
                    await voiceChannel.delete({ reason: 'Phiên học kết thúc' });
                }
            } catch (deleteError) {
                logger.error('Lỗi xóa channel:', deleteError.message);
            }
        }, 10000);

        return safeReply(message,
            `✅ Phiên học của bạn đã kết thúc. Đã lưu **${studiedMinutes}** phút!`
        );

    } catch (error) {
        logger.error('Lỗi handleStudyStop:', error.message);

        return safeReply(message,
            '❌ **Lỗi khi kết thúc phiên học**: ' + error.message
        );
    }
}

/**
 * ========== HANDLER 8: Xử lý khi Pomodoro hết thời gian ==========
 */
async function handlePomodoroEnd(
    message,
    userId,
    username,
    textChannel,
    voiceChannel
) {
    try {
        try {
            const queue = message.client.distube.getQueue(message);
            if (queue) {
                logger.info('🎵 Pomodoro end: Cleanup queue...');
                queue.stop();
                message.client.distube.stop(message);
            }
        } catch (cleanupError) {
            logger.warn('Lỗi cleanup queue trong pomodoro end:', cleanupError.message);
        }

        const endEmbed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('⏰ Hết Thời Gian!')
            .setDescription(
                `<@${userId}>, phiên học của bạn đã kết thúc! 🎉\n\n` +
                `Hãy nghỉ ngơi **5 phút** trước khi tiếp tục học nhé!`
            )
            .addFields({
                name: '💡 Gợi ý',
                value: 'Hãy đứng dậy, uống nước, và đi bộ một chút để giải tỏa căng thẳng.',
                inline: false,
            })
            .setFooter({ text: 'Chuẩn bị để bắt đầu phiên tiếp theo!' })
            .setTimestamp();

        await textChannel.send({ embeds: [endEmbed] }).catch(() => { });

        try {
            const session = activeStudySessions.get(userId);
            if (session) {
                const studyMinutes = session.studyMinutes;
                const user = await StudyModel.findOrCreate(userId, username);
                await user.addStudyTime(studyMinutes);
            }
        } catch (dbError) {
            logger.error('Lỗi lưu DB (endSession):', dbError.message);
        }

        activeStudySessions.delete(userId);

        setTimeout(async () => {
            try {
                await textChannel.delete({ reason: 'Phiên học kết thúc' });
                await voiceChannel.delete({ reason: 'Phiên học kết thúc' });
            } catch (deleteError) {
                logger.error('Lỗi xóa channel:', deleteError.message);
            }
        }, 10000);

    } catch (error) {
        logger.error('Lỗi handlePomodoroEnd:', error.message);
    }
}

/**
 * ========== HANDLER 9: Xem thống kê ==========
 */
async function handleStudyStats(message) {
    try {
        const userId = message.author.id;
        const username = message.author.username;

        const user = await StudyModel.findOrCreate(userId, username);
        const { hours, minutes } = user.getFormattedTime();

        const statsEmbed = new EmbedBuilder()
            .setColor('#3B82F6')
            .setTitle('📊 Thống Kê Học Tập')
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .addFields(
                {
                    name: '👤 Người dùng',
                    value: username,
                    inline: true,
                },
                {
                    name: '⏱️ Tổng Thời Gian',
                    value: `**${hours}h ${minutes}m**`,
                    inline: true,
                },
                {
                    name: '📚 Số Phiên Học',
                    value: `**${user.studySessions}** phiên`,
                    inline: true,
                },
                {
                    name: '📅 Lần Học Gần Nhất',
                    value: user.lastStudiedAt
                        ? `<t:${Math.floor(user.lastStudiedAt.getTime() / 1000)}:R>`
                        : 'Chưa học',
                    inline: true,
                },
                {
                    name: '🌟 Bắt Đầu Từ',
                    value: user.firstStudiedAt
                        ? user.firstStudiedAt.toLocaleDateString('vi-VN')
                        : 'N/A',
                    inline: true,
                },
                {
                    name: '🔥 Streak',
                    value: `${user.currentStreak} ngày (Kỉ lục: ${user.longestStreak} ngày)`,
                    inline: true,
                }
            )
            .setFooter({
                text: 'Dữ liệu này được đồng bộ với Web Dashboard',
            })
            .setTimestamp();

        return safeReply(message, { embeds: [statsEmbed] });

    } catch (error) {
        logger.error('Lỗi handleStudyStats:', error.message);

        return safeReply(message,
            '❌ **Lỗi khi lấy thống kê**: ' + error.message
        );
    }
}


// ╔══════════════════════════════════════════════════════════════════════╗
// ║  ★ CẬP NHẬT — Help Embed (thêm mục ask)                          ║
// ╚══════════════════════════════════════════════════════════════════════╝

function getStudyHelpEmbed() {
    return new EmbedBuilder()
        .setColor('#3B82F6')
        .setTitle('📚 Hướng Dẫn Lệnh !study')
        .setDescription(
            'Biến server Discord thành không gian học tập hiệu quả với Pomodoro Timer + Điều Khiển Nhạc + AI Cố vấn'
        )
        .addFields(
            {
                name: '🚀 Bắt Đầu Phiên Học',
                value:
                    '```\n!study start [thời_gian_phút]\n```\n' +
                    '**Mặc định**: 25 phút (Pomodoro tiêu chuẩn)\n' +
                    '**Ví dụ**: `!study start 45`',
                inline: false,
            },
            {
                name: '🎵 Phát Nhạc',
                value:
                    '```\n!study play <tên_bài_hát_hoặc_YouTube_link>\n```\n' +
                    '**Ví dụ**: `!study play Never Gonna Give You Up`',
                inline: false,
            },
            {
                name: '⏭️ Skip / Pause / Resume',
                value:
                    '```\n!study skip     # Bỏ qua bài hiện tại\n' +
                    '!study pause    # Tạm dừng\n' +
                    '!study resume   # Phát tiếp\n```',
                inline: false,
            },
            {
                name: '📋 Xem Queue',
                value:
                    '```\n!study queue\n```\n' +
                    'Xem danh sách các bài hát trong queue.',
                inline: false,
            },
            {
                name: '⏹️ Kết Thúc Phiên Học',
                value:
                    '```\n!study stop\n```\n' +
                    'Kết thúc phiên học và lưu thời gian.',
                inline: false,
            },
            {
                name: '📊 Xem Thống Kê',
                value:
                    '```\n!study stats\n```\n' +
                    'Xem tổng thời gian học, số phiên học, và dữ liệu khác.',
                inline: false,
            },
            {
                name: '💡 Tính Năng Chính',
                value:
                    '✅ Tạo phòng học riêng tư (Voice + Text Channel)\n' +
                    '✅ Pomodoro Timer tự động\n' +
                    '✅ Phát nhạc từ YouTube / Spotify / SoundCloud\n' +
                    '✅ Điều khiển nhạc (skip, pause, resume, queue)\n' +
                    '✅ Lưu lịch sử học tập vào Database\n' +
                    '✅ Tính toán tổng thời gian học\n' +
                    '✅ Hỗ trợ Web Dashboard',
                inline: false,
            }
        )
        .setFooter({
            text: 'Hãy học tập một cách hiệu quả! 📚✨',
        });
}