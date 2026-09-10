import React, { useState, useEffect } from 'react';
import { Briefcase, Users, BarChart3, Settings, ShieldAlert, Sparkles } from 'lucide-react';

// Components
import JobManager from './components/JobManager';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import CandidateDetail from './components/CandidateDetail';

function App() {
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  
  // API Fetch State
  const [jobsLoading, setJobsLoading] = useState(true);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  
  // Toast notifications
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: 'success', message: '' }), 4000);
  };

  // 1. Fetch Job Listings on mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setJobsLoading(true);
        const response = await fetch('/api/jobs');
        if (!response.ok) throw new Error('Could not fetch jobs from server.');
        const data = await response.json();
        setJobs(data);
        if (data.length > 0) {
          setActiveJob(data[0]);
        }
      } catch (err) {
        setApiError('Unable to connect to Node backend. Verify it is running on port 5000.');
        console.error(err);
      } finally {
        setJobsLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // 2. Fetch Candidates when activeJob changes
  useEffect(() => {
    const fetchCandidates = async () => {
      if (!activeJob) {
        setCandidates([]);
        return;
      }
      try {
        setCandidatesLoading(true);
        setSelectedCandidate(null); // Reset detail view
        const response = await fetch(`/api/candidates/job/${activeJob._id}`);
        if (!response.ok) throw new Error('Could not fetch candidate rankings.');
        const data = await response.json();
        setCandidates(data);
      } catch (err) {
        showToast('Failed to load candidate list.', 'danger');
        console.error(err);
      } finally {
        setCandidatesLoading(false);
      }
    };
    fetchCandidates();
  }, [activeJob]);

  // Handle new job creation from JobManager
  const handleCreateJob = (newJob) => {
    setJobs(prev => [newJob, ...prev]);
    setActiveJob(newJob);
    setActiveTab('dashboard'); // Redirect to dashboard to upload resumes
    showToast('Job opening created! Now upload resumes.', 'success');
  };

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <header className="navbar">
        <div className="brand">
          <Sparkles size={20} style={{ color: 'var(--primary)' }} />
          <span>TalentIntel AI</span>
        </div>
        
        <nav className="nav-links">
          <button
            className={`nav-link ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('jobs');
              setSelectedCandidate(null);
            }}
          >
            <Briefcase size={16} />
            Jobs Manager
          </button>
          
          <button
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            disabled={!activeJob}
            style={{ opacity: !activeJob ? 0.5 : 1, cursor: !activeJob ? 'not-allowed' : 'pointer' }}
            title={!activeJob ? 'Please add a job first' : 'View candidates'}
          >
            <Users size={16} />
            Recruiter Dashboard
          </button>
          
          <button
            className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('analytics');
              setSelectedCandidate(null);
            }}
            disabled={!activeJob || candidates.length === 0}
            style={{ opacity: !activeJob || candidates.length === 0 ? 0.5 : 1, cursor: !activeJob || candidates.length === 0 ? 'not-allowed' : 'pointer' }}
            title={candidates.length === 0 ? 'Upload candidates to unlock' : 'View charts'}
          >
            <BarChart3 size={16} />
            Hiring Analytics
          </button>
        </nav>
      </header>

      {/* Global API Connection Warning */}
      {apiError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 2rem', backgroundColor: 'var(--danger-glow)', borderBottom: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', fontSize: '0.875rem' }}>
          <ShieldAlert size={18} />
          <strong>System Connection Offline:</strong> {apiError}
        </div>
      )}

      {/* Main Page Area */}
      <main className="main-content">
        {jobsLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Initializing Talent Intelligence System...</p>
          </div>
        ) : selectedCandidate ? (
          /* Drill-down Candidate Detail View takes precedence */
          <CandidateDetail
            candidate={selectedCandidate}
            activeJob={activeJob}
            onClose={() => setSelectedCandidate(null)}
          />
        ) : (
          /* Standard Tabs */
          <>
            {activeTab === 'jobs' && (
              <>
                <h1 className="page-title">Positions & Job Descriptions</h1>
                <p className="page-subtitle">Configure jobs to extract baseline skill profiles and run similarity matching.</p>
                <JobManager
                  jobs={jobs}
                  activeJob={activeJob}
                  setActiveJob={setActiveJob}
                  onCreateJob={handleCreateJob}
                />
              </>
            )}

            {activeTab === 'dashboard' && (
              <>
                <h1 className="page-title">Candidate Sourcing & Screening</h1>
                <p className="page-subtitle">
                  Screening resumes for: <strong style={{ color: 'var(--primary)' }}>{activeJob?.title}</strong>
                </p>
                {candidatesLoading ? (
                  <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading candidate rankings...</p>
                  </div>
                ) : (
                  <Dashboard
                    activeJob={activeJob}
                    candidates={candidates}
                    setCandidates={setCandidates}
                    onSelectCandidate={(candidate) => setSelectedCandidate(candidate)}
                  />
                )}
              </>
            )}

            {activeTab === 'analytics' && (
              <>
                <h1 className="page-title">Hiring Insights & Statistics</h1>
                <p className="page-subtitle">
                  Visual metrics and distributions for <strong style={{ color: 'var(--primary)' }}>{activeJob?.title}</strong>
                </p>
                <Analytics
                  candidates={candidates}
                  activeJob={activeJob}
                />
              </>
            )}
          </>
        )}
      </main>

      {/* Toast Notification Alert */}
      {toast.show && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? (
            <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
          ) : (
            <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>✗</span>
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default App;
