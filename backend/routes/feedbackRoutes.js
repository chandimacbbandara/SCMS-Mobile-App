const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  submitOverallFeedback,
  getFeedbackInsights,
  getMyFeedback,
  updateMyFeedback,
  deleteMyFeedback,
} = require('../controllers/feedbackController');

const router = express.Router();

router.use(protect);

router.get('/insights', getFeedbackInsights);
router.get('/mine', getMyFeedback);
router.post('/overall', submitOverallFeedback);
router.put('/mine', updateMyFeedback);
router.delete('/mine', deleteMyFeedback);

module.exports = router;
