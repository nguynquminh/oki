// commands/ticketsetup.js
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField,
} = require('discord.js');

module.exports = {
    name: 'ticketsetup',
    aliases: ['tickets', 'ticket-panel', 'ticketpanel'],
    description: 'Gửi panel mở Ticket vào kênh hiện tại (Admin only)',
    usage: '!ticketsetup',
    async execute(message) {
        try {
            // 1) Kiểm tra quyền của người gọi lệnh
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply('❌ Bạn cần quyền Administrator để dùng lệnh này.');
            }

            // 2) Kiểm tra quyền của bot
            const me = message.guild.members.me;
            const botHasAdmin = me.permissions.has(PermissionsBitField.Flags.Administrator);
            const botHasManage =
                me.permissions.has(PermissionsBitField.Flags.ManageChannels) &&
                me.permissions.has(PermissionsBitField.Flags.ManageRoles);

            if (!botHasAdmin && !botHasManage) {
                return message.reply(
                    '❌ Bot không đủ quyền! Cần Administrator hoặc cả Manage Channels + Manage Roles.'
                );
            }

            // 3) Tạo Embed Panel
            const panelEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📩 Trung tâm hỗ trợ')
                .setDescription(
                    'Nhấn vào nút bên dưới để tạo ticket và trao đổi riêng với Ban Quản Trị.\n' +
                    'Vui lòng không spam!'
                )
                .setFooter({ text: 'Ticket System' })
                .setTimestamp();

            // 4) Tạo nút "Mở Ticket"
            const openBtn = new ButtonBuilder()
                .setCustomId('create_ticket')
                .setLabel('Mở Ticket')
                .setEmoji('🎫')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(openBtn);

            // 5) Gửi panel vào kênh hiện tại
            await message.channel.send({
                embeds: [panelEmbed],
                components: [row],
            });

            return message.react('✅').catch(() => { });
        } catch (error) {
            console.error('[ticketsetup] Error:', error);
            return message.reply('❌ Đã xảy ra lỗi khi gửi panel Ticket. Vui lòng thử lại!');
        }
    },
};