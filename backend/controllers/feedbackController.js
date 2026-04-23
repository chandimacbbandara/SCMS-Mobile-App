const Feedback = require('../models/Feedback');

function sanitizeFeedback(feedback) {
  return {
    id: feedback._id,
    rating: feedback.rating,
    comment: feedback.comment,
    createdAt: feedback.createdAt,
    updatedAt: feedback.updatedAt,
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

function getStudentUserId(user) {
  return user?._id || user?.id;
}

function buildStudentIdentity(user) {
  const firstName = String(user?.firstName || '').trim();
  const lastName = String(user?.lastName || '').trim();

  return {
    studentName: `${firstName}${lastName ? ` ${lastName}` : ''}`.trim() || 'Student',
    studentEmail: String(user?.email || '').trim().toLowerCase(),
    studentId: String(user?.studentId || '').trim(),
  };
}

function isDuplicateKeyError(error) {
  return Boolean(error && error.code === 11000);
}

async function submitOverallFeedback(req, res) {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ status: 'error', message: 'Only students can submit feedback' });
    }

    const studentUserId = getStudentUserId(req.user);
    if (!studentUserId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized student user' });
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

    const existingFeedback = await Feedback.findOne({ student: studentUserId }).select('_id');
    if (existingFeedback) {
      return res.status(409).json({
        status: 'error',
        message: 'You have already submitted feedback. Please edit your existing feedback.',
      });
    }

    const studentIdentity = buildStudentIdentity(req.user);

    const feedback = await Feedback.create({
      student: studentUserId,
      studentName: studentIdentity.studentName,
      studentEmail: studentIdentity.studentEmail,
      studentId: studentIdentity.studentId,
      rating,
      comment,
    });

    return res.status(201).json({
      status: 'ok',
      message: 'Feedback submitted successfully',
      feedback: sanitizeFeedback(feedback),
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({
        status: 'error',
        message: 'You have already submitted feedback. Please edit your existing feedback.',
      });
    }

    return res.status(500).json({ status: 'error', message: 'Failed to submit feedback' });
  }
}

async function getMyFeedback(req, res) {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ status: 'error', message: 'Only students can access feedback history' });
    }

    const studentUserId = getStudentUserId(req.user);
    if (!studentUserId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized student user' });
    }

    const feedbackList = await Feedback.find({ student: studentUserId })
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

async function updateMyFeedback(req, res) {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ status: 'error', message: 'Only students can update feedback' });
    }

    const studentUserId = getStudentUserId(req.user);
    if (!studentUserId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized student user' });
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

    const feedback = await Feedback.findOne({ student: studentUserId });
    if (!feedback) {
      return res.status(404).json({ status: 'error', message: 'No feedback found to update' });
    }

    const studentIdentity = buildStudentIdentity(req.user);

    feedback.rating = rating;
    feedback.comment = comment;
    feedback.studentName = studentIdentity.studentName;
    feedback.studentEmail = studentIdentity.studentEmail;
    feedback.studentId = studentIdentity.studentId;

    await feedback.save();

    return res.json({
      status: 'ok',
      message: 'Feedback updated successfully',
      feedback: sanitizeFeedback(feedback),
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to update feedback' });
  }
}

async function deleteMyFeedback(req, res) {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ status: 'error', message: 'Only students can delete feedback' });
    }

    const studentUserId = getStudentUserId(req.user);
    if (!studentUserId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized student user' });
    }

    const deletedFeedback = await Feedback.findOneAndDelete({ student: studentUserId });
    if (!deletedFeedback) {
      return res.status(404).json({ status: 'error', message: 'No feedback found to delete' });
    }

    return res.json({
      status: 'ok',
      message: 'Feedback deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to delete feedback' });
  }
}

module.exports = {
  submitOverallFeedback,
  getMyFeedback,
  updateMyFeedback,
  deleteMyFeedback,
};
