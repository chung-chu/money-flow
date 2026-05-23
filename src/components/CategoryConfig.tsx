import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Category, TransactionType } from '../types';
import { StorageService } from '../services/storageService';
import { toast } from 'sonner';
import { 
  FolderTree, 
  Plus, 
  Trash2, 
  Tag, 
  Sparkles,
  Utensils, 
  Home, 
  Car, 
  ShoppingBag, 
  Wallet, 
  CupSoda, 
  GlassWater, 
  Zap, 
  Briefcase, 
  Laptop, 
  Heart, 
  Smile, 
  BookOpen, 
  Dumbbell
} from 'lucide-react';

// Dynamic Icon rendering map
const ICON_MAP: Record<string, any> = {
  Utensils, 
  Home, 
  Car, 
  ShoppingBag, 
  Wallet, 
  CupSoda, 
  GlassWater, 
  Zap, 
  Briefcase, 
  Laptop, 
  Heart, 
  Smile, 
  BookOpen, 
  Dumbbell
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = ICON_MAP[name] || Tag;
  return <IconComponent className={className} />;
}

// Available colors for categories
const PRESET_COLORS = [
  '#f87171', // Red
  '#fb923c', // Orange
  '#fbbf24', // Amber
  '#4ade80', // Green
  '#2dd4bf', // Teal
  '#38bdf8', // Sky
  '#6366f1', // Indigo
  '#c084fc', // Purple
  '#f472b6', // Pink
];

interface CategoryConfigProps {
  categories: Category[];
  onRefresh: () => void;
}

