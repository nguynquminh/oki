// commands/mod.js
const {
    EmbedBuilder,
    PermissionsBitField,
} = require('discord.js');

module.exports = {
    name: 'mod',
    description: 'Quản lý thành viên server (kick, ban, timeout)',
    usage: '!mod <kick|ban|timeout|untimeout> <@user/ID> [thời_gian] [lý_do]',
    async execute(message, args) {
        try {
            // ========== BƯỚC 1: Tách và xác thực tham số ==========
            if (args.length === 0) {
                return message.reply({
                    embeds: [getModHelpEmbed()],
                });
            }

            const action = args[0]?.toLowerCase();
            const targetInput = args[1];

            // Kiểm tra action hợp lệ
            if (!['kick', 'ban', 'timeout', 'untimeout'].includes(action)) {
                return message.reply({
                    embeds: [getModHelpEmbed()],
                });
            }

            // Kiểm tra có target không
            if (!targetInput) {
                return message.reply(
                    '❌ Vui lòng chỉ định người dùng cần xử lý!\n' +
                    '📖 Ví dụ: `!mod kick @user Spam`'
                );
            }

            // ========== BƯỚC 2: Tìm target member ==========
            const targetMember = await resolveMember(message, targetInput);

            if (!targetMember) {
                return message.reply(
                    `❌ Không tìm thấy thành viên: \`${targetInput}\`\n` +
                    `💡 Hãy sử dụng mention (@user) hoặc ID của thành viên`
                );
            }

            // ========== BƯỚC 3: Xử lý timeout (cần thời gian) ==========
            let timeoutMs = null;
            let reasonStartIndex = 2;

            if (action === 'timeout') {
                if (!args[2]) {
                    return message.reply(
                        '❌ Vui lòng nhập số phút timeout!\n' +
                        '📖 Ví dụ: `!mod timeout @user 10 Spam`'
                    );
                }

                const minutes = parseInt(args[2], 10);

                if (isNaN(minutes) || minutes <= 0) {
                    return message.reply(
                        '❌ Thời gian timeout phải là một số dương!\n' +
                        '📖 Ví dụ: `!mod timeout @user 10 Spam`'
                    );
                }

                // Discord timeout max là 28 ngày (40320 phút)
                if (minutes > 40320) {
                    return message.reply(
                        '❌ Thời gian timeout tối đa là 28 ngày (40320 phút)!'
                    );
                }

                timeoutMs = minutes * 60 * 1000; // Convert to milliseconds
                reasonStartIndex = 3;
            }

            // ========== BƯỚC 4: Lấy lý do ==========
            const reason = args.slice(reasonStartIndex).join(' ') || 'Không có lý do';

            // ========== BƯỚC 5: Kiểm tra quyền của người gọi lệnh ==========
            const permissionCheck = checkUserPermissions(message, action);
            if (permissionCheck.error) {
                return message.reply(`❌ ${permissionCheck.error}`);
            }

            // ========== BƯỚC 6: Kiểm tra quyền của bot ==========
            const botPermissionCheck = checkBotPermissions(message, action);
            if (botPermissionCheck.error) {
                return message.reply(`❌ ${botPermissionCheck.error}`);
            }

            // ========== BƯỚC 7: Kiểm tra thứ bậc role ==========
            const hierarchyCheck = checkRoleHierarchy(
                message,
                targetMember,
                action
            );
            if (hierarchyCheck.error) {
                return message.reply(`❌ ${hierarchyCheck.error}`);
            }

            // ========== BƯỚC 8: Thực thi hành động ==========
            let result;

            switch (action) {
                case 'kick':
                    result = await executeKick(targetMember, reason);
                    break;
                case 'ban':
                    result = await executeBan(targetMember, reason);
                    break;
                case 'timeout':
                    result = await executeTimeout(targetMember, timeoutMs, reason);
                    break;
                case 'untimeout':
                    result = await executeUntimeout(targetMember, reason);
                    break;
            }

            if (!result.success) {
                return message.reply(`❌ **Lỗi**: ${result.error}`);
            }

            // ========== BƯỚC 9: Gửi Embed thành công ==========
            const successEmbed = createSuccessEmbed(
                action,
                targetMember,
                message.author,
                reason,
                timeoutMs
            );

            await message.reply({
                embeds: [successEmbed],
            });

            // ========== BƯỚC 10: DM người bị xử lý (Optional) ==========
            try {
                const dmEmbed = createDMEmbed(
                    action,
                    message.guild,
                    reason,
                    timeoutMs
                );

                await targetMember.send({
                    embeds: [dmEmbed],
                }).catch(() => {
                    // Im lặng nếu không gửi được DM
                });
            } catch (error) {
                // Im lặng nếu không thể DM
            }

        } catch (error) {
            console.error('Lỗi trong lệnh mod:', error.message);

            return message.reply(
                '❌ **Lỗi**: Đã xảy ra sự cố khi xử lý lệnh. Vui lòng thử lại sau!'
            );
        }
    },
};

