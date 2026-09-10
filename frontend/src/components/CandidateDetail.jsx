import React, { useState } from 'react';
import { User, Mail, Phone, ArrowLeft, CheckCircle2, AlertCircle, FileText, Check, AlertTriangle } from 'lucide-react';

function CandidateDetail({ candidate, activeJob, onClose }) {
  const [showRawText, setShowRawText] = useState(false);

  if (!candidate || !activeJob) return null;

  // Calculate circular stroke dashboard gauge offset
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (candidate.matchScore / 100) * circumference;

  // Determine unified recommendation status with graceful fallback
  const getRecommendationStatus = () => {
    if (candidate.recommendationStatus && candidate.recommendationStatus !== 'Not Recommended') {
      return candidate.recommendationStatus;
    }
    // Check explanation or coverage for backwards compatibility
    if (candidate.explanation && candidate.explanation.startsWith('Strong Match')) {
      return 'Recommended (Shortlist)';
    }
    if (candidate.explanation && candidate.explanation.startsWith('Moderate Match')) {
      return 'Screening Suggested';
    }
    if (candidate.matchScore >= 70 || candidate.coveragePercentage >= 75) {
      return 'Recommended (Shortlist)';
    }
    if (candidate.matchScore >= 45 || candidate.coveragePercentage >= 50) {
      return 'Screening Suggested';
    }
    return candidate.recommendationStatus || 'Not Recommended';
  };

  const statusText = getRecommendationStatus();

  // Status color resolver
  const getStatusColor = (status) => {
    if (status.includes('Recommended') || status.includes('Shortlist')) return 'var(--success)';
    if (status.includes('Screening')) return 'var(--warning)';
    return 'var(--danger)';
  };

  const statusColor = getStatusColor(statusText);

  // Coverage color (independent of matchScore)
  const getCoverageColor = (cov) => {
    if (cov >= 75) return 'var(--success)';
    if (cov >= 50) return 'var(--warning)';
    return 'var(--danger)';
  };

  const coverageColor = getCoverageColor(candidate.coveragePercentage);

  // Score colors for gauge
  const getScoreColor = (score) => {
    if (score >= 70 || statusText === 'Recommended (Shortlist)') return 'var(--success)';
    if (score >= 45 || statusText === 'Screening Suggested') return 'var(--warning)';
    return 'var(--danger)';
  };

  const scoreColor = getScoreColor(candidate.matchScore);

  return (
    <div className="card" style={{ padding: '2rem' }}>
      {/* Header Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--surface-border)' }}>
        <button className="btn btn-secondary" onClick={onClose}>
          <ArrowLeft size={16} />
          Back to List
        </button>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Candidate Profile &mdash; <strong style={{ color: 'var(--primary)' }}>{candidate.name}</strong>
        </span>
      </div>

      <div className="detail-grid">
        {/* Left Column: Quick Stats, Contact, Skill Gap Ring */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Circular Score Gauge Card */}
          <div className="card" style={{ backgroundColor: 'rgba(9, 10, 15, 0.4)', textAlign: 'center', padding: '2rem 1.5rem', marginBottom: 0 }}>
            <div className="radial-gauge">
              <svg width="150" height="150" viewBox="0 0 150 150" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Ring */}
                <circle
                  cx="75"
                  cy="75"
                  r={radius}
                  fill="transparent"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="12"
                />
                {/* Filled Gauge */}
                <circle
                  cx="75"
                  cy="75"
                  r={radius}
                  fill="transparent"
                  stroke={scoreColor}
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
              </svg>
              <div className="radial-gauge-text">
                <span className="radial-gauge-value">{Math.round(candidate.matchScore)}%</span>
                <div className="radial-gauge-label">Match Score</div>
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Recommendation Status
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: statusColor, marginTop: '0.25rem' }}>
                {statusText}
              </div>
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="card" style={{ backgroundColor: 'rgba(9, 10, 15, 0.4)', marginBottom: 0 }}>
            <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={16} />
              Contact Information
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Mail size={14} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ wordBreak: 'break-all' }}>{candidate.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Phone size={14} style={{ color: 'var(--text-secondary)' }} />
                <span>{candidate.phone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileText size={14} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={candidate.filename}>
                  {candidate.filename}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Skill Gap Analysis, Recommendation, Summary, Raw Text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Skill Gap Analysis Card */}
          <div className="card" style={{ backgroundColor: 'rgba(9, 10, 15, 0.4)', marginBottom: 0 }}>
            <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
              Skill Gap & Coverage Analysis
            </h3>
            
            {/* Skill Coverage Progress Bar */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                <span>Job Skill Coverage</span>
                <span style={{ color: coverageColor }}>{candidate.coveragePercentage}%</span>
              </div>
              <div className="svg-bar-track" style={{ height: '10px' }}>
                <div 
                  className="svg-bar-fill" 
                  style={{ 
                    width: `${candidate.coveragePercentage}%`,
                    background: `linear-gradient(90deg, ${coverageColor}, #a5b4fc)`
                  }}
                ></div>
              </div>
            </div>

            {/* Side-by-side Skill Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              {/* Matching Skills */}
              <div style={{ border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: 'var(--radius-sm)', padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.02)' }}>
                <h4 style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <CheckCircle2 size={16} />
                  Matching Skills ({activeJob.requiredSkills.filter(s => candidate.skills.includes(s)).length})
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {activeJob.requiredSkills.filter(s => candidate.skills.includes(s)).map(skill => (
                    <span key={skill} className="skill-tag match">
                      {skill}
                    </span>
                  ))}
                  {activeJob.requiredSkills.filter(s => candidate.skills.includes(s)).length === 0 && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No required skills matched.</span>
                  )}
                </div>
              </div>

              {/* Missing Skills */}
              <div style={{ border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: 'var(--radius-sm)', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
                <h4 style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <AlertCircle size={16} />
                  Missing Required Skills ({candidate.missingSkills.length})
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {candidate.missingSkills.map(skill => (
                    <span key={skill} className="skill-tag missing">
                      {skill}
                    </span>
                  ))}
                  {candidate.missingSkills.length === 0 && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>All required skills are covered!</span>
                  )}
                </div>
              </div>
            </div>

            {/* Other Extra Skills */}
            {candidate.skills.filter(s => !activeJob.requiredSkills.includes(s)).length > 0 && (
              <div style={{ marginTop: '1rem', padding: '0.5rem' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Additional Skills Extracted:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {candidate.skills.filter(s => !activeJob.requiredSkills.includes(s)).map(skill => (
                    <span key={skill} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Assessment & Recommendation */}
          <div className="card" style={{ backgroundColor: 'rgba(9, 10, 15, 0.4)', marginBottom: 0 }}>
            <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
              AI Candidate Assessment
            </h3>
            
            {/* Recommendation Explanation */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>Recommendation Details:</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${statusColor}` }}>
                {candidate.explanation}
              </p>
            </div>

            {/* Resume Extractive Summary */}
            <div>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>Resume Summary (Extracted Highlights):</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, fontStyle: 'italic', backgroundColor: 'rgba(255,255,255,0.01)', padding: '1rem', border: '1px dashed var(--surface-border)', borderRadius: 'var(--radius-sm)' }}>
                &ldquo;{candidate.summary}&rdquo;
              </p>
            </div>
          </div>

          {/* Collapsible Raw Resume Text */}
          <div className="card" style={{ backgroundColor: 'rgba(9, 10, 15, 0.4)', marginBottom: 0 }}>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'space-between', fontSize: '0.85rem' }}
              onClick={() => setShowRawText(!showRawText)}
            >
              <span>{showRawText ? 'Hide Raw Extracted Resume Text' : 'View Raw Extracted Resume Text'}</span>
              <span>{showRawText ? '▲' : '▼'}</span>
            </button>
            
            {showRawText && (
              <div style={{ marginTop: '1rem', backgroundColor: '#05060b', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', padding: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                <pre style={{ fontFamily: 'Courier New, Courier, monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', margin: 0 }}>
                  {candidate.rawText}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CandidateDetail;
