const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_jwt_key_attendance_system_2026',
    { expiresIn: '7d' }
  );
};

router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = 'student',
      rollNumber,
      semester,
      section,
      adminSecretKey,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    let assignedRole = 'student';
    if (role === 'admin' || role === 'teacher') {
      const expectedKey = process.env.ADMIN_SECRET_KEY || 'admin123';
      if (!adminSecretKey || adminSecretKey.trim() !== expectedKey) {
        return res.status(403).json({
          message: 'Invalid Admin Secret Key. You cannot register as Teacher/Admin without authorization.',
        });
      }
      assignedRole = 'admin';
    } else {
      if (!rollNumber || !semester || !section) {
        return res.status(400).json({
          message: 'Roll number, semester, and section are required for students',
        });
      }

      const existingRoll = await User.findOne({
        rollNumber: rollNumber.toUpperCase().trim(),
        role: 'student',
      });
      if (existingRoll) {
        return res.status(400).json({ message: 'A student with this roll number already exists' });
      }
    }

    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
      rollNumber: assignedRole === 'student' ? rollNumber.toUpperCase().trim() : undefined,
      semester: assignedRole === 'student' ? Number(semester) : undefined,
      section: assignedRole === 'student' ? section.toUpperCase().trim() : undefined,
    });

    await newUser.save();

    const token = generateToken(newUser._id);

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        rollNumber: newUser.rollNumber,
        semester: newUser.semester,
        section: newUser.section,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: error.message || 'Server error during registration' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.rollNumber,
        semester: user.semester,
        section: user.section,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: error.message || 'Server error during login' });
  }
});

router.get('/me', protect, async (req, res) => {
  return res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      rollNumber: req.user.rollNumber,
      semester: req.user.semester,
      section: req.user.section,
    },
  });
});

module.exports = router;
