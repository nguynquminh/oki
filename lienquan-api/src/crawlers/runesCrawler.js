const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://lienquan.garena.vn';
const RUNES_URL = `${BASE_URL}/hoc-vien/bang-ngoc/`;
const OUTPUT_PATH = path.resolve(__dirname, '../../data/runes.json');
const REQUEST_TIMEOUT = 15000;

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
];

function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function createRequest() {
    return axios.create({
        timeout: REQUEST_TIMEOUT,
        headers: { 'User-Agent': getRandomUserAgent() }
    });
}

/**
 * Crawl ngọc
 */
async function crawlRunes() {
    try {
        console.log('🔮 Đang thu thập dữ liệu ngọc...');
        const { data: html } = await createRequest().get(RUNES_URL);
        const $ = cheerio.load(html);

        const runes = [];

        $('div.st-runes__item').each((_index, element) => {
            const $item = $(element);

            // Tên ngọc
            const name = $item.find('h2.st-runes__item--name').text().trim();
            if (!name) return;

            // Chỉ số stats
            const stats = [];
            const article = $item.find('article');

            if (article.length) {
                article.find('p').each((_i, pEl) => {
                    const text = $(pEl).text().trim();
                    if (text) stats.push(text);
                });
            }

            runes.push({
                id: runes.length + 1,
                name,
                stats
            });

            console.log(`✅ Đã xử lý: ${name}`);
        });

        return runes;
    } catch (err) {
        console.error(`❌ Lỗi khi crawl ngọc: ${err.message}`);
        return null;
    }
}

function saveData(data, filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`\n💾 Đã lưu dữ liệu vào ${filePath}`);
}

async function main() {
    console.log('══════════════════════════════════════════');
    console.log('  🔮 BẮT ĐẦU CRAWL NGỌC');
    console.log('══════════════════════════════════════════\n');

    const startTime = Date.now();
    const runes = await crawlRunes();

    if (!runes || runes.length === 0) {
        console.error('\n⚠️  Không thu thập được dữ liệu');
        process.exit(1);
    }

    saveData(runes, OUTPUT_PATH);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n══════════════════════════════════════════');
    console.log(`  ✅ Hoàn thành! Đã crawl ${runes.length} ngọc`);
    console.log(`  ⏱️  Thời gian: ${elapsed}s`);
    console.log('══════════════════════════════════════════\n');
}

if (require.main === module) {
    main().catch(err => {
        console.error('💥 Lỗi:', err);
        process.exit(1);
    });
}

module.exports = { crawlRunes };