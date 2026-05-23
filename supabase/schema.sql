-- Supabase Schema for MoneyFlow OS

-- 1. Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    type TEXT NOT NULL,                  -- 'income' or 'expense'
    parent_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    user_id TEXT DEFAULT 'demo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL,                  -- 'income' or 'expense'
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    note TEXT,
    place_name TEXT,
    location JSONB,                      -- Store coordinate map { lat, lng } if any
    user_id TEXT DEFAULT 'demo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
    id TEXT PRIMARY KEY,
    category_id TEXT REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount NUMERIC NOT NULL,
    month TEXT NOT NULL,                  -- 'May 2026', etc.
    user_id TEXT DEFAULT 'demo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Goals Table
CREATE TABLE IF NOT EXISTS public.goals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target_amount NUMERIC NOT NULL,
    current_amount NUMERIC NOT NULL DEFAULT 0,
    deadline DATE NOT NULL,
    user_id TEXT DEFAULT 'demo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Create Policies for Public Access (for simplified 'demo' account tracking)
CREATE POLICY "Allow public read access" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public write access" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.categories FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.categories FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Allow public write access" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access" ON public.transactions FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.budgets FOR SELECT USING (true);
CREATE POLICY "Allow public write access" ON public.budgets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.budgets FOR UPDATE USING (true);

CREATE POLICY "Allow public read access" ON public.goals FOR SELECT USING (true);
CREATE POLICY "Allow public write access" ON public.goals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.goals FOR UPDATE USING (true);

-- Populate default Categories (Primary Categories)
INSERT INTO public.categories (id, name, icon, color, type, parent_id, user_id) VALUES
('1', 'Ăn uống', 'Utensils', '#f87171', 'expense', NULL, 'demo'),
('2', 'Nhà ở', 'Home', '#6366f1', 'expense', NULL, 'demo'),
('3', 'Đi lại', 'Car', '#fb923c', 'expense', NULL, 'demo'),
('4', 'Mua sắm', 'ShoppingBag', '#fbbf24', 'expense', NULL, 'demo'),
('5', 'Thu nhập', 'Wallet', '#4ade80', 'income', NULL, 'demo')
ON CONFLICT (id) DO NOTHING;

-- Populate default Subcategories
INSERT INTO public.categories (id, name, icon, color, type, parent_id, user_id) VALUES
('1-1', 'Ăn', 'Utensils', '#f87171', 'expense', '1', 'demo'),
('1-2', 'Uống (Cà phê, trà...)', 'CupSoda', '#f87171', 'expense', '1', 'demo'),
('1-3', 'Ăn nhậu / Tiệc tùng', 'GlassWater', '#f87171', 'expense', '1', 'demo'),
('1-4', 'Khác (Ăn uống)', 'Utensils', '#f87171', 'expense', '1', 'demo'),
('2-1', 'Phí nhà trọ / Tiền nhà', 'Home', '#6366f1', 'expense', '2', 'demo'),
('2-2', 'Điện nước & Tiện ích', 'Zap', '#6366f1', 'expense', '2', 'demo'),
('2-3', 'Khác (Nhà ở)', 'Home', '#6366f1', 'expense', '2', 'demo'),
('3-1', 'Xăng xe', 'Fuel', '#fb923c', 'expense', '3', 'demo'),
('3-2', 'Đặt xe (Grab / Taxi)', 'Car', '#fb923c', 'expense', '3', 'demo'),
('5-1', 'Lương cố định', 'Briefcase', '#4ade80', 'income', '5', 'demo'),
('5-2', 'Làm thêm / Freelance', 'Laptop', '#4ade80', 'income', '5', 'demo')
ON CONFLICT (id) DO NOTHING;
