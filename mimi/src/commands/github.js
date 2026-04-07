const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

module.exports = {
    name: 'github',
    description: '🔍 Lấy thông tin user hoặc repo GitHub',
    aliases: ['gh', 'repo'],
    usage: 'github <username> hoặc github <username/repo>',
    cooldown: 5,

    async execute(message, args, client) {
        const { author, channel } = message;

        if (args.length === 0) {
            return message.reply(
                '📌 Vui lòng nhập username hoặc username/repo trên GitHub!\n\n' +
                '**Ví dụ:**\n' +
                '`!github torvalds` (User GitHub)\n' +
                '`!github torvalds/linux` (Repository)'
            );
        }

        const query = args[0];
        const isRepo = query.includes('/');

        const searchingEmbed = new EmbedBuilder()
            .setColor('#E8E8E8')
            .setTitle('🔍 Đang tìm kiếm...')
            .setDescription('Vui lòng đợi trong giây lát...')
            .setTimestamp();

        const searchMsg = await message.reply({ embeds: [searchingEmbed] });

        try {
            if (isRepo) {
                const [username, repo] = query.split('/');

                if (!username || !repo) {
                    return searchMsg.edit({
                        embeds: [new EmbedBuilder()
                            .setColor('#F44336')
                            .setTitle('❌ Format sai')
                            .setDescription('Sử dụng: `username/repo`')
                        ]
                    });
                }

                const repoUrl = `https://api.github.com/repos/${username}/${repo}`;
                const repoResponse = await axios.get(repoUrl);
                const repoData = repoResponse.data;

                const repoEmbed = new EmbedBuilder()
                    .setColor('#1F6FEB')
                    .setTitle(`📂 ${repoData.name}`)
                    .setURL(repoData.html_url)
                    .setAuthor({
                        name: repoData.owner.login,
                        url: repoData.owner.html_url,
                        iconURL: repoData.owner.avatar_url
                    })
                    .setDescription(repoData.description || '✨ Không có mô tả')
                    .addFields(
                        {
                            name: '⭐ Stars',
                            value: repoData.stargazers_count.toString(),
                            inline: true
                        },
                        {
                            name: '👀 Watchers',
                            value: repoData.watchers_count.toString(),
                            inline: true
                        },
                        {
                            name: '🍴 Forks',
                            value: repoData.forks_count.toString(),
                            inline: true
                        },
                        {
                            name: '🌐 Ngôn ngữ',
                            value: repoData.language || '❓ Không xác định',
                            inline: true
                        },
                        {
                            name: '📜 License',
                            value: repoData.license?.name || '❌ Không có',
                            inline: true
                        },
                        {
                            name: '🔓 Public',
                            value: repoData.private ? '🔒 Private' : '🔓 Public',
                            inline: true
                        },
                        {
                            name: '📅 Ngày tạo',
                            value: new Date(repoData.created_at).toLocaleDateString('vi-VN'),
                            inline: true
                        },
                        {
                            name: '🔄 Cập nhật lần cuối',
                            value: new Date(repoData.updated_at).toLocaleDateString('vi-VN'),
                            inline: true
                        },
                        {
                            name: '📦 Topics',
                            value: repoData.topics?.length > 0
                                ? repoData.topics.slice(0, 5).map(t => `\`${t}\``).join(', ')
                                : '❌ Không có',
                            inline: false
                        }
                    )
                    .setThumbnail(repoData.owner.avatar_url)
                    .setFooter({
                        text: `Yêu cầu bởi ${author.username}`,
                        iconURL: author.displayAvatarURL()
                    })
                    .setTimestamp();

                if (repoData.open_issues_count > 0) {
                    repoEmbed.addFields({
                        name: '🐛 Open Issues',
                        value: repoData.open_issues_count.toString(),
                        inline: true
                    });
                }

                try {
                    if (repoData.owner.avatar_url) {
                        const avatarResponse = await axios({
                            url: repoData.owner.avatar_url,
                            responseType: 'arraybuffer',
                            timeout: 10000
                        });

                        const cachePath = path.join(__dirname, '../cache');
                        if (!fs.existsSync(cachePath)) {
                            fs.mkdirSync(cachePath, { recursive: true });
                        }

                        const avatarPath = path.join(cachePath, `github_avatar_${Date.now()}.jpg`);
                        fs.writeFileSync(avatarPath, Buffer.from(avatarResponse.data, 'binary'));

                        const attachment = new AttachmentBuilder(avatarPath, {
                            name: 'github_avatar.jpg'
                        });

                        await searchMsg.edit({
                            embeds: [repoEmbed],
                            files: [attachment]
                        });

                        setTimeout(() => {
                            try {
                                fs.unlinkSync(avatarPath);
                            } catch (err) {
                                logger.debug('Cleanup error:', err.message);
                            }
                        }, 5000);
                    } else {
                        await searchMsg.edit({ embeds: [repoEmbed] });
                    }
                } catch (err) {
                    logger.error('Error downloading avatar:', err.message);
                    await searchMsg.edit({ embeds: [repoEmbed] });
                }

                logger.info(`Command: ${author.tag} searched repo ${username}/${repo}`);

            } else {
                const userUrl = `https://api.github.com/users/${query}`;
                const userResponse = await axios.get(userUrl);
                const userData = userResponse.data;

                const reposUrl = `https://api.github.com/users/${query}/repos?sort=stars&per_page=5`;
                let topRepos = [];
                try {
                    const reposResponse = await axios.get(reposUrl);
                    topRepos = reposResponse.data;
                } catch (err) {
                    logger.debug('Error fetching repos:', err.message);
                }

                const userEmbed = new EmbedBuilder()
                    .setColor('#1F6FEB')
                    .setTitle(`👤 ${userData.name || userData.login}`)
                    .setURL(userData.html_url)
                    .setDescription(userData.bio || '✨ Không có bio')
                    .setThumbnail(userData.avatar_url)
                    .addFields(
                        {
                            name: '📝 Username',
                            value: `\`${userData.login}\``,
                            inline: true
                        },
                        {
                            name: '👥 Followers',
                            value: userData.followers.toString(),
                            inline: true
                        },
                        {
                            name: '👣 Following',
                            value: userData.following.toString(),
                            inline: true
                        },
                        {
                            name: '📂 Public Repos',
                            value: userData.public_repos.toString(),
                            inline: true
                        },
                        {
                            name: '⭐ Public Gists',
                            value: userData.public_gists.toString(),
                            inline: true
                        },
                        {
                            name: '👀 Profile Views',
                            value: userData.followers > 0 ? '📊 Popular' : '🆕 New',
                            inline: true
                        }
                    );

                if (userData.location) {
                    userEmbed.addFields({
                        name: '🌍 Vị trí',
                        value: userData.location,
                        inline: true
                    });
                }

                if (userData.company) {
                    userEmbed.addFields({
                        name: '🏢 Công ty',
                        value: userData.company,
                        inline: true
                    });
                }

                if (userData.blog) {
                    userEmbed.addFields({
                        name: '🌐 Blog/Website',
                        value: `[${userData.blog}](${userData.blog})`,
                        inline: true
                    });
                }

                if (userData.email) {
                    userEmbed.addFields({
                        name: '📧 Email',
                        value: userData.email,
                        inline: true
                    });
                }

                userEmbed.addFields({
                    name: '📅 Ngày tham gia',
                    value: new Date(userData.created_at).toLocaleDateString('vi-VN'),
                    inline: true
                });

                if (topRepos.length > 0) {
                    const reposText = topRepos
                        .slice(0, 3)
                        .map((r, i) => `${i + 1}. [${r.name}](${r.html_url}) - ⭐ ${r.stargazers_count}`)
                        .join('\n');

                    userEmbed.addFields({
                        name: '🏆 Top Repositories',
                        value: reposText,
                        inline: false
                    });
                }

                userEmbed.setFooter({
                    text: `Yêu cầu bởi ${author.username}`,
                    iconURL: author.displayAvatarURL()
                }).setTimestamp();

                try {
                    if (userData.avatar_url) {
                        const avatarResponse = await axios({
                            url: userData.avatar_url,
                            responseType: 'arraybuffer',
                            timeout: 10000
                        });

                        const cachePath = path.join(__dirname, '../cache');
                        if (!fs.existsSync(cachePath)) {
                            fs.mkdirSync(cachePath, { recursive: true });
                        }

                        const avatarPath = path.join(cachePath, `github_avatar_${Date.now()}.jpg`);
                        fs.writeFileSync(avatarPath, Buffer.from(avatarResponse.data, 'binary'));

                        const attachment = new AttachmentBuilder(avatarPath, {
                            name: 'github_avatar.jpg'
                        });

                        await searchMsg.edit({
                            embeds: [userEmbed],
                            files: [attachment]
                        });

                        setTimeout(() => {
                            try {
                                fs.unlinkSync(avatarPath);
                            } catch (err) {
                                logger.debug('Cleanup error:', err.message);
                            }
                        }, 5000);
                    } else {
                        await searchMsg.edit({ embeds: [userEmbed] });
                    }
                } catch (err) {
                    logger.error('Error downloading avatar:', err.message);
                    await searchMsg.edit({ embeds: [userEmbed] });
                }

                logger.info(`Command: ${author.tag} searched user ${query}`);
            }

        } catch (error) {
            logger.error('GitHub command error:', error);

            let errorTitle = '❌ Lỗi';
            let errorDesc = 'Đã xảy ra lỗi khi lấy thông tin từ GitHub';

            if (error.response?.status === 404) {
                errorTitle = '❌ Không tìm thấy';
                errorDesc = `Không tìm thấy ${isRepo ? 'repository' : 'user'}: \`${query}\``;
            } else if (error.response?.status === 403) {
                errorDesc = '⚠️ GitHub API rate limit đã hết. Vui lòng thử lại sau.';
            } else if (error.code === 'ENOTFOUND') {
                errorDesc = '🌐 Không thể kết nối tới GitHub. Kiểm tra kết nối internet.';
            } else if (error.code === 'ETIMEDOUT') {
                errorDesc = '⏱️ Kết nối timeout. Vui lòng thử lại.';
            }

            const errorEmbed = new EmbedBuilder()
                .setColor('#F44336')
                .setTitle(errorTitle)
                .setDescription(errorDesc)
                .setFooter({ text: `Error: ${error.message.substring(0, 50)}` })
                .setTimestamp();

            await searchMsg.edit({ embeds: [errorEmbed] });
        }
    },
};