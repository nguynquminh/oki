// commands/recipe.js
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    name: 'recipe',
    description: 'Tra cứu công thức nấu ăn',
    usage: '!recipe <tên_món_ăn>',
    async execute(message, args) {
        try {
            // Bước 1: Kiểm tra input
            if (args.length === 0) {
                return message.reply(
                    '❌ Vui lòng nhập tên món ăn!\n' +
                    '📖 Ví dụ: `!recipe pasta` hoặc `!recipe phở`'
                );
            }

            const dishName = args.join(' ');

            // Bước 2: Gửi tin nhắn tạm thời
            const loadingMsg = await message.reply('🍳 Đang vào bếp tìm công thức...');

            // Bước 3: API Call 1 - Tìm món ăn
            const searchResponse = await axios.get(
                `https://api.spoonacular.com/recipes/complexSearch`,
                {
                    params: {
                        query: dishName,
                        number: 1,
                    },
                    headers: {
                        'x-api-key': process.env.SPOONACULAR_API_KEY,
                    },
                }
            );

            // Kiểm tra nếu mảng results rỗng
            if (!searchResponse.data.results || searchResponse.data.results.length === 0) {
                await loadingMsg.edit(
                    `❌ Không tìm thấy công thức nấu ăn cho "${dishName}".\n` +
                    `💡 Hãy thử tìm kiếm với tên khác!`
                );
                return;
            }

            const recipeId = searchResponse.data.results[0].id;

            // Bước 4: API Call 2 - Lấy chi tiết công thức
            const detailResponse = await axios.get(
                `https://api.spoonacular.com/recipes/${recipeId}/information`,
                {
                    headers: {
                        'x-api-key': process.env.SPOONACULAR_API_KEY,
                    },
                }
            );

            const recipe = detailResponse.data;

            // Bước 5: Xây dựng Embed
            const embed = new EmbedBuilder()
                .setTitle(`${recipe.title}`)
                .setURL(recipe.sourceUrl || '')
                .setImage(recipe.image || '')
                .setColor('#FF6B35'); // Màu cam đỏ phù hợp chủ đề ẩm thực

            // Field: Thời gian & Khẩu phần
            if (recipe.readyInMinutes !== null && recipe.readyInMinutes !== undefined) {
                embed.addFields(
                    {
                        name: '⏱️ Thời gian chuẩn bị',
                        value: `${recipe.readyInMinutes} phút`,
                        inline: true,
                    },
                    {
                        name: '👥 Khẩu phần',
                        value: `${recipe.servings} người`,
                        inline: true,
                    }
                );
            }

            // Field: Danh sách nguyên liệu
            if (recipe.extendedIngredients && recipe.extendedIngredients.length > 0) {
                const ingredientList = recipe.extendedIngredients
                    .map((ing) => `• ${ing.original}`)
                    .slice(0, 15) // Giới hạn 15 nguyên liệu để không quá dài
                    .join('\n');

                const ingredientText =
                    recipe.extendedIngredients.length > 15
                        ? ingredientList + `\n... và ${recipe.extendedIngredients.length - 15} nguyên liệu khác`
                        : ingredientList;

                embed.addFields({
                    name: '🥘 Nguyên liệu',
                    value: ingredientText || 'Không có thông tin',
                    inline: false,
                });
            }

            // Field: Chế độ ăn
            const dietaryOptions = [];
            if (recipe.vegetarian) dietaryOptions.push('🥬 Chay');
            if (recipe.vegan) dietaryOptions.push('🌱 Vegan');
            if (recipe.glutenFree) dietaryOptions.push('🌾 Không gluten');

            if (dietaryOptions.length > 0) {
                embed.addFields({
                    name: '📋 Chế độ ăn',
                    value: dietaryOptions.join(' | '),
                    inline: false,
                });
            }

            // Field: Link tham khảo
            if (recipe.sourceUrl) {
                embed.addFields({
                    name: '📚 Nguồn',
                    value: `[Xem công thức đầy đủ](${recipe.sourceUrl})`,
                    inline: false,
                });
            }

            // Bước 6: Gửi Embed
            await loadingMsg.edit({
                content: null,
                embeds: [embed],
            });

        } catch (error) {
            // Xử lý lỗi
            if (error.response?.status === 402) {
                return message.reply(
                    '❌ **Lỗi API**: Lượt gọi API đã hết hạn. Vui lòng thử lại sau!'
                );
            }

            if (error.response?.status === 401) {
                console.error('❌ API Key không hợp lệ hoặc chưa được cấu hình');
                return message.reply(
                    '❌ **Lỗi xác thực**: Cấu hình API key không hợp lệ.'
                );
            }

            if (error.code === 'ENOTFOUND') {
                return message.reply(
                    '❌ **Lỗi kết nối**: Không thể kết nối tới API. Kiểm tra kết nối internet!'
                );
            }

            console.error('Lỗi trong lệnh recipe:', error);
            return message.reply(
                '❌ **Lỗi**: Đã xảy ra sự cố khi tra cứu công thức. Vui lòng thử lại sau!'
            );
        }
    },
};