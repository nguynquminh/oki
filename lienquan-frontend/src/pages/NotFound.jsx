import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="rounded-full bg-red-500/10 border border-red-500/30 w-20 h-20 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-10 h-10 text-red-400" />
                </div>

                <h1 className="text-5xl font-bold text-white">404</h1>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">Trang Không Tìm Thấy</h2>
                    <p className="text-slate-400">
                        Xin lỗi, trang bạn đang tìm không tồn tại hoặc đã bị di chuyển.
                    </p>
                </div>

                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gaming-600 hover:bg-gaming-500 text-white font-semibold rounded-lg transition-colors"
                >
                    <Home className="w-5 h-5" />
                    Quay Về Trang Chủ
                </Link>

                <p className="text-sm text-slate-500">
                    Nếu bạn cho rằng đây là một lỗi, vui lòng liên hệ với chúng tôi.
                </p>
            </div>
        </div>
    );
}