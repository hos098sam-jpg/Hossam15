import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  BookOpen,
  BookmarkCheck,
  Trophy,
  Sliders,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  Upload,
  Sparkles,
  FileText,
  Clock,
  Save,
  Layers,
  Search,
  Check,
  RefreshCw,
  Award,
  AlertCircle,
  Phone,
  IdCard,
  MapPin,
  School,
  Briefcase,
  Mail,
  UserCheck,
  UserX,
  X,
  Key,
  Copy,
  Image,
  FileEdit,
  HelpCircle,
  GraduationCap,
  Bell,
  Send,
  Megaphone,
  UserPlus,
  Cloud,
  Database,
  LayoutGrid,
  CreditCard,
  Smartphone,
  MessageSquare,
  MessageCircle,
  LogOut,
  Gift,
  RotateCw,
  BarChart3,
  Palette
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { AdminWhatsAppManager } from './AdminWhatsAppManager';
import { LuckyWheelModal } from './LuckyWheelModal';
import { ParentWhatsappReportModal, buildDirectParentWhatsappUrl } from './ParentWhatsappReportModal';
const motafalsifaLogo = '/logo.png';
import { getClientAuthHeaders } from '../utils/authToken';
import {
  calculateStudentStats,
  calculateGradeAggregateStats,
  normalizeGrade,
  OFFICIAL_SCHOOL_GRADES,
  isPrimaryOrPrepGrade,
  isThirdSecondaryGrade,
} from '../utils/studentStats';
import {
  User,
  Course,
  CourseType,
  CourseExam,
  Competition,
  PlatformSettings,
  ExamQuestion,
  SchoolYearGrade,
  StudentExamSubmission,
  PlatformNotification,
  WalletTransaction
} from '../types';
import { CourseLessonManagerModal } from './CourseLessonManagerModal';
import { AdminAnalyticsDashboard } from './AdminAnalyticsDashboard';
import { AdminSupportChatTab } from './AdminSupportChatTab';
import { WeeklyCourseSalesPage } from './WeeklyCourseSalesPage';
import {
  saveUsers,
  saveSingleUserToServer,
  saveCourses,
  deleteCourseFromServer,
  addDeletedCourseId,
  deleteUserFromServer,
  addDeletedUserId,
  saveExamToStore,
  saveCompetitions,
  getSavedSubmissions,
  saveSubmissions,
  forcePushAllToFirebase,
  loadAllFromFirebase,
  clearLocalCache,
  getCloudSyncStatus,
  CloudSyncState,
  getStudentEnrolledCourses,
  saveStudentEnrolledCourses
} from '../data/initialData';
import { compressImageFile } from '../utils/imageUtils';
import {
  broadcastNotification,
  getSavedNotifications,
  deleteNotification,
  clearAllNotifications,
  requestDeviceNotificationPermission
} from '../utils/notifications';
import { db, deleteUserFromFirestore } from '../auth';

interface AdminDashboardProps {
  currentUser: User | null;
  courses: Course[];
  competitions: Competition[];
  students: User[];
  platformSettings: PlatformSettings;
  requestedTab?: string | null;
  requestedTabNonce?: number;
  onUpdateCourses: (courses: Course[]) => void;
  onUpdateCompetitions: (competitions: Competition[]) => void;
  onUpdateStudents: (students: User[]) => void;
  onUpdateSettings: (settings: PlatformSettings) => void;
  onOpenAuth: () => void;
  onOpenHomeVisualEditor?: () => void;
  onOpenThemeCustomizer?: () => void;
}

