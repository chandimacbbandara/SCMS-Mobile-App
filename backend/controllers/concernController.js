const Concern = require('../models/Concern');
const Student = require('../models/Student');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ALLOWED_CONCERN_TYPES = ['Normal Concern', 'Consulting Support'];
const ALLOWED_STATUSES = ['pending', 'reviewing', 'resolved', 'rejected'];

function isValidText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function removeFileIfExists(filePath) {
  if (!filePath) {
    return;
  }

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Failed to remove file:', filePath, error.message);
  }
}

// Configure multer for medical report uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/medical-reports';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'medical-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
    }
  }
}).single('medicalReport');

// Submit a concern
exports.submitConcern = async (req, res) => {
  console.log('=== CONCERN SUBMISSION STARTED ===');
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  
  upload(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      console.log('After upload - Body:', req.body);
      console.log('After upload - File:', req.file);

      const { concernType, genre, description, studentId, age, gpa, year, gender } = req.body;

      console.log('Parsed data:', { concernType, genre, description, studentId, age, gpa, year, gender });

      const normalizedConcernType = (concernType || 'Normal Concern').trim();
      const normalizedGenre = (genre || '').trim();
      const trimmedDescription = (description || '').trim();

      if (!ALLOWED_CONCERN_TYPES.includes(normalizedConcernType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid concern type',
        });
      }

      // Validate required fields
      if (!normalizedGenre || !trimmedDescription || !studentId) {
        console.log('Missing required fields');
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields: genre, description, or studentId' 
        });
      }

      if (trimmedDescription.length < 10) {
        console.log('Description too short:', trimmedDescription.length);
        return res.status(400).json({ 
          success: false, 
          message: 'Description must be at least 10 characters' 
        });
      }

      if (normalizedConcernType === 'Consulting Support' && normalizedGenre !== 'Medical Concern') {
        return res.status(400).json({
          success: false,
          message: 'Consulting Support concerns must use Medical Concern as the category',
        });
      }

      if (normalizedConcernType === 'Normal Concern' && normalizedGenre === 'Medical Concern') {
        return res.status(400).json({
          success: false,
          message: 'Medical Concern must be submitted as Consulting Support',
        });
      }

      if (normalizedConcernType === 'Consulting Support' && !req.file) {
        return res.status(400).json({
          success: false,
          message: 'Medical report is required for Consulting Support concerns',
        });
      }

      // Verify student exists
      console.log('Looking for student with ID:', studentId);
      const studentExists = await Student.findById(studentId);
      if (!studentExists) {
        console.log('Student not found:', studentId);
        return res.status(404).json({ 
          success: false, 
          message: 'Student not found. Please login again.' 
        });
      }
      console.log('Student found:', studentExists.email);

      // ✅ FIXED: Handle gender properly with default value
      let validGender = null;
      if (gender && gender !== 'null' && gender !== 'undefined') {
        validGender = gender;
      } else if (studentExists.gender) {
        validGender = studentExists.gender;
      } else {
        validGender = 'Prefer not to say';
      }

      const concernData = {
        studentId,
        genre: normalizedGenre,
        concernType: normalizedConcernType,
        description: trimmedDescription,
        age: age ? parseInt(age) : null,
        gpa: gpa ? parseFloat(gpa) : null,
        year: year ? parseInt(year) : null,
        gender: validGender  // ✅ Use the validated gender
      };

      if (req.file) {
        concernData.medicalReport = {
          filename: req.file.filename,
          path: req.file.path,
          mimetype: req.file.mimetype,
          size: req.file.size
        };
        console.log('Medical report attached:', req.file.filename);
      }

      const concern = new Concern(concernData);
      await concern.save();

      console.log('Concern saved successfully with ID:', concern._id);

      res.status(201).json({
        success: true,
        message: 'Concern submitted successfully',
        data: concern
      });
    } catch (error) {
      console.error('Submit concern error details:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Server error occurred while submitting concern'
      });
    }
  });
};

// Get student's concerns
exports.getStudentConcerns = async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log('Fetching concerns for student:', studentId);
    
    const concerns = await Concern.find({ studentId })
      .sort({ createdAt: -1 });
    
    console.log(`Found ${concerns.length} concerns`);
    
    res.json({
      success: true,
      data: concerns
    });
  } catch (error) {
    console.error('Get concerns error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message
    });
  }
};

// Get single concern by ID
exports.getConcernById = async (req, res) => {
  try {
    const { concernId } = req.params;
    console.log('Fetching concern:', concernId);
    
    const concern = await Concern.findById(concernId).populate('studentId', 'firstName lastName email studentId');
    
    if (!concern) {
      console.log('Concern not found:', concernId);
      return res.status(404).json({ 
        success: false, 
        message: 'Concern not found' 
      });
    }

    res.json({
      success: true,
      data: concern
    });
  } catch (error) {
    console.error('Get concern error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message
    });
  }
};

