import 'package:flutter/material.dart';
import '../services/api_service.dart';

class CourseDetailsScreen extends StatefulWidget {
  final String courseId;
  final String? initialTitle;

  const CourseDetailsScreen({Key? key, required this.courseId, this.initialTitle}) : super(key: key);

  @override
  State<CourseDetailsScreen> createState() => _CourseDetailsScreenState();
}

class _CourseDetailsScreenState extends State<CourseDetailsScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  Map<String, dynamic>? _course;

  @override
  void initState() {
    super.initState();
    _loadCourse();
  }

  Future<void> _loadCourse() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final course = await ApiService().fetchCourseDetails(widget.courseId);
      setState(() {
        _course = course;
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
        title: Text(
          _course?['title'] ?? widget.initialTitle ?? 'تفاصيل الكورس',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 17),
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF10B981)),
              ),
            )
          : _errorMessage != null
              ? Center(
                  child: Text(_errorMessage!, style: const TextStyle(color: Colors.white)),
                )
              : _buildContent(),
    );
  }

  Widget _buildContent() {
    final course = _course!;
    final isEnrolled = course['isEnrolled'] == true;
    final lessons = (course['lessons'] as List? ?? []);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Course Header Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFF121824),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF1F2937)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        course['subject'] ?? 'مادة دراسية',
                        style: const TextStyle(
                          color: Color(0xFF10B981),
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                    Text(
                      course['isFree'] == true ? 'كورس مجاني' : '${course['price']} ج.م',
                      style: const TextStyle(
                        color: Color(0xFFFBBF24),
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  course['title'] ?? '',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (course['description'] != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    course['description'],
                    style: TextStyle(color: Colors.grey[400], fontSize: 13),
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Syllabus / Lessons List
          const Text(
            'فصول ودروس الكورس',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),

          if (lessons.isEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF121824),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'سيتم رفع محاضرات هذا الكورس قريباً.',
                style: TextStyle(color: Colors.grey),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: lessons.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final lesson = lessons[index];
                final videos = (lesson['videos'] as List? ?? []);
                final exams = (lesson['exams'] as List? ?? []);

                return Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF121824),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFF1F2937)),
                  ),
                  child: ExpansionTile(
                    initiallyExpanded: index == 0,
                    iconColor: const Color(0xFF10B981),
                    collapsedIconColor: Colors.grey,
                    title: Text(
                      lesson['title'] ?? 'درس تعليمي',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    subtitle: Text(
                      '${videos.length} فيديو • ${exams.length} اختبار',
                      style: TextStyle(color: Colors.grey[400], fontSize: 12),
                    ),
                    children: [
                      // Video items
                      ...videos.map((vid) {
                        final isLocked = vid['isLocked'] == true;
                        return ListTile(
                          leading: Icon(
                            isLocked ? Icons.lock_outline_rounded : Icons.play_circle_fill_rounded,
                            color: isLocked ? Colors.grey : const Color(0xFF10B981),
                          ),
                          title: Text(
                            vid['title'] ?? 'فيديو الشرح',
                            style: TextStyle(
                              color: isLocked ? Colors.grey : Colors.white,
                              fontSize: 14,
                            ),
                          ),
                          trailing: isLocked
                              ? const Text('مقفل', style: TextStyle(color: Colors.grey, fontSize: 11))
                              : const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Colors.grey),
                          onTap: isLocked
                              ? () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('يجب الاشتراك بالكورس لمشاهدة هذا الفيديو.'),
                                      backgroundColor: Colors.redAccent,
                                    ),
                                  );
                                }
                              : () {
                                  Navigator.pushNamed(
                                    context,
                                    '/video-player',
                                    arguments: {
                                      'courseId': course['id'],
                                      'courseTitle': course['title'],
                                      'lessonId': lesson['id'],
                                      'lessonTitle': lesson['title'],
                                      'videoId': vid['id'],
                                      'videoTitle': vid['title'],
                                      'videoUrl': vid['videoUrl'],
                                      'youtubeId': vid['youtubeId'],
                                      'durationSeconds': vid['durationSeconds'] ?? 1800,
                                    },
                                  );
                                },
                        );
                      }).toList(),

                      // Exam items
                      ...exams.map((exam) {
                        return ListTile(
                          leading: const Icon(Icons.quiz_rounded, color: Color(0xFF06B6D4)),
                          title: Text(
                            exam['title'] ?? 'اختبار الدرس',
                            style: const TextStyle(color: Colors.white, fontSize: 14),
                          ),
                          trailing: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFF06B6D4).withOpacity(0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text('ابدأ الحل', style: TextStyle(color: Color(0xFF06B6D4), fontSize: 11)),
                          ),
                          onTap: () {
                            Navigator.pushNamed(
                              context,
                              '/exam',
                              arguments: {
                                'courseId': course['id'],
                                'examId': exam['id'],
                                'examTitle': exam['title'],
                                'exam': exam,
                              },
                            );
                          },
                        );
                      }).toList(),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}
