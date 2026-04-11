// commands/setup.js
const {
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder,
    PermissionsBitField,
    ChannelType,
} = require('discord.js');

module.exports = {
    name: 'setup',
    aliases: ['config'],
    description: 'Thiết lập và trang trí server tự động',
    usage: '!setup',
    async execute(message) {
        try {
            // ========== BƯỚC 1: Kiểm tra quyền Administrator của người gọi lệnh ==========
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply(
                    '❌ **Lỗi Quyền**: Bạn cần có quyền **Administrator** để sử dụng lệnh này!'
                );
            }

            // ========== BƯỚC 2: Kiểm tra quyền của Bot ==========
            const botPermissionCheck = checkBotPermissions(message.guild);
            if (botPermissionCheck.error) {
                return message.reply(`❌ ${botPermissionCheck.error}`);
            }

            // ========== BƯỚC 3: Tạo Embed & Menu ==========
            const setupEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🛠️ Bảng Điều Khiển Thiết Lập Server')
                .setDescription(
                    'Vui lòng chọn hạng mục bạn muốn cài đặt từ menu bên dưới.\n\n' +
                    '⚠️ **Lưu ý**: Các thao tác này có thể mất vài giây tùy theo kích thước server.'
                )
                .addFields(
                    {
                        name: '📋 Các tùy chọn có sẵn:',
                        value:
                            '🎨 **Tạo Roles** - Tạo các role cơ bản (Admin, Mod, Member, VIP)\n' +
                            '📁 **Tạo Kênh** - Tạo các danh mục và kênh trang trí\n' +
                            '🚀 **Setup Toàn bộ** - Chạy cả hai tùy chọn trên',
                        inline: false,
                    }
                )
                .setFooter({ text: 'Được tạo bởi Setup Command' })
                .setTimestamp();

            // ========== Tạo Select Menu ==========
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('setup_menu')
                .setPlaceholder('Chọn hạng mục thiết lập...')
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('🎨 Tạo Roles')
                        .setDescription('Tạo các role cơ bản cho server')
                        .setValue('create_roles'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('📁 Tạo Kênh')
                        .setDescription('Tạo danh mục và kênh trang trí')
                        .setValue('create_channels'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('🚀 Setup Toàn bộ')
                        .setDescription('Chạy cả Roles và Kênh')
                        .setValue('setup_all')
                );

            const row = new ActionRowBuilder().addComponents(selectMenu);

            // ========== Gửi Message ==========
            const setupMsg = await message.reply({
                embeds: [setupEmbed],
                components: [row],
            });

            // ========== BƯỚC 4: Tạo ComponentCollector ==========
            const collector = setupMsg.createMessageComponentCollector({
                filter: (interaction) =>
                    interaction.user.id === message.author.id && interaction.customId === 'setup_menu',
                time: 300000, // 5 phút
            });

            collector.on('collect', async (interaction) => {
                try {
                    await interaction.deferUpdate();

                    const choice = interaction.values[0];

                    // ========== Cập nhật message: Loading ==========
                    await setupMsg.edit({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('#FFA500')
                                .setTitle('⏳ Đang Tiến Hành Thiết Lập')
                                .setDescription('Vui lòng đợi... (Thao tác này có thể mất vài giây)')
                                .setFooter({ text: 'Được tạo bởi Setup Command' })
                                .setTimestamp(),
                        ],
                        components: [],
                    });

                    let result;

                    // ========== BƯỚC 5: Xử lý từng lựa chọn ==========
                    switch (choice) {
                        case 'create_roles':
                            result = await createRoles(interaction.guild);
                            break;

                        case 'create_channels':
                            result = await createChannelsAndCategories(interaction.guild);
                            break;

                        case 'setup_all':
                            const rolesResult = await createRoles(interaction.guild);
                            const channelsResult = await createChannelsAndCategories(
                                interaction.guild
                            );

                            result = {
                                success:
                                    rolesResult.success && channelsResult.success,
                                details: {
                                    roles: rolesResult,
                                    channels: channelsResult,
                                },
                            };
                            break;
                    }

                    // ========== BƯỚC 6: Gửi kết quả ==========
                    if (result.success) {
                        const successEmbed = createSuccessEmbed(choice, result);
                        await setupMsg.edit({
                            embeds: [successEmbed],
                            components: [],
                        });
                    } else {
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#DC2626')
                            .setTitle('❌ Lỗi Thiết Lập')
                            .setDescription(result.error || 'Đã xảy ra lỗi không xác định')
                            .setFooter({ text: 'Được tạo bởi Setup Command' })
                            .setTimestamp();

                        await setupMsg.edit({
                            embeds: [errorEmbed],
                            components: [],
                        });
                    }

                    // ========== Dừng collector sau khi xử lý ==========
                    collector.stop();

                } catch (error) {
                    console.error('Lỗi xử lý setup:', error.message);

                    const errorEmbed = new EmbedBuilder()
                        .setColor('#DC2626')
                        .setTitle('❌ Lỗi')
                        .setDescription(`Đã xảy ra lỗi: \`${error.message}\``)
                        .setFooter({ text: 'Được tạo bởi Setup Command' })
                        .setTimestamp();

                    await setupMsg.edit({
                        embeds: [errorEmbed],
                        components: [],
                    });

                    collector.stop();
                }
            });

            // ========== Xử lý khi collector timeout ==========
            collector.on('end', () => {
                setupMsg.edit({ components: [] }).catch(() => { });
            });

        } catch (error) {
            console.error('Lỗi trong lệnh setup:', error.message);

            return message.reply(
                '❌ **Lỗi**: Đã xảy ra sự cố khi thiết lập server. Vui lòng thử lại sau!'
            );
        }
    },
};

