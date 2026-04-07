import axios from 'axios';

// Lấy base URL từ env hoặc dùng mặc định
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:2009/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor cho requests
api.interceptors.request.use(
    (config) => {
        console.log(`📡 [${config.method.toUpperCase()}] ${config.url}`);
        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

// Interceptor cho responses
api.interceptors.response.use(
    (response) => {
        console.log('✅ Response:', response.status);
        return response.data;
    },
    (error) => {
        if (error.response) {
            // Server trả về lỗi
            console.error(`❌ [${error.response.status}] ${error.response.data.message}`);
            return Promise.reject(error.response.data);
        } else if (error.request) {
            // Request nhưng không nhận được response
            console.error('❌ No Response:', error.request);
            return Promise.reject({ message: 'Không thể kết nối tới server' });
        } else {
            // Error khác
            console.error('❌ Error:', error.message);
            return Promise.reject({ message: error.message });
        }
    }
);

export default api;