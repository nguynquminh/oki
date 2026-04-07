import { useState, useEffect } from 'react';
import { heroService } from '../services/heroService';
import HeroCard from '../components/Cards/HeroCard';
import HeroSkeleton from '../components/Common/HeroSkeleton';
import SearchBar from '../components/Common/SearchBar';
import ErrorMessage from '../components/Common/ErrorMessage';
import GlassButton from '../components/UI/GlassButton';
import { Users, Filter, SearchX } from 'lucide-react';

export default function Heroes() {
    const [heroes, setHeroes] = useState([]);
    const [filteredHeroes, setFilteredHeroes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [roles, setRoles] = useState([]);

    // Fetch heroes
    useEffect(() => {
        const fetchHeroes = async () => {
            try {
                setLoading(true);
                const response = await heroService.getAll({ limit: 100 });
                setHeroes(response.data);

                // Extract unique roles
                const uniqueRoles = [...new Set(response.data.map(h => h.role))].filter(Boolean);
                setRoles(uniqueRoles);

                setError(null);
            } catch (err) {
                setError(err.message || 'Lỗi khi tải dữ liệu tướng');
                setHeroes([]);
            } finally {
                setLoading(false);
            }
        };

        fetchHeroes();
    }, []);

    // Filter heroes
    useEffect(() => {
        let results = heroes;

        // Filter by search query
        if (searchQuery) {
            results = results.filter(h =>
                h.name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by role
        if (selectedRole) {
            results = results.filter(h => h.role === selectedRole);
        }

        setFilteredHeroes(results);
    }, [heroes, searchQuery, selectedRole]);

    const handleSearch = (query) => {
        setSearchQuery(query);
    };

    const handleRoleFilter = (role) => {
        setSelectedRole(role === selectedRole ? '' : role);
    };

    if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-gaming-400" />
                    <h1 className="text-3xl font-bold text-white">Danh Sách Tướng</h1>
                </div>
                <p className="text-slate-400">Khám phá {filteredHeroes.length} tướng ({heroes.length} tổng cộng)</p>
            </div>

            {/* Search and Filter */}
            <div className="space-y-4">
                <SearchBar
                    onSearch={handleSearch}
                    placeholder="Tìm kiếm tướng..."
                />

                {/* Role Filter */}
                <div className="glass rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Filter className="w-5 h-5 text-gaming-400" />
                        <span className="font-semibold text-white">Lọc theo vai trò:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {roles.map(role => (
                            <button
                                key={role}
                                onClick={() => handleRoleFilter(role)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${selectedRole === role
                                        ? 'bg-gaming-600 text-white shadow-lg shadow-gaming-600/20'
                                        : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Heroes Grid or Loading State */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, idx) => (
                        <HeroSkeleton key={idx} />
                    ))}
                </div>
            ) : filteredHeroes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredHeroes.map(hero => (
                        <HeroCard key={hero.id} hero={hero} />
                    ))}
                </div>
            ) : (
                <div className="glass-dark rounded-xl flex flex-col items-center justify-center py-16 px-4 text-center border-dashed border-2 border-slate-700/50">
                    <div className="w-20 h-20 bg-slate-800/80 rounded-full flex items-center justify-center mb-6 shadow-inner blur-[1px]">
                        <SearchX className="w-10 h-10 text-gaming-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Không tìm thấy "tướng"</h3>
                    <p className="text-slate-400 mb-6 max-w-md">
                        Chúng tôi không thể tìm thấy kết quả nào khớp với tìm kiếm của bạn. Hãy thử thay đổi từ khóa hoặc bộ lọc xem sao.
                    </p>
                    <GlassButton 
                        onClick={() => {
                            setSearchQuery('');
                            setSelectedRole('');
                        }}
                    >
                        Xóa Lọc & Tìm Lại
                    </GlassButton>
                </div>
            )}
        </div>
    );
}