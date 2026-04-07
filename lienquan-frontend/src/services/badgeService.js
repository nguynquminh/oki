import api from './api';

export const badgeService = {
    getAll: (params = {}) => {
        return api.get('/badges', { params });
    },

    getById: (id) => {
        return api.get('/badges', { params: { id } });
    },

    searchByName: (name) => {
        return api.get('/badges', { params: { name } });
    },

    // Tìm kiếm skill trong badges
    searchBySkillName: (skillName) => {
        return api.get('/badges', { params: { skillName } });
    }
};