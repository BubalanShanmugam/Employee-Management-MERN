const express = require('express');
const router = express.Router();
const { authenticate, authorizeRole } = require('../../authenticator/middleware/authMiddleware');
const controller = require('../controller/dashboardController');

router.get('/employee', authenticate, controller.employeeStats);
router.get('/manager', authenticate, authorizeRole('manager'), controller.managerStats);

module.exports = router;
