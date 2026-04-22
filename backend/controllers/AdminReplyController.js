const AdminReply = require('../models/AdminReply');

// Create a new admin reply
const submitReply = async (req, res) => {
    const { replyMessage, image } = req.body;

    const adminId = req.user?.id || req.user?._id || req.admin?._id;
    if (!adminId) {
        return res.status(401).send({ message: 'Unauthorized admin user' });
    }

    if (!String(replyMessage || '').trim()) {
        return res.status(400).send({ message: 'replyMessage is required' });
    }

    try {
        const adminReply = new AdminReply({
            adminId,
            replyMessage,
            image,
        });

        await adminReply.save();
        return res.status(201).send({ message: 'Reply submitted successfully', adminReply });
    } catch (err) {
        return res.status(500).send({ message: 'Unable to submit reply' });
    }
}

const deleteReply = async (req, res) => {
    const adminId = req.user?.id || req.user?._id || req.admin?._id;
    if (!adminId) {
        return res.status(401).send({ message: 'Unauthorized admin user' });
    }

    try {
        const adminReply = await AdminReply.findByIdAndDelete(req.params.id);

        if (!adminReply) {
            return res.status(404).send({ message: 'Reply not found' });
        }

        return res.status(200).send({ message: 'Reply deleted successfully', adminReply });
    } catch (err) {
        return res.status(500).send({ message: 'Unable to delete reply' });
    }
};

exports.submitReply = submitReply;
exports.deleteReply = deleteReply;