import React, { useState } from 'react';
import { 
  Trash2, 
  Filter, 
  Download, 
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { Transaction, Category, TransactionType } from '../types';
import { StorageService } from '../services/storageService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  onRefresh: () => void;
}

export default function TransactionList({ transactions, categories, onRefresh }: TransactionListProps) {
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const filtered = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterCategory !== 'all' && t.categoryId !== filterCategory) return false;
    return true;
  });

  const handleDelete = (id: string) => {
    StorageService.deleteTransaction(id);
    toast.success('Transaction deleted');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#12161F] border border-[#1E293B] rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg overflow-hidden border border-[#1E293B] bg-[#0B0E14]">
            <button 
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${filterType === 'all' ? 'bg-[#1E293B] text-white' : 'text-[#64748B] hover:text-[#E2E8F0]'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilterType(TransactionType.EXPENSE)}
              className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${filterType === TransactionType.EXPENSE ? 'bg-[#1E293B] text-white' : 'text-[#64748B] hover:text-[#E2E8F0]'}`}
            >
              Expenses
            </button>
            <button 
              onClick={() => setFilterType(TransactionType.INCOME)}
              className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${filterType === TransactionType.INCOME ? 'bg-[#1E293B] text-white' : 'text-[#64748B] hover:text-[#E2E8F0]'}`}
            >
              Income
            </button>
          </div>

          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-[#1E293B] border border-[#334155] text-[#E2E8F0] text-[11px] font-bold uppercase tracking-widest rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#6366F1]/50 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-[#94A3B8] hover:text-white gap-2 font-bold text-[10px] uppercase tracking-widest h-9">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button variant="outline" size="sm" className="border-[#1E293B] bg-[#1E293B]/50 text-[#94A3B8] font-bold text-[10px] uppercase tracking-widest h-9 px-4">
            <Filter className="w-3.5 h-3.5 mr-2" /> Filters
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#12161F] border border-[#1E293B] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#1E293B]/30">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-extrabold text-[#64748B]">Date</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-extrabold text-[#64748B]">Category</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-extrabold text-[#64748B]">Note</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-extrabold text-[#64748B]">Value</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-extrabold text-[#64748B] text-right">Ops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/50">
              {filtered.map((tx) => {
                const category = categories.find(c => c.id === tx.categoryId);
                const parentCategory = category?.parentId ? categories.find(c => c.id === category.parentId) : null;
                const displayText = parentCategory ? `${parentCategory.name} › ${category?.name}` : (category?.name || 'Unknown');
                return (
                  <tr key={tx.id} className="group hover:bg-[#1E293B]/20 transition-all">
                    <td className="px-6 py-4">
                      <span className="text-[13px] font-semibold text-[#E2E8F0] font-mono italic">
                        {format(new Date(tx.date), 'dd MMM, yyyy')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="border-[#1E293B] bg-[#1E293B]/50 text-[#94A3B8] font-bold text-[10px] uppercase tracking-widest px-2 py-0">
                        {displayText}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      <span className="text-[13px] text-[#94A3B8] truncate block font-medium">
                        {tx.note || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[14px] font-bold italic tracking-tight ${tx.type === TransactionType.INCOME ? 'text-[#10B981]' : 'text-[#F8FAFC]'}`}>
                        {tx.type === TransactionType.INCOME ? '+' : '-'}${tx.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(tx.id)} className="h-8 w-8 text-[#64748B] hover:text-[#F43F5E] hover:bg-[#F43F5E]/10">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748B] hover:bg-[#1E293B]">
                          <MoreVertical className="w-3.5 h-3.5" />
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
            <Search className="w-10 h-10 mx-auto mb-4 opacity-5" />
            <p className="text-[11px] uppercase tracking-[0.3em] font-extrabold opacity-40">No entries detected in sector</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] text-[#475569] uppercase tracking-widest font-extrabold">Batch Analysis: {filtered.length} units processed</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-[#1E293B] bg-[#1E293B]/30 text-[#94A3B8]">
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 min-w-8 border-[#6366F1]/50 bg-[#6366F1]/10 text-[#6366F1] font-bold text-[11px]">1</Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-[#1E293B] bg-[#1E293B]/30 text-[#94A3B8] font-bold text-[11px]">2</Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-[#1E293B] bg-[#1E293B]/30 text-[#94A3B8]">
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
