import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

export default function ShortageList() {
  const [shortages, setShortages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchShortages = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiRequest('/api/admin/shortage');
      setShortages(data.shortageList || []);
    } catch (err) {
      setError(err.message || 'Failed to load shortage list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShortages();
  }, []);

  const filteredShortages = shortages.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.studentName.toLowerCase().includes(q) ||
      item.rollNumber.toLowerCase().includes(q) ||
      item.subjectName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance Shortage List (&lt; 75%)</h1>
          <p className="page-subtitle">
            Students whose attendance is below the 75% requirement
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="alert alert-info">
        <strong>Consecutive Classes Calculation:</strong> The last column shows how
        many upcoming classes in a row the student must attend to reach 75% attendance.
      </div>

      <div className="card mb-4" style={{ padding: '12px' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search by student name, roll number, or subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Defaulter Students ({filteredShortages.length})</h2>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="loading-state">Loading shortage list...</div>
          ) : filteredShortages.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Roll Number</th>
                    <th>Semester</th>
                    <th>Section</th>
                    <th>Subject Name</th>
                    <th>Total Classes</th>
                    <th>Attended</th>
                    <th>Attendance %</th>
                    <th>Classes Needed to Hit 75%</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShortages.map((item, idx) => (
                    <tr key={`${item.studentId}-${item.subjectId}-${idx}`}>
                      <td className="font-semibold">{item.studentName}</td>
                      <td>
                        <span className="code-badge">{item.rollNumber}</span>
                      </td>
                      <td>Semester {item.semester}</td>
                      <td>Section {item.section}</td>
                      <td>{item.subjectName}</td>
                      <td>{item.totalClasses}</td>
                      <td>{item.attendedClasses}</td>
                      <td>
                        <span className="badge badge-shortage">
                          {item.attendancePercentage.toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <span className="text-danger">
                          +{item.classesNeeded} consecutive class{item.classesNeeded !== 1 ? 'es' : ''}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No students have attendance below 75%.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
