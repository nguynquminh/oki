const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// ─── Cấu hình ────────────────────────────────────────────────
const BASE_URL = 'https://lienquan.garena.vn';
const EQUIPMENT_URL = `${BASE_URL}/hoc-vien/trang-bi/`;
const OUTPUT_PATH = path.resolve(__dirname, '../../data/equipments.json');
const REQUEST_TIMEOUT = 15000;

// ─── User-Agent xoay vòng ────────────────────────────────────
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
];

function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function createRequest() {
    return axios.create({
        timeout: REQUEST_TIMEOUT,
        headers: {
            'User-Agent': getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
        }
    });
}

function resolveUrl(relativeUrl) {
    if (!relativeUrl) return null;
    if (relativeUrl.startsWith('http')) return relativeUrl;
    return new URL(relativeUrl, BASE_URL).href;
}

/**
 * Crawl toàn bộ trang bị từ một trang duy nhất
 */
async function crawlEquipments() {
    try {
        console.log('🛠️  Đang thu thập dữ liệu trang bị...');

        const { data: html } = await createRequest().get(EQUIPMENT_URL);
        const $ = cheerio.load(html);

        const equipments = [];
        let itemCount = 0;

        // ── Parse từng item ──
        $('div.st-items__item').each((_index, element) => {
            const $item = $(element);

            // Lấy tên trang bị
            const name = $item.find('h2.st-items__item--name').text().trim();
            if (!name) return; // Skip nếu không có tên

            // Lấy hình ảnh
            const imgTag = $item.find('.st-items__item--img img');
            const image = imgTag.length
                ? resolveUrl(imgTag.attr('src'))
                : null;

            // ── Lấy giá vàng ──
            // Trong BeautifulSoup: p:has(img[src*="icon-gold.png"])
            // Trong Cheerio: duyệt qua các <p>, tìm cái có <img> chứa "icon-gold"
            let price = 'Không có giá';
            $item.find('p').each((_i, pElement) => {
                const $p = $(pElement);
                const goldImg = $p.find('img[src*="icon-gold"]');
                if (goldImg.length) {
                    price = $p.text().trim();
                    return false; // break
                }
            });

            // ── Lấy các chỉ số stats ──
            const stats = [];
            $item.find('article p').each((_i, pElement) => {
                const statText = $(pElement).text().trim();
                if (statText) {
                    stats.push(statText);
                }
            });

            equipments.push({
                id: equipments.length + 1,
                name,
                image,
                price,
                stats,
            });

            console.log(`✅ Đã xử lý: ${name}`);
            itemCount++;
        });

        if (itemCount === 0) {
            console.warn('⚠️  Không tìm thấy trang bị nào. Kiểm tra CSS selector.');
        }

        return equipments;
    } catch (err) {
        console.error(`❌ Lỗi khi crawl: ${err.message}`);
        return null;
    }
}

/**
 * Lưu dữ liệu ra file JSON
 */
function saveData(data, filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`\n💾 Đã lưu dữ liệu vào ${filePath}`);
}

// ══════════════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════════════

async function main() {
    console.log('═══════════════════════════════════════════');
    console.log('  🌟 BẮT ĐẦU CRAWL TRANG BỊ LIÊN QUÂN');
    console.log('═══════════════════════════════════════════\n');

    const startTime = Date.now();

    const equipments = await crawlEquipments();

    if (!equipments || equipments.length === 0) {
        console.error('\n⚠️  Không thu thập được dữ liệu');
        process.exit(1);
    }

    saveData(equipments, OUTPUT_PATH);

    // ── Thống kê ──
    const totalStats = equipments.reduce((sum, e) => sum + e.stats.length, 0);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n═══════════════════════════════════════════');
    console.log('  🎉 HOÀN THÀNH!');
    console.log('═══════════════════════════════════════════');
    console.log(`  Đã crawl được: ${equipments.length} trang bị`);
    console.log(`  Tổng chỉ số:   ${totalStats}`);
    console.log(`  Thời gian:     ${elapsed}s`);
    console.log('═══════════════════════════════════════════\n');
}

if (require.main === module) {
    main().catch(err => {
        console.error('💥 Lỗi không xử lý được:', err);
        process.exit(1);
    });
}

module.exports = { crawlEquipments };