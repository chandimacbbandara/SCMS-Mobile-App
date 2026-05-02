const mongoose = require('mongoose');

const concernSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  genre: {
    type: String,
    required: true
  },
  concernType: {
    type: String,
    enum: ['Consulting Support', 'Normal Concern'],
    default: 'Normal Concern',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  medicalReport: {
    filename: String,
    path: String,
    mimetype: String,
    size: Number
  },
  age: Number,
  mobileNumber: String,
  address: String,
  gender: {
    type: String,
    enum: ['M', 'F', 'Prefer not to say'],
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'resolved', 'rejected'],
    default: 'pending'
  },
  adminReply: String,
  repliedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

concernSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Concern', concernSchema);