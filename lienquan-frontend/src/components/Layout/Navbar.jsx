import { Menu } from 'lucide-react';

export default function Navbar({ onMenuClick }) {
    return (
        <nav className="fixed top-0 w-full glass-dark border-b border-gaming-700/30 z-40">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onMenuClick}
                        aria-label="Mở menu"
                        className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-gaming-500 focus:outline-none"
                    >
                        <Menu className="w-6 h-6 text-white" />
                    </button>
                    <h1 className="text-xl font-bold text-white">Liên Quân Encyclopedia</h1>
                </div>
            </div>
        </nav>
    );
}