const express = require('express');
const router = express.Router();
const { getSystemStats } = require('../controllers/adminController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

router.get('/stats', authMiddleware, roleMiddleware(['admin']), getSystemStats);

module.exports = router;