const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

module.exports = {
    name: 'spam',
    description: '⚠️ Spam messages (Admin only)',
    aliases: ['sp'],
    usage: 'spam <start|stop|status|config> [@user1] [@user2] [interval] [lines]',
    adminOnly: true,
    cooldown: 0,

    async execute(message, args, client) {
        const { author, guild, channel, mentions } = message;

        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('❌ Chỉ Administrator mới có thể dùng lệnh này!');
        }

        const subcommand = args[0]?.toLowerCase();

        if (!subcommand) {
            return message.reply(
                `❌ Sử dụng: \`${this.usage}\`\n\n` +
                '**Subcommands:**\n' +
                '`spam start @user1 [@user2] [interval] [lines]` - Bắt đầu spam\n' +
                '`spam stop` - Dừng spam\n' +
                '`spam status` - Kiểm tra trạng thái\n' +
                '`spam config` - Xem cấu hình'
            );
        }

        try {
            switch (subcommand) {
                case 'start': {
                    if (global.spamInterval) {
                        return message.reply('⚠️ Spam đang chạy! Dùng `!spam stop` để dừng.');
                    }

                    const targetUsers = [];
                    mentions.users.forEach(user => {
                        if (!user.bot) {
                            targetUsers.push(user.id);
                        }
                    });

                    if (targetUsers.length === 0) {
                        return message.reply('❌ Vui lòng mention ít nhất 1 user! Ví dụ: `!spam start @user1 @user2`');
                    }

                    const cleanArgs = args.slice(1).filter(arg => !arg.startsWith('<@'));

                    let interval = 8; 
                    let numLines = 10; 

                    if (cleanArgs.length >= 1) {
                        const possibleInterval = parseInt(cleanArgs[0]);
                        if (!isNaN(possibleInterval) && possibleInterval > 0 && possibleInterval <= 60) {
                            interval = possibleInterval;
                        }
                    }

                    if (cleanArgs.length >= 2) {
                        const possibleLines = parseInt(cleanArgs[1]);
                        if (!isNaN(possibleLines) && possibleLines > 0 && possibleLines <= 20) {
                            numLines = possibleLines;
                        }
                    }

                    const configPath = path.join(__dirname, './cache/spam.json');

                    if (!fs.existsSync(configPath)) {
                        return message.reply(
                            '❌ Không tìm thấy file `cache/spam.json`!\n\n' +
                            '💡 Tạo thư mục `cache` và file `spam.json` với nội dung:\n' +
                            '```json\n' +
                            '{\n' +
                            '  "messages": ["Message 1", "Message 2", "Message 3"],\n' +
                            '  "pingPosition": "end",\n' +
                            '  "isRandom": false,\n' +
                            '  "interval": 8,\n' +
                            '  "numLines": 10\n' +
                            '}\n' +
                            '```'
                        );
                    }

                    let config;
                    try {
                        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                    } catch (error) {
                        return message.reply(`❌ Lỗi đọc file config: \`${error.message}\``);
                    }

                    if (!config.messages || !Array.isArray(config.messages) || config.messages.length === 0) {
                        return message.reply('❌ Config thiếu hoặc sai `messages` array!');
                    }

                    const { messages, pingPosition = 'end', isRandom = false } = config;

                    const pingString = targetUsers.map(id => `<@${id}>`).join(' ');

                    const targetUsersInfo = await Promise.all(
                        targetUsers.map(async id => {
                            try {
                                const u = await client.users.fetch(id);
                                return u.username;
                            } catch {
                                return `User ${id}`;
                            }
                        })
                    );

                    const warningEmbed = new EmbedBuilder()
                        .setColor('#FF9800')
                        .setTitle('⚠️ CẢNH BÁO: BẮT ĐẦU SPAM')
                        .setDescription(
                            '╭─────────────────╮\n' +
                            '│ **SPAM CONFIGURATION**\n' +
                            '╰─────────────────╯'
                        )
                        .addFields(
                            { name: '📍 Channel', value: `<#${channel.id}>`, inline: true },
                            { name: '👥 Targets', value: `${targetUsers.length} users`, inline: true },
                            { name: '💬 Pool', value: `${messages.length} messages`, inline: true },
                            { name: '📊 Lines/Message', value: `${numLines}`, inline: true },
                            { name: '⏱️ Interval', value: `${interval}s`, inline: true },
                            { name: '🔀 Random', value: isRandom ? '✅ Yes' : '❌ No', inline: true },
                            { name: '👤 Target Users', value: targetUsersInfo.join(', '), inline: false }
                        )
                        .setFooter({ text: 'Spam sẽ bắt đầu sau 3 giây...' })
                        .setTimestamp();

                    await message.reply({ embeds: [warningEmbed] });

                    await new Promise(resolve => setTimeout(resolve, 3000));

                    let messageCount = 0;
                    let errorCount = 0;

                    global.spamInfo = {
                        channelId: channel.id,
                        guildId: guild.id,
                        targets: targetUsers,
                        startedAt: Date.now(),
                        startedBy: author.id,
                        messageCount: 0,
                        interval: interval,
                        numLines: numLines
                    };

                    global.spamInterval = setInterval(async () => {
                        try {
                            let selectedMessages;

                            if (isRandom) {
                                selectedMessages = [];
                                for (let i = 0; i < numLines; i++) {
                                    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
                                    selectedMessages.push(randomMsg);
                                }
                            } else {
                                const startIndex = messageCount * numLines % messages.length;
                                selectedMessages = [];
                                for (let i = 0; i < numLines; i++) {
                                    const index = (startIndex + i) % messages.length;
                                    selectedMessages.push(messages[index]);
                                }
                            }

                            const formattedLines = selectedMessages.map(msg => `> # ${msg}`).join('\n');

                            let finalMessage;
                            if (pingPosition === 'start') {
                                finalMessage = `${pingString}\n${formattedLines}`;
                            } else if (pingPosition === 'end') {
                                finalMessage = `${formattedLines}\n${pingString}`;
                            } else {
                                finalMessage = formattedLines;
                            }

                            await channel.send({
                                content: finalMessage,
                                allowedMentions: { parse: ['users'] }
                            });

                            messageCount++;
                            global.spamInfo.messageCount = messageCount;
                            errorCount = 0;

                            logger.info(`Spam #${messageCount} sent | Targets: ${targetUsersInfo.join(', ')}`);

                        } catch (error) {
                            errorCount++;
                            logger.error('Spam error:', error);

                            if (errorCount >= 3 ||
                                error.code === 50013 || 
                                error.code === 50001 || 
                                error.code === 429) {   

                                clearInterval(global.spamInterval);
                                global.spamInterval = null;
                                global.spamInfo = null;

                                const errorEmbed = new EmbedBuilder()
                                    .setColor('#F44336')
                                    .setTitle('❌ Spam đã dừng')
                                    .setDescription(
                                        `**Lý do:** ${error.message}\n\n` +
                                        `**Thông tin:**\n` +
                                        `• Messages sent: ${messageCount}\n` +
                                        `• Error code: ${error.code || 'Unknown'}`
                                    )
                                    .setTimestamp();

                                channel.send({ embeds: [errorEmbed] }).catch(() => { });
                            }
                        }
                    }, interval * 1000);

                    const startEmbed = new EmbedBuilder()
                        .setColor('#4CAF50')
                        .setTitle('✅ Spam đã bắt đầu!')
                        .setDescription(
                            `Spam đang chạy trong <#${channel.id}>\n\n` +
                            `💡 Dùng \`!spam stop\` để dừng\n` +
                            `📊 Dùng \`!spam status\` để xem trạng thái`
                        )
                        .setTimestamp();

                    await message.channel.send({ embeds: [startEmbed] });

                    logger.info(`Spam started by ${author.tag} in ${guild.name}`);
                    break;
                }

                case 'stop': {
                    if (!global.spamInterval) {
                        return message.reply('⚠️ Không có spam nào đang chạy!');
                    }

                    const messagesSent = global.spamInfo?.messageCount || 0;
                    const duration = global.spamInfo?.startedAt ?
                        Math.floor((Date.now() - global.spamInfo.startedAt) / 1000) : 0;

                    clearInterval(global.spamInterval);
                    global.spamInterval = null;
                    global.spamInfo = null;

                    const stopEmbed = new EmbedBuilder()
                        .setColor('#F44336')
                        .setTitle('⛔ Spam đã dừng')
                        .setDescription(
                            `╭─────────────────╮\n` +
                            `│ **SPAM SUMMARY**\n` +
                            `╰─────────────────╯\n\n` +
                            `📤 **Messages sent:** ${messagesSent}\n` +
                            `⏱️ **Duration:** ${duration}s\n` +
                            `🛑 **Stopped by:** ${author.username}`
                        )
                        .setTimestamp();

                    await message.reply({ embeds: [stopEmbed] });

                    logger.info(`Spam stopped by ${author.tag}`);
                    break;
                }

                case 'status': {
                    if (!global.spamInterval || !global.spamInfo) {
                        return message.reply('⚠️ Không có spam nào đang chạy.');
                    }

                    const duration = Math.floor((Date.now() - global.spamInfo.startedAt) / 1000);
                    const minutes = Math.floor(duration / 60);
                    const seconds = duration % 60;

                    const startedBy = await client.users.fetch(global.spamInfo.startedBy).catch(() => null);

                    const statusEmbed = new EmbedBuilder()
                        .setColor('#2196F3')
                        .setTitle('📊 Spam Status')
                        .setDescription(
                            `╭─────────────────╮\n` +
                            `│ **ACTIVE SPAM**\n` +
                            `╰─────────────────╯`
                        )
                        .addFields(
                            { name: '📍 Channel', value: `<#${global.spamInfo.channelId}>`, inline: true },
                            { name: '👥 Targets', value: `${global.spamInfo.targets.length} users`, inline: true },
                            { name: '📤 Messages', value: `${global.spamInfo.messageCount}`, inline: true },
                            { name: '⏱️ Duration', value: `${minutes}m ${seconds}s`, inline: true },
                            { name: '⚡ Interval', value: `${global.spamInfo.interval}s`, inline: true },
                            { name: '📊 Lines', value: `${global.spamInfo.numLines}`, inline: true },
                            { name: '👤 Started by', value: startedBy ? startedBy.username : 'Unknown', inline: false }
                        )
                        .setFooter({ text: 'Use !spam stop to stop' })
                        .setTimestamp();

                    await message.reply({ embeds: [statusEmbed] });
                    break;
                }

                case 'config': {
                    const configPath = path.join(__dirname, '../cache/spam.json');

                    if (!fs.existsSync(configPath)) {
                        return message.reply('❌ Không tìm thấy file config!');
                    }

                    let config;
                    try {
                        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                    } catch (error) {
                        return message.reply(`❌ Lỗi đọc config: \`${error.message}\``);
                    }

                    const configEmbed = new EmbedBuilder()
                        .setColor('#9C27B0')
                        .setTitle('⚙️ Spam Configuration')
                        .setDescription(
                            `╭─────────────────╮\n` +
                            `│ **CONFIG FILE**\n` +
                            `╰─────────────────╯\n\n` +
                            `📄 **Path:** \`cache/spam.json\``
                        )
                        .addFields(
                            { name: '💬 Messages', value: `${config.messages?.length || 0} lines`, inline: true },
                            { name: '📍 Ping Position', value: config.pingPosition || 'end', inline: true },
                            { name: '🔀 Random', value: config.isRandom ? '✅ Yes' : '❌ No', inline: true },
                            { name: '📊 Lines/Message', value: `${config.numLines || 10}`, inline: true },
                            { name: '⏱️ Interval', value: `${config.interval || 8}s`, inline: true },
                            {
                                name: '📝 Preview (First 3 Messages)',
                                value: config.messages ?
                                    config.messages.slice(0, 3).map((m, i) => `${i + 1}. \`${m.substring(0, 40)}...\``).join('\n')
                                    : 'N/A',
                                inline: false
                            }
                        )
                        .setFooter({ text: 'Edit cache/spam.json to change config' })
                        .setTimestamp();

                    await message.reply({ embeds: [configEmbed] });
                    break;
                }

                default:
                    return message.reply(
                        `❌ Subcommand không tồn tại: \`${subcommand}\`\n` +
                        `Sử dụng: \`${this.usage}\``
                    );
            }

            logger.info(`Command: ${author.tag} used spam ${subcommand}`);

        } catch (error) {
            logger.error('Spam command error:', error);

            const errorEmbed = new EmbedBuilder()
                .setColor('#F44336')
                .setTitle('❌ Lỗi')
                .setDescription(`\`\`\`${error.message}\`\`\``)
                .setTimestamp();

            await message.reply({ embeds: [errorEmbed] });
        }
    },
};