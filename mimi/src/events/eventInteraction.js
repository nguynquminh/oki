// src/events/interactions/eventInteraction.js
const {
    Events,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
} = require('discord.js');
const stateManager = require('../services/eventStateManager');
const channelService = require('../services/eventChannelService');
const archiveService = require('../services/eventArchiveService');
const {
    shuffle,
    distributeIntoTeams,
    formatTeamFields,
    parseCustomId,
} = require('../utils/eventHelpers');
const logger = require('../utils/logger');

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction, client) {
        // Chỉ xử lý các interaction có customId bắt đầu bằng 'evt_'
        const customId = interaction.customId;
        if (!customId || !customId.startsWith('evt_')) return;

        try {
            // ═══════════════════════════════════════
            // MODAL SUBMIT
            // ═══════════════════════════════════════
            if (interaction.isModalSubmit()) {
                await handleModalSubmit(interaction);
                return;
            }

            // ═══════════════════════════════════════
            // STRING SELECT MENU
            // ═══════════════════════════════════════
            if (interaction.isStringSelectMenu()) {
                await handleSelectMenu(interaction);
                return;
            }

            // ═══════════════════════════════════════
            // BUTTONS
            // ═══════════════════════════════════════
            if (interaction.isButton()) {
                await handleButton(interaction);
                return;
            }
        } catch (err) {
            logger.error(`[Event Interaction Error] ${customId}:`, err);

            const replyMethod = interaction.deferred || interaction.replied
                ? 'editReply'
                : 'reply';

            await interaction[replyMethod]({
                content: '❌ Đã xảy ra lỗi khi xử lý. Vui lòng thử lại.',
                ephemeral: true,
            }).catch(() => { });
        }
    },
};

