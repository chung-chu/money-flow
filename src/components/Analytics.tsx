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
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-[#6366F1]/10 to-[#4338CA]/5 border border-[#4338CA]/30 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#6366F1] rounded-xl flex items-center justify-center shadow-lg shadow-[#6366F1]/20">
            <BrainCircuit className="text-white w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">AI Smart Analyst</h3>
            <p className="text-[#94A3B8] text-xs font-medium">Gemini 3.5 Flash is actively monitoring your drift</p>
          </div>
        </div>
        <Button 
          onClick={runAnalysis} 
          disabled={loading}
          className="bg-[#6366F1] text-white hover:bg-[#4F46E5] font-bold uppercase tracking-widest text-[10px] px-6 h-9"
        >
          {loading ? 'Processing...' : 'Sync Insights'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insight Cards */}
        <div className="space-y-4">
          <h4 className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-[#6366F1]" /> Intelligence Feed
          </h4>
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-[#12161F] border border-[#1E293B] rounded-xl animate-pulse" />
            ))
          ) : analysis?.insights ? (
            analysis.insights.map((insight: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-[#12161F] border-[#1E293B] overflow-hidden group hover:border-[#6366F1]/30 transition-all">
                  <div className={`h-1 w-full ${
                    insight.type === 'warning' ? 'bg-[#F43F5E]' : 
                    insight.type === 'success' ? 'bg-[#10B981]' : 'bg-[#6366F1]'
                  }`} />
                  <CardContent className="p-6 flex gap-4">
                    <div className="mt-1">
                      {insight.type === 'warning' && <AlertCircle className="text-[#F43F5E] w-5 h-5" />}
                      {insight.type === 'success' && <CheckCircle2 className="text-[#10B981] w-5 h-5" />}
                      {insight.type === 'info' && <Info className="text-[#6366F1] w-5 h-5" />}
                    </div>
                    <div>
                      <h5 className="font-bold text-[#F8FAFC] mb-1 group-hover:text-white transition-colors">{insight.title}</h5>
                      <p className="text-[#94A3B8] text-sm leading-relaxed">{insight.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-[#12161F] border border-dashed border-[#1E293B] rounded-xl text-[#475569]">
              <Sparkles className="w-10 h-10 mx-auto mb-4 opacity-10" />
              <p className="text-xs uppercase font-bold tracking-widest opacity-40">Require more ledger entries</p>
            </div>
          )}
        </div>

        {/* Forecast & Trends */}
        <div className="space-y-4">
          <h4 className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-[0.2em] mb-4">Financial Trajectory</h4>
          <Card className="bg-[#12161F] border-[#1E293B] p-8 flex flex-col justify-between h-[400px] shadow-sm">
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[#6366F1]">
                <Calendar className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">30-Day Outlook</span>
              </div>
              {loading ? (
                <div className="space-y-3">
                  <div className="h-6 bg-[#1E293B] rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-[#1E293B] rounded animate-pulse w-full" />
                  <div className="h-4 bg-[#1E293B] rounded animate-pulse w-5/6" />
                </div>
              ) : (
                <div className="space-y-8">
                  <p className="text-lg text-[#E2E8F0] font-medium leading-relaxed tracking-tight">
                    {analysis?.forecast || "Your economic signal is stabilizing. We'll provide a predictive trajectory once more patterns emerge."}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-8 pt-8 border-t border-[#1E293B]">
                    <div>
                      <span className="text-[10px] text-[#94A3B8] uppercase font-extrabold tracking-widest block mb-1">Projected Surplus</span>
                      <span className="text-2xl font-bold font-mono text-[#10B981]">$2,450.00</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#94A3B8] uppercase font-extrabold tracking-widest block mb-1">Exposure</span>
                      <span className="text-2xl font-bold font-mono text-[#6366F1]">MINIMAL</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-[#1E293B]/50 p-5 rounded-xl border border-[#334155]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] text-[#94A3B8] font-bold tracking-widest uppercase">Solvency Health</span>
                <span className="text-[10px] text-[#10B981] font-extrabold">85% OPTIMAL</span>
              </div>
              <div className="w-full h-1.5 bg-[#0B0E14] rounded-full overflow-hidden border border-[#334155]">
                <div className="w-[85%] h-full bg-[#10B981]" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
