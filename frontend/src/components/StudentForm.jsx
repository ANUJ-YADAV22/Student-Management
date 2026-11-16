import React, { useState, useEffect } from 'react';

export default function StudentForm({ studentToEdit, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    email: '',
    department: 'Computer Science',
    semester: 1,
    contact: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (studentToEdit) {
      setFormData({
        studentId: studentToEdit.studentId || '',
        name: studentToEdit.name || '',
        email: studentToEdit.email || '',
        department: studentToEdit.department || 'Computer Science',
        semester: studentToEdit.semester || 1,
        contact: studentToEdit.contact || ''
      });
    } else {
      setFormData({
        studentId: '',
        name: '',
        email: '',
        department: 'Computer Science',
        semester: 1,
        contact: ''
      });
    }
    setError('');
  }, [studentToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'semester' ? Number(value) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.studentId.trim() || !formData.name.trim() || !formData.email.trim() || !formData.department.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (formData.semester < 1 || isNaN(formData.semester)) {
      setError('Semester must be a positive number.');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{studentToEdit ? `Edit Student: ${studentToEdit.studentId}` : 'Add New Student'}</h3>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="toast-alert toast-error" style={{ marginBottom: '1rem' }}>
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label>Student ID *</label>
              <input
                type="text"
                name="studentId"
                placeholder="e.g. ST101"
                value={formData.studentId}
                onChange={handleChange}
                disabled={!!studentToEdit || loading}
                required
              />
            </div>

            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                placeholder="e.g. Rahul Sharma"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                placeholder="e.g. rahul@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Department *</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  disabled={loading}
                  required
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Civil">Civil</option>
                  <option value="Electrical">Electrical</option>
                </select>
              </div>

              <div className="form-group">
                <label>Semester *</label>
                <input
                  type="number"
                  name="semester"
                  min="1"
                  max="12"
                  value={formData.semester}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Contact Number</label>
              <input
                type="text"
                name="contact"
                placeholder="e.g. 9876543210"
                value={formData.contact}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : studentToEdit ? 'Update Student' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
