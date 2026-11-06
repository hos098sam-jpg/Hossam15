import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'services/api_service.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/courses_screen.dart';
import 'screens/course_details_screen.dart';
import 'screens/video_player_screen.dart';
import 'screens/exam_screen.dart';
import 'screens/wallet_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiService().init();
  runApp(const QalbAlElmApp());
}

class QalbAlElmApp extends StatelessWidget {
  const QalbAlElmApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isLoggedIn = ApiService().authToken != null;

    return MaterialApp(
      title: 'منصة قلب العلم التعليمية',
      debugShowCheckedModeBanner: false,
      locale: const Locale('ar', 'EG'),
      supportedLocales: const [
        Locale('ar', 'EG'),
      ],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      themeMode: ThemeMode.dark,
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0A0E17),
        primaryColor: const Color(0xFF10B981),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF10B981),
          secondary: Color(0xFF06B6D4),
          surface: Color(0xFF121824),
          background: Color(0xFF0A0E17),
          error: Colors.redAccent,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0F141C),
          elevation: 0,
          centerTitle: false,
        ),
        cardTheme: CardTheme(
          color: const Color(0xFF121824),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      ),
      initialRoute: isLoggedIn ? '/' : '/login',
      onGenerateRoute: (settings) {
        switch (settings.name) {
          case '/':
            return MaterialPageRoute(builder: (_) => const HomeScreen());
          case '/login':
            return MaterialPageRoute(builder: (_) => const LoginScreen());
          case '/courses':
            return MaterialPageRoute(builder: (_) => const CoursesScreen(onlyEnrolled: false));
          case '/my-courses':
            return MaterialPageRoute(builder: (_) => const CoursesScreen(onlyEnrolled: true));
          case '/wallet':
            return MaterialPageRoute(builder: (_) => const WalletScreen());
          case '/course-details':
            final args = settings.arguments as Map<String, dynamic>? ?? {};
            return MaterialPageRoute(
              builder: (_) => CourseDetailsScreen(
                courseId: args['courseId'] ?? '',
                initialTitle: args['title'],
              ),
            );
          case '/video-player':
            final args = settings.arguments as Map<String, dynamic>? ?? {};
            return MaterialPageRoute(
              builder: (_) => VideoPlayerScreen(videoArgs: args),
            );
          case '/exam':
            final args = settings.arguments as Map<String, dynamic>? ?? {};
            return MaterialPageRoute(
              builder: (_) => ExamScreen(examArgs: args),
            );
          default:
            return MaterialPageRoute(builder: (_) => const HomeScreen());
        }
      },
    );
  }
}
