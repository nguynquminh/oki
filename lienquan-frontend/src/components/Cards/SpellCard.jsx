import { Link } from 'react-router-dom';
import { Wand2 } from 'lucide-react';

export default function SpellCard({ spell }) {
    return (
        <Link
            to={`/spells/${spell.id}`}
            className="group glass rounded-lg p-4 hover:border-gaming-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-gaming-600/20"
        >
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/30 to-orange-500/30 flex items-center justify-center overflow-hidden">
                    {(spell.image_url || spell.image) ? (
                        <img src={spell.image_url || spell.image} alt={spell.name} className="w-full h-full object-cover" />
                    ) : (
                        <Wand2 className="w-6 h-6 text-accent-gold" />
                    )}
                </div>
                <h3 className="font-bold text-white group-hover:text-gaming-300 transition-colors flex-1">
                    {spell.name}
                </h3>
            </div>

            {spell.description && (
                <p className="text-sm text-slate-400 line-clamp-2 mb-2">
                    {spell.description}
                </p>
            )}

            {spell.cooldown && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 text-xs text-slate-400">
                    <span>Hồi chiêu: {spell.cooldown.replace(/giây|s/g, '').trim()}s</span>
                    {spell.cost && <span>Tiêu hao: {spell.cost}</span>}
                </div>
            )}
        </Link>
    );
}