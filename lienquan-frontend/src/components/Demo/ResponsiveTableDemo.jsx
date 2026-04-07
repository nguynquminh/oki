import { useState } from 'react';
import { Search, Filter, MoreVertical, CheckCircle2, Clock, XCircle } from 'lucide-react';
import GlassButton from '../UI/GlassButton';

// Mock Data
const MOCK_DATA = [
    { id: 'TRX-1029', user: 'Nguyễn Văn A', amount: '2,500,000 đ', status: 'completed', date: '2026-03-31', method: 'Momo' },
    { id: 'TRX-1030', user: 'Trần Thị B', amount: '500,000 đ', status: 'pending', date: '2026-03-31', method: 'ZaloPay' },
    { id: 'TRX-1031', user: 'Lê Hoàng C', amount: '1,200,000 đ', status: 'failed', date: '2026-03-30', method: 'Chuyển khoản' },
    { id: 'TRX-1032', user: 'Phạm Minh D', amount: '8,900,000 đ', status: 'completed', date: '2026-03-30', method: 'Visa' },
    { id: 'TRX-1033', user: 'Vũ Thị E', amount: '150,000 đ', status: 'completed', date: '2026-03-29', method: 'Momo' },
];

export default function ResponsiveTableDemo() {
    const [search, setSearch] = useState('');

    const filteredData = MOCK_DATA.filter(item => 
        item.user.toLowerCase().includes(search.toLowerCase()) || 
        item.id.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusIcon = (status) => {
        switch(status) {
            case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
            case 'pending': return <Clock className="w-4 h-4 text-accent-gold" />;
            case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
            default: return null;
        }
    };

    const getStatusText = (status) => {
        switch(status) {
            case 'completed': return <span className="text-emerald-400 font-medium">Thành công</span>;
            case 'pending': return <span className="text-accent-gold font-medium">Đang xử lý</span>;
            case 'failed': return <span className="text-red-400 font-medium">Thất bại</span>;
            default: return status;
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Quản lý giao dịch</h1>
                    <p className="text-slate-400">Demo kỹ thuật Responsive Table to Card bằng Tailwind CSS</p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm mã hoặc tên..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg pl-9 pr-4 py-2 text-white focus:outline-none focus:border-gaming-500 transition-colors"
                        />
                    </div>
                    <GlassButton variant="secondary" className="px-3">
                        <Filter className="w-5 h-5" />
                    </GlassButton>
                </div>
            </div>

            {/* Responsive Table / Card View */}
            <div className="glass rounded-xl overflow-hidden shadow-2xl shadow-gaming-500/10 border-slate-700/50">
                {/* Desktop Table (Hidden on Mobile: md:block) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/50 border-b border-slate-700/50 text-slate-400 text-sm uppercase tracking-wider">
                                <th className="p-4 font-semibold">Mã GD</th>
                                <th className="p-4 font-semibold">Người dùng</th>
                                <th className="p-4 font-semibold text-right">Số tiền</th>
                                <th className="p-4 font-semibold text-center">Trạng thái</th>
                                <th className="p-4 font-semibold">Phương thức</th>
                                <th className="p-4 font-semibold">Ngày lập</th>
                                <th className="p-4 font-semibold text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {filteredData.map(row => (
                                <tr key={row.id} className="hover:bg-slate-700/30 transition-colors group">
                                    <td className="p-4 font-medium text-white">{row.id}</td>
                                    <td className="p-4 text-slate-300 font-medium">{row.user}</td>
                                    <td className="p-4 font-bold text-white text-right">{row.amount}</td>
                                    <td className="p-4">
                                        <div className="mx-auto flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/50 w-fit border border-slate-700/50 shadow-inner">
                                            {getStatusIcon(row.status)}
                                            <span className="text-xs">{getStatusText(row.status)}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-400">{row.method}</td>
                                    <td className="p-4 text-slate-400">{row.date}</td>
                                    <td className="p-4 text-right">
                                        <button className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors group-hover:bg-slate-600/50">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-400 text-lg">
                                        Không tìm thấy dữ liệu khớp lệnh xoá
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards View (Hidden on Desktop: md:hidden) */}
                <div className="md:hidden flex flex-col divide-y divide-slate-700/50">
                    {filteredData.map(row => (
                        <div key={row.id} className="p-5 space-y-4 hover:bg-slate-800/20 transition-colors">
                            {/* Card Header */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-xs font-semibold tracking-wider text-gaming-400 mb-1">{row.id}</div>
                                    <div className="font-bold text-white text-xl">{row.user}</div>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/50 shadow-inner">
                                    {getStatusIcon(row.status)}
                                    <span className="text-xs font-semibold">{getStatusText(row.status)}</span>
                                </div>
                            </div>
                            
                            {/* Card Body - Key Value Grid */}
                            <div className="grid grid-cols-2 gap-y-3 text-sm bg-slate-900/40 rounded-xl p-4 border border-slate-800/80 shadow-inner">
                                <div className="text-slate-400">Số tiền</div>
                                <div className="text-right font-bold text-white text-base">{row.amount}</div>
                                
                                <div className="text-slate-400">Phương thức</div>
                                <div className="text-right font-medium text-slate-300">{row.method}</div>
                                
                                <div className="text-slate-400">Ngày lập</div>
                                <div className="text-right text-slate-400">{row.date}</div>
                            </div>
                            
                            {/* Card Action */}
                            <button className="w-full flex items-center justify-center py-2.5 text-sm font-semibold text-slate-200 bg-slate-700/30 hover:bg-slate-700/60 rounded-lg transition-colors border border-slate-600/50">
                                Xem chi tiết
                            </button>
                        </div>
                    ))}
                    {filteredData.length === 0 && (
                        <div className="p-12 text-center text-slate-400">
                            Không tìm thấy dữ liệu lọc
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
