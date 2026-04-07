import { useState, useEffect } from 'react';
import { spellService } from '../services/spellService';
import SpellCard from '../components/Cards/SpellCard';
import SearchBar from '../components/Common/SearchBar';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import { Wand2 } from 'lucide-react';

export default function Spells() {
    const [spells, setSpells] = useState([]);
    const [filteredSpells, setFilteredSpells] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchSpells = async () => {
            try {
                setLoading(true);
                const response = await spellService.getAll({ limit: 100 });
                setSpells(response.data);
                setFilteredSpells(response.data);
                setError(null);
            } catch (err) {
                setError(err.message || 'Lỗi khi tải dữ liệu phép bổ trợ');
            } finally {
                setLoading(false);
            }
        };

        fetchSpells();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            setFilteredSpells(
                spells.filter(s =>
                    s.name?.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        } else {
            setFilteredSpells(spells);
        }
    }, [searchQuery, spells]);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Wand2 className="w-8 h-8 text-gaming-400" />
                    <h1 className="text-3xl font-bold text-white">Phép Bổ Trợ</h1>
                </div>
                <p className="text-slate-400">Khám phá {filteredSpells.length} phép bổ trợ ({spells.length} tổng cộng)</p>
            </div>

            <SearchBar
                onSearch={setSearchQuery}
                placeholder="Tìm kiếm phép bổ trợ..."
            />

            {filteredSpells.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSpells.map(spell => (
                        <SpellCard key={spell.id} spell={spell} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <Wand2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Không tìm thấy phép bổ trợ nào</p>
                </div>
            )}
        </div>
    );
}