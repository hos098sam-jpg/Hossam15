import React, { useEffect, useMemo, useState } from 'react';
import {
  TrendingUp,
  BookOpen,
  Coins,
  Calendar,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Receipt,
  CreditCard,
  Smartphone,
  Key,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { getClientAuthHeaders } from '../utils/authToken';

interface SaleTransaction {
  id: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  dateIso: string;
  source: 'wallet_gateway' | 'fawaterak' | 'access_code' | 'manual_enrollment';
  sourceLabel: string;
}

interface WeeklySalesBucket {
  weekKey: string;
  weekStart: string;
  weekEnd: string;
  sortTime: number;
  coursesSold: number;
  totalRevenue: number;
  transactions: SaleTransaction[];
}

interface WeeklySalesResponse {
  totalCoursesSold: number;
  totalRevenue: number;
  weeks: WeeklySalesBucket[];
  transactions: SaleTransaction[];
}

const formatArabicDate = (isoDate: string): string => {
  try {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoDate;
  }
};

const formatArabicDateTime = (isoDate: string): string => {
  try {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoDate;
  }
};

const SOURCE_BADGE_MAP: Record<SaleTransaction['source'], { bg: string; icon: React.ReactNode }> = {
  wallet_gateway: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
    icon: <Smartphone className="w-3 h-3" />,
  },
  fawaterak: {
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
    icon: <CreditCard className="w-3 h-3" />,
  },
  access_code: {
    bg: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800',
    icon: <Key className="w-3 h-3" />,
  },
  manual_enrollment: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    icon: <UserCheck className="w-3 h-3" />,
  },
};

