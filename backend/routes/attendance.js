const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');

router.get('/students', protect, requireRole('admin'), async (req, res) => {
  try {
    const { semester } = req.query;
    if (!semester) {
      return res.status(400).json({ message: 'Semester query parameter is required' });
    }

    const students = await User.find({
      role: 'student',
      semester: Number(semester),
    })
      .select('name email rollNumber semester section')
      .sort({ rollNumber: 1 });

    return res.json(students);
  } catch (error) {
    console.error('Error fetching semester students:', error);
    return res.status(500).json({ message: 'Failed to fetch students for this semester' });
  }
});

router.get('/check', protect, requireRole('admin'), async (req, res) => {
  try {
    const { subjectId, date } = req.query;

    if (!subjectId || !date) {
      return res.status(400).json({ message: 'Both subjectId and date are required' });
    }

    const existingSheet = await Attendance.findOne({
      subject: subjectId,
      date: date.trim(),
    }).populate('records.student', 'name email rollNumber semester section');

    if (existingSheet) {
      return res.json({
        exists: true,
        message: 'Existing attendance sheet found. Opening in edit mode.',
        sheet: existingSheet,
      });
    }

    return res.json({
      exists: false,
      sheet: null,
    });
  } catch (error) {
    console.error('Error checking attendance sheet:', error);
    return res.status(500).json({ message: 'Failed to check existing attendance' });
  }
});

router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const { subjectId, date, records } = req.body;

    if (!subjectId || !date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        message: 'subjectId, date (YYYY-MM-DD), and student attendance records are required',
      });
    }

    const trimmedDate = date.trim();

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const existingSheet = await Attendance.findOne({
      subject: subjectId,
      date: trimmedDate,
    });

    if (existingSheet) {
      existingSheet.records = records.map((r) => ({
        student: r.student,
        status: r.status === 'Present' ? 'Present' : 'Absent',
      }));
      await existingSheet.save();

      const populatedSheet = await Attendance.findById(existingSheet._id)
        .populate('subject', 'name code semester teacherName')
        .populate('records.student', 'name email rollNumber semester section');

      return res.json({
        message: 'Existing attendance sheet updated successfully (Duplicate prevented)',
        sheet: populatedSheet,
        isUpdate: true,
      });
    }

    const newSheet = new Attendance({
      subject: subject._id,
      date: trimmedDate,
      semester: subject.semester,
      records: records.map((r) => ({
        student: r.student,
        status: r.status === 'Present' ? 'Present' : 'Absent',
      })),
    });

    await newSheet.save();

    const populatedSheet = await Attendance.findById(newSheet._id)
      .populate('subject', 'name code semester teacherName')
      .populate('records.student', 'name email rollNumber semester section');

    return res.status(201).json({
      message: 'Attendance sheet saved successfully',
      sheet: populatedSheet,
      isUpdate: false,
    });
  } catch (error) {
    console.error('Error saving attendance:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Attendance sheet for this subject and date already exists. Please edit the existing record.',
      });
    }
    return res.status(500).json({ message: error.message || 'Failed to save attendance sheet' });
  }
});

router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'Attendance records array is required' });
    }

    const sheet = await Attendance.findById(req.params.id);
    if (!sheet) {
      return res.status(404).json({ message: 'Attendance sheet not found' });
    }

    sheet.records = records.map((r) => ({
      student: r.student,
      status: r.status === 'Present' ? 'Present' : 'Absent',
    }));

    await sheet.save();

    const populatedSheet = await Attendance.findById(sheet._id)
      .populate('subject', 'name code semester teacherName')
      .populate('records.student', 'name email rollNumber semester section');

    return res.json({
      message: 'Attendance sheet updated successfully',
      sheet: populatedSheet,
    });
  } catch (error) {
    console.error('Error updating attendance sheet:', error);
    return res.status(500).json({ message: 'Failed to update attendance sheet' });
  }
});

router.get('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const sheet = await Attendance.findById(req.params.id)
      .populate('subject', 'name code semester teacherName')
      .populate('records.student', 'name email rollNumber semester section');

    if (!sheet) {
      return res.status(404).json({ message: 'Attendance sheet not found' });
    }

    return res.json(sheet);
  } catch (error) {
    console.error('Error fetching attendance sheet:', error);
    return res.status(500).json({ message: 'Failed to fetch attendance sheet' });
  }
});

module.exports = router;
