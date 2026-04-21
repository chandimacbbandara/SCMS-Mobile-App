const mongoose = require('mongoose');

const consulterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'consulter',
    },
    createdBy: {
      type: String,
      default: 'owner',
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Consulter', consulterSchema);
