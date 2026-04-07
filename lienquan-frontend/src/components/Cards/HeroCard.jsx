import { Link } from 'react-router-dom';
import { Users, Sparkles } from 'lucide-react';

export default function HeroCard({ hero }) {
    return (
        <Link
            to={`/heroes/${hero.id}`}
            className="group glass rounded-lg overflow-hidden hover:border-gaming-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-gaming-600/20 hover:-translate-y-1"
        >
            {/* Image Section */}
            <div className="relative h-48 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
                {hero.image && (
                    <img
                        src={hero.image}
                        alt={hero.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />

                {/* Badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1 bg-gaming-600/90 rounded-full text-xs font-semibold text-white">
                    <Sparkles className="w-3 h-3" />
                    {hero.role || 'Unknown'}
                </div>
            </div>

            {/* Info Section */}
            <div className="p-4 space-y-3">
                <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-gaming-300 transition-colors">
                        {hero.name}
                    </h3>
                    <p className="text-sm text-slate-400">{hero.role}</p>
                </div>

                {/* Description */}
                {hero.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">
                        {hero.description}
                    </p>
                )}

                {/* Stats */}
                {hero.stats && (
                    <div className="flex gap-2 pt-2 border-t border-slate-700/50">
                        <div className="flex-1 text-center">
                            <div className="text-sm font-bold text-accent-gold">{hero.stats.power || '-'}</div>
                            <div className="text-xs text-slate-500">Sức Mạnh</div>
                        </div>
                        <div className="flex-1 text-center">
                            <div className="text-sm font-bold text-accent-gold">{hero.stats.skill || '-'}</div>
                            <div className="text-xs text-slate-500">Kỹ Năng</div>
                        </div>
                        <div className="flex-1 text-center">
                            <div className="text-sm font-bold text-accent-gold">{hero.stats.difficulty || '-'}</div>
                            <div className="text-xs text-slate-500">Độ Khó</div>
                        </div>
                    </div>
                )}
            </div>
        </Link>
    );
}