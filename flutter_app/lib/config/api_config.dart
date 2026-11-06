/// إعدادات الاتصال بواجهات برمجة التطبيقات (API Configuration)
/// منصة قلب العلم التعليمية
class ApiConfig {
  // عنوان خادم المنصة الرئيسي (يمكن تغييره إلى رابط الدومين الفعلي أو عنوان الشبكة المحلية)
  static const String baseUrl = 'http://localhost:3000/api/mobile';
  
  // نقاط الاتصال (Endpoints)
  static const String loginEndpoint = '$baseUrl/login';
  static const String dashboardEndpoint = '$baseUrl/dashboard';
  static const String coursesEndpoint = '$baseUrl/courses';
  static const String courseDetailsEndpoint = '$baseUrl/courses'; // + /:id
  static const String progressUpdateEndpoint = '$baseUrl/progress/update';
  static const String examSubmitEndpoint = '$baseUrl/exams/submit';
  static const String studentSubmissionsEndpoint = '$baseUrl/student/submissions';

  // مهلة الاتصال بالمللي ثانية
  static const Duration timeout = Duration(seconds: 12);
}