export default function CategoryConfig({ categories, onRefresh }: CategoryConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [parentId, setParentId] = useState<string>('none');
  const [selectedIcon, setSelectedIcon] = useState('Tag');
  const [selectedColor, setSelectedColor] = useState('#6366f1');

  // Filter categories
  const parentCategories = categories.filter(c => !c.parentId);

  const getSubcategories = (parentId: string) => {
    return categories.filter(c => c.parentId === parentId);
  };

  const resetForm = () => {
    setName('');
    setType(TransactionType.EXPENSE);
    setParentId('none');
    setSelectedIcon('Tag');
    setSelectedColor('#6366f1');
  };

  const handleOpenAdd = (defaultParentId?: string) => {
    resetForm();
    if (defaultParentId) {
      const parent = categories.find(c => c.id === defaultParentId);
      if (parent) {
        setParentId(defaultParentId);
        setType(parent.type);
        setSelectedColor(parent.color);
        setSelectedIcon(parent.icon);
      }
    }
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }

    StorageService.addCategory({
      name: name.trim(),
      type,
      icon: selectedIcon,
      color: selectedColor,
      userId: 'demo',
      parentId: parentId === 'none' ? undefined : parentId,
    });

    toast.success('Đã thêm danh mục thành công!');
    setIsOpen(false);
    onRefresh();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa danh mục "${name}"? Các danh mục phụ liên quan cũng sẽ bị xóa.`)) {
      StorageService.deleteCategory(id);
      toast.success(`Đã xóa danh mục "${name}"`);
      onRefresh();
    }
  };

  return (
    <div className="space-y-8">
      {/* Upper header action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#12161F] border border-[#1E293B] rounded-lg flex items-center justify-center text-[#6366F1] shadow-sm">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-[#F8FAFC]">Quản Lý Danh Mục</h3>
            <p className="text-[10px] text-[#64748B] uppercase tracking-[0.2em] font-bold">Cấu hình phân cấp đa tầng (Ăn uống, Nhà ở...)</p>
          </div>
        </div>

        <Button 
          onClick={() => handleOpenAdd()}
          className="bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-bold font-sans flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Thêm Danh Mục Gốc
        </Button>
      </div>

      {/* Grid displays */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {parentCategories.map(parent => {
          const subs = getSubcategories(parent.id);
          return (
            <Card key={parent.id} className="bg-[#12161F] border-[#1E293B] overflow-hidden rounded-2xl flex flex-col justify-between shadow-sm">
              <CardHeader className="border-b border-[#1E293B]/60 py-4 px-6 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: `${parent.color}30`, color: parent.color }}
                  >
                    <CategoryIcon name={parent.icon} className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      {parent.name}
                    </CardTitle>
                    <span className={`text-[9px] uppercase tracking-wide font-mono ${parent.type === TransactionType.EXPENSE ? 'text-red-400' : 'text-emerald-400'}`}>
                      {parent.type === TransactionType.EXPENSE ? 'Chi tiêu' : 'Thu nhập'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleOpenAdd(parent.id)}
                    className="h-7 w-7 text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1E293B]"
                    title="Thêm danh mục con"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(parent.id, parent.name)}
                    className="h-7 w-7 text-red-400/70 hover:text-red-500 hover:bg-red-500/10"
                    title="Xóa danh mục gốc"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 flex-1 bg-[#0F131C]/40 min-h-[140px]">
                {subs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-6 text-center border border-dashed border-[#1E293B] rounded-xl">
                    <p className="text-xs text-[#64748B]">Chưa có danh mục con</p>
                    <Button 
                      variant="link" 
                      onClick={() => handleOpenAdd(parent.id)}
                      className="text-xs text-[#6366F1] font-bold p-0 mt-1"
                    >
                      + Tạo ngay
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-[#475569] mb-3">Danh mục phụ ({subs.length})</p>
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {subs.map(sub => (
                        <div 
                          key={sub.id} 
                          className="flex items-center justify-between p-2.5 bg-[#12161F] border border-[#1E293B]/40 hover:border-[#6366F1]/20 rounded-xl transition-all group"
                        >
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: parent.color }}
                            />
                            <p className="text-xs font-medium text-slate-300">{sub.name}</p>
                          </div>
                          <Button 
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(sub.id, sub.name)}
                            className="opacity-0 group-hover:opacity-100 h-6 w-6 text-red-400/70 hover:text-red-500 hover:bg-red-500/10 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Trigger Modal Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-[#12161F] border-[#1E293B] text-zinc-100 sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#6366F1]" />
              {parentId !== 'none' ? 'Thêm Danh Mục Phụ' : 'Thêm Danh Mục Mới'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 py-3">
            <div className="space-y-2">
              <Label htmlFor="category-name" className="text-[#94A3B8] text-xs uppercase tracking-widest">Tên danh mục</Label>
              <Input 
                id="category-name"
                placeholder={parentId !== 'none' ? "Ví dụ: Ăn nhậu, Bia hơi..." : "Ví dụ: Giải trí, Học tập..."}
                value={name}
                onChange={e => setName(e.target.value)}
                className="bg-[#0B0E14] border-[#1E293B] text-slate-100 focus:ring-[#6366F1]/30 placeholder:text-[#475569]"
              />
            </div>

            {/* Parent selection configuration */}
            <div className="space-y-2">
              <Label className="text-[#94A3B8] text-xs uppercase tracking-widest">Thuộc danh mục cha</Label>
              <Select value={parentId} onValueChange={(v) => {
                setParentId(v);
                if (v !== 'none') {
                  const parent = categories.find(c => c.id === v);
                  if (parent) {
                    setType(parent.type);
                    setSelectedColor(parent.color);
                    setSelectedIcon(parent.icon);
                  }
                }
              }}>
                <SelectTrigger className="bg-[#0B0E14] border-[#1E293B] text-slate-100">
                  <SelectValue placeholder="Chọn danh mục cha" />
                </SelectTrigger>
                <SelectContent className="bg-[#12161F] border-[#1E293B] text-zinc-100">
                  <SelectItem value="none">-- Không xếp lớp (Là danh mục Gốc) --</SelectItem>
                  {parentCategories.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.type === TransactionType.EXPENSE ? 'Chi tiêu' : 'Thu nhập'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {parentId === 'none' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#94A3B8] text-xs uppercase tracking-widest">Loại giao dịch</Label>
                    <Select value={type} onValueChange={(v) => setType(v as TransactionType)}>
                      <SelectTrigger className="bg-[#0B0E14] border-[#1E293B] text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#12161F] border-[#1E293B] text-zinc-100">
                        <SelectItem value={TransactionType.EXPENSE}>Khoản chi (Expense)</SelectItem>
                        <SelectItem value={TransactionType.INCOME}>Thu nhập (Income)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#94A3B8] text-xs uppercase tracking-widest">Biểu tượng</Label>
                    <Select value={selectedIcon} onValueChange={setSelectedIcon}>
                      <SelectTrigger className="bg-[#0B0E14] border-[#1E293B] text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#12161F] border-[#1E293B] text-zinc-100">
                        {Object.keys(ICON_MAP).map(key => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <CategoryIcon name={key} className="w-3.5 h-3.5" />
                              <span>{key}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Color swatches selector */}
                <div className="space-y-2">
                  <Label className="text-[#94A3B8] text-xs uppercase tracking-widest">Màu sắc chủ đề</Label>
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`w-7 h-7 rounded-lg border-2 transition-all flex items-center justify-center ${
                          selectedColor === color 
                          ? 'border-white scale-110 shadow-lg' 
                          : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {selectedColor === color && <span className="w-1.5 h-1.5 bg-[#0B0E14] rounded-full" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="text-[#64748B] hover:text-[#E2E8F0]">Hủy</Button>
              <Button type="submit" className="bg-[#6366F1] hover:bg-[#4F46E5] text-white">Save Category</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
