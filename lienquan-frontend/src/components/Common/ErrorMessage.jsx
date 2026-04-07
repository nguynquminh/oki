import { AlertCircle } from 'lucide-react';

export default function ErrorMessage({ message, onRetry }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="rounded-full bg-red-500/10 border border-red-500/30 p-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Đã Xảy Ra Lỗi</h3>
                <p className="text-slate-400 mb-4">{message}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="px-4 py-2 bg-gaming-600 hover:bg-gaming-500 text-white rounded-lg transition-colors"
                    >
                        Thử Lại
                    </button>
                )}
            </div>
        </div>
    );
}