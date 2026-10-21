const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');
const { getAttendanceMetrics } = require('../utils/attendanceCalculator');

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

router.get('/shortage', protect, requireRole('admin'), async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ semester: 1, name: 1 });
    const students = await User.find({ role: 'student' }).sort({ rollNumber: 1 });
    const attendanceSheets = await Attendance.find();

    const shortageList = [];

    for (const subject of subjects) {
      const sheetsForSubject = attendanceSheets.filter(
        (sheet) => sheet.subject.toString() === subject._id.toString()
      );

      const totalClasses = sheetsForSubject.length;
      if (totalClasses === 0) continue;

      const semesterStudents = students.filter(
        (st) => Number(st.semester) === Number(subject.semester)
      );

      for (const student of semesterStudents) {
        let attendedClasses = 0;

        sheetsForSubject.forEach((sheet) => {
          const rec = sheet.records.find(
            (r) => r.student.toString() === student._id.toString()
          );
          if (rec && rec.status === 'Present') {
            attendedClasses += 1;
          }
        });

        const metrics = getAttendanceMetrics(attendedClasses, totalClasses);

        if (metrics.isShortage) {
          shortageList.push({
            studentId: student._id,
            studentName: student.name,
            rollNumber: student.rollNumber,
            semester: student.semester,
            section: student.section,
            subjectId: subject._id,
            subjectName: subject.name,
            subjectCode: subject.code,
            totalClasses: metrics.total,
            attendedClasses: metrics.attended,
            attendancePercentage: metrics.percentage,
            classesNeeded: metrics.classesNeeded,
            statusMessage: metrics.message,
          });
        }
      }
    }

    shortageList.sort((a, b) => a.attendancePercentage - b.attendancePercentage);

    return res.json({
      totalShortages: shortageList.length,
      shortageList,
    });
  } catch (error) {
    console.error('Error fetching shortage list:', error);
    return res.status(500).json({ message: 'Failed to fetch shortage list' });
  }
});

router.get('/dashboard', protect, requireRole('admin'), async (req, res) => {
  try {
    const todayDate = req.query.date || getTodayDateString();

    const [subjects, students, allSheets] = await Promise.all([
      Subject.find().sort({ semester: 1, name: 1 }),
      User.find({ role: 'student' }),
      Attendance.find().populate('subject', 'name code semester teacherName'),
    ]);

    const todaySheets = allSheets.filter((sheet) => sheet.date === todayDate);

    let todayTotalStudentRecords = 0;
    let todayPresentStudentRecords = 0;

    const todaySummary = todaySheets.map((sheet) => {
      const totalStudentsInSheet = sheet.records.length;
      const presentCount = sheet.records.filter((r) => r.status === 'Present').length;
      const absentCount = totalStudentsInSheet - presentCount;
      const percentage =
        totalStudentsInSheet > 0
          ? Number(((presentCount / totalStudentsInSheet) * 100).toFixed(1))
          : 0;

      todayTotalStudentRecords += totalStudentsInSheet;
      todayPresentStudentRecords += presentCount;

      return {
        sheetId: sheet._id,
        subjectName: sheet.subject ? sheet.subject.name : 'Unknown Subject',
        subjectCode: sheet.subject ? sheet.subject.code : '',
        semester: sheet.semester,
        totalStudents: totalStudentsInSheet,
        presentCount,
        absentCount,
        percentage,
      };
    });

    const todayOverallPercentage =
      todayTotalStudentRecords > 0
        ? Number(((todayPresentStudentRecords / todayTotalStudentRecords) * 100).toFixed(1))
        : 0;

    let cumulativeTotalRecords = 0;
    let cumulativePresentRecords = 0;

    allSheets.forEach((sheet) => {
      sheet.records.forEach((r) => {
        cumulativeTotalRecords += 1;
        if (r.status === 'Present') {
          cumulativePresentRecords += 1;
        }
      });
    });

    const cumulativeOverallPercentage =
      cumulativeTotalRecords > 0
        ? Number(((cumulativePresentRecords / cumulativeTotalRecords) * 100).toFixed(1))
        : 0;

    const subjectWiseStats = subjects.map((sub) => {
      const sheetsForSub = allSheets.filter(
        (sheet) => sheet.subject && sheet.subject._id.toString() === sub._id.toString()
      );

      const totalClasses = sheetsForSub.length;
      let totalRecords = 0;
      let presentRecords = 0;

      sheetsForSub.forEach((sheet) => {
        sheet.records.forEach((r) => {
          totalRecords += 1;
          if (r.status === 'Present') {
            presentRecords += 1;
          }
        });
      });

      const avgPercentage =
        totalRecords > 0
          ? Number(((presentRecords / totalRecords) * 100).toFixed(1))
          : 0;

      return {
        subjectId: sub._id,
        subjectName: sub.name,
        subjectCode: sub.code,
        semester: sub.semester,
        teacherName: sub.teacherName,
        totalClasses,
        averagePercentage: avgPercentage,
      };
    });

    const uniqueStudentsBelow75 = new Set();

    for (const sub of subjects) {
      const sheetsForSub = allSheets.filter(
        (sheet) => sheet.subject && sheet.subject._id.toString() === sub._id.toString()
      );
      if (sheetsForSub.length === 0) continue;

      const semStudents = students.filter(
        (st) => Number(st.semester) === Number(sub.semester)
      );

      for (const st of semStudents) {
        let attended = 0;
        sheetsForSub.forEach((sheet) => {
          const rec = sheet.records.find(
            (r) => r.student.toString() === st._id.toString()
          );
          if (rec && rec.status === 'Present') attended += 1;
        });

        const pct = (attended / sheetsForSub.length) * 100;
        if (pct < 75) {
          uniqueStudentsBelow75.add(st._id.toString());
        }
      }
    }

    return res.json({
      todayDate,
      todayStats: {
        overallPercentage: todayOverallPercentage,
        sheetsMarkedCount: todaySheets.length,
        totalPresent: todayPresentStudentRecords,
        totalAbsent: todayTotalStudentRecords - todayPresentStudentRecords,
        summary: todaySummary,
      },
      cumulativeStats: {
        totalSubjects: subjects.length,
        totalStudents: students.length,
        totalClassesConducted: allSheets.length,
        overallPercentage: cumulativeOverallPercentage,
      },
      subjectWiseStats,
      totalStudentsBelow75: uniqueStudentsBelow75.size,
    });
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    return res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

module.exports = router;
