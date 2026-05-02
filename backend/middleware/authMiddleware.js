const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const Consulter = require('../models/Consulter');

const OWNER_EMAIL = 'admin@akbinstitute.edu.lk';

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

function sanitizeAdminUser(admin) {
  return {
    id: admin._id,
    email: admin.email,
    username: admin.username,
    role: admin.role || 'admin',
    createdAt: admin.createdAt,
  };
}

function sanitizeConsulterUser(consulter) {
  return {
    id: consulter._id,
    email: consulter.email,
    username: consulter.username,
    role: consulter.role || 'consulter',
    createdAt: consulter.createdAt,
  };
}

async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: token missing' });
    }

    // Use the same JWT secret consistently
    const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secure_jwt_secret_key_2024';
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      console.error('JWT Verification failed:', jwtError.message);
      return res.status(401).json({ success: false, message: 'Unauthorized: invalid or expired token' });
    }

    // Handle owner role
    if (decoded.role === 'owner') {
      req.user = getOwnerUser();
      return next();
    }

    // Handle admin role
    if (decoded.role === 'admin') {
      const admin = await Admin.findById(decoded.id).select('-password');
      if (!admin) {
        return res.status(401).json({ success: false, message: 'Unauthorized: admin not found' });
      }
      req.user = sanitizeAdminUser(admin);
      return next();
    }

    // Handle consulter role
    if (decoded.role === 'consulter') {
      const consulter = await Consulter.findById(decoded.id).select('-password');
      if (!consulter) {
        return res.status(401).json({ success: false, message: 'Unauthorized: consulter not found' });
      }
      req.user = sanitizeConsulterUser(consulter);
      return next();
    }

    // Handle student role (default)
    const student = await Student.findById(decoded.id).select('-password');
    if (!student) {
      return res.status(401).json({ success: false, message: 'Unauthorized: user not found' });
    }

    req.user = student;
    return next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ success: false, message: 'Unauthorized: authentication failed' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No user found' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Forbidden: ${req.user.role} role not authorized` });
    }
    next();
  };
}

function requireOwner(req, res, next) {
  if (!req.user || req.user.role !== 'owner') {
    return res.status(403).json({ status: 'error', message: 'Forbidden: Owner access required' });
  }
  return next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ status: 'error', message: 'Forbidden: Admin access required' });
  }
  return next();
}

function requireConsulter(req, res, next) {
  if (!req.user || req.user.role !== 'consulter') {
    return res.status(403).json({ status: 'error', message: 'Forbidden: Consulter access required' });
  }
  return next();
}

function requireStudent(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized: No user found' });
  }
  if (req.user.role === 'student' || req.user.studentId) {
    return next();
  }
  return res.status(403).json({ status: 'error', message: 'Forbidden: Student access required' });
}

function requireStaff(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized: Authentication required' });
  }
  const allowedRoles = ['admin', 'owner', 'consulter'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ status: 'error', message: 'Forbidden: Staff access required' });
  }
  return next();
}

module.exports = {
  protect,
  authorize,
  requireOwner,
  requireAdmin,
  requireConsulter,
  requireStudent,
  requireStaff,
};