// ═══════════════════════════════════════════════════════════
// BUTTON HANDLER
// ═══════════════════════════════════════════════════════════
async function handleButton(interaction) {
    const customId = interaction.customId;

    // ─── BƯỚC 2: Mở Modal nhập thông tin ───
    if (customId.startsWith('evt_create_')) {
        const { eventId } = parseCustomId(customId, 'evt_create_');
        const state = stateManager.get(eventId);

        if (!state) {
            return interaction.reply({
                content: '❌ Sự kiện này đã hết hạn hoặc không tồn tại.',
                ephemeral: true,
            });
        }
        if (interaction.user.id !== state.hostId) {
            return interaction.reply({
                content: '❌ Chỉ người tạo lệnh mới có thể thao tác nút này.',
                ephemeral: true,
            });
        }

        const modal = new ModalBuilder()
            .setCustomId(`evt_modal_${eventId}`)
            .setTitle('📝 Tạo Sự Kiện Mới');

        const nameInput = new TextInputBuilder()
            .setCustomId('event_name')
            .setLabel('Tên sự kiện')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('VD: Cuộc thi Code đêm thứ 7')
            .setRequired(true)
            .setMaxLength(100);

        const descInput = new TextInputBuilder()
            .setCustomId('event_desc')
            .setLabel('Mô tả chi tiết')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('VD: Mỗi nhóm hoàn thành 1 challenge trong 2 giờ...')
            .setRequired(true)
            .setMaxLength(1024);

        modal.addComponents(
            new ActionRowBuilder().addComponents(nameInput),
            new ActionRowBuilder().addComponents(descInput),
        );

        return interaction.showModal(modal);
    }

    // ─── BƯỚC 3b: Chọn mode Random / React ───
    if (customId.startsWith('evt_mode_')) {
        const isRandom = customId.startsWith('evt_mode_random_');
        const prefix = isRandom ? 'evt_mode_random_' : 'evt_mode_react_';
        const { eventId } = parseCustomId(customId, prefix);
        const state = stateManager.get(eventId);

        if (!state || interaction.user.id !== state.hostId) {
            return interaction.reply({ content: '❌ Không có quyền.', ephemeral: true });
        }

        const mode = isRandom ? 'random' : 'react';
        stateManager.update(eventId, { mode });

        logger.info(`[Event ${eventId}] Mode set: ${mode}`);

        // Rebuild row 1 (mode buttons) với highlight
        const modeRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`evt_mode_random_${eventId}`)
                .setLabel('🎲 Chia ngẫu nhiên')
                .setStyle(isRandom ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setDisabled(isRandom),
            new ButtonBuilder()
                .setCustomId(`evt_mode_react_${eventId}`)
                .setLabel('✋ Tự chọn nhóm')
                .setStyle(!isRandom ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setDisabled(!isRandom),
        );

        // Giữ nguyên các rows khác (select menu ở index 0, finalize ở index 2)
        const rows = interaction.message.components.map((row, i) =>
            i === 1 ? modeRow : ActionRowBuilder.from(row)
        );

        return interaction.update({ components: rows });
    }

    // ─── BƯỚC 3c: Hoàn tất cấu hình → Đăng public ───
    if (customId.startsWith('evt_finalize_')) {
        const { eventId } = parseCustomId(customId, 'evt_finalize_');
        const state = stateManager.get(eventId);

        if (!state || interaction.user.id !== state.hostId) {
            return interaction.reply({ content: '❌ Không có quyền.', ephemeral: true });
        }

        // Validate
        if (!state.teamCount) {
            return interaction.reply({
                content: '⚠️ Bạn chưa chọn **số lượng nhóm**. Hãy chọn từ dropdown phía trên.',
                ephemeral: true,
            });
        }
        if (!state.mode) {
            return interaction.reply({
                content: '⚠️ Bạn chưa chọn **phương thức chia nhóm**. Hãy bấm nút Random hoặc Tự chọn.',
                ephemeral: true,
            });
        }

        stateManager.update(eventId, { configured: true, phase: 'live' });

        logger.info(`[Event ${eventId}] Config finalized: ${state.teamCount} teams, mode=${state.mode}`);

        // Xác nhận cho Host (ephemeral message biến mất)
        await interaction.update({
            content: '✅ Cấu hình hoàn tất! Đang đăng sự kiện công khai...',
            components: [],
            embeds: [],
        });

        // ─── BƯỚC 4: Đăng Embed công khai ───
        await postPublicEventMessage(interaction, state, eventId);
    }

    // ─── BƯỚC 4a: Tham gia (Random mode) ───
    if (customId.startsWith('evt_join_')) {
        const { eventId } = parseCustomId(customId, 'evt_join_');
        const state = stateManager.get(eventId);

        if (!state || state.phase !== 'live') {
            return interaction.reply({ content: '❌ Sự kiện không còn mở.', ephemeral: true });
        }

        if (state.participants.includes(interaction.user.id)) {
            return interaction.reply({ content: '⚠️ Bạn đã tham gia rồi!', ephemeral: true });
        }

        state.participants.push(interaction.user.id);

        logger.info(`[Event ${eventId}] +Join: ${interaction.user.tag} (total: ${state.participants.length})`);

        // Cập nhật embed hiển thị số người
        await updateParticipantCount(interaction, state);

        return interaction.reply({
            content: `✅ **${interaction.member?.displayName ?? interaction.user.username}** đã tham gia sự kiện! `
                + `(${state.participants.length} người)`,
        });
    }

    // ─── BƯỚC 4a': Rời (Random mode) ───
    if (customId.startsWith('evt_leave_')) {
        const { eventId } = parseCustomId(customId, 'evt_leave_');
        const state = stateManager.get(eventId);

        if (!state || state.phase !== 'live') {
            return interaction.reply({ content: '❌ Sự kiện không còn mở.', ephemeral: true });
        }

        const idx = state.participants.indexOf(interaction.user.id);
        if (idx === -1) {
            return interaction.reply({ content: '⚠️ Bạn chưa tham gia.', ephemeral: true });
        }

        state.participants.splice(idx, 1);

        logger.info(`[Event ${eventId}] -Leave: ${interaction.user.tag} (total: ${state.participants.length})`);

        await updateParticipantCount(interaction, state);

        return interaction.reply({
            content: `❎ **${interaction.member?.displayName ?? interaction.user.username}** đã rời sự kiện. `
                + `(Còn ${state.participants.length} người)`,
        });
    }

    // ─── BƯỚC 4b: Chọn nhóm (React mode) ───
    if (customId.startsWith('evt_team_')) {
        const match = customId.match(/^evt_team_(.{12})_(\d+)$/);
        if (!match) return;

        const [, eventId, teamIdxStr] = match;
        const teamIndex = parseInt(teamIdxStr);
        const state = stateManager.get(eventId);

        if (!state || state.phase !== 'live') {
            return interaction.reply({ content: '❌ Sự kiện không còn mở.', ephemeral: true });
        }

        // Xóa user khỏi mọi nhóm khác (1 người = 1 nhóm)
        for (const key of Object.keys(state.teams)) {
            state.teams[key] = state.teams[key].filter((id) => id !== interaction.user.id);
        }

        // Thêm vào nhóm đã chọn
        if (!state.teams[teamIndex]) state.teams[teamIndex] = [];
        state.teams[teamIndex].push(interaction.user.id);

        const totalJoined = Object.values(state.teams).flat().length;

        logger.info(`[Event ${eventId}] ${interaction.user.tag} → Nhóm ${teamIndex} (total: ${totalJoined})`);

        return interaction.reply({
            content: `✅ **${interaction.member?.displayName ?? interaction.user.username}** đã chọn **Nhóm ${teamIndex}**! `
                + `(Tổng: ${totalJoined} người)`,
        });
    }

    // ─── BƯỚC 5: Bắt đầu sự kiện → Tạo kênh ───
    if (customId.startsWith('evt_start_')) {
        const { eventId } = parseCustomId(customId, 'evt_start_');
        const state = stateManager.get(eventId);

        if (!state) {
            return interaction.reply({ content: '❌ Sự kiện không tồn tại.', ephemeral: true });
        }
        if (interaction.user.id !== state.hostId) {
            return interaction.reply({ content: '❌ Chỉ Host mới có thể bắt đầu sự kiện.', ephemeral: true });
        }
        if (state.phase !== 'live') {
            return interaction.reply({ content: '❌ Sự kiện không ở trạng thái có thể bắt đầu.', ephemeral: true });
        }

        await interaction.deferReply();

        // Xử lý chia nhóm
        let finalTeams;

        if (state.mode === 'random') {
            if (state.participants.length < state.teamCount) {
                return interaction.editReply(
                    `⚠️ Cần ít nhất **${state.teamCount}** người tham gia (hiện có **${state.participants.length}**). `
                    + `Hãy chờ thêm người!`
                );
            }
            const shuffled = shuffle(state.participants);
            const distributed = distributeIntoTeams(shuffled, state.teamCount);
            finalTeams = {};
            distributed.forEach((members, i) => {
                finalTeams[i + 1] = members;
            });
        } else {
            // Mode react — dùng teams đã có
            finalTeams = { ...state.teams };

            // Kiểm tra có ít nhất 1 người
            const total = Object.values(finalTeams).flat().length;
            if (total === 0) {
                return interaction.editReply('⚠️ Chưa có ai tham gia sự kiện!');
            }
        }

        stateManager.update(eventId, {
            teams: finalTeams,
            phase: 'started',
            startedAt: Date.now(),
        });

        logger.info(`[Event ${eventId}] STARTED — creating channels...`);

        try {
            // Tạo Category + Channels
            const resources = await channelService.createEventChannels(
                interaction.guild,
                state.name,
                finalTeams,
                state.hostId,
            );

            stateManager.update(eventId, {
                categoryId: resources.categoryId,
                createdChannels: resources.channels,
            });

            // Disable tất cả nút trên public message, thêm nút "Kết thúc"
            await disablePublicMessage(interaction, state, eventId, finalTeams);

            const teamSummary = Object.entries(finalTeams)
                .map(([idx, members]) => `• Nhóm ${idx}: ${members.length} người`)
                .join('\n');

            await interaction.editReply(
                `✅ **Sự kiện đã bắt đầu!**\n\n`
                + `📂 Category: **[Sự kiện] ${state.name}**\n`
                + `${teamSummary}\n\n`
                + `Các thành viên có thể thấy kênh nhóm của mình. Chúc vui vẻ! 🎉`
            );

            logger.info(`[Event ${eventId}] Channels created successfully`);
        } catch (err) {
            logger.error(`[Event ${eventId}] Channel creation failed:`, err);
            stateManager.update(eventId, { phase: 'live', startedAt: null });
            await interaction.editReply(
                '❌ Không thể tạo kênh. Hãy kiểm tra:\n'
                + '• Bot có quyền **Manage Channels** & **Manage Roles**?\n'
                + '• Bot role có nằm trên @everyone trong hierarchy không?'
            );
        }
    }

    // ─── BƯỚC 6: Kết thúc sự kiện ───
    if (customId.startsWith('evt_end_')) {
        const { eventId } = parseCustomId(customId, 'evt_end_');
        const state = stateManager.get(eventId);

        if (!state) {
            return interaction.reply({ content: '❌ Sự kiện không tồn tại.', ephemeral: true });
        }
        if (interaction.user.id !== state.hostId) {
            return interaction.reply({ content: '❌ Chỉ Host mới có thể kết thúc.', ephemeral: true });
        }
        if (state.phase !== 'started') {
            return interaction.reply({ content: '❌ Sự kiện chưa được bắt đầu.', ephemeral: true });
        }

        await interaction.deferReply();

        stateManager.update(eventId, { phase: 'ended', endedAt: Date.now() });

        logger.info(`[Event ${eventId}] ENDING — starting archive transaction...`);

        const errors = [];

        // ── 6a: Transcript ──
        let transcripts = [];
        try {
            transcripts = await archiveService.generateTranscripts(
                interaction.guild,
                state,
            );
            logger.info(`[Event ${eventId}] Transcripts generated: ${transcripts.length} file(s)`);
        } catch (err) {
            logger.error(`[Event ${eventId}] Transcript failed:`, err);
            errors.push('Transcript');
        }

        // ── 6b: Lưu DB ──
        try {
            await archiveService.saveToDatabase(state, interaction.guild);
            logger.info(`[Event ${eventId}] Saved to database`);
        } catch (err) {
            logger.error(`[Event ${eventId}] DB save failed:`, err);
            errors.push('Database');
        }

        // ── 6c: Cleanup channels ──
        try {
            await channelService.cleanupEventChannels(interaction.guild, state);
            logger.info(`[Event ${eventId}] Channels cleaned up`);
        } catch (err) {
            logger.error(`[Event ${eventId}] Cleanup failed:`, err);
            errors.push('Channel cleanup');
        }

        // ── 6d: Summary report ──
        try {
            await archiveService.sendSummary(interaction.guild, state, transcripts);
            logger.info(`[Event ${eventId}] Summary sent to archive channel`);
        } catch (err) {
            logger.error(`[Event ${eventId}] Summary failed:`, err);
            errors.push('Summary report');
        }

        // Xóa state khỏi memory
        stateManager.delete(eventId);

        if (errors.length > 0) {
            await interaction.editReply(
                `⚠️ Sự kiện đã kết thúc nhưng có lỗi ở: **${errors.join(', ')}**.\n`
                + `Dữ liệu có thể không đầy đủ. Kiểm tra log để biết chi tiết.`
            );
        } else {
            await interaction.editReply(
                `✅ **Sự kiện "${state.name}" đã kết thúc thành công!**\n\n`
                + `📋 Transcript đã lưu\n`
                + `💾 Dữ liệu đã ghi vào database\n`
                + `🧹 Kênh tạm đã dọn dẹp\n`
                + `📨 Báo cáo tổng kết đã gửi đến kênh archive`
            );
        }

        logger.info(`[Event ${eventId}] Fully ended and cleaned up`);
    }
}

