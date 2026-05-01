const express = require('express');
const router = express.Router();
const concernController = require('../controllers/concernController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
// Student routes
router.post('/submit', protect, concernController.submitConcern);
router.get('/my-concerns/:studentId', protect, concernController.getStudentConcerns);
router.get('/my-concerns/detail/:concernId', protect, concernController.getConcernById);

// Admin routes (add proper authorization when needed)
router.get('/all', protect, concernController.getAllConcerns);
router.post('/reply/:concernId', protect, concernController.replyToConcern);
router.put('/reply/:concernId', protect, concernController.updateReply);
router.delete('/reply/:concernId', protect, concernController.deleteReply);
router.put('/status/:concernId', protect, concernController.updateConcernStatus);
router.get('/download/:concernId', protect, concernController.downloadMedicalReport);

module.exports = router;