/**
 * ========== HELPER FUNCTION 1: Tìm thành viên từ mention hoặc ID ==========
 * ✅ FIXED: Xử lý mention format <@ID> hoặc <@!ID> chính xác
 * @param {Message} message
 * @param {string} input - Mention hoặc ID
 * @returns {GuildMember|null}
 */
async function resolveMember(message, input) {
    try {
        let userId = null;

        // ========== Trường hợp 1: Input là mention format <@ID> hoặc <@!ID> ==========
        const mentionMatch = input.match(/^<@!?(\d+)>$/);
        if (mentionMatch) {
            userId = mentionMatch[1];
        }
        // ========== Trường hợp 2: Input là ID ==========
        else if (/^\d{17,19}$/.test(input)) {
            userId = input;
        }

        // Nếu tìm được userId, fetch member từ guild
        if (userId) {
            try {
                const member = await message.guild.members.fetch(userId);
                return member;
            } catch (error) {
                return null;
            }
        }

        // ========== Trường hợp 3: Tìm từ message mentions ==========
        if (message.mentions.has(input)) {
            return message.guild.members.cache.get(message.mentions.first().id);
        }

        // ========== Trường hợp 4: Tìm từ username hoặc nickname ==========
        const member = message.guild.members.cache.find(
            (m) =>
                m.user.username.toLowerCase() === input.toLowerCase() ||
                m.nickname?.toLowerCase() === input.toLowerCase() ||
                m.user.tag.toLowerCase() === input.toLowerCase()
        );

        return member || null;

    } catch (error) {
        console.error('Lỗi trong resolveMember:', error.message);
        return null;
    }
}

/**
 * ========== HELPER FUNCTION 2: Kiểm tra quyền của người gọi lệnh ==========
 * @param {Message} message
 * @param {string} action
 * @returns {object} - { error?: string }
 */
function checkUserPermissions(message, action) {
    const permissionMap = {
        kick: PermissionsBitField.Flags.KickMembers,
        ban: PermissionsBitField.Flags.BanMembers,
        timeout: PermissionsBitField.Flags.ModerateMembers,
        untimeout: PermissionsBitField.Flags.ModerateMembers,
    };

    const requiredPermission = permissionMap[action];

    if (!message.member.permissions.has(requiredPermission)) {
        const actionName = {
            kick: 'kick',
            ban: 'ban',
            timeout: 'timeout/mute',
            untimeout: 'untimeout/unmute',
        }[action];

        return {
            error: `Bạn không có quyền ${actionName} thành viên!`,
        };
    }

    return {};
}

/**
 * ========== HELPER FUNCTION 3: Kiểm tra quyền của bot ==========
 * @param {Message} message
 * @param {string} action
 * @returns {object} - { error?: string }
 */
function checkBotPermissions(message, action) {
    const permissionMap = {
        kick: PermissionsBitField.Flags.KickMembers,
        ban: PermissionsBitField.Flags.BanMembers,
        timeout: PermissionsBitField.Flags.ModerateMembers,
        untimeout: PermissionsBitField.Flags.ModerateMembers,
    };

    const requiredPermission = permissionMap[action];

    if (!message.guild.members.me.permissions.has(requiredPermission)) {
        return {
            error: 'Bot không có đủ quyền để thực hiện thao tác này.',
        };
    }

    return {};
}

/**
 * ========== HELPER FUNCTION 4: Kiểm tra thứ bậc role ==========
 * @param {Message} message
 * @param {GuildMember} targetMember
 * @param {string} action
 * @returns {object} - { error?: string }
 */
