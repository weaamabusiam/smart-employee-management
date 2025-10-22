import 'dart:async';
import 'dart:isolate';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:permission_handler/permission_handler.dart';

@pragma('vm:entry-point')
void startCallback() {
  FlutterForegroundTask.setTaskHandler(AttendanceTaskHandler());
}

class AttendanceTaskHandler extends TaskHandler {
  Timer? _scanTimer;
  int _eventCount = 0;
  
  static const int SCAN_INTERVAL_SECONDS = 30;
  static const int MIN_REPORT_INTERVAL_SECONDS = 60;
  static const int MAX_FAILED_SCANS_BEFORE_ABSENCE = 2;
  
  bool _lastReportedPresence = false;
  DateTime? _lastReportTime;
  String? _employeeId;
  String? _apiBaseUrl;
  String? _token;
  List<String> _registeredEsp32Devices = [];
  int _consecutiveFailedScans = 0;

  @override
  Future<void> onStart(DateTime timestamp, TaskStarter starter) async {
    print('[ForegroundTask] onStart called at $timestamp');
    await _loadConfiguration();
    print('[ForegroundTask] configuration loaded. employee=$_employeeId api=$_apiBaseUrl');

    _scanTimer = Timer.periodic(
      Duration(seconds: SCAN_INTERVAL_SECONDS),
      (timer) => _performScan(),
    );

    // perform initial scan immediately
    _performScan();
  }

  @override
  void onRepeatEvent(DateTime timestamp) {
    _eventCount++;
  }

  @override
  Future<void> onDestroy(DateTime timestamp) async {
    _scanTimer?.cancel();
  }

  @override
  void onNotificationButtonPressed(String id) {
    if (id == 'stop') {
      FlutterForegroundTask.stopService();
    }
  }

  @override
  void onNotificationPressed() {
    FlutterForegroundTask.launchApp('/');
  }

  Future<void> _loadConfiguration() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _employeeId = prefs.getString('employee_id');
      _token = prefs.getString('auth_token');
      
      final apiIp = prefs.getString('api_ip') ?? '10.0.0.13';
      final apiPort = prefs.getString('api_port') ?? '3000';
      _apiBaseUrl = 'http://$apiIp:$apiPort';
      
