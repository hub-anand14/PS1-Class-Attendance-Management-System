const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const { protect, requireRole } = require('../middleware/auth');
const { getAttendanceMetrics } = require('../utils/attendanceCalculator');

router.get('/attendance', protect, requireRole('student'), async (req, res) => {
  try {
    const studentId = req.user._id;
    const studentSemester = req.user.semester;

    const subjects = await Subject.find({ semester: studentSemester }).sort({ name: 1 });

    const subjectIds = subjects.map((s) => s._id);
    const attendanceSheets = await Attendance.find({ subject: { $in: subjectIds } });

    const subjectSummaries = subjects.map((subject) => {
      const sheetsForSubject = attendanceSheets.filter(
        (sheet) => sheet.subject.toString() === subject._id.toString()
      );

      const totalClasses = sheetsForSubject.length;
      let attendedClasses = 0;

      sheetsForSubject.forEach((sheet) => {
        const studentRecord = sheet.records.find(
          (rec) => rec.student.toString() === studentId.toString()
        );
        if (studentRecord && studentRecord.status === 'Present') {
          attendedClasses += 1;
        }
      });

      const metrics = getAttendanceMetrics(attendedClasses, totalClasses);

      return {
        subjectId: subject._id,
        subjectName: subject.name,
        subjectCode: subject.code,
        semester: subject.semester,
        teacherName: subject.teacherName,
        totalClasses: metrics.total,
        attendedClasses: metrics.attended,
        attendancePercentage: metrics.percentage,
        isShortage: metrics.isShortage,
        classesNeeded: metrics.classesNeeded,
        statusMessage: metrics.message,
      };
    });

    return res.json({
      student: {
        id: req.user._id,
        name: req.user.name,
        rollNumber: req.user.rollNumber,
        semester: req.user.semester,
        section: req.user.section,
      },
      subjects: subjectSummaries,
    });
  } catch (error) {
    console.error('Error fetching student attendance summary:', error);
    return res.status(500).json({ message: 'Failed to fetch student attendance summary' });
  }
});

router.get('/attendance/:subjectId', protect, requireRole('student'), async (req, res) => {
  try {
    const studentId = req.user._id;
    const { subjectId } = req.params;

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const sheets = await Attendance.find({ subject: subjectId }).sort({ date: -1 });

    const totalClasses = sheets.length;
    let attendedClasses = 0;
    const history = [];

    sheets.forEach((sheet) => {
      const studentRecord = sheet.records.find(
        (rec) => rec.student.toString() === studentId.toString()
      );

      const status = studentRecord ? studentRecord.status : 'Absent';
      if (status === 'Present') {
        attendedClasses += 1;
      }

      history.push({
        date: sheet.date,
        status: status,
      });
    });

    const metrics = getAttendanceMetrics(attendedClasses, totalClasses);

    return res.json({
      subject: {
        id: subject._id,
        name: subject.name,
        code: subject.code,
        semester: subject.semester,
        teacherName: subject.teacherName,
      },
      stats: {
        totalClasses: metrics.total,
        attendedClasses: metrics.attended,
        attendancePercentage: metrics.percentage,
        isShortage: metrics.isShortage,
        classesNeeded: metrics.classesNeeded,
        statusMessage: metrics.message,
      },
      history,
    });
  } catch (error) {
    console.error('Error fetching subject attendance details:', error);
    return res.status(500).json({ message: 'Failed to fetch subject attendance details' });
  }
});

module.exports = router;
