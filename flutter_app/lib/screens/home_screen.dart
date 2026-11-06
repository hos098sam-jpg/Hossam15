import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/student_model.dart';
import '../widgets/quick_drawer.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  Student? _student;
  LastLesson? _lastLesson;
  List<CourseSummary> _enrolledCourses = [];
  List<dynamic> _recentSubmissions = [];
  Map<String, dynamic> _stats = {};

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final data = await ApiService().fetchDashboard();
      setState(() {
        _student = data['student'];
        _lastLesson = data['lastLesson'];
        _enrolledCourses = data['enrolledCourses'];
        _recentSubmissions = data['recentSubmissions'];
        _stats = data['stats'];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0E17),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F141C),
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withOpacity(0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.school_rounded, color: Color(0xFF10B981), size: 20),
            ),
            const SizedBox(width: 10),
            const Text(
              'منصة قلب العلم',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.white70),
            tooltip: 'تحديث البيانات',
            onPressed: _loadDashboardData,
          ),
          IconButton(
            icon: const Icon(Icons.notifications_none_rounded, color: Colors.white70),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('لا توجد إشعارات جديدة حالياً'),
                  backgroundColor: Color(0xFF1F2937),
                ),
              );
            },
          ),
        ],
      ),
      drawer: const QuickDrawer(),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF10B981)),
              ),
            )
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.cloud_off_rounded, size: 60, color: Colors.redAccent),
                        const SizedBox(height: 16),
                        Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: Colors.white, fontSize: 16),
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton.icon(
                          onPressed: _loadDashboardData,
                          icon: const Icon(Icons.refresh),
                          label: const Text('إعادة المحاولة'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadDashboardData,
                  color: const Color(0xFF10B981),
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Welcome Banner
                        _buildWelcomeBanner(),

                        const SizedBox(height: 20),

                        // FOCUS HERO: Last Resumed Lesson (User's primary requirement)
                        _buildHeroLastLessonCard(),

                        const SizedBox(height: 24),

                        // Quick Stats
                        _buildQuickStatsRow(),

                        const SizedBox(height: 28),

                        // Enrolled Courses Section
                        _buildEnrolledCoursesSection(),

                        const SizedBox(height: 28),

                        // Recent Exam Results
                        _buildRecentExamsSection(),

                        const SizedBox(height: 30),
                      ],
                    ),
                  ),
                ),
    );
  }

  /// Welcome greeting with student name
  Widget _buildWelcomeBanner() {
    final studentName = _student?.name ?? 'عزيزي الطالب';
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'مرحباً بك، $studentName 👋',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'واصل تفوقك الأكاديمي مع أفضل المعلمين',
              style: TextStyle(color: Colors.grey[400], fontSize: 13),
            ),
          ],
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: const Color(0xFF10B981).withOpacity(0.12),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
          ),
          child: Row(
            children: const [
              Icon(Icons.bolt_rounded, color: Color(0xFF10B981), size: 16),
              SizedBox(width: 4),
              Text(
                'دفعة 2027',
                style: TextStyle(
                  color: Color(0xFF10B981),
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  /// HERO CARD: Focuses explicitly on the student's last resumed lesson
  Widget _buildHeroLastLessonCard() {
    if (_lastLesson == null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFF121824),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF1F2937)),
        ),
        child: Column(
          children: [
            const Icon(Icons.play_circle_outline_rounded, size: 48, color: Color(0xFF10B981)),
            const SizedBox(height: 12),
            const Text(
              'ابدأ رحلة التعلم الآن',
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            Text(
              'اختر من كورساتك المفعلة للمتابعة من حيث توقفت',
              style: TextStyle(color: Colors.grey[400], fontSize: 13),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => Navigator.pushNamed(context, '/courses'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('استعراض الكورسات', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
    }

    final lesson = _lastLesson!;
    final progress = lesson.progressPercentage.clamp(0, 100);

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: const LinearGradient(
          colors: [Color(0xFF1A2333), Color(0xFF111723)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(color: const Color(0xFF10B981).withOpacity(0.35), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF10B981).withOpacity(0.08),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withOpacity(0.12),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(17)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: const [
                    Icon(Icons.history_toggle_off_rounded, color: Color(0xFF10B981), size: 18),
                    SizedBox(width: 8),
                    Text(
                      'متابعة المشاهدة • آخر درس توقفت عنده',
                      style: TextStyle(
                        color: Color(0xFF10B981),
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.black26,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${progress}% منجز',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Course & Subject
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF06B6D4).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        lesson.subject,
                        style: const TextStyle(
                          color: Color(0xFF06B6D4),
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        lesson.courseTitle,
                        style: TextStyle(
                          color: Colors.grey[400],
                          fontSize: 13,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 10),

                // Video Title
                Text(
                  lesson.videoTitle,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),

                const SizedBox(height: 6),

                // Lesson Subtitle
                Text(
                  lesson.lessonTitle,
                  style: TextStyle(color: Colors.grey[400], fontSize: 13),
                ),

                const SizedBox(height: 16),

                // Progress Bar
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: LinearProgressIndicator(
                    value: progress / 100,
                    backgroundColor: const Color(0xFF1F2937),
                    valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF10B981)),
                    minHeight: 8,
                  ),
                ),

                const SizedBox(height: 8),

                // Duration Timestamps
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'الموضع: ${lesson.formattedPosition}',
                      style: TextStyle(color: Colors.grey[400], fontSize: 12),
                    ),
                    Text(
                      'المدة الكلية: ${lesson.formattedDuration}',
                      style: TextStyle(color: Colors.grey[400], fontSize: 12),
                    ),
                  ],
                ),

                const SizedBox(height: 18),

                // Resume Play Action Button
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pushNamed(
                        context,
                        '/video-player',
                        arguments: {
                          'courseId': lesson.courseId,
                          'courseTitle': lesson.courseTitle,
                          'lessonId': lesson.lessonId,
                          'lessonTitle': lesson.lessonTitle,
                          'videoId': lesson.videoId,
                          'videoTitle': lesson.videoTitle,
                          'videoUrl': lesson.videoUrl,
                          'youtubeId': lesson.youtubeId,
                          'startPositionSeconds': lesson.positionSeconds,
                          'durationSeconds': lesson.durationSeconds,
                        },
                      );
                    },
                    icon: const Icon(Icons.play_arrow_rounded, color: Colors.black, size: 24),
                    label: const Text(
                      'استئناف الدرس الآن',
                      style: TextStyle(
                        color: Colors.black,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      elevation: 4,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Quick Stats Counters
  Widget _buildQuickStatsRow() {
    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            title: 'الكورسات المفعلة',
            value: '${_stats['enrolledCoursesCount'] ?? _enrolledCourses.length}',
            icon: Icons.auto_stories_rounded,
            color: const Color(0xFF10B981),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            title: 'الامتحانات المكتملة',
            value: '${_stats['completedExamsCount'] ?? 0}',
            icon: Icons.checklist_rounded,
            color: const Color(0xFF06B6D4),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            title: 'رصيد المحفظة',
            value: '${_stats['walletBalance'] ?? 0} ج.م',
            icon: Icons.account_balance_wallet_rounded,
            color: const Color(0xFFF59E0B),
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF121824),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF1F2937)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(color: Colors.grey[400], fontSize: 11),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  /// Enrolled Courses Section
  Widget _buildEnrolledCoursesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'كورساتي المفعلة',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            TextButton(
              onPressed: () => Navigator.pushNamed(context, '/courses'),
              child: const Text('عرض الكل', style: TextStyle(color: Color(0xFF10B981))),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (_enrolledCourses.isEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF121824),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline, color: Colors.grey),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'لم تقم بالاشتراك في كورسات بعد. تصفح الكورسات المتاحة واشترك بكود المحاضرة.',
                    style: TextStyle(color: Colors.grey[400], fontSize: 13),
                  ),
                ),
              ],
            ),
          )
        else
          SizedBox(
            height: 180,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _enrolledCourses.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final course = _enrolledCourses[index];
                return GestureDetector(
                  onTap: () {
                    Navigator.pushNamed(
                      context,
                      '/course-details',
                      arguments: {'courseId': course.id, 'title': course.title},
                    );
                  },
                  child: Container(
                    width: 220,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF121824),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF1F2937)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFF10B981).withOpacity(0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                course.subject,
                                style: const TextStyle(
                                  color: Color(0xFF10B981),
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const Spacer(),
                            const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 16),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          course.title,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const Spacer(),
                        Row(
                          children: [
                            Icon(Icons.video_library_rounded, size: 14, color: Colors.grey[400]),
                            const SizedBox(width: 4),
                            Text(
                              '${course.lessonsCount} دروس',
                              style: TextStyle(color: Colors.grey[400], fontSize: 12),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
      ],
    );
  }

  /// Recent Exams Section
  Widget _buildRecentExamsSection() {
    if (_recentSubmissions.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'نتائج آخر الامتحانات',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _recentSubmissions.length.clamp(0, 3),
          separatorBuilder: (_, __) => const SizedBox(height: 10),
          itemBuilder: (context, index) {
            final sub = _recentSubmissions[index];
            final passed = sub['passed'] == true;
            final score = sub['score'] ?? 0;
            final total = sub['totalMarks'] ?? 100;
            final percent = sub['percentage'] ?? 0;

            return Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF121824),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: passed ? const Color(0xFF10B981).withOpacity(0.3) : Colors.redAccent.withOpacity(0.3),
                ),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: passed ? const Color(0xFF10B981).withOpacity(0.15) : Colors.red.withOpacity(0.15),
                    child: Icon(
                      passed ? Icons.check_circle_outline_rounded : Icons.highlight_off_rounded,
                      color: passed ? const Color(0xFF10B981) : Colors.redAccent,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          sub['examTitle'] ?? 'امتحان إلكتروني',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'الدرجة: $score من $total ($percent%)',
                          style: TextStyle(color: Colors.grey[400], fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: passed ? const Color(0xFF10B981).withOpacity(0.2) : Colors.red.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      passed ? 'ناجح' : 'يحتاج مراجعة',
                      style: TextStyle(
                        color: passed ? const Color(0xFF10B981) : Colors.redAccent,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}