// Get all concerns (admin)
exports.getAllConcerns = async (req, res) => {
  try {
    const { status, concernType, genre } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (concernType) {
      filter.concernType = concernType;
    }

    if (genre) {
      filter.genre = genre;
    }

    if (!concernType && req.user && req.user.role === 'admin') {
      filter.concernType = 'Normal Concern';
    }
    
    console.log('Fetching all concerns with filter:', filter);
    
    const concerns = await Concern.find(filter)
      .populate('studentId', 'firstName lastName email studentId age year gender')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${concerns.length} concerns`);
    
    res.json({
      success: true,
      data: concerns
    });
  } catch (error) {
    console.error('Get all concerns error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message
    });
  }
};

// Delete concern (admin)
exports.deleteConcern = async (req, res) => {
  try {
    const { concernId } = req.params;

    if (!concernId) {
      return res.status(400).json({
        success: false,
        message: 'Concern ID is required',
      });
    }

    const concern = await Concern.findById(concernId);

    if (!concern) {
      return res.status(404).json({
        success: false,
        message: 'Concern not found',
      });
    }

    removeFileIfExists(concern.medicalReport?.path);
    await Concern.findByIdAndDelete(concernId);

    res.json({
      success: true,
      message: 'Concern deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
    });
  }
};

// Reply to concern (admin)
exports.replyToConcern = async (req, res) => {
  try {
    const { concernId } = req.params;
    const { reply } = req.body;

    console.log('Replying to concern:', concernId);
    console.log('Reply:', reply);

    const trimmedReply = reply ? reply.trim() : '';

    if (!trimmedReply) {
      return res.status(400).json({ 
        success: false, 
        message: 'Reply message is required' 
      });
    }

    if (trimmedReply.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Reply message must be at least 10 characters',
      });
    }

    const concern = await Concern.findByIdAndUpdate(
      concernId,
      {
        adminReply: trimmedReply,
        status: 'resolved',
        repliedAt: new Date()
      },
      { new: true }
    );

    if (!concern) {
      console.log('Concern not found for reply:', concernId);
      return res.status(404).json({ 
        success: false, 
        message: 'Concern not found' 
      });
    }

    console.log('Reply added to concern:', concernId);

    res.json({
      success: true,
      message: 'Reply added successfully',
      data: concern
    });
  } catch (error) {
    console.error('Reply error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message
    });
  }
};

// Update reply (admin/consulter)
exports.updateReply = async (req, res) => {
  try {
    const { concernId } = req.params;
    const { reply } = req.body;

    const trimmedReply = reply ? reply.trim() : '';

    if (!trimmedReply) {
      return res.status(400).json({ success: false, message: 'Reply message cannot be empty' });
    }

    if (trimmedReply.length < 10) {
      return res.status(400).json({ success: false, message: 'Reply message must be at least 10 characters' });
    }

    const concern = await Concern.findByIdAndUpdate(
      concernId,
      {
        adminReply: trimmedReply,
        repliedAt: new Date(),
        status: 'resolved'
      },
      { new: true }
    );

    if (!concern) {
      return res.status(404).json({ success: false, message: 'Concern not found' });
    }

    res.json({ success: true, message: 'Reply updated successfully', data: concern });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// Delete reply (admin/consulter)
exports.deleteReply = async (req, res) => {
  try {
    const { concernId } = req.params;

    const concern = await Concern.findByIdAndUpdate(
      concernId,
      {
        $unset: { adminReply: "", repliedAt: "" },
        status: 'pending'
      },
      { new: true }
    );

    if (!concern) {
      return res.status(404).json({ success: false, message: 'Concern not found' });
    }

    res.json({ success: true, message: 'Reply deleted successfully', data: concern });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// Update concern status (admin)
exports.updateConcernStatus = async (req, res) => {
  try {
    const { concernId } = req.params;
    const { status } = req.body;
    
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }

    console.log('Updating concern status:', concernId, 'to:', status);

    const concern = await Concern.findByIdAndUpdate(
      concernId,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!concern) {
      console.log('Concern not found:', concernId);
      return res.status(404).json({ 
        success: false, 
        message: 'Concern not found' 
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: concern
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message
    });
  }
};

// Download medical report
exports.downloadMedicalReport = async (req, res) => {
  try {
    const { concernId } = req.params;
    console.log('Downloading medical report for concern:', concernId);
    
    const concern = await Concern.findById(concernId);

    if (!concern || !concern.medicalReport) {
      console.log('Medical report not found for concern:', concernId);
      return res.status(404).json({ 
        success: false, 
        message: 'Medical report not found' 
      });
    }

    const filePath = concern.medicalReport.path;
    if (!fs.existsSync(filePath)) {
      console.log('File not found on server:', filePath);
      return res.status(404).json({ 
        success: false, 
        message: 'File not found on server' 
      });
    }

    console.log('Sending file:', filePath);
    res.download(filePath);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message
    });
  }
};