// ═══════════════════════════════════════════════════════════
// MODAL SUBMIT HANDLER
// ═══════════════════════════════════════════════════════════
async function handleModalSubmit(interaction) {
    if (!interaction.customId.startsWith('evt_modal_')) return;

    const { eventId } = parseCustomId(interaction.customId, 'evt_modal_');
    const state = stateManager.get(eventId);

    if (!state || interaction.user.id !== state.hostId) {
        return interaction.reply({ content: '❌ Phiên không hợp lệ hoặc đã hết hạn.', ephemeral: true });
    }

    const name = interaction.fields.getTextInputValue('event_name').trim();
    const description = interaction.fields.getTextInputValue('event_desc').trim();

    stateManager.update(eventId, { name, description, phase: 'configuring' });

    logger.info(`[Event ${eventId}] Modal submitted: "${name}"`);

    // ─── Bước 3: Gửi tin nhắn cấu hình (Ephemeral) ───
    const selectRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`evt_teamcount_${eventId}`)
            .setPlaceholder('📊 Chọn số lượng nhóm...')
            .addOptions(
                { label: '2 nhóm', value: '2', emoji: '2️⃣', description: 'Chia thành 2 đội' },
                { label: '3 nhóm', value: '3', emoji: '3️⃣', description: 'Chia thành 3 đội' },
                { label: '4 nhóm', value: '4', emoji: '4️⃣', description: 'Chia thành 4 đội' },
                { label: '5 nhóm', value: '5', emoji: '5️⃣', description: 'Chia thành 5 đội' },
            ),
    );

    const modeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`evt_mode_random_${eventId}`)
            .setLabel('🎲 Chia ngẫu nhiên')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(`evt_mode_react_${eventId}`)
            .setLabel('✋ Tự chọn nhóm')
            .setStyle(ButtonStyle.Primary),
    );

    const finalizeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`evt_finalize_${eventId}`)
            .setLabel('✅ Hoàn tất & Đăng Sự kiện')
            .setStyle(ButtonStyle.Success),
    );

    const configEmbed = new EmbedBuilder()
        .setTitle(`⚙️ Cấu hình: ${name}`)
        .setDescription(
            '**Bước 1:** Chọn số nhóm từ dropdown\n'
            + '**Bước 2:** Chọn phương thức chia nhóm\n'
            + '**Bước 3:** Nhấn "Hoàn tất" khi xong'
        )
        .setColor(0xfee75c)
        .setFooter({ text: `Event ID: ${eventId}` });

    await interaction.reply({
        embeds: [configEmbed],
        components: [selectRow, modeRow, finalizeRow],
        ephemeral: true,
    });
}

