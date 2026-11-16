import React from 'react';

export default function Navbar({ activeTab, setActiveTab, health, onRefreshHealth }) {
  const isHealthy = health && health.dbState === 'connected';

  return (
    <header className="navbar">
      <div className="nav-brand">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
          <path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
        <span>StudentSync Cloud</span>
      </div>

      <nav className="nav-links">
        <button
          className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          All Students
        </button>
        <button
          className={`nav-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          + Add Student
        </button>
        <button
          className={`nav-btn ${activeTab === 'architecture' ? 'active' : ''}`}
          onClick={() => setActiveTab('architecture')}
        >
          Architecture
        </button>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          className={`health-badge ${isHealthy ? 'connected' : 'disconnected'}`}
          title="Backend & DB Health Status"
          onClick={onRefreshHealth}
          style={{ cursor: 'pointer' }}
        >
          <span className="health-dot"></span>
          <span>{isHealthy ? 'Backend & DB Online' : health?.dbState ? `DB: ${health.dbState}` : 'Checking...'}</span>
        </div>
      </div>
    </header>
  );
}
