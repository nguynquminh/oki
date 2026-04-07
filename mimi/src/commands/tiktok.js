const { AttachmentBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    name: 'tiktok',
    description: 'Tải video TikTok không logo',
    aliases: ['tt', 'tikdl'],

    async execute(message, args) {
        const url = args[0];
        if (!url) {
            return message.reply({
                content: '⚠️ **Cách sử dụng:** `!tiktok <link_video>`\nVí dụ: `!tiktok https://www.tiktok.com/@user/video/...`'
            });
        }

        let tempMessage;
        try {
            tempMessage = await message.reply('⏳ **Đang xử lý...** Bot đang lấy thông tin video.');
        } catch (err) {
            return console.error('Không thể gửi tin nhắn:', err);
        }

        try {
            const apiResponse = await axios.get(`https://urangkapolka.vercel.app/api/tikdl?url=${url}`, {
                timeout: 10000
            });

            const data = apiResponse.data;

            if (!data || !data.download_link) {
                return tempMessage.edit('❌ **Lỗi:** Không tìm thấy video hoặc cấu trúc API đã thay đổi.');
            }

            const videoUrl = data.download_link;
            const creator = data.creator || 'TikTok User';
            const description = data.description || 'Video TikTok';

            await tempMessage.edit('⏳ **Đang tải xuống...** Đang tải video về bộ nhớ đệm.');

            let fileSize = 0;
            try {
                const headResponse = await axios.head(videoUrl);
                fileSize = parseInt(headResponse.headers['content-length']);
            } catch (e) {
                console.log('Không thể kiểm tra header, sẽ kiểm tra sau khi tải.');
            }

            const MAX_SIZE = 24 * 1024 * 1024;

            if (fileSize > MAX_SIZE) {
                return tempMessage.edit({
                    content: `⚠️ **Video quá lớn (>24MB)!**\n🔗 **Link tải trực tiếp:** ${videoUrl}`
                });
            }

            const videoStream = await axios.get(videoUrl, {
                responseType: 'arraybuffer',
                timeout: 30000
            });

            const buffer = Buffer.from(videoStream.data);

            if (buffer.length > MAX_SIZE) {
                return tempMessage.edit({
                    content: `⚠️ **Video quá lớn (${(buffer.length / 1024 / 1024).toFixed(2)}MB)!**\n🔗 **Link tải trực tiếp:** ${videoUrl}`
                });
            }

            const videoAttachment = new AttachmentBuilder(buffer, { name: 'tiktok-video.mp4' });

            await message.reply({
                content: `🎥 **Video TikTok**\n👤 **Creator:** ${creator}\n📝 **Mô tả:** ${description}\n🔗 **Link:** [Click để xem](${videoUrl})`,
                files: [videoAttachment]
            });

            await tempMessage.delete().catch(() => { });

        } catch (error) {
            console.error('Lỗi lệnh tiktok:', error);
            let errorMessage = '❌ **Đã xảy ra lỗi hệ thống.**';

            if (error.code === 'ECONNABORTED') {
                errorMessage = '❌ **Lỗi:** Quá thời gian chờ (Timeout).';
            } else if (error.response && error.response.status === 404) {
                errorMessage = '❌ **Lỗi:** Link video không tồn tại hoặc lỗi API.';
            }

            if (tempMessage?.editable) {
                await tempMessage.edit(errorMessage).catch(() => { });
            }
        }
    },
};