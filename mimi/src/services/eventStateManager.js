// src/services/eventStateManager.js
const { Collection } = require('discord.js');

/**
 * Collection (kế thừa Map) lưu toàn bộ state sự kiện trong RAM.
 * Key: eventId (nanoid 12 chars) — unique, tránh xung đột multi-user.
 * 
 * Tại sao không dùng plain object?
 * - Collection có .sweep() để TTL cleanup
 * - Collection có .find(), .filter() tiện cho lookup
 * - Mỗi event có key riêng → nhiều Host tạo song song không đụng nhau
 */
const eventStore = new Collection();

/**
 * Cấu trúc đầy đủ 1 event state — đây là "single source of truth"
 * cho toàn bộ lifecycle của sự kiện.
 */
function createInitialState(eventId, hostId, guildId) {
    return {
        // Identity
        eventId,
        hostId,
        guildId,

        // Bước 2: Dữ liệu từ Modal
        name: null,
        description: null,

        // Bước 3: Cấu hình
        teamCount: null,          // 2 | 3 | 4 | 5
        mode: null,               // 'random' | 'react'
        configured: false,

        // Bước 4: Người tham gia
        participants: [],         // Mode random: danh sách userId chung
        teams: {},                // Mode react: { "1": [userId], "2": [userId], ... }

        // Bước 5: Discord resources đã tạo (cần cho cleanup)
        publicMessageId: null,
        publicChannelId: null,
        categoryId: null,
        createdChannels: [],      // [{ id, type: 'text'|'voice', teamIndex }]

        // Timestamps
        createdAt: Date.now(),
        startedAt: null,
        endedAt: null,

        // Lifecycle state machine: init → configuring → live → started → ended
        phase: 'init',
    };
}

module.exports = {
    eventStore,

    create(eventId, hostId, guildId) {
        const state = createInitialState(eventId, hostId, guildId);
        eventStore.set(eventId, state);
        return state;
    },

    get(eventId) {
        return eventStore.get(eventId) ?? null;
    },

    /**
     * Partial update — merge patch vào state hiện tại.
     * Trả về state đã update hoặc null nếu không tìm thấy.
     */
    update(eventId, patch) {
        const state = eventStore.get(eventId);
        if (!state) return null;
        Object.assign(state, patch);
        return state;
    },

    delete(eventId) {
        return eventStore.delete(eventId);
    },

    /**
     * Tìm event đang active của 1 Host trong 1 guild.
     * Dùng để chặn tạo trùng.
     */
    findActiveByHost(hostId, guildId) {
        return eventStore.find(
            (e) =>
                e.hostId === hostId &&
                e.guildId === guildId &&
                !['ended'].includes(e.phase)
        ) ?? null;
    },
};