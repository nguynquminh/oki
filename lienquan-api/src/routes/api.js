const { Router } = require('express');

// Controllers
const { getAllHeroes } = require('../controllers/heroController');
const { getAllEquipments } = require('../controllers/equipmentController');
const { getAllBadges } = require('../controllers/badgeController');
const { getAllRunes } = require('../controllers/runeController');
const { getAllGameModes } = require('../controllers/gamemodeController');
const { getAllSpells } = require('../controllers/spellController');

const router = Router();

/**
 * ═══════════════════════════════════════════════════════════════
 *  🦸 HEROES ROUTES
 * ═══════════════════════════════════════════════════════════════
 * 
 * GET /api/v1/heroes
 * 
 * Query Parameters:
 *   - id (number):    Lấy tướng theo ID (ưu tiên cao nhất)
 *   - name (string):  Tìm kiếm tướng theo tên (case-insensitive)
 *   - role (string):  Lọc theo role (Xạ Thủ, Pháp Sư, etc)
 *   - limit (number): Số item mỗi trang (mặc định 50)
 *   - offset (number):Vị trí bắt đầu (mặc định 0)
 * 
 * Examples:
 *   GET /api/v1/heroes?id=1
 *   GET /api/v1/heroes?name=Yorn
 *   GET /api/v1/heroes?role=Xạ%20Thủ
 *   GET /api/v1/heroes?name=Y&limit=10&offset=0
 */
router.get('/heroes', getAllHeroes);

/**
 * ═══════════════════════════════════════════════════════════════
 *  ⚔️  EQUIPMENTS ROUTES
 * ═══════════════════════════════════════════════════════════════
 * 
 * GET /api/v1/equipments
 * 
 * Query Parameters:
 *   - id (number):    Lấy trang bị theo ID
 *   - name (string):  Tìm kiếm trang bị theo tên
 *   - limit (number): Số item mỗi trang (mặc định 50)
 *   - offset (number):Vị trí bắt đầu (mặc định 0)
 * 
 * Examples:
 *   GET /api/v1/equipments?id=1
 *   GET /api/v1/equipments?name=Kiếm
 */
router.get('/equipments', getAllEquipments);

/**
 * ═══════════════════════════════════════════════════════════════
 *  🛡️  BADGES ROUTES
 * ═══════════════════════════════════════════════════════════════
 * 
 * GET /api/v1/badges
 * 
 * Query Parameters:
 *   - id (number):      Lấy phù hiệu theo ID (trả về toàn bộ document)
 *   - name (string):    Tìm kiếm phù hiệu theo tên (trả về toàn bộ document)
 *   - skillName (string): Tìm kiếm skill trong groups (chỉ trả về skill cụ thể)
 *   - limit (number):   Số item mỗi trang (mặc định 50)
 *   - offset (number):  Vị trí bắt đầu (mặc định 0)
 * 
 * Examples:
 *   GET /api/v1/badges?id=1
 *   GET /api/v1/badges?name=Chiến%20Binh
 *   GET /api/v1/badges?skillName=Kỹ%20Năng%201
 * 
 * Notes:
 *   - Khi dùng ?name hoặc ?id: trả về toàn bộ phù hiệu + tất cả skills
 *   - Khi dùng ?skillName: chỉ trả về skill khớp + phù hiệu chứa skill đó
 */
router.get('/badges', getAllBadges);

/**
 * ═══════════════════════════════════════════════════════════════
 *  🔮 RUNES ROUTES
 * ═══════════════════════════════════════════════════════════════
 * 
 * GET /api/v1/runes
 * 
 * Query Parameters:
 *   - id (number):    Lấy ngọc theo ID
 *   - name (string):  Tìm kiếm ngọc theo tên
 *   - limit (number): Số item mỗi trang (mặc định 50)
 *   - offset (number):Vị trí bắt đầu (mặc định 0)
 * 
 * Examples:
 *   GET /api/v1/runes?id=1
 *   GET /api/v1/runes?name=Công
 */
router.get('/runes', getAllRunes);

/**
 * ═══════════════════════════════════════════════════════════════
 *  🎮 GAMEMODES ROUTES
 * ═══════════════════════════════════════════════════════════════
 * 
 * GET /api/v1/gamemodes
 * 
 * Query Parameters:
 *   - id (number):      Lấy chế độ chơi theo ID
 *   - name (string):    Tìm kiếm chế độ chơi theo tên
 *   - keyword (string): Lọc theo keyword (normal, ranked, etc)
 *   - limit (number):   Số item mỗi trang (mặc định 50)
 *   - offset (number):  Vị trí bắt đầu (mặc định 0)
 * 
 * Examples:
 *   GET /api/v1/gamemodes?id=1
 *   GET /api/v1/gamemodes?name=5v5
 *   GET /api/v1/gamemodes?keyword=normal
 */
router.get('/gamemodes', getAllGameModes);

/**
 * ═══════════════════════════════════════════════════════════════
 *  ✨ SPELLS ROUTES
 * ═══════════════════════════════════════════════════════════════
 * 
 * GET /api/v1/spells
 * 
 * Query Parameters:
 *   - id (number):    Lấy kỹ năng theo ID
 *   - name (string):  Tìm kiếm kỹ năng theo tên
 *   - limit (number): Số item mỗi trang (mặc định 50)
 *   - offset (number):Vị trí bắt đầu (mặc định 0)
 * 
 * Examples:
 *   GET /api/v1/spells?id=1
 *   GET /api/v1/spells?name=Tele
 */
router.get('/spells', getAllSpells);

module.exports = router;