import { Transaction, Category, Budget, Goal, TransactionType } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { safeStringify } from '../lib/utils';

const STORAGE_KEYS = {
  TRANSACTIONS: 'moneyflow_transactions',
  CATEGORIES: 'moneyflow_categories',
  BUDGETS: 'moneyflow_budgets',
  GOALS: 'moneyflow_goals',
};

const DEFAULT_CATEGORIES: Category[] = [
  // Primary Categories (Expense)
  { id: '1', name: 'Ăn uống', icon: 'Utensils', color: '#f87171', type: TransactionType.EXPENSE, userId: 'demo' },
  { id: '2', name: 'Nhà ở', icon: 'Home', color: '#6366f1', type: TransactionType.EXPENSE, userId: 'demo' },
  { id: '3', name: 'Đi lại', icon: 'Car', color: '#fb923c', type: TransactionType.EXPENSE, userId: 'demo' },
  { id: '4', name: 'Mua sắm', icon: 'ShoppingBag', color: '#fbbf24', type: TransactionType.EXPENSE, userId: 'demo' },
  // Primary Categories (Income)
  { id: '5', name: 'Thu nhập', icon: 'Wallet', color: '#4ade80', type: TransactionType.INCOME, userId: 'demo' },

  // Subcategories for Food (parentId: '1')
  { id: '1-1', name: 'Ăn', icon: 'Utensils', color: '#f87171', type: TransactionType.EXPENSE, userId: 'demo', parentId: '1' },
  { id: '1-2', name: 'Uống (Cà phê, trà...)', icon: 'CupSoda', color: '#f87171', type: TransactionType.EXPENSE, userId: 'demo', parentId: '1' },
  { id: '1-3', name: 'Ăn nhậu / Tiệc tùng', icon: 'GlassWater', color: '#f87171', type: TransactionType.EXPENSE, userId: 'demo', parentId: '1' },
  { id: '1-4', name: 'Khác (Ăn uống)', icon: 'Utensils', color: '#f87171', type: TransactionType.EXPENSE, userId: 'demo', parentId: '1' },

  // Subcategories for Housing (parentId: '2')
  { id: '2-1', name: 'Phí nhà trọ / Tiền nhà', icon: 'Home', color: '#6366f1', type: TransactionType.EXPENSE, userId: 'demo', parentId: '2' },
  { id: '2-2', name: 'Điện nước & Tiện ích', icon: 'Zap', color: '#6366f1', type: TransactionType.EXPENSE, userId: 'demo', parentId: '2' },
  { id: '2-3', name: 'Khác (Nhà ở)', icon: 'Home', color: '#6366f1', type: TransactionType.EXPENSE, userId: 'demo', parentId: '2' },

  // Subcategories for Transport (parentId: '3')
  { id: '3-1', name: 'Xăng xe', icon: 'Fuel', color: '#fb923c', type: TransactionType.EXPENSE, userId: 'demo', parentId: '3' },
  { id: '3-2', name: 'Đặt xe (Grab / Taxi)', icon: 'Car', color: '#fb923c', type: TransactionType.EXPENSE, userId: 'demo', parentId: '3' },

  // Subcategories for Income (parentId: '5')
  { id: '5-1', name: 'Lương cố định', icon: 'Briefcase', color: '#4ade80', type: TransactionType.INCOME, userId: 'demo', parentId: '5' },
  { id: '5-2', name: 'Làm thêm / Freelance', icon: 'Laptop', color: '#4ade80', type: TransactionType.INCOME, userId: 'demo', parentId: '5' },
];

export class StorageService {
  private static get<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private static set<T>(key: string, data: T[]): void {
    localStorage.setItem(key, safeStringify(data));
  }

