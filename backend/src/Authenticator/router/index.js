const express = require('express');
const router = express.Router();
const { register, login, me } = require('../controller/authController');
const { authenticate } = require('../middleware/authMiddleware');
const asyncHandler = require('../../middleware/asyncHandler');

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/me', authenticate, asyncHandler(me));

module.exports = router;
