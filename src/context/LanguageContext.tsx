import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'vi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  vi: {
    // Nav
    'nav.dashboard': 'Bảng điều khiển',
    'nav.transactions': 'Giao dịch',
    'nav.categories': 'Danh mục',
    'nav.analytics': 'Phân tích AI',
    'nav.budgets': 'Ngân sách',
    'nav.goals': 'Mục tiêu',
    'nav.map': 'Bản đồ chi tiêu',
    'nav.settings': 'Cài đặt',
    
    // Header & Global
    'header.search': 'Tìm kiếm...',
    'header.newEntry': '+ Thêm giao dịch',
    'header.nowMonth': 'Tháng này',
    
    // Dashboard
    'dash.totalBalance': 'Tổng số dư',
    'dash.expense': 'Tổng chi tiêu',
    'dash.income': 'Tổng thu nhập',
    'dash.activeBudgets': 'Ngân sách đang chạy',
    'dash.recentTransactions': 'Giao dịch gần đây',
    'dash.recentTransactionsSub': 'Lịch sử dòng tiền thời gian thực',
    'dash.noTransactions': 'Không có giao dịch nào được ghi nhận',
    
    // Transactions List
    'tx.all': 'Tất cả',
    'tx.expenses': 'Khoản chi',
    'tx.income': 'Khoản thu',
    'tx.allCategories': 'Tất cả danh mục',
    'tx.export': 'Xuất dữ liệu',
    'tx.filter': 'Bộ lọc nâng cao',
    'tx.date': 'Ngày',
    'tx.category': 'Danh mục',
    'tx.note': 'Ghi chú',
    'tx.value': 'Giá trị',
    'tx.ops': 'Thao tác',
    'tx.deleted': 'Đã xóa giao dịch thành công!',
    'tx.searchPlaceholder': 'Lọc nâng cao theo từ khóa, ghi chú...',
    'tx.noEntries': 'Không tìm thấy giao dịch nào phù hợp bộ lọc',
    'tx.batchUnits': 'Tổng cộng: {count} giao dịch',
    
    // Dialog Add Transaction
    'form.title': 'Thêm giao dịch mới',
    'form.type': 'Loại giao dịch',
    'form.expense': 'Khoản chi',
    'form.income': 'Khoản thu',
    'form.amount': 'Số tiền (VNĐ)',
    'form.category': 'Danh mục',
    'form.selectCategory': 'Chọn danh mục',
    'form.date': 'Ngày thực hiện',
    'form.note': 'Ghi chú',
    'form.notePlaceholder': 'Ví dụ: Ăn trưa, Đi chợ, Lương...',
    'form.location': 'Vị trí địa lý',
    'form.placeName': 'Tên địa điểm / Cửa hàng',
    'form.placePlaceholder': 'Ví dụ: Highlands Coffee, siêu thị...',
    'form.getLocation': 'Gắn GPS tự động',
    'form.gettingLocation': 'Đang định vị...',
    'form.locAttached': 'Đã gắn GPS thành công',
    'form.removeLocation': 'Gỡ GPS',
    'form.cancel': 'Hủy',
    'form.save': 'Lưu giao dịch',
    'form.fillRequired': 'Vui lòng cung cấp đầy đủ Tiền, Danh mục và Ngày',
    'form.success': 'Đã thêm giao dịch thành công!',
    
    // Category Management
    'cat.title': 'Cấu hình Danh mục',
    'cat.subtitle': 'Quản lý cây danh mục cha và con phục vụ phân tách mục đích',
    'cat.addParent': '+ Thêm danh mục cha',
    'cat.name': 'Tên danh mục',
    'cat.color': 'Màu sắc hiển thị',
    'cat.save': 'Lưu lại',
    'cat.type': 'Loại hình',
    'cat.actions': 'Hành động',
    'cat.noCategories': 'Chưa cấu hình danh mục nào',
    'cat.addChild': 'Thêm danh mục con',
    
    // Budgets
    'budget.title': 'Quản lý Ngân sách',
    'budget.sub': 'Ranh giới cảnh báo giới hạn chi theo từng khoản mục',
    'budget.limit': 'Hạn mức',
    'budget.spent': 'Đã chi',
    'budget.remaining': 'Còn lại',
    'budget.setLimit': 'Đặt hạn mức',
    'budget.overDescription': 'Cảnh báo: Đã vượt ngân sách cho phép!',
    
    // Goals
    'goal.title': 'Mục tiêu Tài chính',
    'goal.sub': 'Theo dõi tiến trình tích lũy tài sản cho kế hoạch tương lai',
    'goal.target': 'Mục tiêu',
    'goal.saved': 'Đã tích lũy',
    'goal.reached': 'Hoàn thành!',
    
    // Settings Settings Dialog
    'settings.title': 'Cài đặt hệ thống',
    'settings.sub': 'Cấu hình tùy chọn ngôn ngữ hiển thị và đồng bộ dữ liệu',
    'settings.language': 'Ngôn ngữ hiển thị (Language)',
    'settings.vi': 'Tiếng Việt',
    'settings.en': 'English',
    'settings.close': 'Đóng',
    'settings.success': 'Đã thay đổi ngôn ngữ thành công!',
    'settings.theme': 'Giao diện',
    'settings.themeDark': 'Tối màu tối giản (Mặc định)',
    
    // Map Analysis
    'map.head': 'Thống kê Không gian',
    'map.sub': 'Trực quan hóa vị trí giao dịch và địa điểm đã tiêu dùng',
    'map.filterAll': 'Tất cả vị trí',
    'map.filterExpense': 'Điểm chi tiêu',
    'map.filterIncome': 'Điểm nhận tiền',
  },
  en: {
    // Nav
    'nav.dashboard': 'Dashboard',
    'nav.transactions': 'Transactions',
    'nav.categories': 'Categories',
    'nav.analytics': 'AI Analytics',
    'nav.budgets': 'Budgets',
    'nav.goals': 'Goals',
    'nav.map': 'Spending Map',
    'nav.settings': 'Settings',
    
    // Header & Global
    'header.search': 'Search resources...',
    'header.newEntry': '+ New Entry',
    'header.nowMonth': 'This Month',
    
    // Dashboard
    'dash.totalBalance': 'Total Balance',
    'dash.expense': 'Total Expenses',
    'dash.income': 'Total Income',
    'dash.activeBudgets': 'Active Budgets',
    'dash.recentTransactions': 'Recent Transactions',
    'dash.recentTransactionsSub': 'Real-time financial flow history',
    'dash.noTransactions': 'No transactions captured yet',
    
    // Transactions List
    'tx.all': 'All',
    'tx.expenses': 'Expenses',
    'tx.income': 'Income',
    'tx.allCategories': 'All Categories',
    'tx.export': 'Export CSV',
    'tx.filter': 'Advanced Filter',
    'tx.date': 'Date',
    'tx.category': 'Category',
    'tx.note': 'Note',
    'tx.value': 'Value',
    'tx.ops': 'Actions',
    'tx.deleted': 'Transaction deleted successfully!',
    'tx.searchPlaceholder': 'Search by note, description or key word...',
    'tx.noEntries': 'No transactions match filters',
    'tx.batchUnits': 'Total: {count} transactions',
    
    // Dialog Add Transaction
    'form.title': 'Add New Transaction',
    'form.type': 'Transaction Type',
    'form.expense': 'Expense',
    'form.income': 'Income',
    'form.amount': 'Amount (VNĐ)',
    'form.category': 'Category',
    'form.selectCategory': 'Select a category',
    'form.date': 'Transaction Date',
    'form.note': 'Note',
    'form.notePlaceholder': 'E.g., Dinner, groceries, Salary...',
    'form.location': 'Geographic Location',
    'form.placeName': 'Location Name / Venues / Shop',
    'form.placePlaceholder': 'E.g., Starbucks, Market...',
    'form.getLocation': 'Get GPS Location',
    'form.gettingLocation': 'Locating...',
    'form.locAttached': 'GPS coordinate attached',
    'form.removeLocation': 'Remove GPS',
    'form.cancel': 'Cancel',
    'form.save': 'Save Transaction',
    'form.fillRequired': 'Please fill in required Amount, Category and Date',
    'form.success': 'Transaction added successfully!',
    
    // Category Management
    'cat.title': 'Configure Categories',
    'cat.subtitle': 'Manage high-level parents and sub-categories easily',
    'cat.addParent': '+ Add High Category',
    'cat.name': 'Category Name',
    'cat.color': 'Display Color',
    'cat.save': 'Save Changes',
    'cat.type': 'Type',
    'cat.actions': 'Actions',
    'cat.noCategories': 'No categories created yet',
    'cat.addChild': 'Add Sub-Category',
    
    // Budgets
    'budget.title': 'Manage Budgets',
    'budget.sub': 'Set soft alert triggers for various spending boundaries',
    'budget.limit': 'Budget Limit',
    'budget.spent': 'Spent',
    'budget.remaining': 'Remaining',
    'budget.setLimit': 'Set Limit',
    'budget.overDescription': 'Alert: budget bounds breached!',
    
    // Goals
    'goal.title': 'Saving Goals',
    'goal.sub': 'Track your progressive savings towards personal milestones',
    'goal.target': 'Target Goal',
    'goal.saved': 'Saved Amount',
    'goal.reached': 'Goal Reached!',
    
    // Settings Settings Dialog
    'settings.title': 'Settings Panel',
    'settings.sub': 'Configure system configurations, preferred language and sync databases',
    'settings.language': 'Preferred Language',
    'settings.vi': 'Tiếng Việt',
    'settings.en': 'English',
    'settings.close': 'Close',
    'settings.success': 'Language switched successfully!',
    'settings.theme': 'Interface Theme',
    'settings.themeDark': 'Minimal Dark Slate (Default)',
    
    // Map Analysis
    'map.head': 'Geospatial Statistics',
    'map.sub': 'Visualize transactions coordinates and commercial areas',
    'map.filterAll': 'All coordinates',
    'map.filterExpense': 'Spending outlets',
    'map.filterIncome': 'Funding channels',
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'vi',
  setLanguage: () => {},
  t: () => ''
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_lang');
    return (saved === 'en' || saved === 'vi') ? saved : 'vi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_lang', lang);
  };

  const t = (key: string): string => {
    const langDict = translations[language];
    // @ts-ignore
    return langDict[key] || translations['vi'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
