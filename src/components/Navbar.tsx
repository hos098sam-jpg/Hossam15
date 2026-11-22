import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  GraduationCap,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Users,
  Sun,
  Moon,
  BookmarkCheck,
  MessageSquare,
  Bell,
  Palette,
  ChevronDown,
} from 'lucide-react';
import { User, AppView, PlatformSettings } from '../types';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  currentUser: User | null;
  onLogout: () => void;
  onOpenAuth: (mode?: 'login' | 'signup' | 'parent') => void;
  platformSettings: PlatformSettings;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onOpenFlutterApp?: () => void;
  onOpenThemeCustomizer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onLogout,
  onOpenAuth,
  theme = 'light',
  onToggleTheme,
  onOpenThemeCustomizer,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'hos098sam@gmail.com';
  const isTeacher = currentUser?.role === 'teacher';
  const isParent = currentUser?.role === 'parent';
  const isStudent = currentUser?.role === 'student';

  useEffect(() => {
    if (!userDropdownOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserDropdownOpen(false);
    };
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (target && userDropdownRef.current && !userDropdownRef.current.contains(target)) {
        setUserDropdownOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [userDropdownOpen]);

  const navigateAndClose = (view: AppView) => {
    setMobileOpen(false);
    setUserDropdownOpen(false);
    onNavigate(view);
  };

  const handleScrollToFeatures = () => {
    setMobileOpen(false);
    setUserDropdownOpen(false);
    if (currentView === 'home') {
      const el = document.getElementById('features');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    onNavigate('home');
    setTimeout(() => {
      const el = document.getElementById('features');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 180);
  };

  const centerLinks: { id: AppView | 'features_anchor'; label: string }[] = currentUser
    ? isTeacher
      ? [
          { id: 'home', label: 'الرئيسية' },
          { id: 'courses', label: 'الكورسات' },
          { id: 'teacher_dashboard', label: 'لوحة المعلمة' },
          { id: 'forum', label: 'المنتدى' },
          { id: 'my_account', label: 'حسابي' },
        ]
      : [
          { id: 'home', label: 'الرئيسية' },
          { id: 'courses', label: 'الكورسات' },
          { id: 'my_courses', label: 'كورساتي' },
          { id: 'forum', label: 'المنتدى' },
          { id: 'features_anchor', label: 'مميزات المنصة' },
        ]
    : [
        { id: 'home', label: 'الرئيسية' },
        { id: 'courses', label: 'الكورسات' },
        { id: 'competitions', label: 'المسابقات' },
        { id: 'features_anchor', label: 'مميزات المنصة' },
      ];

  const primaryRoleTarget: { view: AppView; label: string } | null = isAdmin
    ? { view: 'admin', label: 'لوحة الكنترول' }
    : isTeacher
    ? { view: 'teacher_dashboard', label: 'لوحة المعلمة' }
    : isParent
    ? { view: 'parent_portal', label: 'بوابة ولي الأمر' }
    : isStudent
    ? { view: 'student_dashboard', label: 'لوحة تحكمي' }
    : null;

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/90 bg-white/95 backdrop-blur-md transition-colors dark:border-neutral-800 dark:bg-[#0D0D0F]/95 theme-surface">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:gap-8 lg:px-8">
        {/* Zone 1: Brand Title */}
        <button
          type="button"
          onClick={() => navigateAndClose('home')}
          className="flex shrink-0 cursor-pointer items-center whitespace-nowrap text-[#151515] transition-opacity hover:opacity-85 dark:text-white"
        >
          <Logo size="sm" />
        </button>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav className="hidden items-center gap-6 lg:flex" aria-label="التنقل الرئيسي">
          {centerLinks.map((item) => {
            const isActive = item.id !== 'features_anchor' && currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  item.id === 'features_anchor'
                    ? handleScrollToFeatures()
                    : navigateAndClose(item.id)
                }
                className={`shrink-0 cursor-pointer whitespace-nowrap text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1769D2] ${
                  isActive
                    ? 'text-[#E31B23]'
                    : 'text-neutral-600 hover:text-[#E31B23] dark:text-neutral-300 dark:hover:text-[#E31B23]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Utility & Auth Actions */}
        <div className="hidden shrink-0 items-center gap-2.5 lg:flex">
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
              className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg border border-neutral-200 bg-[#F3F4F6] px-3 text-xs font-semibold text-[#151515] transition-colors hover:bg-neutral-200 dark:border-neutral-700 dark:bg-[#18181D] dark:text-neutral-100 dark:hover:bg-[#23232B]"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4 text-amber-400" />
                  <span>الوضع النهاري</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-[#1769D2]" />
                  <span>الوضع الليلي</span>
                </>
              )}
            </button>
          )}

          {isAdmin && onOpenThemeCustomizer && (
            <button
              type="button"
              onClick={onOpenThemeCustomizer}
              className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-neutral-200 bg-[#F3F4F6] px-3 text-xs font-bold text-[#151515] transition-colors hover:bg-neutral-200 dark:border-neutral-700 dark:bg-[#18181D] dark:text-neutral-100 dark:hover:bg-[#23232B]"
              title="تعديل الألوان والصفحات (للإدارة فقط)"
            >
              <Palette className="h-4 w-4 text-[#E31B23]" />
              <span>الألوان والصفحات</span>
            </button>
          )}

          {currentUser ? (
            <>
              <NotificationBell
                onNavigateToForum={() => navigateAndClose('forum')}
                onNavigateToNotifications={() => navigateAndClose('notifications')}
                isActive={currentView === 'notifications'}
              />

              {primaryRoleTarget && (
                <button
                  type="button"
                  onClick={() => navigateAndClose(primaryRoleTarget.view)}
                  className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#1769D2] px-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  {isAdmin ? (
                    <ShieldCheck className="h-4 w-4" />
                  ) : isParent ? (
                    <Users className="h-4 w-4" />
                  ) : (
                    <GraduationCap className="h-4 w-4" />
                  )}
                  <span>{primaryRoleTarget.label}</span>
                </button>
              )}

              <div className="relative" ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="menu"
                  className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#E31B23] px-4 text-sm font-bold text-white transition-colors hover:bg-[#B5121B]"
                >
                  <span>حسابي ({(currentUser.name || 'المستخدم').split(' ')[0]})</span>
                  <ChevronDown className="h-4 w-4 opacity-90" />
                </button>

                {userDropdownOpen && (
                  <div className="animate-popover-drop absolute left-0 z-50 mt-2 w-64 space-y-1.5 rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl dark:border-neutral-800 dark:bg-[#16161A]">
                    <div className="mb-2 rounded-xl border border-neutral-100 bg-[#F3F4F6] p-3 dark:border-neutral-800 dark:bg-[#0D0D0F]">
                      <p className="truncate text-xs font-extrabold text-[#151515] dark:text-white">
                        {currentUser.name || 'مستخدم المنصة'}
                      </p>
                      <p className="font-mono-num mt-0.5 truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                        {currentUser.phone || currentUser.email}
                      </p>
                      <span className="mt-1.5 inline-block rounded-md bg-[#1769D2]/10 px-2 py-0.5 text-[10px] font-bold text-[#1769D2]">
                        {isParent ? 'بوابة أولياء الأمور' : currentUser.schoolYear || 'الصف الأول الثانوي'}
                      </span>
                    </div>

                    {primaryRoleTarget && (
                      <button
                        type="button"
                        onClick={() => navigateAndClose(primaryRoleTarget.view)}
                        className="flex w-full cursor-pointer items-center justify-between rounded-xl bg-[#1769D2]/10 px-3 py-2 text-right text-xs font-bold text-[#1769D2] transition-colors hover:bg-[#1769D2]/15"
                      >
                        <span>{primaryRoleTarget.label}</span>
                        <GraduationCap className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => navigateAndClose('my_account')}
                      className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-right text-xs font-bold text-[#151515] transition-colors hover:bg-[#F3F4F6] dark:text-neutral-200 dark:hover:bg-[#1D1D23]"
                    >
                      <span>حسابي ومعلوماتي</span>
                      <UserIcon className="h-4 w-4 text-neutral-500" />
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateAndClose('my_courses')}
                      className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-right text-xs font-bold text-[#151515] transition-colors hover:bg-[#F3F4F6] dark:text-neutral-200 dark:hover:bg-[#1D1D23]"
                    >
                      <span>كورساتي الحالية</span>
                      <BookmarkCheck className="h-4 w-4 text-emerald-600" />
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateAndClose('forum')}
                      className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-right text-xs font-bold text-[#151515] transition-colors hover:bg-[#F3F4F6] dark:text-neutral-200 dark:hover:bg-[#1D1D23]"
                    >
                      <span>المنتدى التعليمي</span>
                      <MessageSquare className="h-4 w-4 text-[#1769D2]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateAndClose('notifications')}
                      className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-right text-xs font-bold text-[#151515] transition-colors hover:bg-[#F3F4F6] dark:text-neutral-200 dark:hover:bg-[#1D1D23]"
                    >
                      <span>مركز الإشعارات</span>
                      <Bell className="h-4 w-4 text-amber-500" />
                    </button>

                    <div className="border-t border-neutral-200 pt-1.5 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                        className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-right text-xs font-bold text-[#E31B23] transition-colors hover:bg-[#E31B23]/10"
                      >
                        <span>تسجيل الخروج</span>
                        <LogOut className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpenAuth('parent')}
                className="shrink-0 cursor-pointer whitespace-nowrap px-2.5 py-2 text-sm font-semibold text-neutral-600 transition-colors hover:text-[#E31B23] dark:text-neutral-300 dark:hover:text-[#E31B23]"
              >
                ولي الأمر
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="shrink-0 cursor-pointer whitespace-nowrap px-3 py-2 text-sm font-bold text-[#151515] transition-colors hover:text-[#1769D2] dark:text-neutral-200 dark:hover:text-[#1769D2]"
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="inline-flex h-10 shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#E31B23] px-4 text-sm font-bold text-white transition-colors hover:bg-[#B5121B]"
              >
                إنشاء حساب
              </button>
            </>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-2 lg:hidden">
          {currentUser && (
            <NotificationBell
              onNavigateToForum={() => navigateAndClose('forum')}
              onNavigateToNotifications={() => navigateAndClose('notifications')}
              isActive={currentView === 'notifications'}
            />
          )}

          {isAdmin && onOpenThemeCustomizer && (
            <button
              type="button"
              onClick={onOpenThemeCustomizer}
              aria-label="الألوان والصفحات"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-neutral-200 bg-[#F3F4F6] text-[#E31B23] dark:border-neutral-700 dark:bg-[#18181D]"
            >
              <Palette className="h-4 w-4" />
            </button>
          )}

          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-neutral-200 bg-[#F3F4F6] text-[#151515] dark:border-neutral-700 dark:bg-[#18181D] dark:text-white"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-[#1769D2]" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={mobileOpen}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-neutral-200 text-[#151515] dark:border-neutral-700 dark:text-white"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-neutral-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-[#0D0D0F] lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="قائمة الجوال">
            {centerLinks.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  item.id === 'features_anchor'
                    ? handleScrollToFeatures()
                    : navigateAndClose(item.id)
                }
                className={`w-full cursor-pointer rounded-lg px-3 py-2.5 text-right text-sm font-semibold transition-colors hover:bg-[#F3F4F6] dark:hover:bg-[#1C1C22] ${
                  item.id !== 'features_anchor' && currentView === item.id
                    ? 'text-[#E31B23]'
                    : 'text-[#151515] dark:text-neutral-200'
                }`}
              >
                {item.label}
              </button>
            ))}

            {currentUser && (
              <>
                <button
                  type="button"
                  onClick={() => navigateAndClose('my_courses')}
                  className="w-full cursor-pointer rounded-lg px-3 py-2.5 text-right text-sm font-semibold text-[#151515] transition-colors hover:bg-[#F3F4F6] dark:text-neutral-200 dark:hover:bg-[#1C1C22]"
                >
                  كورساتي الحالية
                </button>
                <button
                  type="button"
                  onClick={() => navigateAndClose('my_account')}
                  className="w-full cursor-pointer rounded-lg px-3 py-2.5 text-right text-sm font-semibold text-[#151515] transition-colors hover:bg-[#F3F4F6] dark:text-neutral-200 dark:hover:bg-[#1C1C22]"
                >
                  حسابي ومعلوماتي
                </button>
              </>
            )}
          </nav>

          <div className="mt-4 flex flex-col gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            {currentUser ? (
              <>
                {primaryRoleTarget && (
                  <button
                    type="button"
                    onClick={() => navigateAndClose(primaryRoleTarget.view)}
                    className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1769D2] px-4 text-sm font-bold text-white"
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>{primaryRoleTarget.label}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigateAndClose('notifications')}
                  className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#E31B23] px-4 text-sm font-bold text-white"
                >
                  <Bell className="h-4 w-4" />
                  <span>الإشعارات والتنبيهات</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onLogout();
                  }}
                  className="flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-neutral-200 px-4 text-sm font-semibold text-[#E31B23] dark:border-neutral-700"
                >
                  تسجيل الخروج
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenAuth('signup');
                  }}
                  className="flex h-11 w-full cursor-pointer items-center justify-center rounded-lg bg-[#E31B23] px-4 text-sm font-bold text-white"
                >
                  إنشاء حساب مجاني
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenAuth('login');
                  }}
                  className="flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-neutral-200 px-4 text-sm font-semibold text-[#151515] dark:border-neutral-700 dark:text-neutral-200"
                >
                  تسجيل الدخول
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenAuth('parent');
                  }}
                  className="flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-neutral-200 px-4 text-sm font-semibold text-[#1769D2] dark:border-neutral-700"
                >
                  دخول ولي الأمر
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