      await _loadRegisteredEsp32Devices();
      await _requestPermissions();
      print('[ForegroundTask] Loaded registered ESP32 devices: $_registeredEsp32Devices');
    } catch (e) {
      print('[ForegroundTask] _loadConfiguration error: $e');
    }
  }
  
  Future<void> _loadRegisteredEsp32Devices() async {
    if (_apiBaseUrl == null || _token == null) return;
    
    try {
      final url = '$_apiBaseUrl/api/esp32/devices';
      print('[ForegroundTask] Fetching registered ESP32 devices from $url');
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $_token',
          'Content-Type': 'application/json',
        },
      );

      print('[ForegroundTask] ESP32 devices response status: ${response.statusCode}');
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _registeredEsp32Devices = (data as List)
            .map((device) => device['esp32_id'] as String)
            .where((id) => id != null && id.isNotEmpty)
            .toList();
      }
    } catch (e) {
      print('[ForegroundTask] _loadRegisteredEsp32Devices error: $e');
    }
  }

  Future<void> _requestPermissions() async {
    try {
      print('[ForegroundTask] Requesting permissions...');
      final loc = await Permission.location.request();
      final locAlways = await Permission.locationAlways.request();
      final bt = await Permission.bluetooth.request();
      final btScan = await Permission.bluetoothScan.request();
      final btConnect = await Permission.bluetoothConnect.request();
      print('[ForegroundTask] Permission results - location: $loc, locationAlways: $locAlways, bluetooth: $bt, bluetoothScan: $btScan, bluetoothConnect: $btConnect');
    } catch (e) {
      print('[ForegroundTask] _requestPermissions error: $e');
    }
  }

  Future<void> _performScan() async {
    if (_employeeId == null || _apiBaseUrl == null || _token == null) {
      return;
    }
    
    try {
      print('[ForegroundTask] Performing scan...');
      final isOn = await FlutterBluePlus.isOn;
      print('[ForegroundTask] Bluetooth adapter isOn: $isOn');
      if (!isOn) {
        print('[ForegroundTask] Bluetooth is off - reporting absence if needed');
        if (_shouldReportStatus(false)) {
          await _reportAbsence();
          _lastReportedPresence = false;
          _lastReportTime = DateTime.now();
        }
        return;
      }
      
      bool scanStarted = false;
      int retryCount = 0;
      const maxRetries = 3;
      
      while (!scanStarted && retryCount < maxRetries) {
        try {
          await FlutterBluePlus.startScan(
            timeout: Duration(seconds: 15),
            androidUsesFineLocation: true,
            androidScanMode: AndroidScanMode.lowLatency,
            withServices: [],
          );
          scanStarted = true;
          print('[ForegroundTask] startScan succeeded');
        } catch (e) {
          retryCount++;
          print('[ForegroundTask] startScan error (attempt $retryCount): $e');
          if (retryCount < maxRetries) {
            await Future.delayed(Duration(seconds: 2));
          } else {
            print('[ForegroundTask] startScan failed after $retryCount attempts');
            return;
          }
        }
      }
      
      await Future.delayed(Duration(seconds: 5));
      
      List<ScanResult> scanResults = [];
      try {
        scanResults = await FlutterBluePlus.lastScanResults;
        print('[ForegroundTask] scanResults count: ${scanResults.length}');
      } catch (e) {
        print('[ForegroundTask] error getting lastScanResults: $e');
        return;
      }
      
      final detectedEsp32Devices = <Map<String, dynamic>>[];
      
      for (ScanResult result in scanResults) {
        final deviceName = result.device.platformName;
        if (deviceName.isNotEmpty && _registeredEsp32Devices.contains(deviceName)) {
          detectedEsp32Devices.add({
            'esp32_id': deviceName,
            'rssi': result.rssi,
            'last_seen': DateTime.now().toIso8601String(),
          });
        }
      }
      
      if (detectedEsp32Devices.isNotEmpty) {
        _consecutiveFailedScans = 0;
        print('[ForegroundTask] Detected registered ESP32 devices: $detectedEsp32Devices');
        if (_shouldReportStatus(true)) {
          await _reportPresence(detectedEsp32Devices.first);
          _lastReportedPresence = true;
          _lastReportTime = DateTime.now();
        }
      } else {
        _consecutiveFailedScans++;
        print('[ForegroundTask] No registered ESP32 devices detected. consecutiveFailedScans=$_consecutiveFailedScans');
        
        if (_consecutiveFailedScans >= MAX_FAILED_SCANS_BEFORE_ABSENCE) {
          if (_shouldReportStatus(false)) {
            await _reportAbsence();
            _lastReportedPresence = false;
            _lastReportTime = DateTime.now();
          }
        }
      }
      
      try {
        await FlutterBluePlus.stopScan();
        print('[ForegroundTask] stopScan called');
      } catch (e) {
        print('[ForegroundTask] stopScan error: $e');
      }
    } catch (e) {
      print('[ForegroundTask] _performScan top-level error: $e');
    }
  }

  bool _shouldReportStatus(bool isPresent) {
    if (_lastReportedPresence != isPresent) {
      return true;
    }
    
    if (_lastReportTime != null) {
      final timeSinceLastReport = DateTime.now().difference(_lastReportTime!).inSeconds;
      if (timeSinceLastReport >= MIN_REPORT_INTERVAL_SECONDS) {
        return true;
      }
    } else {
      return true;
    }
    
    return false;
  }

  Future<void> _reportPresence(Map<String, dynamic> device) async {
    if (_apiBaseUrl == null || _token == null || _employeeId == null) return;
    
    try {
      final response = await http.post(
        Uri.parse('$_apiBaseUrl/api/presence'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_token',
        },
        body: json.encode({
          'employee_id': _employeeId,
          'status': 'present',
          'esp32_id': device['esp32_id'],
          'rssi': device['rssi'],
        }),
      );
      print('[ForegroundTask] presence report status: ${response.statusCode}');
    } catch (e) {
      print('[ForegroundTask] _reportPresence error: $e');
    }
  }

  Future<void> _reportAbsence() async {
    if (_apiBaseUrl == null || _token == null || _employeeId == null) return;
    
    try {
      final response = await http.post(
        Uri.parse('$_apiBaseUrl/api/presence'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_token',
        },
        body: json.encode({
          'employee_id': _employeeId,
          'status': 'absent',
        }),
      );
      print('[ForegroundTask] absence report status: ${response.statusCode}');
    } catch (e) {
      print('[ForegroundTask] _reportAbsence error: $e');
    }
  }
}

class ForegroundAttendanceService {
  static Future<bool> startService() async {
    final result = await FlutterForegroundTask.startService(
      notificationTitle: 'Attendance Tracking',
      notificationText: 'Tracking your presence...',
      callback: startCallback,
    );
    
    return result != null;
  }

  static Future<bool> stopService() async {
    final result = await FlutterForegroundTask.stopService();
    return result != null;
  }

  static Future<bool> isServiceRunning() async {
    return await FlutterForegroundTask.isRunningService;
  }

  static Future<bool> isBluetoothEnabled() async {
    try {
      return await FlutterBluePlus.isOn;
    } catch (e) {
      return false;
    }
  }
}
