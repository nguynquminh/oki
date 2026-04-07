const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(process.env.DATA_DIR || './data');

/**
 * Đọc và parse file JSON từ thư mục data/
 * @param {string} filename - Tên file (vd: 'heroes.json')
 * @returns {{ success: boolean, data: any, error?: string }}
 */
function loadJSON(filename) {
    const filePath = path.join(DATA_DIR, filename);

    try {
        if (!fs.existsSync(filePath)) {
            return {
                success: false,
                data: null,
                error: `File "${filename}" không tồn tại. Hãy chạy crawler trước: npm run crawl`
            };
        }

        const raw = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(raw);

        return { success: true, data };
    } catch (err) {
        return {
            success: false,
            data: null,
            error: `Lỗi đọc file "${filename}": ${err.message}`
        };
    }
}

/**
 * Lấy metadata (thời gian cập nhật, số lượng bản ghi) của file JSON
 * @param {string} filename
 * @returns {object}
 */
function getFileInfo(filename) {
    const filePath = path.join(DATA_DIR, filename);

    try {
        if (!fs.existsSync(filePath)) return null;

        const stats = fs.statSync(filePath);
        const result = loadJSON(filename);

        return {
            file: filename,
            lastModified: stats.mtime.toISOString(),
            sizeKB: (stats.size / 1024).toFixed(2),
            recordCount: result.success && Array.isArray(result.data) ? result.data.length : null
        };
    } catch {
        return null;
    }
}

module.exports = { loadJSON, getFileInfo };