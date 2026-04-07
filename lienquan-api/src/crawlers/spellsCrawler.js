const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://lienquan.garena.vn';
const SPELLS_URL = `${BASE_URL}/hoc-vien/phu-tro/`;
const OUTPUT_PATH = path.resolve(__dirname, '../../data/spells.json');
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

function resolveUrl(relativeUrl) {
    if (!relativeUrl) return null;
    if (relativeUrl.startsWith('http')) return relativeUrl;
    return new URL(relativeUrl, BASE_URL).href;
}

/**
 * Trích xuất cooldown từ mô tả
 */
function extractCooldown(description) {
    if (!description) return 'Không rõ';

    const match = description.match(/(\d+[\.,]\d+|\d+)\s*(?:giây|s)/i);
    return match ? match[0] : 'Không rõ';
}

/**
 * Crawl kỹ năng đặc biệt
 */
async function crawlSpells() {
    try {
        console.log('✨ Đang thu thập kỹ năng đặc biệt...');
        const { data: html } = await createRequest().get(SPELLS_URL);
        const $ = cheerio.load(html);

        const spells = [];

        $('div.st-extra-skills__item').each((_index, element) => {
            const $item = $(element);

            // Tên kỹ năng
            const name = $item.find('h3.st-extra-skills__item--name').text().trim();
            if (!name) return;

            // Hình ảnh
            const imgTag = $item.find('.st-extra-skills__item--img img');
            const imageUrl = imgTag.length ? resolveUrl(imgTag.attr('src')) : null;

            // Mô tả
            const contentP = $item.find('.st-extra-skills__item--content p');
            const description = contentP.length ? contentP.text().trim() : '';

            // Cooldown (trích xuất từ description)
            const cooldown = extractCooldown(description);

            spells.push({
                id: spells.length + 1,
                name,
                image_url: imageUrl,
                cooldown,
                description
            });

            console.log(`✅ Đã xử lý: ${name}`);
        });

        return spells;
    } catch (err) {
        console.error(`❌ Lỗi khi crawl kỹ năng: ${err.message}`);
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
    console.log('  ✨ BẮT ĐẦU CRAWL KỸ NĂNG ĐẶC BIỆT');
    console.log('══════════════════════════════════════════\n');

    const startTime = Date.now();
    const spells = await crawlSpells();

    if (!spells || spells.length === 0) {
        console.error('\n⚠️  Không thu thập được dữ liệu');
        process.exit(1);
    }

    saveData(spells, OUTPUT_PATH);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n══════════════════════════════════════════');
    console.log(`  ✅ Hoàn thành! Đã crawl ${spells.length} kỹ năng`);
    console.log(`  ⏱️  Thời gian: ${elapsed}s`);
    console.log('══════════════════════════════════════════\n');
}

if (require.main === module) {
    main().catch(err => {
        console.error('💥 Lỗi:', err);
        process.exit(1);
    });
}

module.exports = { crawlSpells };