import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class VideoPlayerScreen extends StatefulWidget {
  final Map<String, dynamic> videoArgs;

  const VideoPlayerScreen({Key? key, required this.videoArgs}) : super(key: key);

  @override
  State<VideoPlayerScreen> createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends State<VideoPlayerScreen> {
  late int _currentPosition;
  late int _duration;
  bool _isPlaying = true;
  double _playbackSpeed = 1.0;
  Timer? _progressTimer;

  @override
  void initState() {
    super.initState();
    _currentPosition = widget.videoArgs['startPositionSeconds'] ?? 0;
    _duration = widget.videoArgs['durationSeconds'] ?? 1800;

    // Periodically update progress every 10 seconds to sync with web database
    _progressTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      if (_isPlaying) {
        _syncProgress();
      }
    });
  }

  @override
  void dispose() {
    _syncProgress(completed: _currentPosition >= (_duration * 0.9));
    _progressTimer?.cancel();
    super.dispose();
  }

  void _syncProgress({bool completed = false}) {
    ApiService().updateProgress(
      courseId: widget.videoArgs['courseId'] ?? '',
      lessonId: widget.videoArgs['lessonId'] ?? '',
      videoId: widget.videoArgs['videoId'] ?? '',
      positionSeconds: _currentPosition,
      durationSeconds: _duration,
      completed: completed,
    );
  }

  String _formatTime(int seconds) {
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final videoTitle = widget.videoArgs['videoTitle'] ?? 'فيديو الدرس';
    final courseTitle = widget.videoArgs['courseTitle'] ?? '';
    final lessonTitle = widget.videoArgs['lessonTitle'] ?? '';

    return Scaffold(
      backgroundColor: const Color(0xFF0A0E17),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F141C),
        elevation: 0,
        title: Text(
          videoTitle,
          style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
        ),
      ),
      body: Column(
        children: [
          // Simulated Player Viewport
          Container(
            width: double.infinity,
            height: 230,
            color: Colors.black,
            child: Stack(
              alignment: Alignment.center,
              children: [
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        _isPlaying ? Icons.pause_circle_filled_rounded : Icons.play_circle_fill_rounded,
                        size: 64,
                        color: const Color(0xFF10B981),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _isPlaying ? 'جارِ التشغيل المباشر...' : 'متوقف مؤقتاً',
                        style: const TextStyle(color: Colors.white70, fontSize: 13),
                      ),
                    ],
                  ),
                ),
                // Controls Bar at Bottom
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.black.withOpacity(0.8), Colors.transparent],
                        begin: Alignment.bottomCenter,
                        end: Alignment.topCenter,
                      ),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Slider(
                          value: _currentPosition.toDouble().clamp(0.0, _duration.toDouble()),
                          max: _duration.toDouble(),
                          activeColor: const Color(0xFF10B981),
                          inactiveColor: Colors.grey[800],
                          onChanged: (val) {
                            setState(() {
                              _currentPosition = val.toInt();
                            });
                          },
                          onChangeEnd: (_) => _syncProgress(),
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              _formatTime(_currentPosition),
                              style: const TextStyle(color: Colors.white, fontSize: 12),
                            ),
                            Row(
                              children: [
                                IconButton(
                                  icon: Icon(
                                    _isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                                    color: Colors.white,
                                  ),
                                  onPressed: () {
                                    setState(() => _isPlaying = !_isPlaying);
                                    _syncProgress();
                                  },
                                ),
                                DropdownButton<double>(
                                  value: _playbackSpeed,
                                  dropdownColor: const Color(0xFF1F2937),
                                  underline: const SizedBox.shrink(),
                                  style: const TextStyle(color: Colors.white, fontSize: 12),
                                  items: [1.0, 1.25, 1.5, 2.0]
                                      .map((s) => DropdownMenuItem(value: s, child: Text('${s}x')))
                                      .toList(),
                                  onChanged: (val) {
                                    if (val != null) setState(() => _playbackSpeed = val);
                                  },
                                ),
                              ],
                            ),
                            Text(
                              _formatTime(_duration),
                              style: const TextStyle(color: Colors.white, fontSize: 12),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Lesson Details & Sync Indicator
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Sync Status Badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(Icons.cloud_done_rounded, size: 16, color: Color(0xFF10B981)),
                        SizedBox(width: 6),
                        Text(
                          'يتم مزامنة موضع المشاهدة تلقائياً مع خادم وقاعدة بيانات المنصة',
                          style: TextStyle(color: Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  Text(
                    videoTitle,
                    style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '$courseTitle • $lessonTitle',
                    style: TextStyle(color: Colors.grey[400], fontSize: 13),
                  ),

                  const Divider(color: Color(0xFF1F2937), height: 32),

                  const Text(
                    'ملاحظات المحاضرة',
                    style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF121824),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF1F2937)),
                    ),
                    child: Text(
                      'أهلاً بك في المحاضرة. يمكنك تدوين الملاحظات والمتابعة من حيث توقفت في أي وقت ومن أي جهاز متصل.',
                      style: TextStyle(color: Colors.grey[300], fontSize: 13, height: 1.5),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
