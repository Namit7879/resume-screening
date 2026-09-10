import React from 'react';
import { Users, BarChart3, TrendingUp, Award, CheckCircle } from 'lucide-react';

function Analytics({ candidates, activeJob }) {
  if (!activeJob) {
    return (
      <div className="card empty-state" style={{ padding: '4rem 2rem' }}>
        <BarChart3 className="empty-icon" size={48} />
        <h2>No Job Selected</h2>
        <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
          Please select a job description from the Job Manager tab to view matching analytics.
        </p>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="card empty-state" style={{ padding: '4rem 2rem' }}>
        <Users className="empty-icon" size={48} />
        <h2>No Candidates Available</h2>
        <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
          Upload PDF resumes in the Dashboard tab for <strong style={{ color: 'var(--primary)' }}>{activeJob.title}</strong> to view charts and statistics.
        </p>
      </div>
    );
  }

  // 1. Calculate General KPI metrics
  const totalCandidates = candidates.length;
  
  const avgScore = candidates.reduce((acc, c) => acc + c.matchScore, 0) / totalCandidates;
  const roundedAvgScore = Math.round(avgScore * 10) / 10;

  const topCandidate = candidates[0]; // candidates are sorted desc by matchScore

  // 2. Calculate Skill Distribution
  // Count frequency of each skill among candidates
  const skillCounts = {};
  candidates.forEach(c => {
    c.skills.forEach(skill => {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
  });

  // Convert to sorted array of { skill, count }
  const skillDistribution = Object.keys(skillCounts)
    .map(skill => ({ skill, count: skillCounts[skill] }))
    .sort((a, b) => b.count - a.count);

  // 3. Score Segments (aligned with Recommendation Status and Composite Scores)
  const isHigh = (c) => c.recommendationStatus === 'Recommended (Shortlist)' || c.matchScore >= 70;
  const isMid = (c) => !isHigh(c) && (c.recommendationStatus === 'Screening Suggested' || c.matchScore >= 45);
  const isLow = (c) => !isHigh(c) && !isMid(c);

  const highMatchCount = candidates.filter(isHigh).length;
  const midMatchCount = candidates.filter(isMid).length;
  const lowMatchCount = candidates.filter(isLow).length;

  const highPct = (highMatchCount / totalCandidates) * 100;
  const midPct = (midMatchCount / totalCandidates) * 100;
  const lowPct = (lowMatchCount / totalCandidates) * 100;

  // Max count of any skill for charting scaling
  const maxSkillCount = skillDistribution.length > 0 ? Math.max(...skillDistribution.map(s => s.count)) : 1;

  return (
    <div>
      {/* Metric Cards Row */}
      <div className="metrics-grid">
        {/* Metric 1 */}
        <div className="metric-card">
          <div className="metric-info">
            <h3>Total Candidates</h3>
            <div className="metric-value">{totalCandidates}</div>
          </div>
          <div className="metric-icon">
            <Users size={24} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="metric-card">
          <div className="metric-info">
            <h3>Average Match Score</h3>
            <div className="metric-value">{roundedAvgScore}%</div>
          </div>
          <div className="metric-icon warning">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="metric-card">
          <div className="metric-info">
            <h3>Top Candidate</h3>
            <div className="metric-value" style={{ fontSize: '1.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px', marginTop: '0.25rem' }}>
              {topCandidate ? topCandidate.name : 'N/A'}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
              Score: {topCandidate ? Math.round(topCandidate.matchScore) : 0}%
            </span>
          </div>
          <div className="metric-icon success">
            <Award size={24} />
          </div>
        </div>
      </div>

      <div className="dashboard-layout">
        {/* Left Column: Skill Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <BarChart3 size={18} />
              Prevalent Candidate Skills
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Frequency of extracted skills in talent pool
            </span>
          </div>

          {skillDistribution.length === 0 ? (
            <div className="empty-state">
              <p>No skills extracted from resumes.</p>
            </div>
          ) : (
            <div className="svg-chart-container" style={{ padding: '0.5rem 0' }}>
              {skillDistribution.map((item) => {
                const widthPercent = (item.count / maxSkillCount) * 100;
                const isRequired = activeJob.requiredSkills.includes(item.skill);
                return (
                  <div key={item.skill} className="svg-bar-row">
                    <div className="svg-bar-label">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {item.skill}
                        {isRequired && (
                          <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', padding: '0.1rem 0.3rem', borderRadius: '3px', fontWeight: 700 }}>
                            Required
                          </span>
                        )}
                      </span>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {item.count} {item.count === 1 ? 'candidate' : 'candidates'}
                      </strong>
                    </div>
                    <div className="svg-bar-track">
                      <div
                        className="svg-bar-fill"
                        style={{
                          width: `${widthPercent}%`,
                          background: isRequired
                            ? 'linear-gradient(90deg, var(--primary), #a5b4fc)'
                            : 'linear-gradient(90deg, #4b5563, #9ca3af)'
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Match Score Segments */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header">
              <h3 className="card-title">
                <CheckCircle size={18} />
                Candidate Score Distribution
              </h3>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Breakdown of candidates by similarity matching categories.
            </p>

            {/* Score segment breakdown items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* High Match */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></span>
                    Strong Matches (Shortlist)
                  </span>
                  <span>{highMatchCount} ({Math.round(highPct)}%)</span>
                </div>
                <div className="svg-bar-track">
                  <div className="svg-bar-fill" style={{ width: `${highPct}%`, background: 'var(--success)' }}></div>
                </div>
              </div>

              {/* Mid Match */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--warning)' }}></span>
                    Moderate Matches (Screening)
                  </span>
                  <span>{midMatchCount} ({Math.round(midPct)}%)</span>
                </div>
                <div className="svg-bar-track">
                  <div className="svg-bar-fill" style={{ width: `${midPct}%`, background: 'var(--warning)' }}></div>
                </div>
              </div>

              {/* Low Match */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--danger)' }}></span>
                    Low Matches (Not Recommended)
                  </span>
                  <span>{lowMatchCount} ({Math.round(lowPct)}%)</span>
                </div>
                <div className="svg-bar-track">
                  <div className="svg-bar-fill" style={{ width: `${lowPct}%`, background: 'var(--danger)' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.25rem', fontWeight: 600 }}>Hiring Insights</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {highMatchCount > 0 
                ? `You have ${highMatchCount} high-matching candidate(s) for the ${activeJob.title} position. Focus technical interview efforts on these profiles first.` 
                : 'No candidates have achieved a match score above 75% yet. Consider expanding the sourcing channels or refining the job description constraints.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
