// events/interactionCreate.js
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionFlagsBits,
    InteractionType,
} = require('discord.js');

// ========== CẤU HÌNH (Hãy chỉnh sửa theo server của bạn) ==========
const TICKET_CONFIG = {
    ADMIN_ROLE_ID: null, // Nhập ID role Admin nếu có (VD: '1234567890'), nếu null thì skip
    TICKET_CATEGORY_ID: null, // Nhập ID category nếu muốn tickets vào category cụ thể
};

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        try {
            // ========== Lắng nghe Button Interactions ==========
            if (!interaction.isButton()) {
                return;
            }

            // ========== BƯỚC 1: Xử lý Button "create_ticket" ==========
            if (interaction.customId === 'create_ticket') {
                await handleCreateTicket(interaction);
            }

            // ========== BƯỚC 2: Xử lý Button "close_ticket" ==========
            if (interaction.customId === 'close_ticket') {
                await handleCloseTicket(interaction);
            }

        } catch (error) {
            console.error('Lỗi trong interactionCreate:', error.message);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: '❌ Đã xảy ra lỗi khi xử lý tương tác này.',
                    flags: 64,
                }).catch(() => { });
            } else {
                await interaction.reply({
                    content: '❌ Đã xảy ra lỗi khi xử lý tương tác này.',
                    flags: 64,
                }).catch(() => { });
            }
        }
    },
};

/**
 * ========== HELPER FUNCTION 1: Xử lý tạo Ticket ==========
 * @param {ButtonInteraction} interaction
 */
async function handleCreateTicket(interaction) {
    try {
        await interaction.deferReply({ ephemeral: true });

        const user = interaction.user;
        const guild = interaction.guild;

        // ========== BƯỚC 1: Kiểm tra xem user đã có ticket chưa ==========
        const existingTicket = guild.channels.cache.find(
            (channel) =>
                channel.name.includes(`ticket-${user.username.toLowerCase()}`) ||
                channel.topic?.includes(user.id)
        );

        if (existingTicket) {
            return await interaction.editReply({
                content: `❌ Bạn đã có một ticket tại ${existingTicket}. Vui lòng sử dụng ticket đó hoặc đóng nó trước!`,
            });
        }

        // ========== BƯỚC 2: Tạo kênh Ticket ==========
        // Format: ticket-<username> hoặc ticket-<mã-số>
        const ticketName = `ticket-${user.username.toLowerCase()}`.substring(0, 100);

        const ticketChannel = await guild.channels.create({
            name: ticketName,
            type: ChannelType.GuildText,
            parent: TICKET_CONFIG.TICKET_CATEGORY_ID || undefined,
            reason: `Ticket được tạo bởi ${user.tag}`,
        });

        // ========== BƯỚC 3: Cấu hình Permission Overwrites ==========
        try {
            // ========== Ẩn kênh với @everyone ==========
            await ticketChannel.permissionOverwrites.create(
                guild.roles.everyone,
                {
                    ViewChannel: false,
                    SendMessages: false,
                },
                { reason: 'Ticket - Ẩn với @everyone' }
            );

            // ========== Cấp quyền cho người dùng ==========
            await ticketChannel.permissionOverwrites.create(user.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
            });

            // ========== Cấp quyền cho Admin/Mod Role (nếu có) ==========
            if (TICKET_CONFIG.ADMIN_ROLE_ID) {
                await ticketChannel.permissionOverwrites.create(
                    TICKET_CONFIG.ADMIN_ROLE_ID,
                    {
                        ViewChannel: true,
                        SendMessages: true,
                        ReadMessageHistory: true,
                        ManageMessages: true,
                    },
                    { reason: 'Ticket - Cấp quyền cho Admin/Mod' }
                );
            }

            // ========== Cấp quyền cho Bot ==========
            await ticketChannel.permissionOverwrites.create(
                guild.members.me.id,
                {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true,
                    ManageMessages: true,
                    ManageChannels: true,
                },
                { reason: 'Ticket - Cấp quyền cho Bot' }
            );

        } catch (permError) {
            console.error('Lỗi cấu hình permission:', permError.message);
            await ticketChannel.delete({ reason: 'Lỗi cấu hình permission' });
            return await interaction.editReply({
                content: '❌ Lỗi khi cấu hình quyền cho kênh. Vui lòng thử lại!',
            });
        }

        // ========== BƯỚC 4: Gửi tin nhắn chào mừng + Nút đóng ==========
        const adminRole = guild.roles.cache.get(TICKET_CONFIG.ADMIN_ROLE_ID);
        const adminMention = adminRole ? `${adminRole}` : '@Admin';

        const welcomeEmbed = new EmbedBuilder()
            .setColor('#10B981')
            .setTitle('🎫 Ticket Support')
            .setDescription(
                `Xin chào ${user}! 👋\n\n` +
                `Cảm ơn bạn đã liên hệ Ban Quản Trị.\n\n` +
                `**📝 Vui lòng trình bày vấn đề của bạn chi tiết:**\n` +
                `- Mô tả rõ ràng vấn đề\n` +
                `- Cung cấp bất kỳ thông tin liên quan\n` +
                `- Chờ phản hồi từ ${adminMention}\n\n` +
                `💡 **Lưu ý**: Kênh này chỉ dành riêng cho bạn và Ban Quản Trị. Đủ kiên nhẫn chờ đợi! ⏳`
            )
            .setFooter({
                text: `Ticket ID: ${ticketChannel.id}`,
            })
            .setTimestamp();

        // ========== Tạo nút đóng ticket ==========
        const closeButton = new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Đóng Ticket')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒');

        const buttonRow = new ActionRowBuilder().addComponents(closeButton);

        await ticketChannel.send({
            embeds: [welcomeEmbed],
            components: [buttonRow],
        });

        // ========== BƯỚC 5: Phản hồi người dùng ==========
        await interaction.editReply({
            content: `✅ Ticket của bạn đã được tạo tại ${ticketChannel}!`,
        });

    } catch (error) {
        console.error('Lỗi tạo ticket:', error.message);

        if (interaction.deferred) {
            await interaction.editReply({
                content: '❌ Lỗi khi tạo ticket. Vui lòng liên hệ Admin!',
            });
        } else {
            await interaction.reply({
                content: '❌ Lỗi khi tạo ticket. Vui lòng liên hệ Admin!',
                flags: 64,
            });
        }
    }
}

