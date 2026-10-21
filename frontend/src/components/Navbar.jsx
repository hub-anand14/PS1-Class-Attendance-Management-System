import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAdmin, isStudent, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <NavLink
          to={isAdmin ? '/admin/dashboard' : '/my-attendance'}
          className="brand-link"
        >
          <span className="brand-icon">🎓</span>
          <span>Attendance System</span>
        </NavLink>

        <nav className="navbar-nav">
          {user ? (
            <>
              {isAdmin && (
                <>
                  <NavLink to="/admin/dashboard" className="nav-link">
                    Dashboard
                  </NavLink>
                  <NavLink to="/admin/subjects" className="nav-link">
                    Subjects
                  </NavLink>
                  <NavLink to="/admin/attendance/mark" className="nav-link">
                    Mark Attendance
                  </NavLink>
                  <NavLink to="/admin/shortage" className="nav-link">
                    Shortage List
                  </NavLink>
                </>
              )}

              {isStudent && (
                <NavLink to="/my-attendance" className="nav-link">
                  My Attendance
                </NavLink>
              )}

              <div className="nav-user-section">
                <div>
                  <span className="user-name">{user.name}</span>
                  <span className="user-role">
                    {isAdmin
                      ? 'Teacher/Admin'
                      : `Roll: ${user.rollNumber} (Sem ${user.semester})`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-link">
                Login
              </NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm">
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
