import { useState, useEffect } from 'react';
import { gamemodeService } from '../services/gamemodeService';
import GameModeCard from '../components/Cards/GameModeCard';
import SearchBar from '../components/Common/SearchBar';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import { Gamepad2 } from 'lucide-react';

export default function GameModes() {
    const [gamemodes, setGameModes] = useState([]);
    const [filteredGameModes, setFilteredGameModes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchGameModes = async () => {
            try {
                setLoading(true);
                const response = await gamemodeService.getAll({ limit: 100 });
                setGameModes(response.data);
                setFilteredGameModes(response.data);
                setError(null);
            } catch (err) {
                setError(err.message || 'Lỗi khi tải dữ liệu chế độ chơi');
            } finally {
                setLoading(false);
            }
        };

        fetchGameModes();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            setFilteredGameModes(
                gamemodes.filter(g =>
                    g.name?.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        } else {
            setFilteredGameModes(gamemodes);
        }
    }, [searchQuery, gamemodes]);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Gamepad2 className="w-8 h-8 text-gaming-400" />
                    <h1 className="text-3xl font-bold text-white">Chế Độ Chơi</h1>
                </div>
                <p className="text-slate-400">Khám phá {filteredGameModes.length} chế độ chơi ({gamemodes.length} tổng cộng)</p>
            </div>

            <SearchBar
                onSearch={setSearchQuery}
                placeholder="Tìm kiếm chế độ chơi..."
            />

            {filteredGameModes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredGameModes.map(gameMode => (
                        <GameModeCard key={gameMode.id} gameMode={gameMode} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Không tìm thấy chế độ chơi nào</p>
                </div>
            )}
        </div>
    );
}