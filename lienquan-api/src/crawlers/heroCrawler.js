const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// ─── Cấu hình ────────────────────────────────────────────────
const BASE_URL = 'https://lienquan.garena.vn';
const LIST_URL = 'https://lienquan.garena.vn/hoc-vien/tuong-skin/';
const OUTPUT_PATH = path.resolve(__dirname, '../../data/heroes.json');
const REQUEST_TIMEOUT = 15000;
const DELAY_BETWEEN_REQUESTS = 3000; // ms

// ─── Danh sách User-Agent xoay vòng ──────────────────────────
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
];

function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Tạo axios instance với header giả lập trình duyệt
 */
function createRequest() {
    return axios.create({
        timeout: REQUEST_TIMEOUT,
        headers: {
            'User-Agent': getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
        }
    });
}

/**
 * Ghép URL tương đối thành URL tuyệt đối
 */
function resolveUrl(relativeUrl) {
    if (!relativeUrl) return null;
    if (relativeUrl.startsWith('http')) return relativeUrl;
    return new URL(relativeUrl, BASE_URL).href;
}

// ══════════════════════════════════════════════════════════════
//  BƯỚC 1: Lấy danh sách tất cả tướng từ trang chính
// ══════════════════════════════════════════════════════════════

async function getAllHeroes() {
    try {
        console.log('📋 Đang lấy danh sách tướng từ trang chính...');
        const { data: html } = await createRequest().get(LIST_URL);
        const $ = cheerio.load(html);

        const heroes = [];

        $('a.st-heroes__item').each((_index, element) => {
            const $item = $(element);
            const name = $item.find('h2.st-heroes__item--name').text().trim();
            const relativeUrl = $item.attr('href');
            const fullUrl = resolveUrl(relativeUrl);

            if (name && fullUrl) {
                heroes.push({ name, url: fullUrl });
            }
        });

        console.log(`✅ Đã tìm thấy ${heroes.length} tướng`);
        return heroes;
    } catch (err) {
        console.error(`❌ Lỗi khi lấy danh sách tướng: ${err.message}`);
        return [];
    }
}

// ══════════════════════════════════════════════════════════════
//  BƯỚC 2: Lấy chi tiết skill + skin của từng tướng
// ══════════════════════════════════════════════════════════════

async function getHeroDetails(heroUrl) {
    try {
        const { data: html } = await createRequest().get(heroUrl);
        const $ = cheerio.load(html);

        // ── Thu thập hình ảnh skill từ danh sách tab ──
        const skillImageMap = {};

        $('ul.hero__skills--list li a').each((_i, el) => {
            const href = $(el).attr('href');           // vd: #heroSkill-1
            const imgTag = $(el).find('img');
            if (href && imgTag.length) {
                skillImageMap[href] = resolveUrl(imgTag.attr('src'));
            }
        });

        // ── Lấy nội dung từng skill ──
        const skills = [];
        const skillContents = $('div[id^="heroSkill-"]');

        skillContents.each((index, el) => {
            const $content = $(el);

            // Skill đầu tiên (index 0) là Nội tại, còn lại đánh số từ 1
            const skillName = index === 0
                ? 'Nội tại'
                : `Skill ${index}`;

            const article = $content.find('article');
            const description = article.length
                ? article.text().trim()
                : 'Không có mô tả';

            // Map hình ảnh từ danh sách tab đã thu thập
            const skillId = `#heroSkill-${index + 1}`;
            const skillImage = skillImageMap[skillId] || null;

            skills.push({
                skill_name: skillName,
                description,
                skill_image: skillImage,
            });
        });

        // ── Lấy thông tin skin ──
        const skinsSection = $('section.hero__skins');
        let defaultImage = null;
        const skins = [];

        if (skinsSection.length) {
            skinsSection.find('div.hero__skins--detail').each((i, el) => {
                const $detail = $(el);
                const skinName = $detail.find('h3').text().trim() || 'Không có tên';

                const picture = $detail.find('picture img');
                const imgUrl = picture.length
                    ? resolveUrl(picture.attr('src'))
                    : null;

                if (i === 0) {
                    // Skin đầu tiên = skin mặc định → dùng làm ảnh đại diện
                    defaultImage = imgUrl;
                } else {
                    skins.push({
                        skin_name: skinName,
                        skin_image: imgUrl,
                    });
                }
            });
        }

        return { skills, image: defaultImage, skins };
    } catch (err) {
        console.error(`  ❌ Lỗi khi lấy chi tiết từ ${heroUrl}: ${err.message}`);
        return { skills: [], image: null, skins: [] };
    }
}

