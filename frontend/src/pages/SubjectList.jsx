import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';

export default function SubjectList() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('all');

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiRequest('/api/subjects');
      setSubjects(data);
    } catch (err) {
      setError(err.message || 'Failed to load subjects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleDelete = async (id, name) => {
    const ok = window.confirm(`Are you sure you want to delete "${name}"?`);
    if (!ok) return;

    try {
      await apiRequest(`/api/subjects/${id}`, { method: 'DELETE' });
      setSubjects(subjects.filter((s) => s._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete subject.');
    }
  };

  const filteredSubjects = subjects.filter((s) => {
    if (semesterFilter === 'all') return true;
    return Number(s.semester) === Number(semesterFilter);
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subject Management</h1>
          <p className="page-subtitle">View and manage all college subjects</p>
        </div>
        <Link to="/admin/subjects/new" className="btn btn-primary">
          + Add Subject
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-4" style={{ padding: '12px' }}>
        <label style={{ marginRight: '8px', fontWeight: 'bold' }}>
          Filter by Semester:
        </label>
        <select
          value={semesterFilter}
          onChange={(e) => setSemesterFilter(e.target.value)}
          className="form-control"
          style={{ width: 'auto', display: 'inline-block' }}
        >
          <option value="all">All Semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
            <option key={sem} value={sem}>
              Semester {sem}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">All Subjects ({filteredSubjects.length})</h2>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="loading-state">Loading subjects...</div>
          ) : filteredSubjects.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Subject Name</th>
                    <th>Semester</th>
                    <th>Teacher Name</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.map((sub) => (
                    <tr key={sub._id}>
                      <td>
                        <span className="code-badge">{sub.code}</span>
                      </td>
                      <td className="font-semibold">{sub.name}</td>
                      <td>Semester {sub.semester}</td>
                      <td>{sub.teacherName}</td>
                      <td className="text-right">
                        <Link
                          to={`/admin/subjects/${sub._id}/edit`}
                          className="btn btn-secondary btn-sm"
                          style={{ marginRight: '6px' }}
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(sub._id, sub.name)}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No subjects found for the selected semester.</p>
              <Link to="/admin/subjects/new" className="btn btn-primary btn-sm mt-4">
                + Add Subject
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
