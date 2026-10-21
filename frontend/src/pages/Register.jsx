import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';

export default function Register() {
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [rollNumber, setRollNumber] = useState('');
  const [semester, setSemester] = useState('4');
  const [section, setSection] = useState('A');

  const [adminSecretKey, setAdminSecretKey] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill in name, email, and password.');
      return;
    }

    if (role === 'student' && (!rollNumber || !semester || !section)) {
      setError('Please provide roll number, semester, and section for student registration.');
      return;
    }

    if (role === 'admin' && !adminSecretKey) {
      setError('Admin secret key is required for Teacher/Admin registration.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name,
        email,
        password,
        role,
        ...(role === 'student'
          ? { rollNumber, semester: Number(semester), section }
          : { adminSecretKey }),
      };

      const data = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      login(data.token, data.user);

      if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/my-attendance');
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p className="auth-subtitle">Register for the attendance portal</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="role-tabs">
            <button
              type="button"
              className={`role-tab ${role === 'student' ? 'active' : ''}`}
              onClick={() => setRole('student')}
            >
              Student
            </button>
            <button
              type="button"
              className={`role-tab ${role === 'admin' ? 'active' : ''}`}
              onClick={() => setRole('admin')}
            >
              Teacher / Admin
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              type="text"
              className="form-control"
              placeholder="e.g. Anand Yadav"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-email">Email Address</label>
              <input
                id="reg-email"
                type="email"
                className="form-control"
                placeholder="name@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-pass">Password</label>
              <input
                id="reg-pass"
                type="password"
                className="form-control"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {role === 'student' && (
            <div className="card mb-4" style={{ padding: '12px', backgroundColor: '#f8fafc' }}>
              <strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                Student Academic Details
              </strong>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="reg-roll">Roll Number</label>
                  <input
                    id="reg-roll"
                    type="text"
                    className="form-control"
                    placeholder="e.g. 23CS001"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reg-sem">Semester</label>
                  <select
                    id="reg-sem"
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

                <div className="form-group">
                  <label htmlFor="reg-sec">Section</label>
                  <select
                    id="reg-sec"
                    className="form-control"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    required
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {role === 'admin' && (
            <div className="form-group">
              <label htmlFor="reg-key">Admin Secret Key</label>
              <input
                id="reg-key"
                type="password"
                className="form-control"
                placeholder="Enter secret key (default: admin123)"
                value={adminSecretKey}
                onChange={(e) => setAdminSecretKey(e.target.value)}
                required
              />
              <span className="form-hint">College security key: admin123</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
