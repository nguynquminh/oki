const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

module.exports = {
    name: 'cmd',
    description: '🔧 Quản lý commands của bot',
    aliases: ['command', 'commands', 'cmd'],
    usage: 'cmd <load|unload|reload|loadall|unloadall|reloadall|info|list> [commandName]',
    adminOnly: true,

    async execute(message, args, client) {
        const { author, guild } = message;

        const OWNER_ID = process.env.OWNER_ID || ''; 
        if (author.id !== OWNER_ID && !message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply({
                content: '❌ Chỉ bot owner mới có thể dùng lệnh này!',
            });
        }

        const subcommand = args[0]?.toLowerCase();

        if (!subcommand) {
            return message.reply({
                content: `❌ Sử dụng: \`${this.usage}\`\n\n**Subcommands:**\n` +
                    '`load <name>` - Load một command\n' +
                    '`unload <name>` - Unload một command\n' +
                    '`reload <name>` - Reload một command\n' +
                    '`loadall` - Load tất cả commands\n' +
                    '`unloadall` - Unload tất cả commands\n' +
                    '`reloadall` - Reload tất cả commands\n' +
                    '`info <name>` - Xem thông tin command\n' +
                    '`list` - Danh sách tất cả commands'
            });
        }

        try {
            switch (subcommand) {
                case 'load': {
                    const commandName = args[1]?.toLowerCase();

                    if (!commandName) {
                        return message.reply('❌ Vui lòng nhập tên command!');
                    }

                    const result = await loadCommand(client, commandName);

                    const embed = new EmbedBuilder()
                        .setColor(result.success ? '#2ecc71' : '#e74c3c')
                        .setTitle(result.success ? '✅ Load Command' : '❌ Load Failed')
                        .setDescription(result.message)
                        .setTimestamp();

                    await message.reply({ embeds: [embed] });
                    break;
                }

                case 'unload': {
                    const commandName = args[1]?.toLowerCase();

                    if (!commandName) {
                        return message.reply('❌ Vui lòng nhập tên command!');
                    }

                    if (commandName === 'cmd') {
                        return message.reply('❌ Không thể unload command này!');
                    }

                    const result = await unloadCommand(client, commandName);

                    const embed = new EmbedBuilder()
                        .setColor(result.success ? '#2ecc71' : '#e74c3c')
                        .setTitle(result.success ? '✅ Unload Command' : '❌ Unload Failed')
                        .setDescription(result.message)
                        .setTimestamp();

                    await message.reply({ embeds: [embed] });
                    break;
                }

                case 'reload': {
                    const commandName = args[1]?.toLowerCase();

                    if (!commandName) {
                        return message.reply('❌ Vui lòng nhập tên command!');
                    }

                    await unloadCommand(client, commandName);
                    const result = await loadCommand(client, commandName);

                    const embed = new EmbedBuilder()
                        .setColor(result.success ? '#2ecc71' : '#e74c3c')
                        .setTitle(result.success ? '🔄 Reload Command' : '❌ Reload Failed')
                        .setDescription(result.message)
                        .setTimestamp();

                    await message.reply({ embeds: [embed] });
                    break;
                }

                case 'loadall': {
                    const commandsPath = path.join(__dirname);
                    const results = await loadAllCommands(client, commandsPath);

                    const embed = new EmbedBuilder()
                        .setColor('#3498db')
                        .setTitle('📦 Load All Commands')
                        .addFields(
                            { name: '✅ Loaded', value: `${results.success.length} commands`, inline: true },
                            { name: '❌ Failed', value: `${results.failed.length} commands`, inline: true },
                            { name: '📊 Total', value: `${results.total} commands`, inline: true }
                        )
                        .setTimestamp();

                    if (results.success.length > 0) {
                        const successList = results.success.slice(0, 20).join(', ') +
                            (results.success.length > 20 ? '...' : '');
                        embed.addFields({
                            name: '📋 Loaded Commands',
                            value: successList
                        });
                    }

                    if (results.failed.length > 0) {
                        const failedList = results.failed
                            .map(f => `${f.name}: ${f.error}`)
                            .slice(0, 5)
                            .join('\n');
                        embed.addFields({
                            name: '⚠️ Failed Commands',
                            value: failedList
                        });
                    }

                    await message.reply({ embeds: [embed] });
                    logger.info(`LoadAll: ${results.success.length} commands loaded`);
                    break;
                }

                case 'unloadall': {
                    const commands = Array.from(client.commands.keys()).filter(cmd => cmd !== 'cmd');
                    let count = 0;

                    for (const commandName of commands) {
                        const result = await unloadCommand(client, commandName);
                        if (result.success) count++;
                    }

                    const embed = new EmbedBuilder()
                        .setColor('#e74c3c')
                        .setTitle('🗑️ Unload All Commands')
                        .setDescription(`Đã unload **${count}** commands`)
                        .setTimestamp();

                    await message.reply({ embeds: [embed] });
                    logger.info(`UnloadAll: ${count} commands unloaded`);
                    break;
                }

                case 'reloadall': {
                    const commands = Array.from(client.commands.keys()).filter(cmd => cmd !== 'cmd');
                    for (const commandName of commands) {
                        await unloadCommand(client, commandName);
                    }

                    const commandsPath = path.join(__dirname);
                    const results = await loadAllCommands(client, commandsPath);

                    const embed = new EmbedBuilder()
                        .setColor('#f39c12')
                        .setTitle('🔄 Reload All Commands')
                        .addFields(
                            { name: '✅ Reloaded', value: `${results.success.length} commands`, inline: true },
                            { name: '❌ Failed', value: `${results.failed.length} commands`, inline: true }
                        )
                        .setTimestamp();

                    await message.reply({ embeds: [embed] });
                    logger.info(`ReloadAll: ${results.success.length} commands reloaded`);
                    break;
                }

                case 'info': {
                    const commandName = args[1]?.toLowerCase();

                    if (!commandName) {
                        return message.reply('❌ Vui lòng nhập tên command!');
                    }

                    const command = client.commands.get(commandName);

                    if (!command) {
                        return message.reply(`❌ Command \`${commandName}\` không tồn tại!`);
                    }

                    const embed = new EmbedBuilder()
                        .setColor('#9b59b6')
                        .setTitle(`📋 Command Info: ${commandName}`)
                        .setDescription(command.description || 'Không có mô tả')
                        .addFields(
                            {
                                name: '⏱️ Cooldown',
                                value: `${command.cooldown || 3}s`,
                                inline: true
                            },
                            {
                                name: '🔒 Admin Only',
                                value: command.adminOnly ? '✅ Yes' : '❌ No',
                                inline: true
                            },
                            {
                                name: '📝 Usage',
                                value: `\`${command.usage || `${command.name}`}\``,
                                inline: false
                            }
                        )
                        .setTimestamp();

                    if (command.aliases && command.aliases.length > 0) {
                        embed.addFields({
                            name: '📌 Aliases',
                            value: command.aliases.map(a => `\`${a}\``).join(', ')
                        });
                    }

                    await message.reply({ embeds: [embed] });
                    break;
                }

                case 'list': {
                    const commands = Array.from(client.commands.values());

                    if (commands.length === 0) {
                        return message.reply('❌ Không có command nào được load!');
                    }

                    const commandList = commands
                        .map(cmd => `\`${cmd.name}\` - ${cmd.description || 'Không có mô tả'}`)
                        .join('\n');

                    const chunks = commandList.match(/[\s\S]{1,4000}/g) || [];

                    const embeds = chunks.map((chunk, index) => {
                        const embed = new EmbedBuilder()
                            .setColor('#3498db')
                            .setTitle(`📚 Command List (${index + 1}/${chunks.length})`)
                            .setDescription(chunk)
                            .setFooter({ text: `Total: ${commands.length} commands` })
                            .setTimestamp();

                        return embed;
                    });

                    await message.reply({ embeds: [embeds[0]] });

                    for (let i = 1; i < embeds.length; i++) {
                        await message.channel.send({ embeds: [embeds[i]] });
                    }

                    break;
                }

                default:
                    return message.reply(
                        `❌ Subcommand không tồn tại: \`${subcommand}\`\n` +
                        `Sử dụng: \`${this.usage}\``
                    );
            }

            logger.info(`Command: ${author.tag} used cmd ${subcommand}`);

        } catch (error) {
            logger.error('Command Manager Error:', error);

            const errorEmbed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('❌ Error')
                .setDescription(`\`\`\`${error.message}\`\`\``)
                .setTimestamp();

            await message.reply({ embeds: [errorEmbed] });
        }
    },
};

