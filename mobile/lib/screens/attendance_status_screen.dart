import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';
import '../services/api_service.dart';
import '../services/foreground_service.dart';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';

class AttendanceStatusScreen extends StatefulWidget {
  final String token;
  final String employeeId;
  final Function onLogout;

  const AttendanceStatusScreen({
    Key? key,
    required this.token,
    required this.employeeId,
    required this.onLogout,
  }) : super(key: key);

  @override
  _AttendanceStatusScreenState createState() => _AttendanceStatusScreenState();
}

class _AttendanceStatusScreenState extends State<AttendanceStatusScreen> {
  bool _isLoading = true;
  bool _bluetoothEnabled = false;
  bool _foregroundServiceRunning = false;
  String _userStatus = 'Unknown';
  String _detectedDevice = 'None';
  int _detectedRSSI = 0;

  @override
  void initState() {
    super.initState();
    _initializeApp();
    _initForegroundService();
    _startPeriodicRefresh();
  }
  
  void _startPeriodicRefresh() {
    // Refresh every 5 seconds to show updated status
    Timer.periodic(Duration(seconds: 5), (timer) {
      if (mounted) {
        _refreshStatus();
      } else {
        timer.cancel();
      }
    });
  }
  
  Future<void> _refreshStatus() async {
    try {
      final attendance = await ApiService.getMyAttendance(widget.token);
      final bluetoothOn = await ForegroundAttendanceService.isBluetoothEnabled();
      
      String userStatus = 'Absent';
      String detectedDevice = 'None';
      int detectedRSSI = 0;
      
      if (attendance.isNotEmpty) {
        final latestRecord = attendance.first;
        if (latestRecord['status'] == 'present') {
          userStatus = 'Present';
          // Get device info from the latest attendance record
          detectedDevice = latestRecord['esp32_id'] ?? 'Unknown';
          detectedRSSI = latestRecord['rssi'] ?? 0;
        }
      }
      
      if (mounted) {
        setState(() {
          _bluetoothEnabled = bluetoothOn;
          _userStatus = userStatus;
          _detectedDevice = detectedDevice;
          _detectedRSSI = detectedRSSI;
        });
      }
    } catch (e) {
      // Handle refresh errors silently
    }
  }
  
  Future<void> _initForegroundService() async {
    final isRunning = await ForegroundAttendanceService.isServiceRunning();
    if (mounted) {
      setState(() {
        _foregroundServiceRunning = isRunning;
      });
    }
  }

  Future<void> _initializeApp() async {
    try {
      // Load user data
      final user = await ApiService.getCurrentUser(widget.token);
      final attendance = await ApiService.getMyAttendance(widget.token);
      final bluetoothOn = await ForegroundAttendanceService.isBluetoothEnabled();
      
      String userStatus = 'Absent';
      String detectedDevice = 'None';
      int detectedRSSI = 0;
      
      if (attendance.isNotEmpty) {
        // Get the latest attendance record
        final latestRecord = attendance.first;
        if (latestRecord['status'] == 'present') {
          userStatus = 'Present';
          // Get device info from the latest attendance record
          detectedDevice = latestRecord['esp32_id'] ?? 'Unknown';
          detectedRSSI = latestRecord['rssi'] ?? 0;
        }
      }

      setState(() {
        _bluetoothEnabled = bluetoothOn;
        _userStatus = userStatus;
        _detectedDevice = detectedDevice;
        _detectedRSSI = detectedRSSI;
        _isLoading = false;
      });

      // Automatically start background service only
      // Check Bluetooth status
      if (bluetoothOn) {
        // Starting background service for continuous tracking
        // Start foreground service automatically - this handles all scanning
        await ForegroundAttendanceService.startService();
        setState(() {
          _foregroundServiceRunning = true;
        });
      } else {
        // Bluetooth not enabled, reporting absence
        // Report absence if Bluetooth is off
        _reportAbsenceDueToBluetoothOff();
      }
    } catch (e) {
      // Handle initialization errors silently
      setState(() {
        _isLoading = false;
      });
    }
  }


  Future<void> _reportAbsenceDueToBluetoothOff() async {
    try {
      final apiBaseUrl = await ApiService.baseUrl;
      // Report absence due to Bluetooth being off
      final response = await http.post(
        Uri.parse('$apiBaseUrl/presence'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'employee_id': widget.employeeId,
          'esp32_id': 'none',
          'rssi': -100,
          'timestamp': DateTime.now().toIso8601String(),
          'source': 'bluetooth_disabled'
        }),
      );
      
      if (response.statusCode == 200) {
        // Absence reported successfully
      }
    } catch (e) {
      // Handle absence report errors silently
    }
  }

  Future<void> _handleLogout() async {
    // Stop background service
    await ForegroundAttendanceService.stopService();
    await ApiService.clearToken();
    widget.onLogout();
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

    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendance Status'),
        backgroundColor: Colors.blue.shade600,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // Bluetooth Status Card
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  color: _bluetoothEnabled ? Colors.blue.shade50 : Colors.red.shade50,
                ),
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: _bluetoothEnabled ? Colors.blue : Colors.red,
                          borderRadius: BorderRadius.circular(50),
                        ),
                        child: Icon(
                          _bluetoothEnabled ? Icons.bluetooth : Icons.bluetooth_disabled,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Bluetooth Status',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Colors.grey.shade700,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _bluetoothEnabled ? 'ON' : 'OFF',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: _bluetoothEnabled ? Colors.blue.shade700 : Colors.red.shade700,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Icon(
                        _bluetoothEnabled ? Icons.check_circle : Icons.cancel,
                        color: _bluetoothEnabled ? Colors.blue : Colors.red,
                        size: 28,
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // User Status Card
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  color: _userStatus == 'Present' 
                    ? Colors.green.shade50
                    : _userStatus == 'Absent'
                    ? Colors.red.shade50
                    : Colors.orange.shade50,
                ),
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: _userStatus == 'Present' ? Colors.green : 
                                 _userStatus == 'Absent' ? Colors.red : Colors.orange,
                          borderRadius: BorderRadius.circular(50),
                        ),
                        child: Icon(
                          _userStatus == 'Present' ? Icons.person : 
                          _userStatus == 'Absent' ? Icons.person_off : Icons.help,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Attendance Status',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Colors.grey.shade700,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _userStatus,
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: _userStatus == 'Present' ? Colors.green.shade700 : 
                                       _userStatus == 'Absent' ? Colors.red.shade700 : Colors.orange.shade700,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _userStatus == 'Present' ? 'You are currently at the office' :
                              _userStatus == 'Absent' ? 'You are not currently at the office' :
                              'Status unknown - check your attendance records',
                              style: TextStyle(
                                fontSize: 12, 
                                color: Colors.grey.shade600,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                            if (_userStatus == 'Present') ...[
                              const SizedBox(height: 8),
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: Colors.green.shade200),
                                ),
                                child: Row(
                                  children: [
                                    Icon(Icons.router, color: Colors.green.shade600, size: 16),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'Detected Device: $_detectedDevice',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Colors.green.shade700,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      Icon(
                        _userStatus == 'Present' ? Icons.check_circle : 
                        _userStatus == 'Absent' ? Icons.cancel : Icons.help,
                        color: _userStatus == 'Present' ? Colors.green : 
                               _userStatus == 'Absent' ? Colors.red : Colors.orange,
                        size: 28,
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
}
