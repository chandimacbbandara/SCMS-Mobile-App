const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const {
  sendRegisterCode,
  verifyRegisterCode,
  register,
  login,
  sendForgotCode,
  verifyForgotCode,
  resetForgotPassword,
  getMe,
  getOwnerDashboard,
  uploadStudentPhoto,
} = require('../controllers/authController');
const { protect, requireOwner } = require('../middleware/authMiddleware');

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadsPath = path.join(__dirname, '..', 'uploads');
    fs.mkdirSync(uploadsPath, { recursive: true });
    cb(null, uploadsPath);
  },
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post('/register/send-code', sendRegisterCode);
router.post('/register/verify-code', verifyRegisterCode);
router.post('/register', upload.single('studentIdPhoto'), uploadStudentPhoto, register);

router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/owner/dashboard', protect, requireOwner, getOwnerDashboard);

router.post('/forgot-password/send-code', sendForgotCode);
router.post('/forgot-password/verify-code', verifyForgotCode);
router.post('/forgot-password/reset', resetForgotPassword);

module.exports = router;
