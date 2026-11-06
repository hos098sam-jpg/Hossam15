import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/student_model.dart';
import '../widgets/quick_drawer.dart';

class CoursesScreen extends StatefulWidget {
  final bool onlyEnrolled;
  const CoursesScreen({Key? key, this.onlyEnrolled = false}) : super(key: key);

  @override
  State<CoursesScreen> createState() => _CoursesScreenState();
}

class _CoursesScreenState extends State<CoursesScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  List<CourseSummary> _courses = [];
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _fetchCourses();
  }

  Future<void> _fetchCourses() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final courses = await ApiService().fetchCourses();
      setState(() {
        _courses = courses;
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
    var filteredCourses = _courses;
    if (widget.onlyEnrolled) {
      filteredCourses = filteredCourses.where((c) => c.isEnrolled).toList();
    }
    if (_searchQuery.isNotEmpty) {
      filteredCourses = filteredCourses
          .where((c) =>
              c.title.contains(_searchQuery) ||
              c.subject.contains(_searchQuery) ||
              c.teacherName.contains(_searchQuery))
          .toList();
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0A0E17),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F141C),
        elevation: 0,
        title: Text(
          widget.onlyEnrolled ? 'كورساتي المفعلة' : 'جميع الكورسات والمحاضرات',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      drawer: const QuickDrawer(),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFF121824),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF1F2937)),
              ),
              child: TextField(
                onChanged: (val) => setState(() => _searchQuery = val.trim()),
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  hintText: 'ابحث عن كورس أو مادة أو معلم...',
                  hintStyle: TextStyle(color: Colors.grey, fontSize: 13),
                  prefixIcon: Icon(Icons.search_rounded, color: Color(0xFF10B981)),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
              ),
            ),
          ),

          // Course List
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF10B981)),
                    ),
                  )
                : _errorMessage != null
                    ? Center(
                        child: Text(_errorMessage!, style: const TextStyle(color: Colors.white)),
                      )
                    : filteredCourses.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.menu_book_rounded, size: 50, color: Colors.grey),
                                const SizedBox(height: 12),
                                Text(
                                  widget.onlyEnrolled ? 'لا توجد كورسات مفعلة حالياً' : 'لم يتم العثور على كورسات مطابقة',
                                  style: const TextStyle(color: Colors.grey, fontSize: 14),
                                ),
                              ],
                            ),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            itemCount: filteredCourses.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 14),
                            itemBuilder: (context, index) {
                              final course = filteredCourses[index];
                              return _buildCourseCard(course);
                            },
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildCourseCard(CourseSummary course) {
    return GestureDetector(
      onTap: () {
        Navigator.pushNamed(
          context,
          '/course-details',
          arguments: {'courseId': course.id, 'title': course.title},
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF121824),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: course.isEnrolled
                ? const Color(0xFF10B981).withOpacity(0.3)
                : const Color(0xFF1F2937),
          ),
        ),
        padding: const EdgeInsets.all(16),
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
                const SizedBox(width: 8),
                if (course.isEnrolled)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF06B6D4).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      'مفعل بحسابك',
                      style: TextStyle(
                        color: Color(0xFF06B6D4),
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                const Spacer(),
                Text(
                  course.isFree ? 'مجاني' : '${course.price} ج.م',
                  style: TextStyle(
                    color: course.isFree ? const Color(0xFF10B981) : const Color(0xFFFBBF24),
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              course.title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            if (course.description != null && course.description!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                course.description!,
                style: TextStyle(color: Colors.grey[400], fontSize: 12),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.person_outline_rounded, size: 16, color: Colors.grey),
                    const SizedBox(width: 6),
                    Text(
                      course.teacherName,
                      style: TextStyle(color: Colors.grey[400], fontSize: 12),
                    ),
                  ],
                ),
                Row(
                  children: [
                    const Icon(Icons.play_circle_outline_rounded, size: 16, color: Color(0xFF10B981)),
                    const SizedBox(width: 4),
                    Text(
                      '${course.lessonsCount} درس',
                      style: const TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