/**
 * ========== HELPER FUNCTION 1: Kiểm tra quyền Bot ==========
 * @param {Guild} guild
 * @returns {object} - { error?: string }
 */
function checkBotPermissions(guild) {
    const botMember = guild.members.me;

    if (!botMember.permissions.has(PermissionsBitField.Flags.Administrator)) {
        // Kiểm tra quyền cụ thể
        if (
            !botMember.permissions.has(PermissionsBitField.Flags.ManageChannels) ||
            !botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)
        ) {
            return {
                error:
                    'Bot không có đủ quyền!\n' +
                    '❌ Bot cần: **Administrator** hoặc **Manage Channels** + **Manage Roles**',
            };
        }
    }

    return {};
}

/**
 * ========== HELPER FUNCTION 2: Tạo Roles ==========
 * @param {Guild} guild
 * @returns {Promise<object>} - { success: boolean, createdCount?: number, error?: string }
 */
async function createRoles(guild) {
    try {
        // ========== Định nghĩa các role mẫu ==========
        const roleTemplates = [
            {
                name: '👑 Admin',
                color: '#DC2626', // Đỏ
                permissions: [
                    PermissionsBitField.Flags.Administrator,
                ],
            },
            {
                name: '🛡️ Moderator',
                color: '#3B82F6', // Xanh dương
                permissions: [
                    PermissionsBitField.Flags.ManageMessages,
                    PermissionsBitField.Flags.KickMembers,
                    PermissionsBitField.Flags.BanMembers,
                    PermissionsBitField.Flags.ModerateMembers,
                ],
            },
            {
                name: '💎 VIP',
                color: '#F59E0B', // Vàng
                permissions: [
                    PermissionsBitField.Flags.ManageMessages,
                ],
            },
            {
                name: '👤 Member',
                color: '#6B7280', // Xám
                permissions: [],
            },
        ];

        let createdCount = 0;

        // ========== Tạo roles đồng thời (có delay nhỏ) ==========
        const createRolePromises = roleTemplates.map((roleTemplate, index) => {
            return new Promise(async (resolve) => {
                // Stagger requests by 200ms to avoid burst rate limits
                if (index > 0) await new Promise(r => setTimeout(r, index * 200));
                try {
                    await guild.roles.create({
                        name: roleTemplate.name,
                        color: roleTemplate.color,
                        permissions: roleTemplate.permissions,
                        reason: 'Server Setup Command',
                    });
                    resolve({ success: true, name: roleTemplate.name });
                } catch (error) {
                    console.error(`Lỗi tạo role ${roleTemplate.name}:`, error.message);
                    resolve({ success: false, name: roleTemplate.name, error });
                }
            });
        });

        const results = await Promise.all(createRolePromises);
        createdCount = results.filter(r => r.success).length;

        if (createdCount === 0) {
            return {
                success: false,
                error: 'Không thể tạo role nào',
            };
        }

        return {
            success: true,
            createdCount,
        };

    } catch (error) {
        return {
            success: false,
            error: error.message || 'Lỗi không xác định khi tạo roles',
        };
    }
}

/**
 * ========== HELPER FUNCTION 3: Tạo Channels & Categories ==========
 * @param {Guild} guild
 * @returns {Promise<object>} - { success: boolean, createdCount?: number, error?: string }
 */
