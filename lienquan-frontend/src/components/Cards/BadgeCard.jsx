import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function BadgeCard({ badge }) {
    const skillCount = badge.groups?.reduce((sum, g) => sum + (g.skills?.length || 0), 0) || 0;

    return (
        <Link
            to={`/badges/${badge.id}`}
            className="group glass rounded-lg p-4 hover:border-gaming-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-gaming-600/20 hover:-translate-y-1"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="font-bold text-white group-hover:text-gaming-300 transition-colors mb-1">
                        {badge.name}
                    </h3>

                    {badge.description && (
                        <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                            {badge.description}
                        </p>
                    )}

                    {skillCount > 0 && (
                        <div className="inline-block px-2 py-1 bg-gaming-600/20 rounded text-xs text-gaming-300">
                            {skillCount} kỹ năng
                        </div>
                    )}
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-gaming-400 transition-colors" />
            </div>
        </Link>
    );
}