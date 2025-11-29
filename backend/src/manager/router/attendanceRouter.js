const express = require('express');
const router = express.Router();
const controller = require('../../employee/controller/attendanceController');
const { authenticate, authorizeRole } = require('../../authenticator/middleware/authMiddleware');

// Manager endpoints - require manager role
router.get('/all', authenticate, authorizeRole('manager'), controller.allAttendances);
router.get('/employee/:id', authenticate, authorizeRole('manager'), controller.employeeAttendances);
router.get('/summary', authenticate, authorizeRole('manager'), controller.teamSummary);
router.get('/today-status', authenticate, authorizeRole('manager'), controller.todayStatus);

module.exports = router;
