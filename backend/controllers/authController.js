const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const Student = require('../models/Student');
const { isMailConfigured, sendMail } = require('../utils/mailer');

const registerCodeStore = new Map();

function createToken(studentId) {
  return jwt.sign({ id: studentId }, process.env.JWT_SECRET || 'dev_secret_change_me', {
    expiresIn: '7d',
  });
}

function sanitizeUser(student) {
  return {
    id: student._id,
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email,
    studentId: student.studentId,
    role: student.role,
    studentIdPhoto: student.studentIdPhoto,
  };
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isStrongPassword(password) {
  const value = String(password || '');
  return (
    value.length >= 8
    && /[A-Z]/.test(value)
    && /[a-z]/.test(value)
    && /[0-9]/.test(value)
    && /[^A-Za-z0-9]/.test(value)
  );
}

function makeSixDigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function buildVerificationEmail({ name, code, title, purposeLine }) {
  const displayName = String(name || '').trim() || 'Student';

  return {
    text: [
      `Hello ${displayName},`,
      '',
      purposeLine,
      `Your verification code is: ${code}`,
      'This code expires in 10 minutes.',
      '',
      'If you did not request this, please ignore this email.',
      '',
      'SCMS Team',
    ].join('\n'),
    html: [
      `<p>Hello ${displayName},</p>`,
      `<p>${purposeLine}</p>`,
      `<p><strong>${title}:</strong> <span style="font-size:18px;letter-spacing:2px;">${code}</span></p>`,
      '<p>This code expires in 10 minutes.</p>',
      '<p>If you did not request this, please ignore this email.</p>',
      '<p>SCMS Team</p>',
    ].join(''),
  };
}

async function sendRegisterCode(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const firstName = String(req.body.firstName || '').trim();

    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Email is required' });
    }

    const studentExists = await Student.findOne({ email });
    if (studentExists) {
      return res.status(400).json({ status: 'error', message: 'Email is already registered' });
    }

    if (!isMailConfigured()) {
      return res.status(500).json({
        status: 'error',
        message: 'Email service is not configured. Please contact support.',
      });
    }

    const code = makeSixDigitCode();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    registerCodeStore.set(email, {
      code,
      expiresAt,
      verified: false,
    });

    const emailBody = buildVerificationEmail({
      name: firstName,
      code,
      title: 'Registration Code',
      purposeLine: 'Use this code to verify your SCMS account registration.',
    });

    try {
      await sendMail({
        to: email,
        subject: 'SCMS Registration Verification Code',
        text: emailBody.text,
        html: emailBody.html,
      });
    } catch (mailError) {
      registerCodeStore.delete(email);

      const reason = process.env.NODE_ENV !== 'production'
        ? ` (${mailError.message})`
        : '';

      return res.status(500).json({
        status: 'error',
        message: `Failed to send verification email. Please check SMTP settings and try again.${reason}`,
      });
    }

    const payload = {
      status: 'ok',
      message: 'Verification code sent to your email. Check Inbox, Spam, and Updates folders.',
    };

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to send verification code' });
  }
}

async function verifyRegisterCode(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || '').trim();

    if (!email || !code) {
      return res.status(400).json({ status: 'error', message: 'Email and code are required' });
    }

    const entry = registerCodeStore.get(email);
    if (!entry) {
      return res.status(400).json({ status: 'error', message: 'No verification code found for this email' });
    }

    if (Date.now() > entry.expiresAt) {
      registerCodeStore.delete(email);
      return res.status(400).json({ status: 'error', message: 'Verification code expired. Please request a new one.' });
    }

    if (entry.code !== code) {
      return res.status(400).json({ status: 'error', message: 'Invalid verification code' });
    }

    registerCodeStore.set(email, {
      ...entry,
      verified: true,
    });

    return res.json({ status: 'ok', message: 'Email verified successfully' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to verify code' });
  }
}

