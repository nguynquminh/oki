import { motion } from 'framer-motion';

export default function GlassButton({ children, onClick, className = '', variant = 'primary' }) {
    // Tùy biến màu theo variant
    const variantStyles = {
        primary: 'bg-gaming-600/40 hover:bg-gaming-500/50 border-gaming-400/30 text-white',
        secondary: 'bg-slate-700/40 hover:bg-slate-600/50 border-slate-500/30 text-slate-200',
        danger: 'bg-red-500/30 hover:bg-red-500/50 border-red-500/30 text-white'
    };

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`
                relative overflow-hidden backdrop-blur-md border rounded-xl 
                px-6 py-2.5 font-medium transition-colors shadow-[0_4px_30px_rgba(0,0,0,0.1)]
                ${variantStyles[variant]} ${className}
            `}
            style={{
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 4px 6px rgba(0,0,0,0.1)'
            }}
        >
            {/* Hiệu ứng lóa sáng (reflection) góc trên trái */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none opacity-50" />
            <span className="relative z-10">{children}</span>
        </motion.button>
    );
}
