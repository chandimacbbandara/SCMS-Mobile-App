const express = require('express');
const router = express.Router();
const concernController = require('../controllers/concernController');
const { protect, requireStaff } = require('../middleware/authMiddleware');

// All routes require authentication
// Student routes
router.post('/submit', protect, concernController.submitConcern);
router.get('/my-concerns/:studentId', protect, concernController.getStudentConcerns);
router.get('/my-concerns/detail/:concernId', protect, concernController.getConcernById);

// Admin routes (add proper authorization when needed)
router.get('/all', protect, requireStaff, concernController.getAllConcerns);
router.post('/reply/:concernId', protect, requireStaff, concernController.replyToConcern);
router.put('/reply/:concernId', protect, requireStaff, concernController.updateReply);
router.delete('/reply/:concernId', protect, requireStaff, concernController.deleteReply);
router.put('/status/:concernId', protect, requireStaff, concernController.updateConcernStatus);
router.delete('/:concernId', protect, requireStaff, concernController.deleteConcern);
router.get('/download/:concernId', protect, requireStaff, concernController.downloadMedicalReport);

module.exports = router;