// ═══════════════════════════════════════════════════════════
// SELECT MENU HANDLER
// ═══════════════════════════════════════════════════════════
async function handleSelectMenu(interaction) {
    if (!interaction.customId.startsWith('evt_teamcount_')) return;

    const { eventId } = parseCustomId(interaction.customId, 'evt_teamcount_');
    const state = stateManager.get(eventId);

    if (!state || interaction.user.id !== state.hostId) {
        return interaction.reply({ content: '❌ Không có quyền.', ephemeral: true });
    }

    const teamCount = parseInt(interaction.values[0]);
    stateManager.update(eventId, { teamCount });

    logger.info(`[Event ${eventId}] Team count set: ${teamCount}`);

    // Update embed để phản ánh selection
    const configEmbed = EmbedBuilder.from(interaction.message.embeds[0])
        .setFields(
            { name: '📊 Số nhóm đã chọn', value: `**${teamCount} nhóm**`, inline: true },
            {
                name: '🎯 Phương thức',
                value: state.mode ? (state.mode === 'random' ? '🎲 Ngẫu nhiên' : '✋ Tự chọn') : '_Chưa chọn_',
                inline: true,
            },
        );

    await interaction.update({ embeds: [configEmbed] });
}

// ═══════════════════════════════════════════════════════════
// HELPER: Đăng public event message (Bước 4)
// ═══════════════════════════════════════════════════════════
async function postPublicEventMessage(interaction, state, eventId) {
    const embed = new EmbedBuilder()
        .setTitle(`🎉 ${state.name}`)
        .setDescription(state.description)
        .setColor(0x57f287)
        .addFields(
            { name: '👥 Số nhóm', value: `${state.teamCount}`, inline: true },
            {
                name: '🎯 Phương thức',
                value: state.mode === 'random' ? '🎲 Ngẫu nhiên' : '✋ Tự chọn',
                inline: true,
            },
            { name: '👑 Host', value: `<@${state.hostId}>`, inline: true },
            { name: '📊 Đã tham gia', value: '0 người', inline: true },
        )
        .setFooter({ text: `Event ID: ${eventId} • Bấm nút bên dưới để tham gia!` })
        .setTimestamp();

    const actionRows = [];

    if (state.mode === 'random') {
        actionRows.push(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`evt_join_${eventId}`)
                    .setLabel('✅ Tham gia')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`evt_leave_${eventId}`)
                    .setLabel('❎ Rời')
                    .setStyle(ButtonStyle.Secondary),
            ),
        );
    } else {
        // Mode react: tạo nút cho từng nhóm
        const teamButtons = [];
        for (let i = 1; i <= state.teamCount; i++) {
            teamButtons.push(
                new ButtonBuilder()
                    .setCustomId(`evt_team_${eventId}_${i}`)
                    .setLabel(`Nhóm ${i}`)
                    .setStyle(ButtonStyle.Primary),
            );
        }
        actionRows.push(new ActionRowBuilder().addComponents(teamButtons));

        // Khởi tạo teams object
        const teams = {};
        for (let i = 1; i <= state.teamCount; i++) teams[i] = [];
        stateManager.update(eventId, { teams });
    }

    // Nút Host-only
    actionRows.push(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`evt_start_${eventId}`)
                .setLabel('🚀 Bắt đầu sự kiện (Chỉ Host)')
                .setStyle(ButtonStyle.Danger),
        ),
    );

    const publicMsg = await interaction.channel.send({
        embeds: [embed],
        components: actionRows,
    });

    stateManager.update(eventId, {
        publicMessageId: publicMsg.id,
        publicChannelId: publicMsg.channel.id,
    });

    logger.info(`[Event ${eventId}] Public message posted: ${publicMsg.id}`);
}

