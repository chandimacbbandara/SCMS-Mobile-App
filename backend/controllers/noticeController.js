const Notice = require('../models/Notice');
const Student = require('../models/Student');

// @desc    Get all notices
// @route   GET /api/notices
// @access  Private (Students, Owner, Admins)
exports.getNotices = async (req, res) => {
  try {
    let notices = await Notice.find().sort({ createdAt: -1 }); // Newest first

    if (req.user && (!req.user.role || req.user.role === 'student')) {
      // Find the actual student document to get dismissedNotices
      const student = await Student.findById(req.user._id || req.user.id);
      if (student && student.dismissedNotices) {
        const dismissedIds = student.dismissedNotices.map(id => id.toString());
        notices = notices.filter(n => !dismissedIds.includes(n._id.toString()));
      }
    }

    res.status(200).json({ notices });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching notices', error: error.message });
  }
};

// @desc    Create a new notice
// @route   POST /api/notices
// @access  Private (Owner only)
exports.createNotice = async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Please provide both title and message' });
    }

    const notice = await Notice.create({
      title,
      message,
      createdBy: req.user.id || req.user._id || 'owner',
    });

    res.status(201).json({ message: 'Notice created successfully', notice });
  } catch (error) {
    res.status(500).json({ message: 'Server error creating notice', error: error.message });
  }
};

// @desc    Update a notice
// @route   PATCH /api/notices/:id
// @access  Private (Owner only)
exports.updateNotice = async (req, res) => {
  try {
    const { title, message } = req.body;

    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    if (title) notice.title = title;
    if (message) notice.message = message;

    await notice.save();

    res.status(200).json({ message: 'Notice updated successfully', notice });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating notice', error: error.message });
  }
};

// @desc    Delete a notice
// @route   DELETE /api/notices/:id
// @access  Private (Owner only)
exports.deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    await notice.deleteOne();

    res.status(200).json({ message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting notice', error: error.message });
  }
};

// @desc    Dismiss a notice for a student
// @route   POST /api/notices/:id/dismiss
// @access  Private (Students only)
exports.dismissNotice = async (req, res) => {
  try {
    if (!req.user || (req.user.role && req.user.role !== 'student')) {
      return res.status(403).json({ message: 'Only students can dismiss notices' });
    }

    const student = await Student.findById(req.user._id || req.user.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.dismissedNotices) {
      student.dismissedNotices = [];
    }

    if (!student.dismissedNotices.includes(req.params.id)) {
      student.dismissedNotices.push(req.params.id);
      await student.save();
    }

    res.status(200).json({ message: 'Notice dismissed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error dismissing notice', error: error.message });
  }
};
