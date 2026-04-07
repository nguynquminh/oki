const path = require('path');
const fs = require('fs');
const { crawlAllHeroes } = require('./heroCrawler');
const { crawlEquipments } = require('./equipmentCrawler');
const { crawlAllGameModes } = require('./gamemodeCrawler');
const { crawlBadges } = require('./badgesCrawler');
const { crawlRunes } = require('./runesCrawler');
const { crawlSpells } = require('./spellsCrawler');

const DATA_DIR = path.resolve(__dirname, '../../data');

function save(data, filename) {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`💾 Đã lưu ${filePath}`);
}

async function crawlWithLabel(label, crawlFunc, filename) {
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`${label}`);
    console.log('═'.repeat(50) + '\n');

    const startTime = Date.now();
    const result = await crawlFunc();

    if (result && result.length > 0) {
        save(result, filename);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ ${label} - Hoàn thành trong ${elapsed}s\n`);
        return result.length;
    } else {
        console.warn(`⚠️  ${label} - Không có dữ liệu\n`);
        return 0;
    }
}

async function main() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║  🚀 CRAWL TOÀN BỘ DỮ LIỆU LIÊN QUÂN MOBILE        ║');
    console.log('╚════════════════════════════════════════════════════╝');

    const overallStart = Date.now();
    const results = {};

    try {
        results.heroes = await crawlWithLabel(
            '🦸 CRAWL TƯỚNG',
            crawlAllHeroes,
            'heroes.json'
        );

        results.equipments = await crawlWithLabel(
            '⚔️  CRAWL TRANG BỊ',
            crawlEquipments,
            'equipments.json'
        );

        results.gamemodes = await crawlWithLabel(
            '🎮 CRAWL CHẾ ĐỘ CHƠI',
            crawlAllGameModes,
            'gamemodes.json'
        );

        results.badges = await crawlWithLabel(
            '🛡️  CRAWL PHÙ HIỆU',
            crawlBadges,
            'badges.json'
        );

        results.runes = await crawlWithLabel(
            '🔮 CRAWL NGỌC',
            crawlRunes,
            'runes.json'
        );

        results.spells = await crawlWithLabel(
            '✨ CRAWL KỸ NĂNG ĐẶC BIỆT',
            crawlSpells,
            'spells.json'
        );

        // ── Tổng kết ──
        const totalElapsed = ((Date.now() - overallStart) / 1000).toFixed(2);
        const totalItems = Object.values(results).reduce((sum, count) => sum + count, 0);

        console.log('\n╔════════════════════════════════════════════════════╗');
        console.log('║  📊 TỔNG KẾT HOÀN THÀNH                           ║');
        console.log('╚════════════════════════════════════════════════════╝\n');
        console.log(`  🦸 Tướng:            ${results.heroes} item`);
        console.log(`  ⚔️  Trang bị:        ${results.equipments} item`);
        console.log(`  🎮 Chế độ chơi:      ${results.gamemodes} item`);
        console.log(`  🛡️  Phù hiệu:        ${results.badges} item`);
        console.log(`  🔮 Ngọc:            ${results.runes} item`);
        console.log(`  ✨ Kỹ năng đặc biệt: ${results.spells} item`);
        console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`  📈 Tổng cộng:       ${totalItems} items`);
        console.log(`  ⏱️  Thời gian:       ${totalElapsed}s`);
        console.log('\n✅ Crawl thành công! Dữ liệu đã lưu vào thư mục data/\n');

    } catch (err) {
        console.error('💥 Lỗi:', err.message);
        process.exit(1);
    }
}

main();