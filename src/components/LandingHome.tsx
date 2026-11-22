import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Award,
  CheckCircle2,
  ArrowLeft,
  BookOpen,
  Trophy,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  GraduationCap,
  Key,
  Layers,
  Clock,
  Lock,
  Unlock,
  Play,
  Users,
  Check,
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  X,
  Upload,
  Layout,
  Video,
  Image as ImageIcon,
  FileText,
  Edit3,
  Megaphone,
  ClipboardCheck,
  PlayCircle,
} from 'lucide-react';
import learningDeskImg from '../assets/images/learning_desk_visual_1795340027547.jpg';
import courseCoverFallback from '../assets/images/course_cover_fallback_1795340027848.jpg';
import { PlatformSettings, Course, Competition, AppView, User, HomeSectionConfig, CustomHomeBlock, HeroExtraItem } from '../types';
import { getStudentEnrolledCourses } from '../data/initialData';
import { compressImageFile } from '../utils/imageUtils';
import { SecureVideoPlayer } from './SecureVideoPlayer';
import {
  THEME_PRESETS,
  applyPlatformThemeColors,
  resetPlatformThemeColors,
} from '../utils/themeEngine';

interface LandingHomeProps {
  platformSettings: PlatformSettings;
  courses: Course[];
  competitions: Competition[];
  currentUser: User | null;
  teachers?: User[];
  onNavigate: (view: AppView) => void;
  onSelectCourse: (course: Course) => void;
  onSelectCompetition: (comp: Competition) => void;
  onSelectTeacher?: (teacher: User) => void;
  onOpenAuth: (mode?: 'login' | 'signup' | 'parent') => void;
  onEnrollCourse?: (course: Course) => void;
  onDeleteTeacher?: (teacher: User) => void;
  isVisualEditMode?: boolean;
  onSaveVisualSettings?: (newSettings: PlatformSettings) => void;
  onExitVisualEditMode?: () => void;
}

const DEFAULT_HOME_SECTIONS: HomeSectionConfig[] = [
  { id: 'hero', label: 'الواجهة الترحيبية الرئيسية (Hero Banner)', visible: true },
  { id: 'stats', label: 'شريط الإحصائيات السريعة للمنصة', visible: true },
  { id: 'courses', label: 'قسم استكشف الكورسات والمواد الدراسية', visible: true },
  { id: 'competitions', label: 'قسم المسابقات المجانية ولوحة الشرف', visible: true },
  { id: 'features', label: 'قسم لماذا تختار المنصة؟ (المميزات)', visible: true },
];

const PLATFORM_HIGHLIGHTS = [
  {
    icon: PlayCircle,
    title: 'فيديو + ملفات + امتحانات',
    subtitle: 'كل درس يجمع الشرح، المذكرات، والتقييم في صفحة واحدة',
  },
  {
    icon: ClipboardCheck,
    title: 'امتحانات تفاعلية بالوقت',
    subtitle: 'تصحيح فوري للأسئلة ونتيجة مفصلة مباشرة بعد التسليم',
  },
  {
    icon: ShieldCheck,
    title: 'متابعة ولي الأمر',
    subtitle: 'تقارير تفصيلية وربط فوري لمتابعة مستوى الطالب أولاً بأول',
  },
  {
    icon: Award,
    title: 'نظام تتابعي محكم',
    subtitle: 'لا يُفتح الدرس التالي إلا بعد اجتياز امتحان الحصة بنجاح',
  },
];

const WHY_CHOOSE_FEATURES = [
  {
    number: '01',
    title: 'تدرج تعليمي واضح ومنظم',
    description: 'كل كورس مقسم إلى دروس متتالية تضم الشرح بالفيديو وملفات المراجعة والامتحان التتابعي.',
  },
  {
    number: '02',
    title: 'تصحيح فوري + مراجعة المقالي بالصور',
    description: 'تحصل على نتيجتك في الأسئلة الاختيارية فور التسليم، مع تصحيح المعلمة للأسئلة المقالية.',
  },
  {
    number: '03',
    title: 'حماية المحتوى وأكواد تفعيل خاصة',
    description: 'تفعيل سريع وآمن للكورسات عبر المحفظة، فودافون كاش، إنستا باي، أو أكواد الاشتراك.',
  },
  {
    number: '04',
    title: 'تقارير دورية لولي الأمر',
    description: 'متابعة دقيقة لدرجات الطالب وحضوره وإرسال التقارير مباشرة لولي الأمر.',
  },
  {
    number: '05',
    title: 'تصميم مريح يدعم الوضع الليلي والنهاري',
    description: 'واجهة عربية واضحة بدون تشتيت مع خطوط مخصصة للقراءة والتركيز طوال المذاكرة.',
  },
];

