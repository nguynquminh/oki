import { Search } from 'lucide-react';
import { useState, useCallback } from 'react';

export default function SearchBar({ onSearch, placeholder = "Tìm kiếm..." }) {
    const [query, setQuery] = useState('');

    const handleChange = useCallback((e) => {
        const value = e.target.value;
        setQuery(value);
        onSearch(value);
    }, [onSearch]);

    const handleClear = () => {
        setQuery('');
        onSearch('');
    };

    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
                type="text"
                value={query}
                onChange={handleChange}
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-gaming-500 transition-colors"
            />
            {query && (
                <button
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                    ✕
                </button>
            )}
        </div>
    );
}