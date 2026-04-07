import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';

export default function EquipmentCard({ equipment }) {
    return (
        <Link
            to={`/equipments/${equipment.id}`}
            className="group glass rounded-lg p-4 hover:border-gaming-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-gaming-600/20 hover:-translate-y-1"
        >
            <div className="flex gap-4">
                {/* Image */}
                <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-red-600/20 to-orange-600/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    {equipment.image && (
                        <img src={equipment.image} alt={equipment.name} className="w-full h-full object-contain p-2" />
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 space-y-2">
                    <h3 className="font-bold text-white group-hover:text-gaming-300 transition-colors">
                        {equipment.name}
                    </h3>

                    {equipment.price && (
                        <div className="flex items-center gap-1 text-sm text-accent-gold">
                            <TrendingUp className="w-4 h-4" />
                            {equipment.price} vàng
                        </div>
                    )}

                    {equipment.description && (
                        <p className="text-xs text-slate-400 line-clamp-2">
                            {equipment.description}
                        </p>
                    )}

                    {equipment.stats && (
                        <div className="pt-2 space-y-1">
                            {equipment.stats.slice(0, 3).map((stat, idx) => (
                                <div key={idx} className="text-xs text-slate-300 line-clamp-1" title={stat}>
                                    • {stat}
                                </div>
                            ))}
                        </div>
                    )}

                    {equipment.effects && !equipment.stats && (
                        <div className="pt-2 space-y-1">
                            {equipment.effects.slice(0, 2).map((effect, idx) => (
                                <div key={idx} className="text-xs text-slate-300">
                                    • {effect}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}