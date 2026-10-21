const http = require('http');
const { calculateClassesNeeded } = require('./utils/attendanceCalculator');

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let json = {};
          try {
            json = JSON.parse(data);
          } catch (e) {
            json = { raw: data };
          }
          resolve({ status: res.statusCode, body: json });
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Comprehensive Automated Requirement Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && health.body.status === 'ok', 'Server is healthy on port 5000');

    assert(calculateClassesNeeded(6, 10) === 6, 'Stretch Goal: 6/10 attended needs exactly 6 classes');
    assert(calculateClassesNeeded(7, 10) === 2, 'Stretch Goal: 7/10 attended needs exactly 2 classes');
    assert(calculateClassesNeeded(8, 10) === 0, 'Stretch Goal: 8/10 attended needs 0 classes (already safe)');
    assert(calculateClassesNeeded(0, 1) === 3, 'Stretch Goal: 0/1 attended needs 3 classes');

    const badAdmin = await request('POST', '/api/auth/register', {
      name: 'Fake Admin',
      email: `fakeadmin_${Date.now()}@college.edu`,
      password: 'Password@123',
      role: 'admin',
      adminSecretKey: 'wrong_secret_key',
    });
    assert(
      badAdmin.status === 403,
      'Admin Registration without valid secret key is rejected (403 Forbidden)'
    );

    const newAdminEmail = `validadmin_${Date.now()}@college.edu`;
    const goodAdmin = await request('POST', '/api/auth/register', {
      name: 'Valid Faculty Admin',
      email: newAdminEmail,
      password: 'Password@123',
      role: 'admin',
      adminSecretKey: 'admin123',
    });
    assert(
      goodAdmin.status === 201 && goodAdmin.body.user.role === 'admin',
      'Admin Registration with valid secret key succeeds (201 Created)'
    );
    const adminToken = goodAdmin.body.token;

    const studentRoll = `TEST${Math.floor(1000 + Math.random() * 9000)}`;
    const studentEmail = `student_${Date.now()}@college.edu`;
    const regStudent = await request('POST', '/api/auth/register', {
      name: 'Test Student',
      email: studentEmail,
      password: 'Password@123',
      role: 'student',
      rollNumber: studentRoll,
      semester: 4,
      section: 'A',
    });
    assert(
      regStudent.status === 201 && regStudent.body.user.rollNumber === studentRoll,
      'Student Registration succeeds with Name, Email, Password, Roll, Semester, Section'
    );
    const studentToken = regStudent.body.token;
    const testStudentId = regStudent.body.user.id;

    const dupRoll = await request('POST', '/api/auth/register', {
      name: 'Another Student',
      email: `dup_${Date.now()}@college.edu`,
      password: 'Password@123',
      role: 'student',
      rollNumber: studentRoll,
      semester: 4,
      section: 'B',
    });
    assert(dupRoll.status === 400, 'Duplicate student roll number is rejected (400 Bad Request)');

    const loginRes = await request('POST', '/api/auth/login', {
      email: studentEmail,
      password: 'Password@123',
    });
    assert(
      loginRes.status === 200 && Boolean(loginRes.body.token),
      'User login succeeds and returns JWT token'
    );

    const studentTryAdmin = await request('GET', '/api/admin/dashboard', null, studentToken);
    assert(
      studentTryAdmin.status === 403,
      'Role-based authorization: Student cannot access Admin routes (403 Forbidden)'
    );

    const subCode = `CS${Math.floor(500 + Math.random() * 400)}`;
    const createSub = await request(
      'POST',
      '/api/subjects',
      {
        name: 'Compiler Design',
        code: subCode,
        semester: 4,
        teacherName: 'Dr. C. Hopper',
      },
      adminToken
    );
    assert(
      createSub.status === 201 && createSub.body.subject.code === subCode,
      'Admin can create a new subject (POST /api/subjects)'
    );
    const createdSubjectId = createSub.body.subject._id;

    const dupSub = await request(
      'POST',
      '/api/subjects',
      {
        name: 'Another Compiler Design',
        code: subCode,
        semester: 4,
        teacherName: 'Dr. Other',
      },
      adminToken
    );
    assert(dupSub.status === 400, 'Duplicate subject code is prevented (400 Bad Request)');

    const editSub = await request(
      'PUT',
      `/api/subjects/${createdSubjectId}`,
      {
        teacherName: 'Dr. C. Hopper (Distinguished Faculty)',
      },
      adminToken
    );
    assert(
      editSub.status === 200 &&
        editSub.body.subject.teacherName === 'Dr. C. Hopper (Distinguished Faculty)',
      'Admin can edit a subject (PUT /api/subjects/:id)'
    );

    const listSub = await request('GET', '/api/subjects', null, adminToken);
    assert(
      listSub.status === 200 && Array.isArray(listSub.body) && listSub.body.length > 0,
      'Admin can view all subjects (GET /api/subjects)'
    );

    const markDate = '2026-10-15';
    const markRes = await request(
      'POST',
      '/api/attendance',
      {
        subjectId: createdSubjectId,
        date: markDate,
        records: [
          { student: testStudentId, status: 'Present' },
        ],
      },
      adminToken
    );
    assert(
      markRes.status === 201 && markRes.body.isUpdate === false,
      'Admin can mark new class attendance sheet (POST /api/attendance)'
    );
    const sheetId = markRes.body.sheet._id;

    const checkDup = await request(
      'GET',
      `/api/attendance/check?subjectId=${createdSubjectId}&date=${markDate}`,
      null,
      adminToken
    );
    assert(
      checkDup.status === 200 && checkDup.body.exists === true,
      'Duplicate check detects existing sheet for same subject & date (GET /api/attendance/check)'
    );

    const updateSheet = await request(
      'POST',
      '/api/attendance',
      {
        subjectId: createdSubjectId,
        date: markDate,
        records: [
          { student: testStudentId, status: 'Absent' },
        ],
      },
      adminToken
    );
    assert(
      updateSheet.status === 200 && updateSheet.body.isUpdate === true,
      'Saving existing sheet updates record instead of creating duplicate'
    );

    const getSheet = await request('GET', `/api/attendance/${sheetId}`, null, adminToken);
    assert(
      getSheet.status === 200 && getSheet.body.records[0].status === 'Absent',
      'Attendance status successfully updated to Absent in existing sheet'
    );

    const studentSummary = await request('GET', '/api/student/attendance', null, studentToken);
    assert(
      studentSummary.status === 200 &&
        Array.isArray(studentSummary.body.subjects) &&
        studentSummary.body.subjects.some((s) => s.subjectId === createdSubjectId),
      'Student can view enrolled subjects summary (GET /api/student/attendance)'
    );

    const dateWise = await request(
      'GET',
      `/api/student/attendance/${createdSubjectId}`,
      null,
      studentToken
    );
    assert(
      dateWise.status === 200 &&
        dateWise.body.history.length === 1 &&
        dateWise.body.history[0].date === markDate &&
        dateWise.body.history[0].status === 'Absent',
      'Student can view date-wise attendance records for a subject'
    );

    const shortageRes = await request('GET', '/api/admin/shortage', null, adminToken);
    assert(
      shortageRes.status === 200 &&
        shortageRes.body.shortageList.some(
          (item) => item.studentId === testStudentId && item.subjectId === createdSubjectId
        ),
      'Admin shortage list identifies students with < 75% attendance'
    );

    const dashboardRes = await request('GET', '/api/admin/dashboard', null, adminToken);
    assert(
      dashboardRes.status === 200 &&
        typeof dashboardRes.body.cumulativeStats.overallPercentage === 'number' &&
        Array.isArray(dashboardRes.body.subjectWiseStats) &&
        dashboardRes.body.totalStudentsBelow75 > 0,
      'Admin dashboard returns real-time calculations from database'
    );

    const deleteSub = await request('DELETE', `/api/subjects/${createdSubjectId}`, null, adminToken);
    assert(
      deleteSub.status === 200,
      'Admin can delete a subject and associated records (DELETE /api/subjects/:id)'
    );

    console.log(`\n========================================`);
    console.log(`🎉 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test runner encountered unexpected error:', err);
    process.exit(1);
  }
}

runTests();
