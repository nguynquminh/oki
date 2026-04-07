// src/commands/event/event.js
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
} = require('discord.js');
const stateManager = require('../services/eventStateManager');
const { generateEventId } = require('../utils/eventHelpers');
const logger = require('../utils/logger');

module.exports = {
    name: 'event',
    aliases: ['ev'],
    description: 'Khởi tạo quy trình tạo sự kiện chia nhóm.',
    category: 'event',
    usage: '!event',
    cooldown: 5,

    async execute(message, args, client) {
        // Guard: chỉ dùng trong server
        if (!message.guild) {
            return message.reply('❌ Lệnh này chỉ dùng được trong server.');
        }

        // Guard: Host đang có event dang dở?
        const existing = stateManager.findActiveByHost(
            message.author.id,
            message.guild.id
        );
        if (existing) {
            return message.reply(
                `⚠️ Bạn đang có sự kiện **${existing.name ?? '(chưa đặt tên)'}** chưa hoàn tất.\n`
                + `Hãy kết thúc hoặc chờ nó hết hạn trước khi tạo mới.`
            );
        }

        const eventId = generateEventId();
        stateManager.create(eventId, message.author.id, message.guild.id);

        logger.info(`[Event] ${message.author.tag} khởi tạo event ${eventId} tại guild ${message.guild.id}`);

        const embed = new EmbedBuilder()
            .setTitle('📅 Trình Tạo Sự Kiện')
            .setDescription(
                'Nhấn nút bên dưới để bắt đầu tạo sự kiện chia nhóm cho server.\n\n'
                + '**Quy trình:**\n'
                + '1️⃣ Điền tên & mô tả sự kiện\n'
                + '2️⃣ Chọn số nhóm & phương thức chia\n'
                + '3️⃣ Mời mọi người tham gia\n'
                + '4️⃣ Bắt đầu → Bot tự tạo kênh riêng cho từng nhóm\n'
                + '5️⃣ Kết thúc → Bot lưu trữ & dọn dẹp'
            )
            .setColor(0x5865f2)
            .setFooter({ text: `Event ID: ${eventId} • Host: ${message.author.tag}` })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`evt_create_${eventId}`)
                .setLabel('🎉 Tạo Sự Kiện Mới')
                .setStyle(ButtonStyle.Primary),
        );

        await message.reply({ embeds: [embed], components: [row] });
    },
};