async function loadCommand(client, commandName) {
    try {
        const commandsPath = path.join(__dirname);
        const commandFile = findCommandFile(commandsPath, commandName);

        if (!commandFile) {
            return {
                success: false,
                message: `❌ Command file không tồn tại: \`${commandName}.js\``
            };
        }

        delete require.cache[require.resolve(commandFile)];

        const command = require(commandFile);

        if (!command.name || !command.execute) {
            return {
                success: false,
                message: `❌ Command không đúng format: thiếu \`name\` hoặc \`execute\``
            };
        }

        client.commands.set(command.name, command);

        logger.info(`✅ Loaded command: ${command.name}`);

        return {
            success: true,
            message: `✅ Đã load command: \`${command.name}\``
        };

    } catch (error) {
        logger.error(`Error loading command ${commandName}:`, error);
        return {
            success: false,
            message: `❌ Lỗi: \`${error.message}\``
        };
    }
}

async function unloadCommand(client, commandName) {
    try {
        const command = client.commands.get(commandName);

        if (!command) {
            return {
                success: false,
                message: `❌ Command không tồn tại: \`${commandName}\``
            };
        }

        client.commands.delete(commandName);

        const commandsPath = path.join(__dirname);
        const commandFile = findCommandFile(commandsPath, commandName);

        if (commandFile) {
            delete require.cache[require.resolve(commandFile)];
        }

        logger.info(`✅ Unloaded command: ${commandName}`);

        return {
            success: true,
            message: `✅ Đã unload command: \`${commandName}\``
        };

    } catch (error) {
        logger.error(`Error unloading command ${commandName}:`, error);
        return {
            success: false,
            message: `❌ Lỗi: \`${error.message}\``
        };
    }
}

async function loadAllCommands(client, commandsPath) {
    const results = {
        success: [],
        failed: [],
        total: 0
    };

    function loadFromDir(dir) {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                loadFromDir(filePath);
            } else if (file.endsWith('.js') && file !== 'cmd.js') {
                results.total++;

                try {
                    delete require.cache[require.resolve(filePath)];
                    const command = require(filePath);

                    if (command.name && command.execute) {
                        client.commands.set(command.name, command);
                        results.success.push(command.name);
                    } else {
                        results.failed.push({
                            name: file,
                            error: 'Invalid format (missing name or execute)'
                        });
                    }
                } catch (error) {
                    results.failed.push({
                        name: file,
                        error: error.message
                    });
                }
            }
        }
    }

    loadFromDir(commandsPath);
    return results;
}

function findCommandFile(dir, commandName) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            const found = findCommandFile(filePath, commandName);
            if (found) return found;
        } else if (file === `${commandName}.js`) {
            return filePath;
        }
    }

    return null;
}