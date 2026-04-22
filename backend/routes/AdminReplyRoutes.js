const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const { submitReply, deleteReply } = require('../controllers/AdminReplyController');

router.post('/submit', protect, requireAdmin, submitReply);
router.delete('/delete/:id', protect, requireAdmin, deleteReply);

module.exports = router;
