const express = require('express');
const {
  getMyNotifications,
  markNotificationRead,
  markAllRead,
} = require('../controllers/notificationController');
const { protect, requireStudent } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/my', protect, requireStudent, getMyNotifications);
router.patch('/read-all', protect, requireStudent, markAllRead);
router.patch('/:id/read', protect, requireStudent, markNotificationRead);

module.exports = router;
