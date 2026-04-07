/**
 * Middleware xử lý lỗi toàn cục
 * Express nhận diện error handler qua 4 tham số (err, req, res, next)
 */
function errorHandler(err, _req, res, _next) {
    console.error('❌ Unhandled Error:', err.message);

    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }

    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'development'
            ? err.message
            : 'Lỗi server nội bộ. Vui lòng thử lại sau.'
    });
}

module.exports = errorHandler;