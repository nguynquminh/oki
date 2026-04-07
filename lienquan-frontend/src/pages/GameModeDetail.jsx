import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { gamemodeService } from '../services/gamemodeService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import { ChevronLeft, Gamepad2, Timer, Users, Info } from 'lucide-react';

export default function GameModeDetail() {
    const { id } = useParams();
    const [gameMode, setGameMode] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchGameMode = async () => {
            try {
                setLoading(true);
                // Dữ liệu GameModes.json thường không có trường "id", chỉ có "keyword"
                // Ta tìm theo id lưu trong tham số URL (được gán bằng keyword từ Card)
                const response = await gamemodeService.getAll();
                let foundMode = null;
                
                if (response.data && Array.isArray(response.data)) {
                    foundMode = response.data.find(m => 
                        m.id?.toString() === id || 
                        m.keyword === id || 
                        m.name === decodeURIComponent(id)
                    );
                }

                // Nếu backend hỗ trợ filterByKeyword
                if (!foundMode) {
                    const keywordResp = await gamemodeService.filterByKeyword(id);
                    if (keywordResp.data && keywordResp.data.length > 0) {
                        foundMode = keywordResp.data[0];
                    }
                }

                setGameMode(foundMode);
                setError(null);
            } catch (err) {
                setError(err.message || 'Lỗi khi tải thông tin chế độ chơi');
            } finally {
                setLoading(false);
            }
        };

        fetchGameMode();
    }, [id]);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    if (!gameMode) return <ErrorMessage message="Không tìm thấy chế độ chơi" />;

    return (
        <div className="space-y-6">
            <Link
                to="/gamemodes"
                className="inline-flex items-center gap-2 text-gaming-400 hover:text-gaming-300 transition-colors"
            >
                <ChevronLeft className="w-5 h-5" />
                Quay lại danh sách Chế độ chơi
            </Link>

            <div className="glass rounded-xl overflow-hidden p-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Image Section */}
                    {(gameMode.image_url || gameMode.main_image || gameMode.image) ? (
                        <div className="w-48 h-48 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl p-4 flex-shrink-0 flex items-center justify-center border border-slate-700/50 shadow-2xl">
                            <img src={gameMode.image_url || gameMode.main_image || gameMode.image} alt={gameMode.name} className="w-full h-full object-cover rounded-lg" />
                        </div>
                    ) : (
                        <div className="w-48 h-48 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-xl flex-shrink-0 flex items-center justify-center border border-slate-700/50 shadow-2xl">
                            <Gamepad2 className="w-24 h-24 text-accent-gold" />
                        </div>
                    )}

                    {/* Info Section */}
                    <div className="flex-1 space-y-6">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-4">
                                {gameMode.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3">
                                {gameMode.playerCount && (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/80 rounded-lg text-gaming-300 font-medium">
                                        <Users className="w-5 h-5" />
                                        Người chơi: {gameMode.playerCount}
                                    </div>
                                )}
                                {gameMode.duration && (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/80 rounded-lg text-gaming-300 font-medium">
                                        <Timer className="w-5 h-5" />
                                        Thời lượng: {gameMode.duration} phút
                                    </div>
                                )}
                            </div>
                        </div>

                        {gameMode.description && (
                            <div className="bg-slate-900/40 p-5 rounded-lg border border-slate-800/60">
                                <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                    <Info className="w-5 h-5 text-gaming-400" />
                                    Mô tả chế độ
                                </h2>
                                <div className="space-y-3">
                                    {Array.isArray(gameMode.description) ? (
                                        gameMode.description.map((desc, idx) => (
                                            <p key={idx} className="text-slate-300 leading-relaxed font-medium">
                                                {desc}
                                            </p>
                                        ))
                                    ) : (
                                        <p className="text-slate-300 leading-relaxed font-medium whitespace-pre-line">
                                            {gameMode.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
