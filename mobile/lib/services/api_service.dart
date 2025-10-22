import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Configurable API settings
  static const String _defaultIp = '10.0.0.13';
  static const String _defaultPort = '3000';
  static const String _apiPath = '/api';
  
  // Get the base URL from settings or use default
  static Future<String> get baseUrl async {
    final prefs = await SharedPreferences.getInstance();
    final ip = prefs.getString('api_ip') ?? _defaultIp;
    final port = prefs.getString('api_port') ?? _defaultPort;
    return 'http://$ip:$port$_apiPath';
  }
  
  // Save API configuration
  static Future<void> setApiConfig(String ip, String port) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('api_ip', ip);
    await prefs.setString('api_port', port);
  }
  
  // Get current API configuration
  static Future<Map<String, String>> getApiConfig() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'ip': prefs.getString('api_ip') ?? _defaultIp,
      'port': prefs.getString('api_port') ?? _defaultPort,
    };
  }

  // Test connection to backend server
  static Future<Map<String, dynamic>> testConnection() async {
    try {
      final url = await baseUrl;
      print('🔍 Testing connection to: $url');
      
      final response = await http.get(
        Uri.parse('$url/../'), // Test root endpoint
      ).timeout(const Duration(seconds: 5));
      
      return {
        'success': true,
        'url': url,
        'statusCode': response.statusCode,
        'message': 'Connection successful'
      };
    } catch (e) {
      print('❌ Connection test failed: $e');
      final url = await baseUrl;
      return {
        'success': false,
        'url': url,
        'error': e.toString(),
        'message': 'Cannot reach server. Check IP address and ensure backend is running.'
      };
    }
  }
  
  static Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final url = await baseUrl;
      print('🔍 API: Logging in to: $url/auth/login');
      
      final response = await http.post(
        Uri.parse('$url/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': username,
          'password': password,
        }),
      );

      print('🔍 API: Login response status: ${response.statusCode}');
      print('🔍 API: Login response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await _storeToken(data['token']);
        
        // Store employee_id from user data for later use
        if (data['user'] != null && data['user']['employee_id'] != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('employee_id', data['user']['employee_id'].toString());
          print('🔍 API: Stored employee_id: ${data['user']['employee_id']}');
        }
        
        return data;
      } else {
        throw Exception('Login failed: ${response.body}');
      }
    } catch (e) {
      print('❌ API: Login error: $e');
      throw Exception('Login error: $e');
    }
  }

  static Future<Map<String, dynamic>> getCurrentUser(String token) async {
    try {
      final url = await baseUrl;
      print('🔍 API: Getting user info from: $url/auth/me');
      print('🔍 API: Token: ${token.substring(0, 20)}...');
      
      final response = await http.get(
        Uri.parse('$url/auth/me'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('🔍 API: Response status: ${response.statusCode}');
      print('🔍 API: Response body: ${response.body}');

      if (response.statusCode == 200) {
        final userData = jsonDecode(response.body);
        print('🔍 API: User data: $userData');
        return userData;
      } else {
        throw Exception('Failed to get user info: ${response.body}');
      }
    } catch (e) {
      print('❌ API: Get user error: $e');
      throw Exception('Get user error: $e');
    }
  }

  static Future<List<dynamic>> getMyAttendance(String token) async {
    try {
      final url = await baseUrl;
      final response = await http.get(
        Uri.parse('$url/attendance/my-attendance'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to get attendance: ${response.body}');
      }
    } catch (e) {
      throw Exception('Get attendance error: $e');
    }
  }

  static Future<void> _storeToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  static Future<String?> getStoredToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  static Future<String?> getStoredEmployeeId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('employee_id');
  }

  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('employee_id');  // Also clear employee_id on logout
  }
  
  // ESP32 Devices API
  static Future<List<dynamic>> getEsp32Devices(String token) async {
    final apiBaseUrl = await baseUrl;
    final response = await http.get(
      Uri.parse('$apiBaseUrl/esp32/devices'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load ESP32 devices: ${response.statusCode}');
    }
  }
  
  // Report presence when ESP32 is detected
  static Future<Map<String, dynamic>> reportPresence(
    String token,
    String employeeId,
    String esp32Id,
    int rssi,
    String timestamp,
  ) async {
    final apiBaseUrl = await baseUrl;
    final response = await http.post(
      Uri.parse('$apiBaseUrl/presence'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'employee_id': employeeId,
        'esp32_id': esp32Id,  // Changed from esp32_mac to esp32_id for clarity
        'rssi': rssi,
        'timestamp': timestamp,
        'source': 'mobile_app',
      }),
    );
    
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to report presence: ${response.statusCode}');
    }
  }
  
  // Get attendance history (last 10 records)
  static Future<List<dynamic>> getAttendanceHistory(String token) async {
    try {
      final apiBaseUrl = await baseUrl;
      print('🔍 API: Getting attendance history from: $apiBaseUrl/attendance/history?limit=10');
      
      final response = await http.get(
        Uri.parse('$apiBaseUrl/attendance/history?limit=10'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      print('🔍 API: History response status: ${response.statusCode}');
      print('🔍 API: History response body: ${response.body}');
      
      if (response.statusCode == 200) {
        final history = json.decode(response.body);
        print('🔍 API: History data: $history');
        return history;
      } else {
        throw Exception('Failed to load attendance history: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ API: History error: $e');
      throw Exception('Failed to load attendance history: $e');
    }
  }

  // Get monthly presence time
  static Future<List<dynamic>> getMonthlyPresenceTime(String token, int year, int month) async {
    try {
      final apiBaseUrl = await baseUrl;
      final response = await http.get(
        Uri.parse('$apiBaseUrl/attendance/monthly-presence?year=$year&month=$month'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to load monthly presence: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Failed to load monthly presence: $e');
    }
  }
}
