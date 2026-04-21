const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { submitOverallFeedback, getMyFeedback } = require('../controllers/feedbackController');

const router = express.Router();

router.use(protect);

router.get('/mine', getMyFeedback);
router.post('/overall', submitOverallFeedback);

module.exports = router;
