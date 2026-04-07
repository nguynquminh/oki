// commands/kitsu.js
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    name: 'kitsu',
    aliases: ['anime'],
    description: 'Tra cứu thông tin anime, manga, và nhân vật từ Kitsu API',
    usage: '!kitsu <anime|manga|char> <tên>',
    async execute(message, args) {
        try {
            // ========== BƯỚC 1: Kiểm tra input ==========
            if (args.length === 0) {
                return message.reply({
                    embeds: [getHelpEmbed()],
                });
            }

            const type = args[0].toLowerCase();
            const searchQuery = args.slice(1).join(' ');

            // Kiểm tra loại tìm kiếm hợp lệ
            if (!['anime', 'manga', 'char'].includes(type)) {
                return message.reply({
                    embeds: [getHelpEmbed()],
                });
            }

            // Kiểm tra có từ khóa tìm kiếm không
            if (searchQuery.trim() === '') {
                return message.reply(
                    `❌ Vui lòng nhập tên ${type === 'char' ? 'nhân vật' : type}!\n` +
                    `📖 Ví dụ: \`!kitsu ${type} ${type === 'anime' ? 'Naruto' : type === 'manga' ? 'One Piece' : 'Naruto Uzumaki'
                    }\``
                );
            }

            // ========== BƯỚC 2: Gửi tin nhắn tạm thời ==========
            const loadingMsg = await message.reply('🔍 Đang tra cứu dữ liệu từ Kitsu...');

            // ========== BƯỚC 3: Gọi Kitsu API ==========
            const result = await searchKitsu(type, searchQuery);

            // Kiểm tra nếu không tìm thấy
            if (!result) {
                await loadingMsg.edit(
                    `❌ Không tìm thấy ${type === 'char' ? 'nhân vật' : type
                    } với từ khóa: "${searchQuery}"\n` +
                    `💡 Hãy thử tìm kiếm với tên khác!`
                );
                return;
            }

            // ========== BƯỚC 4: Tạo Embed tương ứng ==========
            let embed;

            if (type === 'anime' || type === 'manga') {
                embed = createMediaEmbed(result, type);
            } else if (type === 'char') {
                embed = createCharacterEmbed(result);
            }

            // ========== BƯỚC 5: Cập nhật tin nhắn tạm ==========
            await loadingMsg.edit({
                content: null,
                embeds: [embed],
            });

        } catch (error) {
            // ========== XỬ LÝ LỖI ==========
            if (error.code === 'ENOTFOUND') {
                return message.reply(
                    '❌ **Lỗi kết nối**: Không thể kết nối tới Kitsu API. Kiểm tra kết nối internet!'
                );
            }

            if (error.response?.status === 401) {
                console.error('❌ Token Kitsu không hợp lệ');
                return message.reply(
                    '❌ **Lỗi xác thực**: Token Kitsu không hợp lệ hoặc đã hết hạn.'
                );
            }

            if (error.response?.status === 429) {
                return message.reply(
                    '⏳ **Rate limit**: Bạn đang gọi API quá nhanh. Vui lòng chờ một chút!'
                );
            }

            if (error.response?.status === 404) {
                return message.reply(
                    '❌ **Lỗi 404**: Endpoint không tồn tại hoặc Kitsu API đã thay đổi cấu trúc.'
                );
            }

            console.error('Lỗi trong lệnh kitsu:', error.message);
            return message.reply(
                '❌ **Lỗi**: Đã xảy ra sự cố khi tra cứu dữ liệu. Vui lòng thử lại sau!'
            );
        }
    },
};

/**
 * Hàm gọi Kitsu API
 * @param {string} type - 'anime', 'manga', hoặc 'char'
 * @param {string} query - Từ khóa tìm kiếm
 * @returns {object|null} - Dữ liệu từ attributes của JSON:API, hoặc null nếu không tìm thấy
 */