async function register(req, res) {
  try {
    const firstName = String(req.body.firstName || '').trim();
    const lastName = String(req.body.lastName || '').trim();
    const email = normalizeEmail(req.body.email);
    const studentId = String(req.body.studentId || '').trim();
    const password = String(req.body.password || '');
    const confirmPassword = String(req.body.confirmPassword || '');

    if (!firstName || !lastName || !email || !studentId || !password || !confirmPassword) {
      return res.status(400).json({ status: 'error', message: 'All required fields must be provided' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ status: 'error', message: 'Password and confirm password do not match' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must include uppercase, lowercase, number, and special character',
      });
    }

    const verificationEntry = registerCodeStore.get(email);
    if (!verificationEntry || !verificationEntry.verified || Date.now() > verificationEntry.expiresAt) {
      return res.status(400).json({
        status: 'error',
        message: 'Please verify your email code before registering',
      });
    }

    const existingUser = await Student.findOne({
      $or: [{ email }, { studentId }],
    });

    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'Email or Student ID already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let studentIdPhoto = null;
    if (req.file) {
      studentIdPhoto = `/uploads/${req.file.filename}`;
    }

    const student = await Student.create({
      firstName,
      lastName,
      email,
      studentId,
      password: hashedPassword,
      studentIdPhoto,
    });

    registerCodeStore.delete(email);

    const token = createToken(student._id);

    return res.status(201).json({
      status: 'ok',
      message: 'Registration successful',
      token,
      user: sanitizeUser(student),
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Registration failed' });
  }
}

async function login(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required' });
    }

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    const passwordMatches = await bcrypt.compare(password, student.password);
    if (!passwordMatches) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    const token = createToken(student._id);

    return res.json({
      status: 'ok',
      message: 'Login successful',
      token,
      user: sanitizeUser(student),
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Login failed' });
  }
}

async function sendForgotCode(req, res) {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Email is required' });
    }

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'No account found for this email' });
    }

    if (!isMailConfigured()) {
      return res.status(500).json({
        status: 'error',
        message: 'Email service is not configured. Please contact support.',
      });
    }

    const code = makeSixDigitCode();

    student.forgotCode = code;
    student.forgotCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    student.forgotCodeVerified = false;
    await student.save();

    const emailBody = buildVerificationEmail({
      name: student.firstName,
      code,
      title: 'Reset Code',
      purposeLine: 'Use this code to reset your SCMS account password.',
    });

    try {
      await sendMail({
        to: email,
        subject: 'SCMS Password Reset Code',
        text: emailBody.text,
        html: emailBody.html,
      });
    } catch (mailError) {
      student.forgotCode = null;
      student.forgotCodeExpiresAt = null;
      student.forgotCodeVerified = false;
      await student.save();

      const reason = process.env.NODE_ENV !== 'production'
        ? ` (${mailError.message})`
        : '';

      return res.status(500).json({
        status: 'error',
        message: `Failed to send reset email. Please check SMTP settings and try again.${reason}`,
      });
    }

    const payload = {
      status: 'ok',
      message: 'Reset code sent to your email. Check Inbox, Spam, and Updates folders.',
    };

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to send reset code' });
  }
}

async function verifyForgotCode(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || '').trim();

    if (!email || !code) {
      return res.status(400).json({ status: 'error', message: 'Email and code are required' });
    }

    const student = await Student.findOne({ email });
    if (!student || !student.forgotCode) {
      return res.status(400).json({ status: 'error', message: 'Reset code not found. Please request a new code.' });
    }

    if (!student.forgotCodeExpiresAt || Date.now() > new Date(student.forgotCodeExpiresAt).getTime()) {
      student.forgotCode = null;
      student.forgotCodeExpiresAt = null;
      student.forgotCodeVerified = false;
      await student.save();
      return res.status(400).json({ status: 'error', message: 'Reset code expired. Please request a new code.' });
    }

    if (student.forgotCode !== code) {
      return res.status(400).json({ status: 'error', message: 'Invalid reset code' });
    }

    student.forgotCodeVerified = true;
    await student.save();

    return res.json({ status: 'ok', message: 'Code verified successfully' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to verify reset code' });
  }
}

async function resetForgotPassword(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const newPassword = String(req.body.newPassword || '');
    const confirmPassword = String(req.body.confirmPassword || '');

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ status: 'error', message: 'Email and new password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ status: 'error', message: 'Password and confirm password do not match' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must include uppercase, lowercase, number, and special character',
      });
    }

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'No account found for this email' });
    }

    if (!student.forgotCodeVerified) {
      return res.status(400).json({ status: 'error', message: 'Please verify your reset code first' });
    }

    if (!student.forgotCodeExpiresAt || Date.now() > new Date(student.forgotCodeExpiresAt).getTime()) {
      return res.status(400).json({ status: 'error', message: 'Reset session expired. Please request a new code.' });
    }

    student.password = await bcrypt.hash(newPassword, 10);
    student.forgotCode = null;
    student.forgotCodeExpiresAt = null;
    student.forgotCodeVerified = false;
    await student.save();

    return res.json({ status: 'ok', message: 'Password reset successful' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to reset password' });
  }
}

async function getMe(req, res) {
  return res.json({
    status: 'ok',
    user: req.user,
  });
}

function uploadStudentPhoto(req, res, next) {
  if (!req.file) {
    return next();
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const mimeType = String(req.file.mimetype || '').toLowerCase();
  const allowedExt = ['.jpg', '.jpeg', '.png', '.webp'];
  const allowedMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const hasValidExt = allowedExt.includes(ext);
  const hasValidMime = allowedMime.includes(mimeType);

  if (!hasValidExt && !hasValidMime) {
    return res.status(400).json({ status: 'error', message: 'Invalid image format' });
  }

  return next();
}

module.exports = {
  sendRegisterCode,
  verifyRegisterCode,
  register,
  login,
  sendForgotCode,
  verifyForgotCode,
  resetForgotPassword,
  getMe,
  uploadStudentPhoto,
};
