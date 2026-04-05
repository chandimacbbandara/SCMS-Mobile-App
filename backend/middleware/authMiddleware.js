const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized: token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
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

module.exports = {
  protect,
};
