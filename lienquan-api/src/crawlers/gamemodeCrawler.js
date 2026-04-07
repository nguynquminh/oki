const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// ─── Cấu hình ────────────────────────────────────────────────
const BASE_URL = 'https://lienquan.garena.vn';
const MODES_URL = `${BASE_URL}/hoc-vien/che-do-choi/`;
const OUTPUT_PATH = path.resolve(__dirname, '../../data/gamemodes.json');
const REQUEST_TIMEOUT = 15000;
const DELAY_BETWEEN_REQUESTS = 2000;

// ─── User-Agent ──────────────────────────────────────────────
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
];

function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function createRequest() {
    return axios.create({
        timeout: REQUEST_TIMEOUT,
        headers: { 'User-Agent': getRandomUserAgent() }
    });
}

function resolveUrl(relativeUrl) {
    if (!relativeUrl) return null;
    if (relativeUrl.startsWith('http')) return relativeUrl;
    return new URL(relativeUrl, BASE_URL).href;
}

/**
 * Lấy danh sách các chế độ chơi
 */
async function getGameModes() {
    try {
        console.log('📋 Đang lấy danh sách chế độ chơi...');
        const { data: html } = await createRequest().get(MODES_URL);
        const $ = cheerio.load(html);

        const modes = [];

        $('a.st-game-modes__item').each((_index, element) => {
            const $link = $(element);
            const name = $link.find('h3.st-game-modes__item--name').text().trim();
            const imgTag = $link.find('img');
            const imgUrl = imgTag.length ? resolveUrl(imgTag.attr('src')) : null;
            const detailUrl = resolveUrl($link.attr('href'));
            const keyword = $link.attr('data-keyword') || '';

            if (name && detailUrl) {
                modes.push({
                    name,
                    image_url: imgUrl,
                    detail_url: detailUrl,
                    keyword
                });
            }
        });

        console.log(`✅ Đã tìm thấy ${modes.length} chế độ chơi`);
        return modes;
    } catch (err) {
        console.error(`❌ Lỗi khi lấy danh sách chế độ chơi: ${err.message}`);
        return [];
    }
}

/**
 * Lấy chi tiết mô tả chế độ chơi
 */
async function getModeDetails(url) {
    try {
        const { data: html } = await createRequest().get(url);
        const $ = cheerio.load(html);

        const contentDiv = $('div.game-mode.article');
        if (!contentDiv.length) {
            return null;
        }

        // Lấy ảnh chính
        const mainImg = contentDiv.find('p.text-center img');
        const mainImageUrl = mainImg.length ? resolveUrl(mainImg.attr('src')) : null;

        // Lấy mô tả (paragraphs + lists)
        const description = [];

        contentDiv.find('p').each((_i, el) => {
            const $p = $(el);
            if (!$p.hasClass('text-center')) {
                const text = $p.text().trim();
                if (text) description.push(text);
            }
        });

        contentDiv.find('ul').each((_i, el) => {
            $(el).find('li').each((_j, liEl) => {
                const text = $(liEl).text().trim();
                if (text) description.push(text);
            });
        });

        return { main_image: mainImageUrl, description };
    } catch (err) {
        console.error(`  ❌ Lỗi khi lấy chi tiết từ ${url}: ${err.message}`);
        return null;
    }
}

/**
 * Crawl tất cả chế độ chơi
 */
async function crawlAllGameModes() {
    const modes = await getGameModes();
    if (modes.length === 0) return null;

    const results = [];
    const total = modes.length;

    for (let i = 0; i < total; i++) {
        const mode = modes[i];
        console.log(`\n[${i + 1}/${total}] 🎮 Đang xử lý: ${mode.name}`);

        const details = await getModeDetails(mode.detail_url);
        if (details) {
            results.push({ ...mode, ...details });
        }

        if (i < total - 1) {
            const jitter = Math.floor(Math.random() * 800);
            console.log(`   ⏳ Chờ ${DELAY_BETWEEN_REQUESTS + jitter}ms...`);
            await delay(DELAY_BETWEEN_REQUESTS + jitter);
        }
    }

    return results;
}

function saveToJson(data, filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`\n💾 Đã lưu dữ liệu vào ${filePath}`);
}

async function main() {
    console.log('══════════════════════════════════════════');
    console.log('  🎮 BẮT ĐẦU CRAWL CHẾ ĐỘ CHƠI');
    console.log('══════════════════════════════════════════\n');

    const startTime = Date.now();
    const gamemodes = await crawlAllGameModes();

    if (!gamemodes || gamemodes.length === 0) {
        console.error('\n⚠️  Không thu thập được dữ liệu');
        process.exit(1);
    }

    saveToJson(gamemodes, OUTPUT_PATH);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n══════════════════════════════════════════');
    console.log(`  ✅ Hoàn thành! Đã crawl ${gamemodes.length} chế độ chơi`);
    console.log(`  ⏱️  Thời gian: ${elapsed}s`);
    console.log('══════════════════════════════════════════\n');
}

if (require.main === module) {
    main().catch(err => {
        console.error('💥 Lỗi:', err);
        process.exit(1);
    });
}

module.exports = { crawlAllGameModes };