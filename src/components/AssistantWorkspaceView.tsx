import React, { useEffect, useState } from 'react';
import {
  LogOut,
  MessageSquare,
  ClipboardCheck,
  BookOpen,
  ShieldCheck,
  GraduationCap,
  Send,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import type { AppView, Course, LessonQAItem, User } from '../types';
import { getAssistantSpecialtyMeta } from './TeacherAssistantsModal';
import { TeacherPermissionsDashboard } from './TeacherPermissionsDashboard';
import { ForumView } from './ForumView';
import { getClientAuthHeaders } from '../utils/authToken';

interface Props {
  assistant: User;
  allCourses: Course[];
  allUsers: User[];
  onUpdateCourses: (courses: Course[]) => void;
  onUpdateUsers: (users: User[]) => void;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
}

export const AssistantWorkspaceView: React.FC<Props> = ({
  assistant,
  allCourses,
  allUsers,
  onUpdateCourses,
  onUpdateUsers,
  onNavigate,
  onLogout,
}) => {
  const specialty = assistant.assistantSpecialty || 'student_support';
  const specMeta = getAssistantSpecialtyMeta(specialty);
  const SpecIcon = specMeta.icon;
  const isFemaleAssistant = assistant.gender === 'أنثى';
  const assistantRoleTitle = isFemaleAssistant ? 'معلمة مساعدة' : 'معلم مساعد';

  // Resolve the platform owner teacher (أ/ سوزان كريم فهمي) so the assistant operates strictly on her courses
  const parentTeacher: User =
    allUsers.find(
      (u) =>
        (u.email?.toLowerCase() === 'almtflsft@gmail.com') ||
        (u.role === 'teacher' &&
          !u.isAssistant &&
          (u.id === assistant.assistantForTeacherId ||
            u.name?.includes('سوزان') ||
            (assistant.assistantForTeacherName && u.name === assistant.assistantForTeacherName)))
    ) || {
      id: assistant.assistantForTeacherId || 'teacher-1791139743075',
      name: 'أ/ سوزان كريم فهمي',
      email: 'almtflsft@gmail.com',
      phone: assistant.phone,
      parentPhone: '',
      schoolYear: assistant.schoolYear || 'الصف الأول الثانوي',
      subject: assistant.subject || 'الفلسفة والمنطق',
      specialty: assistant.specialty || 'عام لجميع الشعب',
      role: 'teacher',
      registeredAt: assistant.registeredAt,
    };

  const [supportSubView, setSupportSubView] = useState<'lesson_qa' | 'forum'>('lesson_qa');
  const [qaItems, setQaItems] = useState<LessonQAItem[]>([]);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaFilter, setQaFilter] = useState<'all' | 'unanswered' | 'resolved'>('unanswered');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [sendingQaId, setSendingQaId] = useState<string | null>(null);

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
    if (specialty === 'student_support') {
      loadLessonQA();
    }
  }, [specialty]);

  const handleSendQaReply = async (qaId: string) => {
    const text = (replyDrafts[qaId] || '').trim();
    if (!text) return;
    setSendingQaId(qaId);
    try {
      const headers = await getClientAuthHeaders({ 'Content-Type': 'application/json' });
      const res = await fetch(`/api/lesson-qa/${encodeURIComponent(qaId)}/reply`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          authorId: assistant.id,
          authorName: `${assistant.name} (${assistantRoleTitle})`,
          authorRole: 'assistant',
          text,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.item) {
          setQaItems((prev) => prev.map((it) => (it.id === qaId ? data.item : it)));
        }
        setReplyDrafts((prev) => ({ ...prev, [qaId]: '' }));
      }
    } catch {
      // ignore
    } finally {
      setSendingQaId(null);
    }
  };

  const filteredQaItems = qaItems.filter((item) => {
    const hasStaffReply = (item.replies || []).some((r) => r.authorRole !== 'student');
    if (qaFilter === 'unanswered') return !item.isResolved && !hasStaffReply;
    if (qaFilter === 'resolved') return Boolean(item.isResolved || hasStaffReply);
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col" dir="rtl">
      {/* Focused Isolated Top Header — Only shows Assistant Info, Specialty & Logout */}
      <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-amber-300 shrink-0 shadow-md">
              <SpecIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  {isFemaleAssistant ? '👩‍🏫 معلمة مساعدة' : '👨‍🏫 معلم مساعد'} • {specMeta.shortLabel}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>منصة {parentTeacher.name}</span>
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black mt-1">
                مرحباً بك{isFemaleAssistant ? 'ِ' : ''}، {assistant.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>صلاحية مخصصة: {specMeta.shortLabel} فقط</span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Isolated Workspace Content Based Strictly on Assistant Specialty */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {specialty === 'student_support' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Strict Scientific Student Support Only */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                  <span>قسم الدعم العلمي ومتابعة استفسارات الطلاب ({parentTeacher.name})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  هذا الحساب مخصص فقط للرد على أسئلة الطلاب العلمية في الدروس والمنتدى، ولا تظهر فيه أي أقسام إدارية أو مالية أخرى.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl self-start lg:self-auto">
                <button
                  type="button"
                  onClick={() => setSupportSubView('lesson_qa')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    supportSubView === 'lesson_qa'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  أسئلة الطلاب في الدروس 💬
                </button>
                <button
                  type="button"
                  onClick={() => setSupportSubView('forum')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    supportSubView === 'forum'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  أسئلة المنتدى العلمي 🎓
                </button>
              </div>
            </div>

            {supportSubView === 'lesson_qa' ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQaFilter('unanswered')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer ${
                        qaFilter === 'unanswered'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      بانتظار الرد
                    </button>
                    <button
                      type="button"
                      onClick={() => setQaFilter('resolved')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer ${
                        qaFilter === 'resolved'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      تم الرد عليها
                    </button>
                    <button
                      type="button"
                      onClick={() => setQaFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer ${
                        qaFilter === 'all'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      الكل ({qaItems.length})
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={loadLessonQA}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${qaLoading ? 'animate-spin' : ''}`} />
                    <span>تحديث</span>
                  </button>
                </div>

                {filteredQaItems.length === 0 ? (
                  <div className="p-10 text-center text-xs font-bold text-slate-500">
                    لا توجد أسئلة طلابية مطابقة لهذا التصنيف حالياً.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredQaItems.map((item) => {
                      const courseTitle =
                        allCourses.find((c) => c.id === item.courseId)?.title ||
                        item.courseTitle ||
                        'كورس بالمنصة';
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
                              value={replyDrafts[item.id] || ''}
                              onChange={(e) =>
                                setReplyDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                              }
                              placeholder="اكتب الرد العلمي التوضيحي للطالب هنا..."
                              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                            />
                            <button
                              type="button"
                              disabled={sendingQaId === item.id}
                              onClick={() => handleSendQaReply(item.id)}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
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
              </div>
            ) : (
              <ForumView
                currentUser={{
                  ...assistant,
                  role: 'assistant',
                  name: `${assistant.name} (${assistantRoleTitle})`,
                }}
                onOpenAuth={() => {}}
              />
            )}
          </div>
        )}

        {specialty === 'essay_grading' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-amber-600" />
                  <span>قسم تصحيح الأسئلة المقالية لطلاب ({parentTeacher.name})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  تخصصك مخصص حصراً لمراجعة إجابات الطلاب المقالية واعتماد الدرجات دون عرض أي قسم آخر.
                </p>
              </div>
            </div>

            <TeacherPermissionsDashboard
              currentTeacher={parentTeacher}
              allCourses={allCourses}
              allStudents={allUsers}
              onUpdateCourses={onUpdateCourses}
              onUpdateStudents={onUpdateUsers}
              onNavigate={onNavigate}
              onLogout={onLogout}
              lockedAssistantMode="essay_grading"
            />
          </div>
        )}

        {specialty === 'content_management' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <span>قسم إضافة وإدارة الدروس والمحتوى ({parentTeacher.name})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  تخصصك مخصص حصراً لإضافة وتعديل الكورسات والفيديوهات وملفات الـ PDF والامتحانات دون عرض أي قسم آخر.
                </p>
              </div>
            </div>

            <TeacherPermissionsDashboard
              currentTeacher={parentTeacher}
              allCourses={allCourses}
              allStudents={allUsers}
              onUpdateCourses={onUpdateCourses}
              onUpdateStudents={onUpdateUsers}
              onNavigate={onNavigate}
              onLogout={onLogout}
              lockedAssistantMode="content_management"
            />
          </div>
        )}
      </main>
    </div>
  );
};
