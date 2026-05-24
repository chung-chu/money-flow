import React, { useState, useEffect } from 'react';
import { 
  PieChart, 
  ChevronRight,
  Info
} from 'lucide-react';
import { Transaction, Category, Budget, TransactionType } from '../types';
import { StorageService } from '../services/storageService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { formatVND } from '../lib/utils';

interface BudgetsProps {
  categories: Category[];
}

export default function Budgets({ categories }: BudgetsProps) {
  const { t } = useLanguage();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    setBudgets(StorageService.getBudgets());
    setTransactions(StorageService.getTransactions());
  }, []);

  const getExpensesForCategory = (catId: string) => {
    return transactions
      .filter(t => t.categoryId === catId && t.date.startsWith(currentMonth))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const setDemoBudget = (catId: string) => {
    const amount = prompt(t('budget.setLimit') + ':');
    if (amount) {
      const parsed = parseFloat(amount);
      if (isNaN(parsed) || parsed <= 0) {
        toast.error('Vui lòng nhập giá trị hợp lệ');
        return;
      }
      StorageService.setBudget({
        categoryId: catId,
        limitAmount: parsed,
        month: currentMonth,
        userId: 'demo'
      });
      setBudgets(StorageService.getBudgets());
      toast.success(t('settings.success'));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#12161F] border border-[#1E293B] rounded-lg flex items-center justify-center">
            <PieChart className="text-[#6366F1] w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-[#F8FAFC]">
            {t('budget.title')} &bull; {currentMonth}
          </h3>
        </div>
        <Button variant="outline" className="border-[#1E293B] bg-[#1E293B]/50 text-[#94A3B8] gap-2 hover:text-[#E2E8F0] hover:bg-[#1E293B]">
          <Info className="w-4 h-4" /> {t('budget.sub')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {categories.filter(c => c.type === TransactionType.EXPENSE).map((cat) => {
          const budget = budgets.find(b => b.categoryId === cat.id && b.month === currentMonth);
          const spent = getExpensesForCategory(cat.id);
          const percent = budget ? (spent / budget.limitAmount) * 100 : 0;
          const isOver = percent > 100;
          const status = percent > 100 ? 'critical' : percent > 75 ? 'warning' : 'good';

          return (
            <Card key={cat.id} className="bg-[#12161F] border-[#1E293B] overflow-hidden group hover:border-[#6366F1]/30 transition-all">
              <CardContent className="p-0">
                <div className="flex items-stretch h-full">
                  <div className="w-1.5" style={{ backgroundColor: cat.color }}></div>
                  <div className="flex-1 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-[#1E293B] flex items-center justify-center border border-[#334155] text-[#94A3B8] text-xs font-bold">
                          {cat.name[0]}
                        </div>
                        <h4 className="font-bold text-[#E2E8F0] tracking-tight">{cat.name}</h4>
                      </div>
                      <Badge variant="outline" className={`
                        px-2 py-0 text-[10px] font-bold tracking-widest
                        ${status === 'critical' ? 'border-[#F43F5E]/50 text-[#F43F5E] bg-[#F43F5E]/5' : 
                          status === 'warning' ? 'border-[#F59E0B]/50 text-[#F59E0B] bg-[#F59E0B]/5' : 
                          'border-[#10B981]/50 text-[#10B981] bg-[#10B981]/5'}
                      `}>
                        {status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest mb-1">{t('budget.spent')}</p>
                          <p className="text-xl font-bold font-mono tracking-tighter text-[#F8FAFC]}">{formatVND(spent)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest mb-1">{t('budget.limit')}</p>
                          <div className="text-sm font-semibold text-[#8e9cb0]">
                             {budget ? (
                               <span className="font-mono text-slate-100">{formatVND(budget.limitAmount)}</span>
                             ) : (
                               <Button variant="link" onClick={() => setDemoBudget(cat.id)} className="h-auto p-0 text-[#6366F1] font-bold uppercase tracking-widest text-[10px]">
                                 {t('budget.setLimit')}
                               </Button>
                             )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex justify-between text-[10px] font-extrabold uppercase tracking-widest">
                          <span className="text-[#475569] italic">Progress</span>
                          <span className={`${isOver ? 'text-[#F43F5E]' : 'text-[#94A3B8]'}`}>{percent.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#0B0E14] rounded-full overflow-hidden border border-[#1E293B]">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              isOver ? 'bg-[#F43F5E]' : 
                              status === 'warning' ? 'bg-[#F59E0B]' : 'bg-[#6366F1]'
                            }`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-[#1E293B]/50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-[#475569] italic font-medium uppercase tracking-tight">
                        {isOver ? t('budget.overDescription') : 'Ngân sách vẫn an toàn'}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => setDemoBudget(cat.id)} className="text-[10px] font-bold text-[#64748B] hover:text-[#6366F1] h-7 uppercase tracking-widest">
                        {t('budget.setLimit')} <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
