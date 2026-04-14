import { Search, X } from 'lucide-react';
import { useState, useCallback, useRef } from 'react';

export default function SearchBar({ onSearch, placeholder = "Tìm kiếm..." }) {
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);

    const handleChange = useCallback((e) => {
        const value = e.target.value;
        setQuery(value);
        onSearch(value);
    }, [onSearch]);

    const handleClear = () => {
        setQuery('');
        onSearch('');
        inputRef.current?.focus();
    };

    return (
        <div className="relative">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleChange}
                placeholder={placeholder}
                aria-label={placeholder}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-gaming-500 transition-colors"
            />
            {query && (
                <button
                    onClick={handleClear}
                    aria-label="Xóa tìm kiếm"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gaming-500 transition-colors"
                >
                    <X className="w-4 h-4" aria-hidden="true" />
                </button>
            )}
        </div>
    );
}