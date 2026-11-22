import React, { useState } from 'react';
import {
  User as UserIcon,
  Lock,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles,
  GraduationCap,
  Home,
  AlertCircle,
  CheckCircle2,
  Phone,
  School,
  IdCard,
  MapPin,
  Check,
  RotateCcw,
  Sun,
  Moon
} from 'lucide-react';
import { User, AppView } from '../types';
import { signupWithEmail, getIdToken } from '../auth';
import { getSavedUsers, saveUsers, saveCurrentUser } from '../data/initialData';
import { saveServerAuthToken, saveSessionToken } from '../utils/authToken';
import { getDeviceInfoPayload } from '../utils/deviceFingerprint';
import registerIllustration from '../assets/images/register_page_illustration_1790724483777.jpg';
const motafalsifaLogo = '/logo.png';

interface SignupPageProps {
  onNavigate: (view: AppView) => void;
  onAuthSuccess: (user: User) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({
  onNavigate,
  onAuthSuccess,
  theme = 'light',
  onToggleTheme,
}) => {
  // Step State: 1 (30%), 2 (60%), 3 (100%)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Personal Info
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [thirdName, setThirdName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [schoolYear, setSchoolYear] = useState('الصف الأول الثانوي');
  const [division, setDivision] = useState('عام');

  // Step 2: Parent & School Info
  const [fatherPhone, setFatherPhone] = useState('');
  const [motherPhone, setMotherPhone] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [governorate, setGovernorate] = useState('السويس');
  const [educationSystem, setEducationSystem] = useState('عربي');

  // Step 3: Credentials & Final Info
  const [gender, setGender] = useState<'ذكر' | 'أنثى'>('ذكر');
  const [religion, setReligion] = useState('التربية الدينية الإسلامية');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(true);

  // Feedback & Loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Full name combined
  const fullName = `${firstName.trim()} ${secondName.trim()} ${thirdName.trim()} ${lastName.trim()}`.trim();

  // Validate Step 1
  const handleNextStep1 = () => {
    setError(null);
    if (!firstName.trim() || !secondName.trim() || !thirdName.trim() || !lastName.trim()) {
      setError('يرجى إدخال الاسم الرباعي بالكامل لضمان توثيق الحساب والشهادات.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('يرجى إدخال رقم هاتف الطالب الصحيح (11 رقم).');
      return;
    }
    setStep(2);
  };

  // Validate Step 2
  const handleNextStep2 = () => {
    setError(null);
    const cleanFather = fatherPhone.replace(/\D/g, '');
    const cleanMother = motherPhone.replace(/\D/g, '');
    if (!cleanFather && !cleanMother) {
      setError('يرجى إدخال رقم هاتف ولي الأمر (الأب أو الأم) لمتابعة المستوى والتقارير.');
      return;
    }
    setStep(3);
  };

  // Submit Final Registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!termsAgreed) {
      setError('يرجى الموافقة على شروط الاستخدام وسياسة المنصة للمتابعة.');
      return;
    }

    if (!password || password.length < 6) {
      setError('كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام.');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }

    setLoading(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const targetEmail = email.trim() || `${cleanPhone}@al-motafalsifa.edu`;
      const effectiveDivision = division;

      let newUser: User | null = null;
      let fbSucceeded = false;
      try {
        const res = await signupWithEmail(targetEmail, password, {
          name: fullName,
          firstName: firstName.trim(),
          secondName: secondName.trim(),
          thirdName: thirdName.trim(),
          lastName: lastName.trim(),
          role: 'student',
          phone: cleanPhone,
          parentPhone: fatherPhone.trim() || motherPhone.trim(),
          fatherPhone: fatherPhone.trim(),
          motherPhone: motherPhone.trim(),
          schoolYear,
          division: effectiveDivision,
          schoolName: schoolName.trim(),
          governorate,
          educationSystem,
          gender,
          religion,
          status: 'active',
        });
        newUser = res.profile;
        fbSucceeded = true;
      } catch (authErr: any) {
        if (authErr?.code === 'auth/email-already-in-use') {
          setError('رقم الهاتف أو البريد الإلكتروني هذا مسجل بالفعل. يرجى تسجيل الدخول.');
          setLoading(false);
          return;
        }
        console.warn('Firebase signup notice, continuing via server signup:', authErr);
      }

      // Persist & obtain signed HMAC token + UUID current_session_token from server
      const deviceInfo = await getDeviceInfoPayload().catch(() => ({
        deviceId: '',
        deviceName: '',
        fingerprintHash: '',
      }));
      const fbToken = fbSucceeded ? await getIdToken().catch(() => null) : null;
      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(fbToken ? { Authorization: `Bearer ${fbToken}` } : {}),
        },
        body: JSON.stringify({
          ...(newUser?.id ? { id: newUser.id, uid: newUser.id } : {}),
          name: fullName,
          firstName: firstName.trim(),
          secondName: secondName.trim(),
          thirdName: thirdName.trim(),
          lastName: lastName.trim(),
          phone: cleanPhone,
          parentPhone: fatherPhone.trim() || motherPhone.trim(),
          fatherPhone: fatherPhone.trim(),
          motherPhone: motherPhone.trim(),
          schoolYear,
          division: effectiveDivision,
          schoolName: schoolName.trim(),
          governorate,
          educationSystem,
          gender,
          religion,
          email: targetEmail,
          password,
          deviceId: deviceInfo.deviceId,
          deviceName: deviceInfo.deviceName,
          deviceFingerprint: deviceInfo.fingerprintHash,
          syncFromFirebaseAuth: fbSucceeded,
        }),
      });

