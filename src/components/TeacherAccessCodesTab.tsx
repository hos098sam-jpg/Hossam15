import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  CreditCard,
  Eye,
  GraduationCap,
  Key,
  LayoutGrid,
  List,
  Plus,
  Printer,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type { Course, CourseAccessCode, WalletRechargeCode } from '../types';
import {
  fetchAccessCodesFromServer,
  fetchWalletCodesFromServer,
  getSavedAccessCodes,
  getSavedWalletCodes,
  saveAccessCodes,
  saveWalletCodes,
} from '../data/initialData';
import { SubscriptionCard } from './SubscriptionCard';

interface TeacherAccessCodesTabProps {
  courses: Course[];
  defaultTeacherName?: string;
  onNotify?: (text: string, type?: 'success' | 'error') => void;
}

export const TeacherAccessCodesTab: React.FC<TeacherAccessCodesTabProps> = ({
  courses,
  defaultTeacherName = 'أ/ سوزان كريم فهمي',
  onNotify,
}) => {
  const [accessCodes, setAccessCodes] = useState<CourseAccessCode[]>(() => getSavedAccessCodes());
  const [walletCodes, setWalletCodes] = useState<WalletRechargeCode[]>(() => getSavedWalletCodes());

  const [walletCodeAmount, setWalletCodeAmount] = useState<number>(100);
  const [walletCodeCount, setWalletCodeCount] = useState<number>(5);
  const [walletCodeNote, setWalletCodeNote] = useState<string>('');

  const [codeSelectedCourse, setCodeSelectedCourse] = useState<string>(courses[0]?.id || 'general');
  const [codeCustomCourseTitle, setCodeCustomCourseTitle] = useState<string>('');
  const [codeTeacherName, setCodeTeacherName] = useState<string>(defaultTeacherName);
  const [codeCount, setCodeCount] = useState<number>(5);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [accessCodesDisplayMode, setAccessCodesDisplayMode] = useState<'cards' | 'table'>('cards');
  const [selectedCardForModal, setSelectedCardForModal] = useState<CourseAccessCode | null>(null);
  const [codeSearchQuery, setCodeSearchQuery] = useState<string>('');
  const [codeFilterStatus, setCodeFilterStatus] = useState<'all' | 'available' | 'used'>('all');

  useEffect(() => {
    fetchAccessCodesFromServer().then((codes) => {
      if (Array.isArray(codes) && codes.length > 0) setAccessCodes(codes);
    });
    fetchWalletCodesFromServer().then((codes) => {
      if (Array.isArray(codes) && codes.length > 0) setWalletCodes(codes);
    });
  }, []);

  const notify = (text: string, type: 'success' | 'error' = 'success') => {
    if (onNotify) onNotify(text, type);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleGenerateWalletCodes = (customCount?: number, customAmount?: number) => {
    const count = customCount || Math.max(1, Math.min(100, Number(walletCodeCount) || 5));
    const amount = customAmount || Math.max(1, Number(walletCodeAmount) || 100);
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const generated: WalletRechargeCode[] = [];
    const nowStr = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    for (let i = 0; i < count; i++) {
      let randPart = '';
      for (let j = 0; j < 8; j++) {
        randPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const formattedCode = `WLT-${amount}-${randPart.slice(0, 4)}-${randPart.slice(4, 8)}`;
      generated.push({
        code: formattedCode,
        amount,
        isUsed: false,
        createdAt: nowStr,
        notes: walletCodeNote.trim() || `كارت شحن محفظة بقيمة ${amount} ج.م`,
      });
    }

    const updated = [...generated, ...walletCodes];
    setWalletCodes(updated);
    saveWalletCodes(updated);
    notify(`تم توليد ${count} كود شحن محفظة بقيمة ${amount} ج.م لكل كود بنجاح! 💰`);
  };

  const handleDeleteWalletCode = (codeToDelete: string) => {
    const updated = walletCodes.filter((c) => c.code !== codeToDelete);
    setWalletCodes(updated);
    saveWalletCodes(updated);
    notify('تم حذف كود شحن المحفظة بنجاح.');
  };

  const handleGenerateCodes = (countToGen?: number) => {
    const count = Math.max(1, countToGen !== undefined ? countToGen : codeCount || 1);

    let targetCourseTitle = 'كافة كورسات المنصة';
    let targetCourseId = '';
    const teacherName = codeTeacherName.trim() || defaultTeacherName;

    if (codeSelectedCourse === 'custom') {
      targetCourseTitle = codeCustomCourseTitle.trim() || 'كورس مخصص';
      targetCourseId = 'custom-' + Date.now();
    } else if (codeSelectedCourse && codeSelectedCourse !== 'general') {
      const found = courses.find((c) => c.id === codeSelectedCourse);
      if (found) {
        targetCourseId = found.id;
        targetCourseTitle = found.title;
      }
    }

    const newCodes: CourseAccessCode[] = [];
    const cleanPrefix =
      targetCourseTitle
        .replace(/[^\u0621-\u064Aa-zA-Z0-9]/g, '')
        .substring(0, 4)
        .toUpperCase() || 'MTAF';

    for (let i = 0; i < count; i++) {
      const randHex = Math.random().toString(36).substring(2, 6).toUpperCase();
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const codeStr = `MTAF-${cleanPrefix}-${randHex}-${randNum}`;

      newCodes.push({
        code: codeStr,
        courseId: targetCourseId,
        courseTitle: targetCourseTitle,
        teacherName,
        isUsed: false,
        createdAt: new Date().toISOString().split('T')[0],
      });
    }

    const updated = [...newCodes, ...accessCodes];
    setAccessCodes(updated);
    saveAccessCodes(updated);
    setAccessCodesDisplayMode('cards');
    notify(`تم توليد ${count} كارت اشتراك معتمد لكورس (${targetCourseTitle}) بنجاح!`);
  };

  const handleDeleteCode = (codeStr: string) => {
    const updated = accessCodes.filter((c) => c.code !== codeStr);
    setAccessCodes(updated);
    saveAccessCodes(updated);
    notify('تم حذف الكود.', 'error');
  };

  const filteredCodes = accessCodes.filter((c) => {
    if (codeFilterStatus === 'available' && c.isUsed) return false;
    if (codeFilterStatus === 'used' && !c.isUsed) return false;
    if (codeSearchQuery.trim()) {
      const q = codeSearchQuery.trim().toLowerCase();
      const matchCode = c.code.toLowerCase().includes(q);
      const matchCourse = c.courseTitle?.toLowerCase().includes(q);
      const matchTeacher = c.teacherName?.toLowerCase().includes(q);
      const matchStudent = c.usedByStudentName?.toLowerCase().includes(q);
      if (!matchCode && !matchCourse && !matchTeacher && !matchStudent) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* WALLET RECHARGE CODES GENERATOR */}
      <div className="bg-gradient-to-l from-amber-50 via-yellow-50/40 to-white border-2 border-amber-200 rounded-[32px] p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/70 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 flex-wrap">
                <span>توليد أكواد شحن محفظة الطلاب بمبلغ معين 💰</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 text-xs font-black">
                  شحن رصيد فوري
                </span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 font-bold">
                أنشئي أكواد شحن بمبالغ محددة (مثلاً 50 أو 100 أو 200 ج.م) ليقوم الطالب بإدخال الكود في محفظته وشحن رصيده فوراً لشراء أي كورس
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-black">
            <span className="px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-amber-900">
              إجمالي الأكواد: {walletCodes.length}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800">
              متاح: {walletCodes.filter((c) => !c.isUsed).length}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-800 block">مبلغ شحن الكود (بالجنيه المصري):</label>
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              {[50, 100, 150, 200, 300, 500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setWalletCodeAmount(amt)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                    walletCodeAmount === amt
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white border border-amber-200 text-amber-900 hover:bg-amber-100'
                  }`}
                >
                  {amt} ج.م
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              value={walletCodeAmount}
              onChange={(e) => setWalletCodeAmount(Number(e.target.value))}
              className="w-full p-3 rounded-2xl border border-amber-300 bg-white text-sm font-black font-mono text-slate-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-800 block">عدد الأكواد المطلوب توليدها:</label>
            <input
              type="number"
              min="1"
              max="100"
              value={walletCodeCount}
              onChange={(e) => setWalletCodeCount(Number(e.target.value))}
              className="w-full p-3 rounded-2xl border border-amber-300 bg-white text-sm font-black font-mono text-slate-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-800 block">ملاحظة على الكود (اختياري):</label>
            <input
              type="text"
              value={walletCodeNote}
              onChange={(e) => setWalletCodeNote(e.target.value)}
              placeholder="مثال: دفعة شهر أكتوبر..."
              className="w-full p-3 rounded-2xl border border-amber-300 bg-white text-xs font-bold text-slate-900"
            />
          </div>

          <button
            type="button"
            onClick={() => handleGenerateWalletCodes()}
            className="w-full py-3.5 px-5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>توليد {walletCodeCount} كود بقيمة {walletCodeAmount} ج.م 💰</span>
          </button>
        </div>

        {walletCodes.length > 0 && (
          <div className="pt-3 border-t border-amber-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800">
                قائمة أكواد شحن المحفظة ({walletCodes.length} كود):
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1">
              {walletCodes.map((wc) => (
                <div
                  key={wc.code}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2 ${
                    wc.isUsed ? 'bg-slate-100 border-slate-200 opacity-75' : 'bg-white border-amber-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-xs font-mono">
                      💰 {wc.amount} ج.م
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        wc.isUsed ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {wc.isUsed ? 'تم الشحن ✓' : 'متاح للشحن ✅'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80">
                    <span className="font-mono font-black text-xs sm:text-sm text-slate-900 tracking-wider" dir="ltr">
                      {wc.code}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(wc.code)}
                        className="p-1.5 rounded-lg bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-700 border border-slate-200 cursor-pointer"
                        title="نسخ كود الشحن"
                      >
                        {copiedCode === wc.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteWalletCode(wc.code)}
                        className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 cursor-pointer"
                        title="حذف الكود"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {wc.isUsed && wc.usedByStudentName ? (
                    <div className="text-[10px] font-bold text-slate-600 flex items-center justify-between">
                      <span>شحنه: {wc.usedByStudentName}</span>
                      <span dir="ltr">{wc.usedByStudentPhone}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>{wc.notes || `كارت شحن ${wc.amount} ج.م`}</span>
                      <span>{wc.createdAt}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* COURSE ACCESS CARDS GENERATOR */}
      <div className="bg-white border border-slate-200 rounded-[32px] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 flex-wrap">
                <span>توليد كروت اشتراك منصة المتفلسفة</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                  تصميم الكارت الذهبي المعتمد
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                حددي الكورس وعدد الكروت ليتم توليدها فورياً وتصديرها كصور كروت جاهزة للطباعة والتوزيع
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setAccessCodesDisplayMode('cards')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                accessCodesDisplayMode === 'cards' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>معرض الكروت</span>
            </button>
            <button
              type="button"
              onClick={() => setAccessCodesDisplayMode('table')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                accessCodesDisplayMode === 'table' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>جدول الأكواد</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>الكورس المرتبط:</span>
            </label>
            <select
              value={codeSelectedCourse}
              onChange={(e) => {
                const val = e.target.value;
                setCodeSelectedCourse(val);
              }}
              className="w-full p-3 rounded-2xl border border-slate-200 text-xs bg-slate-50/50 hover:bg-white focus:bg-white font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition-all"
            >
              <option value="general">🌟 كود اشتراك شامل (لكافة كورسات المنصة)</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  كورس: {c.title}
                </option>
              ))}
              <option value="custom">✍️ كتابة اسم كورس يدوي مخصص...</option>
            </select>

            {codeSelectedCourse === 'custom' && (
              <input
                type="text"
                value={codeCustomCourseTitle}
                onChange={(e) => setCodeCustomCourseTitle(e.target.value)}
                placeholder="اكتبي اسم الكورس المخصص..."
                className="w-full mt-2 p-2.5 rounded-xl border border-indigo-200 text-xs bg-indigo-50/30 font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-violet-600" />
              <span>اسم المعلمة (المكتوب على الكارت):</span>
            </label>
            <input
              type="text"
              value={codeTeacherName}
              onChange={(e) => setCodeTeacherName(e.target.value)}
              placeholder={defaultTeacherName}
              className="w-full p-3 rounded-2xl border border-slate-200 text-xs bg-slate-50/50 hover:bg-white focus:bg-white font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>عدد الأكواد المطلوبة:</span>
              </span>
              <span className="text-[10px] text-indigo-600 font-bold">يمكنكِ تحديد أي عدد</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="500"
                value={codeCount}
                onChange={(e) => setCodeCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 p-3 rounded-2xl border border-slate-200 text-sm bg-slate-50/50 hover:bg-white focus:bg-white font-black text-center focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              <div className="flex-1 flex items-center gap-1 overflow-x-auto py-1">
                {[1, 5, 10, 25, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCodeCount(num)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      codeCount === num ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500 font-bold">
            💡 سيتم إنشاء كروت اشتراك فريدة ومحمية تحمل شعار المتفلسفة جاهزة للتحميل الفوري كصور عالية الدقة.
          </div>

          <button
            type="button"
            onClick={() => handleGenerateCodes(codeCount)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-sm transition-all shadow-md shadow-indigo-200 hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>توليد ({codeCount}) كارت اشتراك فوري ✨</span>
          </button>
        </div>
      </div>

      {/* Stats and Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-[28px] p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-black">
            إجمالي الكروت: {accessCodes.length}
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black">
            متاح للتوزيع: {accessCodes.filter((c) => !c.isUsed).length}
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-black">
            تم التفعيل: {accessCodes.filter((c) => c.isUsed).length}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={codeSearchQuery}
              onChange={(e) => setCodeSearchQuery(e.target.value)}
              placeholder="بحث برقم الكود أو الكورس..."
              className="w-full pr-8 pl-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-hidden font-bold"
            />
          </div>

          <select
            value={codeFilterStatus}
            onChange={(e) => setCodeFilterStatus(e.target.value as any)}
            className="p-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-bold"
          >
            <option value="all">كل الحالات</option>
            <option value="available">متاح فقط</option>
            <option value="used">مستخدم فقط</option>
          </select>

          {accessCodes.length > 0 && (
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
              title="طباعة جميع الكروت"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>
          )}
        </div>
      </div>

      {filteredCodes.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-[32px] p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Key className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-black text-slate-800">لا توجد كروت اشتراك مطابقة</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              اضغطي على زر &quot;توليد كارت اشتراك فوري&quot; بالأعلى لإنشاء كروت جديدة بتصميم كارت المتفلسفة المعتمد.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleGenerateCodes(5)}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition-colors shadow-xs cursor-pointer"
          >
            توليد 5 كروت اشتراك الآن
          </button>
        </div>
      ) : accessCodesDisplayMode === 'cards' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCodes.map((code) => (
            <div
              key={code.code}
              className="bg-white border border-slate-200/90 rounded-[36px] p-5 shadow-sm hover:shadow-md transition-shadow relative"
            >
              <div className="flex items-center justify-between mb-3 px-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      code.isUsed ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {code.isUsed ? 'تم الاستخدام' : 'جاهز للتسليم ✅'}
                  </span>
                  <span className="text-[10px] text-slate-400">{code.createdAt}</span>
                </div>

                <button
                  onClick={() => handleDeleteCode(code.code)}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="حذف الكارت"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <SubscriptionCard accessCode={code} onCopy={handleCopyCode} />

              {code.isUsed && code.usedByStudentName && (
                <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between text-slate-600 font-bold">
                  <span>الطالب الذي فعّله: {code.usedByStudentName}</span>
                  <span dir="ltr">{code.usedByStudentPhone}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold">
                <tr>
                  <th className="p-4 pr-6">كود التفعيل</th>
                  <th className="p-4">الكورس</th>
                  <th className="p-4">اسم المعلمة</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">استخدمه الطالب</th>
                  <th className="p-4">تاريخ التوليد</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredCodes.map((code) => (
                  <tr key={code.code} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 pr-6">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm tracking-wider">{code.code}</span>
                        <button
                          onClick={() => handleCopyCode(code.code)}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 cursor-pointer"
                          title="نسخ الكود"
                        >
                          {copiedCode === code.code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="p-4 font-sans font-bold text-slate-800">{code.courseTitle}</td>
                    <td className="p-4 font-sans text-slate-600">{code.teacherName || '—'}</td>
                    <td className="p-4 font-sans">
                      {code.isUsed ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          مستخدم ومفعل
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          متاح وجاهز للإرسال ✅
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-sans">
                      {code.usedByStudentName ? (
                        <div>
                          <span className="font-bold text-slate-900">{code.usedByStudentName}</span>
                          <span className="text-[10px] text-slate-400 block" dir="ltr">
                            {code.usedByStudentPhone}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500">{code.createdAt}</td>
                    <td className="p-4 text-center font-sans">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedCardForModal(code)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                          title="معاينة كارت الاشتراك"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>عرض الكارت</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCode(code.code)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                          title="حذف الكود"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedCardForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[36px] p-6 max-w-3xl w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-600" />
                <span>معاينة كارت الاشتراك المعتمد</span>
              </h3>
              <button
                onClick={() => setSelectedCardForModal(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-2">
              <SubscriptionCard accessCode={selectedCardForModal} onCopy={handleCopyCode} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
