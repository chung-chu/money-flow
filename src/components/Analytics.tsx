import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  AlertCircle, 
  Info, 
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Transaction, Category } from '../types';
import { GeminiService } from '../services/geminiService';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'motion/react';

interface AnalyticsProps {
  transactions: Transaction[];
  categories: Category[];
}

export default function Analytics({ transactions, categories }: AnalyticsProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const result = await GeminiService.analyzeSpending(transactions, categories);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (transactions.length > 3) {
      runAnalysis();
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* AI Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-5 bg-gradient-to-r from-[#6366F1]/10 to-[#4338CA]/5 border border-[#4338CA]/30 rounded-lg">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 bg-[#6366F1] rounded-md flex items-center justify-center shrink-0 shadow-lg shadow-[#6366F1]/20">
            <BrainCircuit className="text-white w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Trợ lý Phân tích Tài chính AI</h3>
            <p className="text-[#94A3B8] text-xs font-medium font-sans leading-relaxed">Gemini 3.5 Flash phân tích dữ liệu ròng, đề xuất tối ưu hóa tài chính thông minh</p>
          </div>
        </div>
        <Button 
          onClick={runAnalysis} 
          disabled={loading}
          className="w-full sm:w-auto bg-[#6366F1] text-white hover:bg-[#4F46E5] font-bold uppercase tracking-widest text-[10px] px-6 h-9 cursor-pointer rounded-md shrink-0"
        >
          {loading ? 'Đang phân tích...' : 'Cập nhật Báo cáo'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insight Cards */}
        <div className="space-y-4">
          <h4 className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2 font-sans">
            <Sparkles className="w-3 h-3 text-[#6366F1]" /> Chỉ số thông minh & Đề xuất hành động
          </h4>
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-[#12161F] border border-[#1E293B] rounded-lg animate-pulse" />
            ))
          ) : analysis?.insights ? (
            analysis.insights.map((insight: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-[#12161F] border-[#1E293B] overflow-hidden group hover:border-[#6366F1]/30 transition-all rounded-lg">
                  <div className={`h-1 w-full ${
                    insight.type === 'warning' ? 'bg-[#F43F5E]' : 
                    insight.type === 'success' ? 'bg-[#10B981]' : 'bg-[#6366F1]'
                  }`} />
                  <CardContent className="p-5 flex gap-4">
                    <div className="mt-1 shrink-0">
                      {insight.type === 'warning' && <AlertCircle className="text-[#F43F5E] w-5 h-5" />}
                      {insight.type === 'success' && <CheckCircle2 className="text-[#10B981] w-5 h-5" />}
                      {insight.type === 'info' && <Info className="text-[#6366F1] w-5 h-5" />}
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-[#F8FAFC] mb-1 group-hover:text-white transition-colors">{insight.title}</h5>
                      <p className="text-[#94A3B8] text-xs leading-relaxed">{insight.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-[#12161F] border border-dashed border-[#1E293B] rounded-lg text-[#475569]">
              <Sparkles className="w-10 h-10 mx-auto mb-4 opacity-10" />
              <p className="text-xs uppercase font-extrabold tracking-widest opacity-40">Cần ít nhất 4 giao dịch để lập báo cáo AI</p>
            </div>
          )}
        </div>

        {/* Forecast & Trends */}
        <div className="space-y-4">
          <h4 className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-[0.2em] mb-4">Dự báo dòng tiền & Đích đến</h4>
          <Card className="bg-[#12161F] border-[#1E293B] p-5 sm:p-8 flex flex-col justify-between min-h-[380px] sm:h-[400px] shadow-sm rounded-lg">
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[#6366F1]">
                <Calendar className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Tầm nhìn kinh tế 30 ngày</span>
              </div>
              {loading ? (
                <div className="space-y-3">
                  <div className="h-6 bg-[#1E293B] rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-[#1E293B] rounded animate-pulse w-full" />
                  <div className="h-4 bg-[#1E293B] rounded animate-pulse w-5/6" />
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-sm sm:text-base text-[#E2E8F0] font-medium leading-relaxed tracking-tight">
                    {analysis?.forecast || "Tín hiệu kinh tế đang dần tích lũy. Chúng tôi sẽ tự động đưa ra dự báo mô hình dòng tiền khi nhận thấy thêm các thói quen chi tiêu của bạn."}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 pt-6 border-t border-[#1E293B]">
                    <div>
                      <span className="text-[10px] text-[#94A3B8] uppercase font-extrabold tracking-widest block mb-1">Thặng dư dự kiến</span>
                      <span className="text-xl sm:text-2xl font-bold font-mono text-[#10B981]">+8.5M đ</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#94A3B8] uppercase font-extrabold tracking-widest block mb-1">Cảnh báo rủi ro</span>
                      <span className="text-xl sm:text-2xl font-bold font-mono text-[#6366F1] uppercase">AN TOÀN</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-[#1E293B]/50 p-4 sm:p-5 rounded-lg border border-[#334155]/60 mt-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] text-[#94A3B8] font-bold tracking-widest uppercase">Độ bền ngân sách</span>
                <span className="text-[10px] text-[#10B981] font-extrabold">92% TỐI ƯU</span>
              </div>
              <div className="w-full h-1.5 bg-[#0B0E14] rounded-full overflow-hidden border border-[#334155]/40">
                <div className="w-[92%] h-full bg-[#10B981]" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
