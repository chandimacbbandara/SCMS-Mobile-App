const express = require('express');
const { getNotices, createNotice, updateNotice, deleteNotice, dismissNotice } = require('../controllers/noticeController');
const { protect, requireOwner } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getNotices);
router.post('/', protect, requireOwner, createNotice);
router.patch('/:id', protect, requireOwner, updateNotice);
router.delete('/:id', protect, requireOwner, deleteNotice);
router.post('/:id/dismiss', protect, dismissNotice);

module.exports = router;
