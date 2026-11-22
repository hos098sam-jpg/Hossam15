import React, { useState, useEffect } from 'react';
import {
  Palette,
  X,
  RotateCcw,
  Check,
  Sun,
  Moon,
  Layout,
  Sparkles,
  LogIn,
  UserPlus,
  BookOpen,
  Trophy,
  Home,
  ShieldCheck,
} from 'lucide-react';
import { AppView, User } from '../types';
import {
  THEME_PRESETS,
  PlatformThemeConfig,
  isLightHex,
} from '../utils/themeEngine';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: 'light' | 'dark';
  customTheme: PlatformThemeConfig | null;
  currentUser: User | null;
  onToggleLightDark: () => void;
  onSetGlobalMode?: (mode: 'light' | 'dark') => void;
  onApplyCustomTheme: (config: PlatformThemeConfig) => void;
  onResetCustomTheme: () => void;
  onNavigate?: (view: AppView) => void;
  onOpenVisualEditor?: () => void;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  customTheme,
  currentUser,
  onToggleLightDark,
  onSetGlobalMode,
  onApplyCustomTheme,
  onResetCustomTheme,
  onNavigate,
  onOpenVisualEditor,
}) => {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'hos098sam@gmail.com';
  const [primaryColor, setPrimaryColor] = useState(
    customTheme?.primaryColor || '#d4af37'
  );
  const [bgColor, setBgColor] = useState(
    customTheme?.bgColor || '#0d0824'
  );
  const [textColor, setTextColor] = useState(
    customTheme?.textColor || '#f8fafc'
  );
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (customTheme) {
      setPrimaryColor(customTheme.primaryColor);
      setBgColor(customTheme.bgColor);
      setTextColor(customTheme.textColor);
    }
  }, [customTheme, isOpen]);

  if (!isOpen || !isAdmin) return null;

  const handleApplyColors = (p: string, bg: string, txt?: string) => {
    const nextTxt = txt || (isLightHex(bg) ? '#0f172a' : '#f8fafc');
    setPrimaryColor(p);
    setBgColor(bg);
    setTextColor(nextTxt);
    onApplyCustomTheme({
      enabled: true,
      primaryColor: p,
      bgColor: bg,
      textColor: nextTxt,
    });
    setSavedFeedback('تم تغيير الألوان في المنصة كلها (بما فيها تسجيل الدخول وإنشاء الحساب)');
    setTimeout(() => setSavedFeedback(null), 3000);
  };

  const quickPages: { view: AppView; label: string; icon: React.ReactNode }[] = [
    { view: 'home', label: 'الرئيسية', icon: <Home className="w-3.5 h-3.5" /> },
    { view: 'courses', label: 'الكورسات', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { view: 'competitions', label: 'المسابقات', icon: <Trophy className="w-3.5 h-3.5" /> },
    { view: 'login', label: 'صفحة تسجيل الدخول', icon: <LogIn className="w-3.5 h-3.5" /> },
    { view: 'signup', label: 'صفحة إنشاء حساب', icon: <UserPlus className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      className="fixed inset-0 z-[99999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900 text-white border border-amber-500/40 rounded-3xl shadow-2xl p-5 sm:p-7 space-y-5 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shadow-lg shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                تعديل الألوان والصفحات
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                الألوان تتطبق فوراً على المنصة كلها وصفحة الدخول وإنشاء الحساب
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {savedFeedback && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-black flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{savedFeedback}</span>
          </div>
        )}

        {/* Quick Light/Dark Switch */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-800/70 border border-slate-700">
          <span className="text-xs font-black text-slate-200">
            الوضع السريع (نهاري / ليلي):
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (onSetGlobalMode) {
                  onSetGlobalMode('light');
                } else {
                  onResetCustomTheme();
                  if (currentTheme === 'dark') onToggleLightDark();
                }
                setSavedFeedback('تم التبديل إلى الوضع النهاري (الفاتح) للجميع.');
                setTimeout(() => setSavedFeedback(null), 2500);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                currentTheme === 'light' && !customTheme?.enabled
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>فاتح للجميع</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (onSetGlobalMode) {
                  onSetGlobalMode('dark');
                } else {
                  onResetCustomTheme();
                  if (currentTheme === 'light') onToggleLightDark();
                }
                setSavedFeedback('تم التبديل إلى الوضع الليلي (الداكن) للجميع.');
                setTimeout(() => setSavedFeedback(null), 2500);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                currentTheme === 'dark' && !customTheme?.enabled
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>غامق للجميع</span>
            </button>
          </div>
        </div>

        {/* Presets */}
        <div className="space-y-2">
          <label className="text-xs font-black text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ثيمات جاهزة لجميع الصفحات:</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {THEME_PRESETS.map((preset) => {
              const isSelected =
                customTheme?.enabled &&
                customTheme.bgColor.toLowerCase() === preset.bgColor.toLowerCase() &&
                customTheme.primaryColor.toLowerCase() === preset.primaryColor.toLowerCase();
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    handleApplyColors(preset.primaryColor, preset.bgColor, preset.textColor)
                  }
                  className={`p-2.5 rounded-2xl border text-right transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-amber-400 border-amber-400'
                      : 'border-slate-700 hover:border-slate-500'
                  }`}
                  style={{ backgroundColor: preset.bgColor, color: preset.textColor }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-4 h-4 rounded-full shrink-0 border border-white/30"
                      style={{ backgroundColor: preset.primaryColor }}
                    />
                    <span className="text-xs font-black truncate">{preset.label}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 shrink-0 text-amber-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Color Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-amber-300 block">
              لون الأزرار والعناصر
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) =>
                  handleApplyColors(e.target.value, bgColor, textColor)
                }
                className="w-10 h-9 rounded-lg cursor-pointer bg-slate-900 border border-slate-700 shrink-0"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => {
                  const val = e.target.value;
                  setPrimaryColor(val);
                  if (/^#[0-9a-fA-F]{6}$/.test(val)) handleApplyColors(val, bgColor, textColor);
                }}
                className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-[11px] text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-200 block">
              لون الخلفية العام
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => {
                  const nextBg = e.target.value;
                  const autoText = isLightHex(nextBg) ? '#0f172a' : '#f8fafc';
                  handleApplyColors(primaryColor, nextBg, autoText);
                }}
                className="w-10 h-9 rounded-lg cursor-pointer bg-slate-900 border border-slate-700 shrink-0"
              />
              <input
                type="text"
                value={bgColor}
                onChange={(e) => {
                  const val = e.target.value;
                  setBgColor(val);
                  if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                    const autoText = isLightHex(val) ? '#0f172a' : '#f8fafc';
                    handleApplyColors(primaryColor, val, autoText);
                  }
                }}
                className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-[11px] text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-200 block">
              لون الخطوط والنصوص
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) =>
                  handleApplyColors(primaryColor, bgColor, e.target.value)
                }
                className="w-10 h-9 rounded-lg cursor-pointer bg-slate-900 border border-slate-700 shrink-0"
              />
              <input
                type="text"
                value={textColor}
                onChange={(e) => {
                  const val = e.target.value;
                  setTextColor(val);
                  if (/^#[0-9a-fA-F]{6}$/.test(val)) handleApplyColors(primaryColor, bgColor, val);
                }}
                className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-[11px] text-white"
              />
            </div>
          </div>
        </div>

        {/* Pages Switcher & Editor */}
        {onNavigate && (
          <div className="space-y-2 pt-1 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-indigo-400" />
                <span>تصفح ومعاينة الصفحات بالألوان الجديدة:</span>
              </label>
              {onOpenVisualEditor && (currentUser?.role === 'admin' || currentUser?.email === 'hos098sam@gmail.com') && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenVisualEditor();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-[11px] font-black flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>تعديل أقسام الصفحة الرئيسية</span>
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickPages.map((p) => (
                <button
                  key={p.view}
                  type="button"
                  onClick={() => {
                    onNavigate(p.view);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-black flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {p.icon}
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              handleApplyColors(primaryColor, bgColor, textColor);
              onClose();
            }}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>حفظ وتطبيق على المنصة كلها</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onResetCustomTheme();
              setSavedFeedback('تم إرجاع الألوان الافتراضية للمنصة.');
            }}
            className="px-3.5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer flex items-center gap-1.5 border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>الوضع الافتراضي</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizerModal;
