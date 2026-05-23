import React, { useState, useMemo } from 'react';
// @ts-ignore
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Transaction, TransactionType, Category } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Map as MapIcon,
  Navigation,
  Store,
  Clock,
  Calendar,
  Compass,
  Tag,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  MousePointerClick
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

// @ts-ignore
import L from 'leaflet';

// Utility formatters for Vietnamese Dong (VND)
const formatVND = (num: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};

const formatShortVND = (num: number) => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + ' tỷ ₫';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + ' triệu ₫';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + 'K ₫';
  }
  return num + ' ₫';
};

interface MapAnalysisProps {
  transactions: Transaction[];
  categories: Category[];
}

export default function MapAnalysis({ transactions, categories }: MapAnalysisProps) {
  // Tab control: 'geospatial' (Space), 'temporal' (Time), 'hotspots' (Location), 'purpose' (Purpose)
  const [activeSubTab, setActiveSubTab] = useState<'geospatial' | 'temporal' | 'hotspots' | 'purpose'>('geospatial');
  
  // Geospatial filter: 'all' | 'expense' | 'income'
  const [geoFilter, setGeoFilter] = useState<'all' | 'expense' | 'income'>('all');

  // Filter geo-tagged transactions
  const geoTaggedTransactions = useMemo(() => {
    return transactions.filter(t => t.location && typeof t.location.lat === 'number' && typeof t.location.lng === 'number');
  }, [transactions]);

  // Display filtered array of markers
  const filteredMarkers = useMemo(() => {
    if (geoFilter === 'expense') {
      return geoTaggedTransactions.filter(t => t.type === TransactionType.EXPENSE);
    }
    if (geoFilter === 'income') {
      return geoTaggedTransactions.filter(t => t.type === TransactionType.INCOME);
    }
    return geoTaggedTransactions;
  }, [geoTaggedTransactions, geoFilter]);

  // Map center logic: focal point based on visible nodes or defaults to Saigon center
  const center: [number, number] = useMemo(() => {
    if (filteredMarkers.length > 0) {
      const last = filteredMarkers[filteredMarkers.length - 1];
      if (last.location) {
        return [last.location.lat, last.location.lng];
      }
    }
    return [10.762622, 106.660172]; // Ho Chi Minh City
  }, [filteredMarkers]);

  // Dynamic Colored DivIcons for Leaflet (Avoid default icon loading problems)
  const createMarkerIcon = (type: TransactionType) => {
    const isExpense = type === TransactionType.EXPENSE;
    const colorClass = isExpense ? 'bg-[#EF4444]' : 'bg-[#10B981]';
    const textSymbol = isExpense ? '💸' : '💰';
    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-[#1E293B] shadow-2xl ${colorClass} text-white font-extrabold text-[13px] animate-fade-in transition-all hover:scale-110">
          ${textSymbol}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  };

  // --- 1. GEOSPATIAL STATISTICS (Không gian) ---
  const geospatialSummary = useMemo(() => {
    const expenses = geoTaggedTransactions.filter(t => t.type === TransactionType.EXPENSE);
    const incomes = geoTaggedTransactions.filter(t => t.type === TransactionType.INCOME);
    
    const totalExpVal = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncVal = incomes.reduce((sum, t) => sum + t.amount, 0);

    return {
      expenseCount: expenses.length,
      incomeCount: incomes.length,
      totalExpense: totalExpVal,
      totalIncome: totalIncVal
    };
  }, [geoTaggedTransactions]);

  // --- 2. TEMPORAL STATISTICS (Thời gian) ---
  const temporalStats = useMemo(() => {
    // A. Hourly Shifts
    const shifts = {
      morning: { label: 'Sáng (06:00 - 11:59)', key: 'morning', count: 0, amount: 0, percentage: 0, color: '#fb923c' },
      afternoon: { label: 'Chiều (12:00 - 17:59)', key: 'afternoon', count: 0, amount: 0, percentage: 0, color: '#38bdf8' },
      evening: { label: 'Tối (18:00 - 21:59)', key: 'evening', count: 0, amount: 0, percentage: 0, color: '#6366f1' },
      night: { label: 'Đêm muộn (22:00 - 05:59)', key: 'night', count: 0, amount: 0, percentage: 0, color: '#a855f7' }
    };

    let totalAmount = 0;
    transactions.forEach(t => {
      if (!t.createdAt) return;
      const dateObj = new Date(t.createdAt);
      // Fallback if timestamp cannot parsed correctly
      if (isNaN(dateObj.getTime())) return;
      
      const hour = dateObj.getHours();
      totalAmount += t.amount;

      if (hour >= 6 && hour < 12) {
        shifts.morning.count++;
        shifts.morning.amount += t.amount;
      } else if (hour >= 12 && hour < 18) {
        shifts.afternoon.count++;
        shifts.afternoon.amount += t.amount;
      } else if (hour >= 18 && hour < 22) {
        shifts.evening.count++;
        shifts.evening.amount += t.amount;
      } else {
        shifts.night.count++;
        shifts.night.amount += t.amount;
      }
    });

    // Calculate percentages
    const values = Object.values(shifts);
    values.forEach(v => {
      v.percentage = totalAmount > 0 ? parseFloat(((v.amount / totalAmount) * 100).toFixed(1)) : 0;
    });

    // B. Day of Week Pattern
    const daysData = [
      { dayKey: 1, name: 'Thứ 2', count: 0, amount: 0 },
      { dayKey: 2, name: 'Thứ 3', count: 0, amount: 0 },
      { dayKey: 3, name: 'Thứ 4', count: 0, amount: 0 },
      { dayKey: 4, name: 'Thứ 5', count: 0, amount: 0 },
      { dayKey: 5, name: 'Thứ 6', count: 0, amount: 0 },
      { dayKey: 6, name: 'Thứ 7', count: 0, amount: 0 },
      { dayKey: 0, name: 'Chủ Nhật', count: 0, amount: 0 }
    ];

    transactions.forEach(t => {
      const dateParts = t.date.split('-');
      if (dateParts.length === 3) {
        const d = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        if (!isNaN(d.getTime())) {
          const dayIdx = d.getDay();
          const targetDay = daysData.find(day => day.dayKey === dayIdx);
          if (targetDay) {
            targetDay.count++;
            targetDay.amount += t.amount;
          }
        }
      }
    });

    return {
      shifts: values,
      days: daysData
    };
  }, [transactions]);

  // --- 3. LOCATION HOTSPOTS (Vị trí) ---
  const locationStats = useMemo(() => {
    const map: Record<string, { placeName: string; count: number; totalExpense: number; totalIncome: number; lat?: number; lng?: number }> = {};
    
    transactions.forEach(t => {
      const place = t.placeName?.trim();
      if (!place) return;
      const key = place.toLowerCase();
      
      if (!map[key]) {
        map[key] = {
          placeName: place,
          count: 0,
          totalExpense: 0,
          totalIncome: 0,
          lat: t.location?.lat,
          lng: t.location?.lng
        };
      }

      map[key].count++;
      if (t.type === TransactionType.EXPENSE) {
        map[key].totalExpense += t.amount;
      } else {
        map[key].totalIncome += t.amount;
      }
      if (t.location) {
        map[key].lat = t.location.lat;
        map[key].lng = t.location.lng;
      }
    });

    const list = Object.values(map);
    // Sort locations by overall flow (expense + income)
    const sorted = list.sort((a, b) => (b.totalExpense + b.totalIncome) - (a.totalExpense + a.totalIncome));
    
    // Top spent is the location with maximum expense
    const maxExpenseLoc = [...list].sort((a, b) => b.totalExpense - a.totalExpense)[0] || null;
    // Top income is the location with maximum income
    const maxIncomeLoc = [...list].sort((a, b) => b.totalIncome - a.totalIncome)[0] || null;

    return {
      list: sorted,
      topExpenseLoc: maxExpenseLoc && maxExpenseLoc.totalExpense > 0 ? maxExpenseLoc : null,
      topIncomeLoc: maxIncomeLoc && maxIncomeLoc.totalIncome > 0 ? maxIncomeLoc : null
    };
  }, [transactions]);

  // --- 4. PURPOSE/CATEGORIAL FLOW (Mục đích) ---
  const purposeStats = useMemo(() => {
    const parentCategoriesMap: Record<string, { id: string; name: string; color: string; total: number; count: number; subs: Record<string, { name: string; total: number; count: number }> }> = {};
    
    // Seed parents
    categories.forEach(cat => {
      if (!cat.parentId) {
        parentCategoriesMap[cat.id] = {
          id: cat.id,
          name: cat.name,
          color: cat.color,
          total: 0,
          count: 0,
          subs: {}
        };
      }
    });

    let totalExpenseFlow = 0;

    transactions.forEach(t => {
      if (t.type !== TransactionType.EXPENSE) return; // focus statistics on spent purposes (expenses)
      totalExpenseFlow += t.amount;

      let categoryInfo = categories.find(c => c.id === t.categoryId);
      if (!categoryInfo) return;

      let parentId = categoryInfo.parentId ? categoryInfo.parentId : categoryInfo.id;
      let isSub = !!categoryInfo.parentId;

      let parentObj = parentCategoriesMap[parentId];
      if (parentObj) {
        parentObj.total += t.amount;
        parentObj.count++;

        if (isSub) {
          if (!parentObj.subs[categoryInfo.id]) {
            parentObj.subs[categoryInfo.id] = {
              name: categoryInfo.name,
              total: 0,
              count: 0
            };
          }
          parentObj.subs[categoryInfo.id].total += t.amount;
          parentObj.subs[categoryInfo.id].count++;
        } else {
          // If transaction hits parent directly, count it under a generic fallback
          const defaultKey = `${parentId}-root`;
          if (!parentObj.subs[defaultKey]) {
            parentObj.subs[defaultKey] = {
              name: `Khác (${parentObj.name})`,
              total: 0,
              count: 0
            };
          }
          parentObj.subs[defaultKey].total += t.amount;
          parentObj.subs[defaultKey].count++;
        }
      }
    });

    // Format list sorted by total spent
    const list = Object.values(parentCategoriesMap)
      .filter(p => p.total > 0)
      .sort((a, b) => b.total - a.total)
      .map(p => {
        const subList = Object.values(p.subs)
          .sort((x, y) => y.total - x.total);
        return {
          ...p,
          subsArray: subList,
          percentage: totalExpenseFlow > 0 ? parseFloat(((p.total / totalExpenseFlow) * 100).toFixed(1)) : 0
        };
      });

    return {
      list,
      totalExpenseFlow
    };
  }, [transactions, categories]);

  return (
    <div className="space-y-8">
      {/* Header and Dashboard Tabs */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-[#1E293B]/60 pb-6">
        <div>
          <h3 className="text-2xl font-black text-[#F8FAFC] tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-[#6366F1]" /> Thống Kê Đa Chiều
          </h3>
          <p className="text-[10px] text-[#64748B] uppercase tracking-[0.25em] font-extrabold mt-1">Cơ cấu Không gian, Thời gian, Đại lý Vị trí và Mục tiêu chi tiêu</p>
        </div>

        {/* Tab triggers */}
        <div className="flex items-center gap-1.5 bg-[#12161F]/80 p-1 border border-[#1E293B]/70 rounded-xl max-w-full overflow-x-auto">
          <Button
            onClick={() => setActiveSubTab('geospatial')}
            className={`text-xs px-4 py-2 h-8 rounded-lg font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'geospatial'
                ? 'bg-[#6366F1] text-white shadow shadow-[#6366F1]/20'
                : 'bg-transparent text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1E293B]/40'
            }`}
          >
            📍 Không Gian
          </Button>
          <Button
            onClick={() => setActiveSubTab('temporal')}
            className={`text-xs px-4 py-2 h-8 rounded-lg font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'temporal'
                ? 'bg-[#6366F1] text-white shadow shadow-[#6366F1]/20'
                : 'bg-transparent text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1E293B]/40'
            }`}
          >
            ⏱ Thời Gian
          </Button>
          <Button
            onClick={() => setActiveSubTab('hotspots')}
            className={`text-xs px-4 py-2 h-8 rounded-lg font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'hotspots'
                ? 'bg-[#6366F1] text-white shadow shadow-[#6366F1]/20'
                : 'bg-transparent text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1E293B]/40'
            }`}
          >
            🏢 Vị Trí
          </Button>
          <Button
            onClick={() => setActiveSubTab('purpose')}
            className={`text-xs px-4 py-2 h-8 rounded-lg font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'purpose'
                ? 'bg-[#6366F1] text-white shadow shadow-[#6366F1]/20'
                : 'bg-transparent text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1E293B]/40'
            }`}
          >
            🎯 Mục Đích
          </Button>
        </div>
      </div>

      {/* --- TAB PANEL 1: GEOSPATIAL ANALYSIS (Không Gian) --- */}
      {activeSubTab === 'geospatial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="bg-[#12161F] border-[#1E293B] hover:border-[#6366F1]/20 transition-all p-5 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#6366F1]/10 flex items-center justify-center text-[#6366F1]">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] uppercase font-extrabold tracking-widest block">Điểm dịch địa lý</span>
                <span className="text-xl font-black text-slate-100 font-mono">{geoTaggedTransactions.length}</span>
                <span className="text-[10px] text-zinc-500 block">vị trí đã lưu trong lịch sử</span>
              </div>
            </Card>

            <Card className="bg-[#12161F] border-[#1E293B] hover:border-[#EF4444]/20 transition-all p-5 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#EF4444]/15 flex items-center justify-center text-[#EF4444]">
                <ArrowDownRight className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] uppercase font-extrabold tracking-widest block">Chi Tiêu Định Vị</span>
                <span className="text-xl font-black text-[#EF4444] font-mono">{formatShortVND(geospatialSummary.totalExpense)}</span>
                <span className="text-[10px] text-zinc-500 block">qua {geospatialSummary.expenseCount} địa điểm tiêu tiền</span>
              </div>
            </Card>

            <Card className="bg-[#12161F] border-[#1E293B] hover:border-[#10B981]/20 transition-all p-5 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#10B981]/15 flex items-center justify-center text-[#10B981]">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] uppercase font-extrabold tracking-widest block">Thu Nhập Định Vị</span>
                <span className="text-xl font-black text-[#10B981] font-mono">{formatShortVND(geospatialSummary.totalIncome)}</span>
                <span className="text-[10px] text-zinc-500 block">qua {geospatialSummary.incomeCount} địa điểm nhận tiền</span>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-3 bg-[#12161F] border-[#1E293B] overflow-hidden rounded-2xl h-[550px] relative shadow-lg">
              {/* Map custom control overlay of filter modes on expenditure & receipt */}
              <div className="absolute top-4 left-4 z-[1000] bg-[#12161F]/90 backdrop-blur border border-[#1E293B] px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-2xl">
                <Button
                  size="sm"
                  onClick={() => setGeoFilter('all')}
                  className={`h-7 px-3 text-[10px] font-bold uppercase rounded-lg transition-all ${
                    geoFilter === 'all'
                      ? 'bg-zinc-800 text-white'
                      : 'bg-transparent text-[#94A3B8] hover:text-white'
                  }`}
                >
                  Tất cả ({geoTaggedTransactions.length})
                </Button>
                <Button
                  size="sm"
                  onClick={() => setGeoFilter('expense')}
                  className={`h-7 px-3 text-[10px] font-bold uppercase rounded-lg transition-all ${
                    geoFilter === 'expense'
                      ? 'bg-[#EF4444]/20 text-[#EF4444]'
                      : 'bg-transparent text-[#94A3B8] hover:text-[#EF4444]'
                  }`}
                >
                  Khoản Chi ({geospatialSummary.expenseCount})
                </Button>
                <Button
                  size="sm"
                  onClick={() => setGeoFilter('income')}
                  className={`h-7 px-3 text-[10px] font-bold uppercase rounded-lg transition-all ${
                    geoFilter === 'income'
                      ? 'bg-[#10B981]/20 text-[#10B981]'
                      : 'bg-transparent text-[#94A3B8] hover:text-[#10B981]'
                  }`}
                >
                  Khoản Thu ({geospatialSummary.incomeCount})
                </Button>
              </div>

              {/* Map integration via Leaflet */}
              <MapContainer 
                // @ts-ignore
                center={center} 
                zoom={14} 
                style={{ height: '100%', width: '100%' }} 
                zoomControl={false}
              >
                <TileLayer
                  // @ts-ignore
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                
                {filteredMarkers.map((tx) => {
                  const isExpense = tx.type === TransactionType.EXPENSE;
                  const markerColor = isExpense ? '#EF4444' : '#10B981';
                  const catName = categories.find(c => c.id === tx.categoryId)?.name || 'Chưa phân loại';

                  return (
                    <React.Fragment key={tx.id}>
                      <Marker 
                        position={[tx.location!.lat, tx.location!.lng]}
                        // @ts-ignore
                        icon={createMarkerIcon(tx.type)}
                      >
                        <Popup>
                          <div className="p-2.5 text-zinc-900 leading-tight space-y-1 w-[180px]">
                            <p className="font-extrabold text-[12px] text-zinc-800 tracking-tight">{tx.placeName || 'Vị trí đã lưu'}</p>
                            <div className="flex items-center gap-1.5 py-0.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${isExpense ? 'bg-[#EF4444]' : 'bg-[#10B981]'}`} />
                              <span className="text-[10px] font-bold uppercase text-zinc-500">{isExpense ? 'Khoản Chi' : 'Khoản Thu'}</span>
                            </div>
                            <p className="text-[11px] text-zinc-600 font-mono">Danh mục: {catName}</p>
                            {tx.note && <p className="text-[10px] italic text-zinc-400">"{tx.note}"</p>}
                            <div className="border-t border-zinc-100 pt-1.5 mt-1 flex justify-between items-center">
                              <span className="text-[13px] font-black text-zinc-900 font-mono">{formatVND(tx.amount)}</span>
                            </div>
                          </div>
                        </Popup>
                      </Marker>

                      {/* Translucent area cover ring to visualize geographical sphere */}
                      <Circle 
                        // @ts-ignore
                        center={[tx.location!.lat, tx.location!.lng]}
                        // @ts-ignore
                        radius={200}
                        // @ts-ignore
                        pathOptions={{ 
                          fillColor: markerColor, 
                          color: markerColor, 
                          fillOpacity: 0.1, 
                          weight: 1 
                        }}
                      />
                    </React.Fragment>
                  );
                })}
              </MapContainer>

              {/* Map legends */}
              <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
                <div className="bg-[#12161F]/90 backdrop-blur border border-[#1E293B] p-3.5 rounded-xl space-y-2.5 shadow-2xl">
                  <span className="text-[9px] text-[#64748B] uppercase font-extrabold tracking-widest block border-b border-[#1E293B] pb-1.5 mb-1">Chú giải không gian</span>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-[#EF4444] rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)] flex items-center justify-center text-[8px]">💸</div>
                    <span className="text-[10px] text-[#94A3B8] font-bold">Địa điểm Sài Tiền (Expense)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-[#10B981] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] flex items-center justify-center text-[8px]">💰</div>
                    <span className="text-[10px] text-[#94A3B8] font-bold">Địa điểm Nhận Tiền (Income)</span>
                  </div>
                </div>
              </div>
            </Card>

            <div className="space-y-5">
              <h4 className="text-[#64748B] text-[10px] font-extrabold uppercase tracking-[0.25em] flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 text-[#6366F1]" /> Hoạt động vị trí
              </h4>
              <div className="space-y-3 max-h-[490px] overflow-y-auto pr-1">
                {filteredMarkers.slice().reverse().map(tx => {
                  const isExpense = tx.type === TransactionType.EXPENSE;
                  return (
                    <div 
                      key={tx.id} 
                      className="p-4 bg-[#12161F]/90 border border-[#1E293B] rounded-xl hover:border-[#6366F1]/30 transition-all cursor-pointer group flex items-start gap-3"
                    >
                      <div className={`p-2 rounded-lg ${isExpense ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#10B981]/10 text-[#10B981]'} mt-0.5`}>
                        {isExpense ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-xs font-bold text-[#E2E8F0] block truncate">{tx.placeName || 'Địa điểm không tên'}</span>
                          <span className={`text-xs font-black font-mono ${isExpense ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                            {isExpense ? '-' : '+'}{formatShortVND(tx.amount)}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#64748B] font-mono mt-1">
                          GPS: {tx.location?.lat.toFixed(4)}, {tx.location?.lng.toFixed(4)}
                        </p>
                        {tx.note && <span className="text-[10px] italic text-[#475569] block mt-0.5 mt-1 truncate">"{tx.note}"</span>}
                      </div>
                    </div>
                  );
                })}
                {filteredMarkers.length === 0 && (
                  <div className="text-center py-16 bg-[#12161F]/40 border border-dashed border-[#1E293B] rounded-2xl opacity-40">
                    <Navigation className="w-10 h-10 mx-auto mb-2 text-slate-500" />
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Không có vị trí khớp lọc</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB PANEL 2: TEMPORAL ANALYSIS (Thời Gian) --- */}
      {activeSubTab === 'temporal' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-[#12161F] border-[#1E293B] p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-[#6366F1]" /> Phân Phối Chi Tiêu/Thu Nhập Theo Các Ngày Trong Tuần
              </CardTitle>
              <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-bold">Tìm ra ngày nào dòng tiền lưu chuyển nhiều nhất</span>
            </div>
            
            <div className="h-[300px] w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={temporalStats.days} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 10 }} 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(val) => formatShortVND(val)} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#12161F', borderColor: '#1E293B', color: '#f8fafc', borderRadius: '12px' }} 
                    formatter={(value) => [formatVND(Number(value)), 'Tổng tiền']} 
                    labelClassName="font-bold text-[#6366F1]"
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {temporalStats.days.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.amount > 0 ? '#6366F1' : '#1E293B'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="space-y-5">
            <h4 className="text-[#64748B] text-[10px] font-extrabold uppercase tracking-[0.25em] flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#6366F1]" /> Múi Giờ Trọng Điểm (Hourly Shifts)
            </h4>
            
            <div className="space-y-4">
              {temporalStats.shifts.map(shift => (
                <Card key={shift.key} className="bg-[#12161F] border-[#1E293B] p-4.5 rounded-xl hover:border-[#6366F1]/30 transition-all flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{shift.label}</span>
                    <Badge style={{ backgroundColor: `${shift.color}15`, color: shift.color }} className="border-none font-bold text-[10px] font-mono px-2 py-0.5">
                      {shift.percentage}% khối lượng
                    </Badge>
                  </div>
                  
                  <div className="flex items-end justify-between leading-none">
                    <div className="space-y-1">
                      <span className="text-[10px] text-[#64748B] block">Giao dịch</span>
                      <strong className="text-xl font-bold text-slate-100 font-mono">{shift.count}</strong>
                    </div>
                    <div className="text-right space-y-1">
                      <span className="text-[10px] text-[#64748B] block">Khối Dòng Tiền</span>
                      <strong className="text-lg font-bold font-mono" style={{ color: shift.color }}>{formatVND(shift.amount)}</strong>
                    </div>
                  </div>

                  {/* Progressive Bar representing percentage */}
                  <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${shift.percentage}%`, backgroundColor: shift.color }}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB PANEL 3: LOCATION HOTSPOTS (Vị Trí) --- */}
      {activeSubTab === 'hotspots' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-[#12161F] border-[#1E293B] p-5 rounded-2xl flex items-center gap-4.5">
              <div className="w-12 h-12 rounded-xl bg-[#EF4444]/15 flex items-center justify-center text-[#EF4444]">
                <Store className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] text-[#64748B] uppercase font-bold tracking-widest block">NƠI CHI TIÊU NHIỀU NHẤT</span>
                {locationStats.topExpenseLoc ? (
                  <>
                    <strong className="text-base font-bold text-slate-150 truncate block mt-0.5">{locationStats.topExpenseLoc.placeName}</strong>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs text-[#EF4444] font-bold">{formatVND(locationStats.topExpenseLoc.totalExpense)}</span>
                      <span className="text-[10px] text-zinc-500">• {locationStats.topExpenseLoc.count} lần giao tế</span>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-zinc-500 block mt-1">Không có dữ liệu</span>
                )}
              </div>
            </Card>

            <Card className="bg-[#12161F] border-[#1E293B] p-5 rounded-2xl flex items-center gap-4.5">
              <div className="w-12 h-12 rounded-xl bg-[#10B981]/15 flex items-center justify-center text-[#10B981]">
                <Store className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] text-[#64748B] uppercase font-bold tracking-widest block">NƠI THU NHẬP NHIỀU NHẤT</span>
                {locationStats.topIncomeLoc ? (
                  <>
                    <strong className="text-base font-bold text-slate-150 truncate block mt-0.5">{locationStats.topIncomeLoc.placeName}</strong>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs text-[#10B981] font-bold">{formatVND(locationStats.topIncomeLoc.totalIncome)}</span>
                      <span className="text-[10px] text-zinc-500">• {locationStats.topIncomeLoc.count} giao dịch</span>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-zinc-500 block mt-1">Không có dữ liệu</span>
                )}
              </div>
            </Card>
          </div>

          <Card className="bg-[#12161F] border-[#1E293B] rounded-2xl overflow-hidden">
            <div className="border-b border-[#1E293B] p-6 flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-100">Bảng Xếp Hạng Địa Điểm Phục Vụ Tài Chính</CardTitle>
                <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider mt-1">Danh sách tập hợp địa danh đã ghi nhận giao dịch</p>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-zinc-800 text-zinc-400">
                Tất cả {locationStats.list.length} địa chỉ
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0B0E14]/40 border-b border-[#1E293B]/70 text-[#64748B] uppercase text-[10px] font-extrabold tracking-widest">
                    <th className="px-6 py-4">Tên địa điểm / Vendor Name</th>
                    <th className="px-6 py-4 text-center">Tần số (Tần suất)</th>
                    <th className="px-6 py-4">Tổng các khoản chi (-)</th>
                    <th className="px-6 py-4">Tổng các khoản thu (+)</th>
                    <th className="px-6 py-4">Tọa độ tích hợp (Georef)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]/40">
                  {locationStats.list.map((loc, idx) => (
                    <tr key={`${loc.placeName}-${idx}`} className="hover:bg-[#1E293B]/20 transition-all">
                      <td className="px-6 py-4.5 font-bold text-slate-100 flex items-center gap-3">
                        <span className="text-[11px] font-mono text-[#475569]">{idx + 1}.</span>
                        <span>{loc.placeName}</span>
                      </td>
                      <td className="px-6 py-4.5 text-center font-mono font-bold text-slate-300">
                        {loc.count} lần
                      </td>
                      <td className="px-6 py-4.5 font-mono text-red-400 font-bold">
                        {loc.totalExpense > 0 ? `-${formatShortVND(loc.totalExpense)}` : '—'}
                      </td>
                      <td className="px-6 py-4.5 font-mono text-emerald-400 font-bold">
                        {loc.totalIncome > 0 ? `+${formatShortVND(loc.totalIncome)}` : '—'}
                      </td>
                      <td className="px-6 py-4.5 text-[#475569] font-mono text-[11px]">
                        {loc.lat && loc.lng ? `${loc.lat.toFixed(4)}N, ${loc.lng.toFixed(4)}E` : '— Không định vị'}
                      </td>
                    </tr>
                  ))}
                  {locationStats.list.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-16 opacity-30">
                        <Store className="w-10 h-10 mx-auto mb-2" />
                        <p className="text-[11px] font-bold uppercase tracking-widest">Chưa ghi nhận địa danh cụ thể nào</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* --- TAB PANEL 4: PURPOSE/CATEGORIAL ANALYSIS (Mục Đích) --- */}
      {activeSubTab === 'purpose' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purposeStats.list.map(parent => (
              <Card key={parent.id} className="bg-[#12161F] border-[#1E293B] overflow-hidden rounded-2xl flex flex-col justify-between">
                <CardHeader className="p-5 border-b border-[#1E293B]/50 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: `${parent.color}20`, color: parent.color }}
                    >
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{parent.name}</h4>
                      <span className="text-[10px] text-slate-400 block">{parent.count} khoản chi phí</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-sm font-bold text-white font-mono">{formatShortVND(parent.total)}</span>
                    <span className="text-[9px] text-[#64748B] uppercase tracking-wide font-extrabold block">{parent.percentage}% cơ cấu</span>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4 bg-[#0F131C]/30 min-h-[160px]">
                  <span className="text-[9px] text-[#475569] uppercase font-bold tracking-wider block">Phân rã mục đích chi tiết</span>
                  <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                    {parent.subsArray.map((sub, i) => {
                      const subPercentObj = parent.total > 0 ? ((sub.total / parent.total) * 100).toFixed(0) : 0;
                      return (
                        <div key={i} className="space-y-1.5 bg-[#12161F]/80 p-2.5 rounded-lg border border-[#1E293B]/40 hover:border-[#6366F1]/25 transition-all">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-300">{sub.name}</span>
                            <span className="font-mono text-[11px] text-zinc-400 font-medium">{formatShortVND(sub.total)} ({subPercentObj}%)</span>
                          </div>
                          <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full"
                              style={{ 
                                backgroundColor: parent.color, 
                                width: `${subPercentObj}%` 
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {parent.subsArray.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-[#1E293B]/60 rounded-xl opacity-40">
                        <span className="text-[10px] text-[#64748B]">Chưa có khoản chi tiểu tiết</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {purposeStats.list.length === 0 && (
              <div className="col-span-full text-center py-20 bg-[#12161F]/40 border border-dashed border-[#1E293B] rounded-2xl">
                <Tag className="w-12 h-12 mx-auto mb-3 text-slate-600 opacity-40" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Chưa ghi nhận khoản chi tiêu nào để phân tích mục đích</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