export const WeeklyCourseSalesPage: React.FC = () => {
  const [data, setData] = useState<WeeklySalesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedWeekKey, setExpandedWeekKey] = useState<string | null>(null);

  const loadWeeklySales = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getClientAuthHeaders();
      const res = await fetch('/api/admin/weekly-sales', { headers });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || 'تعذر تحميل تقرير المبيعات الأسبوعية.');
      }
      setData(json as WeeklySalesResponse);
      if (Array.isArray(json?.weeks) && json.weeks.length > 0) {
        setExpandedWeekKey((prev) => prev || json.weeks[0].weekKey);
      }
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء تحميل بيانات المبيعات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeeklySales();
  }, []);

  const filteredWeeks = useMemo(() => {
    if (!data?.weeks) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return data.weeks;
    return data.weeks
      .map((w) => {
        const matchedTxs = w.transactions.filter(
          (tx) =>
            (tx.studentName || '').toLowerCase().includes(q) ||
            (tx.studentPhone || '').includes(q) ||
            (tx.courseTitle || '').toLowerCase().includes(q) ||
            (tx.sourceLabel || '').toLowerCase().includes(q)
        );
        return {
          ...w,
          transactions: matchedTxs,
          coursesSold: matchedTxs.length,
          totalRevenue: matchedTxs.reduce((acc, item) => acc + item.amount, 0),
        };
      })
      .filter((w) => w.transactions.length > 0);
  }, [data, searchQuery]);

  const totalSoldShown = useMemo(() => {
    if (!searchQuery.trim() && data) return data.totalCoursesSold;
    return filteredWeeks.reduce((acc, w) => acc + w.coursesSold, 0);
  }, [data, filteredWeeks, searchQuery]);

  const totalRevenueShown = useMemo(() => {
    if (!searchQuery.trim() && data) return data.totalRevenue;
    return filteredWeeks.reduce((acc, w) => acc + w.totalRevenue, 0);
  }, [data, filteredWeeks, searchQuery]);

  const avgWeeklyRevenue = useMemo(() => {
    if (filteredWeeks.length === 0) return 0;
    return Math.round(totalRevenueShown / filteredWeeks.length);
  }, [filteredWeeks, totalRevenueShown]);

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-[32px] p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-black">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>التقرير المالي الأسبوعي للمنصة</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>مبيعات الكورسات والأرباح أسبوع بأسبوع</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            متابعة إجمالي عدد الكورسات المباعة للطلاب، والمبالغ المحصلة كل أسبوع بتفاصيل كل عملية اشتراك.
          </p>
        </div>

        <button
          type="button"
          onClick={loadWeeklySales}
          disabled={loading}
          className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-60 shrink-0 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'جاري التحديث...' : 'تحديث بيانات المبيعات'}</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-5 shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
              إجمالي الكورسات المباعة
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {totalSoldShown.toLocaleString('ar-EG')}{' '}
              <span className="text-xs font-bold text-slate-500">كورس</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/70 rounded-[28px] p-5 shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">
              إجمالي الأموال الداخلة
            </span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {totalRevenueShown.toLocaleString('ar-EG')}{' '}
              <span className="text-xs font-bold">ج.م</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-5 shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
              عدد الأسابيع المسجلة
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {filteredWeeks.length.toLocaleString('ar-EG')}{' '}
              <span className="text-xs font-bold text-slate-500">أسبوع</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-5 shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
              متوسط الدخل الأسبوعي
            </span>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
              {avgWeeklyRevenue.toLocaleString('ar-EG')}{' '}
              <span className="text-xs font-bold">ج.م</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 flex flex-col sm:flex-row items-center gap-3 shadow-xs">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم الطالب، رقم الهاتف، اسم الكورس، أو وسيلة الدفع..."
            className="w-full pr-10 pl-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-black flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && !data ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-black text-slate-600 dark:text-slate-300">
            جاري تجميع مبيعات الكورسات وحساب أرباح كل أسبوع...
          </p>
        </div>
      ) : filteredWeeks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Receipt className="w-7 h-7" />
          </div>
          <h4 className="text-base font-black text-slate-900 dark:text-white">
            لا توجد عمليات بيع مسجلة مطابقة للبحث
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            عند قيام الطلاب بشراء الكورسات أو تفعيل الأكواد، ستظهر كل أسبوع بأسبوعه هنا تلقائياً.
          </p>
        </div>
      ) : (
        /* Week-by-Week Breakdown Accordion Cards */
        <div className="space-y-4">
          {filteredWeeks.map((week, idx) => {
            const isExpanded = expandedWeekKey === week.weekKey;
            const sourceCounts = week.transactions.reduce(
              (acc, t) => {
                acc[t.sourceLabel] = (acc[t.sourceLabel] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>
            );

            return (
              <div
                key={week.weekKey}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] overflow-hidden shadow-xs transition-all"
              >
                {/* Week Header Row */}
                <button
                  type="button"
                  onClick={() => setExpandedWeekKey(isExpanded ? null : week.weekKey)}
                  className="w-full p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-right hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex flex-col items-center justify-center border border-indigo-100 dark:border-indigo-900 shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                          أسبوع: {formatArabicDate(week.weekStart)} — {formatArabicDate(week.weekEnd)}
                        </span>
                        {idx === 0 && !searchQuery.trim() && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black">
                            الأسبوع الأحدث
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {Object.entries(sourceCounts).map(([label, cnt]) => (
                          <span
                            key={label}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            {label}: {cnt}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="px-3.5 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 text-center">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block">
                          الكورسات المباعة
                        </span>
                        <span className="text-sm font-black text-indigo-900 dark:text-indigo-200 font-mono">
                          {week.coursesSold} كورس
                        </span>
                      </div>

                      <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-center">
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block">
                          الفلوس الداخلة
                        </span>
                        <span className="text-sm font-black text-emerald-700 dark:text-emerald-300 font-mono">
                          {week.totalRevenue.toLocaleString('ar-EG')} ج.م
                        </span>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </button>

                {/* Itemized Sales Table inside Week */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800 overflow-x-auto bg-slate-50/40 dark:bg-slate-950/30">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-3.5 pr-5">اسم الطالب</th>
                          <th className="p-3.5">رقم الهاتف</th>
                          <th className="p-3.5">الكورس المشترى</th>
                          <th className="p-3.5">طريقة التفعيل / الدفع</th>
                          <th className="p-3.5">المبلغ المحصل</th>
                          <th className="p-3.5 pl-5">التاريخ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {week.transactions.map((tx) => {
                          const badge = SOURCE_BADGE_MAP[tx.source];
                          return (
                            <tr
                              key={tx.id}
                              className="hover:bg-white dark:hover:bg-slate-900/80 transition-colors"
                            >
                              <td className="p-3.5 pr-5 font-black text-slate-900 dark:text-white">
                                {tx.studentName}
                              </td>
                              <td
                                className="p-3.5 font-mono text-slate-600 dark:text-slate-300"
                                dir="ltr"
                              >
                                {tx.studentPhone || '—'}
                              </td>
                              <td className="p-3.5 font-bold text-indigo-700 dark:text-indigo-300">
                                {tx.courseTitle}
                              </td>
                              <td className="p-3.5">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] font-black ${badge.bg}`}
                                >
                                  {badge.icon}
                                  <span>{tx.sourceLabel}</span>
                                </span>
                              </td>
                              <td className="p-3.5 font-mono font-black text-emerald-700 dark:text-emerald-400">
                                {tx.amount > 0 ? `${tx.amount.toLocaleString('ar-EG')} ج.م` : 'مجاني'}
                              </td>
                              <td className="p-3.5 pl-5 text-[11px] text-slate-500 dark:text-slate-400">
                                <span className="inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  {formatArabicDateTime(tx.dateIso)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
