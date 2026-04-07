export default function HeroSkeleton() {
    return (
        <div className="glass rounded-xl p-4 animate-pulse-glow border-slate-700/30">
            {/* Avatar Placeholder */}
            <div className="relative aspect-square rounded-lg bg-slate-800 mb-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-800 to-slate-700/50" />
            </div>
            
            <div className="space-y-3">
                {/* Title & Role */}
                <div className="flex justify-between items-center">
                    <div className="h-6 w-2/3 bg-slate-800 rounded-md" />
                    <div className="h-6 w-1/4 bg-slate-800 rounded-full" />
                </div>
                
                {/* Info Pills */}
                <div className="flex gap-2">
                    <div className="h-6 w-16 bg-slate-800/50 rounded-md" />
                    <div className="h-6 w-16 bg-slate-800/50 rounded-md" />
                </div>
            </div>
            
            {/* Description lines */}
            <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div className="h-4 w-full bg-slate-800/60 rounded mb-2" />
                <div className="h-4 w-5/6 bg-slate-800/60 rounded" />
            </div>
        </div>
    );
}
