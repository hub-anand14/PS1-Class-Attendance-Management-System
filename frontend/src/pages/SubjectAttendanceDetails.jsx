import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import AttendanceBadge from '../components/AttendanceBadge';

export default function SubjectAttendanceDetails() {
  const { subjectId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDetails() {
      try {
        setLoading(true);
        setError('');
        const res = await apiRequest(`/api/student/attendance/${subjectId}`);
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to load subject attendance history.');
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [subjectId]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading attendance history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-danger">{error}</div>
        <Link to="/my-attendance">← Back to My Attendance</Link>
      </div>
    );
  }

  const { subject, stats, history } = data || {};
  const isSafe = stats?.totalClasses === 0 || stats?.attendancePercentage >= 75;

  return (
    <div className="page-container">
      <div className="mb-4">
        <Link to="/my-attendance">← Back to My Attendance</Link>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <div>
            <h1 className="card-title">{subject?.name}</h1>
            <span className="text-muted">
              Code: {subject?.code} | Semester: {subject?.semester} | Faculty: {subject?.teacherName}
            </span>
          </div>
          <AttendanceBadge percentage={stats?.attendancePercentage} />
        </div>

        <div className="card-body">
          <div className="detail-stats-grid">
            <div className="detail-stat-box">
              <span className="text-muted">Total Classes</span>
              <span className="stat-val">{stats?.totalClasses}</span>
            </div>
            <div className="detail-stat-box">
              <span className="text-muted">Attended</span>
              <span className="stat-val text-success">{stats?.attendedClasses}</span>
            </div>
            <div className="detail-stat-box">
              <span className="text-muted">Missed</span>
              <span className="stat-val text-danger">
                {stats?.totalClasses - stats?.attendedClasses}
              </span>
            </div>
            <div className="detail-stat-box">
              <span className="text-muted">Percentage</span>
              <span className="stat-val">{stats?.attendancePercentage}%</span>
            </div>
          </div>

          <div className={`alert ${isSafe ? 'alert-success' : 'alert-danger'} mb-0`}>
            {stats?.totalClasses === 0 ? (
              'No classes held yet for this subject.'
            ) : stats?.isShortage ? (
              <span>
                <strong>Attendance Shortage (&lt; 75%):</strong> You need to attend the next{' '}
                <strong>{stats?.classesNeeded} consecutive class{stats?.classesNeeded !== 1 ? 'es' : ''}</strong>{' '}
                to reach the 75% minimum requirement.
              </span>
            ) : (
              <span>Your attendance is above 75%. No additional classes needed!</span>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Date-Wise Attendance Records</h2>
          <span className="text-muted">Total: {history?.length || 0} classes</span>
        </div>

        <div className="card-body p-0">
          {history && history.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record, index) => (
                    <tr key={index}>
                      <td>{history.length - index}</td>
                      <td className="font-semibold">{record.date}</td>
                      <td>
                        <AttendanceBadge status={record.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No class sessions have been recorded for this subject yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