const ScrollRevealItem: React.FC<{
  children: React.ReactNode;
  delayIndex?: number;
  side?: 'right' | 'left';
  className?: string;
  disabled?: boolean;
}> = ({ children, delayIndex = 0, side = 'right', className = '', disabled = false }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(disabled);

  useEffect(() => {
    if (disabled) {
      setIsVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          } else if (entry.boundingClientRect.top > 60) {
            // Reset when element is below viewport so scrolling down drops items one after another
            setIsVisible(false);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -30px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [disabled]);

  const delayMs = delayIndex > 0 ? Math.min(delayIndex * 140, 980) : 0;

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      style={delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={`reveal-on-scroll ${side === 'left' ? 'from-left-side' : ''} ${
        isVisible ? 'is-visible' : ''
      } ${className}`}
    >
      {children}

            
          </div>
  );
};

export const LandingHome: React.FC<LandingHomeProps> = ({
  platformSettings,
  courses,
  competitions,
  currentUser,
  teachers = [],
  onNavigate,
  onSelectCourse,
  onSelectCompetition,
  onSelectTeacher,
  onOpenAuth,
  onEnrollCourse,
  onDeleteTeacher,
  isVisualEditMode = false,
  onSaveVisualSettings,
  onExitVisualEditMode,
}) => {
  const [draftSettings, setDraftSettings] = useState<PlatformSettings>(platformSettings);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [showColorPickerModal, setShowColorPickerModal] = useState(false);
  const [customPrimaryColor, setCustomPrimaryColor] = useState(() => localStorage.getItem('sozan_primary_color') || '#d4af37');
  const [customBgColor, setCustomBgColor] = useState(() => localStorage.getItem('sozan_bg_color') || '#0d0824');
  const [customTextColor, setCustomTextColor] = useState(() => localStorage.getItem('sozan_text_color') || '#ffffff');

  const applyColors = (pColor: string, bColor: string, tColor: string) => {
    if (!isVisualEditMode) return;
    setCustomPrimaryColor(pColor);
    setCustomBgColor(bColor);
    setCustomTextColor(tColor);
    const applied = applyPlatformThemeColors(pColor, bColor, tColor, true);
    const updatedSettings: PlatformSettings = {
      ...draftSettings,
      customTheme: {
        enabled: true,
        primaryColor: applied.primaryColor,
        bgColor: applied.bgColor,
        textColor: applied.textColor,
        updatedAt: Date.now(),
      },
    };
    setDraftSettings(updatedSettings);
    if (onSaveVisualSettings) {
      onSaveVisualSettings(updatedSettings);
    }
    setSaveToast('✅ تم تطبيق وتخصيص ألوان المنصة بالكامل بنجاح للجميع!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Sub-editor states inside visual mode (so original layout stays 100% intact until clicked)
  const [editingHeroBox, setEditingHeroBox] = useState(false);

  // Hero Extra Item Modal State (add images, videos, text, or buttons directly inside the Hero section)
  const [showHeroExtraModal, setShowHeroExtraModal] = useState(false);
  const [editingHeroItemId, setEditingHeroItemId] = useState<string | null>(null);
  const [heroItemTitle, setHeroItemTitle] = useState('');
  const [heroItemSubtitle, setHeroItemSubtitle] = useState('');
  const [heroItemBadge, setHeroItemBadge] = useState('');
  const [heroItemImageUrl, setHeroItemImageUrl] = useState('');
  const [heroItemVideoUrl, setHeroItemVideoUrl] = useState('');
  const [heroItemButtonText, setHeroItemButtonText] = useState('');
  const [heroItemTargetView, setHeroItemTargetView] = useState<AppView>('courses');
  const [heroItemPlacement, setHeroItemPlacement] = useState<'left_card' | 'right_column' | 'bottom_full'>('left_card');

  // Add / Edit Custom Media Block Modal (Text + Image + Video anywhere)
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [insertPositionIndex, setInsertPositionIndex] = useState<number | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [newBlockTitle, setNewBlockTitle] = useState('');
  const [newBlockSubtitle, setNewBlockSubtitle] = useState('');
  const [newBlockBadge, setNewBlockBadge] = useState('');
  const [newBlockImageUrl, setNewBlockImageUrl] = useState('');
  const [newBlockVideoUrl, setNewBlockVideoUrl] = useState('');
  const [newBlockButtonText, setNewBlockButtonText] = useState('');
  const [newBlockTargetView, setNewBlockTargetView] = useState<AppView>('courses');
  const [newBlockTheme, setNewBlockTheme] = useState<'indigo' | 'emerald' | 'amber' | 'rose' | 'slate'>('indigo');

  useEffect(() => {
    setDraftSettings(platformSettings);
  }, [platformSettings]);

  const activeSettings = isVisualEditMode ? draftSettings : platformSettings;

  const customBlocks: CustomHomeBlock[] = activeSettings.customHomeBlocks || [];
  const heroExtraItems: HeroExtraItem[] = activeSettings.heroExtraItems || [];

  const commitHeroSettings = (nextSettings: PlatformSettings) => {
    setDraftSettings(nextSettings);
    onSaveVisualSettings?.(nextSettings);
  };

  const handleOpenAddHeroItem = (defaultPlacement: 'left_card' | 'right_column' | 'bottom_full' = 'left_card') => {
    setEditingHeroItemId(null);
    setHeroItemTitle('');
    setHeroItemSubtitle('');
    setHeroItemBadge('');
    setHeroItemImageUrl('');
    setHeroItemVideoUrl('');
    setHeroItemButtonText('');
    setHeroItemTargetView('courses');
    setHeroItemPlacement(defaultPlacement);
    setShowHeroExtraModal(true);
  };

  const handleOpenEditHeroItem = (item: HeroExtraItem) => {
    setEditingHeroItemId(item.id);
    setHeroItemTitle(item.title || '');
    setHeroItemSubtitle(item.subtitle || '');
    setHeroItemBadge(item.badge || '');
    setHeroItemImageUrl(item.imageUrl || '');
    setHeroItemVideoUrl(item.videoUrl || '');
    setHeroItemButtonText(item.buttonText || '');
    setHeroItemTargetView(item.buttonTargetView || 'courses');
    setHeroItemPlacement(item.placement || 'left_card');
    setShowHeroExtraModal(true);
  };

  const handleSaveHeroExtraItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroItemTitle.trim() && !heroItemSubtitle.trim() && !heroItemImageUrl.trim() && !heroItemVideoUrl.trim()) {
      return;
    }

    const updatedItems: HeroExtraItem[] = editingHeroItemId
      ? heroExtraItems.map((it) =>
          it.id === editingHeroItemId
            ? {
                ...it,
                title: heroItemTitle.trim() || undefined,
                subtitle: heroItemSubtitle.trim() || undefined,
                badge: heroItemBadge.trim() || undefined,
                imageUrl: heroItemImageUrl.trim() || undefined,
                videoUrl: heroItemVideoUrl.trim() || undefined,
                buttonText: heroItemButtonText.trim() || undefined,
                buttonTargetView: heroItemTargetView,
                placement: heroItemPlacement,
              }
            : it
        )
      : [
          ...heroExtraItems,
          {
            id: `hero_item_${Date.now()}`,
            title: heroItemTitle.trim() || undefined,
            subtitle: heroItemSubtitle.trim() || undefined,
            badge: heroItemBadge.trim() || undefined,
            imageUrl: heroItemImageUrl.trim() || undefined,
            videoUrl: heroItemVideoUrl.trim() || undefined,
            buttonText: heroItemButtonText.trim() || undefined,
            buttonTargetView: heroItemTargetView,
            placement: heroItemPlacement,
          },
        ];

    const nextSettings: PlatformSettings = {
      ...draftSettings,
      heroExtraItems: updatedItems,
    };
    commitHeroSettings(nextSettings);
    setShowHeroExtraModal(false);
    setEditingHeroItemId(null);
    setSaveToast('✅ تم حفظ العنصر / الصورة داخل المنطقة الترحيبية بنجاح!');
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleDeleteHeroExtraItem = (itemId: string) => {
    const nextSettings: PlatformSettings = {
      ...draftSettings,
      heroExtraItems: heroExtraItems.filter((it) => it.id !== itemId),
    };
    commitHeroSettings(nextSettings);
  };

  const renderHeroExtraItemCard = (item: HeroExtraItem) => (
    <div
      key={item.id}
      className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-4 sm:p-5 space-y-3 shadow-xl relative overflow-hidden"
    >
      {isVisualEditMode && (
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/15">
          <span className="text-[10px] font-black text-amber-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>عنصر مضاف في هذه المنطقة</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleOpenEditHeroItem(item)}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>تعديل ✏️</span>
            </button>
            <button
              type="button"
              onClick={() => handleDeleteHeroExtraItem(item.id)}
              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>حذف</span>
            </button>
          </div>
        </div>
      )}

      {(item.badge || item.title || item.subtitle) && (
        <div className="space-y-1.5">
          {item.badge && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black">
              {item.badge}
            </span>
          )}
          {item.title && <h3 className="text-base sm:text-lg font-black text-white">{item.title}</h3>}
          {item.subtitle && <p className="text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed">{item.subtitle}</p>}
        </div>
      )}

      {item.imageUrl && (
        <div className="rounded-2xl overflow-hidden border border-white/15 bg-slate-950/50 max-h-80 flex items-center justify-center">
          <img
            src={item.imageUrl}
            alt={item.title || 'صورة مضافة'}
            className="w-full max-h-80 object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {item.videoUrl && (
        <div className="rounded-2xl overflow-hidden border border-slate-700 bg-black shadow-lg">
          <SecureVideoPlayer
            video={{
              id: `hero_extra_vid_${item.id}`,
              title: item.title || 'فيديو المنطقة الترحيبية',
              url: item.videoUrl,
              sourceType: item.videoUrl.startsWith('vcdn:') ? 'vcdn' : 'url',
              duration: '',
              order: 1,
            }}
            currentUser={currentUser}
          />
        </div>
      )}

      {item.buttonText && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => !isVisualEditMode && onNavigate(item.buttonTargetView || 'courses')}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <span>{item.buttonText}</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );

  // Build ordered sections list (combining default sections + any custom blocks)
  const buildSectionsList = (): HomeSectionConfig[] => {
    const base =
      activeSettings.homeSections && activeSettings.homeSections.length > 0
        ? activeSettings.homeSections.filter((s) => s.id !== 'custom_blocks' && s.id !== 'teachers')
        : [...DEFAULT_HOME_SECTIONS];

    // Ensure all customBlocks are represented in the sections ordering list
    const existingIds = new Set(base.map((s) => s.id));
    const missingBlockSections: HomeSectionConfig[] = customBlocks
      .filter((b) => !existingIds.has(b.id))
      .map((b) => ({
        id: b.id,
        label: `قسم مضاف: ${b.title || 'نص / صورة / فيديو'}`,
        visible: true,
      }));

    if (missingBlockSections.length === 0) return base;
    // Insert right after hero by default if not positioned yet
    const heroIdx = base.findIndex((s) => s.id === 'hero');
    if (heroIdx !== -1) {
      const copy = [...base];
      copy.splice(heroIdx + 1, 0, ...missingBlockSections);
      return copy;
    }
    return [...base, ...missingBlockSections];
  };

  const sectionsList = buildSectionsList();

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const list = [...sectionsList];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    setDraftSettings({ ...draftSettings, homeSections: list });
  };

  const handleToggleSectionVisibility = (id: string) => {
    const list = sectionsList.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s));
    setDraftSettings({ ...draftSettings, homeSections: list });
  };

  const handleOpenAddModalAtPosition = (indexAfter: number) => {
    setEditingBlockId(null);
    setInsertPositionIndex(indexAfter);
    setNewBlockTitle('');
    setNewBlockSubtitle('');
    setNewBlockBadge('');
    setNewBlockImageUrl('');
    setNewBlockVideoUrl('');
    setNewBlockButtonText('');
    setNewBlockTargetView('courses');
    setNewBlockTheme('indigo');
    setShowAddBlockModal(true);
  };

  const handleOpenEditBlockModal = (block: CustomHomeBlock) => {
    setEditingBlockId(block.id);
    setNewBlockTitle(block.title || '');
    setNewBlockSubtitle(block.subtitle || '');
    setNewBlockBadge(block.badge || '');
    setNewBlockImageUrl(block.imageUrl || '');
    setNewBlockVideoUrl(block.videoUrl || '');
    setNewBlockButtonText(block.buttonText || '');
    setNewBlockTargetView(block.buttonTargetView || 'courses');
    setNewBlockTheme(block.themeColor || 'indigo');
    setShowAddBlockModal(true);
  };

  const handleSaveCustomBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockTitle.trim() && !newBlockSubtitle.trim() && !newBlockImageUrl.trim() && !newBlockVideoUrl.trim()) {
      return;
    }

    if (editingBlockId) {
      const updatedBlocks = customBlocks.map((b) =>
        b.id === editingBlockId
          ? {
              ...b,
              title: newBlockTitle.trim(),
              subtitle: newBlockSubtitle.trim(),
              badge: newBlockBadge.trim(),
              imageUrl: newBlockImageUrl.trim() || undefined,
              videoUrl: newBlockVideoUrl.trim() || undefined,
              buttonText: newBlockButtonText.trim() || undefined,
              buttonTargetView: newBlockTargetView,
              themeColor: newBlockTheme,
            }
          : b
      );
      const updatedSections = sectionsList.map((s) =>
        s.id === editingBlockId
          ? { ...s, label: `قسم مضاف: ${newBlockTitle.trim() || 'صورة / فيديو / نص'}` }
          : s
      );
      setDraftSettings({
        ...draftSettings,
        customHomeBlocks: updatedBlocks,
        homeSections: updatedSections,
      });
    } else {
      const newId = `block_${Date.now()}`;
      const newBlock: CustomHomeBlock = {
        id: newId,
        title: newBlockTitle.trim(),
        subtitle: newBlockSubtitle.trim(),
        badge: newBlockBadge.trim() || undefined,
        imageUrl: newBlockImageUrl.trim() || undefined,
        videoUrl: newBlockVideoUrl.trim() || undefined,
        buttonText: newBlockButtonText.trim() || undefined,
        buttonTargetView: newBlockTargetView,
        themeColor: newBlockTheme,
      };
      const updatedBlocks = [...customBlocks, newBlock];
      const newSectionItem: HomeSectionConfig = {
        id: newId,
        label: `قسم مضاف: ${newBlock.title || 'صورة / فيديو / نص'}`,
        visible: true,
      };
      const nextSections = [...sectionsList];
      if (insertPositionIndex !== null && insertPositionIndex >= 0 && insertPositionIndex <= nextSections.length) {
        nextSections.splice(insertPositionIndex, 0, newSectionItem);
      } else {
        nextSections.push(newSectionItem);
      }
      const nextSettings = {
        ...draftSettings,
        customHomeBlocks: updatedBlocks,
        homeSections: nextSections,
      };
      setDraftSettings(nextSettings);
      onSaveVisualSettings?.(nextSettings);
      setSaveToast('✅ تم إضافة القسم وحفظه في الصفحة الرئيسية بنجاح!');
      setTimeout(() => setSaveToast(null), 3500);
    }

    setShowAddBlockModal(false);
    setEditingBlockId(null);
    setInsertPositionIndex(null);
  };

  const handleDeleteCustomBlock = (blockId: string) => {
    setDraftSettings({
      ...draftSettings,
      customHomeBlocks: customBlocks.filter((b) => b.id !== blockId),
      homeSections: sectionsList.filter((s) => s.id !== blockId),
    });
  };

  const handleSaveAllChanges = () => {
    onSaveVisualSettings?.(draftSettings);
    setEditingHeroBox(false);
    setSaveToast('✅ تم حفظ جميع التعديلات بنجاح ونشرها لجميع الطلاب على المنصة!');
    setTimeout(() => setSaveToast(null), 4000);
  };

  const publishedCourses = courses.filter((c) => c.isPublished);
  const publishedCompetitions = competitions.filter((c) => c.isPublished);

  const isCourseEnrolled = (courseId: string) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'teacher') return true;
    const localIds = getStudentEnrolledCourses(currentUser.id);
    return Boolean(
      (currentUser.enrolledCourseIds && currentUser.enrolledCourseIds.includes(courseId)) ||
      localIds.includes(courseId)
    );
  };

  const statsList = activeSettings.customStats && activeSettings.customStats.length === 4
    ? activeSettings.customStats
    : [
        { label: 'الكورسات التعليمية والاختبارات', value: `${publishedCourses.length}` },
        { label: 'الامتحانات المتاحة بالكورسات', value: `${publishedCourses.reduce((acc, c) => acc + c.exams.length, 0)}` },
        { label: 'المسابقات المجانية المنشورة', value: `${publishedCompetitions.length}` },
        { label: 'متابعة وتقييم فوري بالدرجات', value: '100%' },
      ];

  const featuresList = activeSettings.customFeatures && activeSettings.customFeatures.length === 3
    ? activeSettings.customFeatures
    : [
        {
          title: 'نظام القفل المتسلسل للامتحانات',
          desc: 'لا يمكن للطالب الانتقال إلى امتحان الحصة الجديدة إلا بعد اجتياز الامتحان السابق بنسبة النجاح المحددة، مما يضمن إتقان كل درس.',
        },
        {
          title: 'تأمين الكورسات بأكواد تفعيل خاصة',
          desc: 'كل كورس محمي بكود تفعيل فريد يحصل عليه الطالب من المشرف عند الاشتراك، لفتح محتوى الكورس والامتحانات المرتبطة به.',
        },
        {
          title: 'تصحيح فوري + مراجعة المقالي بالصور',
          desc: 'تصحيح إلكتروني فوري لأسئلة الاختيار من متعدد، مع إمكانية كتابة أو تصوير الإجابات المقالية ليقوم المعلم بتصحيحها وإرسال نموذج الإجابة.',
        },
      ];

  // Render an "Add Section Here" button between sections when in visual edit mode
  const renderInsertHereButton = (positionIdx: number) => {
    if (!isVisualEditMode) return null;
    return (
      <div className="flex items-center justify-center my-2">
        <button
          type="button"
          onClick={() => handleOpenAddModalAtPosition(positionIdx)}
          className="px-5 py-2.5 rounded-2xl bg-indigo-600/90 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-md border border-indigo-400/40 cursor-pointer transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>+ أضف هنا في هذا الجزء (نص / صورة / فيديو) 🖼️🎬📝</span>
        </button>
      </div>
    );
  };

  // Render a custom block (Text + Image + Video) anywhere in the page
  const renderCustomMediaBlock = (block: CustomHomeBlock) => {
    const themeClasses =
      block.themeColor === 'emerald'
        ? 'from-emerald-950 via-teal-900 to-slate-900 border-emerald-500/30 text-white'
        : block.themeColor === 'amber'
        ? 'from-amber-950 via-orange-950 to-slate-900 border-amber-500/30 text-white'
        : block.themeColor === 'rose'
        ? 'from-rose-950 via-pink-950 to-slate-900 border-rose-500/30 text-white'
        : block.themeColor === 'slate'
        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
        : 'from-indigo-950 via-blue-950 to-slate-900 border-indigo-500/30 text-white';

    const isLight = block.themeColor === 'slate';

    return (
      <section
        className={`rounded-[40px] ${
          isLight ? themeClasses : `bg-gradient-to-br ${themeClasses}`
        } p-6 sm:p-10 border shadow-xl space-y-6 relative overflow-hidden`}
      >
        {isVisualEditMode && (
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/15">
            <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>قسم مخصص (نصوص / صور / فيديوهات)</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenEditBlockModal(block)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل المحتوى أو الصورة أو الفيديو ✏️</span>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCustomBlock(block.id)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف هذا القسم نهائياً</span>
              </button>
            </div>
          </div>
        )}

        {/* Text Header */}
        {(block.badge || block.title || block.subtitle) && (
          <div className="space-y-3 max-w-4xl">
            {block.badge && (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30 text-xs font-black">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{block.badge}</span>
              </span>
            )}
            {block.title && (
              <h2 className={`text-2xl sm:text-3xl font-black leading-tight ${isLight ? 'text-slate-900 dark:text-white' : 'text-white'}`}>
                {block.title}
              </h2>
            )}
            {block.subtitle && (
              <p className={`text-sm sm:text-base leading-relaxed whitespace-pre-line ${isLight ? 'text-slate-600 dark:text-slate-300' : 'text-slate-200'}`}>
                {block.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Image Display if present */}
        {block.imageUrl && (
          <div className="rounded-3xl overflow-hidden border border-white/15 bg-slate-950/40 max-h-[540px] flex items-center justify-center shadow-lg">
            <img
              src={block.imageUrl}
              alt={block.title || 'صورة توضيحية'}
              className="w-full max-h-[540px] object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Video Display if present (plays in platform's SecureVideoPlayer!) */}
        {block.videoUrl && (
          <div className="rounded-3xl overflow-hidden border border-slate-700 bg-black shadow-2xl">
            <SecureVideoPlayer
              video={{
                id: `home_vid_${block.id}`,
                title: block.title || 'فيديو الصفحة الرئيسية',
                url: block.videoUrl,
                sourceType: block.videoUrl.startsWith('vcdn:') ? 'vcdn' : 'url',
                duration: '',
                order: 1,
              }}
              currentUser={currentUser}
            />
          </div>
        )}

        {/* Optional CTA Button */}
        {block.buttonText && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => !isVisualEditMode && onNavigate(block.buttonTargetView || 'courses')}
              className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-400/20 transition-all"
            >
              <span>{block.buttonText}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>
    );
  };

  const renderSection = (sectionConfig: HomeSectionConfig, sectionIndex: number) => {
    if (!sectionConfig.visible && !isVisualEditMode) return null;

    const wrapperClass = isVisualEditMode
      ? `relative rounded-[44px] border-2 transition-all p-2 sm:p-4 ${
          sectionConfig.visible
            ? 'border-indigo-500/50 bg-indigo-950/5'
            : 'border-rose-400/60 bg-rose-950/10 opacity-60'
        }`
      : '';

    const renderAdminControls = () => {
      if (!isVisualEditMode) return null;
      const isCustom = sectionConfig.id.startsWith('block_');
      return (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-2xl border border-slate-700 shadow-md z-30">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-[11px] font-black">
              ترتيب #{sectionIndex + 1}
            </span>
            <span className="text-xs sm:text-sm font-black text-amber-300">{sectionConfig.label}</span>
            {!sectionConfig.visible && (
              <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black">
                مخفي عن الطلاب
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {sectionConfig.id === 'hero' && (
              <button
                type="button"
                onClick={() => setEditingHeroBox(!editingHeroBox)}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1 cursor-pointer transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{editingHeroBox ? 'إغلاق تعديل الواجهة' : 'تعديل نصوص وصورة الواجهة ✏️'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => handleMoveSection(sectionIndex, 'up')}
              disabled={sectionIndex === 0}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white cursor-pointer transition-all"
              title="تحريك القسم لأعلى"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleMoveSection(sectionIndex, 'down')}
              disabled={sectionIndex === sectionsList.length - 1}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white cursor-pointer transition-all"
              title="تحريك القسم لأسفل"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            {isCustom ? (
              <button
                type="button"
                onClick={() => handleDeleteCustomBlock(sectionConfig.id)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف القسم</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleToggleSectionVisibility(sectionConfig.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                  sectionConfig.visible
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {sectionConfig.visible ? (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>إخفاء / حذف القسم</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>إظهار القسم للطلاب</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      );
    };

    // Check if this section is a custom block
    if (sectionConfig.id.startsWith('block_')) {
      const foundBlock = customBlocks.find((b) => b.id === sectionConfig.id);
      if (!foundBlock) return null;
      return (
        <ScrollRevealItem key={sectionConfig.id} disabled={isVisualEditMode} className={wrapperClass}>
          {renderAdminControls()}
          {renderCustomMediaBlock(foundBlock)}
        </ScrollRevealItem>
      );
    }

    switch (sectionConfig.id) {
      case 'hero':
        return (
          <div key="hero" className={wrapperClass}>
            {renderAdminControls()}

            {/* Optional collapsible editor drawer when Admin clicks "تعديل نصوص وصورة الواجهة" */}
            {isVisualEditMode && editingHeroBox && (
              <div className="mb-4 p-5 rounded-3xl bg-slate-900 text-white border-2 border-amber-400/60 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-black text-amber-300">تعديل بيانات الواجهة الترحيبية وإضافة صور في البطاقة</h4>
                  <button
                    type="button"
                    onClick={() => setEditingHeroBox(false)}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    إغلاق ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">الشريط الإعلاني العلوي:</label>
                    <input
                      type="text"
                      value={draftSettings.announcementText}
                      onChange={(e) => setDraftSettings({ ...draftSettings, announcementText: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">العنوان الرئيسي الكبير:</label>
                    <input
                      type="text"
                      value={draftSettings.heroTitle}
                      onChange={(e) => setDraftSettings({ ...draftSettings, heroTitle: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-black"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-300 mb-1">الوصف الفرعي تحت العنوان:</label>
                    <textarea
                      rows={2}
                      value={draftSettings.heroSubtitle}
                      onChange={(e) => setDraftSettings({ ...draftSettings, heroSubtitle: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">اسم المشرف العام (في البطاقة الجانبية):</label>
                    <input
                      type="text"
                      value={draftSettings.supervisorName}
                      onChange={(e) => setDraftSettings({ ...draftSettings, supervisorName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-black"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">لقب المشرف العام:</label>
                    <input
                      type="text"
                      value={draftSettings.supervisorTitle}
                      onChange={(e) => setDraftSettings({ ...draftSettings, supervisorTitle: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-300"
                    />
                  </div>

                  {/* Supervisor Avatar Image Upload */}
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">صورة المشرف / الأيقونة في البطاقة الجانبية:</label>
                    <div className="flex items-center gap-2">
                      <label className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs cursor-pointer flex items-center gap-1.5 shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>رفع صورة للمشرف 🖼️</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              compressImageFile(file, 800, 0.8).then((img) => {
                                if (img) commitHeroSettings({ ...draftSettings, supervisorImage: img });
                              });
                            }
                          }}
                        />
                      </label>
                      {draftSettings.supervisorImage && (
                        <button
                          type="button"
                          onClick={() => commitHeroSettings({ ...draftSettings, supervisorImage: '' })}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                        >
                          إزالة الصورة ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Additional Side Card Featured Image */}
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">إضافة صورة بارزة داخل البطاقة الجانبية:</label>
                    <div className="flex items-center gap-2">
                      <label className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer flex items-center gap-1.5 shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>رفع صورة داخل البطاقة 🖼️</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              compressImageFile(file, 1000, 0.8).then((img) => {
                                if (img) commitHeroSettings({ ...draftSettings, heroSideImage: img });
                              });
                            }
                          }}
                        />
                      </label>
                      {draftSettings.heroSideImage && (
                        <button
                          type="button"
                          onClick={() => commitHeroSettings({ ...draftSettings, heroSideImage: '' })}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                        >
                          حذف الصورة ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-300 mb-1">صورة خلفية الواجهة الرئيسية:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={draftSettings.heroBannerImage}
                        onChange={(e) => setDraftSettings({ ...draftSettings, heroBannerImage: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-[11px]"
                      />
                      <label className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs cursor-pointer flex items-center gap-1.5 shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>رفع صورة من جهازك</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              compressImageFile(file, 1200, 0.75).then((img) => {
                                if (img) commitHeroSettings({ ...draftSettings, heroBannerImage: img });
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      commitHeroSettings(draftSettings);
                      setEditingHeroBox(false);
                      setSaveToast('✅ تم حفظ تعديلات المنطقة الترحيبية بنجاح!');
                      setTimeout(() => setSaveToast(null), 3500);
                    }}
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>حفظ التعديلات الآن ✅</span>
                  </button>
                </div>
              </div>
            )}

            {/* ANNOUNCEMENT BANNER + HERO BANNER CARD + 4-COLUMN HIGHLIGHTS STRIP */}
            <ScrollRevealItem delayIndex={1} disabled={isVisualEditMode}>
              <div className="space-y-8">
                {activeSettings.announcementText && activeSettings.announcementText.trim() !== '' && (
                  <div className="flex items-center gap-3 rounded-2xl border border-[#E31B23]/25 bg-[#E31B23]/5 px-4 py-3 text-xs font-semibold text-[#151515] dark:border-[#E31B23]/40 dark:bg-[#E31B23]/10 dark:text-neutral-200 sm:text-sm">
                    <Megaphone className="h-4 w-4 shrink-0 text-[#E31B23]" />
                    <span>{activeSettings.announcementText}</span>
                  </div>
                )}

                <section className="relative overflow-hidden rounded-3xl border border-[#E31B23]/40 bg-[#0B0B0F] bg-gradient-to-br from-[#1A0D11] via-[#101014] to-[#050507] px-6 pt-8 pb-6 text-white shadow-xl transition-colors dark:border-[#E31B23]/35 dark:from-[#1A0E12] dark:via-[#141418] dark:to-[#0D0D0F] sm:px-8 sm:pt-10 sm:pb-8 lg:px-10">
                  <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[1fr_auto]">
                    <div className="min-w-0 space-y-4 text-center md:text-right">
                      <p className="text-xs font-bold text-amber-300/95 sm:text-sm">
                        تحت إشراف: <span className="font-extrabold text-white">{activeSettings.supervisorName || 'أ/ سوزان كريم فهمي'}</span> — {activeSettings.supervisorTitle || 'الصف الأول الثانوي'}
                      </p>
                      <h1
                        className="font-display font-black leading-[1.2] tracking-tight text-white"
                        style={{ fontSize: 'clamp(1.75rem, 3.6vw, 2.75rem)', textWrap: 'balance' }}
                      >
                        منصة <span className="text-[#E31B23]">المتفلسفة</span> التعليمية
                      </h1>
                      <p className="mx-auto max-w-xl text-xs leading-relaxed text-neutral-300 sm:text-sm md:mx-0">
                        {activeSettings.heroSubtitle ||
                          'المنصة التعليمية المتكاملة لشرح مادة الفلسفة والمنطق للصف الأول الثانوي، فيديوهات عالية الجودة، مذكرات منظمة، وامتحانات إلكترونية تتابعية.'}
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 md:justify-start">
                        <button
                          type="button"
                          onClick={() => !isVisualEditMode && onNavigate('courses')}
                          className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#E31B23] px-5 text-xs font-bold text-white transition-colors hover:bg-[#B5121B] sm:text-sm"
                        >
                          <span>استعراض الكورسات والدروس</span>
                          <ArrowLeft className="h-4 w-4" />
                        </button>
                        {currentUser ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (isVisualEditMode) return;
                              if (currentUser.role === 'admin') onNavigate('admin');
                              else if (currentUser.role === 'teacher') onNavigate('teacher_dashboard');
                              else if (currentUser.role === 'parent') onNavigate('parent_portal');
                              else onNavigate('student_dashboard');
                            }}
                            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/20 bg-white/10 px-5 text-xs font-bold text-white transition-colors hover:bg-white/15 sm:text-sm"
                          >
                            <span>الانتقال إلى لوحة الحساب</span>
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => !isVisualEditMode && onOpenAuth('signup')}
                              className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/20 bg-white/10 px-5 text-xs font-bold text-white transition-colors hover:bg-white/15 sm:text-sm"
                            >
                              <span>إنشاء حساب طالب جديد</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => !isVisualEditMode && onOpenAuth('login')}
                              className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap px-3 text-xs font-bold text-neutral-200 underline-offset-4 hover:text-white hover:underline sm:text-sm"
                            >
                              تسجيل الدخول
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Visual Showcase with Golden Semi-Circle Backdrop */}
                    <div className="relative mx-auto flex h-56 w-64 shrink-0 items-end justify-center sm:h-64 sm:w-72 lg:h-72 lg:w-[300px]">
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-3 bottom-0 h-40 rounded-t-full bg-gradient-to-t from-[#F59E0B] via-[#FACC15] to-[#FDE047] shadow-[0_0_50px_rgba(250,204,21,0.28)] sm:h-44 lg:h-48"
                      />
                      <div className="relative z-10 flex h-48 w-48 items-center justify-center overflow-hidden rounded-3xl border border-white/20 bg-[#0B0B0F]/90 p-3 shadow-[0_14px_30px_rgba(0,0,0,0.5)] sm:h-56 sm:w-56">
                        <img
                          src={activeSettings.heroBannerImage || '/logo.png'}
                          alt="شعار منصة المتفلسفة الرسمي"
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-contain transition-transform duration-300 hover:scale-[1.03]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Optional Extra Items if Admin added any */}
                  {heroExtraItems.length > 0 && (
                    <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
                      {heroExtraItems.map((it) => renderHeroExtraItemCard(it))}
                    </div>
                  )}
                </section>

                {/* 2. Platform Structure Highlights Strip */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {PLATFORM_HIGHLIGHTS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className="flex items-center gap-3.5 rounded-2xl border border-neutral-200 bg-white p-5 transition-colors dark:border-neutral-800 dark:bg-[#16161A]"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E31B23]/10 text-[#E31B23]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="font-display text-sm font-bold text-[#151515] dark:text-white">
                            {item.title}
                          </h2>
                          <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </section>
              </div>
            </ScrollRevealItem>
          </div>
        );

      case 'stats':
        return (
          <div key="stats" className={wrapperClass}>
            {renderAdminControls()}
            <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {statsList.map((stat, idx) => (
                <ScrollRevealItem
                  key={idx}
                  delayIndex={idx + 1}
                  disabled={isVisualEditMode}
                  className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#16161A]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1769D2]/10 text-[#1769D2]">
                    {idx === 0 ? <BookOpen className="h-5 w-5" /> : idx === 1 ? <Layers className="h-5 w-5" /> : idx === 2 ? <Trophy className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    {isVisualEditMode ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={stat.value}
                          onChange={(e) => {
                            const nextStats = [...statsList];
                            nextStats[idx] = { ...nextStats[idx], value: e.target.value };
                            setDraftSettings({ ...draftSettings, customStats: nextStats });
                          }}
                          className="w-full rounded border border-neutral-300 px-2 py-1 text-sm font-black text-[#151515]"
                        />
                        <input
                          type="text"
                          value={stat.label}
                          onChange={(e) => {
                            const nextStats = [...statsList];
                            nextStats[idx] = { ...nextStats[idx], label: e.target.value };
                            setDraftSettings({ ...draftSettings, customStats: nextStats });
                          }}
                          className="w-full rounded border border-neutral-300 px-2 py-1 text-[10px] font-bold text-neutral-600"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="font-mono-num text-2xl font-black text-[#151515] dark:text-white">{stat.value}</div>
                        <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{stat.label}</div>
                      </>
                    )}
                  </div>
                </ScrollRevealItem>
              ))}
            </section>
          </div>
        );

      case 'teachers':
        return null;

      case 'courses':
        return (
          <div key="courses" className={wrapperClass}>
            {renderAdminControls()}
            <section id="courses" className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200 pb-4 dark:border-neutral-800">
                <div>
                  <p className="text-xs font-bold text-[#1769D2]">
                    المحتوى الدراسي — الصف الأول الثانوي
                  </p>
                  <h2 className="font-display mt-1 text-2xl font-extrabold text-[#151515] dark:text-white sm:text-3xl">
                    {activeSettings.coursesSectionTitle || 'الكورسات والامتحانات المتاحة'}
                  </h2>
                  <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">
                    {activeSettings.coursesSectionSubtitle ||
                      'كل كورس مقسم إلى دروس مرتبة تضم فيديوهات الشرح والملفات والامتحانات التفاعلية.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => !isVisualEditMode && onNavigate('courses')}
                  className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 text-xs font-bold text-[#151515] transition-colors hover:bg-[#F3F4F6] dark:border-neutral-700 dark:bg-[#16161A] dark:text-white dark:hover:bg-[#1F1F26]"
                >
                  <span>كافة الكورسات</span>
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {publishedCourses.slice(0, 6).map((course, idx) => {
                  const enrolled = isCourseEnrolled(course.id);
                  const totalLessonsCount = course.lessons?.length || 0;
                  const totalVideosCount =
                    course.lessons?.reduce((sum, l) => sum + (l.videos?.length || 0), 0) || 0;
                  const totalFilesCount =
                    course.lessons?.reduce((sum, l) => sum + (l.pdfs?.length || 0), 0) || 0;
                  const totalExamsCount =
                    (course.exams?.length || 0) +
                    (course.lessons?.reduce((sum, l) => sum + (l.exams?.length || 0), 0) || 0);
                  const isIntegrated =
                    course.courseType === 'integrated' || totalLessonsCount > 0;
                  const typeLabel = isIntegrated ? 'شرح متكامل' : 'بنك امتحانات';
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
                    <ScrollRevealItem
                      key={course.id}
                      delayIndex={(idx % 3) + 1}
                      disabled={isVisualEditMode}
                    >
                      <div
                        onClick={() => !isVisualEditMode && onSelectCourse(course)}
                        className="group flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-neutral-200 bg-white transition-all hover:border-[#E31B23]/60 hover:shadow-lg dark:border-neutral-800 dark:bg-[#16161A]"
                      >
                        <div>
                          <div className="relative h-48 overflow-hidden bg-neutral-900">
                            <img
                              src={course.coverImage || courseCoverFallback}
                              alt={`كورس ${course.title} - ${course.schoolYear} - ${course.subject}`}
                              className="h-full w-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (target.src !== courseCoverFallback) {
                                  target.src = courseCoverFallback;
                                }
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                            <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2 text-xs font-bold text-white">
                              <span className="rounded-lg bg-[#1769D2]/90 px-2.5 py-1">
                                {typeLabel}
                              </span>

                              {enrolled ? (
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
                            </div>

                            <div className="absolute inset-x-4 bottom-3 flex items-center justify-between gap-2 text-xs font-semibold text-white">
                              <span className="text-neutral-200">{course.subject}</span>
                              <span className="font-mono-num text-neutral-100">{course.schoolYear}</span>
                            </div>
                          </div>

                          <div className="space-y-2.5 p-6">
                            <h3 className="font-display text-lg font-extrabold leading-snug text-[#151515] transition-colors group-hover:text-[#E31B23] dark:text-white">
                              {course.title}
                            </h3>
                            <p className="line-clamp-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                              {course.description}
                            </p>
                            <p className="text-xs font-semibold text-[#1769D2]">
                              المعلمة: {course.instructor || 'أ/ سوزان كريم فهمي'}
                            </p>

                            {hasDiscount && !enrolled && (
                              <div className="flex items-center justify-between gap-2 rounded-xl border border-[#E31B23]/25 bg-[#E31B23]/5 px-3 py-2 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono-num text-neutral-400 line-through">
                                    {course.originalPrice} {course.priceCurrency || 'ج.م'}
                                  </span>
                                  <span className="font-mono-num font-extrabold text-[#E31B23]">
                                    {course.price === 0 ? 'مجاني' : `${course.price} ${course.priceCurrency || 'ج.م'}`}
                                  </span>
                                </div>
                                <span className="rounded-md bg-[#E31B23] px-2 py-0.5 text-[10px] font-bold text-white">
                                  خصم {discountPercent}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2.5 border-t border-neutral-100 px-6 py-4 text-xs font-bold text-[#151515] dark:border-neutral-800 dark:text-neutral-200">
                          <div className="grid grid-cols-4 gap-1.5 text-center text-[11px] text-neutral-500 dark:text-neutral-400">
                            <span className="font-mono-num rounded-lg bg-[#F3F4F6] py-1 dark:bg-[#0D0D0F]">
                              {totalLessonsCount} دروس
                            </span>
                            <span className="font-mono-num rounded-lg bg-[#F3F4F6] py-1 dark:bg-[#0D0D0F]">
                              {totalVideosCount} فيديو
                            </span>
                            <span className="font-mono-num rounded-lg bg-[#F3F4F6] py-1 dark:bg-[#0D0D0F]">
                              {totalFilesCount} ملفات
                            </span>
                            <span className="font-mono-num rounded-lg bg-[#F3F4F6] py-1 dark:bg-[#0D0D0F]">
                              {totalExamsCount} امتحان
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                              <ClipboardCheck className="h-3.5 w-3.5 text-[#1769D2]" />
                              امتحانات وتدريبات تفاعلية
                            </span>
                            {enrolled ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 group-hover:underline">
                                <Check className="h-3.5 w-3.5" />
                                <span>فتح الكورس ←</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isVisualEditMode) return;
                                  if (onEnrollCourse) {
                                    onEnrollCourse(course);
                                  } else {
                                    onSelectCourse(course);
                                  }
                                }}
                                className="cursor-pointer font-extrabold text-[#E31B23] group-hover:underline"
                              >
                                {course.price === 0 ? 'فتح الكورس ←' : 'اشتراك في الكورس ←'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </ScrollRevealItem>
                  );
                })}
              </div>
            </section>
          </div>
        );

      case 'competitions':
        return (
          <div key="competitions" className={wrapperClass}>
            {renderAdminControls()}
            <ScrollRevealItem disabled={isVisualEditMode}>
              <section className="space-y-8 rounded-[32px] border border-[#E31B23]/30 bg-[#0B0B0F] bg-gradient-to-br from-[#1A0D11] via-[#101014] to-[#050507] p-8 text-white shadow-xl sm:p-10">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-lg border border-[#E31B23]/40 bg-[#E31B23]/15 px-3 py-1 text-xs font-bold text-[#ff8b90]">
                      <Trophy className="h-4 w-4 text-[#E31B23]" />
                      <span>المسابقات العلمية المجانية</span>
                    </div>
                    <h2 className="font-display text-2xl font-black sm:text-3xl">
                      {activeSettings.competitionsSectionTitle || 'تحديات ومسابقات أوائل الطلبة'}
                    </h2>
                    <p className="max-w-xl text-xs text-neutral-300 sm:text-sm">
                      {activeSettings.competitionsSectionSubtitle || 'شارك مجاناً في المسابقات الدورية وتصدر لوحة الشرف'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => !isVisualEditMode && onNavigate('competitions')}
                    className="inline-flex h-10 cursor-pointer items-center gap-2 self-start rounded-xl bg-[#E31B23] px-5 text-xs font-bold text-white transition-colors hover:bg-[#B5121B] sm:self-auto"
                  >
                    <span>دخول ساحة المسابقات</span>
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {publishedCompetitions.map((comp, idx) => (
                    <ScrollRevealItem key={comp.id} delayIndex={(idx % 2) + 1} disabled={isVisualEditMode}>
                      <div
                        onClick={() => !isVisualEditMode && onSelectCompetition(comp)}
                        className="group flex h-full cursor-pointer flex-col justify-between space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:border-[#E31B23]/50 hover:bg-white/10"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                              مسابقة مجانية
                            </span>
                            <span className="font-mono-num flex items-center gap-1 text-xs font-bold text-neutral-300">
                              <Clock className="h-3.5 w-3.5 text-amber-400" />
                              <span>{comp.durationMinutes} دقيقة</span>
                            </span>
                          </div>

                          <h3 className="font-display text-xl font-black text-white transition-colors group-hover:text-amber-300">
                            {comp.title}
                          </h3>
                          <p className="text-xs leading-relaxed text-neutral-300">
                            {comp.description}
                          </p>

                          {comp.prizeInfo && (
                            <div className="flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-xs font-bold text-amber-300">
                              <Award className="h-4 w-4 shrink-0 text-amber-400" />
                              <span>الجائزة: {comp.prizeInfo}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between border-t border-white/10 pt-4">
                          <span className="text-xs font-bold text-neutral-400">
                            الصف المستهدف: <strong className="text-white">{comp.schoolYear}</strong>
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#E31B23] px-4 py-2 text-xs font-bold text-white transition-colors group-hover:bg-[#B5121B]">
                            <Play className="h-3.5 w-3.5 fill-current" />
                            <span>ابدأ التحدي الآن</span>
                          </span>
                        </div>
                      </div>
                    </ScrollRevealItem>
                  ))}
                </div>
              </section>
            </ScrollRevealItem>
          </div>
        );

      case 'features':
        return (
          <div key="features" className={wrapperClass}>
            {renderAdminControls()}
            <ScrollRevealItem disabled={isVisualEditMode}>
              <section
                id="features"
                className="rounded-[32px] border border-neutral-200 bg-white p-6 transition-colors dark:border-neutral-800 dark:bg-[#16161A] sm:p-10"
              >
                <div className="mx-auto max-w-2xl text-center">
                  <h2 className="font-display text-2xl font-black text-[#151515] dark:text-white sm:text-3xl">
                    {activeSettings.featuresSectionTitle || 'لماذا تختار منصة المتفلسفة؟'}
                  </h2>
                  <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">
                    {activeSettings.featuresSectionSubtitle ||
                      'بيئة تعليمية متكاملة تجمع بين الشرح المبسط والامتحانات التسلسلية ومتابعة ولي الأمر.'}
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
                  <div className="lg:col-span-5">
                    <div className="h-full overflow-hidden rounded-2xl border border-neutral-200 bg-[#F3F4F6] dark:border-neutral-800 dark:bg-[#0D0D0F]">
                      <img
                        src={learningDeskImg}
                        alt="بيئة مذاكرة منظمة في منصة المتفلسفة"
                        className="h-full min-h-[240px] w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
                    {WHY_CHOOSE_FEATURES.map((feat, idx) => (
                      <div
                        key={feat.number}
                        className={`rounded-2xl border border-neutral-200/80 bg-[#F3F4F6] p-5 dark:border-neutral-800 dark:bg-[#1D1D23] ${
                          idx === WHY_CHOOSE_FEATURES.length - 1 ? 'sm:col-span-2' : ''
                        }`}
                      >
                        <span className="font-mono-num text-xs font-extrabold text-[#E31B23]">
                          {feat.number}.
                        </span>
                        <h3 className="font-display mt-1 text-base font-bold text-[#151515] dark:text-white">
                          {feat.title}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                          {feat.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </ScrollRevealItem>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-12 pb-28">
      {/* Render All Ordered Sections with "+ Add Here" buttons in between when in Visual Edit Mode */}
      {renderInsertHereButton(0)}
      {sectionsList.map((sec, idx) => (
        <React.Fragment key={sec.id}>
          {renderSection(sec, idx)}
          {renderInsertHereButton(idx + 1)}
        </React.Fragment>
      ))}

      {/* FIXED BOTTOM BUTTONS FOR VISUAL EDIT MODE ONLY */}
      {isVisualEditMode && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl pointer-events-none flex flex-col items-center gap-2">
          {saveToast && (
            <div className="pointer-events-auto px-5 py-2.5 rounded-2xl bg-emerald-600 text-white border border-emerald-400 text-xs font-black shadow-xl animate-bounce">
              {saveToast}
            </div>
          )}
          <div className="pointer-events-auto bg-slate-950/95 backdrop-blur-xl border border-amber-400/50 rounded-2xl px-3 py-2.5 shadow-2xl flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenAddHeroItem('left_card')}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>🖼️ + إضافة صور أو عناصر بالواجهة</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingHeroBox(!editingHeroBox);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{editingHeroBox ? 'إغلاق تعديل الواجهة' : '✏️ تعديل نصوص وصور البطاقة'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAddModalAtPosition(1)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ إضافة قسم (نص / صورة / فيديو) 🎬</span>
            </button>

            <button
              type="button"
              onClick={() => setShowColorPickerModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/30 transition-all border border-amber-300 animate-pulse"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>🎨 تخصيص ألوان المنصة</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAllChanges}
              className="px-4 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>حفظ التغييرات ✅</span>
            </button>

            {onExitVisualEditMode && (
              <button
                type="button"
                onClick={onExitVisualEditMode}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-slate-700 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>العودة للأدمن</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal to Add / Edit Extra Item (Images / Videos / Text / Button) Directly Inside the Hero Section */}
      {showHeroExtraModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4 sm:p-8 flex items-center justify-center animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] w-full max-w-2xl p-6 sm:p-8 space-y-5 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {editingHeroItemId ? 'تعديل العنصر في المنطقة الترحيبية' : 'إضافة صور أو عناصر أخرى في المنطقة الترحيبية'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    أضف صورة، فيديو، نص، أو زر تفاعلي ليظهر مباشرة داخل البانر الرئيسي العلوي
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHeroExtraModal(false)}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveHeroExtraItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  موضع الظهور داخل المنطقة الترحيبية:
                </label>
                <select
                  value={heroItemPlacement}
                  onChange={(e) => setHeroItemPlacement(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value="left_card">في جانب البطاقة اليسرى (أسفل بطاقة المشرف)</option>
                  <option value="right_column">في الجانب الأيمن (أسفل النص والأزرار)</option>
                  <option value="bottom_full">بعرض المنطقة الترحيبية بالكامل (أسفل النص والبطاقة معاً)</option>
                </select>
              </div>

              {/* Image Upload or URL */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2.5">
                <label className="block font-black text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>إرفاق صورة (رفع من جهازك أو رابط مباشر):</span>
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    value={heroItemImageUrl.startsWith('data:') ? 'تم رفع الصورة من الجهاز ✅' : heroItemImageUrl}
                    onChange={(e) => setHeroItemImageUrl(e.target.value)}
                    placeholder="ضع رابط الصورة أو ارفعها من جهازك بالزر المجاور..."
                    className="flex-1 w-full px-3.5 py-2.5 rounded-xl border border-emerald-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-[11px]"
                    dir="ltr"
                  />
                  <label className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع صورة من جهازك 🖼️</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          compressImageFile(file, 1200, 0.8).then((base64) => {
                            if (base64) setHeroItemImageUrl(base64);
                          });
                        }
                      }}
                    />
                  </label>
                  {heroItemImageUrl && (
                    <button
                      type="button"
                      onClick={() => setHeroItemImageUrl('')}
                      className="px-3 py-2.5 rounded-xl bg-rose-100 text-rose-700 font-bold text-xs cursor-pointer"
                    >
                      مسح
                    </button>
                  )}
                </div>
                {heroItemImageUrl && (
                  <div className="max-h-40 overflow-hidden rounded-xl border border-emerald-200 bg-white p-1 flex justify-center">
                    <img src={heroItemImageUrl} alt="preview" className="max-h-36 object-contain" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                    عنوان العنصر (اختياري):
                  </label>
                  <input
                    type="text"
                    value={heroItemTitle}
                    onChange={(e) => setHeroItemTitle(e.target.value)}
                    placeholder="مثال: جدول المراجعات أو تهنئة الأوائل"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                    شارة صغيرة أعلى العنوان (اختياري):
                  </label>
                  <input
                    type="text"
                    value={heroItemBadge}
                    onChange={(e) => setHeroItemBadge(e.target.value)}
                    placeholder="مثال: هام جداً 🔥"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  نص أو وصف إضافي (اختياري):
                </label>
                <textarea
                  rows={2}
                  value={heroItemSubtitle}
                  onChange={(e) => setHeroItemSubtitle(e.target.value)}
                  placeholder="اكتب أي تفاصيل أو نصوص تريد إظهارها مع الصورة..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                    رابط فيديو (اختياري - يوتيوب أو MP4):
                  </label>
                  <input
                    type="text"
                    value={heroItemVideoUrl}
                    onChange={(e) => setHeroItemVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                    نص زر التوجيه (اختياري):
                  </label>
                  <input
                    type="text"
                    value={heroItemButtonText}
                    onChange={(e) => setHeroItemButtonText(e.target.value)}
                    placeholder="مثال: اشترك الآن"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowHeroExtraModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black cursor-pointer shadow-md"
                >
                  {editingHeroItemId ? 'حفظ التعديلات ✅' : 'إضافة وحفظ في المنطقة الترحيبية الآن +'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full-Page Modal to Add or Edit Text + Image + Video Block at Any Position */}
      {showAddBlockModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4 sm:p-8 flex items-center justify-center animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] w-full max-w-3xl p-6 sm:p-8 space-y-5 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {editingBlockId ? 'تعديل محتوى القسم المخصص' : 'إضافة نص أو صورة أو فيديو في الصفحة الرئيسية'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    يمكنك إضافة عنوان ونص، أو رفع صورة من جهازك، أو وضع رابط فيديو (يوتيوب / VCDN / MP4) ليشتغل في الصفحة الرئيسية
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddBlockModal(false)}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomBlock} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>العنوان الرئيسي (اختياري):</span>
                  </label>
                  <input
                    type="text"
                    value={newBlockTitle}
                    onChange={(e) => setNewBlockTitle(e.target.value)}
                    placeholder="مثال: فيديو تعريفي بالمنصة أو إعلان هام للطلاب"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                    شارة صغيرة أعلى العنوان (اختياري):
                  </label>
                  <input
                    type="text"
                    value={newBlockBadge}
                    onChange={(e) => setNewBlockBadge(e.target.value)}
                    placeholder="مثال: جديد وحصري ✨"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  النص أو الشرح التفصيلي (اختياري):
                </label>
                <textarea
                  rows={3}
                  value={newBlockSubtitle}
                  onChange={(e) => setNewBlockSubtitle(e.target.value)}
                  placeholder="اكتب أي نصوص أو تفاصيل تريد إظهارها للطلاب في هذا الجزء..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Image Upload or URL */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <label className="block font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>إضافة صورة في هذا الجزء (رفع من جهازك أو رابط مباشر):</span>
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    value={newBlockImageUrl.startsWith('data:') ? 'تم رفع صورة من الجهاز ✅' : newBlockImageUrl}
                    onChange={(e) => setNewBlockImageUrl(e.target.value)}
                    placeholder="ضع رابط الصورة هنا أو ارفعها من جهازك..."
                    className="flex-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-[11px]"
                    dir="ltr"
                  />
                  <label className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع صورة من الجهاز 🖼️</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          compressImageFile(file, 1200, 0.8).then((base64) => {
                            if (base64) setNewBlockImageUrl(base64);
                          });
                        }
                      }}
                    />
                  </label>
                  {newBlockImageUrl && (
                    <button
                      type="button"
                      onClick={() => setNewBlockImageUrl('')}
                      className="px-3 py-2.5 rounded-xl bg-rose-100 text-rose-700 font-bold text-xs cursor-pointer"
                    >
                      مسح الصورة
                    </button>
                  )}
                </div>
                {newBlockImageUrl && (
                  <div className="max-h-40 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 flex justify-center">
                    <img src={newBlockImageUrl} alt="preview" className="max-h-36 object-contain" />
                  </div>
                )}
              </div>

              {/* Video URL or Upload */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-2">
                <label className="block font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-indigo-600" />
                  <span>إضافة فيديو يعمل بمشغل المنصة (رابط يوتيوب / VCDN / Google Drive / MP4):</span>
                </label>
                <input
                  type="text"
                  value={newBlockVideoUrl}
                  onChange={(e) => setNewBlockVideoUrl(e.target.value)}
                  placeholder="مثال: https://www.youtube.com/watch?v=... أو vcdn:... أو رابط الفيديو"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-[11px]"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">نص الزر (اتركه فارغاً بدون زر):</label>
                  <input
                    type="text"
                    value={newBlockButtonText}
                    onChange={(e) => setNewBlockButtonText(e.target.value)}
                    placeholder="مثال: تصفح الكورسات"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">وجهة الزر عند الضغط:</label>
                  <select
                    value={newBlockTargetView}
                    onChange={(e) => setNewBlockTargetView(e.target.value as AppView)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="courses">صفحة الكورسات</option>
                    <option value="competitions">صفحة المسابقات</option>
                    <option value="signup">صفحة إنشاء حساب</option>
                    <option value="login">صفحة تسجيل الدخول</option>
                    <option value="forum">منتدى النقاش</option>
                  </select>
                </div>
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">لون خلفية القسم:</label>
                  <select
                    value={newBlockTheme}
                    onChange={(e) => setNewBlockTheme(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="indigo">أزرق ملكي داكن (Indigo)</option>
                    <option value="slate">أبيض فاتح كلاسيكي (Light Card)</option>
                    <option value="emerald">أخضر زمردي (Emerald)</option>
                    <option value="amber">ذهبي دافئ (Amber)</option>
                    <option value="rose">وردي داكن (Rose)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddBlockModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black cursor-pointer shadow-md"
                >
                  {editingBlockId ? 'حفظ تعديلات القسم ✅' : 'إضافة القسم في الصفحة الرئيسية الآن +'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

            {/* Platform Theme Color Customizer Modal (Admin Visual Editor Only) */}
      {isVisualEditMode && showColorPickerModal && (
        <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-white space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base">تخصيص ألوان أجزاء المنصة</h3>
                  <p className="text-xs text-slate-400">تحكم كامل في الألوان والأزرار وخلفيات المنصة</p>
                </div>
              </div>
              <button
                onClick={() => setShowColorPickerModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Primary Accent Color */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-amber-300">لون الأزرار والعناصر الرئيسية (Gold/Accent)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customPrimaryColor}
                    onChange={(e) => setCustomPrimaryColor(e.target.value)}
                    className="w-12 h-10 rounded-xl cursor-pointer bg-slate-800 border border-slate-700"
                  />
                  <input
                    type="text"
                    value={customPrimaryColor}
                    onChange={(e) => setCustomPrimaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 font-mono text-xs text-white"
                  />
                </div>
              </div>

              {/* Background Color */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-300">لون الخلفية العامة للمنصة (Background)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customBgColor}
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    className="w-12 h-10 rounded-xl cursor-pointer bg-slate-800 border border-slate-700"
                  />
                  <input
                    type="text"
                    value={customBgColor}
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 font-mono text-xs text-white"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-black text-slate-400">نماذج ألوان جاهزة بضغطة زر:</label>
                <div className="grid grid-cols-2 gap-2">
                  {THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyColors(preset.primaryColor, preset.bgColor, preset.textColor)}
                      className="p-2 rounded-xl border text-xs font-bold hover:scale-102 transition-transform cursor-pointer text-right"
                      style={{
                        backgroundColor: preset.bgColor,
                        color: preset.textColor,
                        borderColor: preset.primaryColor,
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  applyColors(customPrimaryColor, customBgColor, customTextColor);
                  setShowColorPickerModal(false);
                }}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 cursor-pointer"
              >
                تطبيق وحفظ الألوان الآن ✅
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isVisualEditMode) return;
                  resetPlatformThemeColors(true);
                  const next: PlatformSettings = {
                    ...draftSettings,
                    customTheme: {
                      enabled: false,
                      primaryColor: '',
                      bgColor: '',
                      textColor: '',
                      updatedAt: Date.now(),
                    },
                  };
                  setDraftSettings(next);
                  if (onSaveVisualSettings) onSaveVisualSettings(next);
                  setSaveToast('✅ تم إرجاع الألوان الافتراضية للمنصة للجميع.');
                  setShowColorPickerModal(false);
                }}
                className="px-3.5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
              >
                الافتراضي
              </button>
              <button
                type="button"
                onClick={() => setShowColorPickerModal(false)}
                className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
};
