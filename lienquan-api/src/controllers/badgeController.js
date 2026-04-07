const { loadData, handleSearchQuery, searchSkillInBadges } = require('../utils/apiHelper');

const DATA_FILE = 'badges.json';

/**
 * GET /api/v1/badges
 * Query params:
 *   - id: Lấy phù hiệu theo ID (trả về toàn bộ document)
 *   - name: Tìm kiếm phù hiệu theo tên (trả về toàn bộ document)
 *   - skillName: Tìm kiếm skill trong groups (trả về skill cụ thể)
 *   - limit: Số item mỗi trang (mặc định 50)
 *   - offset: Vị trí bắt đầu (mặc định 0)
 *
 * Ví dụ:
 *   GET /api/v1/badges?id=1                    → Toàn bộ phù hiệu #1
 *   GET /api/v1/badges?name=Chiến Binh         → Tất cả phù hiệu chứa "Chiến Binh"
 *   GET /api/v1/badges?skillName=Kỹ Năng 1     → Chỉ skill có tên "Kỹ Năng 1"
 */
async function getAllBadges(req, res, next) {
    try {
        const { skillName } = req.query;
        const { data, meta, success, error } = loadData(DATA_FILE);

        if (!success) {
            return res.status(503).json({ success: false, message: error });
        }

        // Nếu tìm kiếm theo skill name
        if (skillName) {
            const skillResults = searchSkillInBadges(data, skillName);

            if (!skillResults) {
                return res.status(404).json({
                    success: false,
                    message: `Không tìm thấy skill với tên: "${skillName}"`
                });
            }

            return res.json({
                success: true,
                searchType: 'skill',
                skillName,
                count: skillResults.length,
                meta,
                data: skillResults
            });
        }

        // Nếu tìm kiếm theo id/name của phù hiệu
        const searchResult = require('../utils/apiHelper').handleSearchQuery(data, req.query);

        res.json({
            success: true,
            searchType: 'badge',
            count: searchResult.count,
            total: searchResult.total,
            offset: searchResult.offset,
            limit: searchResult.limit,
            meta,
            data: searchResult.paginated
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAllBadges
};