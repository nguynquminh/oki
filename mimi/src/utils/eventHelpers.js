// src/utils/eventHelpers.js
const { nanoid } = require('nanoid');

/**
 * Fisher-Yates shuffle — O(n), không thiên lệch.
 * Trả về mảng mới, KHÔNG mutate input.
 */
function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Round-robin chia mảng thành n nhóm gần đều.
 * distributeIntoTeams(['a','b','c','d','e'], 3) → [['a','d'],['b','e'],['c']]
 */
function distributeIntoTeams(members, teamCount) {
    const teams = Array.from({ length: teamCount }, () => []);
    members.forEach((member, i) => {
        teams[i % teamCount].push(member);
    });
    return teams;
}

function generateEventId() {
    return nanoid(12);
}

/**
 * Format danh sách nhóm thành Embed fields.
 */
function formatTeamFields(teamsObj) {
    return Object.entries(teamsObj).map(([idx, memberIds]) => {
        const list = memberIds.length > 0
            ? memberIds.map((id) => `<@${id}>`).join('\n')
            : '_Chưa có thành viên_';
        return {
            name: `🏷️ Nhóm ${idx} (${memberIds.length} người)`,
            value: list,
            inline: true,
        };
    });
}

/**
 * Parse customId có format: prefix_eventId hoặc prefix_eventId_extra
 * Ví dụ: "evt_team_V1StGXR8Z5jk_3" → { eventId: "V1StGXR8Z5jk", extra: "3" }
 * 
 * Quy ước: eventId luôn 12 ký tự (nanoid), nằm ngay trước phần extra (nếu có).
 */
function parseCustomId(customId, prefix) {
    const withoutPrefix = customId.slice(prefix.length);
    // eventId = 12 chars, phần sau (nếu có) bắt đầu bằng '_'
    const eventId = withoutPrefix.slice(0, 12);
    const extra = withoutPrefix.length > 12 ? withoutPrefix.slice(13) : null; // skip '_'
    return { eventId, extra };
}

module.exports = {
    shuffle,
    distributeIntoTeams,
    generateEventId,
    formatTeamFields,
    parseCustomId,
};