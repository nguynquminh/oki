
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require('discord.js');
const axios = require('axios');
const https = require('https');
const dns = require('dns');
const NodeCache = require('node-cache');

dns.setDefaultResultOrder('ipv4first');

const genshinApi = axios.create({
    baseURL: 'https://genshin.jmp.blue',
    httpsAgent: new https.Agent({ family: 4, keepAlive: true }),
    timeout: 12_000,
    headers: { 'Accept': 'application/json', 'User-Agent': 'DiscordBot/1.0 (GenshinLookup)' },
});

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

const ITEMS_PER_PAGE = 15; 
const COLLECTOR_TIMEOUT = 60_000; 
const READ_TIMEOUT = 3 * 60_000; 

const TYPE_META = {
    artifacts: { emoji: '🏺', label: 'Artifact', endpoint: 'artifacts', color: 0xF4B942 },
    boss: { emoji: '👹', label: 'Weekly Boss', endpoint: 'boss/weekly-boss', color: 0xC0392B },
    characters: { emoji: '👤', label: 'Nhân Vật', endpoint: 'characters', color: 0x3498DB },
    domains: { emoji: '🏯', label: 'Domain', endpoint: 'domains', color: 0x8E44AD },
    elements: { emoji: '🔮', label: 'Nguyên Tố', endpoint: 'elements', color: 0x1ABC9C },
    enemies: { emoji: '👾', label: 'Kẻ Địch', endpoint: 'enemies', color: 0xE74C3C },
    nations: { emoji: '🏰', label: 'Quốc Gia', endpoint: 'nations', color: 0x27AE60 },
    weapons: { emoji: '⚔️', label: 'Vũ Khí', endpoint: 'weapons', color: 0x95A5A6 },
};

const VALID_TYPES = Object.keys(TYPE_META);

const truncate = (str, max = 1024) =>
    str && str.length > max ? str.slice(0, max - 1) + '…' : (str ?? '');

const toSlug = (str) =>
    str.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

const errorEmbed = (desc) =>
    new EmbedBuilder().setColor(0xE74C3C).setTitle('⚠️ Lỗi').setDescription(desc).setTimestamp();

function buildMenuEmbed(prefix) {
    const embed = new EmbedBuilder()
        .setColor(0x1B6CA8)
        .setTitle('🎮 Genshin Impact — Tra cứu thông tin')
        .setDescription(
            `Tra cứu dữ liệu từ **Genshin Impact** ngay trong Discord!\n\n` +
            `**Cú pháp:**\n` +
            `\`${prefix}genshin <loại>\` — Xem danh sách\n` +
            `\`${prefix}genshin <loại> <tên>\` — Tìm kiếm trực tiếp`
        )
        .setFooter({ text: 'Powered by genshin.jmp.blue' })
        .setTimestamp();

    for (const [key, meta] of Object.entries(TYPE_META)) {
        embed.addFields({
            name: `${meta.emoji} ${meta.label}`,
            value: `\`${prefix}genshin ${key}\``,
            inline: true,
        });
    }

    embed.addFields({
        name: '💡 Ví dụ',
        value:
            `\`${prefix}genshin characters hu tao\`\n` +
            `\`${prefix}genshin weapons staff of homa\`\n` +
            `\`${prefix}genshin elements pyro\``,
        inline: false,
    });

    return embed;
}

