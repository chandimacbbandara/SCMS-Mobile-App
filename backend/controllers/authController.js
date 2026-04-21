const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const Consulter = require('../models/Consulter');
const Feedback = require('../models/Feedback');
const { isMailConfigured, sendMail } = require('../utils/mailer');

const OWNER_EMAIL = 'admin@akbinstitute.edu.lk';
const OWNER_PASSWORD = 'akb@18789691';

const registerCodeStore = new Map();
const adminCreateCodeStore = new Map();

function createToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret_change_me', {
    expiresIn: '7d',
  });
}

function createStudentToken(studentId) {
  return createToken({ id: String(studentId), role: 'student', type: 'student' });
}

function createOwnerToken(email) {
  return createToken({
    id: 'owner',
    role: 'owner',
    type: 'owner',
    email: normalizeEmail(email),
  });
}

function createAdminToken(adminId) {
  return createToken({ id: String(adminId), role: 'admin', type: 'admin' });
}

function createConsulterToken(consulterId) {
  return createToken({ id: String(consulterId), role: 'consulter', type: 'consulter' });
}

function getOwnerUser() {
  return {
    id: 'owner',
    firstName: 'Owner',
    lastName: 'Admin',
    email: OWNER_EMAIL,
    studentId: 'OWNER',
    role: 'owner',
    studentIdPhoto: null,
  };
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

function sanitizeAdmin(admin) {
  return {
    id: admin._id,
    email: admin.email,
    username: admin.username,
    role: admin.role || 'admin',
    createdAt: admin.createdAt,
  };
}

function normalizeAccountRole(role) {
  const value = String(role || '').trim().toLowerCase();
  if (value === 'admin' || value === 'consulter') {
    return value;
  }

  return null;
}

function roleDisplayLabel(role) {
  return role === 'consulter' ? 'Consulter' : 'Admin';
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmailAddress(email) {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(String(email || '').trim());
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

function isStrongAdminPassword(password) {
  const value = String(password || '');
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{12,}$/.test(value);
}

function isValidUsername(username) {
  const value = String(username || '').trim();
  return /^[A-Za-z0-9._-]{3,30}$/.test(value);
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

    const token = createStudentToken(student._id);

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

    if (email === normalizeEmail(OWNER_EMAIL) && password === OWNER_PASSWORD) {
      const ownerUser = getOwnerUser();
      const token = createOwnerToken(ownerUser.email);

      return res.json({
        status: 'ok',
        message: 'Owner login successful',
        token,
        user: ownerUser,
      });
    }

    const admin = await Admin.findOne({ email });
    if (admin) {
      const adminPasswordMatches = await bcrypt.compare(password, admin.password);
      if (!adminPasswordMatches) {
        return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
      }

      const adminToken = createAdminToken(admin._id);

      return res.json({
        status: 'ok',
        message: 'Admin login successful',
        token: adminToken,
        user: sanitizeAdmin(admin),
      });
    }

    const consulter = await Consulter.findOne({ email });
    if (consulter) {
      const consulterPasswordMatches = await bcrypt.compare(password, consulter.password);
      if (!consulterPasswordMatches) {
        return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
      }

      const consulterToken = createConsulterToken(consulter._id);

      return res.json({
        status: 'ok',
        message: 'Consulter login successful',
        token: consulterToken,
        user: sanitizeAdmin(consulter),
      });
    }

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    const passwordMatches = await bcrypt.compare(password, student.password);
    if (!passwordMatches) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    const token = createStudentToken(student._id);

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

async function sendOwnerAdminCode(req, res) {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Email is required' });
    }

    if (!isValidEmailAddress(email)) {
      return res.status(400).json({ status: 'error', message: 'Please enter a valid email address' });
    }

    if (email === normalizeEmail(OWNER_EMAIL)) {
      return res.status(400).json({ status: 'error', message: 'Owner email cannot be used for staff account' });
    }

    const [existingAdmin, existingConsulter, existingStudent] = await Promise.all([
      Admin.findOne({ email }),
      Consulter.findOne({ email }),
      Student.findOne({ email }),
    ]);

    if (existingAdmin || existingConsulter || existingStudent) {
      return res.status(400).json({ status: 'error', message: 'Email is already in use' });
    }

    if (!isMailConfigured()) {
      return res.status(500).json({
        status: 'error',
        message: 'Email service is not configured. Please contact support.',
      });
    }

    const code = makeSixDigitCode();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    adminCreateCodeStore.set(email, {
      code,
      expiresAt,
      verified: false,
    });

    const emailBody = buildVerificationEmail({
      name: 'Staff',
      code,
      title: 'Account Verification Code',
      purposeLine: 'Use this code to verify the account email before account creation.',
    });

    try {
      await sendMail({
        to: email,
        subject: 'SCMS Staff Account Verification Code',
        text: emailBody.text,
        html: emailBody.html,
      });
    } catch (mailError) {
      adminCreateCodeStore.delete(email);

      const reason = process.env.NODE_ENV !== 'production'
        ? ` (${mailError.message})`
        : '';

      return res.status(500).json({
        status: 'error',
        message: `Failed to send verification email. Please check SMTP settings and try again.${reason}`,
      });
    }

    return res.json({
      status: 'ok',
      message: 'Verification code sent to account email. Check Inbox, Spam, and Updates folders.',
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to send account verification code' });
  }
}

async function verifyOwnerAdminCode(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || '').trim();

    if (!email || !code) {
      return res.status(400).json({ status: 'error', message: 'Email and code are required' });
    }

    const entry = adminCreateCodeStore.get(email);
    if (!entry) {
      return res.status(400).json({ status: 'error', message: 'No verification code found for this email' });
    }

    if (Date.now() > entry.expiresAt) {
      adminCreateCodeStore.delete(email);
      return res.status(400).json({ status: 'error', message: 'Verification code expired. Please request a new code.' });
    }

    if (entry.code !== code) {
      return res.status(400).json({ status: 'error', message: 'Invalid verification code' });
    }

    adminCreateCodeStore.set(email, {
      ...entry,
      verified: true,
    });

    return res.json({ status: 'ok', message: 'Account email verified successfully' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to verify account code' });
  }
}

async function createOwnerAdmin(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    const confirmPassword = String(req.body.confirmPassword || '');
    const role = normalizeAccountRole(req.body.role || 'admin');

    if (!email || !username || !password || !confirmPassword) {
      return res.status(400).json({ status: 'error', message: 'Email, username, password and confirm password are required' });
    }

    if (!role) {
      return res.status(400).json({
        status: 'error',
        message: 'Role must be either admin or consulter',
      });
    }

    if (!isValidEmailAddress(email)) {
      return res.status(400).json({ status: 'error', message: 'Please enter a valid email address' });
    }

    if (!isValidUsername(username)) {
      return res.status(400).json({
        status: 'error',
        message: 'Username must be 3-30 chars and contain only letters, numbers, dot, underscore, or hyphen',
      });
    }

    if (!isStrongAdminPassword(password)) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 12 chars and include uppercase, lowercase, number, and special character',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ status: 'error', message: 'Password and confirm password do not match' });
    }

    const verificationEntry = adminCreateCodeStore.get(email);
    if (!verificationEntry || !verificationEntry.verified || Date.now() > verificationEntry.expiresAt) {
      return res.status(400).json({
        status: 'error',
        message: 'Please verify account email code before creating account',
      });
    }

    const [
      existingAdminByEmail,
      existingConsulterByEmail,
      existingAdminByUsername,
      existingConsulterByUsername,
      existingStudentByEmail,
    ] = await Promise.all([
      Admin.findOne({ email }),
      Consulter.findOne({ email }),
      Admin.findOne({ username }),
      Consulter.findOne({ username }),
      Student.findOne({ email }),
    ]);

    if (existingAdminByEmail || existingConsulterByEmail || existingStudentByEmail) {
      return res.status(400).json({ status: 'error', message: 'Email is already in use' });
    }

    if (existingAdminByUsername || existingConsulterByUsername) {
      return res.status(400).json({ status: 'error', message: 'Username is already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const AccountModel = role === 'consulter' ? Consulter : Admin;

    const createdAccount = await AccountModel.create({
      email,
      username,
      password: hashedPassword,
      role,
      createdBy: 'owner',
    });

    const roleLabel = roleDisplayLabel(role);

    adminCreateCodeStore.delete(email);

    return res.status(201).json({
      status: 'ok',
      message: `${roleLabel} account created successfully`,
      admin: sanitizeAdmin(createdAccount),
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to create account' });
  }
}

async function listOwnerAdmins(req, res) {
  try {
    const [admins, consulters] = await Promise.all([
      Admin.find({}).select('-password'),
      Consulter.find({}).select('-password'),
    ]);

    const accounts = [...admins, ...consulters].sort((left, right) => {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });

    return res.json({
      status: 'ok',
      admins: accounts.map((admin) => sanitizeAdmin(admin)),
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to load staff accounts' });
  }
}

async function updateOwnerAdmin(req, res) {
  try {
    const adminId = String(req.params.adminId || '').trim();
    const email = normalizeEmail(req.body.email);
    const username = String(req.body.username || '').trim();
    const newPassword = String(req.body.newPassword || '');
    const confirmPassword = String(req.body.confirmPassword || '');

    if (!adminId) {
      return res.status(400).json({ status: 'error', message: 'Admin ID is required' });
    }

    if (!email || !username) {
      return res.status(400).json({ status: 'error', message: 'Email and username are required' });
    }

    if (!isValidEmailAddress(email)) {
      return res.status(400).json({ status: 'error', message: 'Please enter a valid email address' });
    }

    if (email === normalizeEmail(OWNER_EMAIL)) {
      return res.status(400).json({ status: 'error', message: 'Owner email cannot be used for staff account' });
    }

    if (!isValidUsername(username)) {
      return res.status(400).json({
        status: 'error',
        message: 'Username must be 3-30 chars and contain only letters, numbers, dot, underscore, or hyphen',
      });
    }

    const [foundAdmin, foundConsulter] = await Promise.all([
      Admin.findById(adminId),
      Consulter.findById(adminId),
    ]);

    const admin = foundAdmin || foundConsulter;
    if (!admin) {
      return res.status(404).json({ status: 'error', message: 'Account not found' });
    }

    const AccountModel = foundAdmin ? Admin : Consulter;
    const OtherModel = foundAdmin ? Consulter : Admin;

    const emailChanged = normalizeEmail(admin.email) !== email;
    const usernameChanged = String(admin.username || '').trim() !== username;

    if (emailChanged) {
      const [existingSameTypeByEmail, existingOtherTypeByEmail, existingStudentByEmail] = await Promise.all([
        AccountModel.findOne({ email, _id: { $ne: adminId } }),
        OtherModel.findOne({ email }),
        Student.findOne({ email }),
      ]);

      if (existingSameTypeByEmail || existingOtherTypeByEmail || existingStudentByEmail) {
        return res.status(400).json({ status: 'error', message: 'Email is already in use' });
      }
    }

    if (usernameChanged) {
      const [existingSameTypeByUsername, existingOtherTypeByUsername] = await Promise.all([
        AccountModel.findOne({ username, _id: { $ne: adminId } }),
        OtherModel.findOne({ username }),
      ]);

      if (existingSameTypeByUsername || existingOtherTypeByUsername) {
        return res.status(400).json({ status: 'error', message: 'Username is already in use' });
      }
    }

    const hasPasswordUpdate = Boolean(newPassword || confirmPassword);
    if (hasPasswordUpdate) {
      if (!isStrongAdminPassword(newPassword)) {
        return res.status(400).json({
          status: 'error',
          message: 'Password must be at least 12 chars and include uppercase, lowercase, number, and special character',
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ status: 'error', message: 'Password and confirm password do not match' });
      }

      admin.password = await bcrypt.hash(newPassword, 10);
    }

    admin.email = email;
    admin.username = username;
    await admin.save();

    const roleLabel = roleDisplayLabel(admin.role);

    return res.json({
      status: 'ok',
      message: `${roleLabel} account updated successfully`,
      admin: sanitizeAdmin(admin),
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to update account' });
  }
}

async function deleteOwnerAdmin(req, res) {
  try {
    const adminId = String(req.params.adminId || '').trim();

    if (!adminId) {
      return res.status(400).json({ status: 'error', message: 'Account ID is required' });
    }

    let admin = await Admin.findByIdAndDelete(adminId).select('-password');
    if (!admin) {
      admin = await Consulter.findByIdAndDelete(adminId).select('-password');
    }

    if (!admin) {
      return res.status(404).json({ status: 'error', message: 'Account not found' });
    }

    adminCreateCodeStore.delete(normalizeEmail(admin.email));

    const roleLabel = roleDisplayLabel(admin.role);

    return res.json({
      status: 'ok',
      message: `${roleLabel} account deleted successfully`,
      admin: sanitizeAdmin(admin),
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to delete account' });
  }
}

async function getAdminDashboard(req, res) {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalStudents,
      studentsWithPhoto,
      newStudentsThisMonth,
      totalAdmins,
      recentStudentDocs,
    ] = await Promise.all([
      Student.countDocuments({}),
      Student.countDocuments({ studentIdPhoto: { $nin: [null, ''] } }),
      Student.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Admin.countDocuments({}),
      Student.find({})
        .sort({ createdAt: -1 })
        .limit(8)
        .select('firstName lastName email studentId createdAt'),
    ]);

    const studentsWithoutPhoto = Math.max(totalStudents - studentsWithPhoto, 0);

    const recentStudents = recentStudentDocs.map((student) => ({
      id: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      studentId: student.studentId,
      createdAt: student.createdAt,
    }));

    return res.json({
      status: 'ok',
      dashboard: {
        totalStudents,
        studentsWithPhoto,
        studentsWithoutPhoto,
        newStudentsThisMonth,
        totalAdmins,
        recentStudents,
      },
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to load admin dashboard' });
  }
}

async function getConsulterDashboard(req, res) {
  try {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 6);
    startOfWeek.setHours(0, 0, 0, 0);

    const [
      totalStudents,
      totalFeedback,
      criticalFeedback,
      weeklyFeedback,
      averageFeedbackResult,
      recentFeedbackDocs,
    ] = await Promise.all([
      Student.countDocuments({}),
      Feedback.countDocuments({}),
      Feedback.countDocuments({ rating: { $lte: 2 } }),
      Feedback.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Feedback.aggregate([
        {
          $group: {
            _id: null,
            average: { $avg: '$rating' },
          },
        },
      ]),
      Feedback.find({})
        .sort({ createdAt: -1 })
        .limit(8)
        .select('studentName studentEmail studentId rating comment createdAt'),
    ]);

    const averageRating = Number(averageFeedbackResult?.[0]?.average || 0);
    const recentFeedback = recentFeedbackDocs.map((feedback) => ({
      id: feedback._id,
      studentName: feedback.studentName,
      studentEmail: feedback.studentEmail,
      studentId: feedback.studentId,
      rating: feedback.rating,
      comment: feedback.comment,
      createdAt: feedback.createdAt,
    }));

    return res.json({
      status: 'ok',
      dashboard: {
        totalStudents,
        totalFeedback,
        criticalFeedback,
        weeklyFeedback,
        averageRating: Number(averageRating.toFixed(2)),
        recentFeedback,
      },
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to load consulter dashboard' });
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

async function getOwnerDashboard(req, res) {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalStudents,
      studentsWithPhoto,
      newStudentsThisMonth,
      totalAdmins,
      latestStudentDoc,
    ] = await Promise.all([
      Student.countDocuments({}),
      Student.countDocuments({ studentIdPhoto: { $nin: [null, ''] } }),
      Student.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Admin.countDocuments({}),
      Student.findOne({}).sort({ createdAt: -1 }).select('firstName lastName email studentId role studentIdPhoto createdAt'),
    ]);

    const studentsWithoutPhoto = Math.max(totalStudents - studentsWithPhoto, 0);

    const latestStudent = latestStudentDoc
      ? {
        id: latestStudentDoc._id,
        firstName: latestStudentDoc.firstName,
        lastName: latestStudentDoc.lastName,
        email: latestStudentDoc.email,
        studentId: latestStudentDoc.studentId,
        role: latestStudentDoc.role,
        studentIdPhoto: latestStudentDoc.studentIdPhoto,
        createdAt: latestStudentDoc.createdAt,
      }
      : null;

    return res.json({
      status: 'ok',
      dashboard: {
        totalStudents,
        studentsWithPhoto,
        studentsWithoutPhoto,
        newStudentsThisMonth,
        totalAdmins,
        latestStudent,
      },
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to load owner dashboard' });
  }
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
  sendOwnerAdminCode,
  verifyOwnerAdminCode,
  createOwnerAdmin,
  listOwnerAdmins,
  updateOwnerAdmin,
  deleteOwnerAdmin,
  sendForgotCode,
  verifyForgotCode,
  resetForgotPassword,
  getMe,
  getOwnerDashboard,
  getAdminDashboard,
  getConsulterDashboard,
  uploadStudentPhoto,
};
