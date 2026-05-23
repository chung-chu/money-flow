/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  BarChart3, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  LayoutDashboard, 
  History, 
  PieChart, 
  Target, 
  Settings,
  Map as MapIcon,
  BrainCircuit,
  Bell,
  Search,
  Menu,
  X,
  FolderTree
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StorageService } from './services/storageService';
import { Transaction, Category, TransactionType } from './types';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';
import CategoryConfig from './components/CategoryConfig';
import Analytics from './components/Analytics';
import Budgets from './components/Budgets';
import Goals from './components/Goals';
import MapAnalysis from './components/MapAnalysis';
import { Toaster } from 'sonner';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: History },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'analytics', label: 'AI Analytics', icon: BrainCircuit },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'map', label: 'Spending Map', icon: MapIcon },
  ];

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#E2E8F0] font-sans selection:bg-[#6366F1]/30">
      <Toaster position="top-right" theme="dark" />
      
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-[#12161F] border-r border-[#1E293B] transition-all duration-300 z-50 ${isSidebarOpen ? 'w-[220px]' : 'w-20'}`}>
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
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-0 w-full">
          <button className="w-full flex items-center gap-3 px-6 py-2.5 text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1E293B]/50 transition-all text-sm font-medium">
            <Settings className="w-4 h-4" />
            {isSidebarOpen && <span>Settings</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'ml-[220px]' : 'ml-20'} min-h-screen flex flex-col`}>
        {/* Header */}
        <header className="h-16 border-b border-[#1E293B] flex items-center justify-between px-8 bg-[#0B0E14]/80 backdrop-blur sticky top-0 z-40">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B]" />
              <Input 
                placeholder="Search resources..." 
                className="pl-9 bg-[#1E293B] border-[#334155] w-48 h-9 text-xs focus:ring-[#6366F1]/20 text-[#E2E8F0]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
               <div className="bg-[#1E293B] px-3 py-1.5 rounded-md text-[11px] font-medium border border-[#334155] text-[#94A3B8]">
                {format(new Date(), 'MMMM yyyy')}
               </div>
               <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-bold leading-none h-9 px-4 rounded-md"
              >
                + New Entry
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
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
      </main>

      {/* Add Transaction Modal */}
      <TransactionForm 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        onSuccess={refreshData}
        categories={categories}
      />
    </div>
  );
}

