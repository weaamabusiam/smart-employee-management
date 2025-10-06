const express = require('express');
const router = express.Router();
const esp32Controller = require('../controllers/esp32Controller');
const { authenticateJWT } = require('../middleware/auth');
const { requireDashboardAccess } = require('../middleware/roleBasedAuth');

// ESP32 sends scan results (no auth required - ESP32 devices)
router.post('/scan', esp32Controller.processScanResults);

// ESP32 beacon heartbeat (no auth required - ESP32 devices)
router.post('/beacon', esp32Controller.beaconHeartbeat);

// Get ESP32 status (no auth required - for monitoring)
router.get('/status', esp32Controller.getStatus);

// Get all ESP32 devices (requires authentication but not dashboard access)
router.use(authenticateJWT);
router.get('/devices', esp32Controller.getDevices);

// Dashboard routes - require authentication and dashboard access
router.use(requireDashboardAccess);

// Register new ESP32 device
router.post('/register', esp32Controller.registerDevice);

// Update ESP32 device
router.put('/devices/:id', esp32Controller.updateDevice);

// Delete ESP32 device
router.delete('/devices/:id', esp32Controller.deleteDevice);

module.exports = router;
