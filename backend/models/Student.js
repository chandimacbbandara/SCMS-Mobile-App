const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    studentIdPhoto: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      default: 'student',
    },
    // ✅ ADD THESE NEW FIELDS FOR CONCERN SUBMISSION
    age: {
      type: Number,
      min: 16,
      max: 100,
      default: null,
    },
    gpa: {
      type: Number,
      min: 0,
      max: 4.0,
      default: null,
    },
    year: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    gender: {
      type: String,
      enum: ['M', 'F', 'Other', 'Prefer not to say'],
      default: null,
    },
    // Optional: Track concerns submitted by student
    concerns: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Concern'
    }],
    forgotCode: {
      type: String,
      default: null,
    },
    forgotCodeExpiresAt: {
      type: Date,
      default: null,
    },
    forgotCodeVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create an index for better query performance
studentSchema.index({ studentId: 1 });
studentSchema.index({ email: 1 });

module.exports = mongoose.model('Student', studentSchema);