export default function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-slate-700/30"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-gaming-500 border-r-gaming-400 animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-accent-gold opacity-50 animate-spin" style={{ animationDirection: 'reverse' }}></div>
            </div>
            <span className="ml-4 text-slate-300">Đang tải...</span>
        </div>
    );
}