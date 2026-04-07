import api from './api';

export const heroService = {
    // Lấy tất cả tướng
    getAll: (params = {}) => {
        return api.get('/heroes', { params });
    },

    // Lấy tướng theo ID
    getById: (id) => {
        return api.get('/heroes', { params: { id } });
    },

    // Tìm kiếm tướng theo tên
    searchByName: (name) => {
        return api.get('/heroes', { params: { name } });
    },

    // Lọc theo role
    filterByRole: (role, limit = 50, offset = 0) => {
        return api.get('/heroes', {
            params: { role, limit, offset }
        });
    }
};