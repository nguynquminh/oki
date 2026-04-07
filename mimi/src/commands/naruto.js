const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

const BASE_URL = 'https://dattebayo-api.onrender.com';

const COLLECTION_MAP = {
    char: { endpoint: 'characters', label: '🥷 Nhân Vật', dataKey: 'characters' },
    character: { endpoint: 'characters', label: '🥷 Nhân Vật', dataKey: 'characters' },
    nhanvat: { endpoint: 'characters', label: '🥷 Nhân Vật', dataKey: 'characters' },

    clan: { endpoint: 'clans', label: '🏯 Clan', dataKey: 'clans' },
    clans: { endpoint: 'clans', label: '🏯 Clan', dataKey: 'clans' },

    village: { endpoint: 'villages', label: '🌿 Làng', dataKey: 'villages' },
    villages: { endpoint: 'villages', label: '🌿 Làng', dataKey: 'villages' },
    lang: { endpoint: 'villages', label: '🌿 Làng', dataKey: 'villages' },

    kkg: { endpoint: 'kekkei-genkai', label: '👁️ Kekkei Genkai', dataKey: 'kekkeiGenkai' },
    kekkei: { endpoint: 'kekkei-genkai', label: '👁️ Kekkei Genkai', dataKey: 'kekkeiGenkai' },
    'kekkei-genkai': { endpoint: 'kekkei-genkai', label: '👁️ Kekkei Genkai', dataKey: 'kekkeiGenkai' },

    beast: { endpoint: 'tailed-beasts', label: '🦊 Bijuu', dataKey: 'tailedBeasts' },
    bijuu: { endpoint: 'tailed-beasts', label: '🦊 Bijuu', dataKey: 'tailedBeasts' },
    tailed: { endpoint: 'tailed-beasts', label: '🦊 Bijuu', dataKey: 'tailedBeasts' },
    'tailed-beasts': { endpoint: 'tailed-beasts', label: '🦊 Bijuu', dataKey: 'tailedBeasts' },

    team: { endpoint: 'teams', label: '⚔️ Đội', dataKey: 'teams' },
    teams: { endpoint: 'teams', label: '⚔️ Đội', dataKey: 'teams' },
    doi: { endpoint: 'teams', label: '⚔️ Đội', dataKey: 'teams' },

    akatsuki: { endpoint: 'akatsuki', label: '☁️ Akatsuki', dataKey: 'akatsuki' },
    aka: { endpoint: 'akatsuki', label: '☁️ Akatsuki', dataKey: 'akatsuki' },

    kara: { endpoint: 'kara', label: '🔵 Kara', dataKey: 'kara' },
};

const COLLECTION_COLORS = {
    characters: 0xFF6B00,   
    clans: 0x2E86AB,        
    villages: 0x27AE60,     
    'kekkei-genkai': 0x8E44AD, 
    'tailed-beasts': 0xE74C3C, 
    teams: 0xF39C12,        
    akatsuki: 0xC0392B,     
    kara: 0x1ABC9C,         
};

function isValidValue(val) {
    if (val === null || val === undefined) return false;
    if (Array.isArray(val) && val.length === 0) return false;
    if (typeof val === 'string' && val.trim() === '') return false;
    return true;
}

function arrayToString(arr, limit = 10) {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const items = arr.slice(0, limit).map(item =>
        typeof item === 'object' ? (item.name || item.japaneseName || JSON.stringify(item)) : String(item)
    );
    const suffix = arr.length > limit ? `\n*(+${arr.length - limit} more)*` : '';
    return items.join(', ') + suffix;
}

function truncate(str, max = 1020) {
    if (!str || str.length <= max) return str;
    return str.slice(0, max) + '…';
}

function getImageUrl(data) {
    if (!data) return null;
    if (Array.isArray(data.images) && data.images.length > 0) {
        const img = data.images[0];
        return typeof img === 'string' ? img : null;
    }
    return null;
}

