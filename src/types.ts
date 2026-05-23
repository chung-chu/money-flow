export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export interface Location {
  lat: number;
  lng: number;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string;
  time?: string;
  note?: string;
  location?: Location;
  placeName?: string;
  userId: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  userId: string;
  parentId?: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  limitAmount: number;
  month: string; // YYYY-MM
  userId: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  userId: string;
}
