import { useState, useEffect } from 'react';
import { badgeService } from '../services/badgeService';
import BadgeCard from '../components/Cards/BadgeCard';
import SearchBar from '../components/Common/SearchBar';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import { Shield, Search } from 'lucide-react';

export default function Badges() {
    const [badges, setOBadges] = useState([]);
    const [filteredBadges, setFilteredBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchMode, setSearchMode] = useState('badge'); // 'badge' or 'skill'

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                setLoading(true);
                const response = await badgeService.getAll({ limit: 100 });
                setOBadges(response.data);
                setFilteredBadges(response.data);
                setError(null);
            } catch (err) {
                setError(err.message || 'Lỗi khi tải dữ liệu phù hiệu');
            } finally {
                setLoading(false);
            }
        };

        fetchBadges();
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredBadges(badges);
            return;
        }

        if (searchMode === 'badge') {
            setFilteredBadges(
                badges.filter(b =>
                    b.name?.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        } else {
            // Search by skill name
            setFilteredBadges(
                badges.filter(b => {
                    if (!b.groups) return false;
                    return b.groups.some(g =>
                        g.skills?.some(s =>
                            s.name?.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                    );
                })
            );
        }
    }, [searchQuery, badges, searchMode]);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Shield className="w-8 h-8 text-gaming-400" />
                    <h1 className="text-3xl font-bold text-white">Phù Hiệu</h1>
                </div>
                <p className="text-slate-400">Khám phá {filteredBadges.length} phù hiệu ({badges.length} tổng cộng)</p>
            </div>

            {/* Search Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setSearchMode('badge')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${searchMode === 'badge'
                            ? 'bg-gaming-600 text-white'
                            : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                        }`}
                >
                    Tìm Phù Hiệu
                </button>
                <button
                    onClick={() => setSearchMode('skill')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${searchMode === 'skill'
                            ? 'bg-gaming-600 text-white'
                            : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                        }`}
                >
                    Tìm Kỹ Năng
                </button>
            </div>

            <SearchBar
                onSearch={setSearchQuery}
                placeholder={searchMode === 'badge' ? 'Tìm phù hiệu...' : 'Tìm kỹ năng...'}
            />

            {filteredBadges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredBadges.map(badge => (
                        <BadgeCard key={badge.id} badge={badge} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Không tìm thấy {searchMode === 'badge' ? 'phù hiệu' : 'kỹ năng'} nào</p>
                </div>
            )}
        </div>
    );
}