import { Link } from 'react-router-dom';
import { Gem } from 'lucide-react';

export default function RuneCard({ rune }) {
    return (
        <Link
            to={`/runes/${rune.id}`}
            className="group glass rounded-lg p-4 hover:border-gaming-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-gaming-600/20"
        >
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                    <Gem className="w-6 h-6 text-accent-gold" />
                </div>
                <h3 className="font-bold text-white group-hover:text-gaming-300 transition-colors flex-1">
                    {rune.name}
                </h3>
            </div>

            {rune.description && (
                <p className="text-sm text-slate-400 line-clamp-2 mb-2">
                    {rune.description}
                </p>
            )}

            {rune.stats && rune.stats.length > 0 && (
                <div className="pt-2 border-t border-slate-700/50 space-y-1">
                    {rune.stats.map((stat, idx) => (
                        <p key={idx} className="text-xs text-gaming-300">• {stat}</p>
                    ))}
                </div>
            )}

            {rune.effect && !rune.stats && (
                <div className="pt-2 border-t border-slate-700/50">
                    <p className="text-xs text-gaming-300">{rune.effect}</p>
                </div>
            )}
        </Link>
    );
}