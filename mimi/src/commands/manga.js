
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const axios = require('axios');
const https = require('https');
const dns = require('dns');

dns.setDefaultResultOrder('ipv4first');

const httpAgent = new https.Agent({
    family: 4,          
    keepAlive: true,    
});

const api = axios.create({
    httpsAgent: httpAgent,
    timeout: 15_000,
    headers: {
        'User-Agent': 'DiscordBot/1.0 (MangaDex Reader)',
        'Accept': 'application/json',
    },
});

const MANGADEX_API = 'https://api.mangadex.org';
const MANGADEX_COVER = 'https://uploads.mangadex.org/covers';

const COLLECTOR_TIMEOUT = 60_000; 

const COLOR_PRIMARY = 0xF4811F; 
const COLOR_ERROR = 0xE74C3C;
const COLOR_SUCCESS = 0x2ECC71;
const COLOR_NEUTRAL = 0x5865F2;

const truncate = (str, max = 1024) =>
    str && str.length > max ? str.slice(0, max - 1) + '…' : str ?? '';

function getMangaTitle(titleObj = {}) {
    return titleObj.en || titleObj.vi || titleObj['ja-ro'] || Object.values(titleObj)[0] || 'Không có tiêu đề';
}

function getMangaDesc(descObj = {}) {
    const raw = descObj.vi || descObj.en || Object.values(descObj)[0] || 'Không có mô tả.';
    return truncate(raw, 350);
}

function getCoverUrl(mangaId, relationships = []) {
    const coverRel = relationships.find(r => r.type === 'cover_art');
    if (!coverRel) return null;
    const fileName = coverRel.attributes?.fileName;
    if (!fileName) return null;
    return `${MANGADEX_COVER}/${mangaId}/${fileName}.256.jpg`;
}

function errorEmbed(desc) {
    return new EmbedBuilder()
        .setColor(COLOR_ERROR)
        .setTitle('⚠️ Đã xảy ra lỗi')
        .setDescription(desc)
        .setTimestamp();
}

function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
}

async function stepSelectManga(interaction, query, originalMessage) {
    const searchRes = await api.get(`${MANGADEX_API}/manga`, {
        params: {
            title: query,
            limit: 5,
            'includes[]': ['cover_art'],
            'order[relevance]': 'desc',
        },
        timeout: 10_000,
    });

    const results = searchRes.data?.data ?? [];

    if (!results.length) {
        await interaction.edit({ content: null, embeds: [errorEmbed(`Không tìm thấy manga nào với tên **"${query}"**.`)], components: [] });
        return;
    }

    const embed = new EmbedBuilder()
        .setColor(COLOR_PRIMARY)
        .setTitle(`🔍 Kết quả tìm kiếm: "${query}"`)
        .setDescription('Chọn manga bạn muốn đọc bằng cách nhấn nút bên dưới:')
        .setFooter({ text: `Tìm thấy ${results.length} kết quả • Hết hạn sau 60 giây` })
        .setTimestamp();

    results.forEach((manga, i) => {
        const title = getMangaTitle(manga.attributes.title);
        const status = manga.attributes.status ?? '?';
        const year = manga.attributes.year ?? '?';
        const lang = manga.attributes.originalLanguage ?? '?';
        embed.addFields({
            name: `${i + 1}. ${title}`,
            value: `📅 ${year} • 💬 ${status} • 🌐 ${lang}`,
            inline: false,
        });
    });

    const row = new ActionRowBuilder().addComponents(
        results.map((_, i) =>
            new ButtonBuilder()
                .setCustomId(`manga_select_${i}`)
                .setLabel(`${i + 1}`)
                .setStyle(ButtonStyle.Primary)
        )
    );

    await interaction.edit({ content: null, embeds: [embed], components: [row] });

    const collector = interaction.channel.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: btn => btn.customId.startsWith('manga_select_') && btn.user.id === originalMessage.author.id,
        time: COLLECTOR_TIMEOUT,
        max: 1,
    });

    collector.on('collect', async btn => {
        await btn.deferUpdate();
        const idx = parseInt(btn.customId.split('_').pop());
        const selected = results[idx];
        await stepSelectLanguage(interaction, selected, originalMessage);
    });

    collector.on('end', async (_, reason) => {
        if (reason === 'time') {
            await interaction.edit({
                embeds: [errorEmbed('⏱️ Hết thời gian chờ. Hãy chạy lại lệnh `!manga`.')],
                components: [],
            }).catch(() => { });
        }
    });
}

