const Feedback = require('../models/Feedback');

function sanitizeFeedback(feedback) {
  return {
    id: feedback._id,
    rating: feedback.rating,
    comment: feedback.comment,
    createdAt: feedback.createdAt,
    studentName: feedback.studentName,
    studentEmail: feedback.studentEmail,
    studentId: feedback.studentId,
  };
}

function validateRating(rating) {
  const parsed = Number(rating);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
    return null;
  }

  return parsed;
}

async function submitOverallFeedback(req, res) {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ status: 'error', message: 'Only students can submit feedback' });
    }

    const rating = validateRating(req.body.rating);
    const comment = String(req.body.comment || '').trim();

    if (!rating) {
      return res.status(400).json({ status: 'error', message: 'Rating must be an integer between 1 and 5' });
    }

    if (comment.length < 5) {
      return res.status(400).json({ status: 'error', message: 'Please add at least 5 characters for feedback comment' });
    }

    if (comment.length > 1200) {
      return res.status(400).json({ status: 'error', message: 'Feedback comment must be 1200 characters or less' });
    }

    const firstName = String(req.user.firstName || '').trim();
    const lastName = String(req.user.lastName || '').trim();
    const studentName = `${firstName}${lastName ? ` ${lastName}` : ''}`.trim() || 'Student';

    const feedback = await Feedback.create({
      student: req.user._id || req.user.id,
      studentName,
      studentEmail: String(req.user.email || '').trim().toLowerCase(),
      studentId: String(req.user.studentId || '').trim(),
      rating,
      comment,
    });

    return res.status(201).json({
      status: 'ok',
      message: 'Feedback submitted successfully',
      feedback: sanitizeFeedback(feedback),
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to submit feedback' });
  }
}

async function getMyFeedback(req, res) {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ status: 'error', message: 'Only students can access feedback history' });
    }

    const feedbackList = await Feedback.find({ student: req.user._id || req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.json({
      status: 'ok',
      feedback: feedbackList.map((entry) => sanitizeFeedback(entry)),
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to load feedback history' });
  }
}

module.exports = {
  submitOverallFeedback,
  getMyFeedback,
};
