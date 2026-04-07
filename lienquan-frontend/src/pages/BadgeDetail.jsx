import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { badgeService } from '../services/badgeService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import { ChevronLeft, Compass, Info, ShieldAlert } from 'lucide-react';

export default function BadgeDetail() {
    const { id } = useParams();
    const [badge, setBadge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBadge = async () => {
            try {
                setLoading(true);
                const response = await badgeService.getById(id);
                setBadge(response.data[0] || response.data);
                setError(null);
            } catch (err) {
                setError(err.message || 'Lỗi khi tải thông tin phù hiệu');
            } finally {
                setLoading(false);
            }
        };

        fetchBadge();
    }, [id]);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    if (!badge) return <ErrorMessage message="Không tìm thấy phù hiệu" />;

    return (
        <div className="space-y-6">
            <Link
                to="/badges"
                className="inline-flex items-center gap-2 text-gaming-400 hover:text-gaming-300 transition-colors"
            >
                <ChevronLeft className="w-5 h-5" />
                Quay lại danh sách Phù hiệu
            </Link>

            <div className="glass rounded-xl overflow-hidden p-8">
                <div className="flex flex-col items-center text-center gap-5 border-b border-slate-700/50 pb-8 mb-8">
                    {/* Image Section */}
                    {badge.image ? (
                        <div className="w-32 h-32 rounded-full p-2 flex items-center justify-center bg-slate-800 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            <img src={badge.image} alt={badge.name} className="w-full h-full object-contain rounded-full" />
                        </div>
                    ) : (
                        <div className="w-32 h-32 rounded-full flex items-center justify-center bg-slate-800 shadow-2xl">
                            <Compass className="w-16 h-16 text-accent-gold" />
                        </div>
                    )}
                    
                    <h1 className="text-4xl font-bold text-white">
                        {badge.name}
                    </h1>

                    {badge.description && (
                        <p className="text-slate-300 leading-relaxed font-medium max-w-2xl whitespace-pre-line">
                            {badge.description}
                        </p>
                    )}
                </div>

                {/* Badge Groups & Skills */}
                {badge.groups && badge.groups.length > 0 && (
                    <div className="space-y-8">
                        {badge.groups.map((group, gIdx) => (
                            <div key={gIdx} className="space-y-4">
                                <h2 className="text-2xl font-bold text-gaming-300 flex items-center gap-2">
                                    <ShieldAlert className="w-6 h-6" />
                                    {group.name || `Nhánh ${gIdx + 1}`}
                                </h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {group.skills && group.skills.map((skill, sIdx) => (
                                        <div key={sIdx} className="bg-slate-800/50 p-5 rounded-lg border border-slate-700/50 flex gap-4 hover:border-gaming-500/30 transition-colors">
                                            {skill.image ? (
                                                <div className="w-16 h-16 rounded-lg bg-slate-900 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                    <img src={skill.image} alt={skill.name} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-16 rounded-lg bg-slate-900 flex-shrink-0 flex items-center justify-center">
                                                    <Info className="w-8 h-8 text-slate-500" />
                                                </div>
                                            )}
                                            
                                            <div className="flex-1">
                                                <h3 className="font-bold text-white mb-2">{skill.name}</h3>
                                                {skill.description && (
                                                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                                                        {skill.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
