const express = require('express');
const router = express.Router();
const controller = require('../../employee/controller/attendanceController');
const { authenticate, authorizeRole } = require('../../Authenticator/middleware/authMiddleware');
const asyncHandler = require('../../middleware/asyncHandler');

// Manager endpoints - require manager role
router.get('/all', authenticate, authorizeRole('manager'), asyncHandler(controller.allAttendances));
router.get('/employee/:id', authenticate, authorizeRole('manager'), asyncHandler(controller.employeeAttendances));
router.get('/summary', authenticate, authorizeRole('manager'), asyncHandler(controller.teamSummary));
router.get('/today-status', authenticate, authorizeRole('manager'), asyncHandler(controller.todayStatus));
router.get('/export', authenticate, authorizeRole('manager'), asyncHandler(controller.exportCsv));

module.exports = router;
    