async function stepSelectLanguage(interaction, manga, originalMessage) {
    const title = getMangaTitle(manga.attributes.title);
    const desc = getMangaDesc(manga.attributes.description);
    const year = manga.attributes.year ?? 'Không rõ';
    const status = manga.attributes.status ?? 'Không rõ';
    const tags = manga.attributes.tags?.slice(0, 6).map(t => t.attributes.name.en).filter(Boolean).join(', ') || 'N/A';
    const coverUrl = getCoverUrl(manga.id, manga.relationships);

    const embed = new EmbedBuilder()
        .setColor(COLOR_PRIMARY)
        .setTitle(`📘 ${title}`)
        .setDescription(desc)
        .addFields(
            { name: '📅 Năm phát hành', value: String(year), inline: true },
            { name: '💬 Trạng thái', value: status, inline: true },
            { name: '🏷️ Thể loại', value: tags, inline: false },
        )
        .setFooter({ text: 'Chọn ngôn ngữ để đọc • Hết hạn sau 60 giây' })
        .setTimestamp();

    if (coverUrl) embed.setThumbnail(coverUrl);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('lang_en').setLabel('🇬🇧 Tiếng Anh').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('lang_vi').setLabel('🇻🇳 Tiếng Việt').setStyle(ButtonStyle.Secondary),
    );

    await interaction.edit({ embeds: [embed], components: [row] });

    const collector = interaction.channel.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: btn => ['lang_en', 'lang_vi'].includes(btn.customId) && btn.user.id === originalMessage.author.id,
        time: COLLECTOR_TIMEOUT,
        max: 1,
    });

    collector.on('collect', async btn => {
        await btn.deferUpdate();
        const language = btn.customId === 'lang_vi' ? 'vi' : 'en';
        await stepSelectChapter(interaction, manga, language, originalMessage);
    });

    collector.on('end', async (_, reason) => {
        if (reason === 'time') {
            await interaction.edit({
                embeds: [errorEmbed('⏱️ Hết thời gian chờ. Hãy chạy lại lệnh `!manga`.')],
                components: [],
            }).catch(() => { });
        }
    });
}

