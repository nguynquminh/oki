import { Link } from 'react-router-dom';
import { Gamepad2, Users } from 'lucide-react';

export default function GameModeCard({ gameMode }) {
    return (
        <Link
            to={`/gamemodes/${gameMode.id || gameMode.keyword || encodeURIComponent(gameMode.name)}`}
            className="group glass rounded-lg p-6 hover:border-gaming-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-gaming-600/20 hover:-translate-y-1"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-700/50">
                    {(gameMode.image_url || gameMode.main_image || gameMode.image) ? (
                        <img src={gameMode.image_url || gameMode.main_image || gameMode.image} alt={gameMode.name} className="w-full h-full object-cover" />
                    ) : (
                        <Gamepad2 className="w-6 h-6 text-accent-gold" />
                    )}
                </div>
                {gameMode.playerCount && (
                    <div className="flex items-center gap-1 text-sm text-slate-400">
                        <Users className="w-4 h-4" />
                        {gameMode.playerCount}
                    </div>
                )}
            </div>

            <h3 className="font-bold text-white group-hover:text-gaming-300 transition-colors mb-2">
                {gameMode.name}
            </h3>

            {gameMode.description && (
                <p className="text-sm text-slate-400 line-clamp-3">
                    {Array.isArray(gameMode.description) ? gameMode.description.join(' ') : gameMode.description}
                </p>
            )}

            {gameMode.duration && (
                <div className="mt-4 pt-4 border-t border-slate-700/50 text-xs text-slate-400">
                    ⏱️ Thời lượng: {gameMode.duration} phút
                </div>
            )}
        </Link>
    );
}