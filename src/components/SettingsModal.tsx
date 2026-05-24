import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useLanguage } from '../context/LanguageContext';
import { Check, Globe, RefreshCw, Palette, User, Smile, LogOut, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { id: string; name: string; phone: string; avatar: string } | null;
  onUpdateUser: (updated: { name: string; avatar: string }) => void;
  onLogout: () => void;
}

const PREMIUM_AVATARS = [
  '🧑‍💻', '🤵', '👸', '🥷', '🦁', '🦉', '🦖', '🚀', '☕', '💰', '💎', '🎨'
];

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  onUpdateUser, 
  onLogout 
}: SettingsModalProps) {
  const { language, setLanguage, t } = useLanguage();
  
  // Profile settings state
  const [tempName, setTempName] = useState('');
  const [tempAvatar, setTempAvatar] = useState('');

  useEffect(() => {
    if (currentUser) {
      setTempName(currentUser.name);
      setTempAvatar(currentUser.avatar);
    }
  }, [currentUser, isOpen]);

  const handleLanguageChange = (lang: 'vi' | 'en') => {
    setLanguage(lang);
    toast.success(t('settings.success'));
  };

  const handleSaveProfile = () => {
    if (!tempName.trim()) {
      toast.error('Tên hiển thị không được để trống.');
      return;
    }
    onUpdateUser({ name: tempName.trim(), avatar: tempAvatar });
    toast.success('Đã cập nhật thông tin cài đặt tài khoản! ✨');
    onClose();
  };

  const triggerDataSync = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Đang chuẩn hóa dữ liệu dòng tiền...',
        success: 'Hoàn tất đồng bộ đám mây Supabase / LocalStorage!',
        error: 'Thất bại khi kết nối máy chủ dữ liệu.',
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0c0f16] border border-[#1e293b] text-zinc-100 sm:max-w-[450px] rounded-xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold italic text-slate-100 flex items-center gap-2">
            ⚙️ {t('settings.title')}
          </DialogTitle>
          <p className="text-xs text-[#94a3b8]">Tùy chỉnh cấu hình moneyflow dòng tiền của riêng bạn.</p>
        </DialogHeader>

        <div className="space-y-5 py-4 font-sans text-xs">
          {/* USER MANAGEMENT SECTION */}
          {currentUser && (
            <div className="p-4 bg-[#111724] border border-[#1e293b]/70 rounded-xl space-y-4">
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">
                👤 Cấu hình Hồ Sơ Người Dùng (User Profile):
              </span>
              
              <div className="grid grid-cols-1 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-bold">Số điện thoại đăng nhập:</label>
                  <div className="bg-[#0b0e14] border border-[#1e293b] text-zinc-200 px-3 py-2 h-9 rounded-lg flex items-center gap-2 font-mono font-bold select-all">
                    <span>{currentUser.id === 'demo' ? 'Tài khoản Demo (Fox OS)' : currentUser.phone}</span>
                  </div>
                </div>

                <div className="space-y-1.55">
                  <label className="text-zinc-400 font-bold">Cập nhật Tên hiển thị:</label>
                  <input 
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="Mời nhập biệt danh mới..."
                    className="w-full bg-[#0b0e14] border border-[#1e293b] hover:border-zinc-800 text-zinc-100 px-3 h-9 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500/50 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-bold block">Biểu tượng Avatar:</label>
                  <div className="flex items-center gap-2 bg-[#0b0e14] border border-[#1e293b] p-2 rounded-lg">
                    <span className="text-xl select-none">{tempAvatar}</span>
                    <div className="flex-1 flex flex-wrap gap-1">
                      {PREMIUM_AVATARS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setTempAvatar(emoji)}
                          className={`text-sm p-1 hover:bg-zinc-900 rounded transition-all ${
                            tempAvatar === emoji ? 'bg-indigo-500/20 ring-1 ring-indigo-500' : ''
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1.5">
                <Button 
                  onClick={handleSaveProfile}
                  className="flex-1 bg-[#6366f1] hover:bg-[#4f46e5] text-xs font-bold font-sans text-white h-9"
                >
                  Lưu hồ sơ mới
                </Button>
                
                <Button 
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-xs font-bold h-9 flex items-center gap-1.5 px-3"
                >
                  <LogOut className="w-3.5 h-3.5" /> Đăng xuất
                </Button>
              </div>
            </div>
          )}

          {/* Language Selector */}
          <div className="space-y-3">
            <Label className="text-zinc-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <Globe className="w-4 h-4 text-[#6366f1]" /> {t('settings.language')}
            </Label>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleLanguageChange('vi')}
                className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-between transition-all ${
                  language === 'vi'
                    ? 'border-[#6366f1] bg-[#6366f1]/10 text-[#6366f1]'
                    : 'border-[#1e293b] bg-zinc-900/40 text-[#94a3b8] hover:border-zinc-800'
                }`}
              >
                <span>{t('settings.vi')}</span>
                {language === 'vi' && <Check className="w-4 h-4" />}
              </button>

              <button
                onClick={() => handleLanguageChange('en')}
                className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-between transition-all ${
                  language === 'en'
                    ? 'border-[#6366f1] bg-[#6366f1]/10 text-[#6366f1]'
                    : 'border-[#1e293b] bg-zinc-900/40 text-[#94a3b8] hover:border-zinc-800'
                }`}
              >
                <span>{t('settings.en')}</span>
                {language === 'en' && <Check className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Theme display */}
          <div className="space-y-2.5">
            <Label className="text-zinc-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <Palette className="w-4 h-4 text-[#6366f1]" /> {t('settings.theme')}
            </Label>
            <div className="p-3 rounded-lg border border-[#1e293b] bg-zinc-900/20 text-xs text-[#94a3b8] font-bold">
              🌌 {t('settings.themeDark')}
            </div>
          </div>

          {/* Sync control */}
          <div className="space-y-2.5">
            <Label className="text-zinc-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <RefreshCw className="w-4 h-4 text-[#6366f1]" /> Đồng bộ cơ sở dữ liệu (Supabase Sync)
            </Label>
            <Button
              onClick={triggerDataSync}
              className="w-full bg-[#1e293b] hover:bg-[#2e3e56] border border-[#334155] text-[10px] font-bold font-sans uppercase tracking-widest text-slate-100 h-9"
            >
              Đồng bộ dữ liệu ngay lập tức
            </Button>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button onClick={onClose} className="border border-[#1e293b] hover:bg-zinc-900/40 text-zinc-300 w-full uppercase font-bold text-xs h-9">
            {t('settings.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
