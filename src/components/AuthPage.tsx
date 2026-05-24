import React, { useState } from 'react';
import { 
  Phone, 
  Lock, 
  User, 
  Smartphone, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  UserCheck2,
  HelpCircle,
  Camera,
  LogOut,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface AuthPageProps {
  onLogin: (user: { id: string; name: string; phone: string; avatar: string }) => void;
}

const PREMIUM_AVATARS = [
  '🧑‍💻', '🤵', '👸', '🥷', '🦁', '🦉', '🦖', '🚀', '☕', '💰', '💎', '🎨'
];

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🧑‍💻');
  
  // OTP states
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [userOtp, setUserOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [timerInterval, setTimerInterval] = useState<any>(null);

  const startOtpCountdown = () => {
    setCountdown(60);
    if (timerInterval) clearInterval(timerInterval);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setTimerInterval(interval);
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || phone.length < 9) {
      toast.error('Vui lòng nhập số điện thoại hợp lệ (8 - 11 chữ số).');
      return;
    }

    if (!password || password.length < 4) {
      toast.error('Mật khẩu tối thiểu cần có 4 ký tự.');
      return;
    }

    // Load registered users from localStorage
    const users = JSON.parse(localStorage.getItem('moneyflow_users') || '[]');

    if (!isRegister) {
      // LOGIN MODE
      const existingUser = users.find((u: any) => u.phone === phone);
      if (!existingUser) {
        toast.error('Số điện thoại chưa được đăng ký trong hệ thống.');
        return;
      }
      if (existingUser.password !== password) {
        toast.error('Mật khẩu không chính xác. Xin thử lại!');
        return;
      }

      // Success
      onLogin(existingUser);
      toast.success(`Chào mừng quay trở lại, ${existingUser.name}! 👋`);
    } else {
      // REGISTRATION MODE
      if (!name.trim()) {
        toast.error('Vui lòng cung cấp Tên hiển thị.');
        return;
      }

      // Check duplicate
      const duplicate = users.find((u: any) => u.phone === phone);
      if (duplicate) {
        toast.error('Số điện thoại này đã được đăng ký trước đây.');
        return;
      }

      // Generate a dynamic 4-sign OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(otp);
      setStep('otp');
      startOtpCountdown();

      // Dispatch simulated SMS notification
      toast.info(`📩 [Tổng đài OTP] Mã xác minh tài khoản MoneyFlow OS của bạn là: ${otp}`, {
        duration: 15000,
        id: 'otp-notif'
      });
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();

    if (userOtp !== generatedOtp) {
      toast.error('Mã OTP không đúng hoặc đã hết hạn.');
      return;
    }

    if (timerInterval) clearInterval(timerInterval);

    // Save user to localStorage
    const newUser = {
      id: phone,
      phone,
      password,
      name,
      avatar,
      createdAt: new Date().toISOString()
    };

    const users = JSON.parse(localStorage.getItem('moneyflow_users') || '[]');
    users.push(newUser);
    localStorage.setItem('moneyflow_users', JSON.stringify(users));

    // Success
    onLogin(newUser);
    toast.success(`Đăng ký thành công! Chào mừng ${newUser.name} đến với MoneyFlow OS! 🎉`);
  };

  const handleDemoMode = () => {
    const demoUser = {
      id: 'demo',
      phone: '0900000000',
      password: 'demo',
      name: 'Khách hàng Demo',
      avatar: '🦊'
    };
    onLogin(demoUser);
    toast.success('Đã khởi động chế độ xem thử Demo!');
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-zinc-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-[#12161F] border border-[#1E293B] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all duration-300">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-[#6366F1] to-transparent shrink-0 opacity-80" />

        <div className="flex flex-col items-center text-center space-y-2 mb-8">
          <div className="w-12 h-12 bg-[#6366F1]/10 border border-[#6366F1]/30 rounded-xl flex items-center justify-center text-[#6366F1] shadow-inner mb-3">
            <Smartphone className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black italic text-slate-100 tracking-tight">
            {step === 'credentials' 
              ? (isRegister ? 'ĐĂNG KÝ TÀI KHOẢN' : 'ĐĂNG NHẬP HỆ THỐNG')
              : 'XÁC THỰC MÃ OTP'
            }
          </h2>
          <p className="text-xs text-[#94A3B8] font-sans">
            {step === 'credentials'
              ? (isRegister ? 'Khởi tạo tài khoản thực qua Số điện thoại bảo mật.' : 'Vui lòng điền thông tin truy cập tài khoản.')
              : `Mã OTP xác minh vừa được gửi về SĐT ${phone}.`
            }
          </p>
        </div>

        {step === 'credentials' ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4 font-sans text-xs">
            {isRegister && (
              <>
                <div className="space-y-1.5 animate-slide-up-sm">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-[#64748B]">Tên hiển thị của bạn</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type="text" 
                      placeholder="Ví dụ: Chung Chu, Nguyễn Huy..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-[#0B0E14] border border-[#1E293B] hover:border-zinc-800 text-zinc-100 text-xs px-10 h-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#6366f1]/40 transition-all font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-2.5 animate-slide-up-sm">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-[#64748B]">Biểu tượng Avatar</label>
                  <div className="flex items-center gap-3 bg-[#0B0E14] p-2.5 border border-[#1E293B] rounded-lg">
                    <span className="text-2xl select-none">{avatar}</span>
                    <div className="flex-1 flex flex-wrap gap-1.5">
                      {PREMIUM_AVATARS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setAvatar(emoji)}
                          className={`text-base p-1 hover:bg-[#1E293B] rounded-md transition-all active:scale-90 ${
                            avatar === emoji ? 'bg-indigo-500/25 ring-2 ring-[#6366f1]/50' : ''
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-[#64748B]">Số điện thoại tài khoản</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="tel" 
                  placeholder="Nhập số điện thoại gửi mã..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full bg-[#0B0E14] border border-[#1E293B] hover:border-zinc-800 text-zinc-100 text-xs px-10 h-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#6366f1]/40 transition-all font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-[#64748B]">Mật khẩu bảo vệ</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="password" 
                  placeholder="Nhập mật khẩu đặt..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#0B0E14] border border-[#1E293B] hover:border-zinc-800 text-zinc-100 text-xs px-10 h-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#6366f1]/40 transition-all font-mono font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#6366F1]/10 rounded-lg transition-colors mt-6"
            >
              {isRegister ? 'Đăng ký và gửi OTP' : 'Đăng nhập vào OS'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4 font-sans text-xs">
            <div className="space-y-1.5 text-center">
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-400">Tự động cấu hình OTP</label>
              
              <div className="p-3 bg-[#0B0E14] border border-[#1E293B] rounded-lg text-emerald-400 text-center font-bold text-xs space-y-1 my-2">
                <p>📩 Hệ thống tự tạo SMS OTP gửi đến thiết bị của bạn:</p>
                <p className="text-xl tracking-[0.2em] font-mono font-black border border-[#1B2533] p-1.5 bg-[#0e131d] inline-block rounded min-w-[120px] select-all my-1.5">
                  {generatedOtp}
                </p>
                <p className="text-[10px] text-zinc-500 font-normal">Hãy sao chép mã 4 số này và dán vào ô xác thực bên dưới.</p>
              </div>

              <input 
                type="text" 
                placeholder="Nhập mã OTP 4 số ở trên..."
                value={userOtp}
                onChange={(e) => setUserOtp(e.target.value.replace(/\D/g, '').substring(0, 4))}
                required
                maxLength={4}
                className="w-full bg-[#0B0E14] border border-[#1E293B] text-center tracking-[0.5em] text-zinc-100 text-lg h-12 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#6366f1]/40 transition-all font-mono font-black"
              />
            </div>

            <div className="flex justify-between items-center text-[11px] text-[#94A3B8] pt-2">
              <span>Còn lại: <strong className="text-[#6366F1] font-mono">{countdown} giây</strong></span>
              {countdown === 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    const otp = Math.floor(1000 + Math.random() * 9000).toString();
                    setGeneratedOtp(otp);
                    startOtpCountdown();
                    toast.info(`📩 [Tổng đài OTP] Mã xác minh mới gửi lại của bạn là: ${otp}`);
                  }}
                  className="font-bold text-[#6366F1] hover:underline"
                >
                  Gửi lại OTP
                </button>
              ) : (
                <span className="opacity-40">Gửi lại mã</span>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="flex-1 h-10 bg-zinc-900 border border-[#1E293B] hover:bg-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px] rounded-lg"
              >
                Quay lại
              </button>
              <button
                type="submit"
                className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5 rounded-lg shadow-lg shadow-indigo-600/10 cursor-pointer"
              >
                Xác nhận
                <ShieldCheck className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        <div className="flex items-center justify-between mt-8 pt-4 border-t border-[#1E293B]/60 text-xs font-sans">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setStep('credentials');
            }}
            className="text-indigo-400 hover:text-indigo-300 font-bold tracking-tight"
          >
            {isRegister ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
          </button>

          <button
            onClick={handleDemoMode}
            className="text-emerald-400 hover:text-emerald-300 font-extrabold tracking-widest uppercase text-[9px] flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"
          >
            Chạy thử Demo 🦊
          </button>
        </div>

      </div>
    </div>
  );
}
