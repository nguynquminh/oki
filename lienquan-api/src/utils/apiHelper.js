const { loadJSON, getFileInfo } = require('./dataLoader');

function loadData(filename) {
    const result = loadJSON(filename);
    const meta = getFileInfo(filename);

    return {
        success: result.success,
        data: result.data || [],
        meta,
        error: result.error
    };
}

/**
 * Lấy item theo ID
 */
function getItemById(items, id) {
    return items.find(item => String(item.id) === String(id)) || null;
}

/**
 * Tìm kiếm items theo tên (case-insensitive)
 */
function searchByName(items, searchTerm, nameField = 'name') {
    if (!searchTerm) return items;
    return items.filter(item =>
        item[nameField]?.toLowerCase().includes(searchTerm.toLowerCase())
    );
}

/**
 * Xử lý query params - hỗ trợ tìm kiếm theo id hoặc name
 * Ưu tiên: id > name
 */
function handleSearchQuery(items, query) {
    const { id, name, limit = 50, offset = 0 } = query;

    let filtered = items;

    // Nếu có id, tìm item cụ thể theo id
    if (id) {
        const item = getItemById(items, id);
        filtered = item ? [item] : [];
    }
    // Nếu có name, lọc theo name
    else if (name) {
        filtered = searchByName(items, name, 'name');
    }

    // Phân trang
    const total = filtered.length;
    const paginated = filtered.slice(
        parseInt(offset) || 0,
        (parseInt(offset) || 0) + (parseInt(limit) || 50)
    );

    return {
        filtered,
        paginated,
        total,
        count: paginated.length,
        offset: parseInt(offset) || 0,
        limit: parseInt(limit) || 50
    };
}

/**
 * Tìm kiếm skill trong badges
 * Tìm kiếm theo groups[].skills[].name
 */
function searchSkillInBadges(badges, skillName) {
    if (!skillName) return null;

    const results = [];

    badges.forEach(badge => {
        const matchingGroups = [];

        badge.groups.forEach(group => {
            const matchingSkills = group.skills.filter(skill =>
                skill.name?.toLowerCase().includes(skillName.toLowerCase())
            );

            if (matchingSkills.length > 0) {
                matchingGroups.push({
                    group_id: group.group_id,
                    skills: matchingSkills
                });
            }
        });

        if (matchingGroups.length > 0) {
            results.push({
                id: badge.id,
                name: badge.name,
                description: badge.description,
                groups: matchingGroups
            });
        }
    });

    return results.length > 0 ? results : null;
}

module.exports = {
    loadData,
    getItemById,
    searchByName,
    handleSearchQuery,
    searchSkillInBadges
};