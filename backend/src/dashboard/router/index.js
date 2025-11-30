const express = require('express');
const router = express.Router();
const { authenticate, authorizeRole } = require('../../Authenticator/middleware/authMiddleware');

const controller = require('../controller/dashboardController');
const asyncHandler = require('../../middleware/asyncHandler');

router.get('/employee', authenticate, asyncHandler(controller.employeeStats));
router.get('/manager', authenticate, authorizeRole('manager'), asyncHandler(controller.managerStats));

module.exports = router;
