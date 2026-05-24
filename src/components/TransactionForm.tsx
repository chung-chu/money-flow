import React, { useState, useRef, useEffect } from 'react';
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
import { useLanguage } from '../context/LanguageContext';
import { Camera, Upload, RotateCcw, Video, X, MapPin } from 'lucide-react';

const VN_PRESETS = [
  { name: 'Thành phố Thủ Đức, TP.HCM', lat: '10.8494', lng: '106.7537' },
  { name: 'Quận Hà Đông, Hà Nội (Hà Tây cũ)', lat: '20.9687', lng: '105.7745' },
  { name: 'Thị xã Sơn Tây, Hà Nội', lat: '21.1348', lng: '105.5057' },
  { name: 'Thành phố Vinh mở rộng, Nghệ An', lat: '18.6734', lng: '105.6811' },
  { name: 'Thành phố Bến Cát, Bình Dương', lat: '11.1344', lng: '106.6322' }
];

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
}

export default function TransactionForm({ isOpen, onClose, onSuccess, categories }: TransactionFormProps) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Locket 1:1 Photo states
  const [locketImage, setLocketImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Location and GPS states
  const [placeName, setPlaceName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isLocAttached, setIsLocAttached] = useState(false);
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);

  // Stop camera stream when component closes or unmounts
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      console.error("Camera access failed:", e);
      toast.warning('Không thể mở camera trực tiếp. Bạn có thể sử dụng tính năng tải ảnh lên!');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      // Determine real video resolution
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const size = Math.min(videoWidth, videoHeight) || 600;
      
      canvas.width = 600;
      canvas.height = 600;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Crop a perfect central 1:1 square
        const sx = (videoWidth - size) / 2;
        const sy = (videoHeight - size) / 2;
        ctx.drawImage(video, sx, sy, size, size, 0, 0, 600, 600);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setLocketImage(dataUrl);
        stopCamera();
        toast.success('Đã ghi nhận ảnh Locket 1:1 thành công!');
      }
    } catch (err) {
      toast.error('Lỗi khi thu chụp hình ảnh.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        
        canvas.width = 600;
        canvas.height = 600;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Crop square center
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          ctx.drawImage(img, sx, sy, size, size, 0, 0, 600, 600);
          
          setLocketImage(canvas.toDataURL('image/jpeg', 0.85));
          toast.success('Đã tải lên và tự động cắt thành ảnh vuông 1:1!');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const searchCoordinatesFromPlace = async () => {
    if (!placeName.trim()) {
      toast.error('Vui lòng nhập tên địa điểm/cửa hàng trước khi tra cứu.');
      return;
    }
    setIsSearchingPlace(true);
    toast.info(`Đang truy vấn toạ độ địa lý tự động cho "${placeName}" từ OpenStreetMap...`);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const first = data[0];
          setLat(first.lat);
          setLng(first.lon);
          setIsLocAttached(true);
          toast.success(`Tìm thấy địa kỳ! Toạ độ: [${parseFloat(first.lat).toFixed(4)}, ${parseFloat(first.lon).toFixed(4)}]`);
        } else {
          toast.error('Nguồn dữ liệu bản đồ không trả về tọa độ phù hợp. Thử viết rõ hơn.');
        }
      } else {
        toast.error('Không kết nối được API bản đồ.');
      }
    } catch (e) {
      toast.error('Lỗi khi truy xuất dữ liệu định vị.');
    } finally {
      setIsSearchingPlace(false);
    }
  };

  const requestAndFetchLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Thiết bị hoặc trình duyệt không hỗ trợ Geolocation API.');
      return;
    }

    setIsGettingLocation(true);
    toast.info('Đang yêu cầu trình duyệt cho phép định vị GPS...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const uLat = position.coords.latitude;
        const uLng = position.coords.longitude;
        setLat(uLat.toString());
        setLng(uLng.toString());
        setIsLocAttached(true);
        setIsGettingLocation(false);
        toast.success(`Định vị GPS thành công! [${uLat.toFixed(4)}, ${uLng.toFixed(4)}]`);

        // Free reverse geocode reverse using Nominatim API openstreetmap
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
            toast.error('Bạn đã từ chối quyền truy cập vị trí. Vui lòng cấp quyền trong cài đặt trình duyệt.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Thông tin vị trí định vị không khả dụng.');
            break;
          case error.TIMEOUT:
            toast.error('Yêu cầu định vị hết thời gian chờ.');
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
      toast.error(t('form.fillRequired'));
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
      locketImage: locketImage || undefined,
      userId: 'demo'
    });

    toast.success(t('form.success'));
    reset();
    onSuccess();
    onClose();
  };

  const reset = () => {
    setAmount('');
    setType(TransactionType.EXPENSE);
    setCategoryId('');
    setNote('');
    setPlaceName('');
    setLat('');
    setLng('');
    setIsLocAttached(false);
    setDate(new Date().toISOString().split('T')[0]);
    setLocketImage(null);
    stopCamera();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0c0f16] border border-[#1e293b] text-zinc-100 sm:max-w-[425px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold italic text-slate-100">{t('form.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">{t('form.type')}</Label>
              <Select value={type} onValueChange={(v) => {
                setType(v as TransactionType);
                setCategoryId(''); // Reset chosen cat since type flipped
              }}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#12161f] border-[#1e293b] text-zinc-100">
                  <SelectItem value={TransactionType.EXPENSE}>{t('form.expense')}</SelectItem>
                  <SelectItem value={TransactionType.INCOME}>{t('form.income')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">{t('form.amount')}</Label>
              <Input 
                type="number" 
                placeholder="Ví dụ: 25000" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-sm font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-wider">{t('form.category')}</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800">
                <SelectValue placeholder={t('form.selectCategory')} />
              </SelectTrigger>
              <SelectContent className="bg-[#12161f] border-[#1e293b] text-zinc-100 max-h-[250px] overflow-y-auto">
                {categories
                  .filter(c => c.type === type && !c.parentId)
                  .map(parent => {
                    const parentOption = (
                      <SelectItem key={parent.id} value={parent.id} className="font-bold text-[#6366f1] focus:bg-[#6366f1]/20">
                        {parent.name}
                      </SelectItem>
                    );
                    const subOptions = categories
                      .filter(c => c.parentId === parent.id)
                      .map(sub => (
                        <SelectItem key={sub.id} value={sub.id} className="pl-6 text-zinc-300 focus:bg-zinc-850">
                          {sub.name}
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
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">{t('form.date')}</Label>
              <Input 
                type="date" 
                value={date}
                onChange={e => setDate(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100"
                style={{ colorScheme: 'dark' }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">{t('form.note')}</Label>
              <Input 
                placeholder={t('form.notePlaceholder')} 
                value={note}
                onChange={e => setNote(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-sm text-zinc-100"
              />
            </div>
          </div>

          {/* Locket 1:1 Photo Mode Section */}
          <div className="border-t border-[#1e293b] pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-amber-400 text-xs uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 animate-pulse" /> CHẾ ĐỘ LOCKET 1:1
              </Label>
              {locketImage && (
                <button
                  type="button"
                  onClick={() => setLocketImage(null)}
                  className="text-red-400 hover:text-red-300 text-[10px] uppercase font-bold"
                >
                  Xóa ảnh
                </button>
              )}
            </div>

            {locketImage ? (
              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative w-44 h-44 rounded-2xl overflow-hidden border-4 border-amber-500/80 shadow-2xl bg-zinc-950 aspect-square">
                  <img src={locketImage} alt="Locket 1:1 Preview" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-0 right-0 text-center">
                    <span className="bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                      Locket Captured
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-950/60 rounded-xl p-3 border border-zinc-900 flex flex-col items-center justify-center min-h-[140px] space-y-3">
                {cameraActive ? (
                  <div className="flex flex-col items-center space-y-3 w-full">
                    <div className="relative w-40 h-40 rounded-xl overflow-hidden border-2 border-zinc-800 bg-black aspect-square">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 border-2 border-dashed border-amber-500/40 pointer-events-none rounded-xl" />
                    </div>
                    <div className="flex gap-2 w-full max-w-[240px]">
                      <Button
                        type="button"
                        onClick={capturePhoto}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs h-8 uppercase"
                      >
                        Chụp ảnh 📸
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={stopCamera}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs h-8 px-3"
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2.5">
                    <p className="text-zinc-500 text-[11px] max-w-[240px] mx-auto leading-relaxed">
                      Chụp ảnh hoặc tải lên khoảnh khắc chi tiêu thực tế theo tỷ lệ vàng 1:1 chuẩn ứng dụng Locket.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={startCamera}
                        className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 text-[11px] font-bold h-8 px-3.5 uppercase tracking-wide gap-1.5"
                      >
                        <Video className="w-3.5 h-3.5 text-amber-400" /> Snap Camera
                      </Button>
                      
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          id="locket-upload-file"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Label
                          htmlFor="locket-upload-file"
                          className="flex items-center justify-center border border-zinc-800 text-zinc-300 hover:bg-zinc-900 text-[11px] font-bold h-8 px-3.5 uppercase tracking-wide gap-1.5 rounded-md cursor-pointer transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 text-blue-400" /> Tải ảnh lên
                        </Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Location details section with post-merger Vietnam suggestions */}
          <div className="border-t border-[#1e293b] pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">
                {t('form.location')}
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={requestAndFetchLocation}
                disabled={isGettingLocation}
                className={`h-7 px-3 text-[10px] font-bold uppercase tracking-wider transition-all ${
                  isLocAttached 
                    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10' 
                    : 'border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {isGettingLocation ? t('form.gettingLocation') : isLocAttached ? 'Đã định vị GPS' : t('form.getLocation')}
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Input 
                  placeholder={t('form.placePlaceholder')} 
                  value={placeName}
                  onChange={e => setPlaceName(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-sm flex-1 text-zinc-100"
                />
                <Button
                  type="button"
                  onClick={searchCoordinatesFromPlace}
                  disabled={isSearchingPlace || !placeName.trim()}
                  className="bg-[#1e293b] hover:bg-zinc-800 border border-[#334155] text-zinc-300 h-9 shrink-0 text-xs px-2.5 font-bold"
                >
                  {isSearchingPlace ? '...' : 'Tìm bản đồ'}
                </Button>
              </div>

              {/* Administrative mergers list for rapid VN autocompletes */}
              <div className="flex flex-col gap-1.5 bg-zinc-950/45 p-2 rounded-lg border border-zinc-900">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-500">
                  ⚡ Gợi ý vùng miền địa lý (Sau sát nhập):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {VN_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setPlaceName(preset.name);
                        setLat(preset.lat);
                        setLng(preset.lng);
                        setIsLocAttached(true);
                        toast.success(`Đã chọn: ${preset.name}`);
                      }}
                      className="text-[9px] bg-zinc-900 text-zinc-300 border border-zinc-850 hover:bg-[#1e293b] rounded px-2 py-0.5 font-medium transition-colors cursor-pointer"
                    >
                      {preset.name.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {isLocAttached && lat && lng && (
                <div className="text-[10px] text-zinc-400 font-mono flex items-center justify-between px-2 bg-zinc-900/40 py-1.5 rounded border border-zinc-800/40">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
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
                    {t('form.removeLocation')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
            {t('form.cancel')}
          </Button>
          <Button onClick={handleSubmit} className="bg-[#6366f1] hover:bg-[#4f46e5] text-white">
            {t('form.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
