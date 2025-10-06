import 'package:flutter/material.dart';
import 'attendance_status_screen.dart';
import 'attendance_history_screen.dart';
import 'monthly_presence_screen.dart';
import 'profile_screen.dart';
import 'settings_screen.dart';
import '../services/api_service.dart';

class MainAttendanceScreen extends StatefulWidget {
  final String token;
  final Function onLogout;

  const MainAttendanceScreen({
    Key? key,
    required this.token,
    required this.onLogout,
  }) : super(key: key);

  @override
  _MainAttendanceScreenState createState() => _MainAttendanceScreenState();
}

class _MainAttendanceScreenState extends State<MainAttendanceScreen> {
  int _currentIndex = 0;
  String? _employeeId;
  bool _isLoading = true;

  final List<Widget> _screens = [];

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    try {
      final user = await ApiService.getCurrentUser(widget.token);
      final employeeId = user['employee_id'] ?? user['id']?.toString();
      
      setState(() {
        _employeeId = employeeId;
        _isLoading = false;
      });
      
      _initializeScreens();
    } catch (e) {
      print('Error loading user data: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _initializeScreens() {
    if (_employeeId != null) {
      _screens.clear(); // Clear any existing screens
      _screens.addAll([
        AttendanceStatusScreen(
          token: widget.token,
          employeeId: _employeeId!,
          onLogout: widget.onLogout,
        ),
        AttendanceHistoryScreen(
          token: widget.token,
          onLogout: widget.onLogout,
        ),
        MonthlyPresenceScreen(
          token: widget.token,
          onLogout: widget.onLogout,
        ),
        ProfileScreen(
          token: widget.token,
          onLogout: widget.onLogout,
        ),
        SettingsScreen(
          token: widget.token,
          onLogout: widget.onLogout,
        ),
      ]);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (_screens.isEmpty) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error, size: 64, color: Colors.red.shade400),
                const SizedBox(height: 16),
                Text(
                  'Failed to load user data',
                  style: TextStyle(fontSize: 18, color: Colors.red.shade600),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Your session may have expired',
                  style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () {
                    setState(() {
                      _isLoading = true;
                    });
                    _loadUserData();
                  },
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retry'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  ),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: () async {
                    // Clear token and logout
                    await ApiService.clearToken();
                    widget.onLogout();
                  },
                  icon: const Icon(Icons.logout),
                  label: const Text('Clear Data & Login Again'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    foregroundColor: Colors.orange,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.white,
        selectedItemColor: Colors.blue.shade600,
        unselectedItemColor: Colors.grey.shade400,
            items: const [
              BottomNavigationBarItem(
                icon: Icon(Icons.home),
                label: 'Status',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.history),
                label: 'History',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.calendar_month),
                label: 'Monthly',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.person),
                label: 'Profile',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.settings),
                label: 'Settings',
              ),
            ],
      ),
    );
  }
}
