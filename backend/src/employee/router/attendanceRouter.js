const express = require('express');
const router = express.Router();
const controller = require('../controller/attendanceController');
const { authenticate, authorizeRole } = require('../../Authenticator/middleware/authMiddleware');
const asyncHandler = require('../../middleware/asyncHandler');

// Employee endpoints
router.post('/checkin', authenticate, asyncHandler(controller.checkin));
router.post('/checkout', authenticate, asyncHandler(controller.checkout));
router.get('/my-history', authenticate, asyncHandler(controller.myHistory));
router.get('/my-summary', authenticate, asyncHandler(controller.mySummary));
router.get('/today', authenticate, asyncHandler(controller.today));
router.get('/last-7-days', authenticate, asyncHandler(controller.last7Days));

module.exports = router;
