import React, { useState } from 'react';
import { Briefcase, Plus, FileText, CheckCircle, X, Sparkles } from 'lucide-react';

const COMMON_TECH_SKILLS = [
  'Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'SQL',
  'React', 'Next.js', 'Vue.js', 'Angular', 'Tailwind CSS', 'Bootstrap', 'Node.js', 'Express.js', 'Django', 'FastAPI',
  'Spring Boot', 'ASP.NET', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
  'Terraform', 'CI/CD', 'Linux', 'Git', 'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Scikit-learn',
  'Pandas', 'NumPy', 'Tableau', 'Power BI', 'LLMs', 'LangChain', 'Data Analytics', 'Flutter', 'React Native'
];

function JobManager({ jobs, activeJob, setActiveJob, onCreateJob }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillsList, setSkillsList] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleAddSkill = (e) => {
    if (e) e.preventDefault();
    if (!skillInput.trim()) return;
    const parts = skillInput.split(',').map(s => s.trim()).filter(s => s && !skillsList.includes(s));
    if (parts.length > 0) {
      setSkillsList(prev => [...prev, ...parts]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkillsList(prev => prev.filter(s => s !== skillToRemove));
  };

  const handleAutoDetect = () => {
    if (!description.trim()) {
      setError('Please enter a job description first to auto-detect skills.');
      return;
    }
    const lowerDesc = description.toLowerCase();
    const detected = [];
    COMMON_TECH_SKILLS.forEach(skill => {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lowerDesc) && !skillsList.includes(skill)) {
        detected.push(skill);
      }
    });

    if (detected.length > 0) {
      setSkillsList(prev => [...new Set([...prev, ...detected])]);
      setError('');
    } else {
      setError('No predefined skills found in the text. You can type and add custom skills below.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please fill in both the Job Title and Description.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          description,
          requiredSkills: skillsList 
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create job.');
      }

      const newJob = await response.json();
      onCreateJob(newJob);
      setTitle('');
      setDescription('');
      setSkillsList([]);
      setSkillInput('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: jobs.length > 0 ? '1fr' : '1fr', gap: '1.5rem' }}>
      <div className="dashboard-layout">
        {/* Job Listings Column */}
        <div>
          <div className="card" style={{ height: '100%', marginBottom: 0 }}>
            <div className="card-header">
              <h3 className="card-title">
                <Briefcase size={18} />
                Job Openings ({jobs.length})
              </h3>
            </div>
            
            {jobs.length === 0 ? (
              <div className="empty-state">
                <Briefcase className="empty-icon" size={36} />
                <p>No job descriptions added yet. Create one on the right to get started!</p>
              </div>
            ) : (
              <div style={{ maxHeight: '560px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {jobs.map((job) => (
                  <div
                    key={job._id}
                    className={`job-item ${activeJob?._id === job._id ? 'active' : ''}`}
                    onClick={() => setActiveJob(job)}
                  >
                    <div className="job-item-info">
                      <h4>{job.title}</h4>
                      <div className="job-item-meta">
                        <span>
                          Added: {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                        <span>
                          Skills: {job.requiredSkills?.length || 0} required
                        </span>
                      </div>
                      <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {job.requiredSkills?.map((skill) => (
                          <span key={skill} className="skill-tag match">{skill}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Job Column */}
        <div>
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <h3 className="card-title">
                <Plus size={18} />
                Add New Job Description
              </h3>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-glow)', border: '1px solid rgba(239,68,68,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ color: 'var(--success)', backgroundColor: 'var(--success-glow)', border: '1px solid rgba(16,185,129,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={16} />
                  Job description created successfully!
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Job Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Senior Machine Learning Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Job Description</label>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                    onClick={handleAutoDetect}
                    disabled={loading || !description.trim()}
                    title="Auto-detect skills from description text"
                  >
                    <Sparkles size={12} />
                    Auto-Detect Skills
                  </button>
                </div>
                <textarea
                  className="form-textarea"
                  placeholder="Paste any job description here. Works dynamically for any role or industry."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  rows={6}
                ></textarea>
              </div>

              {/* Dynamic Required Skills Tag Input */}
              <div className="form-group">
                <label className="form-label">
                  Required Technical Skills ({skillsList.length})
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Type custom skill(s) e.g. PyTorch, LangChain, Solidity..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleAddSkill}
                    disabled={loading || !skillInput.trim()}
                  >
                    Add
                  </button>
                </div>

                {skillsList.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)' }}>
                    {skillsList.map((skill) => (
                      <span key={skill} className="skill-tag match" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        {skill}
                        <X
                          size={12}
                          style={{ cursor: 'pointer', opacity: 0.7 }}
                          onClick={() => handleRemoveSkill(skill)}
                        />
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Tip: Add custom required skills above, or click "Auto-Detect Skills" to scan the description automatically.
                  </span>
                )}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
                {loading ? 'Processing...' : 'Create & Save Job Opening'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobManager;
