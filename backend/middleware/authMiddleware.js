const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

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

async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized: token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');

    if (decoded && (decoded.role === 'owner' || decoded.type === 'owner')) {
      const decodedEmail = String(decoded.email || '').trim().toLowerCase();
      if (decodedEmail && decodedEmail !== OWNER_EMAIL.toLowerCase()) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized: invalid owner token' });
      }

      req.user = getOwnerUser();
      return next();
    }

    const student = await Student.findById(decoded.id).select('-password');

    if (!student) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized: user not found' });
    }

    req.user = student;
    return next();
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized: invalid token' });
  }
}

function requireOwner(req, res, next) {
  if (!req.user || req.user.role !== 'owner') {
    return res.status(403).json({ status: 'error', message: 'Forbidden: owner access required' });
  }

  return next();
}

module.exports = {
  protect,
  requireOwner,
};