      const signupData = await signupRes.json().catch(() => ({}));
      if (signupRes.ok && signupData?.user) {
        if (signupData.token) {
          saveServerAuthToken(signupData.token);
        }
        const issuedSessionToken = signupData.current_session_token || signupData.sessionId || '';
        if (issuedSessionToken) {
          saveSessionToken(issuedSessionToken);
        }
        newUser = {
          ...(signupData.user as User),
          ...(issuedSessionToken
            ? { current_session_token: issuedSessionToken, activeSessionId: issuedSessionToken }
            : {}),
          ...(deviceInfo.fingerprintHash ? { device_fingerprint: deviceInfo.fingerprintHash } : {}),
        };
      } else if (!newUser) {
        throw new Error(signupData?.error || 'تعذر إنشاء الحساب على الخادم.');
      }

      const prevUsers = getSavedUsers();
      const updatedList = [newUser, ...prevUsers.filter((u) => u.id !== newUser!.id)];
      saveUsers(updatedList);
      saveCurrentUser(newUser);

      setSuccessMsg('🎉 تم إنشاء حسابك بنجاح! يتم الآن توجيهك للمنصة...');
      setTimeout(() => {
        onAuthSuccess(newUser!);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full theme-page-bg bg-[#F3F4F6] dark:bg-[#0D0D0F] text-[#151515] dark:text-[#F4F4F5] flex flex-col justify-between selection:bg-[#E31B23]/15 selection:text-[#E31B23] relative overflow-x-clip transition-colors duration-200"
      dir="rtl"
    >
      {/* Subtle Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#E31B23]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#1769D2]/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Full Page Stage: 2-Columns Layout with Generated Artwork */}
      <main className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 flex-1 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch max-w-[870px] mx-auto w-full">
          {/* Illustration Column (Swapped to left side on desktop) */}
          <div className="hidden lg:flex lg:order-2 flex-col items-center justify-center text-center relative select-none">
            <div className="relative w-full max-w-[410px] h-full rounded-3xl overflow-hidden shadow-2xl border border-[#E31B23]/30 bg-[#0B0B0F] group flex">
              <img
                src={registerIllustration}
                alt="إنشاء حساب جديد - منصة المتفلسفة"
                className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
              />

              <div className="absolute top-3 right-3 bg-[#0B0B0F]/85 backdrop-blur-md px-3 py-1 rounded-xl border border-[#E31B23]/40 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-[#E31B23]" />
                <span>انضم لأسرة المتفلسفة</span>
              </div>

              <div className="absolute bottom-3 inset-x-3 bg-[#0B0B0F]/85 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-right">
                <p className="font-display text-xs font-extrabold text-white">رحلة التفوق تبدأ من هنا</p>
                <p className="text-[11px] text-neutral-300 mt-0.5 leading-snug">
                  امتحانات تفاعلية، فيديوهات عالية الجودة، ومتابعة دقيقة لكل درس مع أ/ سوزان كريم فهمي
                </p>
              </div>
            </div>
          </div>

          {/* Multi-Step Registration Form Column (Swapped to primary right side on desktop) */}
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
                <div className="flex items-center gap-1.5">
                  <div className="font-mono-num px-2.5 py-1 rounded-lg bg-[#1769D2]/10 border border-[#1769D2]/25 text-[#1769D2] text-[10px] font-extrabold">
                    {step === 1 ? 'المرحلة 1 / 3' : step === 2 ? 'المرحلة 2 / 3' : 'المرحلة 3 / 3'}
                  </div>
                  {onToggleTheme && (
                    <button
                      type="button"
                      onClick={onToggleTheme}
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl bg-[#F3F4F6] dark:bg-[#0D0D0F] hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] font-bold text-[#151515] dark:text-amber-300 transition-colors cursor-pointer"
                      title={theme === 'dark' ? 'التحويل للوضع الفاتح' : 'التحويل للوضع الغامق'}
                      aria-label={theme === 'dark' ? 'التحويل للوضع الفاتح' : 'التحويل للوضع الغامق'}
                    >
                      {theme === 'dark' ? (
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Moon className="w-3.5 h-3.5 text-[#1769D2]" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              {/* Top Brand Title */}
              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
                <div className="w-9 h-9 rounded-xl bg-[#0B0B0F] border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                  <img
                    src={motafalsifaLogo}
                    alt="شعار منصة المتفلسفة"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="font-display text-sm sm:text-base font-extrabold text-[#151515] dark:text-white">إنشاء حساب طالب جديد</h2>
                  <p className="text-[11px] text-[#1769D2] font-semibold">منصة المتفلسفة التعليمية 2027</p>
                </div>
              </div>

              {/* Progress bar line */}
              <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full mb-3 overflow-hidden">
                <div
                  className="h-full bg-[#E31B23] transition-all duration-300"
                  style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
                />
              </div>

              {/* Error & Success Messages */}
              {error && (
                <div className="mb-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Step 1: Personal Info */}
              {step === 1 && (
                <div className="space-y-2.5 animate-fadeIn">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                      الاسم الرباعي للطالب بالكامل (باللغة العربية) *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="الاسم الأول"
                        className="p-2 bg-[#F3F4F6]/70 dark:bg-[#0D0D0F] text-[#151515] dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs placeholder:text-neutral-400 text-right focus:outline-none focus:border-[#1769D2]"
                      />
                      <input
                        type="text"
                        value={secondName}
                        onChange={(e) => setSecondName(e.target.value)}
                        placeholder="اسم الأب"
                        className="p-2 bg-[#F3F4F6]/70 dark:bg-[#0D0D0F] text-[#151515] dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs placeholder:text-neutral-400 text-right focus:outline-none focus:border-[#1769D2]"
                      />
                      <input
                        type="text"
                        value={thirdName}
                        onChange={(e) => setThirdName(e.target.value)}
                        placeholder="اسم الجد"
                        className="p-2 bg-[#F3F4F6]/70 dark:bg-[#0D0D0F] text-[#151515] dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs placeholder:text-neutral-400 text-right focus:outline-none focus:border-[#1769D2]"
                      />
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="اللقب / العائلة"
                        className="p-2 bg-[#F3F4F6]/70 dark:bg-[#0D0D0F] text-[#151515] dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs placeholder:text-neutral-400 text-right focus:outline-none focus:border-[#1769D2]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block">
                      رقم هاتف الطالب (واتساب للتنبيهات والدرجات) *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 top-2.5 right-3 absolute text-[#1769D2] pointer-events-none" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="01xxxxxxxxx"
                        className="w-full pr-9 pl-3 py-2 bg-[#F3F4F6]/70 dark:bg-[#0D0D0F] text-[#151515] dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm text-right focus:outline-none focus:border-[#1769D2]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block">
                        السنة الدراسية
                      </label>
                      <select
                        value={schoolYear}
                        onChange={(e) => {
                          setSchoolYear(e.target.value);
                          setDivision('عام');
                        }}
                        className="w-full p-2 bg-[#F3F4F6]/70 dark:bg-[#0D0D0F] text-[#151515] dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-right focus:outline-none focus:border-[#1769D2]"
                      >
                        <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                      </select>
                    </div>

                    <div className="space-y-1 animate-fadeIn">
                      <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block">
                        الشعبة (الصف الأول الثانوي)
                      </label>
                      <select
                        value={division}
                        onChange={(e) => setDivision(e.target.value)}
                        className="w-full p-2 bg-[#F3F4F6]/70 dark:bg-[#0D0D0F] text-[#151515] dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-right focus:outline-none focus:border-[#1769D2]"
                      >
                        <option value="بكالوريا">بكالوريا</option>
                        <option value="عام">عام</option>
                        <option value="أزهر">أزهر</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleNextStep1}
                      className="w-full py-2.5 rounded-xl bg-[#E31B23] hover:bg-[#B5121B] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                    >
                      <span>متابعة لبيانات ولي الأمر والمدرسة ➔</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Parent & School Info */}
              {step === 2 && (
                <div className="space-y-2.5 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block">
                        رقم هاتف الأب (واتساب) *
                      </label>
                      <input
                        type="tel"
                        value={fatherPhone}
                        onChange={(e) => setFatherPhone(e.target.value)}
                        placeholder="01xxxxxxxxx"
                        className="w-full p-2 bg-[#F3F4F6]/70 dark:bg-[#0D0D0F] text-[#151515] dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm text-right focus:outline-none focus:border-[#1769D2]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block">
                        رقم هاتف الأم (إضافي)
                      </label>
                      <input
                        type="tel"
                        value={motherPhone}
                        onChange={(e) => setMotherPhone(e.target.value)}
                        placeholder="01xxxxxxxxx"
                        className="w-full p-2 bg-[#F3F4F6]/70 dark:bg-[#0D0D0F] text-[#151515] dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm text-right focus:outline-none focus:border-[#1769D2]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block">
                        المحافظة
                      </label>
                      <select
                        value={governorate}
                        onChange={(e) => setGovernorate(e.target.value)}
                        className="w-full p-2 bg-[#F3F4F6]/70 dark:bg-[#0D0D0F] text-[#151515] dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-right focus:outline-none focus:border-[#1769D2]"
                      >
                        <option value="السويس">السويس</option>
                        <option value="القاهرة">القاهرة</option>
                        <option value="الجيزة">الجيزة</option>
                        <option value="الإسكندرية">الإسكندرية</option>
                        <option value="الإسماعيلية">الإسماعيلية</option>
                        <option value="بورسعيد">بورسعيد</option>
                        <option value="الشرقية">الشرقية</option>
                        <option value="الدقهلية">الدقهلية</option>
                        <option value="المنوفية">المنوفية</option>
                        <option value="الغربية">الغربية</option>
                        <option value="كفر الشيخ">كفر الشيخ</option>
                        <option value="البحيرة">البحيرة</option>
                        <option value="دمياط">دمياط</option>
                        <option value="بني سويف">بني سويف</option>
                        <option value="الفيوم">الفيوم</option>
                        <option value="المنيا">المنيا</option>
                        <option value="أسيوط">أسيوط</option>
                        <option value="سوهاج">سوهاج</option>
                        <option value="قنا">قنا</option>
                        <option value="الأقصر">الأقصر</option>
                        <option value="أسوان">أسوان</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block">
                        نظام التعليم
                      </label>
                      <select
                        value={educationSystem}
                        onChange={(e) => setEducationSystem(e.target.value)}
                        className="w-full p-2 bg-[#F3F4F6]/70 dark:bg-[#0D0D0F] text-[#151515] dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-right focus:outline-none focus:border-[#1769D2]"
                      >
                        <option value="عربي">عام / عربي</option>
                        <option value="لغات">لغات</option>
                        <option value="أزهر">أزهر شريف</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block">
                      اسم المدرسة المقيد بها الطالب
                    </label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="مثال: مدرسة السويس الثانوية"
                      className="w-full p-2 bg-[#F3F4F6]/70 dark:bg-[#0D0D0F] text-[#151515] dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-right focus:outline-none focus:border-[#1769D2]"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="py-2.5 px-4 rounded-xl bg-[#F3F4F6] dark:bg-[#0D0D0F] hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold cursor-pointer"
                    >
                      ← الرجوع
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep2}
                      className="flex-1 py-2.5 rounded-xl bg-[#E31B23] hover:bg-[#B5121B] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                    >
                      <span>متابعة لكلمة المرور والأمان ➔</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Credentials & Final Info */}
              {step === 3 && (
                <form onSubmit={handleSubmit} className="space-y-2.5 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block">
                        النوع (الجنس)
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setGender('ذكر')}
                          className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            gender === 'ذكر'
                              ? 'bg-[#1769D2] border-[#1769D2] text-white shadow-sm'
                              : 'bg-[#F3F4F6]/70 dark:bg-[#0D0D0F] text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                          }`}
                        >
                          طالب (بنين)
                        </button>
                        <button
                          type="button"
                          onClick={() => setGender('أنثى')}
                          className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            gender === 'أنثى'
                              ? 'bg-[#E31B23] border-[#E31B23] text-white shadow-sm'
                              : 'bg-[#F3F4F6]/70 dark:bg-[#0D0D0F] text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                          }`}
                        >
                          طالبة (بنات)
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block">
                        البريد الإلكتروني (اختياري)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full p-2 bg-[#F3F4F6]/70 dark:bg-[#0D0D0F] text-[#151515] dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-right focus:outline-none focus:border-[#1769D2]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block">
                        كلمة المرور *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full p-2 bg-[#F3F4F6]/70 dark:bg-[#0D0D0F] text-[#151515] dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm text-right focus:outline-none focus:border-[#1769D2]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-neutral-500 dark:text-neutral-400"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block">
                        تأكيد كلمة المرور *
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full p-2 bg-[#F3F4F6]/70 dark:bg-[#0D0D0F] text-[#151515] dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm text-right focus:outline-none focus:border-[#1769D2]"
                      />
                    </div>
                  </div>

                  {/* Terms Checkbox */}
                  <label className="flex items-center gap-2 text-[11px] text-neutral-700 dark:text-neutral-300 cursor-pointer pt-0.5">
                    <input
                      type="checkbox"
                      checked={termsAgreed}
                      onChange={(e) => setTermsAgreed(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-neutral-300 dark:border-neutral-600 accent-[#E31B23]"
                    />
                    <span>
                      أوافق على <b>شروط الاستخدام</b> وسياسة حماية المحتوى والامتحانات بمنصة المتفلسفة.
                    </span>
                  </label>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="py-2.5 px-4 rounded-xl bg-[#F3F4F6] dark:bg-[#0D0D0F] hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold cursor-pointer"
                    >
                      ← الرجوع
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2.5 rounded-xl bg-[#E31B23] hover:bg-[#B5121B] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                    >
                      <span>{loading ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب والبدء الآن'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Already have account footer link */}
              <div className="text-center pt-3 mt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="text-xs text-[#1769D2] hover:underline transition-colors font-bold cursor-pointer"
                >
                  لديك حساب مسجل بالفعل؟ <b>تسجيل الدخول هنا ➔</b>
                </button>
              </div>
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

export default SignupPage;
