const { loadData, handleSearchQuery } = require('../utils/apiHelper');

const DATA_FILE = 'gamemodes.json';

/**
 * GET /api/v1/gamemodes
 * Query params:
 *   - id: Lấy chế độ chơi theo ID
 *   - name: Tìm kiếm chế độ chơi theo tên
 *   - keyword: Lọc theo keyword
 *   - limit: Số item mỗi trang (mặc định 50)
 *   - offset: Vị trí bắt đầu (mặc định 0)
 *
 * Ví dụ:
 *   GET /api/v1/gamemodes?id=1
 *   GET /api/v1/gamemodes?name=5v5
 *   GET /api/v1/gamemodes?keyword=normal
 */
async function getAllGameModes(req, res, next) {
    try {
        const { keyword } = req.query;
        const { data, meta, success, error } = loadData(DATA_FILE);

        if (!success) {
            return res.status(503).json({ success: false, message: error });
        }

        let searchResult = require('../utils/apiHelper').handleSearchQuery(data, req.query);
        let filtered = searchResult.filtered;

        // Thêm lọc keyword nếu có
        if (keyword) {
            filtered = filtered.filter(m =>
                m.keyword?.toLowerCase().includes(keyword.toLowerCase())
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
    getAllGameModes
};