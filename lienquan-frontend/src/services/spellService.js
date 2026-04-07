import api from './api';

export const spellService = {
    getAll: (params = {}) => {
        return api.get('/spells', { params });
    },

    getById: (id) => {
        return api.get('/spells', { params: { id } });
    },

    searchByName: (name) => {
        return api.get('/spells', { params: { name } });
    }
};