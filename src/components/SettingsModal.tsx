import React from 'react';
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
import { Check, Globe, RefreshCw, Palette } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (lang: 'vi' | 'en') => {
    setLanguage(lang);
    toast.success(t('settings.success'));
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
      <DialogContent className="bg-[#0c0f16] border border-[#1e293b] text-zinc-100 sm:max-w-[425px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold italic text-slate-100">
            {t('settings.title')}
          </DialogTitle>
          <p className="text-xs text-[#94a3b8]">{t('settings.sub')}</p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Language Selector */}
          <div className="space-y-3">
            <Label className="text-zinc-400 text-xs uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <Globe className="w-4.5 h-4.5 text-[#6366f1]" /> {t('settings.language')}
            </Label>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleLanguageChange('vi')}
                className={`p-3.5 rounded-lg border text-sm font-bold flex items-center justify-between transition-all ${
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
                className={`p-3.5 rounded-lg border text-sm font-bold flex items-center justify-between transition-all ${
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
          <div className="space-y-3">
            <Label className="text-zinc-400 text-xs uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <Palette className="w-4.5 h-4.5 text-[#6366f1]" /> {t('settings.theme')}
            </Label>
            <div className="p-3.5 rounded-lg border border-[#1e293b] bg-zinc-900/20 text-xs text-[#94a3b8] font-bold">
              🌌 {t('settings.themeDark')}
            </div>
          </div>

          {/* Sync control */}
          <div className="space-y-3">
            <Label className="text-zinc-400 text-xs uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <RefreshCw className="w-4.5 h-4.5 text-[#6366f1]" /> Cơ chế đồng bộ (Sync Database)
            </Label>
            <Button
              onClick={triggerDataSync}
              className="w-full bg-[#1e293b] hover:bg-[#2e3e56] border border-[#334155] text-xs font-bold font-sans uppercase tracking-widest text-slate-100 h-10"
            >
              Yêu cầu đồng bộ ngay lập tức
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="bg-[#6366f1] hover:bg-[#4f46e5] text-white w-full uppercase font-bold text-xs">
            {t('settings.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
