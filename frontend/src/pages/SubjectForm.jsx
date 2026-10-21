import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';

export default function SubjectForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [semester, setSemester] = useState('4');
  const [teacherName, setTeacherName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      const loadSubject = async () => {
        try {
          const data = await apiRequest(`/api/subjects/${id}`);
          setName(data.name || '');
          setCode(data.code || '');
          setSemester(String(data.semester || '4'));
          setTeacherName(data.teacherName || '');
        } catch (err) {
          setError(err.message || 'Failed to load subject details');
        }
      };
      loadSubject();
    }
  }, [id, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !code || !semester || !teacherName) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        semester: Number(semester),
        teacherName: teacherName.trim(),
      };

      if (isEditMode) {
        await apiRequest(`/api/subjects/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/api/subjects', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      navigate('/admin/subjects');
    } catch (err) {
      setError(err.message || 'Failed to save subject.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="form-page-container">
        <div className="mb-4">
          <Link to="/admin/subjects">← Back to Subjects</Link>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              {isEditMode ? 'Edit Subject' : 'Add New Subject'}
            </h2>
          </div>

          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="sub-name">Subject Name</label>
                <input
                  id="sub-name"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Data Structures and Algorithms"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="sub-code">Subject Code</label>
                  <input
                    id="sub-code"
                    type="text"
                    className="form-control"
                    placeholder="e.g. CS401"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sub-sem">Semester</label>
                  <select
                    id="sub-sem"
                    className="form-control"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="sub-teacher">Teacher Name</label>
                <input
                  id="sub-teacher"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Prof. R. K. Sharma"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  required
                />
              </div>

              <div className="form-actions">
                <Link to="/admin/subjects" className="btn btn-secondary">
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading
                    ? 'Saving...'
                    : isEditMode
                    ? 'Update Subject'
                    : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
