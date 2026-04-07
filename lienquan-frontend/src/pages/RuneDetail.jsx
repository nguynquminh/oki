import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { runeService } from '../services/runeService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import { ChevronLeft, Gem, Sparkles, Zap } from 'lucide-react';

export default function RuneDetail() {
    const { id } = useParams();
    const [rune, setRune] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRune = async () => {
            try {
                setLoading(true);
                const response = await runeService.getById(id);
                setRune(response.data[0] || response.data);
                setError(null);
            } catch (err) {
                setError(err.message || 'Lỗi khi tải thông tin ngọc');
            } finally {
                setLoading(false);
            }
        };

        fetchRune();
    }, [id]);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    if (!rune) return <ErrorMessage message="Không tìm thấy bảng ngọc" />;

    return (
        <div className="space-y-6">
            <Link
                to="/runes"
                className="inline-flex items-center gap-2 text-gaming-400 hover:text-gaming-300 transition-colors"
            >
                <ChevronLeft className="w-5 h-5" />
                Quay lại danh sách Ngọc
            </Link>

            <div className="glass rounded-xl overflow-hidden p-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Icon/Image Section */}
                    {rune.image ? (
                        <div className="w-48 h-48 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl p-4 flex-shrink-0 flex items-center justify-center border border-slate-700/50 shadow-2xl">
                            <img src={rune.image} alt={rune.name} className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <div className="w-48 h-48 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-xl flex-shrink-0 flex items-center justify-center border border-slate-700/50 shadow-2xl">
                            <Gem className="w-24 h-24 text-accent-gold" />
                        </div>
                    )}

                    {/* Info Section */}
                    <div className="flex-1 space-y-6">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-3 flex items-center gap-3">
                                {rune.name}
                            </h1>
                        </div>

                        {rune.description && (
                            <div className="bg-slate-900/40 p-5 rounded-lg border border-slate-800/60">
                                <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-gaming-400" />
                                    Mô tả
                                </h2>
                                <p className="text-slate-300 leading-relaxed font-medium">
                                    {rune.description}
                                </p>
                            </div>
                        )}

                        {rune.stats && rune.stats.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Zap className="w-6 h-6 text-gaming-400" />
                                    Chỉ số cộng thêm
                                </h2>
                                <div className="space-y-3">
                                    {rune.stats.map((stat, idx) => (
                                        <div key={idx} className="bg-slate-800/50 p-4 rounded-lg flex items-start gap-3 border border-slate-700/50 hover:border-gaming-500/30 transition-colors">
                                            <Gem className="w-5 h-5 text-gaming-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-slate-200 leading-relaxed">{stat}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {rune.effect && !rune.stats && (
                            <div>
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Zap className="w-6 h-6 text-gaming-400" />
                                    Chỉ số cộng thêm
                                </h2>
                                <div className="bg-slate-800/50 p-4 rounded-lg flex items-start gap-3 border border-slate-700/50">
                                    <Gem className="w-5 h-5 text-gaming-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-slate-200 leading-relaxed whitespace-pre-line">{rune.effect}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
