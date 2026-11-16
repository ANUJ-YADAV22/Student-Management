import React, { useState } from 'react';

export default function StudentList({
  students,
  loading,
  searchQuery,
  setSearchQuery,
  selectedDept,
  setSelectedDept,
  onEdit,
  onDelete,
  onOpenAdd
}) {
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  const confirmDelete = () => {
    if (deleteCandidate) {
      onDelete(deleteCandidate.studentId);
      setDeleteCandidate(null);
    }
  };

  return (
    <div>
      <div className="controls-bar">
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, flexWrap: 'wrap' }}>
          <div className="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search by ID, Name or Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: '#fff',
              outline: 'none'
            }}
          >
            <option value="">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Electronics">Electronics</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Civil">Civil</option>
            <option value="Electrical">Electrical</option>
          </select>
        </div>

        <button className="btn-primary" onClick={onOpenAdd}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Student
        </button>
      </div>

      <div className="table-card">
        {loading ? (
          <div className="empty-state">
            <p>Loading students from Render API & MongoDB Atlas...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem' }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <p style={{ fontWeight: 600, fontSize: '1.05rem', color: '#334155' }}>No students found</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
              {searchQuery || selectedDept ? 'Try adjusting your search filters.' : 'Click "+ Add Student" to create your first record.'}
            </p>
          </div>
        ) : (
          <table className="students-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Semester</th>
                <th>Contact</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.studentId || student._id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{student.studentId}</td>
                  <td style={{ fontWeight: 500 }}>{student.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{student.email}</td>
                  <td>
                    <span className="badge">{student.department}</span>
                  </td>
                  <td>Sem {student.semester}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{student.contact || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="actions-group" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                        onClick={() => onEdit(student)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-danger"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                        onClick={() => setDeleteCandidate(student)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteCandidate && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--danger)' }}>Confirm Deletion</h3>
              <button
                onClick={() => setDeleteCandidate(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#334155' }}>
                Are you sure you want to delete student <strong>{deleteCandidate.name} ({deleteCandidate.studentId})</strong>?
              </p>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.5rem' }}>
                This will permanently remove the record from MongoDB Atlas (studentDB.students).
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteCandidate(null)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={confirmDelete}>
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
