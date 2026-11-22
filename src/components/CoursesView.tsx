import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  ClipboardCheck,
  Unlock,
  Check,
} from 'lucide-react';
import courseCoverFallback from '../assets/images/course_cover_fallback_1795340027848.jpg';
import { Course, User } from '../types';
import {
  saveCurrentUser,
  saveUsers,
  getSavedUsers,
  saveStudentEnrolledCourse,
} from '../data/initialData';
import { CourseBundlesSection } from './CourseBundlesSection';

interface CoursesViewProps {
  courses: Course[];
  currentUser: User | null;
  teachers?: User[];
  onSelectCourse: (course: Course) => void;
  onSelectTeacher?: (teacher: User) => void;
  onUpdateUser?: (user: User) => void;
  onOpenAuth?: () => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  courses,
  currentUser,
  teachers = [],
  onSelectCourse,
  onUpdateUser,
  onOpenAuth,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'integrated' | 'exams_only'>('all');

  const isStudent = currentUser && currentUser.role === 'student';
  const isApprovedStudent =
    isStudent && (currentUser.status === 'active' || currentUser.status === 'approved' || !currentUser.status);

  const matchesStudentGrade = (courseYear: string, studentYear: string) => {
    if (!studentYear) return true;
    if (courseYear === studentYear) return true;
    if (studentYear.includes('الأول الثانوي') && courseYear.includes('الأول الثانوي')) return true;
    return true;
  };

  const publishedCourses = courses.filter((c) => c.isPublished !== false);
  const subjects = Array.from(new Set(publishedCourses.map((c) => c.subject).filter(Boolean)));

