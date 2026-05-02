const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize app FIRST
const app = express();

// Then import routes (after app is defined)
const authRoutes = require('./routes/authRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const adminReplyRoutes = require('./routes/AdminReplyRoutes');
const concernRoutes = require('./routes/concernRoutes'); // Keep this
const notificationRoutes = require('./routes/notificationRoutes');

// Middleware
app.use(express.json());
app.use(cors());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Routes (after middleware)
app.use('/api/auth', authRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin-reply', adminReplyRoutes);
app.use('/api/concerns', concernRoutes); // Move this AFTER app is defined
app.use('/api/notifications', notificationRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