function checkRoleHierarchy(message, targetMember, action) {
    const userHighestRole = message.member.roles.highest;
    const targetHighestRole = targetMember.roles.highest;
    const botHighestRole = message.guild.members.me.roles.highest;

    // ========== Kiểm tra: Không xử lý Owner ==========
    if (targetMember.id === message.guild.ownerId) {
        return {
            error: 'Không thể xử lý Chủ server!',
        };
    }

    // ========== Kiểm tra: Không xử lý chính mình ==========
    if (targetMember.id === message.author.id) {
        return {
            error: 'Không thể xử lý chính mình!',
        };
    }

    // ========== Kiểm tra: Không xử lý bot ==========
    if (targetMember.id === message.guild.members.me.id) {
        return {
            error: 'Không thể xử lý Bot!',
        };
    }

    // ========== Kiểm tra: Target role < User role ==========
    if (targetHighestRole.position >= userHighestRole.position) {
        return {
            error: `Bạn không thể xử lý người có role cao hơn hoặc bằng role của bạn!\n` +
                `👑 Role cao nhất của bạn: \`${userHighestRole.name}\`\n` +
                `👤 Role cao nhất của target: \`${targetHighestRole.name}\``,
        };
    }

    // ========== Kiểm tra: Target role < Bot role ==========
    if (targetHighestRole.position >= botHighestRole.position) {
        return {
            error: `Bot không thể xử lý người có role cao hơn hoặc bằng role bot!\n` +
                `🤖 Role cao nhất của bot: \`${botHighestRole.name}\`\n` +
                `👤 Role cao nhất của target: \`${targetHighestRole.name}\``,
        };
    }

    return {};
}

/**
 * ========== HELPER FUNCTION 5: Kick member ==========
 * @param {GuildMember} targetMember
 * @param {string} reason
 * @returns {object} - { success: boolean, error?: string }
 */
async function executeKick(targetMember, reason) {
    try {
        await targetMember.kick(reason);
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error.message || 'Không thể kick thành viên',
        };
    }
}

/**
 * ========== HELPER FUNCTION 6: Ban member ==========
 * @param {GuildMember} targetMember
 * @param {string} reason
 * @returns {object} - { success: boolean, error?: string }
 */
async function executeBan(targetMember, reason) {
    try {
        await targetMember.ban({
            reason,
            deleteMessageSeconds: 86400,
        });
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error.message || 'Không thể ban thành viên',
        };
    }
}

/**
 * ========== HELPER FUNCTION 7: Timeout member ==========
 * @param {GuildMember} targetMember
 * @param {number} ms - Milliseconds
 * @param {string} reason
 * @returns {object} - { success: boolean, error?: string }
 */
async function executeTimeout(targetMember, ms, reason) {
    try {
        await targetMember.timeout(ms, reason);
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error.message || 'Không thể timeout thành viên',
        };
    }
}

/**
 * ========== HELPER FUNCTION 8: Untimeout member ==========
 * @param {GuildMember} targetMember
 * @param {string} reason
 * @returns {object} - { success: boolean, error?: string }
 */
async function executeUntimeout(targetMember, reason) {
    try {
        await targetMember.timeout(null, reason);
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error.message || 'Không thể gỡ timeout cho thành viên',
        };
    }
}

/**
 * ========== HELPER FUNCTION 9: Tạo Embed thành công ==========
 * @param {string} action
 * @param {GuildMember} targetMember
 * @param {User} executor
 * @param {string} reason
 * @param {number} timeoutMs
 * @returns {EmbedBuilder}
 */
function createSuccessEmbed(action, targetMember, executor, reason, timeoutMs) {
    const actionInfo = {
        kick: {
            title: '🦶 Thành viên đã bị Kick',
            color: '#FF6B6B',
            actionText: 'Kick',
        },
        ban: {
            title: '🔨 Thành viên đã bị Ban',
            color: '#DC2626',
            actionText: 'Ban',
        },
        timeout: {
            title: '🔇 Thành viên đã bị Timeout (Mute)',
            color: '#FFA500',
            actionText: 'Timeout',
        },
        untimeout: {
            title: '🔊 Timeout đã bị gỡ (Unmute)',
            color: '#22C55E',
            actionText: 'Untimeout',
        },
    };

    const info = actionInfo[action];

    const embed = new EmbedBuilder()
        .setColor(info.color)
        .setTitle(info.title)
        .setThumbnail(targetMember.user.displayAvatarURL({ dynamic: true }))
        .addFields(
            {
                name: '👤 Thành viên',
                value: `${targetMember.user.tag}\nID: \`${targetMember.id}\``,
                inline: true,
            },
            {
                name: '⚡ Hành động',
                value: info.actionText,
                inline: true,
            },
            {
                name: '👮 Thực thi bởi',
                value: `${executor.tag}\nID: \`${executor.id}\``,
                inline: true,
            }
        );

    if (timeoutMs) {
        const minutes = Math.floor(timeoutMs / (60 * 1000));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        let timeStr;
        if (days > 0) {
            timeStr = `${days} ngày`;
        } else if (hours > 0) {
            timeStr = `${hours} giờ`;
        } else {
            timeStr = `${minutes} phút`;
        }

        embed.addFields({
            name: '⏱️ Thời lượng Timeout',
            value: timeStr,
            inline: true,
        });
    }

    embed.addFields({
        name: '📝 Lý do',
        value: reason,
        inline: false,
    });

    embed.setFooter({
        text: `Timestamp: ${new Date().toLocaleString('vi-VN')}`,
    });

    embed.setTimestamp();

    return embed;
}