  // --- Background Sync with Supabase ---
  static async syncWithSupabase(onSyncComplete?: () => void): Promise<void> {
    if (!isSupabaseConfigured) return;

    try {
      console.log('🔄 Syncing with Supabase...');

      // 1. Fetch Categories
      const { data: catData, error: catErr } = await supabase
        .from('categories')
        .select('*');
      
      if (!catErr && catData) {
        const categories: Category[] = catData.map(c => ({
          id: c.id,
          name: c.name,
          icon: c.icon || '',
          color: c.color || '',
          type: c.type as TransactionType,
          userId: c.user_id || 'demo',
          parentId: c.parent_id || undefined
        }));
        if (categories.length > 0) {
          this.set(STORAGE_KEYS.CATEGORIES, categories);
        }
      }

      // 2. Fetch Transactions
      const { data: txData, error: txErr } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (!txErr && txData) {
        const transactions: Transaction[] = txData.map(t => ({
          id: t.id,
          amount: Number(t.amount),
          type: t.type as TransactionType,
          categoryId: t.category_id,
          date: t.date,
          note: t.note || '',
          placeName: t.place_name || '',
          location: t.location || undefined,
          userId: t.user_id || 'demo',
          createdAt: t.created_at
        }));
        this.set(STORAGE_KEYS.TRANSACTIONS, transactions);
      }

      // 3. Fetch Budgets
      const { data: budgetData, error: budgetErr } = await supabase
        .from('budgets')
        .select('*');

      if (!budgetErr && budgetData) {
        const budgets: Budget[] = budgetData.map(b => ({
          id: b.id,
          categoryId: b.category_id,
          limitAmount: Number(b.limit_amount),
          month: b.month,
          userId: b.user_id || 'demo'
        }));
        this.set(STORAGE_KEYS.BUDGETS, budgets);
      }

      // 4. Fetch Goals
      const { data: goalData, error: goalErr } = await supabase
        .from('goals')
        .select('*');

      if (!goalErr && goalData) {
        const goals: Goal[] = goalData.map(g => ({
          id: g.id,
          name: g.name,
          targetAmount: Number(g.target_amount),
          currentAmount: Number(g.current_amount),
          deadline: g.deadline,
          userId: g.user_id || 'demo'
        }));
        this.set(STORAGE_KEYS.GOALS, goals);
      }

      console.log('✅ Supabase sync complete.');
      if (onSyncComplete) onSyncComplete();
    } catch (e) {
      console.error('❌ Failed to sync with Supabase:', e);
    }
  }

  // Transactions
  static getTransactions(userId?: string): Transaction[] {
    const transactions = this.get<Transaction>(STORAGE_KEYS.TRANSACTIONS);
    const activeUserId = userId || 'demo';
    const userTx = transactions.filter(t => t.userId === activeUserId);
    
    if (userTx.length === 0 && activeUserId === 'demo') {
      // Seed default transactions with nested Category IDs
      const demoData: Transaction[] = [
        { id: 't1', amount: 45000000, type: TransactionType.INCOME, categoryId: '5-1', date: new Date().toISOString().split('T')[0], note: 'Monthly Salary (Lương cứng)', userId: 'demo', createdAt: new Date().toISOString() },
        { id: 't2', amount: 150000, type: TransactionType.EXPENSE, categoryId: '1-2', date: new Date().toISOString().split('T')[0], note: 'Cà phê Highlands', placeName: 'Highlands Coffee', location: { lat: 10.762622, lng: 106.660172 }, userId: 'demo', createdAt: new Date().toISOString() },
        { id: 't3', amount: 50000, type: TransactionType.EXPENSE, categoryId: '3-2', date: new Date().toISOString().split('T')[0], note: 'Grab Bike đi họp', userId: 'demo', createdAt: new Date().toISOString() },
        { id: 't4', amount: 1200000, type: TransactionType.EXPENSE, categoryId: '1-1', date: new Date().toISOString().split('T')[0], note: 'Tiền đi chợ nấu ăn', placeName: 'WinMart', location: { lat: 10.772622, lng: 106.670172 }, userId: 'demo', createdAt: new Date().toISOString() },
        { id: 't5', amount: 3500000, type: TransactionType.EXPENSE, categoryId: '2-1', date: new Date().toISOString().split('T')[0], note: 'Thanh toán tiền nhà tháng này', userId: 'demo', createdAt: new Date().toISOString() },
      ];
      this.set(STORAGE_KEYS.TRANSACTIONS, demoData);
      
      // Seed up to Supabase if configured
      if (isSupabaseConfigured) {
        demoData.forEach(tx => this.pushTransactionToSupabase(tx));
      }
      return demoData;
    } else if (userTx.length === 0) {
      // If a real user is empty, seed 2 startup templates
      const userCategories = this.getCategories(activeUserId);
      const foodCat = userCategories.find(c => c.name.includes('Ăn') || c.id.includes('1-1'));
      const incomeCat = userCategories.find(c => c.name.includes('Thu') || c.id.includes('5-1'));
      const startupTx: Transaction[] = [
        { 
          id: `${activeUserId}_t1`, 
          amount: 20000000, 
          type: TransactionType.INCOME, 
          categoryId: incomeCat?.id || '5-1', 
          date: new Date().toISOString().split('T')[0], 
          note: 'Lương khởi điểm nhận bằng ví vạn năng 💼', 
          userId: activeUserId, 
          createdAt: new Date().toISOString() 
        },
        { 
          id: `${activeUserId}_t2`, 
          amount: 65000, 
          type: TransactionType.EXPENSE, 
          categoryId: foodCat?.id || '1-1', 
          date: new Date().toISOString().split('T')[0], 
          note: 'Ăn sáng phở bò tái chín 🍜', 
          userId: activeUserId, 
          createdAt: new Date().toISOString() 
        }
      ];
      const allTx = [...transactions, ...startupTx];
      this.set(STORAGE_KEYS.TRANSACTIONS, allTx);
      return startupTx;
    }
    return userTx;
  }

