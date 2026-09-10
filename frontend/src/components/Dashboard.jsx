import React, { useState, useRef } from 'react';
import { Upload, Search, Download, Trash2, User, Mail, Phone, FileText, Check, AlertTriangle, ArrowRight, Eye, ChevronRight } from 'lucide-react';

function Dashboard({ activeJob, candidates, setCandidates, onSelectCandidate }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadFiles, setUploadFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [skillFilter, setSkillFilter] = useState('');
  
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const pdfs = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
      if (pdfs.length > 0) {
        setUploadFiles(prev => [...prev, ...pdfs]);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const pdfs = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
      if (pdfs.length > 0) {
        setUploadFiles(prev => [...prev, ...pdfs]);
      }
    }
  };

  const removeQueuedFile = (index) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (uploadFiles.length === 0) {
      setUploadError('Please select at least one PDF resume to upload.');
      return;
    }
    if (!activeJob) {
      setUploadError('Please select a Job opening first.');
      return;
    }

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('jobId', activeJob._id);
    uploadFiles.forEach(file => {
      formData.append('resumes', file);
    });

    try {
      const response = await fetch('/api/candidates/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to analyze resumes.');
      }

      const newCandidates = await response.json();
      setCandidates(prev => [...newCandidates, ...prev].sort((a, b) => b.matchScore - a.matchScore));
      setUploadFiles([]);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCandidate = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this candidate?')) return;

    try {
      const response = await fetch(`/api/candidates/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setCandidates(prev => prev.filter(c => c._id !== id));
      }
    } catch (error) {
      console.error('Error deleting candidate:', error);
    }
  };

  // Export report as CSV
  const handleExportCSV = () => {
    if (candidates.length === 0) return;
    
    const headers = ['Rank', 'Name', 'Email', 'Phone', 'Match Score (%)', 'Skill Coverage (%)', 'Recommendation', 'Matching Skills', 'Missing Skills', 'Resume Summary'];
    const rows = filteredCandidates.map((c, idx) => {
      const recStatus = c.recommendationStatus || (c.matchScore >= 70 ? 'Recommended (Shortlist)' : c.matchScore >= 45 ? 'Screening Suggested' : 'Not Recommended');
      return [
        idx + 1,
        `"${c.name}"`,
        `"${c.email}"`,
        `"${c.phone}"`,
        c.matchScore,
        c.coveragePercentage,
        `"${recStatus}"`,
        `"${c.skills.join(', ')}"`,
        `"${c.missingSkills.join(', ')}"`,
        `"${c.summary.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeJob.title.replace(/\s+/g, '_')}_Candidate_Ranking.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Score badge class resolver
  const getScoreClass = (score) => {
    if (score >= 70) return 'high';
    if (score >= 45) return 'mid';
    return 'low';
  };

  // Filtering Logic
  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesScore = c.matchScore >= minScore;
    const matchesSkill = skillFilter === '' || c.skills.includes(skillFilter);
    return matchesSearch && matchesScore && matchesSkill;
  });

  return (
    <div>
      {!activeJob ? (
        <div className="card empty-state" style={{ padding: '4rem 2rem' }}>
          <FileText className="empty-icon" size={48} />
          <h2>Select or Create a Job</h2>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
            To screen and rank candidates, you first need to choose a Job Opening from the Job Manager tab.
          </p>
        </div>
      ) : (
        <div className="dashboard-layout">
          {/* Main Area */}
          <div>
            {/* Filter Bar */}
            <div className="filter-bar">
              <div className="filter-inputs">
                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search by candidate name or skill..."
                    style={{ paddingLeft: '2.25rem', width: '260px' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Score Filter */}
                <div>
                  <select
                    className="form-select"
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                  >
                    <option value={0}>Min Match Score: Any</option>
                    <option value={50}>Min Match Score: 50%+</option>
                    <option value={70}>Min Match Score: 70%+</option>
                    <option value={80}>Min Match Score: 80%+</option>
                  </select>
                </div>

                {/* Skill Filter */}
                <div>
                  <select
                    className="form-select"
                    value={skillFilter}
                    onChange={(e) => setSkillFilter(e.target.value)}
                  >
                    <option value="">Skill Filter: All</option>
                    {activeJob.requiredSkills?.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CSV Export */}
              {candidates.length > 0 && (
                <button className="btn btn-secondary" onClick={handleExportCSV}>
                  <Download size={16} />
                  Export Report
                </button>
              )}
            </div>

            {/* Candidates Table Card */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <User size={18} />
                  Screened Candidates ({filteredCandidates.length})
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Active Job: <strong style={{ color: 'var(--primary)' }}>{activeJob.title}</strong>
                </span>
              </div>

              {filteredCandidates.length === 0 ? (
                <div className="empty-state">
                  <User className="empty-icon" size={32} />
                  <p>No candidates found matching the filters or uploaded yet.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="candidate-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>Rank</th>
                        <th>Candidate Name</th>
                        <th style={{ textAlign: 'center' }}>Match Score</th>
                        <th style={{ textAlign: 'center' }}>Skill Coverage</th>
                        <th>Skills Matching</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCandidates.map((candidate, index) => {
                        const scoreClass = getScoreClass(candidate.matchScore);
                        return (
                          <tr
                            key={candidate._id}
                            style={{ cursor: 'pointer' }}
                            onClick={() => onSelectCandidate(candidate)}
                          >
                            <td style={{ fontWeight: 700, paddingLeft: '1.25rem' }}>
                              #{index + 1}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{candidate.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{candidate.email}</div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`score-badge ${scoreClass}`}>
                                {Math.round(candidate.matchScore)}%
                              </span>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 600 }}>
                              <span style={{ color: candidate.coveragePercentage >= 70 ? 'var(--success)' : candidate.coveragePercentage >= 40 ? 'var(--warning)' : 'var(--danger)' }}>
                                {candidate.coveragePercentage}%
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', maxWidth: '350px' }}>
                                {candidate.skills.slice(0, 5).map(skill => {
                                  const isRequired = activeJob.requiredSkills.includes(skill);
                                  return (
                                    <span key={skill} className={`skill-tag ${isRequired ? 'match' : ''}`}>
                                      {skill}
                                    </span>
                                  );
                                })}
                                {candidate.skills.length > 5 && (
                                  <span className="skill-tag" style={{ color: 'var(--text-muted)' }}>
                                    +{candidate.skills.length - 5} more
                                  </span>
                                )}
                              </div>
                            </td>
                            <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '0.4rem', borderRadius: '4px' }}
                                  title="View Full Profile"
                                  onClick={() => onSelectCandidate(candidate)}
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  className="btn btn-danger"
                                  style={{ padding: '0.4rem', borderRadius: '4px' }}
                                  title="Delete Record"
                                  onClick={(e) => handleDeleteCandidate(candidate._id, e)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Area: Upload Resume Panel */}
          <div>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <Upload size={18} />
                  Upload Resumes (PDF)
                </h3>
              </div>

              <form onSubmit={handleUploadSubmit}>
                {uploadError && (
                  <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-glow)', border: '1px solid rgba(239,68,68,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                    {uploadError}
                  </div>
                )}

                <div
                  className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={32} className="upload-icon" />
                  <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Drag & drop PDFs here</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>or click to browse local files</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </div>

                {uploadFiles.length > 0 && (
                  <div className="file-list">
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Selected Files ({uploadFiles.length}):</p>
                    {uploadFiles.map((file, idx) => (
                      <div key={idx} className="file-list-item">
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                          {file.name}
                        </span>
                        <button
                          type="button"
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeQueuedFile(idx);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1.5rem' }}
                  disabled={uploading || uploadFiles.length === 0}
                >
                  {uploading ? (
                    <>
                      <div className="spinner" style={{ marginRight: '0.5rem' }}></div>
                      Analyzing Resumes...
                    </>
                  ) : (
                    'Run AI Analysis'
                  )}
                </button>
              </form>
            </div>
            
            {/* Quick Helper Guide */}
            <div className="card" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', borderStyle: 'dotted' }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Quick Tip</h4>
              <p>The system uses TF-IDF and Cosine Similarity to compare the parsed text from uploaded resumes against the job description. The resulting score demonstrates how closely the candidate's keywords match the job requirements.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