  const filteredCourses = publishedCourses.filter((course) => {
    const matchesSearch =
      !searchQuery.trim() ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.instructor && course.instructor.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesYear =
      selectedYear === 'all' ||
      (selectedYear === 'my_grade' &&
        currentUser?.schoolYear &&
        matchesStudentGrade(course.schoolYear, currentUser.schoolYear)) ||
      course.schoolYear === selectedYear ||
      matchesStudentGrade(course.schoolYear, selectedYear);

    const matchesSubject = selectedSubject === 'all' || course.subject === selectedSubject;

    const isCourseIntegrated =
      course.courseType === 'integrated' || (course.lessons && course.lessons.length > 0);
    const matchesType =
      selectedType === 'all' ||
      (selectedType === 'integrated' && isCourseIntegrated) ||
      (selectedType === 'exams_only' && !isCourseIntegrated);

    const matchesTeacher =
      selectedTeacher === 'all' ||
      course.instructorId === selectedTeacher ||
      (course.teacherName && course.teacherName.trim() === selectedTeacher.trim()) ||
      (course.instructor && course.instructor.trim() === selectedTeacher.trim());

    return matchesSearch && matchesYear && matchesSubject && matchesTeacher && matchesType;
  });

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      {/* Student Grade Specific Banner */}
      {isApprovedStudent && (
        <div className="space-y-3 rounded-[32px] border border-emerald-500/30 bg-[#0B0B0F] bg-gradient-to-l from-[#12201B] via-[#101014] to-[#0D111A] p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-extrabold text-neutral-950">
                حساب معتمد ومفعل
              </span>
              <span className="font-mono-num text-xs text-emerald-200">
                الصف الدراسي: {currentUser.schoolYear}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedYear(selectedYear === 'my_grade' ? 'all' : 'my_grade')}
              className="cursor-pointer rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/20"
            >
              {selectedYear === 'my_grade'
                ? 'عرض جميع الصفوف والمناهج'
                : 'تخصيص لصفّي الدراسي فقط'}
            </button>
          </div>
          <h2 className="font-display text-xl font-black sm:text-2xl">
            مرحباً بك يا {currentUser.name}
          </h2>
          <p className="max-w-2xl text-xs leading-relaxed text-neutral-300 sm:text-sm">
            {selectedYear === 'my_grade'
              ? `يتم الآن عرض الكورسات والامتحانات المقررة لصفك الدراسي (${currentUser.schoolYear}).`
              : 'تصفح كافة الكورسات المتكاملة وبنوك الامتحانات المتاحة على منصة المتفلسفة التعليمية.'}
          </p>
        </div>
      )}

      {/* Catalog Header with Search & Filters */}
      <div className="space-y-5 rounded-[32px] border border-neutral-200 bg-white p-6 transition-colors dark:border-neutral-800 dark:bg-[#16161A] sm:p-8 theme-surface">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200 pb-4 dark:border-neutral-800">
          <div>
            <p className="text-xs font-bold text-[#1769D2]">
              المكتبة الأكاديمية 2027 — أ/ سوزان كريم فهمي
            </p>
            <h1 className="font-display mt-1 text-2xl font-extrabold text-[#151515] dark:text-white sm:text-3xl">
              دليل الكورسات المتكاملة وبنوك الامتحانات
            </h1>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-sm">
              تصفح الكورسات المتكاملة (فيديوهات الشرح، مذكرات PDF، والامتحانات التفاعلية) في مادة الفلسفة والمنطق للصف الأول الثانوي.
            </p>
          </div>
          <div className="font-mono-num shrink-0 rounded-xl border border-neutral-200 bg-[#F3F4F6] px-4 py-2 text-xs font-extrabold text-[#151515] dark:border-neutral-700 dark:bg-[#0D0D0F] dark:text-white">
            {filteredCourses.length} كورس متاح
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم الكورس أو المادة..."
              className="h-11 w-full rounded-xl border border-neutral-200 bg-[#F3F4F6]/60 pl-4 pr-10 text-xs text-[#151515] transition-colors placeholder:text-neutral-400 focus:border-[#1769D2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1769D2]/15 dark:border-neutral-700 dark:bg-[#0D0D0F] dark:text-white dark:focus:bg-[#0D0D0F] sm:text-sm"
            />
            <Search className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 text-neutral-400" />
          </div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="h-11 w-full rounded-xl border border-neutral-200 bg-[#F3F4F6]/60 px-3.5 text-xs font-bold text-[#151515] transition-colors focus:border-[#1769D2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1769D2]/15 dark:border-neutral-700 dark:bg-[#0D0D0F] dark:text-neutral-200 sm:text-sm"
          >
            <option value="all">الصف الأول الثانوي — مادة الفلسفة</option>
            {isApprovedStudent && (
              <option value="my_grade">
                صفي الدراسي ({currentUser?.schoolYear || 'الصف الأول الثانوي'})
              </option>
            )}
            <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="h-11 w-full rounded-xl border border-neutral-200 bg-[#F3F4F6]/60 px-3.5 text-xs font-bold text-[#151515] transition-colors focus:border-[#1769D2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1769D2]/15 dark:border-neutral-700 dark:bg-[#0D0D0F] dark:text-neutral-200 sm:text-sm"
          >
            <option value="all">جميع المواد الدراسية</option>
            {subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          {teachers.length > 1 ? (
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="h-11 w-full rounded-xl border border-neutral-200 bg-[#F3F4F6]/60 px-3.5 text-xs font-bold text-[#151515] transition-colors focus:border-[#1769D2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1769D2]/15 dark:border-neutral-700 dark:bg-[#0D0D0F] dark:text-neutral-200 sm:text-sm"
            >
              <option value="all">أ/ سوزان كريم فهمي وفريق الإشراف</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.subject || 'الفلسفة والمنطق'})
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-[#F3F4F6]/60 p-1 dark:border-neutral-700 dark:bg-[#0D0D0F]">
              {[
                { id: 'all' as const, label: 'الكل' },
                { id: 'integrated' as const, label: 'شرح متكامل' },
                { id: 'exams_only' as const, label: 'امتحانات' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedType(tab.id)}
                  className={`flex-1 cursor-pointer rounded-lg py-2 text-xs font-bold transition-colors ${
                    selectedType === tab.id
                      ? 'bg-[#E31B23] text-white'
                      : 'text-neutral-600 hover:text-[#151515] dark:text-neutral-400 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Type Filter Strip when Teacher Dropdown is shown */}
        {teachers.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all' as const, label: 'كل الكورسات' },
              { id: 'integrated' as const, label: 'شرح متكامل (فيديو + PDF + امتحان)' },
              { id: 'exams_only' as const, label: 'بنوك امتحانات فقط' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedType(tab.id)}
                className={`cursor-pointer rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                  selectedType === tab.id
                    ? 'bg-[#E31B23] text-white'
                    : 'bg-[#F3F4F6] text-neutral-700 hover:bg-neutral-200 dark:bg-[#0D0D0F] dark:text-neutral-300 dark:hover:bg-neutral-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Course Bundles & Discount Packages Section */}
      <CourseBundlesSection
        courses={publishedCourses}
        currentUser={currentUser}
        onSelectCourse={onSelectCourse}
        onBundleSubscribed={(newEnrolledIds, newBalance) => {
          if (!currentUser) return;
          const updatedUser: User = {
            ...currentUser,
            enrolledCourseIds: newEnrolledIds,
            ...(typeof newBalance === 'number' ? { walletBalance: newBalance } : {}),
          };
          saveCurrentUser(updatedUser);
          newEnrolledIds.forEach((cid) => {
            saveStudentEnrolledCourse(currentUser.id, cid);
          });
          const allUsers = getSavedUsers();
          if (allUsers.some((u) => u.id === currentUser.id)) {
            saveUsers(allUsers.map((u) => (u.id === currentUser.id ? updatedUser : u)));
          }
          onUpdateUser?.(updatedUser);
        }}
      />

      {/* Courses Cards Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const isCourseIntegrated =
              course.courseType === 'integrated' || (course.lessons && course.lessons.length > 0);
            const lessonsCount = course.lessons?.length || 0;
            const videosCount =
              course.lessons?.reduce((sum, l) => sum + (l.videos?.length || 0), 0) || 0;
            const pdfsCount =
              course.lessons?.reduce((sum, l) => sum + (l.pdfs?.length || 0), 0) || 0;
            const examsCount =
              (course.exams?.length || 0) +
              (course.lessons?.reduce((sum, l) => sum + (l.exams?.length || 0), 0) || 0);
            const isEnrolled = Boolean(currentUser?.enrolledCourseIds?.includes(course.id));
            const hasDiscount = Boolean(
              course.originalPrice && Number(course.originalPrice) > Number(course.price)
            );
            const discountPercent = hasDiscount
              ? course.discountPercentage ||
                Math.round(
                  ((Number(course.originalPrice) - Number(course.price)) /
                    Number(course.originalPrice)) *
                    100
                )
              : 0;

            return (
              <div
                key={course.id}
                onClick={() => onSelectCourse(course)}
                className="group flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-neutral-200 bg-white transition-all hover:border-[#E31B23]/60 hover:shadow-lg dark:border-neutral-800 dark:bg-[#16161A]"
              >
                <div>
                  <div className="relative h-48 overflow-hidden bg-neutral-900">
                    <img
                      src={course.coverImage || courseCoverFallback}
                      alt={`كورس ${course.title} - ${course.schoolYear}`}
                      className="h-full w-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== courseCoverFallback) {
                          target.src = courseCoverFallback;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                    {/* Top Right Tags */}
                    <div className="absolute right-4 top-4 flex flex-col items-start gap-1.5 text-xs font-bold text-white">
                      <span className="rounded-lg bg-[#1769D2]/90 px-2.5 py-1">
                        {isCourseIntegrated ? 'شرح متكامل' : 'بنك امتحانات'}
                      </span>
                      {course.division && (
                        <span className="rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-neutral-950">
                          {course.division}
                        </span>
                      )}
                    </div>

                    {/* Top Left Price / Status Badge */}
                    <div className="absolute left-4 top-4 z-10 flex flex-col items-end gap-1.5 text-xs font-bold text-white">
                      {isEnrolled ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/95 px-2.5 py-1">
                          <Unlock className="h-3 w-3" />
                          <span>مشترك بالكورس</span>
                        </span>
                      ) : course.price === 0 ? (
                        <span className="rounded-lg bg-emerald-600/95 px-2.5 py-1">
                          مجاني بالكامل
                        </span>
                      ) : (
                        <span className="font-mono-num rounded-lg bg-[#E31B23] px-2.5 py-1">
                          {course.price} {course.priceCurrency || 'ج.م'}
                        </span>
                      )}

                      {hasDiscount && !isEnrolled && (
                        <span className="rounded-md bg-neutral-950/90 px-2 py-0.5 text-[10px] font-extrabold text-amber-300 border border-amber-400/40">
                          خصم {discountPercent}%
                        </span>
                      )}
                    </div>

                    {/* Bottom Scrim Metadata */}
                    <div className="absolute inset-x-4 bottom-3 flex items-center justify-between gap-2 text-xs font-semibold text-white">
                      <span className="text-neutral-200">{course.subject}</span>
                      <span className="font-mono-num text-neutral-100">{course.schoolYear}</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 p-6">
                    <h3 className="font-display line-clamp-2 text-lg font-extrabold leading-snug text-[#151515] transition-colors group-hover:text-[#E31B23] dark:text-white">
                      {course.title}
                    </h3>

                    <p className="line-clamp-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                      {course.description}
                    </p>

                    <p className="text-xs font-semibold text-[#1769D2]">
                      المعلمة: {course.instructor || 'أ/ سوزان كريم فهمي'}
                    </p>

                    {hasDiscount && !isEnrolled && (
                      <div className="flex items-center justify-between gap-2 rounded-xl border border-[#E31B23]/25 bg-[#E31B23]/5 px-3 py-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-num text-neutral-400 line-through">
                            {course.originalPrice} {course.priceCurrency || 'ج.م'}
                          </span>
                          <span className="font-mono-num font-extrabold text-[#E31B23]">
                            {course.price === 0
                              ? 'مجاني'
                              : `${course.price} ${course.priceCurrency || 'ج.م'}`}
                          </span>
                        </div>
                        <span className="rounded-md bg-[#E31B23] px-2 py-0.5 text-[10px] font-bold text-white">
                          وفر {discountPercent}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Mini Stats & Action */}
                <div className="space-y-2.5 border-t border-neutral-100 px-6 py-4 text-xs font-bold text-[#151515] dark:border-neutral-800 dark:text-neutral-200">
                  <div className="grid grid-cols-4 gap-1.5 text-center text-[11px] text-neutral-500 dark:text-neutral-400">
                    <span className="font-mono-num rounded-lg bg-[#F3F4F6] py-1 dark:bg-[#0D0D0F]">
                      {lessonsCount} دروس
                    </span>
                    <span className="font-mono-num rounded-lg bg-[#F3F4F6] py-1 dark:bg-[#0D0D0F]">
                      {videosCount} فيديو
                    </span>
                    <span className="font-mono-num rounded-lg bg-[#F3F4F6] py-1 dark:bg-[#0D0D0F]">
                      {pdfsCount} ملفات
                    </span>
                    <span className="font-mono-num rounded-lg bg-[#F3F4F6] py-1 dark:bg-[#0D0D0F]">
                      {examsCount} امتحان
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                      <ClipboardCheck className="h-3.5 w-3.5 text-[#1769D2]" />
                      امتحانات وتدريبات تفاعلية
                    </span>

                    {isEnrolled ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 group-hover:underline">
                        <Check className="h-3.5 w-3.5" />
                        <span>فتح الكورس ←</span>
                      </span>
                    ) : course.price === 0 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!currentUser) {
                            onOpenAuth?.();
                            return;
                          }
                          const prev = currentUser.enrolledCourseIds || [];
                          const updatedIds = Array.from(new Set([...prev, course.id]));
                          const updatedUser: User = {
                            ...currentUser,
                            enrolledCourseIds: updatedIds,
                          };
                          saveCurrentUser(updatedUser);
                          saveStudentEnrolledCourse(currentUser.id, course.id);
                          const allUsers = getSavedUsers();
                          saveUsers(allUsers.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
                          onUpdateUser?.(updatedUser);
                          onSelectCourse(course);
                        }}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-extrabold text-white transition-colors hover:bg-emerald-700"
                        title="اشترك في هذا الكورس المجاني فوراً وافتح المحتوى"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>فتح الكورس مجاناً</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-extrabold text-[#E31B23] group-hover:underline">
                        <span>اشتراك الآن ({course.price} {course.priceCurrency || 'ج.م'})</span>
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3 rounded-[32px] border border-neutral-200 bg-white p-10 text-center dark:border-neutral-800 dark:bg-[#16161A]">
          <BookOpen className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600" />
          <h3 className="font-display text-base font-black text-[#151515] dark:text-white">
            {courses.length === 0
              ? 'لا توجد كورسات مضافة على المنصة حالياً'
              : 'لا توجد كورسات مطابقة لخيارات البحث'}
          </h3>
          <p className="mx-auto max-w-md text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            {courses.length === 0
              ? 'سيتم إضافة الكورسات والمناهج والامتحانات المعتمدة قريباً بواسطة المعلمة والإدارة.'
              : 'جرب تغيير نوع الكورس، المادة، أو السنة الدراسية لعرض النتائج.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedYear('all');
              setSelectedSubject('all');
              setSelectedTeacher('all');
              setSelectedType('all');
              setSearchQuery('');
            }}
            className="cursor-pointer rounded-xl bg-[#E31B23] px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#B5121B]"
          >
            عرض كافة الكورسات المتاحة
          </button>
        </div>
      )}
    </div>
  );
};