type AdminTabType =
  | 'analytics'
  | 'weekly_sales'
  | 'students'
  | 'courses'
  | 'manual_exam'
  | 'competitions'
  | 'settings'
  | 'notifications'
  | 'whatsapp'
  | 'support_chat';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  courses,
  competitions,
  students,
  platformSettings,
  requestedTab,
  requestedTabNonce,
  onUpdateCourses,
  onUpdateCompetitions,
  onUpdateStudents,
  onUpdateSettings,
  onOpenAuth,
  onOpenHomeVisualEditor,
  onOpenThemeCustomizer,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTabType>('students');
  const [isFullPageMode, setIsFullPageMode] = useState<boolean>(false);
  const [reportModalStudent, setReportModalStudent] = useState<User | null>(null);

  useEffect(() => {
    if (requestedTab) {
      setActiveTab(requestedTab as AdminTabType);
      setIsFullPageMode(true);
    }
  }, [requestedTab, requestedTabNonce]);

  const openSectionFullPage = (tab: AdminTabType) => {
    setActiveTab(tab);
    setIsFullPageMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Feedback Toast ---
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // --- Cloud Sync State ---
  const [cloudStatus, setCloudStatus] = useState<CloudSyncState>(getCloudSyncStatus());
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  useEffect(() => {
    const handleStatus = (e: any) => {
      if (e.detail) setCloudStatus(e.detail);
    };
    window.addEventListener('al_motafalsifa_cloud_status', handleStatus);
    return () => window.removeEventListener('al_motafalsifa_cloud_status', handleStatus);
  }, []);

  // --- Notifications Broadcast State ---
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifPriority, setNotifPriority] = useState<'normal' | 'urgent'>('normal');
  const [notifTarget, setNotifTarget] = useState<'all' | 'students' | 'parents'>('all');
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [savedNotifsList, setSavedNotifsList] = useState<PlatformNotification[]>(() => getSavedNotifications());

  // Listen to realtime notification changes across devices & tabs
  useEffect(() => {
    const handleUpdate = (e?: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setSavedNotifsList(e.detail);
      } else {
        setSavedNotifsList(getSavedNotifications());
      }
    };
    window.addEventListener('al_motafalsifa_notifications_updated', handleUpdate);
    return () => window.removeEventListener('al_motafalsifa_notifications_updated', handleUpdate);
  }, []);

  const handleBroadcastNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      showFeedback('يرجى ملء كل من عنوان الإشعار ونص الرسالة', 'error');
      return;
    }
    setIsSendingNotif(true);
    try {
      await broadcastNotification(
        notifTitle.trim(),
        notifMessage.trim(),
        notifPriority,
        notifTarget
      );
      setSavedNotifsList(getSavedNotifications());
      showFeedback('تم بث الإشعار بنجاح وحفظه في سحابة Firebase لكافة الطلاب! 🚀☁️', 'success');
      setNotifTitle('');
      setNotifMessage('');
    } catch (err) {
      showFeedback('حدث خطأ أثناء إرسال الإشعار', 'error');
    } finally {
      setIsSendingNotif(false);
    }
  };

  const handleDeleteNotification = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الإشعار؟ سيتم حذفه من كافة أجهزة الطلاب عبر السحابة.')) {
      deleteNotification(id);
      setSavedNotifsList(getSavedNotifications());
      showFeedback('تم حذف الإشعار بنجاح من السحابة 🗑️', 'success');
    }
  };

  const handleClearAllNotifications = () => {
    if (window.confirm('هل تريد مسح سجل الإشعارات بالكامل؟ سيتم إزالته من السحابة ولدى كافة الطلاب.')) {
      clearAllNotifications();
      setSavedNotifsList([]);
      showFeedback('تم تفريغ سجل الإشعارات بالكامل من السحابة 🧹', 'success');
    }
  };

  const handleApplyTemplate = (title: string, msg: string, priority: 'normal' | 'urgent', target: 'all' | 'students' | 'parents') => {
    setNotifTitle(title);
    setNotifMessage(msg);
    setNotifPriority(priority);
    setNotifTarget(target);
    showFeedback('تم تطبيق قالب الإشعار! يمكنك تعديله والضغط على إرسال.', 'success');
  };

  const handleTestDeviceNotification = async () => {
    const granted = await requestDeviceNotificationPermission();
    if (granted) {
      await broadcastNotification(
        '🔔 اختبار إشعار الجهاز والسحابة',
        'يعمل نظام إشعارات الأجهزة وسحابة Firebase بنجاح على منصة المتفلسفة  التعليمية!',
        'normal',
        'all'
      );
      setSavedNotifsList(getSavedNotifications());
      showFeedback('تم إرسال إشعار تجريبي يظهر على جهازك ومتزامن مع السحابة الآن بنجاح! ☁️', 'success');
    } else {
      showFeedback('يرجى تفعيل صلاحية الإشعارات من إعدادات المتصفح لتلقي إشعارات الجهاز', 'error');
    }
  };

  // --- Students Filter & View ---
  const [studentSearch, setStudentSearch] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'all' | 'pending' | 'active' | 'rejected' | 'logged_in'>('all');
  const [studentGradeFilter, setStudentGradeFilter] = useState<string>('all');
  const [isLuckyWheelOpen, setIsLuckyWheelOpen] = useState<boolean>(false);
  const [luckyWheelGrade, setLuckyWheelGrade] = useState<string>('all');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<User | null>(null);
  const [isRefreshingStudents, setIsRefreshingStudents] = useState(false);

  // --- Course Creation Modal / State ---
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseYear, setNewCourseYear] = useState<SchoolYearGrade>('الصف الأول الثانوي');
  const [newCourseDivision, setNewCourseDivision] = useState<string>('عام لجميع الشعب');
  const [newCourseSubject, setNewCourseSubject] = useState('الفلسفة والمنطق');
  const [newCoursePrice, setNewCoursePrice] = useState<number>(180);
  const [newCoursePaymentPhone, setNewCoursePaymentPhone] = useState<string>('');
  const [newCoursePaymentQrCode, setNewCoursePaymentQrCode] = useState<string>('');
  const [newCourseCover, setNewCourseCover] = useState('https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=800&auto=format&fit=crop');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseInstructor, setNewCourseInstructor] = useState('إدارة المنصة');
  const [newCourseType, setNewCourseType] = useState<CourseType>('integrated');
  const [managingLessonsCourse, setManagingLessonsCourse] = useState<Course | null>(null);

  // --- Manual Exam Creation State ---
  const [selectedCourseForExam, setSelectedCourseForExam] = useState<string>(courses[0]?.id || '');
  const [manualExamTitle, setManualExamTitle] = useState('');
  const [manualExamLesson, setManualExamLesson] = useState('');
  const [manualExamDuration, setManualExamDuration] = useState<number>(30);
  const [manualExamPassing, setManualExamPassing] = useState<number>(60);
  
  interface ManualQuestionDraft {
    id: string;
    type: 'mcq' | 'essay';
    questionText: string;
    questionImage: string;
    marks: number;
    options: string[];
    optionImages?: string[];
    correctOptionIndex: number;
    modelAnswer: string;
    modelAnswerImage: string;
    rubricCriteria: string[];
  }

  const [questionsDraft, setQuestionsDraft] = useState<ManualQuestionDraft[]>([
    {
      id: `q-${Date.now()}-1`,
      type: 'mcq',
      questionText: 'السؤال الأول: اختر الإجابة الصحيحة وفق المعادلة الموضحة بالصورة',
      questionImage: '',
      marks: 10,
      options: ['الخيار (أ)', 'الخيار (ب)', 'الخيار (ج)', 'الخيار (د)'],
      optionImages: ['', '', '', ''],
      correctOptionIndex: 0,
      modelAnswer: 'التعليل النموذجي: تطبيق قانون القوة والحركة المباشر.',
      modelAnswerImage: '',
      rubricCriteria: [],
    }
  ]);

  // --- Student Direct Wallet Top-Up State ---
  const [directTopUpAmount, setDirectTopUpAmount] = useState<number>(100);
  const [directTopUpMode, setDirectTopUpMode] = useState<'add' | 'set'>('add');

  // --- Submissions (used for student analytics & parent reports) ---
  const [submissions, setSubmissions] = useState<StudentExamSubmission[]>([]);

  // --- Competition Creation State ---
  const [isAddCompModalOpen, setIsAddCompModalOpen] = useState(false);
  const [compTitle, setCompTitle] = useState('');
  const [compYear, setCompYear] = useState<string>('الصف الأول الثانوي');
  const [compDuration, setCompDuration] = useState<number>(15);
  const [compDesc, setCompDesc] = useState('');
  const [compPrize, setCompPrize] = useState('');

  // --- Settings State ---
  const [settingsForm, setSettingsForm] = useState<PlatformSettings>(platformSettings);

  // Load submissions on mount
  useEffect(() => {
    setSubmissions(getSavedSubmissions());
  }, []);

  // Course Edit Modal for Admin
  const [editingCourseAdmin, setEditingCourseAdmin] = useState<Course | null>(null);
  const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false);
  const [editCourseTitle, setEditCourseTitle] = useState('');
  const [editCourseType, setEditCourseType] = useState<CourseType>('integrated');
  const [editCoursePrice, setEditCoursePrice] = useState(0);
  const [editCourseDesc, setEditCourseDesc] = useState('');
  const [editCourseSchoolYear, setEditCourseSchoolYear] = useState('الصف الأول الثانوي');
  const [editCourseDivision, setEditCourseDivision] = useState('عام لجميع الشعب');
  const [editCourseSubject, setEditCourseSubject] = useState('الفلسفة والمنطق');
  const [editCourseCover, setEditCourseCover] = useState('');
  const [editCoursePaymentPhone, setEditCoursePaymentPhone] = useState('');
  const [editCoursePaymentQrCode, setEditCoursePaymentQrCode] = useState('');

  // Filter students (excluding teachers, assistants, and admin)
  const registeredStudents = students.filter(
    (s) => s.role !== 'teacher' && s.role !== 'admin' && s.role !== 'assistant' && !s.isAssistant
  );
  const pendingStudentsCount = registeredStudents.filter((s) => s.status === 'pending').length;
  const activeStudentsCount = registeredStudents.filter((s) => s.status === 'active' || s.status === 'approved' || !s.status).length;
  const rejectedStudentsCount = registeredStudents.filter((s) => s.status === 'rejected').length;

  const isStudentLoggedIn = (s: User) => {
    return Boolean(s.activeSessionId) || Boolean(s.isOnline);
  };
  const loggedInStudentsCount = registeredStudents.filter(isStudentLoggedIn).length;

  const activePublishedCoursesCount = useMemo(() => courses.filter((c) => c.isPublished).length, [courses]);
  const competitionEngagementRate = useMemo(() => {
    const studentIds = new Set<string>();
    competitions.forEach((c) => {
      (c.leaderboard || []).forEach((p) => {
        if (p.studentId || p.studentPhone) studentIds.add(p.studentId || p.studentPhone);
      });
    });
    submissions.forEach((s) => {
      if (s.isCompetition || s.competitionId) {
        if (s.studentId || s.studentPhone) studentIds.add(s.studentId || s.studentPhone);
      }
    });
    if (registeredStudents.length === 0) return 0;
    return Math.min(100, Math.round((studentIds.size / registeredStudents.length) * 100));
  }, [competitions, submissions, registeredStudents]);

  const filteredStudents = registeredStudents.filter((s) => {
    const searchLower = (studentSearch || '').toLowerCase();
    const matchesSearch =
      !searchLower ||
      (s.name && s.name.toLowerCase().includes(searchLower)) ||
      (s.phone && s.phone.includes(searchLower)) ||
      (s.parentPhone && s.parentPhone.includes(searchLower)) ||
      (s.nationalId && s.nationalId.includes(searchLower)) ||
      (s.schoolName && s.schoolName.toLowerCase().includes(searchLower)) ||
      (s.governorate && s.governorate.toLowerCase().includes(searchLower)) ||
      (s.schoolYear && s.schoolYear.includes(searchLower));

    const studentEffectiveStatus = s.status || 'active';
    let matchesStatus = true;
    if (studentStatusFilter === 'pending') {
      matchesStatus = studentEffectiveStatus === 'pending';
    } else if (studentStatusFilter === 'active') {
      matchesStatus = studentEffectiveStatus === 'active' || studentEffectiveStatus === 'approved';
    } else if (studentStatusFilter === 'rejected') {
      matchesStatus = studentEffectiveStatus === 'rejected';
    } else if (studentStatusFilter === 'logged_in') {
      matchesStatus = isStudentLoggedIn(s);
    }

    const matchesGrade =
      studentGradeFilter === 'all' ||
      normalizeGrade(s.schoolYear) === normalizeGrade(studentGradeFilter) ||
      s.schoolYear?.includes(studentGradeFilter);

    return matchesSearch && matchesStatus && matchesGrade;
  });

  const gradeAggregateStats = useMemo(() => {
    const targetStudents =
      studentGradeFilter === 'all'
        ? registeredStudents
        : registeredStudents.filter((s) => {
            return (
              normalizeGrade(s.schoolYear) === normalizeGrade(studentGradeFilter) ||
              s.schoolYear?.includes(studentGradeFilter)
            );
          });
    return calculateGradeAggregateStats(
      studentGradeFilter === 'all' ? 'جميع المراحل الدراسية' : studentGradeFilter,
      targetStudents,
      submissions,
      courses
    );
  }, [studentGradeFilter, registeredStudents, submissions, courses]);

  // --- Image Upload From Device Helper ---
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (base64: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    compressImageFile(file, 1000, 0.75).then((compressed) => {
      if (compressed) setter(compressed);
    }).catch(() => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setter(reader.result);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // --- Admin Course Discount ("تنزيل خصم على الكورس بعد إضافته") ---
  const [discountModalCourse, setDiscountModalCourse] = useState<Course | null>(null);
  const [discountBasePrice, setDiscountBasePrice] = useState<number>(0);
  const [discountPercentInput, setDiscountPercentInput] = useState<number>(25);
  const [discountNewPriceInput, setDiscountNewPriceInput] = useState<number>(0);

  const handleOpenCourseDiscountModal = (course: Course) => {
    const currentPrice = Math.max(0, Number(course.price) || 0);
    const existingOriginal = Math.max(0, Number(course.originalPrice) || 0);
    const hasExistingDiscount = existingOriginal > currentPrice && existingOriginal > 0;
    const base = hasExistingDiscount ? existingOriginal : currentPrice;
    const defaultPct = hasExistingDiscount
      ? Math.max(1, Math.min(99, Number(course.discountPercentage) || Math.round(((base - currentPrice) / base) * 100)))
      : 25;
    const calculatedNew = hasExistingDiscount
      ? currentPrice
      : Math.max(0, Math.round(base * (1 - defaultPct / 100)));

    setDiscountModalCourse(course);
    setDiscountBasePrice(base);
    setDiscountPercentInput(defaultPct);
    setDiscountNewPriceInput(calculatedNew);
  };

  const handleDiscountPercentChange = (pctValue: number, customBase?: number) => {
    const base = customBase !== undefined ? customBase : discountBasePrice;
    const clampedPct = Math.max(0, Math.min(100, Number(pctValue) || 0));
    setDiscountPercentInput(clampedPct);
    const newPrice = Math.max(0, Math.round(base * (1 - clampedPct / 100)));
    setDiscountNewPriceInput(newPrice);
  };

  const handleDiscountNewPriceChange = (newPriceValue: number, customBase?: number) => {
    const base = customBase !== undefined ? customBase : discountBasePrice;
    const validNew = Math.max(0, Number(newPriceValue) || 0);
    setDiscountNewPriceInput(validNew);
    if (base > 0 && validNew < base) {
      const pct = Math.max(1, Math.min(100, Math.round(((base - validNew) / base) * 100)));
      setDiscountPercentInput(pct);
    } else {
      setDiscountPercentInput(0);
    }
  };

  const handleSaveCourseDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountModalCourse) return;
    const base = Math.max(0, Number(discountBasePrice) || 0);
    const newPrice = Math.max(0, Number(discountNewPriceInput) || 0);

    if (base <= 0) {
      showFeedback('يرجى تحديد السعر الأصلي للكورس أولاً (أكبر من صفر) لتنزيل خصم عليه', 'error');
      return;
    }
    if (newPrice >= base) {
      showFeedback('يجب أن يكون السعر الجديد بعد الخصم أقل من السعر القديم للكورس', 'error');
      return;
    }

    const finalPercent = Math.max(1, Math.min(100, Math.round(((base - newPrice) / base) * 100)));
    const updated = courses.map((c) =>
      c.id === discountModalCourse.id
        ? {
            ...c,
            originalPrice: base,
            price: newPrice,
            discountPercentage: finalPercent,
          }
        : c
    );

    onUpdateCourses(updated);
    saveCourses(updated);
    setDiscountModalCourse(null);
    showFeedback(
      `تم تنزيل خصم (${finalPercent}%) على كورس "${discountModalCourse.title}"! يظهر للطلاب السعر القديم (${base} ج.م) مشطوباً والسعر الجديد (${newPrice} ج.م) 🔥✅`
    );
  };

  const handleRemoveCourseDiscount = (course: Course) => {
    const restoredPrice =
      course.originalPrice && course.originalPrice > course.price ? course.originalPrice : course.price;
    const updated = courses.map((c) =>
      c.id === course.id
        ? {
            ...c,
            price: restoredPrice,
            originalPrice: undefined,
            discountPercentage: undefined,
          }
        : c
    );
    onUpdateCourses(updated);
    saveCourses(updated);
    setDiscountModalCourse(null);
    showFeedback(`تم إلغاء الخصم على كورس "${course.title}" وإرجاع السعر الأصلي (${restoredPrice} ج.م) بنجاح.`);
  };

  // --- Admin Course Editing ---
  const handleOpenEditCourseAdmin = (course: Course) => {
    setEditingCourseAdmin(course);
    setEditCourseTitle(course.title);
    setEditCourseType(course.courseType || 'integrated');
    setEditCoursePrice(course.price);
    setEditCoursePaymentPhone(course.paymentPhone || '');
    setEditCoursePaymentQrCode(course.paymentQrCode || '');
    setEditCourseDesc(course.description);
    setEditCourseSchoolYear(course.schoolYear);
    setEditCourseDivision(course.division || 'عام لجميع الشعب');
    setEditCourseSubject(course.subject);
    setEditCourseCover(course.coverImage);
    setIsEditCourseModalOpen(true);
  };

  const handleSaveEditCourseAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourseAdmin) return;
    if (!editCourseTitle.trim()) {
      showFeedback('يرجى إدخال اسم الكورس', 'error');
      return;
    }

    const finalEditDivision = isPrimaryOrPrepGrade(editCourseSchoolYear) ? '' : editCourseDivision;
    const newNumericPrice = Number(editCoursePrice) || 0;
    const updated = courses.map((c) => {
      if (c.id !== editingCourseAdmin.id) return c;
      const keepDiscount = c.originalPrice && c.originalPrice > newNumericPrice && newNumericPrice >= 0;
      const recalcPercent =
        keepDiscount && c.originalPrice
          ? Math.max(1, Math.min(100, Math.round(((c.originalPrice - newNumericPrice) / c.originalPrice) * 100)))
          : undefined;
      return {
        ...c,
        title: editCourseTitle.trim(),
        courseType: editCourseType,
        price: newNumericPrice,
        originalPrice: keepDiscount ? c.originalPrice : undefined,
        discountPercentage: keepDiscount ? recalcPercent : undefined,
        paymentPhone: editCoursePaymentPhone.trim() || undefined,
        paymentQrCode: editCoursePaymentQrCode || undefined,
        description: editCourseDesc.trim(),
        schoolYear: editCourseSchoolYear,
        division: finalEditDivision,
        subject: editCourseSubject,
        coverImage: editCourseCover,
      };
    });

    onUpdateCourses(updated);
    saveCourses(updated);
    setIsEditCourseModalOpen(false);
    showFeedback('تم حفظ وتحديث بيانات الكورس بنجاح ✅');
  };

  // --- Student Direct Balance Handler ---
  const handleDirectAdjustStudentWallet = async (
    student: User,
    amountValue: number,
    mode: 'add' | 'set' = 'add'
  ) => {
    const numAmount = Number(amountValue);
    if (isNaN(numAmount) || (mode === 'add' && numAmount === 0) || (mode === 'set' && numAmount < 0)) {
      showFeedback('يرجى إدخال قيمة رصيد صحيحة.', 'error');
      return;
    }

    const prevBalance = Number(student.walletBalance) || 0;
    const newBalance = mode === 'set' ? Math.max(0, numAmount) : Math.max(0, prevBalance + numAmount);
    const delta = newBalance - prevBalance;
    const nowFormatted = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const tx: WalletTransaction = {
      id: `wtx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'admin_topup',
      amount: delta,
      balanceAfter: newBalance,
      description:
        mode === 'set'
          ? `تعديل رصيد المحفظة من الإدارة إلى ${newBalance} ج.م`
          : `شحن رصيد مباشر من الإدارة (+${numAmount} ج.م)`,
      createdAt: nowFormatted,
    };

    const updatedStudent: User = {
      ...student,
      walletBalance: newBalance,
      walletTransactions: [tx, ...(student.walletTransactions || [])].slice(0, 50),
    };

    const updatedList = students.map((s) => (s.id === student.id ? updatedStudent : s));
    onUpdateStudents(updatedList);
    if (selectedStudentForModal && selectedStudentForModal.id === student.id) {
      setSelectedStudentForModal(updatedStudent);
    }

    saveUsers(updatedList);
    await saveSingleUserToServer(updatedStudent);

    getClientAuthHeaders({ 'Content-Type': 'application/json' })
      .then((headers) =>
        fetch('/api/wallet/admin-adjust', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            studentId: student.id,
            studentPhone: student.phone,
            mode,
            amount: numAmount,
          }),
        })
      )
      .catch(() => {});

    showFeedback(
      `تم تحديث رصيد محفظة الطالب (${student.name}) ليصبح ${newBalance} ج.م بنجاح! 💰✅`
    );
  };

  // --- Student Actions ---
  const handleAcceptStudent = async (studentId: string, studentName: string) => {
    const updated = students.map((s) => {
      if (s.id === studentId) {
        return { ...s, status: 'active' as const };
      }
      return s;
    });
    onUpdateStudents(updated);
    saveUsers(updated);
    await setDoc(doc(db, 'users', studentId), { status: 'active', updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
    showFeedback(`تم قبول واعتماد حساب الطالب (${studentName}) بنجاح! تم تفعيل الحساب في Firebase وسيتوجه الطالب فوراً إلى لوحة التحكم.`);
    if (selectedStudentForModal && selectedStudentForModal.id === studentId) {
      setSelectedStudentForModal({ ...selectedStudentForModal, status: 'active' });
    }
  };

  const handleRejectStudent = async (studentId: string, studentName: string) => {
    const updated = students.map((s) => {
      if (s.id === studentId) {
        return { ...s, status: 'rejected' as const };
      }
      return s;
    });
    onUpdateStudents(updated);
    saveUsers(updated);
    await setDoc(doc(db, 'users', studentId), { status: 'rejected', updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
    showFeedback(`تم رفض طلب حساب الطالب (${studentName}). سيظهر له تنبيه بإنشاء حساب جديد والتأكد من صحة المعلومات.`, 'error');
    if (selectedStudentForModal && selectedStudentForModal.id === studentId) {
      setSelectedStudentForModal({ ...selectedStudentForModal, status: 'rejected' });
    }
  };

  const handleSetPending = async (studentId: string, studentName: string) => {
    const updated = students.map((s) => {
      if (s.id === studentId) {
        return { ...s, status: 'pending' as const };
      }
      return s;
    });
    onUpdateStudents(updated);
    saveUsers(updated);
    await setDoc(doc(db, 'users', studentId), { status: 'pending', updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
    showFeedback(`تمت إعادة حساب الطالب (${studentName}) إلى حالة قيد المراجعة في Firebase.`);
    if (selectedStudentForModal && selectedStudentForModal.id === studentId) {
      setSelectedStudentForModal({ ...selectedStudentForModal, status: 'pending' });
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (
      !window.confirm(
        `هل أنت متأكد من حذف حساب الطالب "${studentName}" نهائياً من المنصة وسحابة Firebase؟\n\nتنبيه: سيتم مسح الحساب وبياناته بالكامل ولا يمكن استرجاعه.`
      )
    ) {
      return;
    }

    try {
      addDeletedUserId(studentId);
      const updated = students.filter((s) => s.id !== studentId);
      onUpdateStudents(updated);
      saveUsers(updated);
      deleteUserFromServer(studentId).catch(() => {});
      await deleteUserFromFirestore(studentId);

      if (selectedStudentForModal && selectedStudentForModal.id === studentId) {
        setSelectedStudentForModal(null);
      }
      showFeedback(`تم حذف حساب الطالب "${studentName}" بنجاح من المنصة وسحابة Firebase 🗑️`, 'success');
    } catch (err) {
      console.warn('Error deleting student:', err);
      showFeedback('حدث خطأ أثناء حذف الحساب، يرجى المحاولة مرة أخرى.', 'error');
    }
  };

  const handleManualRefreshStudents = async () => {
    setIsRefreshingStudents(true);
    try {
      const data = await loadAllFromFirebase();
      if (Array.isArray(data.users)) {
        onUpdateStudents(data.users);
        showFeedback(`تم تجميع وتحديث بيانات ${data.users.length} حساب من Firebase بنجاح 🔄`, 'success');
      } else {
        showFeedback('تم فحص السحابة بنجاح', 'success');
      }
    } catch (err: any) {
      console.warn('Manual refresh students error:', err);
      showFeedback('تعذر التحديث: ' + (err?.message || 'خطأ في الاتصال'), 'error');
    } finally {
      setIsRefreshingStudents(false);
    }
  };

  const handleTerminateStudentSession = async (studentId: string, studentName: string) => {
    if (
      !window.confirm(
        `هل أنت متأكد من إنهاء جلسة الطالب "${studentName}"؟\nسيتم تسجيل خروجه فوراً من جهازه ومنعه من المتابعة دون تسجيل الدخول مجدداً.`
      )
    ) {
      return;
    }

    try {
      await setDoc(doc(db, 'users', studentId), { activeSessionId: '', isOnline: false }, { merge: true });
      const updated = students.map((s) => (s.id === studentId ? { ...s, activeSessionId: '', isOnline: false } : s));
      onUpdateStudents(updated);
      saveUsers(updated);
      if (selectedStudentForModal && selectedStudentForModal.id === studentId) {
        setSelectedStudentForModal({ ...selectedStudentForModal, activeSessionId: '', isOnline: false });
      }
      showFeedback(`تم إنهاء جلسة الطالب "${studentName}" وتسجيل خروجه من جهازه بنجاح ✅`, 'success');
    } catch (err: any) {
      console.warn('Error terminating student session:', err);
      showFeedback('تعذر إنهاء الجلسة، يرجى المحاولة لاحقاً.', 'error');
    }
  };

  const handleResetStudentDeviceBinding = async (studentId: string, studentName: string) => {
    if (
      !window.confirm(
        `هل أنت متأكد من رغبتك في إعادة ضبط اقتران جهاز الطالب "${studentName}"؟\nسيتم مسح الجهاز المقترن وسجل تغييرات الجهاز فوراً ليتمكن الطالب من الدخول بجهازه الجديد.`
      )
    ) {
      return;
    }

    try {
      const resetHeaders = await getClientAuthHeaders({ 'Content-Type': 'application/json' });
      await fetch('/api/admin/reset-student-device', {
        method: 'POST',
        headers: resetHeaders,
        body: JSON.stringify({ studentId }),
      });
      await setDoc(doc(db, 'users', studentId), {
        currentDeviceId: '',
        currentDeviceName: '',
        deviceChangesHistory: [],
        activeSessionId: '',
        isOnline: false,
      }, { merge: true }).catch(() => {});

      const updated = students.map((s) => (s.id === studentId ? {
        ...s,
        currentDeviceId: '',
        currentDeviceName: '',
        deviceChangesHistory: [],
        activeSessionId: '',
        isOnline: false,
      } : s));
      onUpdateStudents(updated);
      saveUsers(updated);
      if (selectedStudentForModal && selectedStudentForModal.id === studentId) {
        setSelectedStudentForModal({
          ...selectedStudentForModal,
          currentDeviceId: '',
          currentDeviceName: '',
          deviceChangesHistory: [],
          activeSessionId: '',
          isOnline: false,
        });
      }
      showFeedback(`تمت إعادة ضبط جهاز الطالب "${studentName}" بنجاح، ويمكنه الآن الدخول من أي جهاز جديد ✅`, 'success');
    } catch (err: any) {
      console.warn('Error resetting student device:', err);
      showFeedback('تعذر إعادة ضبط الجهاز، يرجى المحاولة لاحقاً.', 'error');
    }
  };

  // --- Course Actions ---
  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;

    const finalNewDivision = isPrimaryOrPrepGrade(newCourseYear) ? '' : newCourseDivision;
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      title: newCourseTitle.trim(),
      schoolYear: newCourseYear,
      division: finalNewDivision,
      subject: newCourseSubject,
      branch: finalNewDivision.includes('أدبي') ? 'literary' : 'scientific',
      coverImage: newCourseCover || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
      price: Number(newCoursePrice) || 0,
      priceCurrency: 'جنيه',
      paymentPhone: newCoursePaymentPhone.trim() || undefined,
      paymentQrCode: newCoursePaymentQrCode || undefined,
      description: newCourseDesc || 'كورس تعليمي شامل ومنهجي مع بنك امتحانات تسلسلي واشتراك بالكود المعتمد.',
      instructor: 'أ/ سوزان كريم فهمي',
      instructorId: 'teacher-1791139743075',
      teacherName: 'أ/ سوزان كريم فهمي',
      courseType: newCourseType,
      isLocked: true, // المغلق افتراضياً ويتطلب كود
      isPublished: true,
      createdAt: new Date().toISOString().split('T')[0],
      lessons: [],
      exams: [],
    };

    const updated = [newCourse, ...courses];
    onUpdateCourses(updated);
    saveCourses(updated);
    setIsAddCourseModalOpen(false);
    setNewCourseTitle('');
    setNewCourseDesc('');
    setNewCoursePaymentPhone('');
    setNewCoursePaymentQrCode('');
    showFeedback(`تم إنشاء كورس (${newCourse.title}) بنجاح وحفظه في المنصة!`);
  };

  const handleDeleteCourse = (courseId: string, courseTitle: string) => {
    if (window.confirm(`هل أنت متأكد تماماً من حذف كورس (${courseTitle}) وجميع الامتحانات المرتبطة به؟`)) {
      addDeletedCourseId(courseId);
      const updated = courses.filter((c) => c.id !== courseId);
      onUpdateCourses(updated);
      saveCourses(updated);
      deleteCourseFromServer(courseId).catch(() => {});
      showFeedback(`تم حذف كورس (${courseTitle}) بنجاح!`, 'error');
    }
  };

  // --- Manual Exam Question Actions ---
  const handleAddQuestionDraft = (type: 'mcq' | 'essay') => {
    const newQ: ManualQuestionDraft = {
      id: `q-${Date.now()}-${questionsDraft.length + 1}`,
      type,
      questionText: type === 'mcq' ? `سؤال اختيار من متعدد #${questionsDraft.length + 1}` : `سؤال مقالي واستنتاج #${questionsDraft.length + 1}`,
      questionImage: '',
      marks: type === 'mcq' ? 10 : 20,
      options: type === 'mcq' ? ['الخيار الأول', 'الخيار الثاني', 'الخيار الثالث', 'الخيار الرابع'] : [],
      optionImages: type === 'mcq' ? ['', '', '', ''] : [],
      correctOptionIndex: 0,
      modelAnswer: type === 'mcq' ? 'التعليل: الإجابة النموذجية الصحيحة وفق القواعد المعتمدة.' : 'خطوات الحل والتعويض النموذجي مع الواحدة الرياضية.',
      modelAnswerImage: '',
      rubricCriteria: type === 'essay' ? ['كتابة القانون والرمز (5 درجات)', 'التعويض الحسابي (10 درجات)', 'الناتج والواحدة (5 درجات)'] : [],
    };
    setQuestionsDraft([...questionsDraft, newQ]);
  };

  const handleRemoveQuestionDraft = (qId: string) => {
    if (questionsDraft.length <= 1) {
      showFeedback('يجب أن يحتوي الامتحان على سؤال واحد على الأقل.', 'error');
      return;
    }
    setQuestionsDraft(questionsDraft.filter((q) => q.id !== qId));
  };

  const handleSaveManualExam = () => {
    if (!selectedCourseForExam) {
      showFeedback('الرجاء اختيار الكورس المراد إضافة الامتحان إليه.', 'error');
      return;
    }
    if (!manualExamLesson.trim()) {
      showFeedback('الرجاء إدخال اسم الدرس أو موضوع الامتحان.', 'error');
      return;
    }

    const courseIndex = courses.findIndex((c) => c.id === selectedCourseForExam);
    if (courseIndex === -1) return;

    const targetCourse = courses[courseIndex];
    const newExamOrder = targetCourse.exams.length + 1;

    const formattedQuestions: ExamQuestion[] = questionsDraft.map((qd) => ({
      id: qd.id,
      type: qd.type,
      questionText: qd.questionText,
      questionImage: qd.questionImage || undefined,
      marks: Number(qd.marks) || 10,
      options: qd.type === 'mcq' ? qd.options : undefined,
      optionImages: qd.type === 'mcq' ? qd.optionImages : undefined,
      correctOptionIndex: qd.type === 'mcq' ? qd.correctOptionIndex : undefined,
      modelAnswer: qd.modelAnswer,
      modelAnswerImage: qd.modelAnswerImage || undefined,
      rubricCriteria: qd.type === 'essay' ? qd.rubricCriteria : undefined,
      bookReference: `كورس ${targetCourse.title} - درس ${manualExamLesson}`,
    }));

    const newExam: CourseExam = {
      id: `exam-${Date.now()}`,
      courseId: targetCourse.id,
      title: manualExamTitle.trim() || `الامتحان #${newExamOrder}: ${manualExamLesson.trim()}`,
      lessonTitle: manualExamLesson.trim(),
      order: newExamOrder,
      durationMinutes: Number(manualExamDuration) || 30,
      passingPercentage: Number(manualExamPassing) || 60,
      isPublished: true,
      questions: formattedQuestions,
      bookReference: `كورس ${targetCourse.title} - درس ${manualExamLesson}`,
      createdAt: new Date().toISOString().split('T')[0],
      isManual: true,
    };

    const updatedCourse: Course = {
      ...targetCourse,
      exams: [...targetCourse.exams, newExam],
    };

    const updatedCourses = [...courses];
    updatedCourses[courseIndex] = updatedCourse;
    onUpdateCourses(updatedCourses);
    saveCourses(updatedCourses);
    saveExamToStore(newExam, targetCourse.id);

    showFeedback(`تم حفظ ونشر الامتحان اليدوي بنجاح وحفظه محلياً وسحابياً برقم تسلسلي #${newExamOrder} في كورس (${targetCourse.title})! ✅`);
    setManualExamTitle('');
    setManualExamLesson('');
    // Reset drafts
    setQuestionsDraft([
      {
        id: `q-${Date.now()}-1`,
        type: 'mcq',
        questionText: 'السؤال الأول: اختر الإجابة الصحيحة',
        questionImage: '',
        marks: 10,
        options: ['الخيار (أ)', 'الخيار (ب)', 'الخيار (ج)', 'الخيار (د)'],
        correctOptionIndex: 0,
        modelAnswer: 'الإجابة النموذجية المعتمدة.',
        modelAnswerImage: '',
        rubricCriteria: [],
      }
    ]);
  };

  // --- Competition Actions ---
  const handleCreateCompetition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compTitle.trim()) return;

    const newComp: Competition = {
      id: `comp-${Date.now()}`,
      title: compTitle.trim(),
      schoolYear: compYear,
      durationMinutes: Number(compDuration) || 15,
      isFree: true,
      description: compDesc || 'مسابقة تنافسية كبرى لجميع طلاب الجمهورية مع تصحيح فوري ولوحة شرف مباشرة.',
      prizeInfo: compPrize || 'وسام التفوق + كورس مجاني مهدى من الإدارة',
      isPublished: true,
      createdAt: new Date().toISOString().split('T')[0],
      participantsCount: 0,
      leaderboard: [],
      questions: [],
    };

    const updated = [newComp, ...competitions];
    onUpdateCompetitions(updated);
    saveCompetitions(updated);
    setIsAddCompModalOpen(false);
    setCompTitle('');
    setCompDesc('');
    setCompPrize('');
    showFeedback(`تم إنشاء مسابقة (${newComp.title}) بنجاح!`);
  };

  const handleDeleteCompetition = (compId: string, compTitle: string) => {
    if (window.confirm(`هل أنت متأكد من حذف مسابقة (${compTitle})؟`)) {
      const updated = competitions.filter((c) => c.id !== compId);
      onUpdateCompetitions(updated);
      saveCompetitions(updated);
      showFeedback(`تم حذف مسابقة (${compTitle}) بنجاح!`, 'error');
    }
  };

  // --- Settings Actions ---
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(settingsForm);
    showFeedback('تم حفظ إعدادات المنصة بنجاح!');
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'hos098sam@gmail.com';

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-slate-900 border border-rose-500/30 text-white text-center space-y-4 shadow-2xl" dir="rtl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black">منطقة محمية — خاصة بالإدارة العامة فقط</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          عذراً، لا تملك صلاحيات الوصول إلى لوحة تحكم الإدارة. هذه اللوحة محمية ومخصصة للمشرف العام فقط.
        </p>
        <button
          onClick={onOpenAuth}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition-colors cursor-pointer"
        >
          تسجيل الدخول بحساب الإدارة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Toast Feedback Notification */}
      {feedbackMsg && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-2xl shadow-xl border text-xs sm:text-sm font-black flex items-center gap-2.5 animate-bounce ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
              : 'bg-rose-600 text-white border-rose-500 shadow-rose-600/30'
          }`}
        >
          {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Top Admin Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-[36px] p-6 sm:p-10 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-indigo-400/50 overflow-hidden shrink-0">
              <img
                src={motafalsifaLogo}
                alt="شعار منصة المتفلسفة "
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">لوحة الكنترول والإدارة المركزية</h1>
                <span className="text-xs font-black bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                  01040672314
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                منصة المتفلسفة  • المشرف العام: <b>{platformSettings.supervisorName}</b> • متابعة الطلاب، الكورسات، والامتحانات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Dedicated Weekly Course Sales & Revenue Button */}
            <button
              type="button"
              onClick={() => openSectionFullPage('weekly_sales')}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer border-2 border-emerald-300"
              title="عرض عدد الكورسات المباعة للطلاب والأموال الداخلة كل أسبوع بأسبوعه"
            >
              <BarChart3 className="w-4 h-4 text-slate-950" />
              <span>مبيعات الكورسات والأرباح (أسبوع بأسبوع) 💰</span>
            </button>

            {onOpenHomeVisualEditor && (
              <button
                onClick={onOpenHomeVisualEditor}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                title="فتح الشاشة الرئيسية للمنصة وتعديل أو تحريك أو حذف أو إضافة أي قسم وحفظه لجميع الطلاب"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>تعديل وتخصيص الصفحة الرئيسية 🏠✨</span>
              </button>
            )}

            {onOpenThemeCustomizer && (
              <button
                type="button"
                onClick={onOpenThemeCustomizer}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer"
                title="تعديل ألوان المنصة وصفحات تسجيل الدخول وإنشاء الحساب"
              >
                <Palette className="w-4 h-4 text-slate-950" />
                <span>تعديل الألوان والصفحات 🎨</span>
              </button>
            )}

            <button
              onClick={() => openSectionFullPage('support_chat')}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-amber-300" />
              <span>رسائل الدعم الفني للطلاب 💬</span>
            </button>

            <button
              onClick={() => openSectionFullPage('notifications')}
              className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center gap-2 cursor-pointer"
            >
              <Bell className="w-4 h-4 text-slate-950" />
              <span>إرسال إشعار للأجهزة 📢</span>
            </button>

            {!isAdmin && (
              <button
                onClick={onOpenAuth}
                className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-400/20 flex items-center gap-2 self-start sm:self-auto"
              >
                <Lock className="w-4 h-4" />
                <span>تسجيل الدخول</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick KPI Overview Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 pb-1 border-t border-slate-800/80">
          <div
            onClick={() => setActiveTab('analytics')}
            className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-all group"
            title="انقر لفتح لوحة التحليلات والإحصائيات"
          >
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-400">إجمالي الطلاب المسجلين</span>
              <div className="text-lg font-black text-white font-mono flex items-center gap-2">
                <span>{registeredStudents.length.toLocaleString('ar-EG')} طالب</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-800/60">
                  {activeStudentsCount} نشط
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div
            onClick={() => setActiveTab('analytics')}
            className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-all group"
            title="انقر لفتح لوحة التحليلات والإحصائيات"
          >
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-400">إجمالي الكورسات المفعلة</span>
              <div className="text-lg font-black text-white font-mono flex items-center gap-2">
                <span>{activePublishedCoursesCount} كورس</span>
                <span className="text-[10px] font-bold text-slate-400">من {courses.length}</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>

          <div
            onClick={() => setActiveTab('analytics')}
            className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-all group"
            title="انقر لفتح لوحة التحليلات والإحصائيات"
          >
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-400">نسبة الإقبال على المسابقات</span>
              <div className="text-lg font-black text-amber-400 font-mono flex items-center gap-2">
                <span>{competitionEngagementRate}%</span>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-800/60">
                  {competitions.length} مسابقة
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Dashboard Tabs Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2.5 pt-4 border-t border-slate-800">
          {onOpenHomeVisualEditor && (
            <button
              type="button"
              onClick={onOpenHomeVisualEditor}
              className="py-3 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20 hover:brightness-110 cursor-pointer"
            >
              <LayoutGrid className="w-4 h-4 text-slate-950" />
              <span>تحرير الصفحة الرئيسية 🏠</span>
            </button>
          )}

          {onOpenThemeCustomizer && (
            <button
              type="button"
              onClick={onOpenThemeCustomizer}
              className="py-3 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110 cursor-pointer"
            >
              <Palette className="w-4 h-4 text-slate-950" />
              <span>الألوان والصفحات 🎨</span>
            </button>
          )}

          <button
            onClick={() => openSectionFullPage('analytics')}
            className={`py-3 px-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-400/20 font-black'
                : 'bg-slate-800/80 text-amber-300 hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span>الإحصائيات 📊</span>
          </button>

          <button
            onClick={() => openSectionFullPage('notifications')}
            className={`py-3 px-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'bg-slate-800/80 text-amber-300 hover:bg-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>الإشعارات 📢</span>
          </button>
          <button
            onClick={() => openSectionFullPage('students')}
            className={`py-3 px-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'students'
                ? 'bg-white text-slate-950 shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>الطلاب ({registeredStudents.length})</span>
            {pendingStudentsCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] flex items-center justify-center font-bold">
                {pendingStudentsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => openSectionFullPage('weekly_sales')}
            className={`py-3 px-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'weekly_sales'
                ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/25 font-black'
                : 'bg-slate-800/80 text-emerald-300 hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>مبيعات الكورسات 💰</span>
          </button>

          <button
            onClick={() => openSectionFullPage('courses')}
            className={`py-3 px-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'courses'
                ? 'bg-white text-slate-950 shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>الكورسات ({courses.length})</span>
          </button>

          <button
            onClick={() => openSectionFullPage('manual_exam')}
            className={`py-3 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'manual_exam'
                ? 'bg-white text-slate-950 shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileEdit className="w-4 h-4 text-amber-400" />
            <span>منشئ الامتحانات اليدوي</span>
          </button>

          <button
            onClick={() => openSectionFullPage('competitions')}
            className={`py-3 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'competitions'
                ? 'bg-white text-slate-950 shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4 text-rose-400" />
            <span>المسابقات ({competitions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLuckyWheelGrade(studentGradeFilter);
              setIsLuckyWheelOpen(true);
            }}
            className="py-3 px-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110 cursor-pointer shrink-0"
            title="فتح عجلة الحظ لاختيار طالب يكسب في سحب كسبت معانا"
          >
            <Gift className="w-4 h-4 text-slate-950" />
            <span>كسبت معانا! 🎡</span>
          </button>

          <button
            onClick={() => openSectionFullPage('settings')}
            className={`py-3 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white text-slate-950 shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4 text-slate-400" />
            <span>الإعدادات</span>
          </button>

          <button
            onClick={() => openSectionFullPage('whatsapp')}
            className={`py-3 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-indigo-300 hover:bg-slate-800'
            }`}
          >
            <Mail className="w-4 h-4 text-indigo-400" />
            <span>بريد الاسترداد (almtflsft@gmail.com)</span>
          </button>

          <button
            onClick={() => openSectionFullPage('support_chat')}
            className={`py-3 px-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'support_chat'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'bg-indigo-600/90 text-white hover:bg-indigo-500 border border-amber-400/50'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-amber-300" />
            <span>رسائل الدعم الفني المباشر 💬</span>
          </button>
        </div>
      </div>

      {/* Full-Page Dedicated View Wrapper when any admin button is clicked */}
      {isFullPageMode && (
        <div className="bg-slate-900 text-white rounded-3xl p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 shadow-lg border border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-black text-xs sm:text-sm">
              وضع الصفحة الكاملة: {
                activeTab === 'analytics' ? 'الإحصائيات والتحليلات 📊' :
                activeTab === 'weekly_sales' ? 'مبيعات الكورسات والأرباح أسبوع بأسبوع 💰' :
                activeTab === 'notifications' ? 'بث الإشعارات الفورية 📢' :
                activeTab === 'students' ? 'إدارة الطلاب والحسابات 👨‍🎓' :
                activeTab === 'courses' ? 'إدارة الكورسات والدروس 📚' :
                activeTab === 'manual_exam' ? 'منشئ الامتحانات اليدوي 📝' :
                activeTab === 'competitions' ? 'إدارة المسابقات الكبرى 🏆' :
                activeTab === 'whatsapp' ? 'إدارة البريد الرسمي لاسترداد كلمة السر (almtflsft@gmail.com) 📧' :
                activeTab === 'support_chat' ? 'رسائل الدعم الفني المباشر مع الطلاب 💬' :
                'إعدادات وهوية المنصة ⚙️'
              }
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsFullPageMode(false)}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            <span>إغلاق وضع الصفحة الكاملة</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 0: ANALYTICS & RECHARTS STATISTICAL DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <AdminAnalyticsDashboard
          students={students}
          courses={courses}
          competitions={competitions}
          submissions={submissions}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 1: STUDENTS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-indigo-800">إجمالي الطلاب المسجلين:</span>
                <div className="text-2xl font-black text-indigo-950">{registeredStudents.length} طلاب</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-800">🟢 مسجلون دخول الآن (جلسات نشطة):</span>
                <div className="text-2xl font-black text-emerald-950">{loggedInStudentsCount} طلاب</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black">
                <Smartphone className="w-6 h-6" />
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-sky-800">الحسابات المعتمدة (المقبولة):</span>
                <div className="text-2xl font-black text-sky-950">{activeStudentsCount} طلاب</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-800">طلبات قيد المراجعة:</span>
                <div className="text-2xl font-black text-amber-950">{pendingStudentsCount} طلاب</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Search, Sync and Filters Bar */}
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
            <div className="relative flex-1">
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="ابحث باسم الطالب، رقم الهاتف، المحافظة، أو المدرسة..."
                className="w-full pl-4 pr-10 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleManualRefreshStudents}
                disabled={isRefreshingStudents}
                className="px-3.5 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-black transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                title="تحديث وسحب قائمة الطلاب فورياً من قاعدة بيانات Firebase"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingStudents ? 'animate-spin' : ''}`} />
                <span>{isRefreshingStudents ? 'جاري التجميع...' : 'تحديث من Firebase 🔄'}</span>
              </button>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl shrink-0 overflow-x-auto">
                <button
                  onClick={() => setStudentStatusFilter('all')}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                    studentStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  الكل ({registeredStudents.length})
                </button>
                <button
                  onClick={() => setStudentStatusFilter('logged_in')}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                    studentStatusFilter === 'logged_in' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>متصلون الآن ({loggedInStudentsCount})</span>
                </button>
                <button
                  onClick={() => setStudentStatusFilter('active')}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                    studentStatusFilter === 'active' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  المقبولون ({activeStudentsCount})
                </button>
                <button
                  onClick={() => setStudentStatusFilter('pending')}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                    studentStatusFilter === 'pending' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <span>قيد المراجعة</span>
                  {pendingStudentsCount > 0 && <span>({pendingStudentsCount})</span>}
                </button>
                <button
                  onClick={() => setStudentStatusFilter('rejected')}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                    studentStatusFilter === 'rejected' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  المرفوضون ({rejectedStudentsCount})
                </button>
              </div>
            </div>
          </div>

          {/* Grade Selection Bar - زرار لكل طلاب مرحلة لوحده */}
          <div className="bg-white border border-slate-200 rounded-[28px] p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-lg">
                  🎓
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">تصفية الطلاب حسب المرحلة الدراسية:</h4>
                  <p className="text-[11px] text-slate-500 font-medium">اضغط على زر أي مرحلة لعرض وتجميع درجات وإحصائيات طلابها بشكل منفصل</p>
                </div>
              </div>

              {/* Quick Wheel Trigger Button */}
              <button
                type="button"
                onClick={() => {
                  setLuckyWheelGrade(studentGradeFilter);
                  setIsLuckyWheelOpen(true);
                }}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                title="إجراء سحب عشوائي تفاعلي لاختيار طالب يكسب جائزة"
              >
                <Gift className="w-4 h-4 text-slate-950" />
                <span>🎡 عجلة الحظ: كسبت معانا!</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-950 text-amber-400 font-bold">جديد</span>
              </button>
            </div>

            {/* Buttons for each grade */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStudentGradeFilter('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  studentGradeFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-2 ring-indigo-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>جميع المراحل</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    studentGradeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {registeredStudents.length}
                </span>
              </button>

              {OFFICIAL_SCHOOL_GRADES.map((grade) => {
                const count = registeredStudents.filter((s) => normalizeGrade(s.schoolYear) === grade).length;
                const isSelected = studentGradeFilter === grade;
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setStudentGradeFilter(grade)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-2 ring-indigo-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{grade}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aggregated Scores and Grade Statistics Banner (المنصة تجمع درجات وإحصائيات الحسابات) */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-[32px] p-5 sm:p-6 text-white shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                    <span>📊 مجمع درجات وإحصائيات الحسابات:</span>
                    <span className="text-amber-400 font-extrabold">{gradeAggregateStats.gradeName}</span>
                  </h3>
                </div>
                <p className="text-xs text-indigo-200 font-medium">
                  حصر وتجميع شامل لكافة درجات الامتحانات والنسب المحصلة لحسابات طلاب هذه المرحلة
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setLuckyWheelGrade(studentGradeFilter);
                  setIsLuckyWheelOpen(true);
                }}
                className="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center gap-2 shrink-0 cursor-pointer self-start sm:self-auto"
              >
                <RotateCw className="w-4 h-4 text-slate-950" />
                <span>سحب عجلة «كسبت معانا» لطلاب المرحلة 🎡</span>
              </button>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 relative z-10">
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                <span className="text-[11px] text-indigo-200 block mb-0.5">عدد طلاب المرحلة:</span>
                <div className="text-xl font-black text-white">{gradeAggregateStats.totalStudents} طالب</div>
                <span className="text-[10px] text-emerald-400 block mt-1">({gradeAggregateStats.activeStudents} مفعل)</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                <span className="text-[11px] text-indigo-200 block mb-0.5">الامتحانات المكتملة:</span>
                <div className="text-xl font-black text-sky-400">{gradeAggregateStats.totalExamsTaken} امتحان</div>
                <span className="text-[10px] text-indigo-300 block mt-1">تسليمات مصححة</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                <span className="text-[11px] text-indigo-200 block mb-0.5">مجموع الدرجات المحصلة:</span>
                <div className="text-xl font-black text-amber-400 font-mono">
                  {gradeAggregateStats.totalScoreEarned}
                </div>
                <span className="text-[10px] text-indigo-300 block mt-1">من إجمالي {gradeAggregateStats.totalMaxScorePossible}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                <span className="text-[11px] text-indigo-200 block mb-0.5">متوسط نسبة المرحلة:</span>
                <div className="text-xl font-black text-emerald-400 font-mono">
                  %{gradeAggregateStats.gradeAveragePercentage}
                </div>
                <span className="text-[10px] text-emerald-300 block mt-1">المعدل العام</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-indigo-200 block mb-0.5">نسبة النجاح والاجتياز:</span>
                <div className="text-xl font-black text-indigo-200 font-mono">
                  %{gradeAggregateStats.overallPassRate}
                </div>
                <span className="text-[10px] text-sky-300 block mt-1">امتحانات مجتازة</span>
              </div>
            </div>

            {/* Top Students Mini-Honor-Roll (المتصدرون في المرحلة) */}
            {gradeAggregateStats.topStudents.length > 0 && gradeAggregateStats.topStudents[0].stats.totalExamsTaken > 0 && (
              <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center gap-2 text-xs relative z-10">
                <span className="text-amber-300 font-black flex items-center gap-1 shrink-0">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>أوائل ومتصدرو المرحلة:</span>
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {gradeAggregateStats.topStudents
                    .filter((ts) => ts.stats.totalExamsTaken > 0)
                    .slice(0, 4)
                    .map((ts, idx) => (
                      <div
                        key={ts.student.id}
                        className="px-2.5 py-1 rounded-xl bg-white/15 border border-white/15 flex items-center gap-1.5 text-[11px]"
                      >
                        <span className="font-mono font-black text-amber-300">#{idx + 1}</span>
                        <span className="font-bold text-white">{ts.student.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/30 text-emerald-300 font-mono">
                          %{ts.stats.averagePercentage} ({ts.stats.totalScore} د)
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Students List Table */}
          <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold">
                  <tr>
                    <th className="p-4 pr-6">الطالب</th>
                    <th className="p-4">رقم الهاتف</th>
                    <th className="p-4">الصف والشعبة</th>
                    <th className="p-4">الدرجات والإحصائيات</th>
                    <th className="p-4">المحافظة والمدرسة</th>
                    <th className="p-4">حالة الدخول والجلسة</th>
                    <th className="p-4">حالة الحساب</th>
                    <th className="p-4 text-center">الإجراءات والقرار</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((st) => {
                      const stStatus = st.status || 'active';
                      const loggedIn = isStudentLoggedIn(st);
                      const stats = calculateStudentStats(st, submissions, courses);
                      return (
                        <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-4 pr-6">
                            <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                              <span>{st.name}</span>
                              {loggedIn && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" title="متصل الآن"></span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                              <span>المحافظة: {st.governorate || 'السويس'}</span>
                              <span>•</span>
                              <span>تاريخ التسجيل: {st.registeredAt}</span>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-black text-[10px]">
                                💰 المحفظة: {st.walletBalance || 0} ج.م
                              </span>
                            </div>
                          </td>

                          <td className="p-4 font-mono font-bold text-slate-800" dir="ltr">
                            <div>{st.phone}</div>
                            <div className="text-[10px] text-slate-400">ولي الأمر: {st.parentPhone || st.fatherPhone || '—'}</div>
                          </td>

                          <td className="p-4">
                            <span className="font-bold text-indigo-700 block">{st.schoolYear}</span>
                            {st.division && <span className="text-[10px] font-black text-amber-700">{st.division}</span>}
                          </td>

                          {/* Student Aggregated Score and Statistics Cell */}
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 font-black text-xs text-slate-900">
                                <span className="text-indigo-600 font-mono text-sm">{stats.totalScore}</span>
                                <span className="text-slate-400 font-normal">من</span>
                                <span className="text-slate-600 font-mono text-xs">{stats.totalMaxScore || 100}</span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold ${
                                    stats.averagePercentage >= 70
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : stats.averagePercentage >= 50
                                      ? 'bg-amber-100 text-amber-800'
                                      : stats.totalExamsTaken > 0
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  %{stats.averagePercentage}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                <span>{stats.totalExamsTaken} امتحان</span>
                                {stats.totalExamsTaken > 0 && (
                                  <span className="text-[10px] font-bold text-emerald-600">({stats.passedExamsCount} ناجح)</span>
                                )}
                              </div>
                              <div className="text-[10px] font-bold text-slate-500 truncate max-w-[130px]">
                                {stats.gradeBadge}
                              </div>
                            </div>
                          </td>

                          <td className="p-4 text-slate-600">
                            <div>{st.governorate || 'السويس'}</div>
                            <div className="text-[10px] text-slate-400">{st.schoolName || '—'}</div>
                          </td>

                          <td className="p-4">
                            {loggedIn ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                  <span>متصل / جلسة نشطة</span>
                                </span>
                                {st.lastLoginAt && (
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    آخر دخول: {new Date(st.lastLoginAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                  <span>غير متصل</span>
                                </span>
                                {st.lastLoginAt ? (
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {new Date(st.lastLoginAt).toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' })}
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-slate-400">لم يدخل بعد</div>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="p-4">
                            {stStatus === 'pending' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3" />
                                <span>قيد المراجعة</span>
                              </span>
                            ) : stStatus === 'rejected' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                <XCircle className="w-3 h-3" />
                                <span>مرفوض</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>مقبول ومفعل</span>
                              </span>
                            )}
                          </td>

                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => setSelectedStudentForModal(st)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] transition-all flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>عرض البطاقة</span>
                              </button>

                              {/* زر شحن رصيد مباشر لمحفظة الطالب */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudentForModal(st);
                                  setDirectTopUpMode('add');
                                  setDirectTopUpAmount(100);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-500 text-amber-900 hover:text-white border border-amber-200 font-black text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="شحن أو تعديل رصيد محفظة الطالب مباشرة"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>شحن المحفظة ({st.walletBalance || 0} ج.م) 💰</span>
                              </button>

                              {/* زر متابعة ولي الأمر مباشرة عبر واتساب المدرس */}
                              <a
                                href={buildDirectParentWhatsappUrl(st, courses, submissions, currentUser?.name)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-200 font-black text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="فتح واتساب المدرس مباشرة في محادثة ولي الأمر برسالة التقرير المنظمة والجاهزة للإرسال"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>متابعة ولي الأمر 📲</span>
                              </a>

                              {/* زر إنهاء الجلسة عن بُعد لو مسجل دخول على جهاز */}
                              {st.activeSessionId && (
                                <button
                                  type="button"
                                  onClick={() => handleTerminateStudentSession(st.id, st.name)}
                                  className="px-2 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[10px] transition-all flex items-center gap-1 shadow-2xs"
                                  title="تسجيل خروج إجباري من جهازه لمنع الاستخدام المتزامن"
                                >
                                  <LogOut className="w-3 h-3 text-amber-600" />
                                  <span>إنهاء الجلسة</span>
                                </button>
                              )}

                              {/* زر إعادة ضبط الجهاز المقترن للطالب */}
                              {st.currentDeviceId && (
                                <button
                                  type="button"
                                  onClick={() => handleResetStudentDeviceBinding(st.id, st.name)}
                                  className="px-2 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold text-[10px] transition-all flex items-center gap-1 shadow-2xs"
                                  title="إعادة ضبط اقتران جهاز الطالب ومسح قيد التغييرات الشهري"
                                >
                                  <Smartphone className="w-3 h-3 text-purple-600" />
                                  <span>فك اقتران الجهاز 📱</span>
                                </button>
                              )}

                              {stStatus === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => handleAcceptStudent(st.id, st.name)}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] transition-all flex items-center gap-1 shadow-xs"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>مقبول ✅</span>
                                  </button>
                                  <button
                                    onClick={() => handleRejectStudent(st.id, st.name)}
                                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[11px] transition-all flex items-center gap-1 shadow-xs"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>مرفوض ❌</span>
                                  </button>
                                </>
                              ) : stStatus === 'rejected' ? (
                                <button
                                  onClick={() => handleAcceptStudent(st.id, st.name)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] transition-all"
                                >
                                  إعادة القبول ✅
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleRejectStudent(st.id, st.name)}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition-all"
                                >
                                  إلغاء التفعيل ❌
                                </button>
                              )}

                              {/* زر حذف الحساب نهائياً */}
                              <button
                                onClick={() => handleDeleteStudent(st.id, st.name)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white font-bold text-[11px] transition-all flex items-center gap-1 border border-rose-200 hover:border-rose-600 cursor-pointer shadow-2xs"
                                title="حذف حساب الطالب نهائياً من المنصة وسحابة Firebase"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>حذف الحساب</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        لا يوجد طلاب مطابقين للبحث الحالي
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Student Details Full Page View */}
          {selectedStudentForModal && (
            <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 overflow-y-auto animate-fadeIn p-4 sm:p-8">
              <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-5xl mx-auto shadow-2xl p-6 sm:p-10 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black">
                      <IdCard className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">بطاقة بيانات الطالب وقرار القبول</h3>
                      <p className="text-xs text-slate-400">مراجعة كامل التفاصيل المدخلة في طلب إنشاء الحساب</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedStudentForModal(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>

                {/* Status Box & Actions */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-slate-400 font-bold block">الحالة الحالية:</span>
                    <span className="text-sm font-black text-slate-900">
                      {selectedStudentForModal.status === 'pending'
                        ? '⏳ قيد المراجعة والتدقيق'
                        : selectedStudentForModal.status === 'rejected'
                        ? '❌ تم الرفض'
                        : '✅ مقبول ونشط'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAcceptStudent(selectedStudentForModal.id, selectedStudentForModal.name)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>اعتماد وقبول ✅</span>
                    </button>
                    <button
                      onClick={() => handleRejectStudent(selectedStudentForModal.id, selectedStudentForModal.name)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>رفض الطلب ❌</span>
                    </button>
                  </div>
                </div>

                {/* Full Student Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-bold block">الاسم الرباعي:</span>
                    <span className="text-slate-900 font-black text-sm">{selectedStudentForModal.name}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-bold block">رقم هاتف الطالب:</span>
                    <span className="text-slate-900 font-black font-mono text-sm" dir="ltr">
                      {selectedStudentForModal.phone}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-bold block">المحافظة:</span>
                    <span className="text-slate-900 font-black text-sm">
                      {selectedStudentForModal.governorate || 'السويس'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-bold block">الصف الدراسي:</span>
                    <span className="text-indigo-700 font-black text-sm">{selectedStudentForModal.schoolYear}</span>
                  </div>

                  {selectedStudentForModal.division && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 font-bold block">الشعبة:</span>
                      <span className="text-amber-700 font-black text-sm">{selectedStudentForModal.division}</span>
                    </div>
                  )}

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-bold block">المحافظة:</span>
                    <span className="text-slate-900 font-bold text-sm">{selectedStudentForModal.governorate || 'السويس'}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-bold block">اسم المدرسة:</span>
                    <span className="text-slate-900 font-bold text-sm">{selectedStudentForModal.schoolName || '—'}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-bold block">رقم هاتف الأب / الأم:</span>
                    <span className="text-slate-900 font-black font-mono text-sm" dir="ltr">
                      {selectedStudentForModal.parentPhone || selectedStudentForModal.fatherPhone || selectedStudentForModal.motherPhone || '—'}
                    </span>
                  </div>

                  {selectedStudentForModal.parentJob && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 font-bold block">وظيفة ولي الأمر:</span>
                      <span className="text-slate-900 font-bold text-sm">{selectedStudentForModal.parentJob}</span>
                    </div>
                  )}

                  {selectedStudentForModal.religion && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 font-bold block">التربية الدينية:</span>
                      <span className="text-slate-900 font-bold text-sm">{selectedStudentForModal.religion}</span>
                    </div>
                  )}

                  {selectedStudentForModal.gender && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 font-bold block">النوع:</span>
                      <span className="text-slate-900 font-bold text-sm">{selectedStudentForModal.gender}</span>
                    </div>
                  )}

                  {selectedStudentForModal.email && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 sm:col-span-2">
                      <span className="text-slate-400 font-bold block">البريد الإلكتروني:</span>
                      <span className="text-slate-900 font-mono text-sm">{selectedStudentForModal.email}</span>
                    </div>
                  )}

                  {/* Device Session & Security Info */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 sm:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-indigo-600" />
                        <span>أمان الحساب والجهاز المقترن (Anti-Sharing):</span>
                      </span>
                      {selectedStudentForModal.activeSessionId ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>متصل بجلسة نشطة</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                          <span>لا توجد جلسة نشطة حالياً</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold">الجهاز المقترن حالياً:</span>
                        <strong className="text-slate-900 text-xs">{selectedStudentForModal.currentDeviceName || 'لم يتم ربط جهاز بعد'}</strong>
                        {selectedStudentForModal.currentDeviceId && (
                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-full">
                            ID: {selectedStudentForModal.currentDeviceId.substring(0, 16)}...
                          </div>
                        )}
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold">مرات تغيير الجهاز (آخر 30 يوماً):</span>
                        {(() => {
                          const changes = (selectedStudentForModal.deviceChangesHistory || []).filter(
                            (c, idx) =>
                              (c.isChange === true || c.type === 'device_change' || idx > 0) &&
                              Date.now() - new Date(c.changedAt).getTime() < 30 * 24 * 60 * 60 * 1000
                          );
                          const isMaxed = changes.length >= 2;
                          return (
                            <div className="flex items-center justify-between">
                              <span className={`font-mono font-black text-xs ${isMaxed ? 'text-rose-600' : 'text-slate-900'}`}>
                                {changes.length} من 2 مرات مسموحة
                              </span>
                              {isMaxed && (
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                  تم استنفاذ الحد 🔒
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 pt-1">
                      <div>
                        {selectedStudentForModal.lastLoginAt ? (
                          <span>آخر تسجيل دخول: <strong className="font-mono text-slate-900">{new Date(selectedStudentForModal.lastLoginAt).toLocaleString('ar-EG')}</strong></span>
                        ) : (
                          <span>لم يقم بتسجيل الدخول بعد</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedStudentForModal.currentDeviceId && (
                          <button
                            type="button"
                            onClick={() => handleResetStudentDeviceBinding(selectedStudentForModal.id, selectedStudentForModal.name)}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                            title="إعادة ضبط جهاز الطالب ومسح قيد التغيير"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>فك اقتران الجهاز 📱</span>
                          </button>
                        )}
                        {selectedStudentForModal.activeSessionId && (
                          <button
                            type="button"
                            onClick={() => handleTerminateStudentSession(selectedStudentForModal.id, selectedStudentForModal.name)}
                            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                            title="تسجيل خروج إجباري من جهازه"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>إنهاء الجلسة فوراً</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Student Electronic Wallet Direct Management Section */}
                  <div className="sm:col-span-2 p-4 rounded-2xl bg-gradient-to-l from-amber-50 via-yellow-50/70 to-white border-2 border-amber-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-slate-900">
                            محفظة الطالب الإلكترونية بالمنصة 💰
                          </h4>
                          <p className="text-[11px] text-slate-500 font-bold">
                            إضافة رصيد مباشر لحساب الطالب أو تعديل الرصيد الحالي لشراء وتفعيل الكورسات فوراً
                          </p>
                        </div>
                      </div>
                      <div className="px-4 py-2 rounded-2xl bg-white border-2 border-amber-300 text-center shadow-2xs">
                        <span className="text-[10px] text-slate-500 font-bold block">الرصيد الحالي بالمحفظة</span>
                        <span className="text-lg font-black text-amber-700 font-mono">
                          {selectedStudentForModal.walletBalance || 0} ج.م
                        </span>
                      </div>
                    </div>

                    {/* Quick Top-Up Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-black text-slate-700 ml-1">شحن سريع بضغطة واحدة:</span>
                      {[50, 100, 150, 200, 300, 500].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleDirectAdjustStudentWallet(selectedStudentForModal, preset, 'add')}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-500 text-amber-900 hover:text-white border border-amber-300 font-black text-xs transition-all cursor-pointer shadow-2xs"
                        >
                          +{preset} ج.م
                        </button>
                      ))}
                    </div>

                    {/* Custom Amount & Mode Form */}
                    <div className="pt-2 border-t border-amber-200/60 flex flex-col sm:flex-row items-center gap-2">
                      <select
                        value={directTopUpMode}
                        onChange={(e) => setDirectTopUpMode(e.target.value as 'add' | 'set')}
                        className="w-full sm:w-auto px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-black text-slate-800"
                      >
                        <option value="add">➕ إضافة مبلغ على الرصيد الحالي</option>
                        <option value="set">✏️ تحديد الرصيد النهائي مباشرة</option>
                      </select>
                      <div className="relative flex-1 w-full">
                        <input
                          type="number"
                          min="0"
                          value={directTopUpAmount}
                          onChange={(e) => setDirectTopUpAmount(Number(e.target.value))}
                          placeholder="أدخل المبلغ بالجنيه..."
                          className="w-full px-3 py-2 pl-12 rounded-xl bg-white border border-amber-300 text-xs font-black font-mono text-slate-900"
                        />
                        <span className="absolute left-3 top-2 text-[11px] font-black text-amber-700">ج.م</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleDirectAdjustStudentWallet(
                            selectedStudentForModal,
                            directTopUpAmount,
                            directTopUpMode
                          )
                        }
                        className="w-full sm:w-auto px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shrink-0 cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>
                          {directTopUpMode === 'set' ? 'تثبيت الرصيد الجديد' : 'إضافة الرصيد فوراً 💰'}
                        </span>
                      </button>
                    </div>

                    {/* Recent Wallet Transactions */}
                    {Array.isArray(selectedStudentForModal.walletTransactions) &&
                      selectedStudentForModal.walletTransactions.length > 0 && (
                        <div className="pt-2 border-t border-amber-200/60 space-y-1">
                          <span className="text-[10px] font-black text-slate-600 block">
                            آخر معاملات المحفظة للطالب:
                          </span>
                          <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                            {selectedStudentForModal.walletTransactions.slice(0, 5).map((tx) => (
                              <div
                                key={tx.id}
                                className="flex items-center justify-between text-[11px] bg-white/80 px-2.5 py-1 rounded-lg border border-amber-100"
                              >
                                <span className="font-bold text-slate-700">{tx.description}</span>
                                <div className="flex items-center gap-2 font-mono">
                                  <span
                                    className={`font-black ${
                                      tx.type === 'course_purchase' ? 'text-rose-600' : 'text-emerald-600'
                                    }`}
                                  >
                                    {tx.type === 'course_purchase' ? `-${tx.amount}` : `+${tx.amount}`} ج.م
                                  </span>
                                  <span className="text-[10px] text-slate-400">{tx.createdAt}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Student Enrolled Courses Section */}
                  <div className="sm:col-span-2 pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <BookmarkCheck className="w-4 h-4 text-indigo-600" />
                        <span>الكورسات المشترك بها الطالب ({(selectedStudentForModal.enrolledCourseIds || []).length}):</span>
                      </h4>
                    </div>

                    {/* Enrolled Courses Chips */}
                    {(selectedStudentForModal.enrolledCourseIds || []).length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">
                        لم يشترك الطالب في أي كورس بعد، أو لم يقم بتفعيل أكواد. يمكنك منحه وتثبيت اشتراك له مباشرة أدناه.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(selectedStudentForModal.enrolledCourseIds || []).map((cId) => {
                          const courseObj = courses.find((c) => c.id === cId);
                          return (
                            <div
                              key={cId}
                              className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center gap-2 text-xs font-bold text-indigo-950"
                            >
                              <span>{courseObj?.title || `كورس (${cId})`}</span>
                              <button
                                type="button"
                                title="إلغاء اشتراك الطالب في هذا الكورس"
                                onClick={async () => {
                                  const updatedIds = (selectedStudentForModal.enrolledCourseIds || []).filter(
                                    (id) => id !== cId
                                  );
                                  const updatedStudent = {
                                    ...selectedStudentForModal,
                                    enrolledCourseIds: updatedIds,
                                  };
                                  setSelectedStudentForModal(updatedStudent);
                                  saveStudentEnrolledCourses(selectedStudentForModal.id, updatedIds);
                                  await setDoc(doc(db, 'users', selectedStudentForModal.id), { enrolledCourseIds: updatedIds, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
                                  const updatedList = students.map((s) =>
                                    s.id === selectedStudentForModal.id ? updatedStudent : s
                                  );
                                  onUpdateStudents(updatedList);
                                  saveUsers(updatedList);
                                  showFeedback(`تم إلغاء اشتراك الطالب في كورس (${courseObj?.title || cId})`);
                                }}
                                className="w-4 h-4 rounded-full bg-indigo-200 hover:bg-rose-500 hover:text-white flex items-center justify-center text-[10px] text-indigo-800 transition-all cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add Course Directly Dropdown */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                      <select
                        id="admin-enroll-course-select"
                        className="w-full sm:w-auto flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          اختر كورساً لمنح الطالب اشتراكاً به وتثبيته...
                        </option>
                        {courses
                          .filter(
                            (c) => !(selectedStudentForModal.enrolledCourseIds || []).includes(c.id)
                          )
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title} - ({c.schoolYear})
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={async () => {
                          const selectEl = document.getElementById(
                            'admin-enroll-course-select'
                          ) as HTMLSelectElement;
                          const selectedCourseId = selectEl?.value;
                          if (!selectedCourseId) return;

                          const updatedIds = Array.from(
                            new Set([...(selectedStudentForModal.enrolledCourseIds || []), selectedCourseId])
                          );
                          const updatedStudent = {
                            ...selectedStudentForModal,
                            enrolledCourseIds: updatedIds,
                          };
                          setSelectedStudentForModal(updatedStudent);
                          saveStudentEnrolledCourses(selectedStudentForModal.id, updatedIds);
                          await setDoc(doc(db, 'users', selectedStudentForModal.id), { enrolledCourseIds: updatedIds, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
                          const updatedList = students.map((s) =>
                            s.id === selectedStudentForModal.id ? updatedStudent : s
                          );
                          onUpdateStudents(updatedList);
                          saveUsers(updatedList);
                          selectEl.value = '';
                          const cName = courses.find((c) => c.id === selectedCourseId)?.title;
                          showFeedback(`تم تثبيت اشتراك الطالب في (${cName || selectedCourseId}) بنجاح.`);
                        }}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shrink-0 cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>منح وتثبيت الاشتراك</span>
                      </button>
                    </div>
                  </div>

                  {/* Student Exam Results & Academic Analytics (تجميع درجات وإحصائيات الحساب) */}
                  {(() => {
                    const modalStudentStats = calculateStudentStats(selectedStudentForModal, submissions, courses);
                    return (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-indigo-600" />
                            <span>سجل درجات وإحصائيات الطالب الأكاديمية:</span>
                          </h4>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                            {modalStudentStats.gradeBadge}
                          </span>
                        </div>

                        {/* 4 Mini Metrics Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-500 block">الامتحانات المنجزة</span>
                            <span className="text-sm font-black text-slate-900">{modalStudentStats.totalExamsTaken}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-500 block">مجموع الدرجات</span>
                            <span className="text-sm font-black text-indigo-600 font-mono">
                              {modalStudentStats.totalScore} / {modalStudentStats.totalMaxScore || 100}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-500 block">متوسط النسبة</span>
                            <span className="text-sm font-black text-emerald-600 font-mono">
                              %{modalStudentStats.averagePercentage}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-500 block">ناجح / راسب</span>
                            <span className="text-xs font-black text-slate-800">
                              <span className="text-emerald-600">{modalStudentStats.passedExamsCount} ✓</span>
                              <span className="text-slate-300 mx-1">|</span>
                              <span className="text-rose-600">{modalStudentStats.failedExamsCount} ✕</span>
                            </span>
                          </div>
                        </div>

                        {/* Detailed Exam List */}
                        {modalStudentStats.examsList.length > 0 ? (
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {modalStudentStats.examsList.map((ex, idx) => (
                              <div
                                key={`${ex.examId || 'ex'}-${idx}`}
                                className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-2 text-xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="truncate flex-1">
                                    <span className="font-bold text-slate-900 block truncate">{ex.examTitle}</span>
                                    <span className="text-[10px] text-slate-400 block truncate">{ex.courseTitle}</span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-mono font-black text-indigo-700 text-xs bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                      الدرجة: {ex.score} / {ex.maxScore}
                                    </span>
                                    <span
                                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                                        ex.passed
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      %{ex.percentage} {ex.passed ? '✓ ناجح' : '✕ راسب'}
                                    </span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-100 text-[11px]">
                                  <div className="text-slate-600">
                                    <span className="text-slate-400 font-bold">زمن التسليم: </span>
                                    <span className="font-bold text-slate-800">{ex.submittedAt || ex.completedAt || '—'}</span>
                                  </div>
                                  <div className="text-slate-600">
                                    <span className="text-slate-400 font-bold">الوقت المستغرق: </span>
                                    <span className="font-bold text-amber-800">{ex.durationTakenFormatted || '—'}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic text-center py-2">
                            لم يسجل الطالب أي محاولات امتحانية حتى الآن في هذا الحساب.
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleDeleteStudent(selectedStudentForModal.id, selectedStudentForModal.name)}
                    className="px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white font-black text-xs transition-all flex items-center gap-1.5 border border-rose-200 hover:border-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف الحساب نهائياً 🗑️</span>
                  </button>

                  <button
                    onClick={() => setSelectedStudentForModal(null)}
                    className="px-6 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'weekly_sales' && <WeeklyCourseSalesPage />}

      {/* ========================================================================= */}
      {/* TAB 2: COURSES MANAGEMENT & CREATION */}
      {/* ========================================================================= */}
      {activeTab === 'courses' && (() => {
        const displayedCourses = courses;

        return (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-[32px] p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <span>إدارة ومتابعة الكورسات الأكاديمية</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  التحكم الكامل بجميع كورسات منصة أ/ سوزان كريم فهمي مع إمكانية التعديل والحذف وإدارة الدروس
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsAddCourseModalOpen(true)}
                  className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition-all shadow-md shadow-indigo-200 flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة كورس جديد</span>
                </button>
              </div>
            </div>

            {/* Courses Grid */}
            {displayedCourses.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-[32px] p-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl">
                  📚
                </div>
                <h4 className="text-sm font-black text-slate-800">لا توجد كورسات حالياً</h4>
                <p className="text-xs text-slate-500">
                  يمكنك إضافة كورس جديد الآن بالضغط على زر إضافة كورس.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedCourses.map((course) => {
                  const isTeacherCourse =
                    !!course.instructorId ||
                    !!course.teacherName ||
                    (course.instructor &&
                      course.instructor !== platformSettings.supervisorName &&
                      course.instructor !== 'إدارة المنصة');

                  const hasDiscount =
                    typeof course.originalPrice === 'number' &&
                    course.originalPrice > course.price &&
                    course.originalPrice > 0;
                  const discountPercent = hasDiscount
                    ? course.discountPercentage && course.discountPercentage > 0
                      ? Math.round(course.discountPercentage)
                      : Math.round(((course.originalPrice! - course.price) / course.originalPrice!) * 100)
                    : 0;

                  return (
                    <div
                      key={course.id}
                      className="bg-white border border-slate-200 rounded-[28px] overflow-hidden shadow-xs p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
                    >
                      <div className="space-y-3">
                        <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-100">
                          <img
                            src={course.coverImage}
                            alt={course.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-md">
                              {course.schoolYear}
                            </span>
                            {course.division && !isPrimaryOrPrepGrade(course.schoolYear) && (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                                {course.division}
                              </span>
                            )}
                          </div>
                          {hasDiscount && (
                            <div className="absolute top-2.5 left-2.5">
                              <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-rose-600 text-white shadow-lg flex items-center gap-1">
                                🔥 خصم {discountPercent}%
                              </span>
                            </div>
                          )}
                          <div className="absolute bottom-2.5 left-2.5">
                            {hasDiscount ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/90 backdrop-blur-md text-white shadow-md border border-white/15">
                                <span className="text-[10px] font-bold text-rose-300 line-through decoration-rose-400 decoration-2">
                                  {course.originalPrice} ج.م
                                </span>
                                <span className="text-xs font-black text-emerald-400">
                                  {course.price === 0 ? 'مجاني' : `${course.price} ج.م`}
                                </span>
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-rose-600 text-white">
                                  -{discountPercent}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-md">
                                {course.price === 0 ? 'مجاني' : `${course.price} ${course.priceCurrency}`}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Attribution Badge: Teacher vs Platform */}
                        {isTeacherCourse ? (
                          <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-xs flex items-center justify-between">
                            <span className="font-black text-indigo-900 flex items-center gap-1">
                              👨‍🏫 كورس المعلم: {course.teacherName || course.instructor}
                            </span>
                            {!isPrimaryOrPrepGrade(course.schoolYear) && course.division && (
                              <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                                {course.division}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100 text-xs flex items-center justify-between">
                            <span className="font-black text-amber-950 flex items-center gap-1">
                              👑 إدارة المنصة: {course.instructor || platformSettings.supervisorName}
                            </span>
                            <span className="text-[10px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                              رئيسي
                            </span>
                          </div>
                        )}

                        <h4 className="text-base font-black text-slate-900 leading-snug">{course.title}</h4>
                        <div className="text-xs text-slate-500 flex items-center justify-between">
                          <span>المادة: {course.subject}</span>
                          <span>المشرف: {course.instructor}</span>
                        </div>

                        {/* Price & Discount Status Box */}
                        {hasDiscount && (
                          <div className="p-2.5 rounded-xl bg-gradient-to-l from-rose-50 via-amber-50/60 to-emerald-50 border border-rose-200/80 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-bold text-slate-400 line-through decoration-rose-500 decoration-2">
                                {course.originalPrice} ج.م
                              </span>
                              <span className="text-sm font-black text-emerald-700">
                                {course.price === 0 ? 'مجاني' : `${course.price} ج.م`}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-black">
                              خصم {discountPercent}% للطلاب 🔥
                            </span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                            {course.courseType === 'exams_only' ? 'بنك امتحانات فقط' : 'شرح متكامل (دروس + وسائط)'}
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                            {course.lessons?.length || 0} دروس
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-50 text-amber-800">
                            {course.lessons?.reduce((acc, l) => acc + (l.videos?.length || 0), 0) || 0} فيديو
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-50 text-rose-700">
                            {course.lessons?.reduce((acc, l) => acc + (l.pdfs?.length || 0), 0) || 0} PDF
                          </span>
                        </div>

                        <div className="text-xs text-indigo-700 font-bold bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 flex items-center justify-between">
                          <span>الامتحانات التسلسلية:</span>
                          <span>{course.exams.length} امتحانات مرتبطة</span>
                        </div>
                      </div>

                      {/* Course Card Actions: Manage Lessons, Apply Discount, Edit, Exam, Delete */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <button
                          onClick={() => setManagingLessonsCourse(course)}
                          className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>إدارة الدروس والفيديوهات والـ PDF 🎥</span>
                        </button>

                        {/* Button to apply or edit course discount after adding the course */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenCourseDiscountModal(course)}
                            className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                              hasDiscount
                                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                            }`}
                          >
                            <span>🏷️</span>
                            <span>
                              {hasDiscount
                                ? `تعديل الخصم الحالي (${discountPercent}%)`
                                : 'تنزيل خصم على الكورس %'}
                            </span>
                          </button>
                          {hasDiscount && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCourseDiscount(course)}
                              className="py-2 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black text-[11px] transition-all cursor-pointer shrink-0"
                              title="إلغاء الخصم وإرجاع السعر الأصلي"
                            >
                              إلغاء الخصم
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-0.5">
                          <button
                            onClick={() => {
                              setSelectedCourseForExam(course.id);
                              setActiveTab('manual_exam');
                            }}
                            className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>إضافة امتحان</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditCourseAdmin(course)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-black text-xs transition-all flex items-center gap-1 cursor-pointer border border-slate-200/80"
                              title="تعديل بيانات الكورس"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>تعديل ✏️</span>
                            </button>

                            <button
                              onClick={() => handleDeleteCourse(course.id, course.title)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                              title="حذف الكورس نهائياً"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Modal for Course Discount ("تنزيل خصم على الكورس بعد إضافته") */}
            {discountModalCourse && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fadeIn">
                <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-5 max-h-[92vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <span>🏷️</span>
                        <span>تنزيل خصم على الكورس للطلاب</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        يظهر للطلاب في صفحة الكورسات السعر القديم مشطوباً عليه وبجانبه السعر الجديد ونسبة الخصم بالمية (%)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDiscountModalCourse(null)}
                      className="text-slate-400 hover:text-slate-600 font-black text-base p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">الكورس المختار:</span>
                      <h4 className="text-sm font-black text-slate-900">{discountModalCourse.title}</h4>
                      <span className="text-[11px] text-indigo-600 font-bold">
                        {discountModalCourse.schoolYear} • {discountModalCourse.subject}
                      </span>
                    </div>
                    <div className="text-left shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 block">السعر الحالي:</span>
                      <span className="text-sm font-black text-slate-900">{discountModalCourse.price} ج.م</span>
                    </div>
                  </div>

                  <form onSubmit={handleSaveCourseDiscount} className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5">
                        1. السعر القديم (الأصلي قبل الخصم - سيظهر مشطوباً عليه) بالجنيه:
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={discountBasePrice}
                        onChange={(e) => {
                          const newBase = Math.max(0, Number(e.target.value) || 0);
                          setDiscountBasePrice(newBase);
                          handleDiscountPercentChange(discountPercentInput, newBase);
                        }}
                        className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-black font-mono bg-slate-50 focus:bg-white focus:border-indigo-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5">
                        2. اختر أو اكتب نسبة الخصم بالمية (%):
                      </label>
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {[10, 15, 20, 25, 30, 40, 50, 60, 75].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleDiscountPercentChange(preset)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                              discountPercentInput === preset
                                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                : 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-200'
                            }`}
                          >
                            خصم {preset}%
                          </button>
                        ))}
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          required
                          value={discountPercentInput}
                          onChange={(e) => handleDiscountPercentChange(Number(e.target.value))}
                          className="w-full p-3 pl-12 rounded-2xl border border-slate-200 text-sm font-black font-mono focus:border-rose-500 outline-none"
                        />
                        <span className="absolute left-4 top-3 text-sm font-black text-rose-600">%</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5">
                        3. السعر الجديد بعد الخصم (المبلغ المطلوب من الطالب بالجنيه):
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          required
                          value={discountNewPriceInput}
                          onChange={(e) => handleDiscountNewPriceChange(Number(e.target.value))}
                          className="w-full p-3 pl-14 rounded-2xl border-2 border-emerald-500/70 bg-emerald-50/30 text-sm font-black font-mono text-emerald-900 focus:border-emerald-600 outline-none"
                        />
                        <span className="absolute left-4 top-3 text-xs font-black text-emerald-700">ج.م</span>
                      </div>
                    </div>

                    {/* Live Preview Box showing exactly how students see it on Courses Page */}
                    {discountBasePrice > 0 && discountNewPriceInput < discountBasePrice && (
                      <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2.5 border border-slate-800">
                        <span className="text-[11px] font-bold text-slate-400 block">
                          👀 معاينة ظهور الخصم للطلاب في صفحة الكورسات:
                        </span>
                        <div className="flex items-center justify-between gap-2 flex-wrap bg-slate-950/90 p-3 rounded-xl border border-white/10">
                          <div className="flex items-baseline gap-2.5 flex-wrap">
                            <span className="text-sm font-bold text-rose-400 line-through decoration-rose-500 decoration-2">
                              {discountBasePrice} ج.م
                            </span>
                            <span className="text-xl font-black text-emerald-400">
                              {discountNewPriceInput === 0 ? 'مجاني بالكامل' : `${discountNewPriceInput} ج.م`}
                            </span>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-black shadow-sm">
                            🔥 خصم {Math.round(((discountBasePrice - discountNewPriceInput) / discountBasePrice) * 100)}%
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-300 font-bold">
                          يوفر الطالب في هذا الكورس: {discountBasePrice - discountNewPriceInput} ج.م
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                      {discountModalCourse.originalPrice &&
                      discountModalCourse.originalPrice > discountModalCourse.price ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveCourseDiscount(discountModalCourse)}
                          className="px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs transition-all cursor-pointer"
                        >
                          إلغاء الخصم نهائياً
                        </button>
                      ) : (
                        <div />
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDiscountModalCourse(null)}
                          className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs cursor-pointer"
                        >
                          إغلاق
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-lg shadow-rose-200 transition-all cursor-pointer"
                        >
                          حفظ وتطبيق الخصم للطلاب الآن 🔥
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Add Course Full Page View */}
          {isAddCourseModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 overflow-y-auto animate-fadeIn p-4 sm:p-8">
              <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-4xl mx-auto shadow-2xl p-6 sm:p-10 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900">إضافة كورس تعليمي جديد</h3>
                  <button onClick={() => setIsAddCourseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateCourse} className="space-y-4">

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">اسم الكورس (Title):</label>
                    <input
                      type="text"
                      required
                      value={newCourseTitle}
                      onChange={(e) => setNewCourseTitle(e.target.value)}
                      placeholder="مثال: كورس الفلسفة والمنطق للثانوية العامة 2027"
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">نوع الكورس الأكاديمي *:</label>
                    <select
                      value={newCourseType}
                      onChange={(e) => setNewCourseType(e.target.value as CourseType)}
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs bg-white font-black text-indigo-700"
                    >
                      <option value="integrated">كورس متكامل (شرح + دروس + فيديوهات لا نهائية + PDF + امتحانات) 🎥📄📝</option>
                      <option value="exams_only">كورس بنك امتحانات فقط (امتحانات تسلسلية مشروطة) 📝</option>
                      <option value="revision">كورس مراجعات نهائية مكثفة ⚡</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className={isPrimaryOrPrepGrade(newCourseYear) ? 'sm:col-span-2' : ''}>
                      <label className="block text-xs font-bold text-slate-700 mb-1">السنة الدراسية:</label>
                      <select
                        value={newCourseYear}
                        onChange={(e) => {
                          const newGrade = e.target.value as SchoolYearGrade;
                          setNewCourseYear(newGrade);
                          setNewCourseDivision('بكالوريا');
                        }}
                        className="w-full p-3 rounded-2xl border border-slate-200 text-xs bg-white"
                      >
                        <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                      </select>
                    </div>

                    {!isPrimaryOrPrepGrade(newCourseYear) && (
                      <div className="animate-fadeIn">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {isThirdSecondaryGrade(newCourseYear) ? 'الشعبة (تالتة ثانوي):' : 'الشعبة (المرحلة الثانوية):'}
                        </label>
                        {isThirdSecondaryGrade(newCourseYear) ? (
                          <select
                            value={newCourseDivision}
                            onChange={(e) => setNewCourseDivision(e.target.value)}
                            className="w-full p-3 rounded-2xl border border-slate-200 text-xs bg-white"
                          >
                            <option value="علمي علوم">علمي علوم</option>
                            <option value="علمي رياضة">علمي رياضة</option>
                            <option value="شعبة أدبي">شعبة أدبي</option>
                            <option value="بكالوريا">بكالوريا</option>
                            <option value="عام">عام</option>
                            <option value="أزهر">أزهر</option>
                            <option value="عام لجميع الشعب">عام لجميع الشعب</option>
                          </select>
                        ) : (
                          <select
                            value={newCourseDivision}
                            onChange={(e) => setNewCourseDivision(e.target.value)}
                            className="w-full p-3 rounded-2xl border border-slate-200 text-xs bg-white"
                          >
                            <option value="بكالوريا">بكالوريا</option>
                            <option value="عام">عام</option>
                            <option value="أزهر">أزهر</option>
                            <option value="عام لجميع الشعب">عام لجميع الشعب</option>
                          </select>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">المادة الدراسية:</label>
                      <input
                        type="text"
                        required
                        value={newCourseSubject}
                        onChange={(e) => setNewCourseSubject(e.target.value)}
                        placeholder="الفيزياء / الرياضيات / الفلسفة والمنطق..."
                        className="w-full p-3 rounded-2xl border border-slate-200 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">تحديد السعر (بالجنيه):</label>
                      <input
                        type="number"
                        min="0"
                        value={newCoursePrice}
                        onChange={(e) => setNewCoursePrice(Number(e.target.value))}
                        className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Payment Phone & Wallet QR Barcode for New Course */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                    <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <span>بيانات استلام الاشتراكات لهذا الكورس (رقم المحفظة أو باركود QR Code):</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          رقم استلام الاشتراكات (فودافون كاش / محفظة الكورس):
                        </label>
                        <input
                          type="tel"
                          dir="ltr"
                          value={newCoursePaymentPhone}
                          onChange={(e) => setNewCoursePaymentPhone(e.target.value)}
                          placeholder="مثال: 01040672314"
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-left"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          صورة باركود المحفظة (QR Code):
                        </label>
                        <div className="flex items-center gap-2">
                          {newCoursePaymentQrCode && (
                            <div className="relative w-11 h-11 rounded-lg bg-white border border-indigo-200 p-0.5 shrink-0">
                              <img src={newCoursePaymentQrCode} alt="QR" className="w-full h-full object-contain" />
                              <button
                                type="button"
                                onClick={() => setNewCoursePaymentQrCode('')}
                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                          <label className="flex-1 px-3 py-2 rounded-xl bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" />
                            <span>رفع صورة الباركود QR</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, (base64) => setNewCoursePaymentQrCode(base64))}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">صورة غلاف الكورس (Cover Image):</label>
                    <div className="space-y-2">
                      <input
                        type="url"
                        value={newCourseCover}
                        onChange={(e) => setNewCourseCover(e.target.value)}
                        placeholder="رابط الصورة (URL)..."
                        className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-mono"
                        dir="ltr"
                      />
                      <div className="flex items-center gap-2">
                        <label className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5" />
                          <span>أو ارفع صورة من الجهاز</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, (base64) => setNewCourseCover(base64))}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">وصف ومنهجية الكورس:</label>
                    <textarea
                      rows={3}
                      value={newCourseDesc}
                      onChange={(e) => setNewCourseDesc(e.target.value)}
                      placeholder="اكتب نبذة عن المحاضرات وبنوك الامتحانات..."
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition-all shadow-md shadow-indigo-200"
                  >
                    حفظ وإضافة الكورس للمنصة ✅
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Edit Course Full Page View for Admin */}
          {isEditCourseModalOpen && editingCourseAdmin && (
            <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 overflow-y-auto animate-fadeIn p-4 sm:p-8">
              <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-4xl mx-auto shadow-2xl p-6 sm:p-10 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Edit className="w-4 h-4 text-indigo-600" />
                      <span>تعديل بيانات الكورس التعليمي</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      تعديل العنوان، النوع، الشعبة، السعر، والغلاف لكورسات المنصة
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditCourseModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer text-sm font-black p-1"
                  >
                    ✕
                  </button>
                </div>

                {/* Teacher / Platform attribution notice */}
                <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-black text-indigo-950 block">
                      {editingCourseAdmin.instructorId || editingCourseAdmin.teacherName
                        ? `👨‍🏫 كورس المعلم: ${editingCourseAdmin.teacherName || editingCourseAdmin.instructor}`
                        : `👑 كورس إدارة المنصة: ${editingCourseAdmin.instructor || platformSettings.supervisorName}`}
                    </span>
                    <span className="text-[10px] text-indigo-700 block">
                      معرف الكورس: {editingCourseAdmin.id}
                    </span>
                  </div>
                  <span className="text-[10px] font-black bg-indigo-200/80 text-indigo-900 px-2 py-0.5 rounded-md">
                    مادة: {editingCourseAdmin.subject}
                  </span>
                </div>

                <form onSubmit={handleSaveEditCourseAdmin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">اسم الكورس (Title) *:</label>
                    <input
                      type="text"
                      required
                      value={editCourseTitle}
                      onChange={(e) => setEditCourseTitle(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">نوع الكورس الأكاديمي *:</label>
                    <select
                      value={editCourseType}
                      onChange={(e) => setEditCourseType(e.target.value as CourseType)}
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs bg-white font-black text-indigo-700"
                    >
                      <option value="integrated">كورس متكامل (شرح + دروس + فيديوهات لا نهائية + PDF + امتحانات) 🎥📄📝</option>
                      <option value="exams_only">كورس بنك امتحانات فقط (امتحانات تسلسلية مشروطة) 📝</option>
                      <option value="revision">كورس مراجعات نهائية مكثفة ⚡</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className={isPrimaryOrPrepGrade(editCourseSchoolYear) ? 'sm:col-span-2' : ''}>
                      <label className="block text-xs font-bold text-slate-700 mb-1">السنة الدراسية:</label>
                      <select
                        value={editCourseSchoolYear}
                        onChange={(e) => {
                          const newGrade = e.target.value as SchoolYearGrade;
                          setEditCourseSchoolYear(newGrade);
                          setEditCourseDivision('بكالوريا');
                        }}
                        className="w-full p-3 rounded-2xl border border-slate-200 text-xs bg-white font-bold"
                      >
                        <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                      </select>
                    </div>

                    {!isPrimaryOrPrepGrade(editCourseSchoolYear) && (
                      <div className="animate-fadeIn">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {isThirdSecondaryGrade(editCourseSchoolYear) ? 'الشعبة (تالتة ثانوي):' : 'الشعبة (المرحلة الثانوية):'}
                        </label>
                        {isThirdSecondaryGrade(editCourseSchoolYear) ? (
                          <select
                            value={editCourseDivision}
                            onChange={(e) => setEditCourseDivision(e.target.value)}
                            className="w-full p-3 rounded-2xl border border-slate-200 text-xs bg-white font-bold"
                          >
                            <option value="علمي علوم">علمي علوم</option>
                            <option value="علمي رياضة">علمي رياضة</option>
                            <option value="شعبة أدبي">شعبة أدبي</option>
                            <option value="بكالوريا">بكالوريا</option>
                            <option value="عام">عام</option>
                            <option value="أزهر">أزهر</option>
                            <option value="عام لجميع الشعب">عام لجميع الشعب</option>
                          </select>
                        ) : (
                          <select
                            value={editCourseDivision}
                            onChange={(e) => setEditCourseDivision(e.target.value)}
                            className="w-full p-3 rounded-2xl border border-slate-200 text-xs bg-white font-bold"
                          >
                            <option value="بكالوريا">بكالوريا</option>
                            <option value="عام">عام</option>
                            <option value="أزهر">أزهر</option>
                            <option value="عام لجميع الشعب">عام لجميع الشعب</option>
                          </select>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">المادة الدراسية:</label>
                      <input
                        type="text"
                        value={editCourseSubject}
                        onChange={(e) => setEditCourseSubject(e.target.value)}
                        className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">السعر (ج.م) - ضع 0 للمجاني:</label>
                      <input
                        type="number"
                        min="0"
                        value={editCoursePrice}
                        onChange={(e) => setEditCoursePrice(Number(e.target.value))}
                        className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Payment Phone & Wallet QR Barcode for Edit Course */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                    <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <span>بيانات استلام الاشتراكات لهذا الكورس (رقم المحفظة أو باركود QR Code):</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          رقم استلام الاشتراكات (فودافون كاش / محفظة الكورس):
                        </label>
                        <input
                          type="tel"
                          dir="ltr"
                          value={editCoursePaymentPhone}
                          onChange={(e) => setEditCoursePaymentPhone(e.target.value)}
                          placeholder="مثال: 01040672314"
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-left"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          صورة باركود المحفظة (QR Code):
                        </label>
                        <div className="flex items-center gap-2">
                          {editCoursePaymentQrCode && (
                            <div className="relative w-12 h-12 rounded-lg bg-white border border-indigo-200 p-0.5 shrink-0">
                              <img src={editCoursePaymentQrCode} alt="QR" className="w-full h-full object-contain" />
                              <button
                                type="button"
                                onClick={() => setEditCoursePaymentQrCode('')}
                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                          <label className="flex-1 px-3 py-2 rounded-xl bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" />
                            <span>رفع صورة الباركود QR</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleImageUpload(e, (base64) => {
                                  setEditCoursePaymentQrCode(base64);
                                  showFeedback('تم رفع صورة باركود المحفظة بنجاح QR ✅');
                                })
                              }
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cover Image Upload from Device or URL */}
                  <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <label className="block text-xs font-bold text-slate-700">
                      غلاف الكورس (رفع من الجهاز أو رابط مباشر) 🖼️:
                    </label>
                    <div className="flex items-center gap-3">
                      {editCourseCover && (
                        <div className="w-16 h-12 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                          <img
                            src={editCourseCover}
                            alt="Cover Preview"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      <div className="flex-1 space-y-1.5">
                        <label className="px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all">
                          <Upload className="w-3.5 h-3.5" />
                          <span>رفع غلاف من جهازك 💻</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleImageUpload(e, (base64) => {
                                setEditCourseCover(base64);
                                showFeedback('تم رفع صورة الغلاف من الجهاز بنجاح 🖼️');
                              })
                            }
                          />
                        </label>
                        <input
                          type="url"
                          placeholder="أو رابط الغلاف المباشر..."
                          value={editCourseCover.startsWith('data:') ? '' : editCourseCover}
                          onChange={(e) => setEditCourseCover(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-slate-900 text-[11px] font-mono focus:outline-none"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">وصف ومنهجية الكورس:</label>
                    <textarea
                      rows={3}
                      value={editCourseDesc}
                      onChange={(e) => setEditCourseDesc(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs"
                      placeholder="اكتب نبذة عن المحتوى والدروس..."
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleDeleteCourse(editingCourseAdmin.id, editingCourseAdmin.title);
                        setIsEditCourseModalOpen(false);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف الكورس</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditCourseModalOpen(false)}
                        className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition-all shadow-md shadow-indigo-200 cursor-pointer"
                      >
                        حفظ التعديلات ✅
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal for Managing Course Lessons & Media */}
          {managingLessonsCourse && (
            <CourseLessonManagerModal
              course={managingLessonsCourse}
              isOpen={true}
              onClose={() => setManagingLessonsCourse(null)}
              onSaveCourse={(updatedCourse) => {
                const exists = courses.some((c) => c.id === updatedCourse.id);
                const updated = exists
                  ? courses.map((c) => (c.id === updatedCourse.id ? updatedCourse : c))
                  : [updatedCourse, ...courses];
                onUpdateCourses(updated);
                saveCourses(updated);
                setManagingLessonsCourse(updatedCourse);
                showFeedback(`تم تحديث محتوى ودروس كورس (${updatedCourse.title}) بنجاح! 🌟`);
              }}
            />
          )}
        </div>
      );
    })()}

      {/* ========================================================================= */}
      {/* TAB 3: MANUAL EXAM BUILDER (منشئ الامتحانات اليدوية) */}
      {/* ========================================================================= */}
      {activeTab === 'manual_exam' && (
        <div className="bg-white border border-slate-200 rounded-[32px] p-6 sm:p-8 shadow-sm space-y-8">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-amber-500" />
                <span>منشئ الامتحانات اليدوي المتقدم (اختياري + مقالي + صور)</span>
              </h3>
              <p className="text-xs text-slate-500">
                إنشاء أسئلة بالصور، تحديد الإجابة الصحيحة للاختياري، وتحديد الإجابات النموذجية وصور الحل تحت كل سؤال
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAddQuestionDraft('mcq')}
                className="px-4 py-2 rounded-2xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-black text-xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ سؤال اختياري</span>
              </button>
              <button
                onClick={() => handleAddQuestionDraft('essay')}
                className="px-4 py-2 rounded-2xl bg-amber-50 text-amber-800 hover:bg-amber-100 font-black text-xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ سؤال مقالي</span>
              </button>
            </div>
          </div>

          {/* Exam Target Course & Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-3xl bg-slate-50 border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">إضافة الامتحان إلى كورس:</label>
              <select
                value={selectedCourseForExam}
                onChange={(e) => setSelectedCourseForExam(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs bg-white font-bold text-indigo-900"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.schoolYear})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم الدرس أو موضوع الامتحان:</label>
              <input
                type="text"
                value={manualExamLesson}
                onChange={(e) => setManualExamLesson(e.target.value)}
                placeholder="مثال: قانون أوم والمقاومة النوعية"
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المدة (دقيقة):</label>
                <input
                  type="number"
                  min="5"
                  value={manualExamDuration}
                  onChange={(e) => setManualExamDuration(Number(e.target.value))}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نسبة النجاح %:</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={manualExamPassing}
                  onChange={(e) => setManualExamPassing(Number(e.target.value))}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Question Drafts List */}
          <div className="space-y-6">
            <h4 className="text-sm font-black text-slate-900 flex items-center justify-between">
              <span>أسئلة الامتحان ({questionsDraft.length} أسئلة):</span>
              <span className="text-xs text-slate-400">
                إجمالي الدرجات: {questionsDraft.reduce((sum, q) => sum + (Number(q.marks) || 0), 0)} درجة
              </span>
            </h4>

            {questionsDraft.map((q, qIndex) => (
              <div
                key={q.id}
                className="p-6 rounded-3xl border-2 border-slate-200/80 bg-white space-y-4 relative shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                      {qIndex + 1}
                    </span>
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                        q.type === 'mcq' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {q.type === 'mcq' ? 'سؤال اختيار من متعدد' : 'سؤال مقالي واستنتاج'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <span>الدرجة:</span>
                      <input
                        type="number"
                        min="1"
                        value={q.marks}
                        onChange={(e) => {
                          const updated = [...questionsDraft];
                          updated[qIndex].marks = Number(e.target.value);
                          setQuestionsDraft(updated);
                        }}
                        className="w-16 p-1.5 rounded-xl border border-slate-200 text-xs text-center font-mono font-bold"
                      />
                    </div>

                    <button
                      onClick={() => handleRemoveQuestionDraft(q.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg"
                      title="حذف السؤال"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Text & Question Image Upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">نص أو عنوان السؤال:</label>
                    <textarea
                      rows={3}
                      value={q.questionText}
                      onChange={(e) => {
                        const updated = [...questionsDraft];
                        updated[qIndex].questionText = e.target.value;
                        setQuestionsDraft(updated);
                      }}
                      placeholder="اكتب صيغة السؤال هنا..."
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>صورة السؤال (مسألة / رسم بياني):</span>
                      {q.questionImage && (
                        <button
                          onClick={() => {
                            const updated = [...questionsDraft];
                            updated[qIndex].questionImage = '';
                            setQuestionsDraft(updated);
                          }}
                          className="text-[10px] text-rose-600 font-bold"
                        >
                          إزالة الصورة
                        </button>
                      )}
                    </label>

                    {q.questionImage ? (
                      <div className="relative h-28 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                        <img src={q.questionImage} alt="question" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="p-3 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-1 bg-slate-50/50">
                        <label className="cursor-pointer text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1.5">
                          <Image className="w-4 h-4" />
                          <span>اضغط لرفع صورة السؤال من جهازك</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleImageUpload(e, (base64) => {
                                const updated = [...questionsDraft];
                                updated[qIndex].questionImage = base64;
                                setQuestionsDraft(updated);
                              })
                            }
                          />
                        </label>
                        <p className="text-[10px] text-slate-400">يدعم PNG, JPG لرسومات المسائل والمعادلات</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Question Type Specific Fields */}
                {q.type === 'mcq' ? (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700">
                      الخيارات الأربعة (حدد الدائرة بجانب الإجابة الصحيحة):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, optIndex) => {
                        const optImg = q.optionImages?.[optIndex];
                        return (
                          <div
                            key={optIndex}
                            className={`p-2.5 rounded-2xl border transition-all space-y-2 ${
                              q.correctOptionIndex === optIndex
                                ? 'border-emerald-500 bg-emerald-50/50'
                                : 'border-slate-200 bg-slate-50/30'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                checked={q.correctOptionIndex === optIndex}
                                onChange={() => {
                                  const updated = [...questionsDraft];
                                  updated[qIndex].correctOptionIndex = optIndex;
                                  setQuestionsDraft(updated);
                                }}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <span className="text-xs font-bold text-slate-400 font-mono">
                                {['أ', 'ب', 'ج', 'د'][optIndex]}:
                              </span>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const updated = [...questionsDraft];
                                  updated[qIndex].options[optIndex] = e.target.value;
                                  setQuestionsDraft(updated);
                                }}
                                className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
                                placeholder={`نص الخيار (${['أ', 'ب', 'ج', 'د'][optIndex]})`}
                              />
                              <label className="px-2 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-[10px] font-black cursor-pointer shrink-0 flex items-center gap-1">
                                <Upload className="w-3 h-3" />
                                <span>{optImg ? 'تغيير الصورة 🖼️' : '+ صورة للإجابة 🖼️'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) =>
                                    handleImageUpload(e, (base64) => {
                                      const updated = [...questionsDraft];
                                      const nextImgs = [...(updated[qIndex].optionImages || ['', '', '', ''])];
                                      nextImgs[optIndex] = base64;
                                      updated[qIndex].optionImages = nextImgs;
                                      setQuestionsDraft(updated);
                                    })
                                  }
                                />
                              </label>
                            </div>
                            {optImg && (
                              <div className="flex items-center justify-between gap-2 bg-white p-1.5 rounded-xl border border-slate-200">
                                <img src={optImg} alt={`الخيار ${optIndex + 1}`} className="max-h-20 rounded object-contain" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...questionsDraft];
                                    const nextImgs = [...(updated[qIndex].optionImages || ['', '', '', ''])];
                                    nextImgs[optIndex] = '';
                                    updated[qIndex].optionImages = nextImgs;
                                    setQuestionsDraft(updated);
                                  }}
                                  className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 text-[10px] font-bold cursor-pointer"
                                >
                                  حذف الصورة ✕
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                      💡 <b>ملاحظة السؤال المقالي:</b> عند تقديم الطالب للامتحان سيظهر له (قيد المراجعة)، وسيتم إتاحة
                      الدرجة وصورة الإجابة النموذجية بعد تدقيق المشرف لإجابة الطالب من تبويب "تصحيح المقالي".
                    </div>
                  </div>
                )}

                {/* Model Answer & Model Answer Image */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-emerald-50/30 p-3.5 rounded-2xl">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-emerald-900">
                      شرح أو تعليل الإجابة النموذجية:
                    </label>
                    <textarea
                      rows={2}
                      value={q.modelAnswer}
                      onChange={(e) => {
                        const updated = [...questionsDraft];
                        updated[qIndex].modelAnswer = e.target.value;
                        setQuestionsDraft(updated);
                      }}
                      placeholder="الشرح النموذجي للحل..."
                      className="w-full p-2 rounded-xl border border-emerald-200 text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-emerald-900 flex items-center justify-between">
                      <span>صورة الإجابة النموذجية (تظهر تحت السؤال):</span>
                      {q.modelAnswerImage && (
                        <button
                          onClick={() => {
                            const updated = [...questionsDraft];
                            updated[qIndex].modelAnswerImage = '';
                            setQuestionsDraft(updated);
                          }}
                          className="text-[10px] text-rose-600 font-bold"
                        >
                          إزالة
                        </button>
                      )}
                    </label>

                    {q.modelAnswerImage ? (
                      <div className="h-20 rounded-xl overflow-hidden border border-emerald-300 bg-white">
                        <img src={q.modelAnswerImage} alt="model answer" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <label className="p-2.5 border border-dashed border-emerald-300 rounded-xl block text-center cursor-pointer text-xs font-bold text-emerald-800 hover:bg-emerald-100/50 bg-white">
                        <Upload className="w-3.5 h-3.5 inline ml-1" />
                        <span>رفع صورة الإجابة النموذجية</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleImageUpload(e, (base64) => {
                              const updated = [...questionsDraft];
                              updated[qIndex].modelAnswerImage = base64;
                              setQuestionsDraft(updated);
                            })
                          }
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSaveManualExam}
              className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm transition-all shadow-md shadow-indigo-200 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>نشر واعتماد الامتحان في الكورس المختار ✅</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: COMPETITIONS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'competitions' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>إدارة المسابقات الكبرى والتحديات</span>
              </h3>
              <p className="text-xs text-slate-500">
                إضافة مسابقات لجميع الصفوف، تحديد الجوائز، والتحكم في لوحة الشرف
              </p>
            </div>

            <button
              onClick={() => setIsAddCompModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-300 flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مسابقة جديدة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitions.map((comp) => (
              <div
                key={comp.id}
                className="bg-white border border-slate-200 rounded-[28px] overflow-hidden shadow-xs p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                      {comp.schoolYear}
                    </span>
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      مجانية بالكامل
                    </span>
                  </div>

                  <h4 className="text-base font-black text-slate-900 leading-snug">{comp.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{comp.description}</p>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <span className="text-slate-400 font-bold block">الجائزة:</span>
                    <span className="text-amber-700 font-black">{comp.prizeInfo || 'وسام التفوق'}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{comp.questions.length} أسئلة تحدي</span>
                  <button
                    onClick={() => handleDeleteCompetition(comp.id, comp.title)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    title="حذف المسابقة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Competition Modal */}
          {isAddCompModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-4 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900">إضافة مسابقة جديدة</h3>
                  <button onClick={() => setIsAddCompModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateCompetition} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">عنوان المسابقة:</label>
                    <input
                      type="text"
                      required
                      value={compTitle}
                      onChange={(e) => setCompTitle(e.target.value)}
                      placeholder="مثال: تحدي أوائل الفيزياء للثانوية العامة 2027"
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">الصف المستهدف:</label>
                      <select
                        value={compYear}
                        onChange={(e) => setCompYear(e.target.value)}
                        className="w-full p-3 rounded-2xl border border-slate-200 text-xs bg-white"
                      >
                        {OFFICIAL_SCHOOL_GRADES.map((grade) => (
                          <option key={grade} value={grade}>
                            {grade}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">المدة (دقيقة):</label>
                      <input
                        type="number"
                        min="5"
                        value={compDuration}
                        onChange={(e) => setCompDuration(Number(e.target.value))}
                        className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الجائزة / التكريم:</label>
                    <input
                      type="text"
                      value={compPrize}
                      onChange={(e) => setCompPrize(e.target.value)}
                      placeholder="مثال: وسام التفوق الذهبي + كورس مجاني مهدى من الإدارة"
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الوصف:</label>
                    <textarea
                      rows={3}
                      value={compDesc}
                      onChange={(e) => setCompDesc(e.target.value)}
                      placeholder="تفاصيل المسابقة والتحدي..."
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-300"
                  >
                    حفظ ونشر المسابقة فوراً 🏆
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: PLATFORM SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-slate-200 rounded-[32px] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <span>إعدادات وهوية المنصة</span>
            </h3>
            <p className="text-xs text-slate-500">
              تعديل اسم المنصة، المشرف العام، أرقام التواصل والواتساب
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المنصة:</label>
                <input
                  type="text"
                  value={settingsForm.platformName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, platformName: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المشرف العام:</label>
                <input
                  type="text"
                  value={settingsForm.supervisorName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, supervisorName: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم هاتف المشرف والكنترول:</label>
                <input
                  type="text"
                  value={settingsForm.contactPhone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, contactPhone: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-mono text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم واتساب الدعم والاشتراك:</label>
                <input
                  type="text"
                  value={settingsForm.supportWhatsapp}
                  onChange={(e) => setSettingsForm({ ...settingsForm, supportWhatsapp: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-mono text-left"
                  dir="ltr"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition-all shadow-md shadow-indigo-200 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>حفظ التغييرات</span>
            </button>

            {/* Platform Clean & Reset Controls */}
            <div className="pt-8 mt-8 border-t border-slate-200 space-y-4">
              <div className="flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h4 className="text-sm font-black text-slate-900">إدارة وتفريغ بيانات المنصة (تجهيز الإطلاق لجوجل)</h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                للتحكم المباشر في المنصة وتفريغ أي بيانات تجريبية (كورسات، مسابقات، حسابات طلاب، أكواد)، يمكنك استخدام أدوات التصفير السريعة التالية:
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('هل أنت متأكد من حذف كافة الكورسات والامتحانات؟')) {
                      onUpdateCourses([]);
                      saveCourses([]);
                      showFeedback('تم تفريغ كافة الكورسات والامتحانات بنجاح.');
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black transition-all"
                >
                  حذف كافة الكورسات ({courses.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('هل أنت متأكد من حذف كافة المسابقات التنافسية؟')) {
                      onUpdateCompetitions([]);
                      saveCompetitions([]);
                      showFeedback('تم تفريغ كافة المسابقات بنجاح.');
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black transition-all"
                >
                  حذف كافة المسابقات ({competitions.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('هل أنت متأكد من حذف كافة حسابات الطلاب؟')) {
                      onUpdateStudents([]);
                      saveUsers([]);
                      showFeedback('تم تفريغ كافة حسابات الطلاب بنجاح.');
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black transition-all"
                >
                  حذف كافة حسابات الطلاب ({students.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('تأكيد: هل ترغب في تصفير المنصة بالكامل (كورسات، مسابقات، طلاب، إجابات)؟')) {
                      onUpdateCourses([]);
                      saveCourses([]);
                      onUpdateCompetitions([]);
                      saveCompetitions([]);
                      onUpdateStudents([]);
                      saveUsers([]);
                      saveSubmissions([]);
                      showFeedback('تم تصفير المنصة بالكامل وهي الآن نظيفة 100% لإدارتك المباشرة.');
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all shadow-xs"
                >
                  تصفير شامل لكافة بيانات المنصة
                </button>
              </div>
            </div>

            {/* Cloud Storage & Firebase Sync Manager */}
            <div className="pt-8 mt-8 border-t border-slate-200 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <span>إدارة قاعدة البيانات السحابية الدائمة (Firebase Firestore)</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        alesraa-academy
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      مزامنة الكورسات، حسابات الطلاب، المسابقات، والإعدادات لحظياً على السحابة
                    </p>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-2">
                  {cloudStatus.status === 'connected' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      🟢 السحابة متصلة ونشطة لحظياً
                    </span>
                  ) : cloudStatus.status === 'connecting' || isSyncingCloud ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
                      <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                      🟡 جاري المزامنة مع السحابة...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      🔴 يحتاج ضبط صلاحيات Firestore Rules
                    </span>
                  )}
                </div>
              </div>

              {/* Status Alert or Rules Warning */}
              {cloudStatus.status === 'error' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <p className="font-black text-amber-900">تنبيه صلاحيات سحابة Firebase (Firestore Rules):</p>
                      <p className="text-amber-800 leading-relaxed">
                        {cloudStatus.errorDetails || 'لم يتم تمكين القراءة والكتابة في Firebase بعد. الموقع يعمل مؤقتاً بالبيانات المحلية.'}
                      </p>
                      <p className="text-amber-900 font-bold">
                        للتفعيل الفوري: افتح Firebase Console &gt; Firestore Database &gt; Rules، وضع الكود التالي ثم اضغط Publish:
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] flex items-center justify-between overflow-x-auto" dir="ltr">
                    <code>
                      {`rules_version = '2'; service cloud.firestore { match /databases/{database}/documents { match /{document=**} { allow read, write: if true; } } }`}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}`);
                        showFeedback('تم نسخ كود قواعد Firebase إلى الحافظة بنجاح! 📋');
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-sans font-bold shrink-0 ml-3 transition-colors"
                    >
                      نسخ الكود
                    </button>
                  </div>
                </div>
              )}

              {/* Cloud Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  disabled={isSyncingCloud}
                  onClick={async () => {
                    setIsSyncingCloud(true);
                    showFeedback('جاري رفع وتثبيت كافة بيانات المنصة إلى Firebase...');
                    try {
                      const success = await forcePushAllToFirebase();
                      if (success) {
                        showFeedback('تم رفع وتثبيت كافة بيانات المنصة بنجاح في سحابة Firebase! ☁️✨', 'success');
                      } else {
                        showFeedback('فشل الرفع للسحابة، تحقق من قواعد Firestore Rules.', 'error');
                      }
                    } catch (e: any) {
                      showFeedback(e?.message || 'حدث خطأ أثناء المزامنة بالسحابة', 'error');
                    } finally {
                      setIsSyncingCloud(false);
                    }
                  }}
                  className="p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-100 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>رفع وتثبيت البيانات بالسحابة الآن</span>
                </button>

                <button
                  type="button"
                  disabled={isSyncingCloud}
                  onClick={async () => {
                    setIsSyncingCloud(true);
                    showFeedback('جاري جلب أحدث البيانات من سحابة Firebase...');
                    try {
                      const data = await loadAllFromFirebase();
                      if (data.courses) onUpdateCourses(data.courses);
                      if (data.users) onUpdateStudents(data.users);
                      if (data.competitions) onUpdateCompetitions(data.competitions);
                      if (data.settings) onUpdateSettings(data.settings);
                      showFeedback('تم استيراد وتحديث البيانات من السحابة بنجاح! 🔄', 'success');
                    } catch (e: any) {
                      showFeedback('فشل استيراد البيانات من السحابة', 'error');
                    } finally {
                      setIsSyncingCloud(false);
                    }
                  }}
                  className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-100 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                  <span>جلب وتحديث البيانات من السحابة</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('هل تريد مسح التخزين المؤقت المحلي وإعادة التحميل من السحابة؟')) {
                      clearLocalCache();
                      showFeedback('تم مسح الكاش المحلي بنجاح، ستعتمد المنصة الآن على السحابة.');
                      setTimeout(() => window.location.reload(), 1000);
                    }
                  }}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-black transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4 text-slate-400" />
                  <span>مسح الكاش المحلي (Cache)</span>
                </button>
              </div>

              {/* Data Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-slate-400 text-[11px] block">الكورسات المحفوظة</span>
                  <span className="text-lg font-black text-slate-900">{courses.length}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-slate-400 text-[11px] block">المستخدمين والطلاب</span>
                  <span className="text-lg font-black text-slate-900">{students.length}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-slate-400 text-[11px] block">المسابقات</span>
                  <span className="text-lg font-black text-slate-900">{competitions.length}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-slate-400 text-[11px] block">مشروع Firebase</span>
                  <span className="text-xs font-mono font-black text-indigo-600 block mt-1">alesraa-academy</span>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: DEVICE & PLATFORM NOTIFICATIONS BROADCAST */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-400/20">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-black text-white">إرسال إشعارات فورية للأجهزة والمنصة 📢</h2>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    بإشراف المشرف العام: <b>{platformSettings.supervisorName}</b> • تصل الرسالة لإشعارات أجهزة الطلاب وجرس المنصة عبر السحابة في أي مكان
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestDeviceNotification}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-2 transition-all shadow-xs self-start sm:self-auto cursor-pointer"
              >
                <Bell className="w-4 h-4 text-amber-300" />
                <span>اختبار إشعار جهاز وسحابة 🔔</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-indigo-600" />
                  <span>كتابة رسالة جديدة للإرسال الفوري</span>
                </h3>
              </div>

              {/* Quick Notification Templates */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  قوالب إشعارات سريعة (اضغط للتعبئة الفورية):
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate(
                      '📢 تنبيه عام لجميع الطلاب',
                      'يرجى من جميع الطلاب الالتزام بمواعيد تسليم التكليفات والامتحانات الأسبوعية في موعدها المحدد.',
                      'normal',
                      'all'
                    )}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    📢 إعلان عام
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate(
                      '📝 تم نشر امتحان إلكتروني جديد',
                      'تم إتاحة الامتحان التتابعي الجديد في لوحة الكورسات. يرجى الدخول والحل قبل نهاية المهلة المحددة.',
                      'urgent',
                      'students'
                    )}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950 border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    📝 امتحان جديد
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate(
                      '🎬 تم رفع محاضرة جديدة',
                      'تمت إضافة فيديو المحاضرة الجديدة وملفات الشرح بصيغة PDF داخل الكورس الخاص بك.',
                      'normal',
                      'students'
                    )}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950 border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    🎬 محاضرة جديدة
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate(
                      '🏆 مسابقة جديدة مع جوائز تقديرية',
                      'تم إطلاق مسابقة الأسبوع التعليمية! شارك الآن وتنافس للحصول على درع التفوق والجوائز المادية.',
                      'urgent',
                      'all'
                    )}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    🏆 مسابقة أسبوعية
                  </button>
                </div>
              </div>

              <form onSubmit={handleBroadcastNotification} className="space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    عنوان الإشعار <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="مثال: تنبيه هام بخصوص امتحان الفيزياء التتابعي"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-hidden transition-all"
                    required
                  />
                </div>

                {/* Message Body */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    نص الرسالة / الإشعار <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="اكتب تفاصيل التنبيه أو موعد الامتحان أو رسالة التحفيز الموجهة للطلاب..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden transition-all"
                    required
                  />
                </div>

                {/* Priority and Target */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                      درجة الأهمية
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNotifPriority('normal')}
                        className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          notifPriority === 'normal'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        إشعار عادي
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotifPriority('urgent')}
                        className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          notifPriority === 'urgent'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        عاجل وهام 🚨
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                      الفئة المستهدفة
                    </label>
                    <select
                      value={notifTarget}
                      onChange={(e) => setNotifTarget(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold outline-hidden cursor-pointer"
                    >
                      <option value="all">جميع مستخدمي المنصة</option>
                      <option value="students">الطلاب فقط</option>
                      <option value="parents">أولياء الأمور فقط</option>
                    </select>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSendingNotif}
                    className="w-full py-4 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSendingNotif ? 'جاري إرسال الإشعار وحفظه في السحابة...' : 'إرسال الإشعار لجميع الأجهزة والطلاب الآن (سحابي) 🚀'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Notifications History Column */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>سجل الإشعارات المرسلة ({savedNotifsList.length})</span>
                </h3>

                {savedNotifsList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllNotifications}
                    className="text-[11px] text-rose-600 hover:underline font-bold cursor-pointer"
                  >
                    مسح السجل بالكامل
                  </button>
                )}
              </div>

              {savedNotifsList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                  <Bell className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">لم يتم إرسال أي إشعارات بعد.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {savedNotifsList.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition-all group relative ${
                        notif.priority === 'urgent'
                          ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-slate-900 dark:text-white text-xs truncate">
                          {notif.title}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {notif.timestamp}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteNotification(notif.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="حذف هذا الإشعار من السحابة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        {notif.message}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span>بواسطة: {notif.senderName}</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {notif.target === 'students' ? 'الطلاب فقط' : notif.target === 'parents' ? 'أولياء الأمور فقط' : 'الجميع'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: WHATSAPP SERVICE MANAGER */}
      {/* ========================================================================= */}
      {activeTab === 'whatsapp' && (
        <AdminWhatsAppManager />
      )}

      {/* ========================================================================= */}
      {/* TAB: DIRECT LIVE SUPPORT CHAT WITH STUDENTS */}
      {/* ========================================================================= */}
      {activeTab === 'support_chat' && (
        <AdminSupportChatTab />
      )}

      {/* ========================================================================= */}
      {/* LUCKY WHEEL: كسبت معانا */}
      {/* ========================================================================= */}
      <LuckyWheelModal
        isOpen={isLuckyWheelOpen}
        onClose={() => setIsLuckyWheelOpen(false)}
        students={registeredStudents}
        submissions={submissions}
        courses={courses}
        platformSettings={platformSettings}
        initialGrade={luckyWheelGrade}
        onWinnerAnnounced={(winner, prize) => {
          showFeedback(`تم إعلان فوز الطالب (${winner.name}) بجائزة [${prize}] في سحب كسبت معانا بنجاح! 🎡🎉`);
        }}
      />

      <ParentWhatsappReportModal
        isOpen={Boolean(reportModalStudent)}
        onClose={() => setReportModalStudent(null)}
        student={reportModalStudent}
        courses={courses}
        submissions={submissions}
      />
    </div>
  );
};
