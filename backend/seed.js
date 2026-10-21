const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Subject = require('./models/Subject');
const Attendance = require('./models/Attendance');

dotenv.config();

const getFormattedDate = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/class_attendance_db';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    await User.deleteMany({});
    await Subject.deleteMany({});
    await Attendance.deleteMany({});
    console.log('Cleared existing data.');

    const admin = new User({
      name: 'Dr. Suresh Kumar (HOD)',
      email: 'admin@college.edu',
      password: 'Admin@123',
      role: 'admin',
    });
    await admin.save();
    console.log('Admin account created: admin@college.edu / Admin@123');

    const studentsData = [
      {
        name: 'Anand Yadav',
        email: 'anand@college.edu',
        password: 'Student@123',
        role: 'student',
        rollNumber: '23CS001',
        semester: 4,
        section: 'A',
      },
      {
        name: 'Diya Patel',
        email: 'diya@college.edu',
        password: 'Student@123',
        role: 'student',
        rollNumber: '23CS002',
        semester: 4,
        section: 'A',
      },
      {
        name: 'Rohan Gupta',
        email: 'rohan@college.edu',
        password: 'Student@123',
        role: 'student',
        rollNumber: '23CS003',
        semester: 4,
        section: 'A',
      },
      {
        name: 'Ananya Verma',
        email: 'ananya@college.edu',
        password: 'Student@123',
        role: 'student',
        rollNumber: '23CS004',
        semester: 4,
        section: 'B',
      },
      {
        name: 'Kabir Mehta',
        email: 'kabir@college.edu',
        password: 'Student@123',
        role: 'student',
        rollNumber: '23CS005',
        semester: 4,
        section: 'B',
      },
    ];

    const createdStudents = [];
    for (const s of studentsData) {
      const student = new User(s);
      await student.save();
      createdStudents.push(student);
    }
    console.log(`Created ${createdStudents.length} sample students.`);

    const subjectsData = [
      {
        name: 'Data Structures and Algorithms',
        code: 'CS401',
        semester: 4,
        teacherName: 'Dr. R. K. Raman',
      },
      {
        name: 'Database Management Systems',
        code: 'CS402',
        semester: 4,
        teacherName: 'Prof. Sunita Rao',
      },
      {
        name: 'Operating Systems',
        code: 'CS403',
        semester: 4,
        teacherName: 'Dr. Vivek Murthy',
      },
      {
        name: 'Computer Networks',
        code: 'CS404',
        semester: 4,
        teacherName: 'Prof. Megha Iyer',
      },
    ];

    const createdSubjects = [];
    for (const sub of subjectsData) {
      const subject = new Subject(sub);
      await subject.save();
      createdSubjects.push(subject);
    }
    console.log(`Created ${createdSubjects.length} sample subjects.`);

    const dsaSubject = createdSubjects[0];
    const attendancePatternsCS401 = [
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 0],
      [0, 1, 0, 1, 1],
      [1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1],
      [1, 1, 0, 0, 0],
      [1, 1, 1, 1, 1],
      [0, 0, 0, 1, 0],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 0, 0],
    ];

    const offsetsCS401 = [14, 13, 11, 10, 8, 7, 5, 4, 2, 1];

    for (let i = 0; i < 10; i++) {
      const classDate = getFormattedDate(offsetsCS401[i]);
      const pattern = attendancePatternsCS401[i];

      const records = createdStudents.map((student, idx) => ({
        student: student._id,
        status: pattern[idx] === 1 ? 'Present' : 'Absent',
      }));

      const sheet = new Attendance({
        subject: dsaSubject._id,
        date: classDate,
        semester: 4,
        records,
      });

      await sheet.save();
    }

    const dbmsSubject = createdSubjects[1];
    const todayDate = getFormattedDate(0);

    const todayRecords = createdStudents.map((student, idx) => ({
      student: student._id,
      status: idx % 2 === 0 ? 'Present' : 'Absent',
    }));

    const todaySheet = new Attendance({
      subject: dbmsSubject._id,
      date: todayDate,
      semester: 4,
      records: todayRecords,
    });
    await todaySheet.save();

    console.log('Seeded attendance records including historical sheets and today session.');
    console.log('🎉 Seeding successfully completed!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
