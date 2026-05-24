import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  BrainCircuit, 
  TrendingDown, 
  Wallet, 
  PieChart as PieIcon,
  MessageSquare,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { Transaction, Category } from '../types';
import { GeminiService, ChatMessage } from '../services/geminiService';
import { toast } from 'sonner';

interface AiChatbotProps {
  transactions: Transaction[];
  categories: Category[];
}

export default function AiChatbot({ transactions, categories }: AiChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'model', 
      text: 'Xin chào! Tôi là Trợ lý tài chính AI thông minh của MoneyFlow OS được lập trình bởi Chung Chu. 🇻🇳\n\nTôi có thể giúp bạn kiểm tra phân tích số dư tài sinh, thống kê dòng tiền và vạch ra chiến lược tài chính của bạn hoàn toàn bằng tiếng Việt.\n\nBạn có thể nhấn các gợi ý nhanh bên dưới hoặc nhắn trực tiếp cho tôi nhé! 👇' 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    { title: "Kiểm tra số dư 📊", prompt: "Hãy dựa vào danh sách giao dịch, tính toán số dư thực tế hiện tại của tôi (Tổng thu - Tổng chi) và liệt kê chi tiết." },
    { title: "Ăn uống tháng này 🍕", prompt: "Thống kê riêng cho danh mục ăn uống: Tôi đã tiêu bao nhiêu cho mục này, có bất thường gì không?" },
    { title: "Lời khuyên tiết kiệm 💡", prompt: "Hãy phân tích chi tiêu của tôi và đưa ra 3 lời khuyên tài chính cụ thể để tiết kiệm tiền hiệu quả hơn." },
    { title: "Giao dịch lớn nhất ⚠️", prompt: "Liệt kê các khoản chi tiêu lớn nhất của tôi gần đây cùng địa danh cụ thể." }
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call secure full-stack Express API proxied through GeminiService
      const reply = await GeminiService.chatWithAi(
        textToSend, 
        messages, 
        transactions, 
        categories
      );
      
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: 'Rất tiếc, đã xảy ra sự cố khi kết nối với máy chủ AI. Xin hãy kiểm tra lại kết nối mạng của bạn.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      { 
        role: 'model', 
        text: 'Vâng! Cuộc trò chuyện đã được làm mới. Tôi sẵn sàng phân tích lại dữ liệu tài chính phục vụ bạn! 💡' 
      }
    ]);
    toast.success('Đã làm mới dữ liệu trò chuyện AI.');
  };

  // Safe custom Markdown formatter helper that supports tables, lists, formatting, paragraphs, and styling without breaking React 19 compatibility
  const renderMessageText = (text: string) => {
    const lines = text.split('\n');
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];

    const elements: React.ReactNode[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Check if line is a markdown table row (e.g., | Cột 1 | Cột 2 |)
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        const cells = trimmed.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
        
        // Skip separator rows (e.g. |---|---|)
        if (cells.every(c => c.match(/^[:\s\-]+$/))) {
          return;
        }

        if (tableHeaders.length === 0) {
          tableHeaders = cells;
        } else {
          tableRows.push(cells);
        }
        return;
      } else if (inTable) {
        // Table finished, render gathered table first
        elements.push(
          <div key={`table-${idx}`} className="overflow-x-auto my-3 rounded-lg border border-[#1e293b] bg-zinc-950/50">
            <table className="w-full text-[11px] text-[#e2e8f0] border-collapse">
              <thead>
                <tr className="bg-[#1e293b]/70 border-b border-[#1e293b]">
                  {tableHeaders.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left font-extrabold uppercase text-[#94a3b8] tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/40">
                {tableRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-zinc-900/30">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 font-medium font-mono whitespace-nowrap">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        inTable = false;
        tableHeaders = [];
        tableRows = [];
      }

      // Render headings
      if (trimmed.startsWith('###')) {
        elements.push(
          <h4 key={idx} className="font-extrabold text-sm text-indigo-400 mt-4 mb-2 tracking-tight">
            {trimmed.replace(/^###\s+/, '')}
          </h4>
        );
        return;
      }
      if (trimmed.startsWith('##')) {
        elements.push(
          <h3 key={idx} className="font-extrabold text-base text-[#6366f1] mt-5 mb-2.5 tracking-tight uppercase border-b border-[#1e293b] pb-1">
            {trimmed.replace(/^##\s+/, '')}
          </h3>
        );
        return;
      }
      if (trimmed.startsWith('#')) {
        elements.push(
          <h2 key={idx} className="font-black text-lg text-slate-100 mt-6 mb-3 tracking-tighter uppercase">
            {trimmed.replace(/^#\s+/, '')}
          </h2>
        );
        return;
      }

      // Render bulletins
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        const content = formatBoldWords(trimmed.replace(/^[\*\-]\s+/, ''));
        elements.push(
          <div key={idx} className="flex items-start gap-2.5 pl-2 my-1.5 leading-relaxed text-[#d4d4d8]">
            <span className="text-[#6366f1] select-none text-xs mt-1 shrink-0">•</span>
            <span className="text-xs">{content}</span>
          </div>
        );
        return;
      }

      // Check for empty rows
      if (!trimmed) {
        elements.push(<div key={idx} className="h-2.5" />);
        return;
      }

      // Default paragraph line with styled bold text
      elements.push(
        <p key={idx} className="text-xs text-[#d4d4d8] leading-relaxed my-1.5">
          {formatBoldWords(trimmed)}
        </p>
      );
    });

    // Handle trailing tables if text ends while in table
    if (inTable && tableHeaders.length > 0) {
      elements.push(
        <div key="table-trailing" className="overflow-x-auto my-3 rounded-lg border border-[#1e293b] bg-zinc-950/50">
          <table className="w-full text-[11px] text-[#e2e8f0] border-collapse">
            <thead>
              <tr className="bg-[#1e293b]/70 border-b border-[#1e293b]">
                {tableHeaders.map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left font-extrabold uppercase text-[#94a3b8] tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/40">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-zinc-900/40">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 font-mono whitespace-nowrap">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return elements;
  };

  // Formatter for markdown style bold words (**text**)
  const formatBoldWords = (txt: string) => {
    const parts = txt.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-extrabold text-[#6366f1]">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <>
      {/* 1. FLOATING ACTION AI GLOBE BUTTON */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-[99] flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#6366f1] to-[#a855f7] hover:from-[#5143d9] hover:to-[#9333ea] text-white rounded-full shadow-2xl shadow-[#6366F1]/30 transition-transform hover:scale-105 active:scale-95 focus:outline-none cursor-pointer group"
        >
          <div className="relative">
            <BrainCircuit className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border border-white rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border border-white rounded-full" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline-block">AI Trợ lý</span>
        </button>
      )}

      {/* 2. CHAT DRAWER PANEL */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-[999] w-[370px] max-w-[calc(100vw-32px)] h-[510px] rounded-2xl bg-[#0c1017] border border-[#1e293b] flex flex-col shadow-2xl shadow-[#000]/60 overflow-hidden animate-fade-in font-sans">
          
          {/* Header Area */}
          <div className="px-4 py-3 bg-[#111724] border-b border-[#1e293b] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold tracking-widest text-[#6366f1] uppercase">MoneyFlow AI Assistant</h3>
                <span className="text-[9px] text-emerald-400 font-bold tracking-wider uppercase flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Trực tuyến (VN)
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={handleResetChat}
                title="Làm mới cuộc trò chuyện"
                className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-zinc-500 hover:text-[#f43f5e] rounded hover:bg-[#f43f5e]/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Conversation Body */}
          <div 
            ref={scrollRef}
            className="flex-1 p-4 overflow-y-auto space-y-4 bg-zinc-950/40 scrollbar-thin"
          >
            {messages.map((msg, index) => {
              const isAi = msg.role === 'model';
              return (
                <div 
                  key={index} 
                  className={`flex ${isAi ? 'justify-start' : 'justify-end'} animate-slide-up-sm`}
                >
                  <div 
                    className={`p-3.5 rounded-2xl max-w-[88%] text-xs shadow-sm ${
                      isAi 
                        ? 'bg-[#12161f] border border-[#1e293b]/70 rounded-tl-none text-zinc-200' 
                        : 'bg-gradient-to-tr from-[#6366f1] to-[#7c3aed] text-white rounded-tr-none font-medium'
                    }`}
                  >
                    <div className="whitespace-pre-wrap select-text">
                      {isAi ? renderMessageText(msg.text) : msg.text}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#12161f] border border-[#1e293b]/70 p-3 rounded-2xl rounded-tl-none flex items-center gap-2 text-zinc-400">
                  <BrainCircuit className="w-4.5 h-4.5 text-indigo-400 animate-spin" />
                  <span className="text-[11px] font-bold uppercase tracking-wider animate-pulse">Đang thẩm định số liệu...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Preset Buttons */}
          <div className="px-4 py-2 bg-[#0c1017] border-t border-[#1e293b]/30">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-extrabold block mb-1.5">
              💡 Bấm phím tắt để phân tích nhanh:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(p.prompt)}
                  disabled={isLoading}
                  className="text-[10px] bg-[#12161f] hover:bg-[#1e293b]/60 text-zinc-300 hover:text-white border border-zinc-850 rounded-lg px-2 py-1 font-semibold transition-all cursor-pointer whitespace-nowrap"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Feet Input Bar */}
          <div className="p-3 bg-[#111724] border-t border-[#1e293b] flex gap-2">
            <input 
              type="text"
              placeholder="Hỏi về chi tiêu, số dư, danh mục..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSendMessage(inputValue);
              }}
              className="bg-zinc-950 border border-zinc-850 h-9 px-3 text-xs flex-1 text-zinc-100 placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#6366f1]/40"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={isLoading || !inputValue.trim()}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#6366f1] hover:bg-[#4F46E5] disabled:bg-zinc-800 disabled:text-zinc-600 text-white transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          
        </div>
      )}
    </>
  );
}
