const { loadData, handleSearchQuery } = require('../utils/apiHelper');

const DATA_FILE = 'equipments.json';

/**
 * GET /api/v1/equipments
 * Query params:
 *   - id: Lấy trang bị theo ID
 *   - name: Tìm kiếm trang bị theo tên
 *   - limit: Số item mỗi trang (mặc định 50)
 *   - offset: Vị trí bắt đầu (mặc định 0)
 *
 * Ví dụ:
 *   GET /api/v1/equipments?id=1
 *   GET /api/v1/equipments?name=Kiếm
 */
async function getAllEquipments(req, res, next) {
    try {
        const { data, meta, success, error } = loadData(DATA_FILE);

        if (!success) {
            return res.status(503).json({ success: false, message: error });
        }

        const searchResult = require('../utils/apiHelper').handleSearchQuery(data, req.query);

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
    getAllEquipments
};