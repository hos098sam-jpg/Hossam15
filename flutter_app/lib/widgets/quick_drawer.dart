import 'package:flutter/material.dart';
import '../services/api_service.dart';

class QuickDrawer extends StatelessWidget {
  const QuickDrawer({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final student = ApiService().currentStudent;
    final theme = Theme.of(context);

    return Drawer(
      backgroundColor: const Color(0xFF0F141C),
      child: SafeArea(
        child: Column(
          children: [
            // Student Profile Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
              decoration: const BoxDecoration(
                border: Border(
                  bottom: BorderSide(color: Color(0xFF1F2937), width: 1),
                ),
                gradient: LinearGradient(
                  colors: [Color(0xFF161E2E), Color(0xFF0F141C)],
                  begin: Alignment.topRight,
                  end: Alignment.bottomLeft,
                ),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: const Color(0xFF10B981).withOpacity(0.2),
                    child: const Icon(
                      Icons.person_rounded,
                      size: 32,
                      color: Color(0xFF10B981),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          student?.name ?? 'طالب منصة قلب العلم',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          student?.schoolYear ?? 'الصف الثالث الثانوي',
                          style: TextStyle(
                            color: Colors.grey[400],
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF59E0B).withOpacity(0.15),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.4)),
                          ),
                          child: Text(
                            'الرصيد: ${student?.walletBalance ?? 0} ج.م',
                            style: const TextStyle(
                              color: Color(0xFFFBBF24),
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Navigation Links
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                children: [
                  _buildDrawerItem(
                    context,
                    icon: Icons.home_rounded,
                    title: 'الرئيسية (متابعة الدروس)',
                    route: '/',
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.play_lesson_rounded,
                    title: 'كورساتي المفعلة',
                    route: '/my-courses',
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.menu_book_rounded,
                    title: 'جميع الكورسات والمحاضرات',
                    route: '/courses',
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.assignment_turned_in_rounded,
                    title: 'الامتحانات والنتائج الفورية',
                    route: '/exams',
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.account_balance_wallet_rounded,
                    title: 'محفظتي وشحن الأكواد',
                    route: '/wallet',
                  ),
                  const Divider(color: Color(0xFF1F2937), height: 28),
                  _buildDrawerItem(
                    context,
                    icon: Icons.support_agent_rounded,
                    title: 'الدعم الفني واستفسارات المعلمين',
                    subtitle: 'تواصل مباشر عبر الواتساب',
                    iconColor: const Color(0xFF25D366),
                    onTap: () {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('فتح محادثة واتساب الدعم الفني: 01040672314'),
                          backgroundColor: Color(0xFF10B981),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),

            // Footer & Logout
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: Color(0xFF1F2937))),
              ),
              child: InkWell(
                onTap: () async {
                  await ApiService().logout();
                  if (context.mounted) {
                    Navigator.pushReplacementNamed(context, '/login');
                  }
                },
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 14),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.red.withOpacity(0.3)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.logout_rounded, color: Colors.redAccent, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'تسجيل الخروج من الحساب',
                        style: TextStyle(
                          color: Colors.redAccent,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawerItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    String? subtitle,
    String? route,
    Color? iconColor,
    VoidCallback? onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
      ),
      child: ListTile(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        leading: Icon(
          icon,
          color: iconColor ?? const Color(0xFF10B981),
          size: 24,
        ),
        title: Text(
          title,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
        subtitle: subtitle != null
            ? Text(
                subtitle,
                style: TextStyle(color: Colors.grey[500], fontSize: 11),
              )
            : null,
        onTap: onTap ??
            () {
              Navigator.pop(context);
              if (route != null) {
                Navigator.pushNamed(context, route);
              }
            },
      ),
    );
  }
}
