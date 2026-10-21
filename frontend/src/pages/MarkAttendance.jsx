import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function MarkAttendance() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayString());

  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [isExistingSheet, setIsExistingSheet] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    async function loadSubjects() {
      try {
        const data = await apiRequest('/api/subjects');
        setSubjects(data);
        if (data.length > 0) {
          setSelectedSubjectId(data[0]._id);
        }
      } catch (err) {
        setMessage({ type: 'danger', text: 'Failed to load subjects' });
      }
    }
    loadSubjects();
  }, []);

  useEffect(() => {
    if (!selectedSubjectId || !selectedDate) return;

    const currentSubject = subjects.find((s) => s._id === selectedSubjectId);
    if (!currentSubject) return;

    async function loadStudentsAndAttendance() {
      try {
        setLoading(true);
        setMessage(null);

        const semesterStudents = await apiRequest(
          `/api/attendance/students?semester=${currentSubject.semester}`
        );
        setStudents(semesterStudents);

        const check = await apiRequest(
          `/api/attendance/check?subjectId=${selectedSubjectId}&date=${selectedDate}`
        );

        if (check.exists && check.sheet) {
          setIsExistingSheet(true);

          const savedMap = {};
          semesterStudents.forEach((st) => (savedMap[st._id] = 'Absent'));
          check.sheet.records.forEach((rec) => {
            const id = rec.student?._id || rec.student;
            if (id) savedMap[id] = rec.status;
          });
          setAttendanceMap(savedMap);

          setMessage({
            type: 'warning',
            text: 'Notice: Attendance for this subject and date already exists. Opened in Edit Mode.',
          });
        } else {
          setIsExistingSheet(false);
          const newMap = {};
          semesterStudents.forEach((st) => (newMap[st._id] = 'Present'));
          setAttendanceMap(newMap);
        }
      } catch (err) {
        setMessage({ type: 'danger', text: 'Error checking attendance sheet.' });
      } finally {
        setLoading(false);
      }
    }

    loadStudentsAndAttendance();
  }, [selectedSubjectId, selectedDate, subjects]);

  const toggleStatus = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach((st) => (updated[st._id] = status));
    setAttendanceMap(updated);
  };

  const handleSave = async () => {
    if (students.length === 0) {
      alert('No students found to mark attendance for.');
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const records = students.map((st) => ({
        student: st._id,
        status: attendanceMap[st._id] || 'Absent',
      }));

      const res = await apiRequest('/api/attendance', {
        method: 'POST',
        body: JSON.stringify({
          subjectId: selectedSubjectId,
          date: selectedDate,
          records,
        }),
      });

      setIsExistingSheet(true);
      setMessage({
        type: 'success',
        text: res.message || 'Attendance saved successfully!',
      });
    } catch (err) {
      setMessage({ type: 'danger', text: err.message || 'Failed to save attendance.' });
    } finally {
      setSaving(false);
    }
  };

  const selectedSubject = subjects.find((s) => s._id === selectedSubjectId);
  const presentCount = students.filter((s) => attendanceMap[s._id] === 'Present').length;
  const absentCount = students.length - presentCount;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mark Attendance</h1>
          <p className="page-subtitle">Select subject and date to record attendance</p>
        </div>
        {isExistingSheet && (
          <span className="badge badge-warning">Edit Mode (Already Marked)</span>
        )}
      </div>

      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <div className="card mb-4">
        <div className="card-header">
          <h2 className="card-title">1. Select Subject & Date</h2>
        </div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="select-sub">Subject</label>
              <select
                id="select-sub"
                className="form-control"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
              >
                {subjects.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.code} - {sub.name} (Semester {sub.semester})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="select-dt">Date</label>
              <input
                id="select-dt"
                type="date"
                className="form-control"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={getTodayString()}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              2. Student List (Semester {selectedSubject?.semester || '-'})
            </h2>
            <span className="text-muted">
              Present: {presentCount} | Absent: {absentCount} | Total: {students.length}
            </span>
          </div>

          <div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => markAll('Present')}
              style={{ marginRight: '6px' }}
            >
              All Present
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => markAll('Absent')}
            >
              All Absent
            </button>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="loading-state">Checking records and loading students...</div>
          ) : students.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Student Name</th>
                    <th>Section</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const status = attendanceMap[student._id] || 'Absent';
                    const isPresent = status === 'Present';

                    return (
                      <tr key={student._id}>
                        <td>
                          <span className="code-badge">{student.rollNumber}</span>
                        </td>
                        <td className="font-semibold">{student.name}</td>
                        <td>Section {student.section}</td>
                        <td>
                          <span
                            className={
                              isPresent ? 'badge badge-present' : 'badge badge-absent'
                            }
                          >
                            {status}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="attendance-toggle-switch">
                            <button
                              type="button"
                              className={`toggle-option toggle-present ${
                                isPresent ? 'active' : ''
                              }`}
                              onClick={() => toggleStatus(student._id, 'Present')}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              className={`toggle-option toggle-absent ${
                                !isPresent ? 'active' : ''
                              }`}
                              onClick={() => toggleStatus(student._id, 'Absent')}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No students found in Semester {selectedSubject?.semester}.</p>
            </div>
          )}
        </div>

        {students.length > 0 && (
          <div className="card-footer">
            <span>Total {students.length} students</span>
            <button
              type="button"
              onClick={handleSave}
              className="btn btn-primary"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : isExistingSheet
                ? 'Update Attendance Sheet'
                : 'Save Attendance Sheet'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