/**
 * ========== HELPER FUNCTION 10: Tạo Embed DM cho target ==========
 * @param {string} action
 * @param {Guild} guild
 * @param {string} reason
 * @param {number} timeoutMs
 * @returns {EmbedBuilder}
 */
function createDMEmbed(action, guild, reason, timeoutMs) {
    const actionInfo = {
        kick: {
            title: '🦶 Bạn đã bị Kick khỏi server',
            color: '#FF6B6B',
        },
        ban: {
            title: '🔨 Bạn đã bị Ban khỏi server',
            color: '#DC2626',
        },
        timeout: {
            title: '🔇 Bạn đã bị Timeout (Mute)',
            color: '#FFA500',
        },
        untimeout: {
            title: '🔊 Timeout của bạn đã bị gỡ',
            color: '#22C55E',
        },
    };

    const info = actionInfo[action];

    const embed = new EmbedBuilder()
        .setColor(info.color)
        .setTitle(info.title)
        .addFields({
            name: '🏢 Server',
            value: guild.name,
            inline: false,
        });

    if (timeoutMs) {
        const minutes = Math.floor(timeoutMs / (60 * 1000));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        let timeStr;
        if (days > 0) {
            timeStr = `${days} ngày`;
        } else if (hours > 0) {
            timeStr = `${hours} giờ`;
        } else {
            timeStr = `${minutes} phút`;
        }

        embed.addFields({
            name: '⏱️ Thời lượng',
            value: timeStr,
            inline: false,
        });
    }

    embed.addFields({
        name: '📝 Lý do',
        value: reason,
        inline: false,
    });

    embed.setFooter({
        text: 'Nếu bạn cho rằng đây là một lỗi, hãy liên hệ với quản lý server.',
    });

    embed.setTimestamp();

    return embed;
}

/**
 * ========== HELPER FUNCTION 11: Hướng dẫn sử dụng lệnh ==========
 * @returns {EmbedBuilder}
 */
function getModHelpEmbed() {
    return new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('📚 Hướng dẫn lệnh !mod')
        .setDescription('Quản lý thành viên server với các công cụ moderation')
        .addFields(
            {
                name: '🦶 Kick',
                value:
                    '```\n!mod kick <@user/ID> [lý_do]\n```\n' +
                    'Đuổi thành viên khỏi server\n' +
                    'Ví dụ: `!mod kick @user Spam`',
                inline: false,
            },
            {
                name: '🔨 Ban',
                value:
                    '```\n!mod ban <@user/ID> [lý_do]\n```\n' +
                    'Cấm thành viên ra khỏi server (xóa tin nhắn trong 1 ngày)\n' +
                    'Ví dụ: `!mod ban @user Chửi bậy`',
                inline: false,
            },
            {
                name: '🔇 Timeout (Mute)',
                value:
                    '```\n!mod timeout <@user/ID> <số_phút> [lý_do]\n```\n' +
                    'Tạm tắt tiếng thành viên trong khoảng thời gian nhất định\n' +
                    'Ví dụ: `!mod timeout @user 10 Spam chat`',
                inline: false,
            },
            {
                name: '🔊 Untimeout (Unmute)',
                value:
                    '```\n!mod untimeout <@user/ID> [lý_do]\n```\n' +
                    'Gỡ timeout sớm cho thành viên\n' +
                    'Ví dụ: `!mod untimeout @user Gỡ sớm`',
                inline: false,
            }
        )
        .setFooter({
            text: '⚠️ Bạn cần có quyền quản lý thích hợp để sử dụng lệnh này',
        });
}