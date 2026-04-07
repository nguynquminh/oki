// commands/spotify.js
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

// ========== BIẾN GLOBAL LƯU TRỮ TOKEN ==========
let spotifyAccessToken = null;
let tokenExpirationTime = null;

module.exports = {
    name: 'spotify',
    description: 'Tìm kiếm bài hát trên Spotify và phát nhạc',
    usage: '!spotify <tên_bài_hát>',
    async execute(message, args) {
        try {
            // ========== BƯỚC 1: Kiểm tra input ==========
            if (args.length === 0) {
                return message.reply(
                    '❌ Vui lòng nhập tên bài hát!\n' +
                    '📖 Ví dụ: `!spotify Blinding Lights`'
                );
            }

            const searchQuery = args.join(' ');

            // ========== BƯỚC 2: Gửi tin nhắn tạm thời ==========
            const loadingMsg = await message.reply(
                '🔎 Đang tìm kiếm bài hát trên Spotify...'
            );

            // ========== BƯỚC 3: Lấy/Làm mới Access Token ==========
            try {
                spotifyAccessToken = await getSpotifyAccessToken();
            } catch (error) {
                await loadingMsg.edit(
                    '❌ **Lỗi xác thực Spotify**: ' +
                    'Không thể lấy token. Kiểm tra CLIENT_ID và CLIENT_SECRET trong .env'
                );
                return;
            }

            // ========== BƯỚC 4: Tìm kiếm bài hát trên Spotify ==========
            const track = await searchSpotifyTrack(searchQuery, spotifyAccessToken);

            if (!track) {
                await loadingMsg.edit(
                    `❌ Không tìm thấy bài hát với từ khóa: "${searchQuery}"\n` +
                    `💡 Hãy thử tìm kiếm với tên khác!`
                );
                return;
            }

            // ========== BƯỚC 5: Tạo Embed thông tin bài hát ==========
            const embed = createSpotifyEmbed(track);

            // ========== BƯỚC 6: Cập nhật tin nhắn tạm và thêm footer hướng dẫn ==========
            const responseMsg = await loadingMsg.edit({
                content: null,
                embeds: [embed],
            });

            // ========== BƯỚC 7: Mở MessageCollector để lắng nghe "play" ==========
            setupPlayCollector(message, responseMsg, track);

        } catch (error) {
            // ========== XỬ LÝ LỖI ==========
            console.error('Lỗi trong lệnh spotify:', error.message);

            if (error.response?.status === 401) {
                return message.reply(
                    '❌ **Lỗi 401**: Token Spotify không hợp lệ. Hãy kiểm tra thông tin API.'
                );
            }

            if (error.response?.status === 429) {
                return message.reply(
                    '⏳ **Rate limit**: Bạn đang gọi API quá nhanh. Vui lòng chờ một chút!'
                );
            }

            if (error.code === 'ENOTFOUND') {
                return message.reply(
                    '❌ **Lỗi kết nối**: Không thể kết nối tới Spotify. Kiểm tra kết nối internet!'
                );
            }

            return message.reply(
                '❌ **Lỗi**: Đã xảy ra sự cố khi tìm kiếm bài hát. Vui lòng thử lại sau!'
            );
        }
    },
};

/**
 * ========== HELPER FUNCTION 1: Lấy Access Token từ Spotify ==========
 * Sử dụng Client Credentials Flow
 * @returns {string} - Access Token
 */
