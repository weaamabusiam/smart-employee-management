import 'package:flutter/material.dart';
import 'screens/login_screen.dart';
import 'screens/main_attendance_screen.dart';
import 'services/api_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  runApp(const AttendanceApp());
}

class AttendanceApp extends StatelessWidget {
  const AttendanceApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Attendance System',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: const AuthWrapper(),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool _isLoggedIn = false;
  String? _token;

  @override
  void initState() {
    super.initState();
    _checkLoginStatus();
  }

  Future<void> _checkLoginStatus() async {
    final token = await ApiService.getStoredToken();
    if (token != null) {
      setState(() {
        _token = token;
        _isLoggedIn = true;
      });
    }
  }

  void _onLogin(String token) {
    setState(() {
      _token = token;
      _isLoggedIn = true;
    });
  }

  void _onLogout() {
    setState(() {
      _token = null;
      _isLoggedIn = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoggedIn && _token != null) {
      return MainAttendanceScreen(
        token: _token!,
        onLogout: _onLogout,
      );
    } else {
      return LoginScreen(onLogin: _onLogin);
    }
  }
}