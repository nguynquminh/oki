import { motion } from 'framer-motion';
import { Sparkles, Heart, CreditCard, Droplets } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function PinkDesignSystem() {
    const [progress, setProgress] = useState(0);

    // Giả lập thanh Progress tự động chạy
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) return 0;
                return prev + 10;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Hiệu ứng Heartbeat cho Button
    const heartbeatAnimation = {
        scale: [1, 1.05, 1, 1.05, 1],
        transition: {
            duration: 0.8,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "loop"
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-8 space-y-12">
            
            {/* 1. MÀU SẮC ĐỂ THAM KHẢO */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Droplets className="text-neonPink-500" />
                    Bảng mã màu "neonPink"
                </h2>
                <div className="flex flex-wrap gap-4">
                    <div className="w-24 h-24 rounded-lg bg-neonPink-50 flex items-center justify-center text-slate-900 font-bold border border-slate-700">50</div>
                    <div className="w-24 h-24 rounded-lg bg-neonPink-200 flex items-center justify-center text-slate-900 font-bold border border-slate-700">200</div>
                    <div className="w-24 h-24 rounded-lg bg-neonPink-500 flex items-center justify-center text-white font-bold border border-slate-700">500</div>
                    <div className="w-24 h-24 rounded-lg bg-neonPink-700 flex items-center justify-center text-white font-bold border border-slate-700">700</div>
                    <div className="w-24 h-24 rounded-lg bg-neonPink-900 flex items-center justify-center text-white font-bold border border-slate-700">900</div>
                </div>
            </section>

            {/* 2. GRADIENT HEADER */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold">Linear Gradient Sang Trọng</h2>
                <div className="h-32 w-full rounded-2xl bg-gradient-to-r from-neonPink-500 to-purple-800 flex items-center px-8 shadow-2xl relative overflow-hidden">
                    {/* Họa tiết trang trí phụ */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-[40px] translate-x-1/2 -translate-y-1/2" />
                    
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                            <Sparkles className="text-neonPink-200" />
                            Aesthetic Header
                        </h1>
                        <p className="text-neonPink-50 opacity-90">Sự kết hợp hoàn mỹ giữa Hồng & Tím</p>
                    </div>
                </div>
            </section>

            {/* 3. GLASSMORPHISM CARD */}
            <section className="space-y-4 relative w-full overflow-hidden p-8 border border-slate-800 rounded-3xl">
                <h2 className="text-2xl font-bold relative z-10">Glassmorphism Pink Card</h2>
                
                {/* Abstract background blobs để làm nền hắt sáng cho kính */}
                <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-neonPink-500 rounded-full mix-blend-screen filter blur-[50px] opacity-60 z-0"></div>
                <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-purple-600 rounded-full mix-blend-screen filter blur-[40px] opacity-40 z-0"></div>

                {/* THE CARD */}
                <div className="relative z-10 max-w-sm rounded-[2rem] p-8 backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(236,72,153,0.15)] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 pointer-events-none" />
                    
                    <div className="relative z-20">
                        <div className="w-12 h-12 rounded-full bg-neonPink-500/20 flex items-center justify-center mb-6 border border-neonPink-500/30">
                            <CreditCard className="text-neonPink-200" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Thẻ Kính Điệu Đà</h3>
                        <p className="text-slate-200 text-sm leading-relaxed text-opacity-80">
                            Đây là một chiếc thẻ được đúc bằng "pha lê". Nền sau bị làm mờ cực ảo dịu và hắt chút tia sáng gradient sang trọng.
                        </p>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* 4. HEARTBEAT BUTTON */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold">Micro-interaction (Heartbeat)</h2>
                    
                    <motion.button
                        whileHover={heartbeatAnimation}
                        className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-neonPink-500 to-neonPink-700 rounded-full font-bold text-lg text-white shadow-[0_4px_20px_rgba(236,72,153,0.4)] border border-neonPink-500/50"
                    >
                        <Heart className="w-5 h-5 fill-white" />
                        Gửi Ngay Yêu Thương
                    </motion.button>
                </section>

                {/* 5. GLOW PROGRESS BAR */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold">Glow Progress Bar</h2>
                    
                    <div className="w-full max-w-md">
                        <div className="flex justify-between text-sm mb-2 font-medium">
                            <span className="text-slate-400">Tiến độ tải dữ liệu</span>
                            <span className={progress === 100 ? "text-neonPink-500 font-bold" : "text-slate-300"}>
                                {progress}%
                            </span>
                        </div>
                        
                        {/* Thanh nền */}
                        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700/50">
                            {/* Thanh tiến trình màu hồng */}
                            <motion.div 
                                className="h-full bg-neonPink-500 relative"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                            >
                                {/* Hiệu ứng phát sáng Glow khi 100% (dồn ánh sáng ở đầu thanh tiến trình) */}
                                {progress === 100 && (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-full bg-white blur-[4px] shadow-[0_0_15px_10px_#ec4899] mix-blend-screen"
                                    />
                                )}
                            </motion.div>
                        </div>
                        {progress === 100 && (
                            <motion.p 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-2 text-sm text-neonPink-400 font-semibold"
                            >
                                Chúc mừng! Đã hoàn tất siêu phẩm.
                            </motion.p>
                        )}
                    </div>
                </section>
            </div>
            
        </div>
    );
}
