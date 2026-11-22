import React, { useState } from 'react';
import {
  User as UserIcon,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  GraduationCap,
  Users,
  Home,
  AlertCircle,
  CheckCircle2,
  Phone,
  MessageCircle,
  KeyRound,
  UserPlus,
  LogIn,
  Sun,
  Moon
} from 'lucide-react';
import { User, AppView } from '../types';
import {
  loginWithEmail,
  resetPassword
} from '../auth';
import { getSavedUsers, saveCurrentUser } from '../data/initialData';
import { getClientAuthHeaders, saveServerAuthToken, saveSessionToken } from '../utils/authToken';
import { getDeviceInfoPayload } from '../utils/deviceFingerprint';
import loginIllustration from '../assets/images/login_page_illustration_1790724497630.jpg';
const motafalsifaLogo = '/logo.png';

interface LoginPageProps {
  onNavigate: (view: AppView) => void;
  onAuthSuccess: (user: User) => void;
  initialRole?: 'student' | 'teacher' | 'parent' | 'admin';
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  sessionConflictNotice?: string | null;
  onDismissSessionConflict?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigate,
  onAuthSuccess,
  initialRole = 'student',
  theme = 'light',
  onToggleTheme,
  sessionConflictNotice,
  onDismissSessionConflict,
}) => {
  // Input fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [roleTab, setRoleTab] = useState<'student' | 'teacher' | 'parent' | 'admin'>(initialRole);

  React.useEffect(() => {
    if (initialRole) {
      setRoleTab(initialRole);
    }
  }, [initialRole]);

  // Status & feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot password & WhatsApp OTP states
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [otpStep, setOtpStep] = useState<'idle' | 'login_otp' | 'forgot_otp' | 'reset_new_password' | 'parent_otp'>('idle');
  const [otpSessionId, setOtpSessionId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpMaskedPhone, setOtpMaskedPhone] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpResetToken, setOtpResetToken] = useState('');
  const [otpTriggerLink, setOtpTriggerLink] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Primary Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanIdentifier = identifier.trim();
    const cleanPass = password.trim();
    if (!cleanIdentifier) {
      setError('يرجى إدخال رقم الهاتف أو البريد الإلكتروني.');
      return;
    }
    if (!cleanPass) {
      setError('يرجى إدخال كلمة المرور.');
      return;
    }

    setLoading(true);

    try {
      const localUsers = getSavedUsers();
      const cleanDigits = cleanIdentifier.replace(/\D/g, '');
      const isEmail = cleanIdentifier.includes('@');
      const isSupervisor = cleanIdentifier.toLowerCase() === 'hos098sam@gmail.com' || cleanDigits === '01040672314';

      // Normalize Egyptian phone numbers (e.g., +2010... -> 010...)
      const normalizePhoneDigits = (p: string) => {
        const d = (p || '').replace(/\D/g, '');
        if (!d) return '';
        if (d.startsWith('20') && d.length >= 12) return '0' + d.slice(2);
        return d;
      };
      const normalizedInputPhone = normalizePhoneDigits(cleanIdentifier);

      // 1. Fetch hardware device identity & deterministic browser fingerprint
      const deviceInfo = await getDeviceInfoPayload().catch(() => ({
        deviceId: '',
        deviceName: '',
        fingerprintHash: '',
      }));

      // 2. Central Server Login Verification (handles Supervisor/Admin, Teachers, Assistants, and Students with UUID current_session_token)
      try {
        const sRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: cleanIdentifier,
            password: cleanPass,
            deviceId: deviceInfo.deviceId,
            deviceName: deviceInfo.deviceName,
            deviceFingerprint: deviceInfo.fingerprintHash,
          }),
        }).catch(() => null);

        if (sRes && sRes.ok) {
          const sData = await sRes.json().catch(() => ({}));
          if (sData && sData.user) {
            onDismissSessionConflict?.();
            if (sData.token) {
              saveServerAuthToken(sData.token);
            }
            const issuedSessionToken = sData.current_session_token || sData.sessionId || '';
            if (issuedSessionToken) {
              saveSessionToken(issuedSessionToken);
            }
            const authedUser: User = {
              ...sData.user,
              ...(issuedSessionToken
                ? {
                    current_session_token: issuedSessionToken,
                    activeSessionId: issuedSessionToken,
                  }
                : {}),
              ...(deviceInfo.fingerprintHash ? { device_fingerprint: deviceInfo.fingerprintHash } : {}),
            };
            // Also sign in Firebase Auth client quietly when possible so Firestore listener stays active
            const fbSyncEmail = isSupervisor ? 'hos098sam@gmail.com' : (sData.user.email || '');
            if (fbSyncEmail) {
              loginWithEmail(fbSyncEmail, cleanPass).catch(() => {});
            }
            saveCurrentUser(authedUser);
            onAuthSuccess(authedUser);
            return;
          }
        } else if (sRes && sRes.status === 403) {
          const errData = await sRes.json().catch(() => ({}));
          setError(errData?.error || 'عذراً، لقد استنفذت الحد المسموح به لتغيير الجهاز (مرتان شهرياً كحد أقصى لمنع مشاركة الحساب).');
          return;
        } else if (sRes && sRes.status === 401) {
          const errData = await sRes.json().catch(() => ({}));
          setError(errData?.error || 'كلمة المرور غير صحيحة. يرجى التأكد من كلمة المرور أو استعادتها.');
          return;
        }
      } catch (netErr) {
        console.warn('Direct server login network notice:', netErr);
      }

      // 3. Fallback for accounts registered via Firebase Auth (Al-Motafalsifa only — isolated from Qalb Al-Elm)
      const candidateFbEmails = isSupervisor
        ? ['hos098sam@gmail.com']
        : isEmail
        ? [cleanIdentifier.toLowerCase()]
        : cleanDigits.length >= 10
        ? [`${cleanDigits}@al-motafalsifa.edu`]
        : [];
      for (const targetFbEmail of candidateFbEmails) {
        try {
          const fbRes = await loginWithEmail(targetFbEmail, cleanPass);
          const lowerFbEmail = targetFbEmail.toLowerCase();
          const isFbAdmin = lowerFbEmail === 'hos098sam@gmail.com';
          const isFbTeacher = lowerFbEmail === 'almtflsft@gmail.com';
          const matchedProfile =
            fbRes.serverUser ||
            localUsers.find((u) => u.email?.toLowerCase() === lowerFbEmail) || {
              id: fbRes.uid,
              name: isFbAdmin
                ? 'إدارة المنصة'
                : isFbTeacher
                ? 'أ/ سوزان كريم فهمي'
                : fbRes.displayName || 'طالب منصة المتفلسفة',
              email: targetFbEmail,
              phone: isFbAdmin ? '01040672314' : isFbTeacher ? '' : cleanDigits || '',
              parentPhone: '',
              schoolYear: isFbAdmin
                ? 'الدعم الفني للمنصة'
                : isFbTeacher
                ? 'الصف الأول الثانوي'
                : 'الصف الأول الثانوي',
              ...(isFbTeacher ? { subject: 'الفلسفة والمنطق' } : {}),
              role: isFbAdmin ? 'admin' : isFbTeacher ? 'teacher' : 'student',
              status: 'active',
              emailVerified: true,
            };

          // Enforce device & UUID session token binding on server
          const newSessionId =
            typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
              ? crypto.randomUUID()
              : `sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
          const regHeaders = await getClientAuthHeaders({ 'Content-Type': 'application/json' });
          const regRes = await fetch('/api/auth/register-session', {
            method: 'POST',
            headers: regHeaders,
            body: JSON.stringify({
              userId: matchedProfile.id,
              phone: matchedProfile.phone || '',
              current_session_token: newSessionId,
              activeSessionId: newSessionId,
              deviceId: deviceInfo.deviceId,
              deviceName: deviceInfo.deviceName,
              deviceFingerprint: deviceInfo.fingerprintHash,
            }),
          }).catch(() => null);

          if (regRes && !regRes.ok && regRes.status === 403) {
            const regErr = await regRes.json().catch(() => ({}));
            setError(regErr.error || 'عذراً، لقد استنفذت الحد المسموح به لتغيير الجهاز (مرتان شهرياً كحد أقصى).');
            return;
          }

          const regData = regRes && regRes.ok ? await regRes.json().catch(() => null) : null;
          const authoritativeToken = regData?.current_session_token || newSessionId;
          saveSessionToken(authoritativeToken);
          onDismissSessionConflict?.();

          const authedFallback: User = {
            ...(matchedProfile as User),
            current_session_token: authoritativeToken,
            activeSessionId: authoritativeToken,
            ...(deviceInfo.fingerprintHash ? { device_fingerprint: deviceInfo.fingerprintHash } : {}),
          };
          saveCurrentUser(authedFallback);
          onAuthSuccess(authedFallback);
          return;
        } catch (err: any) {
          console.warn('Fallback Firebase login attempt error:', err?.message || err);
        }
      }

      // 4. Never verify plaintext passwords locally in client storage
      const matched = localUsers.find((u) => {
        if (u.accountNumber && u.accountNumber.trim().toLowerCase() === cleanIdentifier.toLowerCase()) {
          return true;
        }
        if (u.phone && u.phone.trim().toLowerCase() === cleanIdentifier.toLowerCase()) {
          return true;
        }
        const uNormalizedPhone = normalizePhoneDigits(u.phone || '');
        if (normalizedInputPhone.length >= 10 && uNormalizedPhone && uNormalizedPhone === normalizedInputPhone) {
          return true;
        }
        return false;
      });

      if (matched || isSupervisor) {
        setError('كلمة المرور غير صحيحة. يرجى التأكد من كلمة المرور أو الضغط على "نسيت كلمة المرور؟" لاستعادتها.');
      } else {
        setError('رقم الهاتف هذا غير مسجل في المنصة لأي طالب. يرجى التأكد من الرقم أو إنشاء حساب جديد أولاً.');
      }
    } catch (err: any) {
      setError(err.message || 'بيانات الدخول غير صحيحة، يرجى التأكد من الرقم وكلمة المرور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full theme-page-bg bg-[#F3F4F6] dark:bg-[#0D0D0F] text-[#151515] dark:text-[#F4F4F5] flex flex-col justify-between selection:bg-[#E31B23]/15 selection:text-[#E31B23] relative overflow-x-clip font-sans transition-colors duration-200"
      dir="rtl"
    >
      {/* Subtle Ambient Lighting matching platform palette */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#E31B23]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#1769D2]/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Full Page Stage: 2-Columns Layout */}
      <main className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 flex-1 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch max-w-[870px] mx-auto w-full">
          {/* Illustration Column (Swapped to left side on desktop) */}
          <div className="hidden lg:flex lg:order-2 flex-col items-center justify-center text-center relative select-none">
            <div className="relative w-full max-w-[410px] h-full rounded-3xl overflow-hidden shadow-2xl border border-[#E31B23]/30 bg-[#0B0B0F] group flex">
              <img
                src={loginIllustration}
                alt="شخصية المتفلسفة الكرتونية الذكية"
                className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
              />

              {/* Overlay Badges */}
              <div className="absolute top-3 right-3 bg-[#0B0B0F]/85 backdrop-blur-md px-3 py-1 rounded-xl border border-[#E31B23]/40 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-[#E31B23]" />
                <span>بالعلم نصنع المستقبل</span>
              </div>

              <div className="absolute bottom-3 inset-x-3 bg-[#0B0B0F]/85 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-right">
                <p className="font-display text-xs font-extrabold text-white">منصة المتفلسفة التعليمية المعتمدة</p>
                <p className="text-[11px] text-neutral-300 mt-0.5 leading-snug">
                  بيئة تعليمية شاملة ومحمية لدراسة الفلسفة والمنطق تحت إشراف أ/ سوزان كريم فهمي
                </p>
              </div>
            </div>
          </div>

          {/* Auth Card Column (Swapped to primary right side on desktop) */}
          <div className="col-span-1 lg:order-1 flex justify-center w-full">
            <div className="w-full max-w-[410px] lg:min-h-[430px] theme-surface bg-white dark:bg-[#16161A] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden text-right flex flex-col justify-center">
              <div className="flex items-center justify-between gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F3F4F6] dark:bg-[#0D0D0F] hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] font-bold text-[#151515] dark:text-neutral-200 transition-colors cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5 text-[#E31B23]" />
                  <span>الرئيسية</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#1769D2] font-bold hidden sm:inline">
                    معاً نحو مستقبل أفضل
                  </span>
                  {onToggleTheme && (
                    <button
                      type="button"
                      onClick={onToggleTheme}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#F3F4F6] dark:bg-[#0D0D0F] hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] font-bold text-[#151515] dark:text-amber-300 transition-colors cursor-pointer"
                      title={theme === 'dark' ? 'التحويل للوضع الفاتح' : 'التحويل للوضع الغامق'}
                      aria-label={theme === 'dark' ? 'التحويل للوضع الفاتح' : 'التحويل للوضع الغامق'}
                    >
                      {theme === 'dark' ? (
                        <>
                          <Sun className="w-3.5 h-3.5 text-amber-400" />
                          <span>فاتح</span>
                        </>
                      ) : (
                        <>
                          <Moon className="w-3.5 h-3.5 text-[#1769D2]" />
                          <span>ليلي</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Compact Brand Header + Title */}
              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
                <div className="w-10 h-10 rounded-xl bg-[#0B0B0F] border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
                  <img
                    src={motafalsifaLogo}
                    alt="شعار منصة المتفلسفة"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="font-display text-sm sm:text-base font-extrabold text-[#151515] dark:text-white leading-tight">
                    {isForgotMode ? 'استعادة كلمة المرور' : 'تسجيل الدخول — المتفلسفة'}
                  </h2>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
                    {isForgotMode
                      ? 'أدخل بياناتك لاستعادة حسابك فوراً'
                      : 'مرحباً بك مجدداً في منصة المتفلسفة التعليمية'}
                  </p>
                </div>
              </div>

              {/* Quick Role Switcher */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#F3F4F6] dark:bg-[#0D0D0F] rounded-xl border border-neutral-200 dark:border-neutral-800 mb-3 text-xs font-bold text-center">
                <button
                  type="button"
                  onClick={() => setRoleTab('student')}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    roleTab !== 'parent'
                      ? 'bg-[#E31B23] text-white shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-[#151515] dark:hover:text-white'
                  }`}
                >
                  طالب
                </button>
                <button
                  type="button"
                  onClick={() => setRoleTab('parent')}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    roleTab === 'parent'
                      ? 'bg-[#E31B23] text-white shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-[#151515] dark:hover:text-white'
                  }`}
                >
                  ولي أمر
                </button>
              </div>

              {/* Single-Device Eviction / Force Logout Alert */}
              {sessionConflictNotice && (
                <div className="mb-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-500/50 text-rose-800 dark:text-rose-200 text-xs font-extrabold flex items-start justify-between gap-2 animate-fadeIn">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                    <span>{sessionConflictNotice}</span>
                  </div>
                  {onDismissSessionConflict && (
                    <button
                      type="button"
                      onClick={onDismissSessionConflict}
                      className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-200 text-[11px] font-bold shrink-0 cursor-pointer"
                    >
                      إغلاق
                    </button>
                  )}
                </div>
              )}

              {/* Alert Feedback Messages */}
              {error && (
                <div className="mb-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Normal Password Login Form or Parent Portal Passwordless Form */}
              {!isForgotMode && otpStep === 'idle' && (
                roleTab === 'parent' ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setError(null);
                      setSuccessMsg(null);
                      const clean = identifier.trim().replace(/\s+/g, '');
                      const cleanDigits = clean.replace(/\D/g, '');
                      if (!cleanDigits || cleanDigits.length < 9) {
                        setError('يرجى إدخال رقم هاتف ولي الأمر المسجل في حساب الطالب.');
                        return;
                      }
                      setLoading(true);
                      try {
                        const res = await fetch('/api/auth/parent-login', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ parentPhone: clean }),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (res.ok && data?.user) {
                          if (data.token) {
                            saveServerAuthToken(data.token);
                          }
                          saveCurrentUser(data.user as User);
                          onAuthSuccess(data.user as User);
                        } else {
                          setError(data?.error || 'لم يتم العثور على طالب مرتبط بهذا الرقم. يرجى التأكد من رقم هاتف ولي الأمر المسجل في استمارة الطالب.');
                        }
                      } catch (err: any) {
                        setError(err?.message || 'تعذر التحقق من رقم ولي الأمر حالياً.');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="space-y-2.5 animate-fadeIn"
                  >
                    <div className="p-2.5 rounded-xl bg-[#1769D2]/10 border border-[#1769D2]/25 text-[11px] text-[#151515] dark:text-neutral-200 leading-relaxed">
                      أدخل رقم هاتف ولي الأمر (الأب أو الأم) المسجل في حساب الطالب لمتابعة كشف الدرجات والحضور وتقارير الامتحانات <b>بالرقم فقط</b>.
                    </div>

                    <div>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-amber-500 dark:text-amber-400">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          type="tel"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="رقم هاتف ولي الأمر (مثال: 010XXXXXXXX)"
                          required
                          className="w-full pr-10 pl-3 py-2.5 bg-[#F3F4F6]/70 dark:bg-[#0D0D0F] text-[#151515] dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm placeholder:text-neutral-400 focus:outline-none focus:border-[#1769D2] focus:ring-2 focus:ring-[#1769D2]/20 transition-all font-sans text-right"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl bg-[#E31B23] hover:bg-[#B5121B] text-white font-extrabold text-xs sm:text-sm transition-colors shadow-sm active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <span>{loading ? 'جارٍ فتح بوابة ولي الأمر...' : 'دخول بوابة متابعة ولي الأمر'}</span>
                      <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>

                    <div className="relative flex py-0.5 items-center">
                      <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
                      <span className="shrink-0 mx-3 text-[11px] text-neutral-400 font-bold">أو</span>
                      <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRoleTab('student')}
                      className="w-full py-2.5 rounded-xl bg-[#F3F4F6] dark:bg-[#0D0D0F] text-[#151515] dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-[#1769D2]" />
                      <span>العودة لتسجيل دخول الطالب</span>
                    </button>
                  </form>
                ) : (
                <form onSubmit={handleLogin} className="space-y-3">
                  {/* Field 1: Phone / Username */}
                  <div>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#1769D2]">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="رقم الهاتف أو اسم المستخدم"
                        required
                        className="w-full pr-10 pl-3 py-2.5 bg-[#F3F4F6]/70 dark:bg-[#0D0D0F] text-[#151515] dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm placeholder:text-neutral-400 focus:outline-none focus:border-[#1769D2] focus:ring-2 focus:ring-[#1769D2]/20 transition-all font-sans text-right"
                      />
                    </div>
                  </div>

                  {/* Field 2: Password */}
                  <div>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#1769D2]">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="كلمة المرور"
                        required
                        className="w-full pr-10 pl-10 py-2.5 bg-[#F3F4F6]/70 dark:bg-[#0D0D0F] text-[#151515] dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm placeholder:text-neutral-400 focus:outline-none focus:border-[#1769D2] focus:ring-2 focus:ring-[#1769D2]/20 transition-all font-sans text-right"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-500 dark:text-neutral-400 hover:text-[#151515] dark:hover:text-white transition-colors cursor-pointer"
                        title={showPassword ? 'إخفاء' : 'إظهار'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Primary Login Action Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-[#E31B23] hover:bg-[#B5121B] text-white font-extrabold text-xs sm:text-sm transition-colors shadow-sm active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{loading ? 'جارٍ التحقق...' : 'تسجيل الدخول'}</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </button>

                  {/* Divider "أو" */}
                  <div className="relative flex py-0.5 items-center">
                    <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
                    <span className="shrink-0 mx-3 text-[11px] text-neutral-400 font-bold">أو</span>
                    <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
                  </div>

                  {/* Secondary Action: Create New Account */}
                  <button
                    type="button"
                    onClick={() => onNavigate('signup')}
                    className="w-full py-2.5 rounded-xl bg-[#F3F4F6] dark:bg-[#0D0D0F] text-[#151515] dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-[#1769D2]" />
                    <span>إنشاء حساب جديد</span>
                  </button>

                  {/* Forgot Password Link */}
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotMode(true);
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] text-[#1769D2] hover:underline transition-colors inline-flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Lock className="w-3 h-3" />
                      <span>نسيت كلمة المرور؟</span>
                    </button>
                  </div>
                </form>
                )
              )}

              {/* Forgot Password Mode via Email */}
              {isForgotMode && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="p-2.5 rounded-xl bg-[#1769D2]/10 border border-[#1769D2]/25 text-[11px] text-[#151515] dark:text-neutral-200 leading-relaxed">
                    سيتم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني المسجل بالمنصة.
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block">
                      البريد الإلكتروني المسجل (Gmail)
                    </label>
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      className="w-full p-2.5 bg-[#F3F4F6]/70 dark:bg-[#0D0D0F] text-[#151515] dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm font-mono text-left focus:outline-none focus:border-[#1769D2]"
                      dir="ltr"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      const cleanEmail = recoveryEmail.trim().toLowerCase();
                      if (!cleanEmail || !cleanEmail.includes('@')) {
                        setError('يرجى إدخال بريدك الإلكتروني الصحيح (Gmail) لاستلام رابط الاسترداد.');
                        return;
                      }
                      setLoading(true);
                      setError(null);
                      try {
                        await resetPassword(cleanEmail);
                        setSuccessMsg('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح');
                      } catch (err: any) {
                        setError(err.message || 'فشل إرسال رابط الاسترداد عبر البريد الإلكتروني.');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-[#1769D2] hover:bg-[#1254AA] text-white font-extrabold text-xs sm:text-sm cursor-pointer transition-colors"
                  >
                    {loading ? 'جارٍ الإرسال...' : 'إرسال رابط استعادة كلمة المرور'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(false);
                      setError(null);
                    }}
                    className="w-full py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-[#151515] dark:hover:text-white font-bold cursor-pointer"
                  >
                    ← العودة لنموذج تسجيل الدخول
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-neutral-500 border-t border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-[#121216]/80">
        <p>© {new Date().getFullYear()} منصة المتفلسفة التعليمية. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
};

export default LoginPage;
