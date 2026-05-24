/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  BarChart3, 
  Plus, 
  LayoutDashboard, 
  History, 
  PieChart, 
  Target, 
  Settings,
  Map as MapIcon,
  BrainCircuit,
  Search,
  FolderTree,
  Menu,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StorageService } from './services/storageService';
import { Transaction, Category } from './types';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';
import CategoryConfig from './components/CategoryConfig';
import Analytics from './components/Analytics';
import Budgets from './components/Budgets';
import Goals from './components/Goals';
import MapAnalysis from './components/MapAnalysis';
import SettingsModal from './components/SettingsModal';
import AiChatbot from './components/AiChatbot';
import { Toaster } from 'sonner';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { useLanguage } from './context/LanguageContext';

export default function App() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMoreMenuMobile, setShowMoreMenuMobile] = useState(false);

  useEffect(() => {
    setTransactions(StorageService.getTransactions());
    setCategories(StorageService.getCategories());
    
    // Auto background sync with Supabase on mount
    StorageService.syncWithSupabase(() => {
      setTransactions(StorageService.getTransactions());
      setCategories(StorageService.getCategories());
    });
  }, []);

  const refreshData = () => {
    setTransactions(StorageService.getTransactions());
    setCategories(StorageService.getCategories());
  };

  const navItems = [
    { id: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
    { id: 'transactions', labelKey: 'nav.transactions', icon: History },
    { id: 'categories', labelKey: 'nav.categories', icon: FolderTree },
    { id: 'analytics', labelKey: 'nav.analytics', icon: BrainCircuit },
    { id: 'budgets', labelKey: 'nav.budgets', icon: PieChart },
    { id: 'goals', labelKey: 'nav.goals', icon: Target },
    { id: 'map', labelKey: 'nav.map', icon: MapIcon },
  ];

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#E2E8F0] font-sans selection:bg-[#6366F1]/30">
      <Toaster position="top-right" theme="dark" />
      
      {/* Sidebar (Tablet/Desktop only) */}
      <aside className={`hidden lg:block fixed top-0 left-0 h-full bg-[#12161F] border-r border-[#1E293B] transition-all duration-300 z-50 ${isSidebarOpen ? 'w-[220px]' : 'w-20'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#6366F1] rounded-lg flex items-center justify-center shadow-lg shadow-[#6366F1]/20">
            <BarChart3 className="text-white w-5 h-5" />
          </div>
          {isSidebarOpen && <h1 className="text-xl font-extrabold tracking-tighter text-[#6366F1]">MoneyFlow OS</h1>}
        </div>

        <nav className="mt-6 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-2.5 transition-all text-sm font-medium ${
                activeTab === item.id 
                ? 'text-white bg-[#1E293B] border-r-2 border-[#6366F1]' 
                : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1E293B]/50'
              }`}
            >
              <item.icon className={`w-4 h-4 flex-shrink-0 ${activeTab === item.id ? 'text-[#6366F1]' : ''}`} />
              {isSidebarOpen && <span>{t(item.labelKey)}</span>}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-0 w-full">
          <button 
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="w-full flex items-center gap-3 px-6 py-2.5 text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1E293B]/50 transition-all text-sm font-medium"
          >
            <Settings className="w-4 h-4" />
            {isSidebarOpen && <span>{t('nav.settings')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area (With flexible margins and bottom spacing for mobile tab bar) */}
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-[220px]' : 'lg:ml-20'} ml-0 min-h-screen flex flex-col pb-20 lg:pb-0`}>
        {/* Header (Stylized with adaptive padding and hidden extra elements on mobile) */}
        <header className="h-16 border-b border-[#1E293B] flex items-center justify-between px-4 sm:px-8 bg-[#0B0E14]/80 backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {/* Simple menu toggle button on desktop and a mobile-focused touch identity */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:flex p-1.5 hover:bg-[#1E293B] rounded text-zinc-400 hover:text-white transition-colors"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
              {t(navItems.find(i => i.id === activeTab)?.labelKey || '')}
            </h2>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative group hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B]" />
              <Input 
                placeholder={t('header.search')} 
                className="pl-9 bg-[#1E293B] border-[#334155] w-48 h-9 text-xs focus:ring-[#6366F1]/20 text-[#E2E8F0]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
               <div className="bg-[#1E293B] px-2.5 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-[11px] font-medium border border-[#334155] text-[#94A3B8] whitespace-nowrap">
                {format(new Date(), 'MMMM yyyy')}
               </div>
               <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-[#6366F1] hover:bg-[#4F46E5] text-white text-[11px] sm:text-xs font-bold leading-none h-9 px-3 sm:px-4 rounded-md shadow-lg shadow-[#6366F1]/10 shrink-0"
              >
                {t('header.newEntry')}
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area - Uses ergonomic fluid boundaries with custom sizing */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.18 }}
              className="max-w-[1400px] mx-auto"
            >
              {activeTab === 'dashboard' && <Dashboard transactions={transactions} categories={categories} />}
              {activeTab === 'transactions' && <TransactionList transactions={transactions} categories={categories} onRefresh={refreshData} />}
              {activeTab === 'categories' && <CategoryConfig categories={categories} onRefresh={refreshData} />}
              {activeTab === 'analytics' && <Analytics transactions={transactions} categories={categories} />}
              {activeTab === 'budgets' && <Budgets categories={categories} />}
              {activeTab === 'goals' && <Goals />}
              {activeTab === 'map' && <MapAnalysis transactions={transactions} categories={categories} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Design Credits - Chung Chu */}
        <footer className="mt-auto py-6 sm:py-8 text-center border-t border-[#1E293B]/20 text-[#475569] text-xs font-sans tracking-wide">
          <div className="max-w-[1400px] mx-auto px-4">
            <p className="flex items-center justify-center gap-1.5 uppercase tracking-[0.2em] font-semibold text-[10px] sm:text-xs">
              <span>DESIGNED BY</span>
              <span className="text-zinc-300 font-extrabold hover:text-[#6366F1] transition-colors tracking-[0.25em]">CHUNG CHU</span>
              <span className="text-[#6366F1] animate-pulse">❤️</span>
            </p>
            <p className="text-[9px] sm:text-[10px] mt-1.5 text-[#334155] font-mono whitespace-nowrap overflow-hidden text-ellipsis">
              MoneyFlow OS &bull; Ergonomic Mobile UI &bull; Alpha-v1.2
            </p>
          </div>
        </footer>
      </main>

      {/* Mobile/Tablet Bottom Navigation Bar (Ergonomic Touch Targets for Easy Thumb Control) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#12161F]/95 backdrop-blur-md border-t border-[#1E293B] z-40 flex items-center justify-around px-2 pb-safe shadow-2xl">
        {/* Trang chủ */}
        <button 
          onClick={() => { setActiveTab('dashboard'); setShowMoreMenuMobile(false); }}
          className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-all ${activeTab === 'dashboard' ? 'text-[#6366F1]' : 'text-[#8E9CB0]'}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1 tracking-tight">Tổng quan</span>
        </button>

        {/* Giao dịch */}
        <button 
          onClick={() => { setActiveTab('transactions'); setShowMoreMenuMobile(false); }}
          className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-all ${activeTab === 'transactions' ? 'text-[#6366F1]' : 'text-[#8E9CB0]'}`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1 tracking-tight">Giao dịch</span>
        </button>

        {/* Floating Add Transaction FAB in Center for Immediate Touch Access */}
        <div className="flex-1 flex justify-center sticky select-none">
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-12 h-12 bg-[#6366F1] active:bg-[#4F46E5] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#6366F1]/30 border-4 border-[#0B0E14] -translate-y-4 transition-transform active:scale-90"
            style={{ touchAction: 'manipulation' }}
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Phân tích AI */}
        <button 
          onClick={() => { setActiveTab('analytics'); setShowMoreMenuMobile(false); }}
          className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-all ${activeTab === 'analytics' ? 'text-[#6366F1]' : 'text-[#8E9CB0]'}`}
        >
          <BrainCircuit className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1 tracking-tight">AI Report</span>
        </button>

        {/* Mở rộng (More) triggers ergonomic slide-up drawer */}
        <button 
          onClick={() => setShowMoreMenuMobile(!showMoreMenuMobile)}
          className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-all ${showMoreMenuMobile || ['categories', 'budgets', 'goals', 'map'].includes(activeTab) ? 'text-[#6366F1]' : 'text-[#8E9CB0]'}`}
        >
          <MoreVertical className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1 tracking-tight">Tiện ích</span>
        </button>
      </div>

      {/* Mobile/Tablet More-Menu Drawer Sliding Sheet */}
      <AnimatePresence>
        {showMoreMenuMobile && (
          <>
            {/* Backdrop Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMoreMenuMobile(false)}
              className="lg:hidden fixed inset-0 bg-black z-50 cursor-pointer"
            />
            {/* Drawer Body - Layout optimized for thumb tapping at bottom of screen */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 210 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#12161F] border-t border-[#1E293B] rounded-t-3xl z-50 px-6 pt-5 pb-10 shadow-3xl space-y-6"
            >
              {/* Top Notch for standard iOS indicator */}
              <div className="w-12 h-1 bg-[#1E293B] rounded-full mx-auto cursor-pointer" onClick={() => setShowMoreMenuMobile(false)} />
              
              <div className="flex items-center justify-between border-b border-[#1E293B]/60 pb-3">
                <h3 className="text-xs font-extrabold tracking-widest uppercase text-[#94A3B8]">Công cụ & Tiện ích</h3>
                <button 
                  onClick={() => setShowMoreMenuMobile(false)} 
                  className="text-xs font-bold text-[#6366F1] uppercase tracking-wider"
                >
                  Xong
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button 
                  onClick={() => { setActiveTab('categories'); setShowMoreMenuMobile(false); }}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${activeTab === 'categories' ? 'border-[#6366F1] bg-[#6366F1]/10 text-white' : 'border-[#1E293B] bg-[#0B0E14] text-[#94A3B8]'}`}
                >
                  <FolderTree className="w-5 h-5 mb-2 text-[#6366F1]" />
                  <span className="text-xs font-bold text-center tracking-tight">{t('nav.categories')}</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('budgets'); setShowMoreMenuMobile(false); }}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${activeTab === 'budgets' ? 'border-[#6366F1] bg-[#6366F1]/10 text-white' : 'border-[#1E293B] bg-[#0B0E14] text-[#94A3B8]'}`}
                >
                  <PieChart className="w-5 h-5 mb-2 text-rose-500" />
                  <span className="text-xs font-bold text-center tracking-tight">{t('nav.budgets')}</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('goals'); setShowMoreMenuMobile(false); }}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${activeTab === 'goals' ? 'border-[#6366F1] bg-[#6366F1]/10 text-white' : 'border-[#1E293B] bg-[#0B0E14] text-[#94A3B8]'}`}
                >
                  <Target className="w-5 h-5 mb-2 text-emerald-500" />
                  <span className="text-xs font-bold text-center tracking-tight">{t('nav.goals')}</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('map'); setShowMoreMenuMobile(false); }}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${activeTab === 'map' ? 'border-[#6366F1] bg-[#6366F1]/10 text-white' : 'border-[#1E293B] bg-[#0B0E14] text-[#94A3B8]'}`}
                >
                  <MapIcon className="w-5 h-5 mb-2 text-amber-500" />
                  <span className="text-xs font-bold text-center tracking-tight">{t('nav.map')}</span>
                </button>

                {/* Settings available instantly from drawer grid */}
                <button 
                  onClick={() => { setShowSettingsModal(true); setShowMoreMenuMobile(false); }}
                  className="col-span-2 flex items-center justify-center gap-2 p-4 rounded-xl border border-[#1E293B] bg-[#0B0E14] text-[#94A3B8]"
                >
                  <Settings className="w-5 h-5 text-zinc-400" />
                  <span className="text-xs font-bold tracking-tight">{t('nav.settings')}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Transaction Modal */}
      <TransactionForm 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        onSuccess={refreshData}
        categories={categories}
      />

      {/* Settings Modal (Now Active and Fully functional!) */}
      <SettingsModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* Floating AI Chatbot Assistant */}
      <AiChatbot 
        transactions={transactions} 
        categories={categories} 
      />
    </div>
  );
}
