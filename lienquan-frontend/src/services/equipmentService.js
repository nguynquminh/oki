import api from './api';

export const equipmentService = {
    getAll: (params = {}) => {
        return api.get('/equipments', { params });
    },

    getById: (id) => {
        return api.get('/equipments', { params: { id } });
    },

    searchByName: (name) => {
        return api.get('/equipments', { params: { name } });
    }
};