/**
 * ========== HELPER FUNCTION 2: Xử lý đóng Ticket ==========
 * @param {ButtonInteraction} interaction
 */
async function handleCloseTicket(interaction) {
    try {
        await interaction.deferReply();

        const channel = interaction.channel;
        const user = interaction.user;

        // ========== BƯỚC 1: Kiểm tra xem đây có phải kênh ticket không ==========
        if (!channel.name.startsWith('ticket-')) {
            return await interaction.editReply({
                content: '❌ Nút này chỉ dành cho kênh ticket!',
            });
        }

        // ========== BƯỚC 2: Gửi thông báo sắp đóng ==========
        const closeEmbed = new EmbedBuilder()
            .setColor('#EF4444')
            .setTitle('🔒 Ticket Đang Đóng')
            .setDescription(
                `Kênh này sẽ bị xóa sau **5 giây**...\n\n` +
                `Cảm ơn ${user} đã sử dụng dịch vụ support của chúng tôi! 👋`
            )
            .setFooter({
                text: 'Ticket sẽ bị xóa vĩnh viễn',
            })
            .setTimestamp();

        await interaction.editReply({
            embeds: [closeEmbed],
            components: [],
        });

        // ========== BƯỚC 3: Chờ 5 giây rồi xóa kênh ==========
        setTimeout(async () => {
            try {
                await channel.delete({
                    reason: `Ticket đóng bởi ${user.tag}`,
                });

                console.log(`✅ Ticket ${channel.name} đã bị xóa.`);

            } catch (deleteError) {
                console.error('Lỗi xóa kênh ticket:', deleteError.message);
            }
        }, 5000); // 5 giây

    } catch (error) {
        console.error('Lỗi đóng ticket:', error.message);

        if (interaction.deferred) {
            await interaction.editReply({
                content: '❌ Lỗi khi đóng ticket!',
            });
        } else {
            await interaction.reply({
                content: '❌ Lỗi khi đóng ticket!',
                flags: 64,
            });
        }
    }
}