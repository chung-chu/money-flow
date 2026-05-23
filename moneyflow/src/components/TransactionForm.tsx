import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { TransactionType, Category } from '../types';
import { StorageService } from '../services/storageService';
import { toast } from 'sonner';
import { Mic, Sparkles } from 'lucide-react';
import { GeminiService } from '../services/geminiService';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
}

export default function TransactionForm({ isOpen, onClose, onSuccess, categories }: TransactionFormProps) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiInput, setAiInput] = useState('');

  // Location and GPS states
  const [placeName, setPlaceName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isLocAttached, setIsLocAttached] = useState(false);

  const requestAndFetchLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Thiết bị hoặc trình duyệt của bạn không hỗ trợ định vị.');
      return;
    }

    setIsGettingLocation(true);
    toast.info('Đang yêu cầu quyền truy cập vị trí và định vị GPS...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const uLat = position.coords.latitude;
        const uLng = position.coords.longitude;
        setLat(uLat.toString());
        setLng(uLng.toString());
        setIsLocAttached(true);
        setIsGettingLocation(false);
        toast.success(`Định vị thành công! [${uLat.toFixed(4)}, ${uLng.toFixed(4)}]`);

        // Attempt a reverse geocode with openstreetmap nominatim API
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${uLat}&lon=${uLng}`);
          if (res.ok) {
            const data = await res.json();
            const shop = data.address.shop || data.address.amenity || data.address.cafe || data.address.restaurant || data.address.road || '';
            const suburb = data.address.suburb || data.address.quarter || '';
            const city = data.address.city || data.address.town || '';
            const combined = [shop, suburb, city].filter(Boolean).join(', ');
            if (combined && !placeName) {
              setPlaceName(combined);
              toast.info(`Tự động nhận diện địa danh: ${combined}`);
            }
          }
        } catch (e) {
          // ignore failures gracefully
        }
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Bạn đã từ chối quyền truy cập vị trí. Vui lòng cấp quyền trong cài đặt trình duyệt để tiếp tục sử dụng.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Thông tin vị trí định vị không khả dụng.');
            break;
          case error.TIMEOUT:
            toast.error('Yêu cầu lấy vị trí hết thời gian chờ.');
            break;
          default:
            toast.error('Không thể xác nhận vị trí GPS.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !date) {
      toast.error('Please fill in all required fields');
      return;
    }

    const tLocation = isLocAttached && lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined;

    StorageService.addTransaction({
      amount: parseFloat(amount),
      type,
      categoryId,
      date,
      note: note.trim() || undefined,
      placeName: placeName.trim() || undefined,
      location: tLocation,
      userId: 'demo'
    });

    toast.success('Transaction added successfully');
    reset();
    onSuccess();
    onClose();
  };

  const handleAIParse = async () => {
    if (!aiInput) return;
    setIsProcessingAI(true);
    try {
      const result = await GeminiService.parseVoiceInput(aiInput, categories);
      if (result) {
        setAmount(result.amount?.toString() || '');
        setType(result.type || TransactionType.EXPENSE);
        setCategoryId(result.categoryId || '');
        setNote(result.note || '');
        setDate(result.date || new Date().toISOString().split('T')[0]);
        toast.success('AI parsed transaction successfully');
      }
    } catch (error) {
      toast.error('AI failed to parse input');
    } finally {
      setIsProcessingAI(false);
    }
  };

  const reset = () => {
    setAmount('');
    setType(TransactionType.EXPENSE);
    setCategoryId('');
    setNote('');
    setAiInput('');
    setPlaceName('');
    setLat('');
    setLng('');
    setIsLocAttached(false);
    setDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0a] border-zinc-800 text-zinc-100 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold italic">Add Transaction</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* AI Input Section */}
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-widest">AI Quick Add</Label>
            <div className="relative">
              <Input 
                placeholder="Ex: '30k for lunch today'" 
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                className="bg-zinc-900 border-zinc-800 pr-24"
              />
              <Button 
                onClick={handleAIParse}
                disabled={isProcessingAI || !aiInput}
                className="absolute right-1 top-1 h-8 bg-orange-600 hover:bg-orange-500 text-[10px] uppercase font-bold"
              >
                {isProcessingAI ? '...' : <><Sparkles className="w-3 h-3 mr-1" /> Magic</>}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs uppercase tracking-widest">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as TransactionType)}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                  <SelectItem value={TransactionType.EXPENSE}>Expense</SelectItem>
                  <SelectItem value={TransactionType.INCOME}>Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs uppercase tracking-widest">Amount</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[#94A3B8] text-xs uppercase tracking-widest">Category (Danh mục)</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                {categories
                  .filter(c => c.type === type && !c.parentId)
                  .map(parent => {
                    const parentOption = (
                      <SelectItem key={parent.id} value={parent.id} className="font-bold text-indigo-400 focus:bg-indigo-500/20">
                        💼 {parent.name} (Tất cả)
                      </SelectItem>
                    );
                    const subOptions = categories
                      .filter(c => c.parentId === parent.id)
                      .map(sub => (
                        <SelectItem key={sub.id} value={sub.id} className="pl-6 text-zinc-300 focus:bg-zinc-800/80">
                          ↳ {sub.name}
                        </SelectItem>
                      ));
                    return [parentOption, ...subOptions];
                  })
                  .flat()}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs uppercase tracking-widest">Date</Label>
              <Input 
                type="date" 
                value={date}
                onChange={e => setDate(e.target.value)}
                className="bg-zinc-900 border-zinc-800 inverted-colors"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs uppercase tracking-widest">Note (Ghi chú)</Label>
              <Input 
                placeholder="Ví dụ: Ăn trưa Highlands" 
                value={note}
                onChange={e => setNote(e.target.value)}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
          </div>

          {/* Location details section */}
          <div className="border-t border-zinc-900 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-400 text-xs uppercase tracking-widest flex items-center gap-1">
                📍 Vị trí giao dịch
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={requestAndFetchLocation}
                disabled={isGettingLocation}
                className={`h-7 px-2.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                  isLocAttached 
                    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10' 
                    : 'border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {isGettingLocation ? 'Đang định vị...' : isLocAttached ? '✓ Đã gắn GPS' : '📍 Đính kèm vị trí'}
              </Button>
            </div>

            <div className="space-y-2">
              <Input 
                placeholder="Tên địa điểm / Cửa hàng (Ví dụ: Highlands Coffee, Grab...)" 
                value={placeName}
                onChange={e => setPlaceName(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-sm"
              />
              {isLocAttached && lat && lng && (
                <div className="text-[10px] text-zinc-500 font-mono flex items-center justify-between px-1 bg-zinc-900/40 py-1.5 rounded border border-zinc-800/40">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    <span>GPS: <strong>{parseFloat(lat).toFixed(4)}N</strong>, <strong>{parseFloat(lng).toFixed(4)}E</strong></span>
                  </span>
                  <button 
                    type="button"
                    onClick={() => {
                      setLat('');
                      setLng('');
                      setIsLocAttached(false);
                    }}
                    className="text-red-400 hover:text-red-300 transition-colors uppercase font-bold text-[9px] tracking-wider"
                  >
                    Gỡ GPS
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-zinc-500 hover:text-zinc-300">Cancel</Button>
          <Button onClick={handleSubmit} className="bg-orange-600 hover:bg-orange-500">Save Transaction</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