function buildDetailEmbed(type, data) {
    const meta = TYPE_META[type];
    const embed = new EmbedBuilder()
        .setColor(meta.color)
        .setTimestamp()
        .setFooter({ text: `Genshin Impact • ${meta.label}` });

    if (data.images?.nameicon) embed.setThumbnail(`https://genshin.jmp.blue/img/${data.images.nameicon}.png`).catch?.(() => { });
    if (data.images?.card) embed.setThumbnail(data.images.card);

    switch (type) {
        case 'characters': {
            embed.setTitle(`${meta.emoji} ${data.name ?? 'Không rõ'}`);
            if (data.description) embed.setDescription(truncate(data.description, 300));

            const fields = [];
            if (data.rarity) fields.push({ name: '⭐ Độ hiếm', value: `${data.rarity} ★`, inline: true });
            if (data.vision) fields.push({ name: '🌋 Nguyên tố', value: data.vision, inline: true });
            if (data.weapon) fields.push({ name: '🎯 Vũ khí', value: data.weapon, inline: true });
            if (data.nation) fields.push({ name: '🏰 Quốc gia', value: data.nation, inline: true });
            if (data.constellation) fields.push({ name: '✨ Chòm sao', value: data.constellation, inline: true });
            if (data.birthday) fields.push({ name: '🎂 Sinh nhật', value: data.birthday, inline: true });
            if (data.affiliation) fields.push({ name: '🏛️ Tổ chức', value: data.affiliation, inline: true });
            if (data.title) fields.push({ name: '📛 Danh hiệu', value: data.title, inline: true });

            if (Array.isArray(data.skillTalents) && data.skillTalents.length) {
                const skills = data.skillTalents.slice(0, 3).map(s => `• **${s.name}** *(${s.unlock})*`).join('\n');
                fields.push({ name: '🌀 Skill Talents', value: skills, inline: false });
            }
            if (fields.length) embed.addFields(fields);
            break;
        }

        case 'artifacts': {
            embed.setTitle(`${meta.emoji} ${data.name ?? 'Không rõ'}`);
            const fields = [];
            if (data.max_rarity) fields.push({ name: '⭐ Độ hiếm tối đa', value: `${data.max_rarity} ★`, inline: true });
            if (data['1-piece_bonus']) fields.push({ name: '🔹 Hiệu ứng 1 mảnh', value: truncate(data['1-piece_bonus'], 400), inline: false });
            if (data['2-piece_bonus']) fields.push({ name: '🔷 Hiệu ứng 2 mảnh', value: truncate(data['2-piece_bonus'], 400), inline: false });
            if (data['4-piece_bonus']) fields.push({ name: '💠 Hiệu ứng 4 mảnh', value: truncate(data['4-piece_bonus'], 512), inline: false });
            if (fields.length) embed.addFields(fields);
            break;
        }

        case 'weapons': {
            embed.setTitle(`${meta.emoji} ${data.name ?? 'Không rõ'}`);
            const fields = [];
            if (data.rarity) fields.push({ name: '⭐ Độ hiếm', value: `${data.rarity} ★`, inline: true });
            if (data.type) fields.push({ name: '🔫 Loại', value: data.type, inline: true });
            if (data.baseAttack) fields.push({ name: '⚔️ Base ATK (Lv.1)', value: String(data.baseAttack), inline: true });
            if (data.subStat) fields.push({ name: '📊 Thuộc tính phụ', value: `${data.subStat}${data.subValue ? ` (${data.subValue})` : ''}`, inline: true });
            if (data.passiveName || data.passiveDesc) {
                const passiveVal = [data.passiveName ? `**${data.passiveName}**` : null, data.passiveDesc].filter(Boolean).join(': ');
                fields.push({ name: '✨ Hiệu ứng thụ động', value: truncate(passiveVal, 400), inline: false });
            }
            if (data.description) fields.push({ name: '📖 Mô tả', value: truncate(data.description, 300), inline: false });
            if (fields.length) embed.addFields(fields);
            break;
        }

        case 'elements': {
            embed.setTitle(`${meta.emoji} ${data.name ?? 'Không rõ'}`);
            const fields = [];
            if (data.archon) fields.push({ name: '🎭 Thần Archon', value: data.archon, inline: true });
            if (data.nation) fields.push({ name: '🏰 Quốc gia', value: data.nation, inline: true });
            if (fields.length) embed.addFields(fields);

            if (Array.isArray(data.reactions) && data.reactions.length) {
                for (const rxn of data.reactions.slice(0, 4)) {
                    const elems = (rxn.elements ?? []).join(' + ');
                    embed.addFields({
                        name: `⚡ ${rxn.name}${elems ? ` (${elems})` : ''}`,
                        value: truncate(rxn.description, 300),
                        inline: false,
                    });
                }
            }
            break;
        }

        case 'nations': {
            embed.setTitle(`${meta.emoji} ${data.name ?? 'Không rõ'}`);
            const fields = [];
            if (data.archon) fields.push({ name: '👑 Thần Archon', value: data.archon, inline: true });
            if (data.element) fields.push({ name: '🌋 Nguyên tố', value: data.element, inline: true });
            if (data.controllingEntity) fields.push({ name: '🏛️ Cai trị', value: data.controllingEntity, inline: true });
            if (fields.length) embed.addFields(fields);
            break;
        }

        case 'boss': {
            embed.setTitle(`${meta.emoji} ${data.name ?? 'Không rõ'}`);
            if (data.description) embed.setDescription(truncate(data.description, 300));
            if (data.location) embed.addFields({ name: '📍 Vị trí', value: data.location, inline: true });

            if (Array.isArray(data.drops) && data.drops.length) {
                const dropsText = data.drops.map(d => `• **${d.name}** (⭐${d.rarity}) — ${d.source ?? ''}`).join('\n');
                embed.addFields({ name: '💎 Phần thưởng rơi', value: truncate(dropsText, 512), inline: false });
            }
            if (Array.isArray(data.artifacts) && data.artifacts.length) {
                const artText = data.artifacts.map(a => `• ${a.name} (tối đa ⭐${a.max_rarity})`).join('\n');
                embed.addFields({ name: '🏺 Artifact', value: truncate(artText, 512), inline: false });
            }
            break;
        }

        case 'domains': {
            embed.setTitle(`${meta.emoji} ${data.name ?? 'Không rõ'}`);
            if (data.description) embed.setDescription(truncate(data.description, 250));
            const fields = [];
            if (data.location) fields.push({ name: '📍 Vị trí', value: data.location, inline: true });
            if (data.nation) fields.push({ name: '🌏 Quốc gia', value: data.nation, inline: true });
            if (data.type) fields.push({ name: '🏷️ Loại', value: data.type, inline: true });
            if (fields.length) embed.addFields(fields);

            if (Array.isArray(data.recommendedElements) && data.recommendedElements.length) {
                embed.addFields({ name: '✨ Nguyên tố đề xuất', value: data.recommendedElements.join(', '), inline: false });
            }
            if (Array.isArray(data.requirements) && data.requirements.length) {
                const reqText = data.requirements.slice(0, 3).map(r =>
                    `• AR ${r.adventureRank}+ | Lv.${r.recommendedLevel}${r.leyLineDisorder?.length ? `\n  > ${r.leyLineDisorder[0]}` : ''}`
                ).join('\n');
                embed.addFields({ name: '⚠️ Yêu cầu & Ley Line', value: truncate(reqText, 400), inline: false });
            }
            break;
        }

        case 'enemies': {
            embed.setTitle(`${meta.emoji} ${data.name ?? 'Không rõ'}`);
            if (data.description) embed.setDescription(truncate(data.description, 250));
            const fields = [];
            if (data.type) fields.push({ name: '🏷️ Loại', value: data.type, inline: true });
            if (data.family) fields.push({ name: '👪 Họ', value: data.family, inline: true });
            if (data.faction) fields.push({ name: '🔱 Phe phái', value: data.faction, inline: true });
            if (data.region) fields.push({ name: '🗺️ Khu vực', value: data.region, inline: true });
            if (Array.isArray(data.elements) && data.elements.length)
                fields.push({ name: '⚡ Nguyên tố', value: data.elements.join(', '), inline: true });
            if (data['mora-gained'])
                fields.push({ name: '💰 Mora nhận được', value: String(data['mora-gained']), inline: true });
            if (fields.length) embed.addFields(fields);

            if (Array.isArray(data.drops) && data.drops.length) {
                const dropText = data.drops.slice(0, 8).map(d =>
                    `• **${d.name}** (⭐${d.rarity}) — Lv.${d['minimum-level']}+`
                ).join('\n');
                embed.addFields({ name: '💎 Phần thưởng', value: truncate(dropText, 512), inline: false });
            }
            break;
        }

        default: {
            embed.setTitle(`${meta.emoji} ${data.name ?? type}`);
            const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== '');
            for (const [k, v] of entries.slice(0, 10)) {
                const val = Array.isArray(v) ? v.slice(0, 5).join(', ') : String(v);
                embed.addFields({ name: k, value: truncate(val, 200), inline: true });
            }
        }
    }

    return embed;
}