async function searchKitsu(type, query) {
    const baseURL = 'https://kitsu.io/api/edge';

    // ========== BƯỚC A: Xây dựng Headers ==========
    const headers = {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
    };

    // Thêm Authorization header nếu có token
    if (process.env.KITSU_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.KITSU_TOKEN}`;
    }

    try {
        let endpoint;
        let params = {};

        // ========== BƯỚC B: Xác định endpoint & params dựa trên type ==========
        switch (type) {
            case 'anime':
                endpoint = '/anime';
                params = { filter: { text: query } };
                break;

            case 'manga':
                endpoint = '/manga';
                params = { filter: { text: query } };
                break;

            case 'char':
                endpoint = '/characters';
                params = { filter: { name: query } };
                break;

            default:
                return null;
        }

        // ========== BƯỚC C: Gọi API ==========
        const response = await axios.get(`${baseURL}${endpoint}`, {
            headers,
            params,
        });

        // ========== BƯỚC D: Kiểm tra và trích xuất dữ liệu JSON:API ==========
        // Format JSON:API: { data: [ { id: '...', type: '...', attributes: { ... } } ] }
        if (!response.data.data || response.data.data.length === 0) {
            return null;
        }

        // Lấy kết quả đầu tiên và trích xuất attributes
        const result = response.data.data[0].attributes;

        return result;

    } catch (error) {
        // Nếu lỗi là 404 hoặc không có kết quả, trả về null
        if (error.response?.status === 404) {
            return null;
        }
        // Các lỗi khác sẽ được throw để xử lý ở execute()
        throw error;
    }
}

/**
 * Tạo Embed cho Anime/Manga
 * @param {object} attributes - Dữ liệu từ JSON:API attributes
 * @param {string} type - 'anime' hoặc 'manga'
 * @returns {EmbedBuilder}
 */
function createMediaEmbed(attributes, type) {
    const embed = new EmbedBuilder()
        .setColor(type === 'anime' ? '#6B5FFF' : '#FF6B9D')
        .setTitle(attributes.canonicalTitle || 'N/A')
        .setThumbnail(attributes.posterImage?.original || '')
        .setTimestamp();

    // ========== Thêm field: Trạng thái ==========
    if (attributes.status) {
        const statusEmoji = getStatusEmoji(attributes.status);
        embed.addFields({
            name: '📊 Trạng thái',
            value: `${statusEmoji} ${capitalizeFirst(attributes.status)}`,
            inline: true,
        });
    }

    // ========== Thêm field: Đánh giá ==========
    if (attributes.averageRating !== null && attributes.averageRating !== undefined) {
        const stars = getStarRating(attributes.averageRating);
        embed.addFields({
            name: '⭐ Đánh giá',
            value: `${stars} ${attributes.averageRating}/100`,
            inline: true,
        });
    }

    // ========== Thêm field: Độ tuổi ==========
    if (attributes.ageRating) {
        embed.addFields({
            name: '🔞 Độ tuổi',
            value: attributes.ageRating || 'N/A',
            inline: true,
        });
    }

    // ========== Thêm field: Tóm tắt ==========
    if (attributes.synopsis) {
        const synopsis = attributes.synopsis;

        embed.addFields({
            name: '📖 Tóm tắt',
            value: synopsis || 'Không có thông tin',
            inline: false,
        });
    }

    // ========== Thêm field: Thế loại (genres) ==========
    if (attributes.genres && Array.isArray(attributes.genres) && attributes.genres.length > 0) {
        embed.addFields({
            name: '🎭 Thể loại',
            value: attributes.genres.join(', '),
            inline: false,
        });
    }

    // ========== Thêm field: Số tập/Chương ==========
    if (attributes.episodeCount !== null && attributes.episodeCount !== undefined) {
        embed.addFields({
            name: '📺 Số tập',
            value: String(attributes.episodeCount),
            inline: true,
        });
    }

    if (attributes.chapterCount !== null && attributes.chapterCount !== undefined) {
        embed.addFields({
            name: '📖 Số chương',
            value: String(attributes.chapterCount),
            inline: true,
        });
    }

    return embed;
}

/**
 * Tạo Embed cho Character (Nhân vật)
 * @param {object} attributes - Dữ liệu từ JSON:API attributes
 * @returns {EmbedBuilder}
 */
function createCharacterEmbed(attributes) {
    const embed = new EmbedBuilder()
        .setColor('#FFB833')
        .setTitle(attributes.canonicalName || 'N/A')
        .setThumbnail(attributes.image?.original || '')
        .setTimestamp();

    // ========== Thêm field: Mô tả ==========
    if (attributes.description) {
        const description = attributes.description;

        embed.addFields({
            name: '📝 Mô tả',
            value: description || 'Không có thông tin',
            inline: false,
        });
    }

    // ========== Thêm field: Tên khác (nếu có) ==========
    if (attributes.names && Object.keys(attributes.names).length > 0) {
        const alternateNames = Object.values(attributes.names)
            .filter(name => name)
            .slice(0, 3)
            .join(', ');

        if (alternateNames) {
            embed.addFields({
                name: '🏷️ Tên khác',
                value: alternateNames,
                inline: false,
            });
        }
    }

    return embed;
}

/**
 * Hàm Embed hướng dẫn sử dụng
 * @returns {EmbedBuilder}
 */
function getHelpEmbed() {
    return new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('📚 Hướng dẫn lệnh !kitsu')
        .setDescription('Tra cứu thông tin anime, manga và nhân vật từ Kitsu API')
        .addFields(
            {
                name: '🎬 Tìm Anime',
                value: '```\n!kitsu anime <tên_anime>\n```\nVí dụ: `!kitsu anime Naruto`',
                inline: false,
            },
            {
                name: '📖 Tìm Manga',
                value: '```\n!kitsu manga <tên_manga>\n```\nVí dụ: `!kitsu manga One Piece`',
                inline: false,
            },
            {
                name: '👤 Tìm Nhân vật',
                value: '```\n!kitsu char <tên_nhân_vật>\n```\nVí dụ: `!kitsu char Naruto Uzumaki`',
                inline: false,
            }
        )
        .setFooter({ text: '💡 Gợi ý: Sử dụng tên chính thức của anime/manga/nhân vật để tìm kiếm tốt nhất' });
}

/**
 * Hàm lấy emoji tương ứng với trạng thái
 * @param {string} status
 * @returns {string}
 */
function getStatusEmoji(status) {
    const statusMap = {
        'finished': '✅',
        'current': '🔴',
        'upcoming': '⏳',
        'tba': '❓',
    };
    return statusMap[status] || '❓';
}

/**
 * Hàm lấy số sao dựa trên điểm đánh giá
 * @param {number} rating
 * @returns {string}
 */
function getStarRating(rating) {
    const fullStars = Math.floor(rating / 20);
    const halfStar = (rating % 20) >= 10 ? '½' : '';
    return '⭐'.repeat(fullStars) + (halfStar ? '⭐️' : '');
}

/**
 * Hàm viết hoa chữ cái đầu
 * @param {string} str
 * @returns {string}
 */
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}