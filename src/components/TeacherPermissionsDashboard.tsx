import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  LogOut,
  Save,
  Users,
  X,
  BookOpen,
  Upload,
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  Layers,
  MessageSquare,
  Send,
  RefreshCw,
  Search,
  MessageCircle,
  UserPlus,
  Award,
  Key,
  Percent,
  Smartphone,
  Mail,
} from 'lucide-react';
import type {
  AppView,
  AssistantSpecialty,
  Course,
  CourseType,
  SchoolYearGrade,
  EssayGradingResult,
  LessonQAItem,
  StudentExamSubmission,
  User,
} from '../types';
import {
  getSavedSubmissions,
  saveSubmissions,
  saveUsers,
  saveSingleUserToServer,
  saveCourses,
  deleteCourseFromServer,
  addDeletedCourseId,
} from '../data/initialData';
import { getClientAuthHeaders } from '../utils/authToken';
import { compressImageFile } from '../utils/imageUtils';
import { CourseLessonManagerModal } from './CourseLessonManagerModal';
import { TeacherAssistantsModal, getAssistantSpecialtyMeta } from './TeacherAssistantsModal';
import { ParentWhatsappReportModal, buildDirectParentWhatsappUrl } from './ParentWhatsappReportModal';
import { TeacherAccessCodesTab } from './TeacherAccessCodesTab';
import { WalletGatewayAdminTab } from './WalletGatewayAdminTab';
import { AdminWhatsAppManager } from './AdminWhatsAppManager';

interface Props {
  currentTeacher: User;
  allCourses: Course[];
  allStudents: User[];
  onUpdateCourses?: (courses: Course[]) => void;
  onUpdateStudents?: (students: User[]) => void;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  lockedAssistantMode?: AssistantSpecialty;
}

const TEACHER_OWNER_NAME = 'أ/ سوزان كريم فهمي';

const getOwnedCourses = (teacher: User, courses: Course[], lockedAssistantMode?: AssistantSpecialty) => {
  // On this private single-teacher platform, أ/ سوزان كريم فهمي (and her assistants) own all platform courses
  if (
    lockedAssistantMode ||
    teacher.email?.toLowerCase() === 'almtflsft@gmail.com' ||
    teacher.role === 'teacher' ||
    teacher.role === 'admin'
  ) {
    return courses;
  }
  return courses.filter(
    (course) =>
      course.instructorId === teacher.id ||
      course.instructor === teacher.name ||
      course.teacherName === teacher.name
  );
};