function buildListEmbed(type, items, page) {
    const meta = TYPE_META[type];
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    const start = (page - 1) * ITEMS_PER_PAGE;
    const slice = items.slice(start, start + ITEMS_PER_PAGE);

    const desc = slice.map((item, i) => `\`${start + i + 1}.\` ${item}`).join('\n');

    return new EmbedBuilder()
        .setColor(meta.color)
        .setTitle(`${meta.emoji} Danh sách ${meta.label} — Trang ${page}/${totalPages}`)
        .setDescription(desc)
        .addFields({
            name: '🔎 Tìm kiếm chi tiết',
            value: `Nhấn **Tìm kiếm** hoặc gõ lại lệnh:\n\`!genshin ${type} <tên>\``,
            inline: false,
        })
        .setFooter({ text: `Tổng cộng ${items.length} mục • Powered by genshin.jmp.blue` })
        .setTimestamp();
}

function buildNavRow(page, totalPages) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('g_first').setLabel('⏮').setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 1),
        new ButtonBuilder()
            .setCustomId('g_prev').setLabel('◀').setStyle(ButtonStyle.Primary)
            .setDisabled(page === 1),
        new ButtonBuilder()
            .setCustomId('g_page').setLabel(`${page} / ${totalPages}`).setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('g_next').setLabel('▶').setStyle(ButtonStyle.Primary)
            .setDisabled(page >= totalPages),
        new ButtonBuilder()
            .setCustomId('g_last').setLabel('⏭').setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= totalPages),
    );
}

