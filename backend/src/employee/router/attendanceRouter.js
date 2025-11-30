const express = require('express');
const router = express.Router();
const controller = require('../controller/attendanceController');
const { authenticate, authorizeRole } = require('../../authenticator/middleware/authMiddleware');
const asyncHandler = require('../../middleware/asyncHandler');

// Employee endpoints
router.post('/checkin', authenticate, asyncHandler(controller.checkin));
router.post('/checkout', authenticate, asyncHandler(controller.checkout));
router.get('/my-history', authenticate, asyncHandler(controller.myHistory));
router.get('/my-summary', authenticate, asyncHandler(controller.mySummary));
router.get('/today', authenticate, asyncHandler(controller.today));

module.exports = router;
