import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StudentList from './components/StudentList';
import StudentForm from './components/StudentForm';
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  fetchHealth,
  API_BASE_URL
} from './api/client';
import './App.css';

export default function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'add' | 'architecture'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [health, setHealth] = useState(null);
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: string }

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => {
      setAlert(null);
    }, 4500);
  };

  // Health check
  const checkHealth = useCallback(async () => {
    const res = await fetchHealth();
    if (res.ok && res.data) {
      setHealth(res.data);
    } else {
      setHealth({ status: 'offline', dbState: 'disconnected' });
    }
  }, []);

  // Load students
  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStudents(searchQuery, selectedDept);
      setStudents(data || []);
    } catch (err) {
      showAlert(err.message || 'Error connecting to API server', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedDept]);

  useEffect(() => {
    checkHealth();
    loadStudents();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth, loadStudents]);

  // Handle Form Submit (Add or Edit)
  const handleFormSubmit = async (formData) => {
    setFormLoading(true);
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.studentId, formData);
        showAlert(`Student ${editingStudent.studentId} updated successfully!`);
      } else {
        await createStudent(formData);
        showAlert(`Student ${formData.studentId} (${formData.name}) created successfully!`);
      }
      setIsFormOpen(false);
      setEditingStudent(null);
      loadStudents();
      checkHealth();
    } catch (err) {
      showAlert(err.message || 'Failed to save student record', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (studentId) => {
    try {
      await deleteStudent(studentId);
      showAlert(`Student ${studentId} deleted successfully!`);
      loadStudents();
    } catch (err) {
      showAlert(err.message || 'Failed to delete student', 'error');
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setIsFormOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setIsFormOpen(true);
  };

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'add') {
            handleOpenAdd();
          } else {
            setActiveTab(tab);
          }
        }}
        health={health}
        onRefreshHealth={checkHealth}
      />

      <main className="main-content">
        {/* Tier Architecture Visual Banner */}
        <section className="architecture-card">
          <div className="architecture-header">
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Three-Tier Cloud Architecture</h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                Decoupled and independently hosted Presentation, Application, and Database tiers
              </p>
            </div>
            <div className={`health-badge ${health?.dbState === 'connected' ? 'connected' : 'disconnected'}`}>
              <span className="health-dot"></span>
              <span>Atlas DB: {health?.dbState || 'connecting'}</span>
            </div>
          </div>

          <div className="tier-pills">
            <div className="tier-pill tier-frontend">
              <span>Tier 1: Frontend</span>
              <span style={{ opacity: 0.7 }}>(Vercel / React+Vite)</span>
            </div>
            <span className="tier-arrow">&rarr; REST API &rarr;</span>
            <div className="tier-pill tier-backend">
              <span>Tier 2: API Server</span>
              <span style={{ opacity: 0.8 }}>(Render / Node Express)</span>
            </div>
            <span className="tier-arrow">&rarr; Mongoose &rarr;</span>
            <div className="tier-pill tier-db">
              <span>Tier 3: Database</span>
              <span style={{ opacity: 0.8 }}>(MongoDB Atlas / studentDB)</span>
            </div>
          </div>
        </section>

        {/* Global Toast Alert */}
        {alert && (
          <div className={`toast-alert toast-${alert.type}`}>
            <span>{alert.message}</span>
            <button
              onClick={() => setAlert(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'currentColor', fontWeight: 'bold' }}
            >
              &times;
            </button>
          </div>
        )}

        {/* View Tabs */}
        {activeTab === 'architecture' ? (
          <div className="table-card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>System Architecture & Data Flow</h3>
            <div style={{ lineHeight: '1.7', color: '#334155' }}>
              <p><strong>1. Presentation Tier (Frontend):</strong> Built with React and Vite, hosted on Vercel. User interactions (create, view, search, update, delete) trigger HTTPS REST calls. The frontend never touches or stores the MongoDB URI.</p>
              <p style={{ marginTop: '0.75rem' }}><strong>2. Application Tier (Backend):</strong> Powered by Node.js and Express, hosted on Render. Configured with strict CORS policies, server-side data validation, and resilient MongoDB connection logic with backoff.</p>
              <p style={{ marginTop: '0.75rem' }}><strong>3. Database Tier (Data Storage):</strong> Managed MongoDB Atlas cluster hosting <code>studentDB</code> database and <code>students</code> collection. Access is guarded by user credentials and network security allowlists.</p>
              <div style={{ marginTop: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <p><strong>Active API Base URL:</strong> <code>{API_BASE_URL}</code></p>
                <p><strong>Backend Health Endpoint:</strong> <code>{API_BASE_URL}/api/health</code></p>
                <p><strong>Database Status:</strong> <code>{health?.dbState || 'unknown'}</code></p>
              </div>
            </div>
          </div>
        ) : (
          <StudentList
            students={students}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedDept={selectedDept}
            setSelectedDept={setSelectedDept}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onOpenAdd={handleOpenAdd}
          />
        )}

        {/* Add/Edit Modal */}
        {isFormOpen && (
          <StudentForm
            studentToEdit={editingStudent}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingStudent(null);
            }}
            loading={formLoading}
          />
        )}
      </main>
    </div>
  );
}
