import { Gamepad2, Users, Sword, Gem, Shield, Wand2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const features = [
    {
        icon: Users,
        title: 'Tướng',
        desc: 'Thông tin chi tiết về 100+ tướng',
        path: '/heroes',
        color: 'from-blue-500 to-cyan-500'
    },  
    {
        icon: Sword,
        title: 'Trang Bị',
        desc: 'Danh sách trang bị và combo tối ưu',
        path: '/equipments',
        color: 'from-red-500 to-orange-500'
    },
    {
        icon: Gem,
        title: 'Bảng Ngọc',
        desc: 'Hướng dẫn ngọc cho mỗi tướng',
        path: '/runes',
        color: 'from-purple-500 to-pink-500'
    },
    {
        icon: Shield,
        title: 'Phù Hiệu',
        desc: 'Tổng hợp các phù hiệu và cách sử dụng',
        path: '/badges',
        color: 'from-green-500 to-emerald-500'
    },
    {
        icon: Wand2,
        title: 'Phép Bổ Trợ',
        desc: 'Hướng dẫn sử dụng phép bổ trợ',
        path: '/spells',
        color: 'from-yellow-500 to-orange-500'
    },
    {
        icon: Gamepad2,
        title: 'Chế Độ Chơi',
        desc: 'Các chế độ chơi và luật lệ',
        path: '/gamemodes',
        color: 'from-indigo-500 to-purple-500'
    },
];

export default function Home() {
    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-bold text-white">
                    Liên Quân Mobile
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-gaming-400 to-accent-gold">
                        Bách Khoa Toàn Thư
                    </span>
                </h1>
                <p className="text-xl text-slate-300 max-w-2xl">
                    Khám phá thông tin chi tiết về tướng, trang bị, phù hiệu, ngọc và nhiều hơn nữa.
                    Tất cả những gì bạn cần để trở thành cao thủ Liên Quân Mobile.
                </p>
            </div>

            {/* Features Grid */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                        <motion.div key={index} variants={itemVariants} whileHover={{ y: -5, scale: 1.02 }} className="h-full">
                            <Link
                                to={feature.path}
                                className="block h-full group glass hover:border-gaming-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-gaming-600/20 rounded-xl p-6 cursor-pointer"
                            >
                                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} p-3 mb-4 group-hover:scale-110 transition-transform`}>
                                    <Icon className="w-full h-full text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-400 text-sm mb-4">
                                    {feature.desc}
                                </p>
                                <div className="flex items-center text-gaming-400 text-sm font-medium">
                                    Khám phá →
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass rounded-xl p-6">
                    <div className="text-3xl font-bold text-accent-gold mb-2">100+</div>
                    <p className="text-slate-300">Tướng cập nhật</p>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="text-3xl font-bold text-accent-gold mb-2">50+</div>
                    <p className="text-slate-300">Trang bị & ngọc</p>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="text-3xl font-bold text-accent-gold mb-2">∞</div>
                    <p className="text-slate-300">Cập nhật thường xuyên</p>
                </div>
            </div>
        </div>
    );
}