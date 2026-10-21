import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import StatCard from '../components/StatCard';
import AttendanceBadge from '../components/AttendanceBadge';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiRequest('/api/admin/dashboard');
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading dashboard statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-danger">{error}</div>
        <button onClick={fetchDashboardData} className="btn btn-secondary btn-sm">
          Try Again
        </button>
      </div>
    );
  }

  const { todayStats, cumulativeStats, subjectWiseStats, totalStudentsBelow75, todayDate } =
    data || {};

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Date: {todayDate}</p>
        </div>
        <div className="page-actions">
          <Link to="/admin/attendance/mark" className="btn btn-primary">
            Mark Attendance
          </Link>
          <Link to="/admin/shortage" className="btn btn-warning">
            Shortage List ({totalStudentsBelow75})
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Today's Attendance"
          value={todayStats?.overallPercentage ?? 0}
          isPercentage={true}
          subtitle={`${todayStats?.totalPresent || 0} Present / ${(todayStats?.totalPresent || 0) + (todayStats?.totalAbsent || 0)} Total marked`}
        />

        <StatCard
          title="Classes Held Today"
          value={todayStats?.sheetsMarkedCount ?? 0}
          subtitle="Attendance sheets submitted today"
        />

        <StatCard
          title="Students Below 75%"
          value={totalStudentsBelow75 ?? 0}
          subtitle="Students with attendance shortage"
        />

        <StatCard
          title="Overall Cumulative Attendance"
          value={cumulativeStats?.overallPercentage ?? 0}
          isPercentage={true}
          subtitle="Average across all past classes"
        />
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Today's Attendance Summary</h2>
          <span className="text-muted">Sessions marked on {todayDate}</span>
        </div>
        <div className="card-body p-0">
          {todayStats?.summary && todayStats.summary.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subject Name</th>
                    <th>Code</th>
                    <th>Semester</th>
                    <th>Total Students</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Today's %</th>
                  </tr>
                </thead>
                <tbody>
                  {todayStats.summary.map((sheet) => (
                    <tr key={sheet.sheetId}>
                      <td className="font-semibold">{sheet.subjectName}</td>
                      <td>
                        <span className="code-badge">{sheet.subjectCode}</span>
                      </td>
                      <td>Semester {sheet.semester}</td>
                      <td>{sheet.totalStudents}</td>
                      <td className="text-success">{sheet.presentCount}</td>
                      <td className="text-danger">{sheet.absentCount}</td>
                      <td>
                        <AttendanceBadge percentage={sheet.percentage} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No attendance has been marked for today ({todayDate}) yet.</p>
              <Link to="/admin/attendance/mark" className="btn btn-primary btn-sm mt-4">
                Mark Today's Attendance
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Subject-Wise Average Attendance</h2>
          <Link to="/admin/subjects" className="btn btn-secondary btn-sm">
            Manage Subjects
          </Link>
        </div>
        <div className="card-body p-0">
          {subjectWiseStats && subjectWiseStats.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Code</th>
                    <th>Semester</th>
                    <th>Faculty</th>
                    <th>Classes Held</th>
                    <th>Average Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectWiseStats.map((sub) => (
                    <tr key={sub.subjectId}>
                      <td className="font-semibold">{sub.subjectName}</td>
                      <td>
                        <span className="code-badge">{sub.code || sub.subjectCode}</span>
                      </td>
                      <td>Semester {sub.semester}</td>
                      <td>{sub.teacherName}</td>
                      <td>{sub.totalClasses}</td>
                      <td>
                        <AttendanceBadge percentage={sub.averagePercentage} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No subjects found. Please add subjects first.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
