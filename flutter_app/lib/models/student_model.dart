/// نماذج البيانات لتطبيق منصة قلب العلم للهواتف الذكية

class Student {
  final String id;
  final String name;
  final String phone;
  final String email;
  final String schoolYear;
  final String? division;
  final num walletBalance;
  final List<String> enrolledCourseIds;
  final List<dynamic> examResults;
  final List<String> watchedLessons;

  Student({
    required this.id,
    required this.name,
    required this.phone,
    required this.email,
    required this.schoolYear,
    this.division,
    required this.walletBalance,
    required this.enrolledCourseIds,
    required this.examResults,
    required this.watchedLessons,
  });

  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      id: json['id'] ?? '',
      name: json['name'] ?? 'طالب',
      phone: json['phone'] ?? '',
      email: json['email'] ?? '',
      schoolYear: json['schoolYear'] ?? 'الصف الثالث الثانوي',
      division: json['division'],
      walletBalance: json['walletBalance'] ?? 0,
      enrolledCourseIds: List<String>.from(json['enrolledCourseIds'] ?? []),
      examResults: List<dynamic>.from(json['examResults'] ?? []),
      watchedLessons: List<String>.from(json['watchedLessons'] ?? []),
    );
  }
}

class LastLesson {
  final String courseId;
  final String courseTitle;
  final String subject;
  final String lessonId;
  final String lessonTitle;
  final String videoId;
  final String videoTitle;
  final String videoUrl;
  final String youtubeId;
  final int positionSeconds;
  final int durationSeconds;
  final int progressPercentage;
  final String? thumbnail;

  LastLesson({
    required this.courseId,
    required this.courseTitle,
    required this.subject,
    required this.lessonId,
    required this.lessonTitle,
    required this.videoId,
    required this.videoTitle,
    required this.videoUrl,
    required this.youtubeId,
    required this.positionSeconds,
    required this.durationSeconds,
    required this.progressPercentage,
    this.thumbnail,
  });

  factory LastLesson.fromJson(Map<String, dynamic> json) {
    return LastLesson(
      courseId: json['courseId'] ?? '',
      courseTitle: json['courseTitle'] ?? '',
      subject: json['subject'] ?? '',
      lessonId: json['lessonId'] ?? '',
      lessonTitle: json['lessonTitle'] ?? '',
      videoId: json['videoId'] ?? '',
      videoTitle: json['videoTitle'] ?? '',
      videoUrl: json['videoUrl'] ?? '',
      youtubeId: json['youtubeId'] ?? '',
      positionSeconds: json['positionSeconds'] ?? 0,
      durationSeconds: json['durationSeconds'] ?? 1800,
      progressPercentage: json['progressPercentage'] ?? 0,
      thumbnail: json['thumbnail'],
    );
  }

  String get formattedPosition {
    final m = positionSeconds ~/ 60;
    final s = positionSeconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  String get formattedDuration {
    final m = durationSeconds ~/ 60;
    final s = durationSeconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }
}

class CourseSummary {
  final String id;
  final String title;
  final String subject;
  final String? description;
  final String? grade;
  final num price;
  final bool isFree;
  final bool isEnrolled;
  final String? thumbnail;
  final String teacherName;
  final int lessonsCount;
  final int videosCount;

  CourseSummary({
    required this.id,
    required this.title,
    required this.subject,
    this.description,
    this.grade,
    this.price = 0,
    this.isFree = false,
    this.isEnrolled = false,
    this.thumbnail,
    required this.teacherName,
    this.lessonsCount = 0,
    this.videosCount = 0,
  });

  factory CourseSummary.fromJson(Map<String, dynamic> json) {
    return CourseSummary(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      subject: json['subject'] ?? '',
      description: json['description'],
      grade: json['grade'],
      price: json['price'] ?? 0,
      isFree: json['isFree'] == true,
      isEnrolled: json['isEnrolled'] == true,
      thumbnail: json['thumbnail'],
      teacherName: json['teacherName'] ?? 'إدارة المنصة',
      lessonsCount: json['lessonsCount'] ?? 0,
      videosCount: json['videosCount'] ?? 0,
    );
  }
}
