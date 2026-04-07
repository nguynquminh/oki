import api from './api';

export const gamemodeService = {
    getAll: (params = {}) => {
        return api.get('/gamemodes', { params });
    },

    getById: (id) => {
        return api.get('/gamemodes', { params: { id } });
    },

    searchByName: (name) => {
        return api.get('/gamemodes', { params: { name } });
    },

    filterByKeyword: (keyword) => {
        return api.get('/gamemodes', { params: { keyword } });
    }
};