export const TeacherPermissionsDashboard: React.FC<Props> = ({
  currentTeacher,
  allCourses,
  allStudents,
  onUpdateCourses,
  onUpdateStudents,
  onNavigate,
  onLogout,
  lockedAssistantMode,
}) => {
  const [submissions, setSubmissions] = useState<StudentExamSubmission[]>(() => getSavedSubmissions());
  const [activeTab, setActiveTab] = useState<
    | 'scientific_support'
    | 'courses'
    | 'students'
    | 'grading'
    | 'parent_reports'
    | 'assistants'
    | 'access_codes'
    | 'coupons'
    | 'vodafone_cash'
    | 'recovery_email'
  >(() => {
    if (lockedAssistantMode === 'essay_grading') return 'grading';
    if (lockedAssistantMode === 'content_management') return 'courses';
    return 'scientific_support';
  });

  const [gradingSubView, setGradingSubView] = useState<'essay' | 'scores'>('essay');
  const [showCouponsModal, setShowCouponsModal] = useState(false);

  const [isAssistantsModalOpen, setIsAssistantsModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<StudentExamSubmission | null>(null);
  const [draftGrades, setDraftGrades] = useState<Record<string, EssayGradingResult>>({});
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Scientific Support (Lesson Q&A) state
  const [qaItems, setQaItems] = useState<LessonQAItem[]>([]);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaFilter, setQaFilter] = useState<'all' | 'unanswered' | 'resolved'>('unanswered');
  const [qaCourseFilter, setQaCourseFilter] = useState<string>('all');
  const [qaReplyDrafts, setQaReplyDrafts] = useState<Record<string, string>>({});
  const [sendingQaId, setSendingQaId] = useState<string | null>(null);

  // Students & Subscriptions search + Parent Report modal
  const [studentSearch, setStudentSearch] = useState('');
  const [reportSearch, setReportSearch] = useState('');
  const [reportModalStudent, setReportModalStudent] = useState<User | null>(null);

  // Course Management States
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const teacherDisplayName =
    currentTeacher.email?.toLowerCase() === 'almtflsft@gmail.com'
      ? TEACHER_OWNER_NAME
      : currentTeacher.name || TEACHER_OWNER_NAME;
  const teacherSubject = currentTeacher.subject || 'الفلسفة والمنطق';
  const teacherSpecialty = currentTeacher.specialty || 'عام لجميع الشعب';

  const [courseTitle, setCourseTitle] = useState('');
  const [courseType, setCourseType] = useState<CourseType>('integrated');
  const [courseYear, setCourseYear] = useState<SchoolYearGrade>('الصف الأول الثانوي');
  const [courseDivision, setCourseDivision] = useState<string>(teacherSpecialty);
  const [coursePrice, setCoursePrice] = useState<number>(0);
  const [courseDescription, setCourseDescription] = useState('');
  const [courseCoverImage, setCourseCoverImage] = useState(
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop'
  );
  const [managingLessonsCourse, setManagingLessonsCourse] = useState<Course | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const courses = useMemo(
    () => getOwnedCourses(currentTeacher, allCourses, lockedAssistantMode),
    [currentTeacher, allCourses, lockedAssistantMode]
  );
  const courseIds = useMemo(() => new Set(courses.map((course) => course.id)), [courses]);

  const registeredStudents = useMemo(
    () =>
      allStudents.filter(
        (u) => u.role !== 'teacher' && u.role !== 'admin' && u.role !== 'assistant' && !u.isAssistant
      ),
    [allStudents]
  );

  const totalSubscriptionsCount = useMemo(
    () =>
      registeredStudents.reduce(
        (sum, st) =>
          sum + (st.enrolledCourseIds || []).filter((cid) => courseIds.has(cid)).length,
        0
      ),
    [registeredStudents, courseIds]
  );

  const teacherAssistants = useMemo(
    () =>
      allStudents.filter(
        (u) =>
          (u.role === 'assistant' || u.isAssistant) &&
          (currentTeacher.email?.toLowerCase() === 'almtflsft@gmail.com' ||
            u.assistantForTeacherId === currentTeacher.id ||
            u.assistantForTeacherId === 'teacher-1791139743075' ||
            u.assistantForTeacherName === currentTeacher.name ||
            u.assistantForTeacherName?.includes('سوزان'))
      ),
    [allStudents, currentTeacher]
  );

  const loadLessonQA = async () => {
    setQaLoading(true);
    try {
      const headers = await getClientAuthHeaders();
      const res = await fetch('/api/lesson-qa', { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.items)) {
          setQaItems(data.items);
        }
      }
    } catch {
      // ignore transient error
    } finally {
      setQaLoading(false);
    }
  };

  useEffect(() => {
    if (!lockedAssistantMode) {
      loadLessonQA();
    }
  }, [lockedAssistantMode]);

  const handleSendQaReply = async (qaId: string) => {
    const text = (qaReplyDrafts[qaId] || '').trim();
    if (!text) return;
    setSendingQaId(qaId);
    try {
      const headers = await getClientAuthHeaders({ 'Content-Type': 'application/json' });
      const res = await fetch(`/api/lesson-qa/${encodeURIComponent(qaId)}/reply`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          authorId: currentTeacher.id,
          authorName: teacherDisplayName,
          authorRole: 'teacher',
          text,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.item) {
          setQaItems((prev) => prev.map((it) => (it.id === qaId ? data.item : it)));
        }
        setQaReplyDrafts((prev) => ({ ...prev, [qaId]: '' }));
        showToast('تم إرسال الرد العلمي للطالب بنجاح ✅');
      } else {
        showToast('تعذر إرسال الرد حالياً، يرجى المحاولة مرة أخرى', 'error');
      }
    } catch {
      showToast('حدث خطأ أثناء الاتصال بالخادم', 'error');
    } finally {
      setSendingQaId(null);
    }
  };

  const handleOpenAddCourse = () => {
    setEditingCourse(null);
    setCourseTitle('');
    setCourseType('integrated');
    setCourseYear('الصف الأول الثانوي');
    setCourseDivision(teacherSpecialty);
    setCoursePrice(0);
    setCourseDescription('');
    setCourseCoverImage(
      'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop'
    );
    setIsAddCourseModalOpen(true);
  };

  const handleOpenEditCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseTitle(course.title);
    setCourseType(course.courseType || 'integrated');
    setCourseYear(course.schoolYear as SchoolYearGrade);
    setCourseDivision(course.division || teacherSpecialty);
    setCoursePrice(course.price);
    setCourseDescription(course.description);
    setCourseCoverImage(course.coverImage);
    setIsAddCourseModalOpen(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim()) {
      showToast('يرجى إدخال اسم الكورس', 'error');
      return;
    }

    const effectiveDivision =
      teacherSpecialty && teacherSpecialty !== 'عام لجميع الشعب'
        ? teacherSpecialty
        : courseDivision;

    if (editingCourse) {
      const updated = allCourses.map((c) =>
        c.id === editingCourse.id
          ? {
              ...c,
              title: courseTitle.trim(),
              courseType,
              schoolYear: courseYear,
              division: effectiveDivision,
              price: Number(coursePrice) || 0,
              description: courseDescription.trim(),
              coverImage: courseCoverImage,
              subject: teacherSubject,
              instructor: TEACHER_OWNER_NAME,
              teacherName: TEACHER_OWNER_NAME,
            }
          : c
      );
      onUpdateCourses?.(updated);
      saveCourses(updated);
      showToast('تم تحديث بيانات الكورس بنجاح ✅');
    } else {
      const newCourse: Course = {
        id: `course-teacher-${Date.now()}`,
        title: courseTitle.trim(),
        courseType,
        schoolYear: courseYear,
        division: effectiveDivision,
        price: Number(coursePrice) || 0,
        priceCurrency: 'ج.م',
        description: courseDescription.trim(),
        instructor: TEACHER_OWNER_NAME,
        instructorId: currentTeacher.id || 'teacher-1791139743075',
        teacherName: TEACHER_OWNER_NAME,
        teacherSubject,
        subject: teacherSubject,
        branch: 'literary',
        isLocked: false,
        lessons: [],
        exams: [],
        isPublished: true,
        createdAt: new Date().toISOString().split('T')[0],
        coverImage: courseCoverImage,
      };

      const updated = [newCourse, ...allCourses];
      onUpdateCourses?.(updated);
      saveCourses(updated);
      showToast('تم إنشاء الكورس بنجاح وسيظهر للطلاب فوراً ✅');
    }

    setIsAddCourseModalOpen(false);
  };

  const handleDeleteCourse = (courseId: string, title: string) => {
    if (window.confirm(`هل أنتِ متأكدة من حذف الكورس: "${title}"؟`)) {
      addDeletedCourseId(courseId);
      const updated = allCourses.filter((c) => c.id !== courseId);
      onUpdateCourses?.(updated);
      saveCourses(updated);
      deleteCourseFromServer(courseId).catch(() => {});
      showToast('تم حذف الكورس بنجاح', 'error');
    }
  };

  const visibleSubmissions = useMemo(
    () => submissions.filter((submission) => submission.courseId && courseIds.has(submission.courseId)),
    [submissions, courseIds]
  );

  const pendingGradingCount = useMemo(
    () => visibleSubmissions.filter((s) => s.status === 'under_review').length,
    [visibleSubmissions]
  );

  const getStudentName = (submission: StudentExamSubmission) =>
    submission.studentName ||
    allStudents.find((student) => student.id === submission.studentId)?.name ||
    'طالب منصة المتفلسفة';

  const getCourse = (submission: StudentExamSubmission) =>
    courses.find((course) => course.id === submission.courseId);

  const enrolledCount = (courseId: string) =>
    registeredStudents.filter((student) => student.enrolledCourseIds?.includes(courseId)).length;

  const openEssayReview = (submission: StudentExamSubmission) => {
    const grades = Object.fromEntries(
      Object.entries(submission.essayGrades || {}).map(([questionId, grade]) => [
        questionId,
        { ...grade },
      ])
    );
    setDraftGrades(grades);
    setSelectedSubmission(submission);
  };

  const handleGradeImageUpload = (questionId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    compressImageFile(file, 1000, 0.75).then((compressed) => {
      if (compressed) {
        setDraftGrades((current) => ({
          ...current,
          [questionId]: {
            ...(current[questionId] || {
              questionId,
              awardedMarks: 0,
              maxMarks: 20,
              feedback: '',
              strengths: [],
              missingPoints: [],
              improvementTip: '',
            }),
            modelAnswerImage: compressed,
          },
        }));
      }
    });
  };

  const saveEssayReview = async () => {
    if (!selectedSubmission) return;
    const mcqScore =
      Number((selectedSubmission as any).mcqScore) ||
      selectedSubmission.totalScore -
        Object.values(selectedSubmission.essayGrades || {}).reduce(
          (sum, grade) => sum + (grade.awardedMarks || 0),
          0
        );
    const totalScore =
      mcqScore +
      Object.values(draftGrades).reduce((sum, grade) => sum + (grade.awardedMarks || 0), 0);
    const percentage =
      selectedSubmission.maxScore > 0 ? Math.round((totalScore / selectedSubmission.maxScore) * 100) : 0;
    const updatedSubmission: StudentExamSubmission = {
      ...selectedSubmission,
      essayGrades: draftGrades,
      status: 'graded',
      totalScore,
      percentage,
      passed: percentage >= ((selectedSubmission as any).passingPercentage || 60),
      reviewedAt: new Date().toLocaleDateString('ar-EG'),
      reviewedBy: teacherDisplayName,
    };

    const updated = submissions.map((item) =>
      item.submissionId === selectedSubmission.submissionId ? updatedSubmission : item
    );
    setSubmissions(updated);
    saveSubmissions(updated);

    if (selectedSubmission.studentId) {
      const updatedStudents = allStudents.map((student) =>
        student.id === selectedSubmission.studentId
          ? {
              ...student,
              examResults: {
                ...(student.examResults || {}),
                [selectedSubmission.examId]: {
                  ...(student.examResults?.[selectedSubmission.examId] || {}),
                  score: totalScore,
                  maxScore: selectedSubmission.maxScore,
                  percentage,
                  passed: percentage >= ((selectedSubmission as any).passingPercentage || 60),
                  status: 'graded' as const,
                  completedAt: new Date().toISOString().split('T')[0],
                },
              },
            }
          : student
      );
      onUpdateStudents?.(updatedStudents);
      saveUsers(updatedStudents);
    }

    try {
      const gradeHeaders = await getClientAuthHeaders({ 'Content-Type': 'application/json' });
      await fetch('/api/teacher/grade-essay', {
        method: 'POST',
        headers: gradeHeaders,
        body: JSON.stringify({
          submissionId: selectedSubmission.submissionId,
          courseId: selectedSubmission.courseId,
          essayGrades: draftGrades,
        }),
      });
    } catch {
      // Local result already saved
    }

    showToast(`تم اعتماد وتصحيح إجابات الطالب (${getStudentName(selectedSubmission)}) بنجاح!`);
    setSelectedSubmission(null);
  };

  const filteredQaItems = useMemo(() => {
    return qaItems.filter((item) => {
      if (qaCourseFilter !== 'all' && item.courseId !== qaCourseFilter) return false;
      const hasStaffReply = (item.replies || []).some((r) => r.authorRole !== 'student');
      if (qaFilter === 'unanswered') return !item.isResolved && !hasStaffReply;
      if (qaFilter === 'resolved') return Boolean(item.isResolved || hasStaffReply);
      return true;
    });
  }, [qaItems, qaFilter, qaCourseFilter]);

  const unansweredQaCount = useMemo(
    () =>
      qaItems.filter(
        (it) => !it.isResolved && !(it.replies || []).some((r) => r.authorRole !== 'student')
      ).length,
    [qaItems]
  );

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return registeredStudents;
    return registeredStudents.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.parentPhone?.includes(q)
    );
  }, [registeredStudents, studentSearch]);

  const filteredReportStudents = useMemo(() => {
    const q = reportSearch.trim().toLowerCase();
    if (!q) return registeredStudents;
    return registeredStudents.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.parentPhone?.includes(q) ||
        s.fatherPhone?.includes(q)
    );
  }, [registeredStudents, reportSearch]);

  return (
    <div className="space-y-6 animate-fadeIn pb-16" dir="rtl">
      {/* Feedback Toast */}
      {toastMsg && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-2xl shadow-xl border text-xs sm:text-sm font-black flex items-center gap-2.5 animate-bounce ${
            toastMsg.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
              : 'bg-rose-600 text-white border-rose-500 shadow-rose-600/30'
          }`}
        >
          {toastMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header Banner & 6 Dedicated Sections for أ/ سوزان كريم فهمي */}
      {!lockedAssistantMode && (
        <>
          <section className="rounded-[32px] bg-gradient-to-l from-slate-950 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/40 border border-indigo-400/30 flex items-center justify-center text-white shrink-0 shadow-lg">
                  <GraduationCap className="w-8 h-8 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-amber-300 bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                      لوحة إدارة المعلمة المالكة للمنصة
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black">أهلاً بكِ، {teacherDisplayName}</h1>
                  <p className="mt-1 text-xs sm:text-sm text-slate-300">
                    المادة: <b>{teacherSubject}</b> • منصة خاصة متكاملة لمتابعة الطلاب والكورسات والمساعدين
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setIsAssistantsModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>إضافة معلم / معلمة مساعدة ({teacherAssistants.length})</span>
                </button>
                <button
                  onClick={onLogout}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 font-black text-xs flex items-center gap-2 cursor-pointer transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </div>
          </section>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-3 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold">إجمالي الكورسات</p>
                <p className="text-2xl font-black text-slate-900">{courses.length}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-3 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold">عدد الطلاب</p>
                <p className="text-2xl font-black text-slate-900">{registeredStudents.length}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-3 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold">عدد الاشتراكات</p>
                <p className="text-2xl font-black text-slate-900">{totalSubscriptionsCount}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-3 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold">بانتظار التصحيح</p>
                <p className="text-2xl font-black text-slate-900">{pendingGradingCount}</p>
              </div>
            </div>
          </div>

          {/* Owner Teacher Sections Navigation */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 bg-white p-2 rounded-3xl border border-slate-200 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('scientific_support')}
              className={`px-3 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'scientific_support'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>متابعة الطلاب (الدعم العلمي)</span>
              {unansweredQaCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px]">
                  {unansweredQaCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('courses')}
              className={`px-3 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'courses'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>إضافة الكورسات ({courses.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className={`px-3 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'students'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>الطلاب والاشتراكات ({registeredStudents.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('grading')}
              className={`px-3 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'grading'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 shrink-0" />
              <span>تصحيح الإجابات والمقالي</span>
              {pendingGradingCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px]">
                  {pendingGradingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('parent_reports')}
              className={`px-3 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'parent_reports'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>تقرير ولي الأمر</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('assistants')}
              className={`px-3 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'assistants'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>المعلمون المساعدون ({teacherAssistants.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('access_codes')}
              className={`px-3 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'access_codes'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Key className="w-4 h-4 shrink-0" />
              <span>أكواد الكورسات والشحن 🔑</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('coupons')}
              className={`px-3 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'coupons'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Percent className="w-4 h-4 shrink-0" />
              <span>توليد كوبونات الخصم 🏷️</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vodafone_cash')}
              className={`px-3 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'vodafone_cash'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              <span>بوابة فودافون كاش (SMS) 📱</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('recovery_email')}
              className={`px-3 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'recovery_email'
                  ? 'bg-indigo-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Mail className="w-4 h-4 shrink-0" />
              <span>بريد الاسترداد (almtflsft@gmail.com)</span>
            </button>
          </div>
        </>
      )}

      {/* Section 1: متابعة الطلاب (الدعم العلمي) */}
      {activeTab === 'scientific_support' && !lockedAssistantMode && (
        <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <span>قسم متابعة الطلاب (الدعم العلمي)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                متابعة استفسارات وأسئلة الطلاب العلمية في الدروس والرد عليها مباشرة أو عبر المنتدى العلمي.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('forum')}
                className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-black cursor-pointer"
              >
                الانتقال للمنتدى العلمي 🎓
              </button>
              <button
                type="button"
                onClick={loadLessonQA}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${qaLoading ? 'animate-spin' : ''}`} />
                <span>تحديث الأسئلة</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQaFilter('unanswered')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer ${
                  qaFilter === 'unanswered'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                بانتظار الرد ({unansweredQaCount})
              </button>
              <button
                type="button"
                onClick={() => setQaFilter('resolved')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer ${
                  qaFilter === 'resolved'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                تم الرد عليها
              </button>
              <button
                type="button"
                onClick={() => setQaFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer ${
                  qaFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل ({qaItems.length})
              </button>
            </div>

            <select
              value={qaCourseFilter}
              onChange={(e) => setQaCourseFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
            >
              <option value="all">جميع الكورسات ({courses.length})</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {filteredQaItems.length === 0 ? (
            <div className="p-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 text-center text-xs font-bold text-slate-500">
              لا توجد أسئلة طلابية في هذا التصنيف حالياً.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQaItems.map((item) => {
                const courseTitle =
                  courses.find((c) => c.id === item.courseId)?.title || item.courseTitle || 'كورس بالمنصة';
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-black text-slate-900">{item.studentName}</span>
                        <span className="text-[11px] text-slate-500 mr-2">
                          • {courseTitle} {item.lessonTitle ? `— ${item.lessonTitle}` : ''}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{item.createdAt}</span>
                    </div>

                    <p className="text-xs sm:text-sm font-bold text-slate-800 bg-white p-3 rounded-xl border border-slate-200">
                      {item.questionText}
                    </p>

                    {(item.replies || []).length > 0 && (
                      <div className="space-y-2 pr-3 border-r-2 border-emerald-400">
                        {(item.replies || []).map((rep) => (
                          <div key={rep.id} className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-xs">
                            <div className="font-black text-emerald-900 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{rep.authorName}</span>
                            </div>
                            <p className="text-slate-700 mt-1">{rep.content || rep.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={qaReplyDrafts[item.id] || ''}
                        onChange={(e) =>
                          setQaReplyDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        placeholder="اكتبي ردك العلمي للطالب هنا..."
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        disabled={sendingQaId === item.id}
                        onClick={() => handleSendQaReply(item.id)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>إرسال الرد</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Section 2: إضافة وإدارة الكورسات */}
      {activeTab === 'courses' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>إضافة وإدارة الكورسات ({courses.length})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                إنشاء وتعديل الكورسات وإضافة الدروس والفيديوهات وملفات الـ PDF والامتحانات التفاعلية.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setShowCouponsModal(true)}
                className="px-4 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-black flex items-center gap-1.5 cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>أكواد التفعيل السريعة</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('teacher_add_course')}
                className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black cursor-pointer"
              >
                صفحة إضافة متقدمة
              </button>
              <button
                type="button"
                onClick={handleOpenAddCourse}
                className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة كورس جديد +</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white border border-slate-200 rounded-[28px] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    <img
                      src={course.coverImage}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span className="text-[11px] font-black px-3 py-1 rounded-full bg-slate-900/80 text-white backdrop-blur-md">
                        {course.schoolYear}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3">
                      <span
                        className={`text-xs font-black px-3 py-1 rounded-full shadow-md ${
                          course.price === 0 ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'
                        }`}
                      >
                        {course.price === 0 ? 'مجاني' : `${course.price} ج.م`}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                      <span>{course.subject}</span>
                      <span>•</span>
                      <span>{course.division}</span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 line-clamp-2 leading-snug">
                      {course.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
                      <div className="flex items-center gap-2">
                        <span>{course.lessons?.length || 0} درس</span>
                        <span>•</span>
                        <span>{course.exams?.length || 0} امتحان</span>
                      </div>
                      <span className="text-emerald-700 font-black">
                        {enrolledCount(course.id)} طالب مشترك
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 space-y-2">
                  <button
                    onClick={() => setManagingLessonsCourse(course)}
                    className="w-full py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-indigo-200/60"
                  >
                    <Layers className="w-4 h-4" />
                    <span>إدارة الدروس والمحتوى (فيديوهات • PDF • امتحانات) 🎬</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditCourse(course)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>تعديل الكورس ✏️</span>
                    </button>

                    <button
                      onClick={() => handleDeleteCourse(course.id, course.title)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all cursor-pointer"
                      title="حذف الكورس"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {courses.length === 0 && (
              <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="text-base font-black text-slate-800">لا توجد كورسات مضافة حتى الآن</h4>
                <button
                  onClick={handleOpenAddCourse}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all shadow-md cursor-pointer"
                >
                  إضافة أول كورس الآن +
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 3: عدد الطلاب وعدد الاشتراكات */}
      {activeTab === 'students' && !lockedAssistantMode && (
        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-600" />
                <span>عدد الطلاب وعدد الاشتراكات بالمنصة</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                متابعة عدد الطلاب المسجلين وإجمالي الاشتراكات لكل كورس وتفعيل الاشتراكات مباشرة.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-black text-emerald-800">
                الطلاب: {registeredStudents.length} طالب
              </div>
              <div className="px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-xs font-black text-sky-800">
                الاشتراكات: {totalSubscriptionsCount} اشتراك
              </div>
              <button
                type="button"
                onClick={() => onNavigate('teacher_students')}
                className="px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-black cursor-pointer"
              >
                عرض صفحة الطلاب الكاملة ↗
              </button>
            </div>
          </div>

          {/* Per-Course Subscriber Counts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {courses.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 truncate">{c.title}</p>
                  <p className="text-[11px] text-slate-500">{c.schoolYear}</p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-black text-sky-700 shrink-0">
                  {enrolledCount(c.id)} مشترك
                </span>
              </div>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute top-3 right-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="ابحثي باسم الطالب أو رقم الهاتف..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Students List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <th className="py-3 px-4 font-black">اسم الطالب</th>
                  <th className="py-3 px-4 font-black">رقم الهاتف</th>
                  <th className="py-3 px-4 font-black">الصف الدراسي</th>
                  <th className="py-3 px-4 font-black">الاشتراكات المفعلة</th>
                  <th className="py-3 px-4 font-black text-center">إدارة اشتراكات الكورسات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500 text-sm">
                      لا يوجد طلاب مطابقون للبحث حالياً.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        {st.name || 'طالب منصة المتفلسفة'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{st.phone || '—'}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold">
                          {st.schoolYear || 'الصف الأول الثانوي'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-black">
                        {(st.enrolledCourseIds || []).length} كورس
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center flex-wrap gap-1.5">
                          {courses.map((c) => {
                            const isEnrolled = (st.enrolledCourseIds || []).includes(c.id);
                            return (
                              <button
                                key={c.id}
                                onClick={() => {
                                  const cur = st.enrolledCourseIds || [];
                                  const updatedCourses = isEnrolled
                                    ? cur.filter((id) => id !== c.id)
                                    : [...cur, c.id];
                                  const updatedUser: User = {
                                    ...st,
                                    enrolledCourseIds: updatedCourses,
                                    status: 'active',
                                  };
                                  const nextStudents = allStudents.map((s) =>
                                    s.id === st.id ? updatedUser : s
                                  );
                                  onUpdateStudents?.(nextStudents);
                                  saveUsers(nextStudents);
                                  saveSingleUserToServer(updatedUser).catch(() => {});
                                  showToast(
                                    isEnrolled
                                      ? `تم إلغاء اشتراك ${c.title}`
                                      : `تم تفعيل كورس ${c.title} للطالب بنجاح!`
                                  );
                                }}
                                className={`px-2.5 py-1 rounded-lg font-black text-[11px] transition-all cursor-pointer ${
                                  isEnrolled
                                    ? 'bg-emerald-500 text-slate-950 hover:bg-rose-500 hover:text-white'
                                    : 'bg-amber-400 hover:bg-amber-500 text-slate-950'
                                }`}
                              >
                                {isEnrolled ? `مشترك: ${c.title.slice(0, 14)} ✓` : `+ تفعيل: ${c.title.slice(0, 14)}`}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Section 4: تصحيح الإجابات */}
      {activeTab === 'grading' && (
        <section className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGradingSubView('essay')}
                className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer ${
                  gradingSubView === 'essay'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                تصحيح الأسئلة المقالية ({pendingGradingCount} بانتظار التصحيح)
              </button>
              <button
                type="button"
                onClick={() => setGradingSubView('scores')}
                className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer ${
                  gradingSubView === 'scores'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                سجل درجات الامتحانات ({visibleSubmissions.length})
              </button>
            </div>
            {!lockedAssistantMode && (
              <button
                type="button"
                onClick={() => onNavigate('teacher_grading')}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black cursor-pointer"
              >
                صفحة التصحيح الكاملة ↗
              </button>
            )}
          </div>

          {gradingSubView === 'essay' ? (
            <div className="space-y-3">
              {visibleSubmissions
                .filter(
                  (submission) =>
                    submission.status === 'under_review' ||
                    Object.keys(submission.essayAnswers || {}).length > 0 ||
                    Object.keys(submission.essayAnswerImages || {}).length > 0 ||
                    Object.keys(submission.essayGrades || {}).length > 0
                )
                .map((submission, index) => (
                  <div
                    key={
                      submission.submissionId
                        ? `${submission.submissionId}-${index}`
                        : `${submission.examId}-${index}`
                    }
                    className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                  >
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">{getStudentName(submission)}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {submission.courseTitle} • {submission.examTitle} •{' '}
                        <span className="font-bold text-indigo-600">
                          {submission.status === 'graded'
                            ? 'تم التصحيح ✅'
                            : 'قيد التصحيح (بانتظار مراجعة المعلمة) ⏳'}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => openEssayReview(submission)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-2 cursor-pointer transition-all shadow-xs"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>{submission.status === 'graded' ? 'تعديل الدرجات' : 'تصحيح الإجابات الآن'}</span>
                    </button>
                  </div>
                ))}
              {visibleSubmissions.filter(
                (s) =>
                  s.status === 'under_review' ||
                  Object.keys(s.essayAnswers || {}).length > 0 ||
                  Object.keys(s.essayAnswerImages || {}).length > 0 ||
                  Object.keys(s.essayGrades || {}).length > 0
              ).length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-400 font-bold bg-white">
                  لا توجد إجابات مقالية بحاجة إلى التصحيح حالياً.
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold">
                  <tr>
                    <th className="p-4">اسم الطالب</th>
                    <th className="p-4">الكورس</th>
                    <th className="p-4">الامتحان</th>
                    <th className="p-4">الدرجة</th>
                    <th className="p-4">النسبة</th>
                    <th className="p-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleSubmissions.map((submission, index) => (
                    <tr
                      key={
                        submission.submissionId
                          ? `${submission.submissionId}-${index}`
                          : `${submission.examId}-${index}`
                      }
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="p-4 font-black text-slate-900">{getStudentName(submission)}</td>
                      <td className="p-4">{submission.courseTitle || getCourse(submission)?.title || '—'}</td>
                      <td className="p-4">{submission.examTitle || '—'}</td>
                      <td className="p-4 font-mono font-black">
                        {submission.totalScore} / {submission.maxScore}
                      </td>
                      <td className="p-4 font-black text-indigo-700">
                        {Math.round(submission.percentage || 0)}%
                      </td>
                      <td className="p-4">
                        {submission.status === 'under_review' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                            بانتظار التصحيح
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                            تم التصحيح
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {visibleSubmissions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400 font-bold">
                        لا توجد امتحانات مكتملة حتى الآن.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Section 5: إرسال تقرير ولي الأمر */}
      {activeTab === 'parent_reports' && !lockedAssistantMode && (
        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-teal-600" />
                <span>إرسال تقرير مستوى الطالب لولي الأمر (واتساب)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                إرسال تقرير شامل بالدرجات والمشاهدة والالتزام مباشرة إلى رقم هاتف ولي الأمر بضغطة زر.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute top-3 right-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                placeholder="ابحثي باسم الطالب أو رقم ولي الأمر..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
              />
            </div>
          </div>

          {filteredReportStudents.length === 0 ? (
            <div className="p-10 text-center text-xs font-bold text-slate-500">
              لا يوجد طلاب مطابقون للبحث.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReportStudents.map((st) => {
                const watchedCount = Object.values(st.completedVideos || {}).filter(Boolean).length;
                const examsCount = Object.keys(st.examResults || {}).length;
                const parentPhone = st.parentPhone || st.fatherPhone || st.motherPhone || '';
                return (
                  <div
                    key={st.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-black text-slate-900">{st.name}</h3>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                          {st.schoolYear}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-bold">
                        رقم الطالب: <span className="font-mono">{st.phone || '—'}</span>
                      </p>
                      <p className="text-xs text-slate-600 font-bold">
                        رقم ولي الأمر: <span className="font-mono text-teal-700">{parentPhone || 'غير مسجل'}</span>
                      </p>
                      <div className="flex items-center gap-3 pt-1 text-[11px] font-black text-slate-600">
                        <span>🎬 {watchedCount} فيديو مكتمل</span>
                        <span>📝 {examsCount} امتحان</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setReportModalStudent(st)}
                        className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black cursor-pointer transition-all"
                      >
                        معاينة وإرسال التقرير 📋
                      </button>
                      {parentPhone && (
                        <a
                          href={buildDirectParentWhatsappUrl(st, courses, submissions, teacherDisplayName)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black transition-all"
                          title="إرسال مباشر عبر واتساب"
                        >
                          واتساب ↗
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Section 6: إضافة وإدارة المعلمين والمعلمات المساعدين */}
      {activeTab === 'assistants' && !lockedAssistantMode && (
        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-600" />
                <span>المعلمون والمعلمات المساعدون (حسب التخصص فقط)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                إضافة معلم أو معلمة مساعدة وتحديد تخصص واحد فقط لكل مساعد بحيث لا يظهر له سوى قسم تخصصه.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAssistantsModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة / تعديل مساعد جديد +</span>
            </button>
          </div>

          {teacherAssistants.length === 0 ? (
            <div className="p-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 text-center space-y-3">
              <p className="text-sm font-black text-slate-700">لا يوجد معلمون أو معلمات مساعدون حتى الآن</p>
              <button
                type="button"
                onClick={() => setIsAssistantsModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black cursor-pointer"
              >
                إضافة أول معلم / معلمة مساعدة الآن
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacherAssistants.map((assistant) => {
                const specMeta = getAssistantSpecialtyMeta(assistant.assistantSpecialty);
                const isFemale = assistant.gender === 'أنثى';
                return (
                  <div
                    key={assistant.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-black text-slate-900">{assistant.name}</h3>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isFemale ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isFemale ? '👩‍🏫 معلمة مساعدة' : '👨‍🏫 معلم مساعد'}
                      </span>
                    </div>
                    <span
                      className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full border ${specMeta.badgeColor}`}
                    >
                      {specMeta.shortLabel}
                    </span>
                    <div className="text-xs text-slate-600 font-bold pt-1">
                      رقم الدخول: <span className="font-mono text-slate-900">{assistant.accountNumber || assistant.phone}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Section 7: أكواد الكورسات والشحن */}
      {activeTab === 'access_codes' && !lockedAssistantMode && (
        <TeacherAccessCodesTab
          courses={allCourses}
          defaultTeacherName={teacherDisplayName}
          onNotify={(text, type) => showToast(text, type || 'success')}
        />
      )}

      {/* Section 8: توليد كوبونات الخصم */}
      {activeTab === 'coupons' && !lockedAssistantMode && (
        <WalletGatewayAdminTab courses={allCourses} students={allStudents} initialSubTab="coupons" />
      )}

      {/* Section 9: بوابة فودافون كاش (SMS) */}
      {activeTab === 'vodafone_cash' && !lockedAssistantMode && (
        <WalletGatewayAdminTab courses={allCourses} students={allStudents} initialSubTab="orders" />
      )}

      {/* Section 10: إعدادات بريد استرداد كلمة السر (almtflsft@gmail.com) */}
      {activeTab === 'recovery_email' && !lockedAssistantMode && <AdminWhatsAppManager />}

      {/* Quick Coupons Modal */}
      {showCouponsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                <span>أكواد التفعيل والاشتراك السريعة للكورسات</span>
              </h3>
              <button
                onClick={() => setShowCouponsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {courses.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5">
                  <h4 className="text-sm font-black text-slate-900 truncate">{c.title}</h4>
                  <div className="text-xs font-mono bg-white p-2 rounded-xl border border-dashed border-amber-400 text-center font-bold text-amber-700">
                    {c.accessCode || `SOZAN_${c.id.slice(-4).toUpperCase()}`}
                  </div>
                  <button
                    onClick={() => {
                      const code = c.accessCode || `SOZAN_${c.id.slice(-4).toUpperCase()}`;
                      navigator.clipboard.writeText(code);
                      showToast(`تم نسخ كود الكورس (${code})!`);
                    }}
                    className="w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs cursor-pointer"
                  >
                    نسخ الكود 📋
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Essay Grading */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-black text-lg text-slate-900">
                  تصحيح إجابات: {getStudentName(selectedSubmission)}
                </h2>
                <p className="text-xs text-slate-500">{selectedSubmission.examTitle}</p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {Array.from(
              new Set([
                ...Object.keys(selectedSubmission.essayAnswers || {}),
                ...Object.keys(selectedSubmission.essayAnswerImages || {}),
                ...Object.keys(selectedSubmission.essayAnswerAudio || {}),
                ...Object.keys(selectedSubmission.essayGrades || {}),
              ])
            ).map((questionId) => {
              const answer = selectedSubmission.essayAnswers?.[questionId] || '';
              const grade: any = draftGrades[questionId] || {
                questionId,
                awardedMarks: 0,
                maxMarks: 20,
                feedback: '',
                strengths: [],
                missingPoints: [],
                improvementTip: '',
              };
              return (
                <div
                  key={questionId}
                  className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3"
                >
                  <p className="text-xs font-bold text-slate-500">نص إجابة الطالب:</p>
                  <p className="text-sm text-slate-900 whitespace-pre-wrap bg-white p-3 rounded-xl border border-slate-100 leading-relaxed font-medium">
                    {answer || 'لم يكتب الطالب إجابة نصية.'}
                  </p>

                  {selectedSubmission.essayAnswerImages?.[questionId] && (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-500">صورة خط اليد المرفقة:</span>
                      <img
                        src={selectedSubmission.essayAnswerImages[questionId]}
                        alt="إجابة الطالب بخط اليد"
                        className="max-h-56 w-full rounded-xl object-contain bg-white border border-slate-200"
                      />
                    </div>
                  )}

                  {selectedSubmission.essayAnswerAudio?.[questionId] && (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-indigo-700">التسجيل الصوتي لإجابة الطالب:</span>
                      <audio
                        controls
                        src={selectedSubmission.essayAnswerAudio[questionId]}
                        className="w-full"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <label className="text-xs font-bold text-slate-700">
                      الدرجة المستحقة:
                      <input
                        type="number"
                        min={0}
                        max={grade.maxMarks || 20}
                        value={grade.awardedMarks || 0}
                        onChange={(e) =>
                          setDraftGrades({
                            ...draftGrades,
                            [questionId]: { ...grade, awardedMarks: Number(e.target.value) },
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-bold text-slate-900 bg-white"
                      />
                    </label>
                    <label className="text-xs font-bold text-slate-700">
                      الدرجة القصوى:
                      <input
                        type="number"
                        min={1}
                        value={grade.maxMarks || 20}
                        onChange={(e) =>
                          setDraftGrades({
                            ...draftGrades,
                            [questionId]: { ...grade, maxMarks: Number(e.target.value) },
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-bold text-slate-900 bg-white"
                      />
                    </label>
                  </div>

                  <label className="text-xs font-bold block text-slate-700">
                    ملاحظات وتعليق المعلمة على الإجابة:
                    <textarea
                      value={grade.feedback || ''}
                      onChange={(e) =>
                        setDraftGrades({
                          ...draftGrades,
                          [questionId]: { ...grade, feedback: e.target.value },
                        })
                      }
                      placeholder="اكتبي ملاحظاتك التوجيهية للطالب..."
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-white min-h-[70px]"
                    />
                  </label>

                  <label className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-black text-indigo-700 cursor-pointer hover:bg-indigo-50 transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>إرفاق صورة نموذج الإجابة الصحيحة للطالب</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleGradeImageUpload(questionId, e)}
                    />
                  </label>
                  {grade.modelAnswerImage && (
                    <img
                      src={grade.modelAnswerImage}
                      alt="نموذج الإجابة"
                      className="max-h-40 w-full rounded-xl object-contain bg-white border border-indigo-100"
                    />
                  )}
                </div>
              );
            })}

            <button
              onClick={saveEssayReview}
              className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <Save className="w-4 h-4" />
              <span>حفظ واعتماد التصحيح النهائي</span>
            </button>
          </div>
        </div>
      )}

      {/* Course Lesson & Content Manager Modal */}
      {managingLessonsCourse && (
        <CourseLessonManagerModal
          isOpen={Boolean(managingLessonsCourse)}
          course={managingLessonsCourse}
          onClose={() => setManagingLessonsCourse(null)}
          onSaveCourse={(updatedCourse) => {
            const exists = allCourses.some((c) => c.id === updatedCourse.id);
            const updated = exists
              ? allCourses.map((c) => (c.id === updatedCourse.id ? updatedCourse : c))
              : [updatedCourse, ...allCourses];
            onUpdateCourses?.(updated);
            saveCourses(updated);
            setManagingLessonsCourse(updatedCourse);
            showToast('تم حفظ وتحديث الدروس والمحتوى بنجاح ✅');
          }}
        />
      )}

      {/* Add / Edit Course Modal */}
      {isAddCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-xl shadow-2xl p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    {editingCourse ? 'تعديل بيانات الكورس' : 'إنشاء كورس تعليمي جديد'}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {TEACHER_OWNER_NAME} • {teacherSubject}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsAddCourseModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">اسم الكورس *:</label>
                <input
                  type="text"
                  required
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="مثال: كورس الفلسفة - الموضوع الأول (الصف الأول الثانوي)"
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">نوع الكورس:</label>
                  <select
                    value={courseType}
                    onChange={(e) => setCourseType(e.target.value as CourseType)}
                    className="w-full p-3 rounded-2xl border border-slate-200 text-xs bg-white font-bold"
                  >
                    <option value="integrated">كورس متكامل (شرح + مذكرات + امتحانات) 🎥📄</option>
                    <option value="exams_only">كورس بنك امتحانات فقط 📝</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">السنة الدراسية:</label>
                  <select
                    value={courseYear}
                    onChange={(e) => setCourseYear(e.target.value as SchoolYearGrade)}
                    className="w-full p-3 rounded-2xl border border-slate-200 text-xs bg-white font-bold"
                  >
                    <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">سعر الكورس (ج.م):</label>
                  <input
                    type="number"
                    min={0}
                    value={coursePrice}
                    onChange={(e) => setCoursePrice(Number(e.target.value))}
                    placeholder="0 = كورس مجاني"
                    className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">0 = مجاني لجميع الطلاب</span>
                </div>

                <div>
                  <label className="block mb-1">الشعبة / التخصص:</label>
                  <input
                    type="text"
                    value={courseDivision}
                    onChange={(e) => setCourseDivision(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">وصف الكورس ومحتواه:</label>
                <textarea
                  rows={3}
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  placeholder="اكتبي نبذة توضيحية للطلاب عن هذا الكورس..."
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block mb-1">صورة غلاف الكورس:</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={courseCoverImage}
                    onChange={(e) => setCourseCoverImage(e.target.value)}
                    placeholder="رابط الصورة (URL)"
                    className="flex-1 p-3 rounded-2xl border border-slate-200 text-xs font-mono"
                  />
                  <label className="px-4 py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>رفع صورة</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          compressImageFile(file, 1000, 0.75).then((compressed) => {
                            if (compressed) setCourseCoverImage(compressed);
                          });
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCourseModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20 cursor-pointer transition-all"
                >
                  {editingCourse ? 'حفظ التعديلات' : 'إنشاء الكورس'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Parent WhatsApp Report Modal */}
      {reportModalStudent && (
        <ParentWhatsappReportModal
          isOpen={Boolean(reportModalStudent)}
          student={reportModalStudent}
          courses={courses}
          submissions={submissions}
          onClose={() => setReportModalStudent(null)}
        />
      )}

      {/* Teaching Assistants Management Modal */}
      {isAssistantsModalOpen && (
        <TeacherAssistantsModal
          isOpen={isAssistantsModalOpen}
          teacher={currentTeacher}
          allUsers={allStudents}
          onUpdateUsers={(updated) => onUpdateStudents?.(updated)}
          onClose={() => setIsAssistantsModalOpen(false)}
        />
      )}
    </div>
  );
};
