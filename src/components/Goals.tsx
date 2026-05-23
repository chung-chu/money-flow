import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Plus, Calendar, ChevronRight, Award } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { Goal } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    setGoals(StorageService.getGoals());
  }, []);

  const handleAddGoal = () => {
    const name = prompt('Goal name (e.g. Macbook Fund):');
    const target = prompt('Target amount:');
    if (name && target) {
      StorageService.addGoal({
        name,
        targetAmount: parseFloat(target),
        currentAmount: 0,
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        userId: 'demo'
      });
      setGoals(StorageService.getGoals());
      toast.success('Goal created');
    }
  };

  const handleContribute = (id: string, current: number) => {
    const amount = prompt('Contribution amount:');
    if (amount) {
      StorageService.updateGoal(id, current + parseFloat(amount));
      setGoals(StorageService.getGoals());
      toast.success('Nice! One step closer.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#12161F] border border-[#1E293B] rounded-lg flex items-center justify-center shadow-sm">
            <Target className="text-[#6366F1] w-5 h-5 font-bold" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-[#F8FAFC]">Financial Conquests</h3>
            <p className="text-[10px] text-[#94A3B8] uppercase tracking-[0.2em] font-bold">Accumulating long-term value</p>
          </div>
        </div>
        <Button onClick={handleAddGoal} className="bg-[#6366F1] hover:bg-[#4F46E5] text-white gap-2 text-xs font-bold h-10 shadow-sm">
          <Plus className="w-4 h-4" /> New Acquisition
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const percent = (goal.currentAmount / goal.targetAmount) * 100;
          return (
            <Card key={goal.id} className="bg-[#12161F] border-[#1E293B] group relative overflow-hidden transition-all hover:border-[#6366F1]/30">
               {percent >= 100 && (
                <div className="absolute top-3 right-3 z-10">
                  <Award className="text-[#10B981] w-6 h-6 animate-pulse" />
                </div>
              )}
              <CardContent className="p-8">
                <div className="space-y-8">
                  <div className="space-y-1">
                    <h4 className="text-xl font-bold text-[#E2E8F0] tracking-tight">{goal.name}</h4>
                    <p className="text-[10px] text-[#64748B] uppercase tracking-[0.2em] font-extrabold flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Target: {format(new Date(goal.deadline), 'MMM dd, yyyy')}
                    </p>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold font-mono tracking-tighter text-[#F8FAFC] italic">${goal.currentAmount.toLocaleString()}</p>
                      <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest">Aggregate of ${goal.targetAmount.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-[#6366F1] italic font-mono">{Math.round(percent)}%</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="h-1.5 w-full bg-[#0B0E14] rounded-full overflow-hidden border border-[#1E293B]">
                      <div 
                        className={`h-full transition-all duration-1000 ${percent >= 100 ? 'bg-[#10B981]' : 'bg-[#6366F1]'}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleContribute(goal.id, goal.currentAmount)}
                    className="w-full bg-[#1E293B] border border-[#334155] hover:bg-[#334155] text-[#94A3B8] font-bold uppercase tracking-widest text-[10px] h-10 shadow-sm"
                  >
                    Inject Capital
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {goals.length === 0 && (
          <div className="lg:col-span-3 py-24 text-center border border-dashed border-[#1E293B] bg-[#12161F]/50 rounded-3xl">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-5" />
            <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#475569]">No active target acquisitions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
