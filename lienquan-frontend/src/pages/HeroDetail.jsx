import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { heroService } from '../services/heroService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import { ChevronLeft, Sparkles, Heart, Shield, Zap } from 'lucide-react';

export default function HeroDetail() {
    const { heroId: id } = useParams();
    const [hero, setHero] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHero = async () => {
            try {
                setLoading(true);
                const response = await heroService.getById(id);
                setHero(response.data[0] || response.data);
                setError(null);
            } catch (err) {
                setError(err.message || 'Lỗi khi tải thông tin tướng');
            } finally {
                setLoading(false);
            }
        };

        fetchHero();
    }, [id]);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    if (!hero) return <ErrorMessage message="Không tìm thấy tướng" />;

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Link
                to="/heroes"
                className="inline-flex items-center gap-2 text-gaming-400 hover:text-gaming-300 transition-colors"
            >
                <ChevronLeft className="w-5 h-5" />
                Quay lại danh sách
            </Link>

            {/* Hero Header */}
            <div className="glass rounded-xl overflow-hidden">
                <div className="relative h-96 bg-gradient-to-b from-gaming-600/20 to-transparent">
                    {hero.image && (
                        <img
                            src={hero.image}
                            alt={hero.name}
                            className="w-full h-full object-cover"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

                    {/* Hero Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-4xl font-bold text-white mb-2">
                                    {hero.name}
                                </h1>
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 bg-gaming-600/90 rounded-full text-sm font-semibold text-white">
                                        {hero.role}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hero Details */}
                <div className="p-8 space-y-8">
                    {/* Description */}
                    {hero.description && (
                        <div>
                            <h2 className="text-xl font-bold text-white mb-3">Mô Tả</h2>
                            <p className="text-slate-300 leading-relaxed">{hero.description}</p>
                        </div>
                    )}

                    {/* Stats */}
                    {hero.stats && (
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">Chỉ Số</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {hero.stats.power && (
                                    <div className="glass rounded-lg p-4">
                                        <Sparkles className="w-5 h-5 text-accent-gold mb-2" />
                                        <div className="text-sm text-slate-400">Sức Mạnh</div>
                                        <div className="text-2xl font-bold text-white">{hero.stats.power}</div>
                                    </div>
                                )}
                                {hero.stats.skill && (
                                    <div className="glass rounded-lg p-4">
                                        <Zap className="w-5 h-5 text-accent-gold mb-2" />
                                        <div className="text-sm text-slate-400">Kỹ Năng</div>
                                        <div className="text-2xl font-bold text-white">{hero.stats.skill}</div>
                                    </div>
                                )}
                                {hero.stats.difficulty && (
                                    <div className="glass rounded-lg p-4">
                                        <Shield className="w-5 h-5 text-accent-gold mb-2" />
                                        <div className="text-sm text-slate-400">Độ Khó</div>
                                        <div className="text-2xl font-bold text-white">{hero.stats.difficulty}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Skills */}
                    {hero.skills && hero.skills.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">Kỹ Năng</h2>
                            <div className="space-y-4">
                                {hero.skills.map((skill, idx) => (
                                    <div key={idx} className="glass rounded-lg p-4 flex gap-4">
                                        {skill.skill_image && (
                                            <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-slate-700/50 bg-slate-800">
                                                <img 
                                                    src={skill.skill_image} 
                                                    alt={skill.skill_name || skill.name || `Kỹ năng ${idx}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="font-bold text-white">{skill.skill_name || skill.name || `Kỹ Năng ${idx + 1}`}</h3>
                                                {skill.cooldown && (
                                                    <span className="text-sm text-gaming-300">CD: {skill.cooldown}s</span>
                                                )}
                                            </div>
                                            {skill.description && (
                                                <p className="text-slate-300 text-sm whitespace-pre-line">{skill.description}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recommended Items */}
                    {hero.recommendedItems && hero.recommendedItems.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">Trang Bị Khuyến Nghị</h2>
                            <div className="flex flex-wrap gap-3">
                                {hero.recommendedItems.map((item, idx) => (
                                    <div key={idx} className="glass rounded-lg px-4 py-2">
                                        <span className="text-white">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Skins */}
                    {hero.skins && hero.skins.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">Trang Phục</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {hero.skins.map((skin, idx) => (
                                    <div key={idx} className="glass rounded-lg overflow-hidden group">
                                        <div className="relative aspect-[3/4] bg-slate-800">
                                            {skin.skin_image && (
                                                <img
                                                    src={skin.skin_image}
                                                    alt={skin.skin_name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        </div>
                                        <div className="p-3 bg-slate-900/50">
                                            <h3 className="font-bold text-white text-sm text-center line-clamp-2" title={skin.skin_name}>
                                                {skin.skin_name}
                                            </h3>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}