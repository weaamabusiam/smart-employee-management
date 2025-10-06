const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateJWT } = require('../middleware/auth');

// Public routes (for ESP32 and mobile app)
router.post('/', attendanceController.logAttendance);
router.get('/', attendanceController.getAttendanceLogs);

// Protected routes for mobile app
router.get('/my-attendance', authenticateJWT, attendanceController.getMyAttendance);
router.get('/history', authenticateJWT, attendanceController.getAttendanceHistory);
router.get('/monthly-presence', authenticateJWT, attendanceController.getMonthlyPresenceTime);

// Protected routes (for dashboard)
router.get('/employee/:id', authenticateJWT, attendanceController.getEmployeeAttendance);
router.get('/employee/:employee_code/monthly-presence', authenticateJWT, attendanceController.getEmployeeMonthlyPresence);
router.get('/report', authenticateJWT, attendanceController.getAttendanceReport);
router.put('/:id', authenticateJWT, attendanceController.updateAttendanceLog);
router.delete('/:id', authenticateJWT, attendanceController.deleteAttendanceLog);

module.exports = router;