async function getSpotifyAccessToken() {
    // Kiểm tra xem token còn hạn không (với buffer 5 phút)
    if (spotifyAccessToken && tokenExpirationTime && Date.now() < tokenExpirationTime - 300000) {
        return spotifyAccessToken;
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error(
            'SPOTIFY_CLIENT_ID hoặc SPOTIFY_CLIENT_SECRET chưa được cấu hình trong .env'
        );
    }

    try {
        // ========== Mã hóa credentials dạng Base64 ==========
        const encodedCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        // ========== Gọi Spotify Token Endpoint ==========
        const response = await axios.post(
            'https://accounts.spotify.com/api/token',
            'grant_type=client_credentials',
            {
                headers: {
                    'Authorization': `Basic ${encodedCredentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        spotifyAccessToken = response.data.access_token;
        // Lưu thời gian hết hạn (thường là 3600 giây = 1 giờ)
        tokenExpirationTime = Date.now() + response.data.expires_in * 1000;

        return spotifyAccessToken;

    } catch (error) {
        console.error('Lỗi lấy Spotify token:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * ========== HELPER FUNCTION 2: Tìm kiếm bài hát trên Spotify ==========
 * @param {string} query - Tên bài hát cần tìm
 * @param {string} accessToken - Access token từ Spotify
 * @returns {object|null} - Dữ liệu bài hát hoặc null
 */
async function searchSpotifyTrack(query, accessToken) {
    try {
        const response = await axios.get(
            'https://api.spotify.com/v1/search',
            {
                params: {
                    q: query,
                    type: 'track',
                    limit: 1,
                },
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        // Kiểm tra xem có kết quả không
        if (!response.data.tracks || !response.data.tracks.items || response.data.tracks.items.length === 0) {
            return null;
        }

        // ========== Trích xuất thông tin bài hát đầu tiên ==========
        const track = response.data.tracks.items[0];

        return {
            name: track.name,
            artist: track.artists[0]?.name || 'Unknown Artist',
            artistsArray: track.artists.map(a => a.name),
            url: track.external_urls?.spotify || '',
            imageUrl: track.album?.images?.[0]?.url || '',
            duration: Math.floor(track.duration_ms / 1000), // Convert to seconds
            popularity: track.popularity,
            explicit: track.explicit,
            album: track.album?.name || 'Unknown Album',
            releaseDate: track.album?.release_date || 'Unknown',
        };

    } catch (error) {
        console.error('Lỗi tìm kiếm Spotify:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * ========== HELPER FUNCTION 3: Tạo Discord Embed cho bài hát ==========
 * @param {object} track - Dữ liệu bài hát từ Spotify
 * @returns {EmbedBuilder}
 */
function createSpotifyEmbed(track) {
    // Tính thời gian phút:giây
    const minutes = Math.floor(track.duration / 60);
    const seconds = track.duration % 60;
    const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Xác định icon explicit
    const explicitIcon = track.explicit ? '🔞 ' : '';

    const embed = new EmbedBuilder()
        .setColor('#1DB954') // Màu xanh lá đặc trưng của Spotify
        .setTitle(`${explicitIcon}${track.name}`)
        .setURL(track.url)
        .setThumbnail(track.imageUrl)
        .addFields(
            {
                name: '🎤 Nghệ sĩ',
                value: track.artistsArray.join(', '),
                inline: true,
            },
            {
                name: '💿 Album',
                value: track.album,
                inline: true,
            },
            {
                name: '⏱️ Thời lượng',
                value: durationStr,
                inline: true,
            },
            {
                name: '⭐ Độ phổ biến',
                value: `${track.popularity}%`,
                inline: true,
            },
            {
                name: '📅 Ngày phát hành',
                value: track.releaseDate,
                inline: true,
            }
        )
        .setFooter({
            text: '💡 Hãy reply (trả lời) tin nhắn này với chữ "play" để phát nhạc trong Voice Channel.',
            iconURL: 'https://www.spotify.com/favicon.ico',
        })
        .setTimestamp();

    return embed;
}

/**
 * ========== HELPER FUNCTION 4: Thiết lập MessageCollector ==========
 * Lắng nghe phản hồi "play" từ người dùng trong 60 giây
 * @param {Message} message - Discord Message object
 * @param {Message} responseMsg - Tin nhắn embed vừa gửi
 * @param {object} track - Dữ liệu bài hát
 */
function setupPlayCollector(message, responseMsg, track) {
    // ========== Tạo filter cho collector ==========
    const filter = (msg) => {
        // Chỉ nhận tin nhắn từ đúng người dùng
        // Nội dung phải chứa "play" (không phân biệt hoa thường)
        return msg.author.id === message.author.id && msg.content.toLowerCase().includes('play');
    };

    // ========== Tạo MessageCollector với timeout 60 giây ==========
    const collector = message.channel.createMessageCollector({
        filter,
        time: 60000, // 60 giây
        max: 1, // Chỉ lấy 1 tin nhắn
    });

    // ========== Xử lý khi nhận được "play" ==========
    collector.on('collect', async (collectedMsg) => {
        try {
            // ========== Kiểm tra xem người dùng có ở trong Voice Channel không ==========
            const voiceChannel = collectedMsg.member?.voice?.channel;

            if (!voiceChannel) {
                return collectedMsg.reply(
                    '❌ **Lỗi**: Bạn phải ở trong một Voice Channel để phát nhạc!'
                );
            }

            // ========== Kiểm tra quyền của bot trong Voice Channel ==========
            const permissions = voiceChannel.permissionsFor(collectedMsg.guild.me);
            if (!permissions.has('Connect') || !permissions.has('Speak')) {
                return collectedMsg.reply(
                    '❌ **Lỗi**: Bot không có quyền Connect hoặc Speak trong Voice Channel này.'
                );
            }

            // ========== Phản hồi người dùng ==========
            await collectedMsg.reply(
                `▶️ Đang chuẩn bị phát **${track.name}** - **${track.artist}**...\n\n` +
                `🔗 [Mở trên Spotify](${track.url})`
            );

            // ========== TODO: Tích hợp discord-player hoặc distube ==========
            // ========== BẮT ĐẦU PLACEHOLDER ==========
            console.log(`
╔════════════════════════════════════════════════════════════════╗
║                      🎵 TODO: PHÁT NHẠC 🎵                     ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Bước này cần tích hợp một trong các thư viện sau:             ║
║                                                                ║
║  1️⃣  discord-player                                            ║
║     npm install discord-player @discordjs/opus                ║
║     - Tạo Music Player instance                               ║
║     - Tìm kiếm bài hát "${track.name}" trên YouTube             ║
║     - Join Voice Channel: voiceChannel                        ║
║     - Phát bài hát vào queue                                  ║
║                                                                ║
║  2️⃣  distube                                                   ║
║     npm install distube                                       ║
║     - Khởi tạo DisTube client                                 ║
║     - Gọi distube.play() với search query                     ║
║     - Tự động join và phát nhạc                               ║
║                                                                ║
║  Ví dụ (discord-player):                                       ║
║  ─────────────────────────────────────────────────────────    ║
║                                                                ║
║  const { useQueue } = require('discord-player');              ║
║                                                                ║
║  const queue = useQueue(voiceChannel.guild);                  ║
║  const searchResult = await player.search(\`${track.name}\`, {  ║
║    requestedBy: collectedMsg.author                           ║
║  });                                                           ║
║                                                                ║
║  if (!searchResult?.tracks?.length) {                         ║
║    return collectedMsg.reply('❌ Không tìm thấy bài hát');      ║
║  }                                                             ║
║                                                                ║
║  if (!queue)                                                  ║
║    queue = player.createQueue(voiceChannel.guild, {           ║
║      metadata: collectedMsg.channel,                          ║
║    });                                                         ║
║                                                                ║
║  try {                                                         ║
║    if (!queue.connection)                                      ║
║      await queue.connect(voiceChannel);                       ║
║  } catch (e) {                                                ║
║    player.deleteQueue(voiceChannel.guild);                    ║
║    return collectedMsg.reply('❌ Không thể join Voice Channel');║
║  }                                                             ║
║                                                                ║
║  await queue.addTrack(searchResult.tracks[0]);                ║
║                                                                ║
║  if (!queue.playing)                                          ║
║    await queue.play();                                        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
      `);
            // ========== KẾT THÚC PLACEHOLDER ==========

        } catch (error) {
            console.error('Lỗi khi xử lý play:', error.message);
            collectedMsg.reply(
                '❌ **Lỗi**: Đã xảy ra sự cố khi chuẩn bị phát nhạc. Vui lòng thử lại!'
            );
        }
    });

    // ========== Xử lý khi collector hết thời gian (timeout) ==========
    collector.on('end', (collected) => {
        // Nếu không ai phản hồi, chỉ im lặng (không cần thông báo thêm)
        if (collected.size === 0) {
            // Optional: Có thể thêm reaction 'X' hoặc xóa tin nhắn
            // responseMsg.react('❌').catch(() => {});
        }
    });
}