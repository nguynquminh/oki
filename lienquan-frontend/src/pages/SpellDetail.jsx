import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { spellService } from '../services/spellService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import { ChevronLeft, Wand2, Sparkles, Timer, Cpu } from 'lucide-react';

export default function SpellDetail() {
    const { id } = useParams();
    const [spell, setSpell] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSpell = async () => {
            try {
                setLoading(true);
                const response = await spellService.getById(id);
                setSpell(response.data[0] || response.data);
                setError(null);
            } catch (err) {
                setError(err.message || 'Lỗi khi tải thông tin phép bổ trợ');
            } finally {
                setLoading(false);
            }
        };

        fetchSpell();
    }, [id]);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    if (!spell) return <ErrorMessage message="Không tìm thấy phép bổ trợ" />;

    return (
        <div className="space-y-6">
            <Link
                to="/spells"
                className="inline-flex items-center gap-2 text-gaming-400 hover:text-gaming-300 transition-colors"
            >
                <ChevronLeft className="w-5 h-5" />
                Quay lại danh sách Phép bổ trợ
            </Link>

            <div className="glass rounded-xl overflow-hidden p-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Icon/Image Section */}
                    {(spell.image_url || spell.image) ? (
                        <div className="w-48 h-48 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-4 flex-shrink-0 flex items-center justify-center border border-slate-700/50 shadow-2xl">
                            <img src={spell.image_url || spell.image} alt={spell.name} className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <div className="w-48 h-48 bg-gradient-to-br from-yellow-500/30 to-orange-500/30 rounded-xl flex-shrink-0 flex items-center justify-center border border-slate-700/50 shadow-2xl">
                            <Wand2 className="w-24 h-24 text-accent-gold" />
                        </div>
                    )}

                    {/* Info Section */}
                    <div className="flex-1 space-y-6">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-3">
                                {spell.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3">
                                {spell.cooldown && (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/80 rounded-lg text-gaming-300 font-medium">
                                        <Timer className="w-5 h-5" />
                                        Hồi chiêu: {spell.cooldown.replace(/giây|s/g, '').trim()}s
                                    </div>
                                )}
                                {spell.cost && (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/80 rounded-lg text-gaming-300 font-medium">
                                        <Cpu className="w-5 h-5" />
                                        Tiêu hao: {spell.cost}
                                    </div>
                                )}
                            </div>
                        </div>

                        {spell.description && (
                            <div className="bg-slate-900/40 p-5 rounded-lg border border-slate-800/60">
                                <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-gaming-400" />
                                    Hiệu ứng
                                </h2>
                                <p className="text-slate-300 leading-relaxed font-medium whitespace-pre-line">
                                    {spell.description}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
