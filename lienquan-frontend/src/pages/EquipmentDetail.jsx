import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { equipmentService } from '../services/equipmentService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import { ChevronLeft, TrendingUp, Zap, Shield, PlusCircle } from 'lucide-react';

export default function EquipmentDetail() {
    const { id } = useParams();
    const [equipment, setEquipment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                setLoading(true);
                const response = await equipmentService.getById(id);
                setEquipment(response.data[0] || response.data);
                setError(null);
            } catch (err) {
                setError(err.message || 'Lỗi khi tải thông tin trang bị');
            } finally {
                setLoading(false);
            }
        };

        fetchEquipment();
    }, [id]);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    if (!equipment) return <ErrorMessage message="Không tìm thấy trang bị" />;

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Link
                to="/equipments"
                className="inline-flex items-center gap-2 text-gaming-400 hover:text-gaming-300 transition-colors"
            >
                <ChevronLeft className="w-5 h-5" />
                Quay lại danh sách trang bị
            </Link>

            {/* Equipment Header & Details */}
            <div className="glass rounded-xl overflow-hidden p-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Image Section */}
                    {equipment.image && (
                        <div className="w-48 h-48 bg-gradient-to-br from-red-600/20 to-orange-600/20 rounded-xl p-4 flex-shrink-0 flex items-center justify-center border border-slate-700/50 shadow-2xl">
                            <img
                                src={equipment.image}
                                alt={equipment.name}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    )}

                    {/* Info Section */}
                    <div className="flex-1 space-y-6">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-3">
                                {equipment.name}
                            </h1>
                            {equipment.price && (
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/80 rounded-lg text-accent-gold font-bold shadow-inner">
                                    <TrendingUp className="w-5 h-5" />
                                    Giá: {equipment.price} Vàng
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {equipment.description && (
                            <div className="bg-slate-900/40 p-5 rounded-lg border border-slate-800/60">
                                <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                    <PlusCircle className="w-5 h-5 text-gaming-400" />
                                    Mô tả
                                </h2>
                                <p className="text-slate-300 leading-relaxed font-medium">
                                    {equipment.description}
                                </p>
                            </div>
                        )}

                        {/* Stats */}
                        {equipment.stats && equipment.stats.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Zap className="w-6 h-6 text-gaming-400" />
                                    Chỉ số & Hiệu ứng
                                </h2>
                                <div className="grid grid-cols-1 gap-3">
                                    {equipment.stats.map((stat, idx) => (
                                        <div key={idx} className="bg-slate-800/50 hover:bg-slate-800/80 transition-colors p-4 rounded-lg flex items-start gap-3 border border-slate-700/50">
                                            <Shield className="w-5 h-5 text-gaming-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-slate-200 leading-relaxed whitespace-pre-line">{stat}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Effects */}
                        {equipment.effects && equipment.effects.length > 0 && !equipment.stats && (
                            <div>
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Zap className="w-6 h-6 text-gaming-400" />
                                    Hiệu ứng
                                </h2>
                                <div className="grid grid-cols-1 gap-3">
                                    {equipment.effects.map((effect, idx) => (
                                        <div key={idx} className="bg-slate-800/50 hover:bg-slate-800/80 transition-colors p-4 rounded-lg flex items-start gap-3 border border-slate-700/50">
                                            <Shield className="w-5 h-5 text-gaming-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-slate-200">{effect}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Build Tree / Components (if we had them in data) */}
                        {equipment.components && equipment.components.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-white mb-4">Công thức</h2>
                                <div className="flex flex-wrap gap-2">
                                    {equipment.components.map((comp, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-slate-800 rounded text-slate-300 text-sm border border-slate-700">
                                            {comp}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