function buildDynamicFields(embed, data, endpoint) {
    const addField = (name, value, inline = true) => {
        const v = typeof value === 'string' ? value : String(value);
        if (isValidValue(v) && v !== 'null' && v !== 'undefined') {
            embed.addFields({ name, value: truncate(v, 1024), inline });
        }
    };

    if (endpoint === 'characters') {
        if (isValidValue(data.personal)) {
            const p = data.personal;
            if (isValidValue(p.birthdate)) addField('🎂 Sinh nhật', p.birthdate);
            if (isValidValue(p.sex)) addField('⚧ Giới tính', p.sex);
            if (isValidValue(p.status)) addField('💀 Trạng thái', p.status);

            const clan = p.clan || (Array.isArray(p.clan) ? p.clan.join(', ') : null);
            if (isValidValue(clan)) addField('🏯 Clan', typeof clan === 'object' ? clan.name || JSON.stringify(clan) : String(clan));

            if (isValidValue(p.kekkeiGenkai)) addField('👁️ Kekkei Genkai', arrayToString([].concat(p.kekkeiGenkai)));
            if (isValidValue(p.affiliation)) addField('🌿 Tổ chức', arrayToString([].concat(p.affiliation)));
            if (isValidValue(p.team)) addField('⚔️ Đội', arrayToString([].concat(p.team)));
            if (isValidValue(p.occupation)) addField('💼 Chức vụ', arrayToString([].concat(p.occupation)));

            if (isValidValue(p.height)) {
                const h = typeof p.height === 'object' ? Object.values(p.height)[0] : p.height;
                addField('📏 Chiều cao', String(h));
            }
        }

        const jutsuStr = arrayToString(data.jutsu, 8);
        if (isValidValue(jutsuStr)) addField('🌀 Jutsu', jutsuStr, false);

        const natureStr = arrayToString(data.natureType, 6);
        if (isValidValue(natureStr)) addField('🔥 Chakra Nature', natureStr, false);

        if (isValidValue(data.voiceActors)) {
            const va = data.voiceActors;
            if (va.japanese && isValidValue(va.japanese.adult))
                addField('🎙️ VA (JP)', typeof va.japanese.adult === 'string' ? va.japanese.adult : arrayToString([].concat(va.japanese.adult)));
        }
    }

    else if (endpoint === 'clans') {
        if (isValidValue(data.characters)) {
            addField('👥 Thành viên', arrayToString(data.characters, 12), false);
        }
    }

    else if (endpoint === 'villages') {
        if (isValidValue(data.characters)) {
            addField('🧑‍🤝‍🧑 Nhân vật', arrayToString(data.characters, 10), false);
        }
    }

    else if (endpoint === 'kekkei-genkai') {
        if (isValidValue(data.characters)) {
            addField('🥷 Người sở hữu', arrayToString(data.characters, 12), false);
        }
    }

    else if (endpoint === 'tailed-beasts') {
        if (isValidValue(data.jutsu)) addField('🌀 Jutsu', arrayToString(data.jutsu, 6), false);
        if (isValidValue(data.nature)) addField('🔥 Nature', arrayToString(data.nature, 6));
        if (isValidValue(data.jinchuriki)) {
            addField('⛓️ Jinchūriki', arrayToString(data.jinchuriki, 8), false);
        }
    }

    else if (endpoint === 'teams') {
        if (isValidValue(data.characters)) {
            addField('👥 Thành viên', arrayToString(data.characters, 10), false);
        }
    }

    else if (endpoint === 'akatsuki') {
        if (isValidValue(data.jutsu)) addField('🌀 Jutsu', arrayToString(data.jutsu, 8), false);
        if (isValidValue(data.natureType)) addField('🔥 Nature', arrayToString(data.natureType, 6));
        if (isValidValue(data.personal)) {
            const p = data.personal;
            if (isValidValue(p.status)) addField('💀 Trạng thái', p.status);
            if (isValidValue(p.affiliation)) addField('🌿 Tổ chức', arrayToString([].concat(p.affiliation)));
        }
    }

    else if (endpoint === 'kara') {
        if (isValidValue(data.jutsu)) addField('🌀 Jutsu', arrayToString(data.jutsu, 8), false);
        if (isValidValue(data.natureType)) addField('🔥 Nature', arrayToString(data.natureType, 6));
        if (isValidValue(data.personal)) {
            const p = data.personal;
            if (isValidValue(p.status)) addField('💀 Trạng thái', p.status);
        }
    }
}

function buildHelpEmbed(prefix) {
    return new EmbedBuilder()
        .setColor(0xFF6B00)
        .setTitle('📖 Hướng Dẫn Sử Dụng — Naruto Wiki')
        .setDescription(
            `> Tra cứu thông tin vũ trụ **Naruto** ngay trong Discord!\n\n` +
            `**Cú pháp:** \`${prefix}naruto <loại> <tên>\``
        )
        .addFields(
            {
                name: '🥷 Nhân Vật',
                value: `\`char\` / \`character\`\nVí dụ: \`${prefix}naruto char Naruto\``,
                inline: true,
            },
            {
                name: '🏯 Clan',
                value: `\`clan\`\nVí dụ: \`${prefix}naruto clan Uchiha\``,
                inline: true,
            },
            {
                name: '🌿 Làng',
                value: `\`village\` / \`lang\`\nVí dụ: \`${prefix}naruto village Konoha\``,
                inline: true,
            },
            {
                name: '👁️ Kekkei Genkai',
                value: `\`kkg\` / \`kekkei\`\nVí dụ: \`${prefix}naruto kkg Sharingan\``,
                inline: true,
            },
            {
                name: '🦊 Bijuu',
                value: `\`beast\` / \`bijuu\`\nVí dụ: \`${prefix}naruto beast Kurama\``,
                inline: true,
            },
            {
                name: '⚔️ Đội',
                value: `\`team\`\nVí dụ: \`${prefix}naruto team Team 7\``,
                inline: true,
            },
            {
                name: '☁️ Akatsuki',
                value: `\`akatsuki\` / \`aka\`\nVí dụ: \`${prefix}naruto aka Itachi\``,
                inline: true,
            },
            {
                name: '🔵 Kara',
                value: `\`kara\`\nVí dụ: \`${prefix}naruto kara Jigen\``,
                inline: true,
            },
        )
        .setFooter({ text: 'Dattebayo! • Powered by dattebayo-api.onrender.com' })
        .setTimestamp();
}

