const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

module.exports = {
    name: 'dragonball',
    description: '⚡ Xem thông tin nhân vật Dragon Ball',
    aliases: ['db', 'dbz'],
    usage: 'dragonball <list|info|search> [name/id]',
    cooldown: 5,

    async execute(message, args, client) {
        const { author, channel } = message;

        const CACHE_DIR = path.join(__dirname, '../cache/dragonball');
        if (!fs.existsSync(CACHE_DIR)) {
            fs.mkdirSync(CACHE_DIR, { recursive: true });
        }

        const downloadImage = async (url, filename) => {
            const filePath = path.join(CACHE_DIR, `${filename}.jpg`);

            for (let retry = 0; retry < 3; retry++) {
                try {
                    const response = await axios({
                        method: 'GET',
                        url: url,
                        responseType: 'stream',
                        timeout: 15000
                    });

                    const writer = fs.createWriteStream(filePath);
                    response.data.pipe(writer);

                    return new Promise((resolve, reject) => {
                        writer.on('finish', () => resolve(filePath));
                        writer.on('error', reject);
                        setTimeout(() => reject(new Error('Timeout')), 15000);
                    });
                } catch (err) {
                    if (retry === 2) throw err;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        };

        const showCharacterList = async () => {
            try {
                const searchMsg = await message.reply('🔍 Đang tải danh sách nhân vật...');

                const response = await axios.get('https://dragonball-api.com/api/characters?limit=70');
                const characters = response.data.items;

                const embedArray = [];
                const itemsPerPage = 20;

                for (let i = 0; i < characters.length; i += itemsPerPage) {
                    const pageChars = characters.slice(i, i + itemsPerPage);
                    const page = Math.floor(i / itemsPerPage) + 1;
                    const totalPages = Math.ceil(characters.length / itemsPerPage);

                    let charList = '';
                    pageChars.forEach((char, idx) => {
                        charList += `\`${char.id}\` - ${char.name}\n`;
                    });

                    const embed = new EmbedBuilder()
                        .setColor('#F7B801')
                        .setTitle(`📋 DANH SÁCH NHÂN VẬT DRAGON BALL`)
                        .setDescription(charList)
                        .setFooter({
                            text: `Trang ${page}/${totalPages} • Tổng cộng: ${characters.length} nhân vật`
                        })
                        .setTimestamp();

                    embedArray.push(embed);
                }

                await searchMsg.edit({
                    content: '💡 **Sử dụng:** `!dragonball info [ID]` để xem chi tiết',
                    embeds: [embedArray[0]]
                });

                for (let i = 1; i < embedArray.length; i++) {
                    await channel.send({ embeds: [embedArray[i]] });
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

            } catch (error) {
                logger.error('Character list error:', error);
                await message.reply('❌ Lỗi khi tải danh sách nhân vật!');
            }
        };

        const showCharacterInfo = async (charId) => {
            try {
                const searchMsg = await message.reply('🔍 Đang tải thông tin nhân vật...');

                const response = await axios.get(`https://dragonball-api.com/api/characters/${charId}`);
                const char = response.data;

                const infoEmbed = new EmbedBuilder()
                    .setColor('#F7B801')
                    .setTitle(`⚡ ${char.name} ⚡`)
                    .setThumbnail(char.image)
                    .addFields(
                        { name: '🆔 ID', value: char.id.toString(), inline: true },
                        { name: '👤 Giới tính', value: char.gender || 'Không xác định', inline: true },
                        { name: '🧬 Chủng tộc', value: char.race || 'Không xác định', inline: true },
                        { name: '💥 Sức mạnh', value: char.ki || 'Không xác định', inline: true },
                        { name: '💫 Sức mạnh tối đa', value: char.maxKi || 'Không xác định', inline: true },
                        { name: '🏷️ Phe phái', value: char.affiliation || 'Không xác định', inline: true }
                    );

                if (char.description) {
                    const desc = char.description.substring(0, 1024);
                    infoEmbed.addFields({
                        name: '📝 Mô tả',
                        value: desc || '✨ Không có mô tả',
                        inline: false
                    });
                }

                if (char.transformations?.length > 0) {
                    infoEmbed.addFields({
                        name: '✨ Biến hình',
                        value: `Có **${char.transformations.length}** dạng biến hình`,
                        inline: false
                    });
                }

                infoEmbed
                    .setFooter({ text: `Yêu cầu bởi ${author.username}` })
                    .setTimestamp();

                try {
                    const charImagePath = await downloadImage(char.image, `char_${char.id}_${Date.now()}`);
                    const attachment = new AttachmentBuilder(charImagePath, { name: 'character.jpg' });

                    await searchMsg.edit({
                        content: null,
                        embeds: [infoEmbed],
                        files: [attachment]
                    });

                    setTimeout(() => {
                        try {
                            fs.unlinkSync(charImagePath);
                        } catch (err) {
                            logger.debug('Cleanup error:', err.message);
                        }
                    }, 5000);

                } catch (imgErr) {
                    logger.error('Image download error:', imgErr);
                    await searchMsg.edit({ embeds: [infoEmbed] });
                }

                if (char.transformations?.length > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    const confirmMsg = await channel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('#FF6B35')
                                .setTitle('✨ Hiển thị biến hình')
                                .setDescription(`Nhân vật này có **${char.transformations.length}** biến hình. Bắt đầu hiển thị...`)
                                .setTimestamp()
                        ]
                    });

                    for (let i = 0; i < char.transformations.length; i++) {
                        const trans = char.transformations[i];
                        try {
                            const tranImagePath = await downloadImage(
                                trans.image,
                                `trans_${char.id}_${i}_${Date.now()}`
                            );

                            const transEmbed = new EmbedBuilder()
                                .setColor('#FF6B35')
                                .setTitle(`✨ ${char.name} - ${trans.name}`)
                                .addFields(
                                    { name: '💥 Sức mạnh', value: trans.ki || 'Không xác định', inline: true },
                                    { name: '📊 Thứ tự', value: `${i + 1}/${char.transformations.length}`, inline: true }
                                )
                                .setImage('attachment://transformation.jpg')
                                .setFooter({ text: 'Dragon Ball API' })
                                .setTimestamp();

                            const transAttachment = new AttachmentBuilder(tranImagePath, {
                                name: 'transformation.jpg'
                            });

                            await channel.send({
                                embeds: [transEmbed],
                                files: [transAttachment]
                            });

                            fs.unlinkSync(tranImagePath);

                            await new Promise(resolve => setTimeout(resolve, 1200));

                        } catch (transErr) {
                            logger.error(`Transformation ${i} error:`, transErr);
                            await channel.send({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor('#F44336')
                                        .setDescription(`❌ Không thể tải biến hình: ${trans.name}`)
                                ]
                            });
                        }
                    }

                    await channel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('#4CAF50')
                                .setTitle('✅ Hoàn thành')
                                .setDescription(`Đã hiển thị tất cả **${char.transformations.length}** biến hình của ${char.name}`)
                                .setTimestamp()
                        ]
                    });
                }

            } catch (error) {
                logger.error('Character info error:', error);

                let errorMsg = '❌ Không tìm thấy nhân vật!';
                if (error.response?.status === 404) {
                    errorMsg = '❌ ID nhân vật không tồn tại!';
                } else if (error.message.includes('timeout')) {
                    errorMsg = '⏱️ Timeout khi tải dữ liệu!';
                }

                await message.reply(errorMsg);
            }
        };

        const searchCharacter = async (query) => {
            try {
                const searchMsg = await message.reply('🔍 Đang tìm kiếm...');

                const response = await axios.get('https://dragonball-api.com/api/characters?limit=100');
                const characters = response.data.items.filter(char =>
                    char.name.toLowerCase().includes(query.toLowerCase())
                );

                if (characters.length === 0) {
                    return searchMsg.edit('❌ Không tìm thấy nhân vật phù hợp!');
                }

                let resultList = '';
                characters.slice(0, 15).forEach(char => {
                    resultList += `\`${char.id}\` - ${char.name}\n`;
                });

                const searchEmbed = new EmbedBuilder()
                    .setColor('#4CAF50')
                    .setTitle(`🔍 Kết quả tìm kiếm cho "${query}"`)
                    .setDescription(resultList)
                    .setFooter({
                        text: characters.length > 15 ?
                            `Hiển thị 15/${characters.length} kết quả` :
                            `Tìm thấy ${characters.length} kết quả`
                    })
                    .setTimestamp();

                await searchMsg.edit({
                    content: '💡 **Sử dụng:** `!dragonball info [ID]` để xem chi tiết',
                    embeds: [searchEmbed]
                });

            } catch (error) {
                logger.error('Search error:', error);
                await message.reply('❌ Lỗi khi tìm kiếm nhân vật!');
            }
        };

        try {
            if (args.length === 0) {
                const menuEmbed = new EmbedBuilder()
                    .setColor('#F7B801')
                    .setTitle('⚡ DRAGON BALL CHARACTER ⚡')
                    .setDescription('Xem thông tin chi tiết về các nhân vật Dragon Ball')
                    .addFields(
                        {
                            name: '📋 Danh sách nhân vật',
                            value: '`!dragonball list`\nXem tất cả nhân vật có sẵn',
                            inline: false
                        },
                        {
                            name: '👤 Thông tin nhân vật',
                            value: '`!dragonball info [ID]`\nXem chi tiết nhân vật (bao gồm biến hình)',
                            inline: false
                        },
                        {
                            name: '🔍 Tìm kiếm',
                            value: '`!dragonball search [tên]`\nTìm kiếm nhân vật theo tên',
                            inline: false
                        }
                    )
                    .addFields(
                        {
                            name: '💡 Ví dụ',
                            value: '`!dragonball info 1` - Xem Goku\n`!dragonball search Vegeta` - Tìm Vegeta',
                            inline: false
                        }
                    )
                    .setFooter({ text: 'Dragon Ball API' })
                    .setTimestamp();

                return message.reply({ embeds: [menuEmbed] });
            }

            const action = args[0].toLowerCase();

            if (action === 'list') {
                await showCharacterList();
            }
            else if (action === 'info') {
                if (!args[1]) {
                    return message.reply('⚠️ Vui lòng nhập ID nhân vật!\n**Ví dụ:** `!dragonball info 1`');
                }
                await showCharacterInfo(args[1]);
            }
            else if (action === 'search' || action === 'tìm') {
                if (!args[1]) {
                    return message.reply('⚠️ Vui lòng nhập tên nhân vật cần tìm!\n**Ví dụ:** `!dragonball search Goku`');
                }
                await searchCharacter(args.slice(1).join(' '));
            }
            else {
                return message.reply('⚠️ Lệnh không hợp lệ! Dùng `!dragonball` để xem trợ giúp.');
            }

            logger.info(`Command: ${author.tag} used dragonball ${action}`);

        } catch (error) {
            logger.error('Dragon Ball command error:', error);
            await message.reply('❌ Đã xảy ra lỗi khi thực hiện lệnh!');
        }
    },
};