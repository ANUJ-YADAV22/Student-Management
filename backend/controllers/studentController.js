const Student = require('../models/Student');

// Helper to find student by either studentId or _id
async function findStudentByIdentifier(id) {
  let student = await Student.findOne({ studentId: id });
  if (!student && id.match(/^[0-9a-fA-F]{24}$/)) {
    student = await Student.findById(id);
  }
  return student;
}

// @desc    Get all students
// @route   GET /api/students
exports.getStudents = async (req, res) => {
  try {
    const { search, department } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { studentId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) {
      query.department = department;
    }

    const students = await Student.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Students retrieved successfully',
      data: students
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve students: ' + (error.message || 'Server error')
    });
  }
};

// @desc    Get student by ID
// @route   GET /api/students/:id
exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await findStudentByIdentifier(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student with ID "${id}" not found`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Student retrieved successfully',
      data: student
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve student: ' + (error.message || 'Server error')
    });
  }
};

// @desc    Create student
// @route   POST /api/students
exports.createStudent = async (req, res) => {
  try {
    const { studentId, name, email, department, semester, contact } = req.body;

    // Server-side validation
    if (!studentId || !name || !email || !department || semester === undefined || semester === null) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: studentId, name, email, department, and semester are required'
      });
    }

    const parsedSemester = Number(semester);
    if (isNaN(parsedSemester) || parsedSemester < 1) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: semester must be a valid positive number'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Please provide a valid email address'
      });
    }

    // Check uniqueness of studentId
    const existing = await Student.findOne({ studentId: studentId.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Student with studentId "${studentId}" already exists`
      });
    }

    const newStudent = await Student.create({
      studentId: studentId.trim(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      department: department.trim(),
      semester: parsedSemester,
      contact: contact ? contact.toString().trim() : ''
    });

    return res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: newStudent
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate key error: Student ID must be unique'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to create student: ' + (error.message || 'Server error')
    });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department, semester, contact } = req.body;

    const student = await findStudentByIdentifier(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student with ID "${id}" not found`
      });
    }

    if (semester !== undefined) {
      const parsedSemester = Number(semester);
      if (isNaN(parsedSemester) || parsedSemester < 1) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed: semester must be a valid positive number'
        });
      }
      student.semester = parsedSemester;
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed: Please provide a valid email address'
        });
      }
      student.email = email.trim().toLowerCase();
    }

    if (name) student.name = name.trim();
    if (department) student.department = department.trim();
    if (contact !== undefined) student.contact = contact.toString().trim();

    const updated = await student.save();

    return res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update student: ' + (error.message || 'Server error')
    });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await findStudentByIdentifier(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student with ID "${id}" not found`
      });
    }

    await Student.deleteOne({ _id: student._id });

    return res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
      data: { studentId: student.studentId }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete student: ' + (error.message || 'Server error')
    });
  }
};