async function stepSelectChapter(interaction, manga, language, originalMessage) {
    const mangaTitle = getMangaTitle(manga.attributes.title);

    const feedRes = await api.get(`${MANGADEX_API}/manga/${manga.id}/feed`, {
        params: {
            'translatedLanguage[]': language,
            limit: 100,
            'order[chapter]': 'asc',
            'order[updatedAt]': 'desc',
        },
        timeout: 10_000,
    });

    const chapters = feedRes.data?.data ?? [];

    if (!chapters.length) {
        const langLabel = language === 'vi' ? 'Tiếng Việt' : 'Tiếng Anh';
        await interaction.edit({
            embeds: [errorEmbed(`Không tìm thấy chương **${langLabel}** nào cho manga này.\nThử chọn ngôn ngữ khác?`)],
            components: [],
        });
        return;
    }

    const uniqueChapters = Object.values(
        chapters.reduce((acc, ch) => {
            const num = ch.attributes.chapter ?? 'Extra';
            if (!acc[num]) acc[num] = ch;
            return acc;
        }, {})
    );

    const PAGE_SIZE = 20;
    let currentPage = 0;
    const totalPages = Math.ceil(uniqueChapters.length / PAGE_SIZE);

    const buildChapterEmbed = (page) => {
        const start = page * PAGE_SIZE;
        const pageChaps = uniqueChapters.slice(start, start + PAGE_SIZE);

        const embed = new EmbedBuilder()
            .setColor(COLOR_NEUTRAL)
            .setTitle(`📚 ${mangaTitle} — Danh sách chương`)
            .setDescription(`Ngôn ngữ: **${language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 Tiếng Anh'}** • Tổng: **${uniqueChapters.length}** chương`)
            .setFooter({ text: `Trang ${page + 1}/${totalPages} • Nhấn nút để chọn chương • Hết hạn sau 60s` })
            .setTimestamp();

        pageChaps.forEach((ch, i) => {
            const chNum = ch.attributes.chapter ?? 'Extra';
            const chTitle = ch.attributes.title ? ` — ${truncate(ch.attributes.title, 40)}` : '';
            const pages = ch.attributes.pages ?? '?';
            embed.addFields({
                name: `${start + i + 1}. Chương ${chNum}${chTitle}`,
                value: `📄 ${pages} trang`,
                inline: true,
            });
        });

        return embed;
    };

    const buildChapterRows = (page) => {
        const start = page * PAGE_SIZE;
        const pageChaps = uniqueChapters.slice(start, start + PAGE_SIZE);

        const chapBtnChunks = chunkArray(pageChaps, 5).slice(0, 3);
        const rows = chapBtnChunks.map((chunk, ri) =>
            new ActionRowBuilder().addComponents(
                chunk.map((ch, bi) => {
                    const globalIdx = start + ri * 5 + bi;
                    const chNum = ch.attributes.chapter ?? 'Extra';
                    return new ButtonBuilder()
                        .setCustomId(`chap_${globalIdx}`)
                        .setLabel(`Ch.${chNum}`)
                        .setStyle(ButtonStyle.Secondary);
                })
            )
        );

        if (totalPages > 1) {
            const navRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('page_prev').setLabel('◀ Trước').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
                new ButtonBuilder().setCustomId('page_next').setLabel('Tiếp ▶').setStyle(ButtonStyle.Primary).setDisabled(page >= totalPages - 1),
            );
            rows.push(navRow);
        }

        return rows;
    };

    await interaction.edit({
        embeds: [buildChapterEmbed(currentPage)],
        components: buildChapterRows(currentPage),
    });

    const collector = interaction.channel.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: btn =>
            (btn.customId.startsWith('chap_') || btn.customId.startsWith('page_')) &&
            btn.user.id === originalMessage.author.id,
        time: COLLECTOR_TIMEOUT,
    });

    collector.on('collect', async btn => {
        await btn.deferUpdate();

        if (btn.customId === 'page_prev') {
            currentPage = Math.max(0, currentPage - 1);
            await interaction.edit({ embeds: [buildChapterEmbed(currentPage)], components: buildChapterRows(currentPage) });
            return;
        }
        if (btn.customId === 'page_next') {
            currentPage = Math.min(totalPages - 1, currentPage + 1);
            await interaction.edit({ embeds: [buildChapterEmbed(currentPage)], components: buildChapterRows(currentPage) });
            return;
        }

        collector.stop('selected');
        const chapIdx = parseInt(btn.customId.split('_')[1]);
        await stepReadChapter(interaction, uniqueChapters[chapIdx], mangaTitle, originalMessage);
    });

    collector.on('end', async (_, reason) => {
        if (reason === 'time') {
            await interaction.edit({
                embeds: [errorEmbed('⏱️ Hết thời gian chờ. Hãy chạy lại lệnh `!manga`.')],
                components: [],
            }).catch(() => { });
        }
    });
}

