const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://lienquan.garena.vn';
const BADGES_URL = `${BASE_URL}/hoc-vien/phu-hieu/`;
const OUTPUT_PATH = path.resolve(__dirname, '../../data/badges.json');
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
 * Crawl phù hiệu
 */
async function crawlBadges() {
    try {
        console.log('🛡️  Đang thu thập dữ liệu phù hiệu...');
        const { data: html } = await createRequest().get(BADGES_URL);
        const $ = cheerio.load(html);

        const badges = [];

        $('div.st-badges__item').each((_badgeIdx, badgeElement) => {
            const $item = $(badgeElement);

            // Tên phù hiệu
            const name = $item.find('h2.st-badges__item--name').text().trim();
            if (!name) return;

            // Mô tả
            const description = $item.find('.st-badges__item--content')
                .text()
                .trim()
                .split('\n')
                .filter(s => s.trim());

            // Thu thập các nhóm kỹ năng
            const groups = [];
            let groupIdx = 0;

            $item.find('ul.st-badges__item--skills > li').each((_i, groupElement) => {
                groupIdx++;
                const skills = [];

                $(groupElement).find('a[data-badge-id]').each((_j, skillLink) => {
                    const $link = $(skillLink);
                    const skillId = $link.attr('href').replace('#', '');
                    const skillName = $link.find('p').text().trim();
                    const skillImg = $link.find('img').attr('src');

                    // Tìm chi tiết kỹ năng
                    const skillDetail = $item.find(`div#${skillId}`);
                    if (skillDetail.length) {
                        const skillType = skillDetail.find('.st-badges__skill--head h3').text().trim();
                        const skillDesc = skillDetail.find('.st-badges__skill--content')
                            .text()
                            .trim()
                            .split('\n')
                            .filter(s => s.trim());

                        skills.push({
                            name: skillName,
                            type: skillType,
                            image: resolveUrl(skillImg),
                            description: skillDesc
                        });
                    }
                });

                if (skills.length > 0) {
                    groups.push({
                        group_id: `group${groupIdx}`,
                        skills
                    });
                }
            });

            badges.push({
                id: badges.length + 1,
                name,
                description,
                groups
            });

            console.log(`✅ Đã xử lý: ${name}`);
        });

        return badges;
    } catch (err) {
        console.error(`❌ Lỗi khi crawl phù hiệu: ${err.message}`);
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
    console.log('  🛡️  BẮT ĐẦU CRAWL PHÙ HIỆU');
    console.log('══════════════════════════════════════════\n');

    const startTime = Date.now();
    const badges = await crawlBadges();

    if (!badges || badges.length === 0) {
        console.error('\n⚠️  Không thu thập được dữ liệu');
        process.exit(1);
    }

    saveData(badges, OUTPUT_PATH);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n══════════════════════════════════════════');
    console.log(`  ✅ Hoàn thành! Đã crawl ${badges.length} phù hiệu`);
    console.log(`  ⏱️  Thời gian: ${elapsed}s`);
    console.log('══════════════════════════════════════════\n');
}

if (require.main === module) {
    main().catch(err => {
        console.error('💥 Lỗi:', err);
        process.exit(1);
    });
}

module.exports = { crawlBadges };