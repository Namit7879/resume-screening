const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    default: 'N/A'
  },
  phone: {
    type: String,
    default: 'N/A'
  },
  filename: {
    type: String,
    required: true
  },
  matchScore: {
    type: Number,
    required: true
  },
  rawSimilarity: {
    type: Number,
    default: 0.0
  },
  recommendationStatus: {
    type: String,
    enum: ['Recommended (Shortlist)', 'Screening Suggested', 'Not Recommended'],
    default: 'Not Recommended'
  },
  skills: {
    type: [String],
    default: []
  },
  missingSkills: {
    type: [String],
    default: []
  },
  coveragePercentage: {
    type: Number,
    required: true
  },
  summary: {
    type: String,
    default: ''
  },
  explanation: {
    type: String,
    default: ''
  },
  rawText: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Candidate', CandidateSchema);
