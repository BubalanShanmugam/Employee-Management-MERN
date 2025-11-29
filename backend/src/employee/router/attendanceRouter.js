const express = require('express');
const router = express.Router();
const controller = require('../controller/attendanceController');
const { authenticate, authorizeRole } = require('../../authenticator/middleware/authMiddleware');

// Employee endpoints
router.post('/checkin', authenticate, controller.checkin);
router.post('/checkout', authenticate, controller.checkout);
router.get('/my-history', authenticate, controller.myHistory);
router.get('/my-summary', authenticate, controller.mySummary);
router.get('/today', authenticate, controller.today);

module.exports = router;
