const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const { protect, requireRole } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { semester } = req.query;
    const filter = {};
    if (semester) {
      filter.semester = Number(semester);
    }
    const subjects = await Subject.find(filter).sort({ semester: 1, name: 1 });
    return res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return res.status(500).json({ message: 'Failed to fetch subjects' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    return res.json(subject);
  } catch (error) {
    console.error('Error fetching subject:', error);
    return res.status(500).json({ message: 'Failed to fetch subject' });
  }
});

router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const { name, code, semester, teacherName } = req.body;

    if (!name || !code || !semester || !teacherName) {
      return res.status(400).json({
        message: 'All fields are required: name, code, semester, and teacherName',
      });
    }

    const trimmedCode = code.toUpperCase().trim();

    const existing = await Subject.findOne({ code: trimmedCode });
    if (existing) {
      return res.status(400).json({
        message: `Subject code '${trimmedCode}' is already registered with '${existing.name}'`,
      });
    }

    const newSubject = new Subject({
      name: name.trim(),
      code: trimmedCode,
      semester: Number(semester),
      teacherName: teacherName.trim(),
    });

    await newSubject.save();

    return res.status(201).json({
      message: 'Subject created successfully',
      subject: newSubject,
    });
  } catch (error) {
    console.error('Error creating subject:', error);
    return res.status(500).json({ message: error.message || 'Failed to create subject' });
  }
});

router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const { name, code, semester, teacherName } = req.body;

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    if (code) {
      const trimmedCode = code.toUpperCase().trim();
      if (trimmedCode !== subject.code) {
        const duplicate = await Subject.findOne({ code: trimmedCode });
        if (duplicate) {
          return res.status(400).json({
            message: `Subject code '${trimmedCode}' is already used by another subject`,
          });
        }
        subject.code = trimmedCode;
      }
    }

    if (name) subject.name = name.trim();
    if (semester) subject.semester = Number(semester);
    if (teacherName) subject.teacherName = teacherName.trim();

    await subject.save();

    return res.json({
      message: 'Subject updated successfully',
      subject,
    });
  } catch (error) {
    console.error('Error updating subject:', error);
    return res.status(500).json({ message: error.message || 'Failed to update subject' });
  }
});

router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    await Attendance.deleteMany({ subject: subject._id });

    await Subject.findByIdAndDelete(req.params.id);

    return res.json({ message: 'Subject and related attendance records deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    return res.status(500).json({ message: error.message || 'Failed to delete subject' });
  }
});

module.exports = router;