async function stepReadChapter(interaction, chapter, mangaTitle, originalMessage) {
    const chNum = chapter.attributes.chapter ?? 'Extra';
    const chTitle = chapter.attributes.title ?? '';

    const serverRes = await api.get(`${MANGADEX_API}/at-home/server/${chapter.id}`, { timeout: 10_000 });
    const { baseUrl, chapter: chData } = serverRes.data;

    const pages = chData.dataSaver ?? chData.data ?? [];
    const hashPath = chData.dataSaver ? 'data-saver' : 'data';
    const imageUrls = pages.map(img => `${baseUrl}/${hashPath}/${chData.hash}/${img}`);

    if (!imageUrls.length) {
        await interaction.edit({ embeds: [errorEmbed('Không tải được nội dung chương này.')], components: [] });
        return;
    }

    const totalPages = imageUrls.length;

    const previewEmbed = new EmbedBuilder()
        .setColor(COLOR_SUCCESS)
        .setTitle(`📖 ${mangaTitle} — Chương ${chNum}${chTitle ? `: ${chTitle}` : ''}`)
        .setDescription(
            `✅ Đã tải **${totalPages} trang**.\n\n` +
            `**Xem trực tiếp trang đầu bên dưới.**\n` +
            `Dùng các nút điều hướng để lật trang.`
        )
        .setImage(imageUrls[0])
        .setFooter({ text: `Trang 1/${totalPages} • MangaDex` })
        .setTimestamp();

    const buildPageButtons = (idx) =>
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('read_prev').setLabel('◀ Trang trước').setStyle(ButtonStyle.Primary).setDisabled(idx === 0),
            new ButtonBuilder().setCustomId('read_page').setLabel(`${idx + 1} / ${totalPages}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
            new ButtonBuilder().setCustomId('read_next').setLabel('Trang sau ▶').setStyle(ButtonStyle.Primary).setDisabled(idx >= totalPages - 1),
            new ButtonBuilder().setCustomId('read_end').setLabel('✖ Đóng').setStyle(ButtonStyle.Danger),
        );

    await interaction.edit({ embeds: [previewEmbed], components: [buildPageButtons(0)] });

    let currentPageIdx = 0;

    const readCollector = interaction.channel.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: btn =>
            ['read_prev', 'read_next', 'read_end', 'read_page'].includes(btn.customId) &&
            btn.user.id === originalMessage.author.id,
        time: 5 * 60_000, 
    });

    readCollector.on('collect', async btn => {
        await btn.deferUpdate();

        if (btn.customId === 'read_end') {
            readCollector.stop('closed');
            await interaction.edit({
                embeds: [
                    new EmbedBuilder()
                        .setColor(COLOR_NEUTRAL)
                        .setDescription(`📕 Đã đóng chương **${chNum}**. Cảm ơn bạn đã đọc!`)
                ],
                components: [],
            });
            return;
        }

        if (btn.customId === 'read_prev') currentPageIdx = Math.max(0, currentPageIdx - 1);
        if (btn.customId === 'read_next') currentPageIdx = Math.min(totalPages - 1, currentPageIdx + 1);

        const updatedEmbed = EmbedBuilder.from(previewEmbed)
            .setImage(imageUrls[currentPageIdx])
            .setFooter({ text: `Trang ${currentPageIdx + 1}/${totalPages} • MangaDex` });

        await interaction.edit({
            embeds: [updatedEmbed],
            components: [buildPageButtons(currentPageIdx)],
        });
    });

    readCollector.on('end', async (_, reason) => {
        if (reason === 'time') {
            await interaction.edit({ components: [] }).catch(() => { });
        }
    });
}

module.exports = {
    name: 'manga',
    aliases: ['mg', 'read', 'mangadex'],
    description: 'Đọc manga trực tiếp từ MangaDex',
    usage: '<tên manga>',
    cooldown: 5,

    async execute(message, args, client) {
        const query = args.join(' ').trim();

        if (!query) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(COLOR_PRIMARY)
                        .setTitle('📖 Đọc Manga — MangaDex')
                        .setDescription(
                            'Tìm và đọc manga ngay trong Discord!\n\n' +
                            '**Cú pháp:** `!manga <tên manga>`\n' +
                            '**Ví dụ:** `!manga Naruto`\n\n' +
                            '> Hỗ trợ **Tiếng Anh 🇬🇧** và **Tiếng Việt 🇻🇳**'
                        )
                        .setFooter({ text: 'Powered by MangaDex API' }),
                ],
            });
        }

        const loadingMsg = await message.channel.send(
            `🔍 **Đang tìm kiếm:** \`${query}\`...`
        );

        try {
            await stepSelectManga(loadingMsg, query, message);
        } catch (err) {
            const isNetworkErr = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'].includes(err.code);
            const isApiErr = !!err.response?.status;

            let userMsg;
            if (isNetworkErr) {
                userMsg = `Không thể kết nối đến **MangaDex API**.\n> Lỗi mạng: \`${err.code}\`\nVui lòng kiểm tra kết nối hoặc thử lại sau.`;
                console.error(`[manga.js] Lỗi mạng (${err.code}):`, err.message);
            } else if (isApiErr) {
                userMsg = `MangaDex API trả về lỗi **HTTP ${err.response.status}**.\n> ${err.response.statusText ?? 'Unknown'}`;
                console.error(`[manga.js] API error ${err.response.status}:`, err.response.data ?? err.message);
            } else {
                userMsg = `Lỗi không xác định. Vui lòng thử lại!\n> \`${err.message?.slice(0, 100)}\``;
                console.error('[manga.js] Unknown error:', err);
            }

            await loadingMsg.edit({
                content: null,
                embeds: [errorEmbed(userMsg)],
                components: [],
            }).catch(() => { });
        }
    },
};