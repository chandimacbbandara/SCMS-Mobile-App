const mongoose = require('mongoose');

const adminReplySchema = new mongoose.Schema(
    {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
            required: true,
            index: true,
            alias: 'adminid',
        },
        replyMessage: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1200,
            alias: 'reply_message',
        },
        image: {
            type: String,
            default: null,
            alias: 'Image',
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('AdminReply', adminReplySchema);