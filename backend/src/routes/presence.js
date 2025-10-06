const express = require('express');
const router = express.Router();
const presenceController = require('../controllers/presenceController');

// Public routes (for mobile app)
router.post('/', presenceController.reportPresence);
router.get('/:employee_id', presenceController.getPresenceStatus);

module.exports = router;