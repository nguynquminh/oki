import { useState, useEffect } from 'react';
import { equipmentService } from '../services/equipmentService';
import EquipmentCard from '../components/Cards/EquipmentCard';
import SearchBar from '../components/Common/SearchBar';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import { Sword } from 'lucide-react';

export default function Equipments() {
    const [equipments, setEquipments] = useState([]);
    const [filteredEquipments, setFilteredEquipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchEquipments = async () => {
            try {
                setLoading(true);
                const response = await equipmentService.getAll({ limit: 100 });
                setEquipments(response.data);
                setFilteredEquipments(response.data);
                setError(null);
            } catch (err) {
                setError(err.message || 'Lỗi khi tải dữ liệu trang bị');
            } finally {
                setLoading(false);
            }
        };

        fetchEquipments();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            setFilteredEquipments(
                equipments.filter(e =>
                    e.name?.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        } else {
            setFilteredEquipments(equipments);
        }
    }, [searchQuery, equipments]);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Sword className="w-8 h-8 text-gaming-400" />
                    <h1 className="text-3xl font-bold text-white">Trang Bị</h1>
                </div>
                <p className="text-slate-400">Khám phá {filteredEquipments.length} trang bị ({equipments.length} tổng cộng)</p>
            </div>

            <SearchBar
                onSearch={setSearchQuery}
                placeholder="Tìm kiếm trang bị..."
            />

            {filteredEquipments.length > 0 ? (
                <div className="space-y-3">
                    {filteredEquipments.map(equipment => (
                        <EquipmentCard key={equipment.id} equipment={equipment} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <Sword className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Không tìm thấy trang bị nào</p>
                </div>
            )}
        </div>
    );
}