async function createChannelsAndCategories(guild) {
    try {
        // ========== Định nghĩa cấu trúc server mẫu ==========
        const serverStructure = [
            {
                categoryName: '『📌』THÔNG TIN',
                channels: [
                    { name: '📋-quy-tắc', type: ChannelType.GuildText },
                    { name: '📢-thông-báo', type: ChannelType.GuildText },
                    { name: '❓-hỏi-đáp', type: ChannelType.GuildText },
                ],
            },
            {
                categoryName: '『💬』GIAO LƯU',
                channels: [
                    { name: '💬-tổng-hợp', type: ChannelType.GuildText },
                    { name: '🎮-gaming', type: ChannelType.GuildText },
                    { name: '🎵-nhạc', type: ChannelType.GuildText },
                    { name: '🎨-sáng-tạo', type: ChannelType.GuildText },
                ],
            },
            {
                categoryName: '『🔊』VOICE',
                channels: [
                    { name: '🎤-phòng-chờ', type: ChannelType.GuildVoice },
                    { name: '🎙️-phòng-chữa', type: ChannelType.GuildVoice },
                    { name: '🎵-phòng-nhạc', type: ChannelType.GuildVoice },
                ],
            },
            {
                categoryName: '『👨‍💼』QUẢN LÝ',
                channels: [
                    { name: '📊-nhật-ký', type: ChannelType.GuildText },
                    { name: '🔐-chỉ-mod', type: ChannelType.GuildText },
                ],
            },
        ];

        let createdCount = 0;

        // ========== Tạo Categories lần lượt, Channels trong Category thì đồng thời ==========
        for (let i = 0; i < serverStructure.length; i++) {
            const structure = serverStructure[i];
            try {
                const category = await guild.channels.create({
                    name: structure.categoryName,
                    type: ChannelType.GuildCategory,
                    reason: 'Server Setup Command',
                });
                createdCount++;

                if (i < serverStructure.length - 1) await new Promise(r => setTimeout(r, 200));

                const createChannelPromises = structure.channels.map((channel, idx) => {
                    return new Promise(async (resolve) => {
                        if (idx > 0) await new Promise(r => setTimeout(r, idx * 100)); // Stagger slightly
                        try {
                            await guild.channels.create({
                                name: channel.name,
                                type: channel.type,
                                parent: category.id,
                                reason: 'Server Setup Command',
                            });
                            resolve({ success: true });
                        } catch (error) {
                            console.error(`Lỗi tạo channel ${channel.name}:`, error.message);
                            resolve({ success: false });
                        }
                    });
                });

                const channelResults = await Promise.all(createChannelPromises);
                createdCount += channelResults.filter(r => r.success).length;

            } catch (error) {
                console.error(`Lỗi tạo category ${structure.categoryName}:`, error.message);
            }
        }

        if (createdCount === 0) {
            return {
                success: false,
                error: 'Không thể tạo kênh nào',
            };
        }

        return {
            success: true,
            createdCount,
        };

    } catch (error) {
        return {
            success: false,
            error: error.message || 'Lỗi không xác định khi tạo channels',
        };
    }
}

/**
 * ========== HELPER FUNCTION 4: Tạo Embed Thành Công ==========
 * @param {string} choice
 * @param {object} result
 * @returns {EmbedBuilder}
 */
function createSuccessEmbed(choice, result) {
    let title = '';
    let description = '';
    let color = '#22C55E';

    if (choice === 'create_roles') {
        title = '✅ Tạo Roles Thành Công';
        description =
            `Đã tạo **${result.createdCount}** role cơ bản cho server.\n\n` +
            '📋 **Roles được tạo:**\n' +
            '👑 Admin (Đỏ - Quyền Administrator)\n' +
            '🛡️ Moderator (Xanh dương - Quản lý tin nhắn, kick, ban)\n' +
            '💎 VIP (Vàng - Quản lý tin nhắn)\n' +
            '👤 Member (Xám - Quyền cơ bản)';
    } else if (choice === 'create_channels') {
        title = '✅ Tạo Kênh Thành Công';
        description =
            `Đã tạo **${result.createdCount}** kênh và danh mục cho server.\n\n` +
            '📋 **Các danh mục được tạo:**\n' +
            '『📌』THÔNG TIN - Quy tắc, thông báo, hỏi đáp\n' +
            '『💬』GIAO LƯU - Chat tổng hợp, gaming, nhạc, sáng tạo\n' +
            '『🔊』VOICE - Phòng voice tổng hợp\n' +
            '『👨‍💼』QUẢN LÝ - Nhật ký, kênh chỉ mod';
    } else if (choice === 'setup_all') {
        title = '✅ Setup Toàn Bộ Hoàn Thành';
        const rolesCount = result.details.roles.createdCount || 0;
        const channelsCount = result.details.channels.createdCount || 0;
        description =
            `**Tổng kết:**\n\n` +
            `✅ Tạo **${rolesCount}** role\n` +
            `✅ Tạo **${channelsCount}** kênh & danh mục\n\n` +
            `🎉 Server của bạn đã sẵn sàng! Bạn có thể bắt đầu sử dụng ngay bây giờ.`;
    }

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setFooter({
            text: 'Được tạo bởi Setup Command - Setup hoàn tất lúc',
        })
        .setTimestamp();

    return embed;
}