// ══════════════════════════════════════════════════════════════
//  BƯỚC 3: Crawl toàn bộ và lưu JSON
// ══════════════════════════════════════════════════════════════

async function crawlAllHeroes() {
    const heroList = await getAllHeroes();
    if (heroList.length === 0) {
        console.error('⚠️  Không tìm thấy tướng nào. Dừng crawl.');
        return null;
    }

    const results = [];
    const total = heroList.length;

    for (let i = 0; i < total; i++) {
        const hero = heroList[i];
        console.log(`\n[${i + 1}/${total}] 🦸 Đang xử lý: ${hero.name}`);
        console.log(`   URL: ${hero.url}`);

        const details = await getHeroDetails(hero.url);

        results.push({
            id: i + 1,
            ...hero,
            ...details,
        });

        // Log tiến trình
        console.log(`   📖 ${details.skills.length} kỹ năng`);
        details.skills.forEach(s => console.log(`      - ${s.skill_name}`));
        console.log(`   🎨 Skin mặc định: ${details.image ? '✓' : '✗'}`);
        console.log(`   👗 ${details.skins.length} skin khác`);

        // Delay giữa các request (trừ request cuối)
        if (i < total - 1) {
            const jitter = Math.floor(Math.random() * 1000); // 0–1s ngẫu nhiên thêm
            const waitTime = DELAY_BETWEEN_REQUESTS + jitter;
            console.log(`   ⏳ Chờ ${waitTime}ms...`);
            await delay(waitTime);
        }
    }

    return results;
}

/**
 * Lưu dữ liệu ra file JSON
 */
function saveToJson(data, filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`\n💾 Đã lưu dữ liệu vào ${filePath}`);
}

// ══════════════════════════════════════════════════════════════
//  MAIN — Chạy khi gọi: node src/crawlers/heroCrawler.js
// ══════════════════════════════════════════════════════════════

async function main() {
    console.log('══════════════════════════════════════════');
    console.log('  🏰 BẮT ĐẦU CRAWL DỮ LIỆU TƯỚNG LIÊN QUÂN');
    console.log('══════════════════════════════════════════\n');

    const startTime = Date.now();

    const heroesData = await crawlAllHeroes();

    if (!heroesData || heroesData.length === 0) {
        console.error('\n⚠️  Không có dữ liệu để lưu.');
        process.exit(1);
    }

    saveToJson(heroesData, OUTPUT_PATH);

    // ── Thống kê ──
    const totalSkills = heroesData.reduce((sum, h) => sum + h.skills.length, 0);
    const totalSkins = heroesData.reduce((sum, h) => sum + h.skins.length, 0);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n══════════════════════════════════════════');
    console.log('  📊 TỔNG KẾT');
    console.log('══════════════════════════════════════════');
    console.log(`  Số tướng:       ${heroesData.length}`);
    console.log(`  Tổng kỹ năng:   ${totalSkills}`);
    console.log(`  Tổng skin:      ${totalSkins}`);
    console.log(`  Thời gian:      ${elapsed}s`);
    console.log('══════════════════════════════════════════\n');
}

// Chạy trực tiếp hoặc export để dùng programmatically
if (require.main === module) {
    main().catch(err => {
        console.error('💥 Lỗi không xử lý được:', err);
        process.exit(1);
    });
}

module.exports = { crawlAllHeroes, getAllHeroes, getHeroDetails };