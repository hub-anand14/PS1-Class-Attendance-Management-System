import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import AttendanceBadge from '../components/AttendanceBadge';

export default function StudentAttendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiRequest('/api/student/attendance');
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load attendance summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading your attendance records...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  const { student, subjects } = data || {};

  let totalClasses = 0;
  let attendedClasses = 0;
  subjects?.forEach((s) => {
    totalClasses += s.totalClasses;
    attendedClasses += s.attendedClasses;
  });
  const overallPercentage =
    totalClasses > 0 ? ((attendedClasses / totalClasses) * 100).toFixed(1) : 0;

  return (
    <div className="page-container">
      <div className="student-profile-hero">
        <div>
          <h1 className="hero-title">Welcome, {student?.name}</h1>
          <p className="hero-subtitle">
            Roll Number: {student?.rollNumber} | Semester: {student?.semester} | Section: {student?.section}
          </p>
        </div>
        <div className="hero-stat-box">
          <span style={{ fontSize: '12px' }}>Overall Attendance</span>
          <span className="stat-number">{overallPercentage}%</span>
          <span style={{ fontSize: '11px' }}>
            {attendedClasses} / {totalClasses} classes
          </span>
        </div>
      </div>

      <div className="page-header">
        <h2 className="page-title">Enrolled Subjects</h2>
      </div>

      <div className="subject-cards-grid">
        {subjects && subjects.length > 0 ? (
          subjects.map((sub) => {
            const isSafe = sub.totalClasses === 0 || sub.attendancePercentage >= 75;

            return (
              <div key={sub.subjectId} className="subject-card">
                <div className="subject-card-header">
                  <div>
                    <span className="code-badge">{sub.subjectCode}</span>
                    <h3 className="subject-title">{sub.subjectName}</h3>
                    <span className="teacher-name">Faculty: {sub.teacherName}</span>
                  </div>
                  <AttendanceBadge percentage={sub.attendancePercentage} />
                </div>

                <div className="subject-stat-row">
                  <div>
                    <strong>Total:</strong> {sub.totalClasses}
                  </div>
                  <div className="text-success">
                    <strong>Attended:</strong> {sub.attendedClasses}
                  </div>
                  <div className="text-danger">
                    <strong>Missed:</strong> {sub.totalClasses - sub.attendedClasses}
                  </div>
                </div>

                <div className={`stretch-goal-box ${isSafe ? 'box-safe' : 'box-danger'}`}>
                  {sub.totalClasses === 0 ? (
                    'No classes held yet.'
                  ) : sub.isShortage ? (
                    <div>
                      <strong>Attendance Shortage:</strong> Attend the next{' '}
                      <strong>{sub.classesNeeded} consecutive class{sub.classesNeeded !== 1 ? 'es' : ''}</strong>{' '}
                      to reach 75%.
                    </div>
                  ) : (
                    <div>Attendance is on track (75% or above).</div>
                  )}
                </div>

                <Link
                  to={`/my-attendance/${sub.subjectId}`}
                  className="btn btn-secondary btn-sm btn-block"
                  style={{ marginTop: 'auto' }}
                >
                  View Date-Wise Details
                </Link>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <p>No subjects found for Semester {student?.semester}.</p>
          </div>
        )}
      </div>
    </div>
  );
}
