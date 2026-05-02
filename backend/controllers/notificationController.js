const Notification = require('../models/Notification');

exports.getMyNotifications = async (req, res) => {
  try {
    const studentId = req.user?._id;
    if (!studentId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notifications = await Notification.find({ studentId })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const studentId = req.user?._id;
    const { id } = req.params;

    if (!studentId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, studentId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const studentId = req.user?._id;
    if (!studentId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await Notification.updateMany({ studentId, isRead: false }, { isRead: true });

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};
