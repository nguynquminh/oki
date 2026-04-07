import api from './api';

export const runeService = {
    getAll: (params = {}) => {
        return api.get('/runes', { params });
    },

    getById: (id) => {
        return api.get('/runes', { params: { id } });
    },

    searchByName: (name) => {
        return api.get('/runes', { params: { name } });
    }
};