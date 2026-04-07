const { loadData, handleSearchQuery } = require('../utils/apiHelper');

const DATA_FILE = 'heroes.json';

/**
 * GET /api/v1/heroes
 * Query params:
 *   - id: Lấy tướng theo ID (ưu tiên cao nhất)
 *   - name: Tìm kiếm tướng theo tên
 *   - role: Lọc theo role (Xạ Thủ, Pháp Sư, etc)
 *   - limit: Số item mỗi trang (mặc định 50)
 *   - offset: Vị trí bắt đầu (mặc định 0)
 *
 * Ví dụ:
 *   GET /api/v1/heroes?id=1
 *   GET /api/v1/heroes?name=Yorn
 *   GET /api/v1/heroes?role=Xạ Thủ&limit=10
 */
async function getAllHeroes(req, res, next) {
    try {
        const { role } = req.query;
        const { data, meta, success, error } = loadData(DATA_FILE);

        if (!success) {
            return res.status(503).json({ success: false, message: error });
        }

        // Xử lý search query (id/name)
        let searchResult = require('../utils/apiHelper').handleSearchQuery(data, req.query);
        let filtered = searchResult.filtered;

        // Thêm lọc role nếu có
        if (role) {
            filtered = filtered.filter(h =>
                h.role?.toLowerCase().includes(role.toLowerCase())
            );
            searchResult = {
                ...searchResult,
                filtered,
                paginated: filtered.slice(
                    searchResult.offset,
                    searchResult.offset + searchResult.limit
                ),
                total: filtered.length,
                count: Math.min(
                    filtered.length - searchResult.offset,
                    searchResult.limit
                )
            };
        }

        res.json({
            success: true,
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
    getAllHeroes
};