function buildResultEmbed(data, collectionMeta, endpoint) {
    const imageUrl = getImageUrl(data);
    const color = COLLECTION_COLORS[endpoint] ?? 0xFF6B00;

    const name = data.name || data.japaneseName || data.title || 'Không rõ';

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${collectionMeta.label}: ${name}`)
        .setDescription(
            isValidValue(data.description)
                ? truncate(data.description, 300)
                : isValidValue(data.about)
                    ? truncate(data.about, 300)
                    : null
        )
        .setFooter({
            text: `Dattebayo! • ${collectionMeta.label} • ID: ${data.id ?? '?'}`,
        })
        .setTimestamp();

    if (imageUrl) embed.setThumbnail(imageUrl);

    buildDynamicFields(embed, data, endpoint);

    return embed;
}

module.exports = {
    name: 'naruto',
    aliases: ['ninfo', 'nwiki', 'naru'],
    description: 'Tra cứu thông tin vũ trụ Naruto qua Dattebayo API',
    usage: '<loại_dữ_liệu> <tên_cần_tìm>',
    cooldown: 5,

    async execute(message, args, client) {
        const prefix = client?.prefix ?? message.guild?.me?.displayName ?? '!';

        if (!args[0]) {
            return message.reply({ embeds: [buildHelpEmbed(prefix)] });
        }

        const typeAlias = args[0].toLowerCase();
        const collectionMeta = COLLECTION_MAP[typeAlias];

        if (!collectionMeta) {
            const helpEmbed = buildHelpEmbed(prefix);
            helpEmbed.setDescription(
                `> ❌ Loại dữ liệu \`${typeAlias}\` không hợp lệ.\n` +
                `> Các loại được hỗ trợ xem bên dưới:`
            );
            return message.reply({ embeds: [helpEmbed] });
        }

        const query = args.slice(1).join(' ').trim();

        if (!query) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xE74C3C)
                        .setTitle('⚠️ Thiếu từ khoá tìm kiếm')
                        .setDescription(
                            `Bạn cần nhập tên cần tìm!\n` +
                            `**Ví dụ:** \`${prefix}naruto ${typeAlias} Naruto Uzumaki\``
                        ),
                ],
            });
        }

        const loadingMsg = await message.channel.send(
            '🍥 **Đang tra cứu thư tịch cổ...** Dattebayo!'
        );

        try {
            const { endpoint, label, dataKey } = collectionMeta;
            const url = `${BASE_URL}/${endpoint}`;

            const response = await axios.get(url, {
                params: { name: query },
                timeout: 10_000, 
                headers: { 'Accept': 'application/json' },
            });

            const responseData = response.data;

            const dataArray = responseData[dataKey] ?? responseData.data ?? null;

            if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) {
                return loadingMsg.edit(
                    `❌ Không tìm thấy **${label}** nào có tên \`${query}\`. Thử tên khác nhé!`
                );
            }

            const result = dataArray[0]; 

            const resultEmbed = buildResultEmbed(result, collectionMeta, endpoint);

            await loadingMsg.delete().catch(() => { }); 
            return message.reply({ embeds: [resultEmbed] });

        } catch (error) {
            console.error(`[naruto.js] Lỗi khi gọi API:`, error?.response?.data ?? error.message);

            const isApiError = error.response?.status;
            const errorEmbed = new EmbedBuilder()
                .setColor(0xE74C3C)
                .setTitle('⚠️ Lỗi Tra Cứu')
                .setDescription(
                    isApiError
                        ? `API trả về lỗi **${isApiError}**: ${error.response?.statusText ?? 'Unknown'}`
                        : `Không thể kết nối đến Dattebayo API. Hãy thử lại sau!`
                )
                .setFooter({ text: error.message?.slice(0, 100) ?? 'Unknown error' });

            return loadingMsg.edit({ content: null, embeds: [errorEmbed] });
        }
    },
};