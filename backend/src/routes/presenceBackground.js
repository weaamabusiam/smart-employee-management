const express = require('express');
const router = express.Router();
const presenceBackgroundController = require('../controllers/presenceBackgroundController');
const { authenticateJWT } = require('../middleware/auth');
const { requireDashboardAccess } = require('../middleware/roleBasedAuth');

// All routes require authentication and dashboard access
router.use(authenticateJWT);
router.use(requireDashboardAccess);

// Get background service status
router.get('/status', presenceBackgroundController.getServiceStatus);

// Manually trigger presence update
router.post('/trigger-update', presenceBackgroundController.triggerUpdate);

// Start background service
router.post('/start', presenceBackgroundController.startService);

// Stop background service
router.post('/stop', presenceBackgroundController.stopService);

module.exports = router;
