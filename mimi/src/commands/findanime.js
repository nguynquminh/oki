const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

module.exports = {
    name: 'findanime',
    description: '🔍 Tìm anime từ hình ảnh (trace.moe)',
    aliases: ['anime', 'fa', 'findsauce'],
    usage: 'findanime [url] hoặc reply/attach ảnh rồi dùng !findanime',
    cooldown: 10,

    async execute(message, args, client) {
        const { author, channel } = message;

        try {
            let imageUrl;

            if (message.reference) {
                try {
                    const repliedTo = await message.channel.messages.fetch(message.reference.messageId);

                    if (repliedTo.attachments.size > 0) {
                        const attachment = repliedTo.attachments.first();
                        if (attachment.contentType?.startsWith('image/')) {
                            imageUrl = attachment.url;
                        }
                    }
                } catch (err) {
                    logger.debug('Error fetching replied message:', err.message);
                }
            }

            if (!imageUrl && message.attachments.size > 0) {
                const attachment = message.attachments.first();
                if (attachment.contentType?.startsWith('image/')) {
                    imageUrl = attachment.url;
                } else {
                    return message.reply('❌ Chỉ hỗ trợ file ảnh (jpg, png, gif, webp)!');
                }
            }

            if (!imageUrl && args.length > 0) {
                const urlArg = args[0];
                if (urlArg.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i)) {
                    imageUrl = urlArg;
                } else {
                    return message.reply(
                        '❌ URL không hợp lệ! Vui lòng cung cấp link ảnh trực tiếp.\n\n' +
                        '**Ví dụ:**\n' +
                        '`!findanime https://example.com/anime.jpg`'
                    );
                }
            }

            if (!imageUrl) {
                return message.reply(
                    '❌ Vui lòng cung cấp ảnh hoặc URL ảnh!\n\n' +
                    '**Cách dùng:**\n' +
                    '• `!findanime` (reply ảnh hoặc attach ảnh)\n' +
                    '• `!findanime https://example.com/anime.jpg` (URL ảnh)\n\n' +
                    '**Tips:**\n' +
                    '• Sử dụng ảnh rõ nét\n' +
                    '• Chọn cảnh anime rõ ràng\n' +
                    '• Tránh ảnh có watermark lớn'
                );
            }

            const searchEmbed = new EmbedBuilder()
                .setColor('#FF6B9D')
                .setTitle('🔍 Đang tìm kiếm anime...')
                .setDescription('Vui lòng đợi trong giây lát...')
                .setThumbnail(imageUrl)
                .setFooter({ text: 'Powered by trace.moe' })
                .setTimestamp();

            const searchMsg = await message.reply({ embeds: [searchEmbed] });

            let data;
            try {
                const response = await axios.get(
                    `https://api.trace.moe/search?url=${encodeURIComponent(imageUrl)}`,
                    { timeout: 30000 }
                );
                data = response.data;
            } catch (apiError) {
                throw apiError;
            }

            if (!data.result || data.result.length === 0) {
                const notFoundEmbed = new EmbedBuilder()
                    .setColor('#F44336')
                    .setTitle('❌ Không tìm thấy')
                    .setDescription(
                        'Không thể tìm thấy anime từ hình ảnh này!\n\n' +
                        '💡 **Tips:**\n' +
                        '• Sử dụng ảnh rõ nét hơn\n' +
                        '• Chọn cảnh anime rõ ràng\n' +
                        '• Tránh ảnh có watermark quá lớn'
                    )
                    .setThumbnail(imageUrl)
                    .setTimestamp();

                return searchMsg.edit({ embeds: [notFoundEmbed] });
            }

            const formatTime = (seconds) => {
                const hrs = Math.floor(seconds / 3600);
                const mins = Math.floor((seconds % 3600) / 60);
                const secs = Math.floor(seconds % 60);
                return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            };

            const resultsToShow = data.result.slice(0, 3);

            const summaryEmbed = new EmbedBuilder()
                .setColor('#4CAF50')
                .setTitle('✅ Tìm thấy kết quả!')
                .setDescription(
                    `╭─────────────────╮\n` +
                    `│ **${data.result.length}** kết quả được tìm thấy\n` +
                    `│ Hiển thị **${resultsToShow.length}** kết quả tốt nhất\n` +
                    `╰─────────────────╯\n\n` +
                    `> 💡 Đang gửi chi tiết...`
                )
                .setThumbnail(imageUrl)
                .setFooter({ text: `Yêu cầu bởi ${author.username}`, iconURL: author.displayAvatarURL() })
                .setTimestamp();

            await searchMsg.edit({ embeds: [summaryEmbed] });

            const cachePath = path.join(__dirname, '../cache/anime');
            if (!fs.existsSync(cachePath)) {
                fs.mkdirSync(cachePath, { recursive: true });
            }

            for (let i = 0; i < resultsToShow.length; i++) {
                const result = resultsToShow[i];
                const {
                    filename,
                    episode,
                    similarity,
                    from,
                    to,
                    video,
                    anilist
                } = result;

                const animeTitle = anilist?.title?.native ||
                    anilist?.title?.romaji ||
                    anilist?.title?.english ||
                    filename;

                const animeEpisodes = anilist?.episodes || 'N/A';
                const animeYear = anilist?.season && anilist?.seasonYear ?
                    `${anilist.season} ${anilist.seasonYear}` : 'N/A';
                const animeFormat = anilist?.format || 'N/A';

                const simColor = similarity > 0.9 ? '#4CAF50' :
                    similarity > 0.8 ? '#FF9800' : '#F44336';

                const resultEmbed = new EmbedBuilder()
                    .setColor(simColor)
                    .setAuthor({
                        name: `Kết quả #${i + 1}/${resultsToShow.length}`,
                        iconURL: author.displayAvatarURL()
                    })
                    .setTitle(`📺 ${animeTitle}`)
                    .setURL(`https://anilist.co/anime/${anilist?.id || ''}`)
                    .setDescription(
                        `╭─────────────────╮\n` +
                        `│ **THÔNG TIN ANIME**\n` +
                        `╰─────────────────╯`
                    )
                    .addFields(
                        {
                            name: '📊 Độ chính xác',
                            value: `${(similarity * 100).toFixed(2)}%`,
                            inline: true
                        },
                        {
                            name: '📖 Tập',
                            value: episode ? `Tập ${episode}` : 'Không rõ',
                            inline: true
                        },
                        {
                            name: '⏱️ Thời điểm',
                            value: `${formatTime(from)} - ${formatTime(to)}`,
                            inline: true
                        },
                        {
                            name: '📅 Phát sóng',
                            value: animeYear,
                            inline: true
                        },
                        {
                            name: '🎬 Định dạng',
                            value: animeFormat,
                            inline: true
                        },
                        {
                            name: '📚 Tổng tập',
                            value: animeEpisodes.toString(),
                            inline: true
                        }
                    )
                    .setFooter({
                        text: `trace.moe API • ${similarity > 0.85 ? 'Video preview available' : 'Low quality'}`
                    })
                    .setTimestamp();

                if (anilist?.coverImage?.large) {
                    resultEmbed.setThumbnail(anilist.coverImage.large);
                }

                if (video && similarity > 0.85) {
                    try {
                        logger.info(`Downloading video preview for result #${i + 1}...`);

                        const videoPath = path.join(cachePath, `trace_${Date.now()}_${i}.mp4`);
                        const response = await axios.get(video, {
                            responseType: 'stream',
                            timeout: 30000
                        });

                        const writer = fs.createWriteStream(videoPath);
                        response.data.pipe(writer);

                        await new Promise((resolve, reject) => {
                            writer.on('finish', resolve);
                            writer.on('error', reject);
                            setTimeout(() => reject(new Error('Timeout')), 30000);
                        });

                        const videoAttachment = new AttachmentBuilder(videoPath, {
                            name: `preview_${i + 1}.mp4`
                        });

                        await channel.send({
                            embeds: [resultEmbed],
                            files: [videoAttachment]
                        });

                        fs.unlinkSync(videoPath);
                        logger.info(`Video preview #${i + 1} sent successfully`);

                    } catch (videoError) {
                        logger.error(`Video download error for result #${i + 1}:`, videoError.message);

                        resultEmbed.setFooter({
                            text: 'trace.moe API • Video preview unavailable'
                        });
                        await channel.send({ embeds: [resultEmbed] });
                    }
                } else {
                    await channel.send({ embeds: [resultEmbed] });
                }

                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            if (data.result.length > 3) {
                const moreEmbed = new EmbedBuilder()
                    .setColor('#2196F3')
                    .setTitle('ℹ️ Thông tin thêm')
                    .setDescription(
                        `Có thêm **${data.result.length - 3}** kết quả khác với độ chính xác thấp hơn.\n\n` +
                        `> 💡 Chỉ hiển thị 3 kết quả tốt nhất để tránh spam!`
                    )
                    .setTimestamp();

                await channel.send({ embeds: [moreEmbed] });
            }

            const completeEmbed = new EmbedBuilder()
                .setColor('#4CAF50')
                .setTitle('✅ Hoàn thành!')
                .setDescription(
                    `Đã gửi **${resultsToShow.length}** kết quả.\n\n` +
                    `> 💡 Nếu không chính xác, thử với ảnh khác rõ hơn!`
                )
                .setFooter({ text: `Yêu cầu bởi ${author.username}` })
                .setTimestamp();

            await channel.send({ embeds: [completeEmbed] });

            logger.info(`Command: ${author.tag} used findanime in ${message.guild?.name || 'DM'}`);

        } catch (error) {
            logger.error('Find anime error:', error);

            let errorMessage = 'Có lỗi xảy ra khi tìm kiếm anime!';

            if (error.response?.status === 429) {
                errorMessage = '⚠️ API đang bị rate limit! Vui lòng thử lại sau 1 phút.';
            } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                errorMessage = '⏱️ Timeout! API phản hồi quá lâu, vui lòng thử lại.';
            } else if (error.response?.status === 503) {
                errorMessage = '🔧 API trace.moe đang bảo trì. Vui lòng thử lại sau.';
            } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
                errorMessage = '🌐 Không thể kết nối tới trace.moe! Kiểm tra kết nối internet.';
            }

            const errorEmbed = new EmbedBuilder()
                .setColor('#F44336')
                .setTitle('❌ Lỗi')
                .setDescription(
                    `${errorMessage}\n\n` +
                    `**Chi tiết:** \`${error.message}\`\n\n` +
                    `💡 **Giải pháp:**\n` +
                    `• Kiểm tra lại URL ảnh\n` +
                    `• Thử với ảnh khác\n` +
                    `• Đợi 1 phút rồi thử lại`
                )
                .setTimestamp();

            await message.reply({ embeds: [errorEmbed] });
        }
    },
};