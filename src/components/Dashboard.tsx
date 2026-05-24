import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  ArrowRight,
  Wallet,
  Activity
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Transaction, Category, TransactionType } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useLanguage } from '../context/LanguageContext';
import { formatVND } from '../lib/utils';

interface DashboardProps {
  transactions: Transaction[];
  categories: Category[];
}

export default function Dashboard({ transactions, categories }: DashboardProps) {
  const { t } = useLanguage();
  
  const income = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;

  const chartData = transactions
    .slice(0, 10)
    .reverse()
    .map(t => ({
      date: format(new Date(t.date), 'dd/MM'),
      amount: t.amount,
      type: t.type
    }));

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title={t('dash.totalBalance')} 
          value={balance} 
          icon={Wallet} 
          trend=""
          color="indigo" 
        />
        <StatCard 
          title={t('dash.income')} 
          value={income} 
          icon={TrendingUp} 
          trend="" 
          color="green" 
        />
        <StatCard 
          title={t('dash.expense')} 
          value={expense} 
          icon={TrendingDown} 
          trend="" 
          color="danger" 
        />
        <StatCard 
          title="Tỉ lệ tích lũy" 
          value={income > 0 ? (balance / income * 100) : 0} 
          icon={Plus} 
          suffix="%" 
          trend="Đạt mục tiêu"
          color="warning" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Chart */}
        <Card className="lg:col-span-2 bg-[#12161F] border-[#1E293B] rounded-xl overflow-hidden shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-[#1E293B]/50">
            <CardTitle className="text-sm font-semibold text-[#E2E8F0]">Dòng tiền hàng ngày</CardTitle>
            <span className="text-[10px] text-[#94A3B8] font-bold tracking-widest uppercase">{t('header.nowMonth')}</span>
          </CardHeader>
          <CardContent className="h-[300px] p-6 pt-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                   <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                     <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748B" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#64748B" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => formatVND(val)}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#12161F', borderColor: '#1E293B', borderRadius: '8px', fontSize: '11px' }}
                  itemStyle={{ color: '#6366F1' }}
                  formatter={(value) => [formatVND(Number(value)), 'Giao dịch']}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#6366F1" 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="bg-[#12161F] border-[#1E293B] rounded-xl overflow-hidden shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-[#1E293B]/50">
            <CardTitle className="text-sm font-semibold text-[#E2E8F0]">{t('dash.recentTransactions')}</CardTitle>
            <span className="text-[10px] text-[#64748B] font-mono italic">Real-time</span>
          </CardHeader>
          <CardContent className="p-6 flex-1 overflow-y-auto">
            <div className="space-y-4">
              {recentTransactions.map((tx) => {
                const category = categories.find(c => c.id === tx.categoryId);
                return (
                  <div key={tx.id} className="flex items-center justify-between py-1 group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[#94A3B8]">
                        <Activity className="w-4 h-4 text-[#6366F1]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[13px] text-[#E2E8F0] tracking-tight group-hover:text-white transition-colors truncate">{category?.name || 'Chưa phân loại'}</p>
                        <p className="text-[11px] text-[#64748B] truncate max-w-[150px]">
                          {tx.note || tx.placeName || 'Giao dịch'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold text-[13px] ${tx.type === TransactionType.INCOME ? 'text-[#10B981]' : 'text-zinc-300'}`}>
                        {tx.type === TransactionType.INCOME ? '+' : '-'}{formatVND(tx.amount)}
                      </p>
                      <p className="text-[10px] text-[#64748B] tracking-wider font-mono">{tx.date}</p>
                    </div>
                  </div>
                );
              })}
              {recentTransactions.length === 0 && (
                <div className="text-center py-10 text-[#475569]">
                  <p className="text-xs uppercase tracking-widest font-bold opacity-50">{t('dash.noTransactions')}</p>
                </div>
              )}
            </div>
          </CardContent>
          <div className="p-4 border-t border-[#1E293B]/50">
            <div className="text-[10px] text-[#64748B] uppercase tracking-[0.2em] font-bold text-center">
              MONEY FLOW SYSTEM
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color, suffix = "" }: any) {
  const isPercent = suffix === "%";
  return (
    <Card className="bg-[#12161F] border-[#1E293B] rounded-xl shadow-sm relative group hover:border-[#6366F1]/40 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] uppercase tracking-wider font-bold text-[#94A3B8]">{title}</p>
          <div className="p-1.5 bg-[#1E293B] rounded-lg border border-[#334155] group-hover:bg-[#1E293B]/80">
            <Icon className={`w-3.5 h-3.5 ${color === 'indigo' ? 'text-[#6366F1]' : color === 'green' ? 'text-[#10B981]' : color === 'danger' ? 'text-[#F43F5E]' : color === 'warning' ? 'text-[#F59E0B]' : 'text-zinc-400'}`} />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <p className="text-lg font-bold text-[#F8FAFC] tracking-tight font-mono">
            {isPercent ? `${value.toFixed(1)}%` : formatVND(value)}
          </p>
        </div>
        {trend && (
          <div className={`mt-2 flex items-center gap-1 text-[11px] font-semibold ${trend.includes('+') || trend.includes('Đạt') ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>
             <ArrowUpRight className="w-3 h-3 text-[#10B981]" />
             {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