// ═══════════════════════════════════════════════════════════
// HELPER: Cập nhật số người tham gia trên embed
// ═══════════════════════════════════════════════════════════
async function updateParticipantCount(interaction, state) {
    try {
        const channel = await interaction.guild.channels.fetch(state.publicChannelId);
        const msg = await channel.messages.fetch(state.publicMessageId);

        const embed = EmbedBuilder.from(msg.embeds[0]);
        const fields = embed.data.fields;
        const countField = fields.find((f) => f.name.includes('Đã tham gia'));
        if (countField) {
            countField.value = `${state.participants.length} người`;
        }

        await msg.edit({ embeds: [embed] });
    } catch (err) {
        // Non-critical — chỉ log, không throw
        logger.warn(`[Event] Could not update participant count:`, err.message);
    }
}

// ═══════════════════════════════════════════════════════════
// HELPER: Disable public message + thêm nút kết thúc (Bước 5)
// ═══════════════════════════════════════════════════════════
async function disablePublicMessage(interaction, state, eventId, finalTeams) {
    try {
        const channel = await interaction.guild.channels.fetch(state.publicChannelId);
        const msg = await channel.messages.fetch(state.publicMessageId);

        // Disable tất cả component cũ
        const disabledRows = msg.components.map((row) => {
            const newRow = ActionRowBuilder.from(row);
            newRow.components.forEach((c) => c.setDisabled(true));
            return newRow;
        });

        // Thêm nút "Kết thúc"
        disabledRows.push(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`evt_end_${eventId}`)
                    .setLabel('🛑 Kết thúc sự kiện (Chỉ Host)')
                    .setStyle(ButtonStyle.Danger),
            ),
        );

        // Cập nhật embed với danh sách nhóm
        const embed = EmbedBuilder.from(msg.embeds[0])
            .setColor(0xed4245)
            .setTitle(`🔴 [ĐANG DIỄN RA] ${state.name}`)
            .addFields(formatTeamFields(finalTeams));

        await msg.edit({ embeds: [embed], components: disabledRows });
    } catch (err) {
        logger.warn(`[Event ${eventId}] Could not update public message:`, err.message);
    }
}