async function fetchList(type) {
    const cacheKey = `list:${type}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const meta = TYPE_META[type];
    const response = await genshinApi.get(`/${meta.endpoint}`);
    const items = response.data;

    cache.set(cacheKey, items);
    return items;
}

async function fetchDetail(type, slug) {
    const cacheKey = `detail:${type}:${slug}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const meta = TYPE_META[type];
    const response = await genshinApi.get(`/${meta.endpoint}/${slug}`);
    const data = response.data;

    cache.set(cacheKey, data);
    return data;
}

async function showList(targetMsg, type, items, startPage, originalAuthorId) {
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    let currentPage = startPage;

    await targetMsg.edit({
        content: null,
        embeds: [buildListEmbed(type, items, currentPage)],
        components: [buildNavRow(currentPage, totalPages)],
    });

    const collector = targetMsg.channel.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: btn => ['g_first', 'g_prev', 'g_next', 'g_last'].includes(btn.customId)
            && btn.user.id === originalAuthorId,
        time: READ_TIMEOUT,
    });

    collector.on('collect', async btn => {
        await btn.deferUpdate();
        if (btn.customId === 'g_first') currentPage = 1;
        if (btn.customId === 'g_prev') currentPage = Math.max(1, currentPage - 1);
        if (btn.customId === 'g_next') currentPage = Math.min(totalPages, currentPage + 1);
        if (btn.customId === 'g_last') currentPage = totalPages;

        await targetMsg.edit({
            embeds: [buildListEmbed(type, items, currentPage)],
            components: [buildNavRow(currentPage, totalPages)],
        });
    });

    collector.on('end', async (_, reason) => {
        if (reason === 'time') {
            await targetMsg.edit({ components: [] }).catch(() => { });
        }
    });
}

module.exports = {
    name: 'genshin',
    aliases: ['gs', 'gi', 'genshininfo'],
    description: 'Tra cứu thông tin Genshin Impact qua genshin.jmp.blue',
    usage: '<loại> [tên]',
    cooldown: 5,

    async execute(message, args, client) {
        const prefix = client?.prefix ?? '!';

        if (!args[0]) {
            return message.reply({ embeds: [buildMenuEmbed(prefix)] });
        }

        const type = args[0].toLowerCase();

        if (!VALID_TYPES.includes(type)) {
            return message.reply({
                embeds: [
                    errorEmbed(
                        `Loại \`${type}\` không hợp lệ!\n\n` +
                        `Các loại hợp lệ: ${VALID_TYPES.map(t => `\`${t}\``).join(', ')}\n\n` +
                        `Gõ \`${prefix}genshin\` để xem hướng dẫn đầy đủ.`
                    ),
                ],
            });
        }

        const query = args.slice(1).join(' ').trim();
        const meta = TYPE_META[type];

        const loadingMsg = await message.channel.send(
            `${meta.emoji} **Đang tra cứu ${meta.label}...** *(Teyvatian Archives)*`
        );

        try {
            if (query) {
                const slug = toSlug(query);

                if (!slug) {
                    return loadingMsg.edit({
                        content: null,
                        embeds: [errorEmbed('Tên tìm kiếm không hợp lệ. Chỉ dùng chữ cái và số!')],
                    });
                }

                const data = await fetchDetail(type, slug);
                const resultEmbed = buildDetailEmbed(type, data);

                return loadingMsg.edit({ content: null, embeds: [resultEmbed], components: [] });
            }

            const items = await fetchList(type);

            if (!Array.isArray(items) || items.length === 0) {
                return loadingMsg.edit({
                    content: null,
                    embeds: [errorEmbed(`Không có dữ liệu cho mục **${meta.label}** lúc này.`)],
                });
            }

            await showList(loadingMsg, type, items, 1, message.author.id);

        } catch (err) {
            const code = err.code;
            const status = err.response?.status;
            const isNet = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'].includes(code);

            let userMsg;
            if (status === 404) {
                userMsg = `Không tìm thấy **"${query || type}"** trong danh mục **${meta.label}**.\n> Kiểm tra lại chính tả hoặc thử tên tiếng Anh.`;
            } else if (status === 429) {
                userMsg = 'Quá nhiều yêu cầu! API đang bị giới hạn. Vui lòng thử lại sau vài giây.';
            } else if (isNet) {
                userMsg = `Không thể kết nối đến **genshin.jmp.blue**.\n> Lỗi mạng: \`${code}\``;
                console.error(`[genshin.js] Lỗi mạng (${code}):`, err.message);
            } else {
                userMsg = `Lỗi không xác định. Vui lòng thử lại!\n> \`${err.message?.slice(0, 120)}\``;
                console.error('[genshin.js] Unknown error:', err.response?.data ?? err.message);
            }

            await loadingMsg.edit({
                content: null,
                embeds: [errorEmbed(userMsg)],
                components: [],
            }).catch(() => { });
        }
    },
};