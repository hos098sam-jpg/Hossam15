import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../models/student_model.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String? _authToken;
  Student? _currentStudent;

  String? get authToken => _authToken;
  Student? get currentStudent => _currentStudent;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _authToken = prefs.getString('auth_token');
    final studentJson = prefs.getString('cached_student');
    if (studentJson != null) {
      try {
        _currentStudent = Student.fromJson(jsonDecode(studentJson));
      } catch (_) {}
    }
  }

  Future<Map<String, String>> _getHeaders() async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (_authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
    }
    if (_currentStudent != null) {
      headers['x-student-id'] = _currentStudent!.id;
    }
    return headers;
  }

  /// تسجيل الدخول من التطبيق
  Future<Map<String, dynamic>> login({
    required String identifier,
    required String password,
    String? deviceId,
    String? deviceName,
  }) async {
    final url = Uri.parse(ApiConfig.loginEndpoint);
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'identifier': identifier,
        'password': password,
        'deviceId': deviceId ?? 'flutter_device_${DateTime.now().millisecondsSinceEpoch}',
        'deviceName': deviceName ?? 'هاتف محمول',
      }),
    ).timeout(ApiConfig.timeout);

    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      _authToken = data['token'];
      _currentStudent = Student.fromJson(data['student']);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', _authToken!);
      await prefs.setString('cached_student', jsonEncode(data['student']));

      return {'success': true, 'student': _currentStudent, 'notice': data['deviceNotice']};
    } else {
      throw Exception(data['error'] ?? 'فشل تسجيل الدخول');
    }
  }

  /// جلب بيانات الصفحة الرئيسية (Dashboard)
  /// يركز على آخر درس توقف عنده الطالب مع نسبة المشاهدة
  Future<Map<String, dynamic>> fetchDashboard() async {
    final headers = await _getHeaders();
    final url = Uri.parse(ApiConfig.dashboardEndpoint);
    final response = await http.get(url, headers: headers).timeout(ApiConfig.timeout);

    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      if (data['student'] != null) {
        _currentStudent = Student.fromJson(data['student']);
      }
      LastLesson? lastLesson;
      if (data['lastLesson'] != null) {
        lastLesson = LastLesson.fromJson(data['lastLesson']);
      }
      return {
        'student': _currentStudent,
        'lastLesson': lastLesson,
        'enrolledCourses': (data['enrolledCourses'] as List? ?? [])
            .map((c) => CourseSummary.fromJson(c))
            .toList(),
        'recentSubmissions': data['recentSubmissions'] ?? [],
        'stats': data['stats'] ?? {},
      };
    } else {
      throw Exception(data['error'] ?? 'فشل تحميل الصفحة الرئيسية');
    }
  }

  /// جلب قائمة جميع الكورسات
  Future<List<CourseSummary>> fetchCourses() async {
    final headers = await _getHeaders();
    final url = Uri.parse(ApiConfig.coursesEndpoint);
    final response = await http.get(url, headers: headers).timeout(ApiConfig.timeout);

    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return (data['courses'] as List? ?? [])
          .map((c) => CourseSummary.fromJson(c))
          .toList();
    } else {
      throw Exception(data['error'] ?? 'فشل تحميل قائمة الكورسات');
    }
  }

  /// جلب تفاصيل كورس معين ومحتوياته من فصول ودروس وفيديوهات
  Future<Map<String, dynamic>> fetchCourseDetails(String courseId) async {
    final headers = await _getHeaders();
    final url = Uri.parse('${ApiConfig.courseDetailsEndpoint}/$courseId');
    final response = await http.get(url, headers: headers).timeout(ApiConfig.timeout);

    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return data['course'];
    } else {
      throw Exception(data['error'] ?? 'فشل تحميل تفاصيل الكورس');
    }
  }

  /// تحديث موضع مشاهدة الفيديو في قاعدة البيانات
  Future<bool> updateProgress({
    required String courseId,
    required String lessonId,
    required String videoId,
    required int positionSeconds,
    required int durationSeconds,
    bool completed = false,
  }) async {
    try {
      final headers = await _getHeaders();
      final url = Uri.parse(ApiConfig.progressUpdateEndpoint);
      final response = await http.post(
        url,
        headers: headers,
        body: jsonEncode({
          'studentId': _currentStudent?.id,
          'courseId': courseId,
          'lessonId': lessonId,
          'videoId': videoId,
          'positionSeconds': positionSeconds,
          'durationSeconds': durationSeconds,
          'completed': completed,
        }),
      ).timeout(const Duration(seconds: 5));
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  /// إرسال إجابات الامتحان وتصحيحه وحفظ الدرجة في لوحة التحكم فورا
  Future<Map<String, dynamic>> submitExam({
    required String examId,
    required String courseId,
    required Map<String, dynamic> answers,
    required int timeSpentSeconds,
  }) async {
    final headers = await _getHeaders();
    final url = Uri.parse(ApiConfig.examSubmitEndpoint);
    final response = await http.post(
      url,
      headers: headers,
      body: jsonEncode({
        'studentId': _currentStudent?.id,
        'examId': examId,
        'courseId': courseId,
        'answers': answers,
        'timeSpentSeconds': timeSpentSeconds,
      }),
    ).timeout(ApiConfig.timeout);

    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return data;
    } else {
      throw Exception(data['error'] ?? 'فشل إرسال الامتحان');
    }
  }

  /// تسجيل الخروج
  Future<void> logout() async {
    _authToken = null;
    _currentStudent = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('cached_student');
  }
}
