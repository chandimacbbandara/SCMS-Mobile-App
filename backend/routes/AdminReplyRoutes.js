const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const { submitReply } = require('../controllers/AdminReplyController');

router.post('/submit', protect, requireAdmin, submitReply);

module.exports = router;
