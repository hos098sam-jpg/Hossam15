import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ExamScreen extends StatefulWidget {
  final Map<String, dynamic> examArgs;

  const ExamScreen({Key? key, required this.examArgs}) : super(key: key);

  @override
  State<ExamScreen> createState() => _ExamScreenState();
}

class _ExamScreenState extends State<ExamScreen> {
  late Map<String, dynamic> _exam;
  late List<dynamic> _questions;
  final Map<String, dynamic> _selectedAnswers = {};
  int _currentQuestionIndex = 0;
  bool _isSubmitting = false;
  Map<String, dynamic>? _result;
  int _timeSpentSeconds = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _exam = widget.examArgs['exam'] ?? {};
    _questions = (_exam['questions'] as List? ?? []);

    // Timer counter
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted && _result == null) {
        setState(() => _timeSpentSeconds++);
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _submitExam() async {
    setState(() => _isSubmitting = true);

    try {
      final res = await ApiService().submitExam(
        examId: widget.examArgs['examId'] ?? _exam['id'] ?? 'exam_1',
        courseId: widget.examArgs['courseId'] ?? '',
        answers: _selectedAnswers,
        timeSpentSeconds: _timeSpentSeconds,
      );

      setState(() {
        _result = res;
        _isSubmitting = false;
      });
    } catch (e) {
      setState(() => _isSubmitting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('فشل تسليم الامتحان: ${e.toString()}'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final examTitle = widget.examArgs['examTitle'] ?? _exam['title'] ?? 'اختبار إلكتروني';

    return Scaffold(
      backgroundColor: const Color(0xFF0A0E17),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F141C),
        elevation: 0,
        title: Text(
          examTitle,
          style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
        ),
      ),
      body: _result != null
          ? _buildResultView()
          : _questions.isEmpty
              ? _buildEmptyView()
              : _buildQuizView(),
    );
  }

  Widget _buildEmptyView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: const [
          Icon(Icons.quiz_outlined, size: 48, color: Colors.grey),
          SizedBox(height: 12),
          Text(
            'لا توجد أسئلة مضافة في هذا الامتحان بعد',
            style: TextStyle(color: Colors.white, fontSize: 15),
          ),
        ],
      ),
    );
  }

  Widget _buildQuizView() {
    final currentQ = _questions[_currentQuestionIndex];
    final qId = currentQ['id'] ?? 'q_$_currentQuestionIndex';
    final options = (currentQ['options'] as List? ?? ['الخيار أ', 'الخيار ب', 'الخيار ج', 'الخيار د']);

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Timer and Question Counter
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'سؤال ${_currentQuestionIndex + 1} من ${_questions.length}',
                  style: const TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ),
              Row(
                children: [
                  const Icon(Icons.timer_outlined, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    '${_timeSpentSeconds ~/ 60}:${(_timeSpentSeconds % 60).toString().padLeft(2, '0')}',
                    style: const TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 18),

          // Question Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFF121824),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF1F2937)),
            ),
            child: Text(
              currentQ['question'] ?? currentQ['title'] ?? 'نص السؤال',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
                height: 1.5,
              ),
            ),
          ),

          const SizedBox(height: 20),

          // Options List
          Expanded(
            child: ListView.separated(
              itemCount: options.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, optIdx) {
                final optionText = options[optIdx].toString();
                final isSelected = _selectedAnswers[qId] == optionText || _selectedAnswers[qId] == optIdx;

                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedAnswers[qId] = optionText;
                    });
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFF10B981).withOpacity(0.15) : const Color(0xFF121824),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected ? const Color(0xFF10B981) : const Color(0xFF1F2937),
                        width: isSelected ? 1.5 : 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 12,
                          backgroundColor: isSelected ? const Color(0xFF10B981) : const Color(0xFF1F2937),
                          child: Text(
                            '${optIdx + 1}',
                            style: TextStyle(
                              color: isSelected ? Colors.black : Colors.white70,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            optionText,
                            style: TextStyle(
                              color: isSelected ? Colors.white : Colors.grey[300],
                              fontSize: 14,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Navigation & Submit
          Row(
            children: [
              if (_currentQuestionIndex > 0)
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => setState(() => _currentQuestionIndex--),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: const BorderSide(color: Color(0xFF1F2937)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: const Text('السؤال السابق'),
                  ),
                ),
              if (_currentQuestionIndex > 0) const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  onPressed: _isSubmitting
                      ? null
                      : () {
                          if (_currentQuestionIndex < _questions.length - 1) {
                            setState(() => _currentQuestionIndex++);
                          } else {
                            _submitExam();
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                        )
                      : Text(
                          _currentQuestionIndex < _questions.length - 1 ? 'السؤال التالي' : 'تسليم الامتحان والنتيجة',
                          style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildResultView() {
    final passed = _result!['passed'] == true;
    final score = _result!['score'] ?? 0;
    final total = _result!['totalMarks'] ?? 100;
    final percent = _result!['percentage'] ?? 0;

    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: passed ? const Color(0xFF10B981).withOpacity(0.12) : Colors.red.withOpacity(0.12),
                shape: BoxShape.circle,
                border: Border.all(
                  color: passed ? const Color(0xFF10B981) : Colors.redAccent,
                  width: 2,
                ),
              ),
              child: Icon(
                passed ? Icons.emoji_events_rounded : Icons.info_outline_rounded,
                size: 64,
                color: passed ? const Color(0xFF10B981) : Colors.redAccent,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              passed ? 'أحسنت! تم اجتياز الاختبار بنجاح' : 'انتهى الاختبار، حظ أوفر في المحاولة القادمة',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'تم حفظ درجاتك وإرسالها فوراً إلى لوحة تحكم المعلم وإدارة المنصة.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[400], fontSize: 13),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF121824),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF1F2937)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Column(
                    children: [
                      const Text('الدرجة', style: TextStyle(color: Colors.grey, fontSize: 12)),
                      const SizedBox(height: 4),
                      Text('$score من $total', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  Container(width: 1, height: 40, color: const Color(0xFF1F2937)),
                  Column(
                    children: [
                      const Text('النسبة المئوية', style: TextStyle(color: Colors.grey, fontSize: 12)),
                      const SizedBox(height: 4),
                      Text('$percent%', style: TextStyle(color: passed ? const Color(0xFF10B981) : Colors.redAccent, fontSize: 18, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('العودة للكورس', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
