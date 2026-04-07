import { Link, useLocation } from 'react-router-dom';
import {
    Users,
    Sword,
    Gem,
    Shield,
    Wand2,
    Gamepad2,
    Home,
    Menu
} from 'lucide-react';

const menuItems = [
    { name: 'Trang Chủ', path: '/', icon: Home },
    { name: 'Tướng', path: '/heroes', icon: Users },
    { name: 'Trang Bị', path: '/equipments', icon: Sword },
    { name: 'Bảng Ngọc', path: '/runes', icon: Gem },
    { name: 'Phù Hiệu', path: '/badges', icon: Shield },
    { name: 'Phép Bổ Trợ', path: '/spells', icon: Wand2 },
    { name: 'Chế Độ Chơi', path: '/gamemodes', icon: Gamepad2 },
];

export default function Sidebar() {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <aside className="h-full glass-dark border-r border-gaming-700/30 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gaming-700/30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gaming-400 to-gaming-600 flex items-center justify-center">
                        <Gamepad2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Liên Quân</h1>
                        <p className="text-xs text-slate-400">api-website</p>
                    </div>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-lg
                                transition-all duration-200
                                ${active
                                    ? 'bg-gaming-600 text-white shadow-lg shadow-gaming-600/20'
                                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                                }
                            `}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{item.name}</span>
                            {active && (
                                <div className="ml-auto w-2 h-2 rounded-full bg-accent-gold" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer Info */}
            <div className="p-6 border-t border-gaming-700/30 space-y-3">
                <div className="text-xs text-slate-400 space-y-1">
                    <p>🎮 Liên Quân Mobile</p>
                    <p>Nguyễn Quang Minh</p>
                </div>
                <div className="pt-3 border-t border-slate-700/50">
                    <p className="text-xs text-slate-500">© 2024 Liên Quân API</p>
                </div>
            </div>
        </aside>
    );
}