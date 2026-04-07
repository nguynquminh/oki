'use strict';

require('dotenv').config();

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ComponentType,
} = require('discord.js');

const OWNER_ID = process.env.OWNER_ID;

const BUTTON_TIMEOUT = 60_000; 

const MODAL_TIMEOUT = 5 * 60_000; 

function buildInviteEmbed(user) {
    return new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('📬 Liên hệ Admin')
        .setDescription(
            `Xin chào ${user}!\n\n` +
            `Bạn cần hỗ trợ hoặc muốn gửi ý kiến tới Admin?\n` +
            `Nhấn nút **✍️ Viết phản hồi** bên dưới để mở form nhập liệu.\n\n` +
            `> ⏱️ Nút sẽ hết hạn sau **60 giây**.`
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'Nội dung phản hồi sẽ được gửi trực tiếp đến Admin qua DM.' })
        .setTimestamp();
}

function buildAdminDmEmbed(interaction, content) {
    const sender = interaction.user;
    const guild = interaction.guild;
    const channel = interaction.channel;

    return new EmbedBuilder()
        .setColor(0xFF6B00)
        .setTitle('📩 Phản hồi mới từ người dùng')
        .setThumbnail(sender.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '👤 Người gửi', value: `${sender.tag}`, inline: true },
            { name: '🪪 User ID', value: `\`${sender.id}\``, inline: true },
            { name: '\u200B', value: '\u200B', inline: false }, 
            { name: '🏠 Server', value: guild?.name ?? 'DM', inline: true },
            { name: '💬 Kênh', value: `#${channel?.name ?? '?'}`, inline: true },
            {
                name: '📝 Nội dung phản hồi',
                value: `\`\`\`${content.slice(0, 994)}\`\`\``,
                inline: false,
            },
        )
        .setFooter({
            text: `Phản hồi ID: ${sender.id}`,
            iconURL: sender.displayAvatarURL(),
        })
        .setTimestamp();
}

module.exports = {
    name: 'calladmin',
    aliases: ['report', 'feedback', 'contact'],
    description: 'Gửi phản hồi / báo cáo trực tiếp đến Admin bot',
    usage: '',
    cooldown: 30, 

    async execute(message, _args, _client) {
        if (!OWNER_ID) {
            console.error('[calladmin] OWNER_ID chưa được đặt trong file .env!');
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xE74C3C)
                        .setDescription('⚠️ Lệnh này chưa được cấu hình. Vui lòng liên hệ quản trị viên!'),
                ],
            });
        }

        const BUTTON_ID = `calladmin_open_${message.author.id}`;

        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(BUTTON_ID)
                .setLabel('✍️ Viết phản hồi')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📬'),
        );

        const inviteMsg = await message.reply({
            embeds: [buildInviteEmbed(message.author)],
            components: [actionRow],
        });

        const buttonCollector = inviteMsg.createMessageComponentCollector({
            componentType: ComponentType.Button,

            filter: (btnInteraction) =>
                btnInteraction.customId === BUTTON_ID &&
                btnInteraction.user.id === message.author.id,

            time: BUTTON_TIMEOUT, 
            max: 1,               
        });

        buttonCollector.on('collect', async (btnInteraction) => {

            const MODAL_ID = `calladmin_modal_${message.author.id}`;

            const modal = new ModalBuilder()
                .setCustomId(MODAL_ID)
                .setTitle('📩 Gửi phản hồi cho Admin');

            const feedbackInput = new TextInputBuilder()
                .setCustomId('feedback_content')
                .setLabel('Nội dung phản hồi của bạn')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder(
                    'Mô tả chi tiết vấn đề hoặc ý kiến bạn muốn gửi đến Admin...'
                )
                .setMinLength(10)
                .setMaxLength(1000)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(feedbackInput),
            );

            await btnInteraction.showModal(modal);

            let modalInteraction;
            try {
                modalInteraction = await btnInteraction.awaitModalSubmit({
                    filter: (mi) =>
                        mi.customId === MODAL_ID &&
                        mi.user.id === message.author.id,
                    time: MODAL_TIMEOUT,
                });
            } catch {
                await inviteMsg.edit({ components: [] }).catch(() => { });
                return;
            }

            await modalInteraction.deferReply({ ephemeral: true });

            const feedbackContent = modalInteraction.fields.getTextInputValue('feedback_content');

            let dmSuccess = false;
            try {
                const adminUser = await modalInteraction.client.users.fetch(OWNER_ID);
                await adminUser.send({
                    embeds: [buildAdminDmEmbed(modalInteraction, feedbackContent)],
                });
                dmSuccess = true;
            } catch (dmError) {
                console.error(
                    `[calladmin] Không thể gửi DM cho admin (ID: ${OWNER_ID}):`,
                    dmError.message
                );
            }

            if (dmSuccess) {
                await modalInteraction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x57F287)
                            .setTitle('✅ Đã gửi thành công!')
                            .setDescription(
                                'Phản hồi của bạn đã được gửi tới Admin.\n' +
                                'Cảm ơn bạn đã liên hệ! Admin sẽ phản hồi sớm nhất có thể.'
                            )
                            .setTimestamp(),
                    ],
                });
            } else {
                await modalInteraction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xFEE75C)
                            .setTitle('⚠️ Không thể gửi phản hồi')
                            .setDescription(
                                'Bot không thể gửi DM cho Admin lúc này.\n' +
                                '*(Admin có thể đã tắt tính năng nhận tin nhắn trực tiếp)*\n\n' +
                                'Vui lòng liên hệ Admin trực tiếp trên server.'
                            )
                            .setTimestamp(),
                    ],
                });
            }

            await inviteMsg.edit({ components: [] }).catch(() => { });
        });

        buttonCollector.on('end', async (collected, reason) => {
            if (reason === 'time' && collected.size === 0) {
                const expiredRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(BUTTON_ID)
                        .setLabel('⏰ Đã hết hạn')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                );
                await inviteMsg.edit({ components: [expiredRow] }).catch(() => { });
            }
        });
    },
};