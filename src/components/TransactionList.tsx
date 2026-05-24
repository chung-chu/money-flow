import React, { useState } from 'react';
import { 
  Trash2, 
  Filter, 
  Download, 
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  SlidersHorizontal,
  MapPin
} from 'lucide-react';
import { Transaction, Category, TransactionType } from '../types';
import { StorageService } from '../services/storageService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { formatVND } from '../lib/utils';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  onRefresh: () => void;
}

export default function TransactionList({ transactions, categories, onRefresh }: TransactionListProps) {
  const { t } = useLanguage();
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Advanced filters state toggled by the Filter button
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [onlyWithGPS, setOnlyWithGPS] = useState(false);
  const [searchInNote, setSearchInNote] = useState('');

  // Pagination bounds
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filtered = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterCategory !== 'all' && t.categoryId !== filterCategory) return false;
    
    if (minAmount && t.amount < parseFloat(minAmount)) return false;
    if (maxAmount && t.amount > parseFloat(maxAmount)) return false;
    if (onlyWithGPS && !t.location) return false;
    
    if (searchInNote.trim()) {
      const searchLower = searchInNote.toLowerCase();
      const noteMatch = (t.note || '').toLowerCase().includes(searchLower);
      const placeMatch = (t.placeName || '').toLowerCase().includes(searchLower);
      if (!noteMatch && !placeMatch) return false;
    }
    return true;
  });

  // Paginated elements
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = (id: string) => {
    StorageService.deleteTransaction(id);
    toast.success(t('tx.deleted'));
    onRefresh();
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error('Không có giao dịch nào để xuất!');
      return;
    }

    const headers = ['Ngay', 'Loai', 'Danh Muc', 'So Tien', 'Dia Diem', 'Ghi Chu', 'Toa Do GPS'];
    const rows = filtered.map(tx => {
      const cat = categories.find(c => c.id === tx.categoryId);
      const parentCat = cat?.parentId ? categories.find(c => c.id === cat.parentId) : null;
      const catString = parentCat ? `${parentCat.name} - ${cat?.name}` : (cat?.name || 'Chua phan loai');
      const gpsString = tx.location ? `${tx.location.lat}; ${tx.location.lng}` : 'No GPS';
      return [
        tx.date,
        tx.type === TransactionType.INCOME ? 'THU' : 'CHI',
        `"${catString.replace(/"/g, '""')}"`,
        tx.amount,
        `"${(tx.placeName || '').replace(/"/g, '""')}"`,
        `"${(tx.note || '').replace(/"/g, '""')}"`,
        `"${gpsString}"`
      ];
    });

    const csvRows = [headers.join(','), ...rows.map(r => r.join(','))];
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MoneyFlow_GiaoDich_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Xuất file báo cáo CSV thành công!');
  };

  const toggleAdvancedFilters = () => {
    setShowAdvanced(!showAdvanced);
  };

  const clearFilters = () => {
    setFilterType('all');
    setFilterCategory('all');
    setMinAmount('');
    setMaxAmount('');
    setOnlyWithGPS(false);
    setSearchInNote('');
    setCurrentPage(1);
    toast.info('Đã hoàn tác bộ lọc');
  };

  return (
    <div className="space-y-6">
      {/* Filters Toolbar */}
      <div className="flex flex-col gap-4 p-4 bg-[#12161F] border border-[#1E293B] rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg overflow-hidden border border-[#1E293B] bg-[#0B0E14]">
              <button 
                onClick={() => { setFilterType('all'); setCurrentPage(1); }}
                className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${filterType === 'all' ? 'bg-[#1E293B] text-white' : 'text-[#64748B] hover:text-[#E2E8F0]'}`}
              >
                {t('tx.all')}
              </button>
              <button 
                onClick={() => { setFilterType(TransactionType.EXPENSE); setCurrentPage(1); }}
                className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${filterType === TransactionType.EXPENSE ? 'bg-[#1E293B] text-white' : 'text-[#64748B] hover:text-[#E2E8F0]'}`}
              >
                {t('tx.expenses')}
              </button>
              <button 
                onClick={() => { setFilterType(TransactionType.INCOME); setCurrentPage(1); }}
                className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${filterType === TransactionType.INCOME ? 'bg-[#1E293B] text-white' : 'text-[#64748B] hover:text-[#E2E8F0]'}`}
              >
                {t('tx.income')}
              </button>
            </div>

            <select 
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
              className="bg-[#1E0B0E14] bg-[#0b0e14] border border-[#1E293B] text-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#6366F1]/50 cursor-pointer h-[34px]"
            >
              <option value="all">{t('tx.allCategories')}</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleExportCSV}
              className="text-[#94A3B8] hover:text-white gap-1.5 font-bold text-[10px] uppercase tracking-wider h-9 hover:bg-[#1E293B]"
            >
              <Download className="w-3.5 h-3.5" /> {t('tx.export')}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleAdvancedFilters}
              className={`border-[#1E293B] font-bold text-[10px] uppercase tracking-wider h-9 px-3 ${showAdvanced ? 'bg-[#6366F1]/15 border-[#6366F1]/50 text-[#6366F1]' : 'bg-[#1E293B]/50 text-[#94A3B8]'}`}
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" /> {t('tx.filter')}
            </Button>
          </div>
        </div>

        {/* Collapsible Advanced Filters Section (Now Fully Functional as requested!) */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-[#1E293B] animate-fade-in">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-[#64748B]">Tìm ghi chú/Địa điểm</label>
              <Input 
                value={searchInNote}
                onChange={(e) => { setSearchInNote(e.target.value); setCurrentPage(1); }}
                placeholder={t('tx.searchPlaceholder')}
                className="bg-[#0B0E14] border-[#1E293B] h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-[#64748B]">Khoảng tiền thấp nhất (VNĐ)</label>
              <Input 
                type="number"
                value={minAmount}
                onChange={(e) => { setMinAmount(e.target.value); setCurrentPage(1); }}
                placeholder="Ví dụ: 20000"
                className="bg-[#0B0E14] border-[#1E293B] h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-[#64748B]">Khoảng tiền cao nhất (VNĐ)</label>
              <Input 
                type="number"
                value={maxAmount}
                onChange={(e) => { setMaxAmount(e.target.value); setCurrentPage(1); }}
                placeholder="Ví dụ: 1000000"
                className="bg-[#0B0E14] border-[#1E293B] h-8 text-xs font-mono"
              />
            </div>

            <div className="flex flex-col justify-end gap-2">
              <button 
                onClick={() => { setOnlyWithGPS(!onlyWithGPS); setCurrentPage(1); }}
                className={`w-full flex items-center justify-center gap-2 h-8 rounded-md text-xs font-bold transition-all border ${
                  onlyWithGPS 
                    ? 'bg-emerald-500/10 border-emerald-500/55 text-emerald-400' 
                    : 'bg-[#0B0E14] border-[#1E293B] text-[#94A3B8] hover:text-[#E2E8F0]'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" /> {onlyWithGPS ? 'Chỉ xem điểm có GPS' : 'Xem tất cả tọa độ'}
              </button>
              
              <button 
                onClick={clearFilters}
                className="text-center text-[10px] font-bold text-red-400 uppercase tracking-widest hover:text-red-300 py-1 transition-colors"
              >
                Đặt lại bộ lọc (Reset)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-[#12161F] border border-[#1E293B] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto border-b border-[#1E293B]/60">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#1E293B]/30">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-extrabold text-[#64748B]">{t('tx.date')}</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-extrabold text-[#64748B]">{t('tx.category')}</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-extrabold text-[#64748B]">{t('tx.note')}</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-extrabold text-[#64748B]">{t('tx.value')}</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-extrabold text-[#64748B] text-right">{t('tx.ops')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/50">
              {paginatedItems.map((tx) => {
                const category = categories.find(c => c.id === tx.categoryId);
                const parentCategory = category?.parentId ? categories.find(c => c.id === category.parentId) : null;
                const displayText = parentCategory ? `${parentCategory.name} › ${category?.name}` : (category?.name || 'Không có');
                return (
                  <tr key={tx.id} className="group hover:bg-[#1E293B]/20 transition-all">
                    <td className="px-6 py-4">
                      <span className="text-[13px] font-semibold text-[#E2E8F0] font-mono italic">
                        {tx.date}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="border-[#1E293B] bg-[#1E293B]/50 text-[#94A3B8] font-bold text-[10px] uppercase tracking-widest px-2 py-0">
                        {displayText}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 max-w-[250px]">
                      <div className="min-w-0">
                        <span className="text-[13px] text-[#94A3B8] truncate block font-medium">
                          {tx.note || '-'}
                        </span>
                        {tx.placeName && (
                          <span className="text-[10px] text-[#64748B] flex items-center gap-1 mt-0.5">
                            📍 {tx.placeName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[14px] font-bold italic tracking-tight font-mono ${tx.type === TransactionType.INCOME ? 'text-[#10B981]' : 'text-zinc-300'}`}>
                        {tx.type === TransactionType.INCOME ? '+' : '-'}{formatVND(tx.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(tx.id)} className="h-8 w-8 text-[#64748B] hover:text-[#F43F5E] hover:bg-[#F43F5E]/10">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-24 text-center text-[#475569]">
            <SlidersHorizontal className="w-10 h-10 mx-auto mb-4 opacity-5 max-w-full" />
            <p className="text-[11px] uppercase tracking-[0.3em] font-extrabold opacity-40">{t('tx.noEntries')}</p>
          </div>
        )}
      </div>

      {/* Pagination control */}
      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] text-[#475569] uppercase tracking-widest font-extrabold">
          {t('tx.batchUnits').replace('{count}', String(filtered.length))}
        </p>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="h-8 w-8 p-0 border-[#1E293B] bg-[#1E293B]/30 text-[#94A3B8]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pIdx = idx + 1;
              return (
                <Button 
                  key={pIdx}
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(pIdx)}
                  className={`h-8 min-w-8 font-bold text-[11px] ${currentPage === pIdx ? 'border-[#6366F1]/50 bg-[#6366F1]/10 text-[#6366F1]' : 'border-[#1E293B] bg-[#1E293B]/30 text-[#94A3B8]'}`}
                >
                  {pIdx}
                </Button>
              );
            })}
            
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="h-8 w-8 p-0 border-[#1E293B] bg-[#1E293B]/30 text-[#94A3B8]"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
