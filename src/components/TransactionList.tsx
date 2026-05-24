import React, { useState } from 'react';
import { 
  Trash2, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical, 
  SlidersHorizontal, 
  MapPin, 
  X 
} from 'lucide-react';
import { motion } from 'motion/react';
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
  userId?: string;
}

export default function TransactionList({ transactions, categories, onRefresh, userId = 'demo' }: TransactionListProps) {
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

  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; note?: string; date: string; place?: string } | null>(null);
  const [activeMenuTxId, setActiveMenuTxId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Filters Toolbar */}
      <div className="flex flex-col gap-4 p-4 bg-[#12161F] border border-[#1E293B] rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg overflow-hidden border border-[#1E293B] bg-[#0B0E14]">
              <button 
                onClick={() => { setFilterType('all'); setCurrentPage(1); }}
                className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${filterType === 'all' ? 'bg-[#1E293B] text-white' : 'text-[#64748B] hover:text-[#E2E8F0]'}`}
              >
                {t('tx.all')}
              </button>
              <button 
                onClick={() => { setFilterType(TransactionType.EXPENSE); setCurrentPage(1); }}
                className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${filterType === TransactionType.EXPENSE ? 'bg-[#1E293B] text-white' : 'text-[#64748B] hover:text-[#E2E8F0]'}`}
              >
                {t('tx.expenses')}
              </button>
              <button 
                onClick={() => { setFilterType(TransactionType.INCOME); setCurrentPage(1); }}
                className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${filterType === TransactionType.INCOME ? 'bg-[#1E293B] text-white' : 'text-[#64748B] hover:text-[#E2E8F0]'}`}
              >
                {t('tx.income')}
              </button>
            </div>

            <select 
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
              className="bg-[#0b0e14] border border-[#1E293B] text-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#6366F1]/50 cursor-pointer h-[34px]"
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

        {/* Collapsible Advanced Filters Section */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-[#1E293B] animate-fade-in">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-[#64748B]">Tìm ghi chú/Địa điểm</label>
              <Input 
                value={searchInNote}
                onChange={(e) => { setSearchInNote(e.target.value); setCurrentPage(1); }}
                placeholder={t('tx.searchPlaceholder')}
                className="bg-[#0B0E14] border-[#1E293B] h-8 text-xs text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-[#64748B]">Khoảng tiền thấp nhất (VNĐ)</label>
              <Input 
                type="number"
                value={minAmount}
                onChange={(e) => { setMinAmount(e.target.value); setCurrentPage(1); }}
                placeholder="Ví dụ: 20000"
                className="bg-[#0B0E14] border-[#1E293B] h-8 text-xs font-mono text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-[#64748B]">Khoảng tiền cao nhất (VNĐ)</label>
              <Input 
                type="number"
                value={maxAmount}
                onChange={(e) => { setMaxAmount(e.target.value); setCurrentPage(1); }}
                placeholder="Ví dụ: 1000000"
                className="bg-[#0B0E14] border-[#1E293B] h-8 text-xs font-mono text-zinc-100"
              />
            </div>

            <div className="flex flex-col justify-end gap-2">
              <button 
                onClick={() => { setOnlyWithGPS(!onlyWithGPS); setCurrentPage(1); }}
                className={`w-full flex items-center justify-center gap-2 h-8 rounded-md text-xs font-bold transition-all border cursor-pointer ${
                  onlyWithGPS 
                    ? 'bg-emerald-500/10 border-emerald-500/55 text-emerald-400' 
                    : 'bg-[#0B0E14] border-[#1E293B] text-[#94A3B8] hover:text-[#E2E8F0]'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" /> {onlyWithGPS ? 'Chỉ xem điểm có GPS' : 'Xem tất cả tọa độ'}
              </button>
              
              <button 
                onClick={clearFilters}
                className="text-center text-[10px] font-bold text-red-400 uppercase tracking-widest hover:text-red-300 py-1 transition-colors cursor-pointer"
              >
                Đặt lại bộ lọc (Reset)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- RESPONSIVE TRANSACTIONS RENDERER --- */}
      <div className="space-y-4">
        {/* DESKTOP TABLE VIEW (Visible on tablet/PC landscape) */}
        <div className="hidden md:block bg-[#12161F] border border-[#1E293B] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto border-b border-[#1E293B]/60">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1E293B] bg-[#1E293B]/30">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-extrabold text-[#64748B]">{t('tx.date')}</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-extrabold text-[#64748B]">{t('tx.category')}</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-extrabold text-[#64748B]">Ảnh Locket</th>
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
                      <td className="px-6 py-4">
                        {tx.locketImage ? (
                          <div 
                            onClick={() => setPreviewPhoto({ url: tx.locketImage!, note: tx.note, date: tx.date, place: tx.placeName })}
                            className="relative w-10 h-10 rounded border-2 border-amber-500/40 bg-zinc-900 cursor-zoom-in overflow-hidden transition-scale hover:scale-110 shadow"
                          >
                            <img src={tx.locketImage} alt="Locket Mini" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <span className="text-[10px] text-zinc-600 font-mono">-</span>
                        )}
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
                      <td className="px-6 py-4 text-right relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuTxId(activeMenuTxId === tx.id ? null : tx.id);
                          }}
                          className="p-2 text-[#64748B] hover:text-white hover:bg-[#1E293B]/60 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {activeMenuTxId === tx.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setActiveMenuTxId(null)}
                            />
                            <div className="absolute right-6 top-10 w-32 bg-[#12161F] border border-[#1E293B] rounded-lg shadow-2xl py-1.5 z-20 text-left animate-fade-in">
                              <button
                                onClick={() => {
                                  setActiveMenuTxId(null);
                                  toast.info("Tính năng chỉnh sửa thủ công đang phát triển. Bạn có thể sử dụng Trợ lý AI để sửa!");
                                }}
                                className="w-full px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-[#1E293B] flex items-center gap-2 cursor-pointer text-left"
                              >
                                ✏️ Sửa
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuTxId(null);
                                  if (window.confirm("Bạn có chắc chắn muốn xóa giao dịch này? Hành động này không thể hoàn tác.")) {
                                    handleDelete(tx.id);
                                  }
                                }}
                                className="w-full px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer text-left font-semibold border-t border-[#1E293B]/60"
                              >
                                <Trash2 className="w-3 h-3" /> Xóa
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* MOBILE & TABLET CARD VIEW (Fluid stacking, completely eradicating horizontal scrollbars) */}
        <div className="md:hidden space-y-3 overflow-hidden">
          {paginatedItems.map((tx) => {
            const category = categories.find(c => c.id === tx.categoryId);
            const parentCategory = category?.parentId ? categories.find(c => c.id === category.parentId) : null;
            const displayText = parentCategory ? `${parentCategory.name} › ${category?.name}` : (category?.name || 'Không có');
            return (
              <div key={tx.id} className="relative overflow-hidden rounded-xl bg-[#221014]">
                
                {/* Swipe Action Underlay on the right */}
                <div className="absolute top-0 right-0 bottom-0 w-[100px] bg-red-600 flex items-center justify-center rounded-r-xl">
                  <button 
                    onClick={() => {
                      if (window.confirm("Bạn có chắc chắn muốn xóa giao dịch này? Hành động này không thể hoàn tác.")) {
                        handleDelete(tx.id);
                      }
                    }}
                    className="w-full h-full text-white font-extrabold text-[10px] uppercase tracking-wider flex flex-col items-center justify-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                    <span>Xóa iOS</span>
                  </button>
                </div>

                {/* IOS Slideable card foreground */}
                <motion.div
                  drag="x"
                  dragConstraints={{ left: -100, right: 0 }}
                  dragElastic={{ left: 0.05, right: 0.15 }}
                  dragTransition={{ bounceStiffness: 600, bounceDamping: 25 }}
                  className="bg-[#12161F] border border-[#1E293B] rounded-xl p-4 space-y-3.5 shadow-sm relative z-10 cursor-grab active:cursor-grabbing select-none"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[11px] text-[#64748B] font-mono italic block">
                        {tx.date}
                      </span>
                      <Badge variant="outline" className="border-[#1E293B] bg-[#1E293B]/50 text-[#94A3B8] font-extrabold text-[9px] uppercase tracking-widest px-1.5 py-0">
                        {displayText}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 relative">
                      <span className={`text-[15px] font-extrabold italic font-mono ${tx.type === TransactionType.INCOME ? 'text-[#10B981]' : 'text-zinc-200'}`}>
                        {tx.type === TransactionType.INCOME ? '+' : '-'}{formatVND(tx.amount)}
                      </span>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuTxId(activeMenuTxId === tx.id ? null : tx.id);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-white rounded-md bg-zinc-950/40 border border-zinc-850 cursor-pointer"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {activeMenuTxId === tx.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setActiveMenuTxId(null)}
                          />
                          <div className="absolute right-0 top-8 w-32 bg-[#12161F] border border-[#1E293B] rounded-lg shadow-2xl py-1.5 z-20 text-left animate-fade-in">
                            <button
                              onClick={() => {
                                setActiveMenuTxId(null);
                                toast.info("Tính năng chỉnh sửa thủ công đang phát triển. Bạn có thể sử dụng Trợ lý AI để sửa!");
                              }}
                              className="w-full px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-[#1E293B] flex items-center gap-2 cursor-pointer text-left font-bold"
                            >
                              ✏️ Sửa
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuTxId(null);
                                if (window.confirm("Bạn có chắc chắn muốn xóa giao dịch này? Hành động này không thể hoàn tác.")) {
                                  handleDelete(tx.id);
                                }
                              }}
                              className="w-full px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer text-left font-bold border-t border-[#1E293B]/60"
                            >
                              <Trash2 className="w-3 h-3" /> Xóa
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 1:1 Polaroid aspect styled exactly like Locket app */}
                  {tx.locketImage && (
                    <div className="flex justify-center py-1 bg-zinc-950/20 rounded-lg border border-zinc-900/30">
                      <div 
                        onClick={() => setPreviewPhoto({ url: tx.locketImage!, note: tx.note, date: tx.date, place: tx.placeName })}
                        className="w-48 bg-zinc-900 p-2 border border-zinc-800 rounded shadow-xl flex flex-col items-center cursor-zoom-in"
                      >
                        <div className="relative w-full aspect-square overflow-hidden bg-black rounded">
                          <img src={tx.locketImage} alt="Locket moments" className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[7px] tracking-widest uppercase font-extrabold px-1 rounded">
                            Locket 1:1
                          </span>
                        </div>
                        <span className="text-[9px] text-[#64748B] font-mono italic mt-1.5 uppercase tracking-wider text-center w-full truncate">
                          {tx.note || 'Chi tiêu 1:1'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="text-zinc-400 text-xs font-semibold leading-relaxed space-y-1">
                    {tx.note && <p className="text-zinc-300">{tx.note}</p>}
                    {tx.placeName && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] text-[#64748B] bg-zinc-950/20 px-2 py-0.5 rounded border border-zinc-900/40">
                        📍 {tx.placeName}
                      </span>
                    )}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-24 text-center text-[#475569] bg-[#12161F] border border-[#1E293B] rounded-xl">
            <SlidersHorizontal className="w-10 h-10 mx-auto mb-4 opacity-5 max-w-full" />
            <p className="text-[11px] uppercase tracking-[0.3em] font-extrabold opacity-40">{t('tx.noEntries')}</p>
          </div>
        )}
      </div>

      {/* --- PREVIEW LOCKET MODAL OVERLAY --- */}
      {previewPhoto && (
        <div 
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in cursor-zoom-out"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[380px] bg-zinc-950 border border-zinc-900 hover:border-amber-500/30 p-4 rounded-3xl shadow-2xl flex flex-col items-center space-y-4"
          >
            {/* Closes the preview */}
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-3 right-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white p-1.5 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Central aspect of Polaroid */}
            <div className="w-full bg-zinc-900 p-2.5 rounded-2xl flex flex-col space-y-3 shadow-lg border border-zinc-800/80">
              <div className="aspect-square bg-black rounded-lg overflow-hidden relative shadow">
                <img src={previewPhoto.url} alt="Locket moment full zoom" className="w-full h-full object-cover" />
                <span className="absolute bottom-2 left-2 bg-black/75 text-amber-400 text-[8px] font-extrabold tracking-widest px-2 py-0.5 rounded-full uppercase">
                  ⚡ Locket OS 1:1
                </span>
              </div>
              <div className="space-y-1 pb-1">
                <span className="text-[10px] text-zinc-500 font-mono italic block">
                  Cơ quan: {previewPhoto.date}
                </span>
                {previewPhoto.place && (
                  <span className="text-[10px] text-[#6366F1] font-bold block">
                    📍 {previewPhoto.place}
                  </span>
                )}
                <p className="text-zinc-300 font-medium text-xs leading-relaxed">
                  {previewPhoto.note || "Ảnh chụp lưu niệm dòng tiền"}
                </p>
              </div>
            </div>
            
            <p className="text-[10px] tracking-widest text-zinc-600 uppercase font-bold">
              Chung Chu • MoneyFlow OS Photo
            </p>
          </div>
        </div>
      )}

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
