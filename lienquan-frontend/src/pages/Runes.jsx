import { useState, useEffect } from 'react';
import { runeService } from '../services/runeService';
import RuneCard from '../components/Cards/RuneCard';
import SearchBar from '../components/Common/SearchBar';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import { Gem } from 'lucide-react';

export default function Runes() {
    const [runes, setRunes] = useState([]);
    const [filteredRunes, setFilteredRunes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchRunes = async () => {
            try {
                setLoading(true);
                const response = await runeService.getAll({ limit: 100 });
                setRunes(response.data);
                setFilteredRunes(response.data);
                setError(null);
            } catch (err) {
                setError(err.message || 'Lỗi khi tải dữ liệu ngọc');
            } finally {
                setLoading(false);
            }
        };

        fetchRunes();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            setFilteredRunes(
                runes.filter(r =>
                    r.name?.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        } else {
            setFilteredRunes(runes);
        }
    }, [searchQuery, runes]);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Gem className="w-8 h-8 text-gaming-400" />
                    <h1 className="text-3xl font-bold text-white">Bảng Ngọc</h1>
                </div>
                <p className="text-slate-400">Khám phá {filteredRunes.length} ngọc ({runes.length} tổng cộng)</p>
            </div>

            <SearchBar
                onSearch={setSearchQuery}
                placeholder="Tìm kiếm ngọc..."
            />

            {filteredRunes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRunes.map(rune => (
                        <RuneCard key={rune.id} rune={rune} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <Gem className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Không tìm thấy ngọc nào</p>
                </div>
            )}
        </div>
    );
}