  private static pushTransactionToSupabase(tx: Transaction): void {
    supabase.from('transactions').upsert({
      id: tx.id,
      amount: tx.amount,
      type: tx.type,
      category_id: tx.categoryId,
      date: tx.date,
      note: tx.note || null,
      place_name: tx.placeName || null,
      location: tx.location || null,
      user_id: tx.userId || 'demo',
      created_at: tx.createdAt
    }).then(({ error }) => {
      if (error) console.error('Error syncing transaction to Supabase:', error);
    });
  }

  static addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
    const transactions = this.get<Transaction>(STORAGE_KEYS.TRANSACTIONS);
    const newTx: Transaction = {
      ...tx,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date().toISOString(),
    };
    this.set(STORAGE_KEYS.TRANSACTIONS, [newTx, ...transactions]);

    if (isSupabaseConfigured) {
      this.pushTransactionToSupabase(newTx);
    }
    return newTx;
  }

  static deleteTransaction(id: string): void {
    const transactions = this.get<Transaction>(STORAGE_KEYS.TRANSACTIONS).filter(t => t.id !== id);
    this.set(STORAGE_KEYS.TRANSACTIONS, transactions);

    if (isSupabaseConfigured) {
      supabase.from('transactions').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Error deleting transaction from Supabase:', error);
      });
    }
  }

  // Categories
  static getCategories(userId?: string): Category[] {
    const categories = this.get<Category>(STORAGE_KEYS.CATEGORIES);
    const activeUserId = userId || 'demo';
    const userCat = categories.filter(c => c.userId === activeUserId);
    
    if (userCat.length === 0) {
      // Seed categories customized for this user
      const seeded = DEFAULT_CATEGORIES.map(c => ({
        ...c,
        id: activeUserId === 'demo' ? c.id : `${activeUserId}_${c.id}`,
        userId: activeUserId,
        parentId: c.parentId ? (activeUserId === 'demo' ? c.parentId : `${activeUserId}_${c.parentId}`) : undefined
      }));
      const updatedCategories = [...categories, ...seeded];
      this.set(STORAGE_KEYS.CATEGORIES, updatedCategories);
      return seeded;
    }
    return userCat;
  }

  static addCategory(cat: Omit<Category, 'id'>): Category {
    const categories = this.get<Category>(STORAGE_KEYS.CATEGORIES);
    const newCat: Category = {
      ...cat,
      id: Math.random().toString(36).substring(7),
    };
    this.set(STORAGE_KEYS.CATEGORIES, [...categories, newCat]);

    if (isSupabaseConfigured) {
      supabase.from('categories').upsert({
        id: newCat.id,
        name: newCat.name,
        icon: newCat.icon,
        color: newCat.color,
        type: newCat.type,
        parent_id: newCat.parentId || null,
        user_id: newCat.userId
      }).then(({ error }) => {
        if (error) console.error('Error uploading category to Supabase:', error);
      });
    }
    return newCat;
  }

  static deleteCategory(id: string, userId?: string): void {
    const activeUserId = userId || 'demo';
    const categories = this.get<Category>(STORAGE_KEYS.CATEGORIES).filter(c => 
      !(c.id === id && c.userId === activeUserId) && 
      !(c.parentId === id && c.userId === activeUserId)
    );
    this.set(STORAGE_KEYS.CATEGORIES, categories);

    if (isSupabaseConfigured) {
      supabase.from('categories').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Error deleting category from Supabase:', error);
      });
    }
  }

  // Budgets
  static getBudgets(userId?: string): Budget[] {
    const budgets = this.get<Budget>(STORAGE_KEYS.BUDGETS);
    const activeUserId = userId || 'demo';
    return budgets.filter(b => b.userId === activeUserId);
  }

  static setBudget(budget: Omit<Budget, 'id'>): Budget {
    const budgets = this.get<Budget>(STORAGE_KEYS.BUDGETS);
    const existingIndex = budgets.findIndex(b => b.categoryId === budget.categoryId && b.month === budget.month && b.userId === budget.userId);
    let resolvedBudget: Budget;

    if (existingIndex > -1) {
      budgets[existingIndex] = { ...budgets[existingIndex], limitAmount: budget.limitAmount };
      this.set(STORAGE_KEYS.BUDGETS, budgets);
      resolvedBudget = budgets[existingIndex];
    } else {
      const newBudget: Budget = {
        ...budget,
        id: Math.random().toString(36).substring(7),
      };
      this.set(STORAGE_KEYS.BUDGETS, [...budgets, newBudget]);
      resolvedBudget = newBudget;
    }

    if (isSupabaseConfigured) {
      supabase.from('budgets').upsert({
        id: resolvedBudget.id,
        category_id: resolvedBudget.categoryId,
        limit_amount: resolvedBudget.limitAmount,
        month: resolvedBudget.month,
        user_id: resolvedBudget.userId
      }).then(({ error }) => {
        if (error) console.error('Error syncing budget to Supabase:', error);
      });
    }

    return resolvedBudget;
  }

  // Goals
  static getGoals(userId?: string): Goal[] {
    const goals = this.get<Goal>(STORAGE_KEYS.GOALS);
    const activeUserId = userId || 'demo';
    return goals.filter(g => g.userId === activeUserId);
  }

  static addGoal(goal: Omit<Goal, 'id'>): Goal {
    const goals = this.get<Goal>(STORAGE_KEYS.GOALS);
    const newGoal: Goal = {
      ...goal,
      id: Math.random().toString(36).substring(7),
    };
    this.set(STORAGE_KEYS.GOALS, [...goals, newGoal]);

    if (isSupabaseConfigured) {
      supabase.from('goals').upsert({
        id: newGoal.id,
        name: newGoal.name,
        target_amount: newGoal.targetAmount,
        current_amount: newGoal.currentAmount,
        deadline: newGoal.deadline,
        user_id: newGoal.userId
      }).then(({ error }) => {
        if (error) console.error('Error syncing goal to Supabase:', error);
      });
    }

    return newGoal;
  }

  static updateGoal(id: string, currentAmount: number): void {
    const goals = this.get<Goal>(STORAGE_KEYS.GOALS).map(g => g.id === id ? { ...g, currentAmount } : g);
    this.set(STORAGE_KEYS.GOALS, goals);

    if (isSupabaseConfigured) {
      supabase.from('goals').update({ current_amount: currentAmount }).eq('id', id).then(({ error }) => {
        if (error) console.error('Error updating goal in Supabase:', error);
      });
    }
  }
}
