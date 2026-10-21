import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import SubjectList from './pages/SubjectList';
import SubjectForm from './pages/SubjectForm';
import MarkAttendance from './pages/MarkAttendance';
import ShortageList from './pages/ShortageList';
import StudentAttendance from './pages/StudentAttendance';
import SubjectAttendanceDetails from './pages/SubjectAttendanceDetails';

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/my-attendance" replace />;
}

function NotFound() {
  return (
    <div className="page-container text-center py-12">
      <div className="empty-state">
        <span className="empty-icon">🔍</span>
        <h2>Page Not Found (404)</h2>
        <p>The requested page does not exist or has been moved.</p>
        <Link to="/" className="btn btn-primary mt-4">
          Return to Portal Home
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomeRedirect />} />

              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/subjects"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <SubjectList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/subjects/new"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <SubjectForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/subjects/:id/edit"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <SubjectForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/attendance/mark"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <MarkAttendance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/shortage"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <ShortageList />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/my-attendance"
                element={
                  <ProtectedRoute allowedRole="student">
                    <StudentAttendance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-attendance/:subjectId"
                element={
                  <ProtectedRoute allowedRole="student">
                    <SubjectAttendanceDetails />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <footer className="footer">
            <div className="footer-content">
              <p>
                🎓 <strong>Class Attendance Management System</strong> • B.Tech CSE Project •
                Node.js, Express, MongoDB & React.js
              </p>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
