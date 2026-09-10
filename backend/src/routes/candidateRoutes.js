const express = require('express');
const router = express.Router();
const multer = require('multer');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const { analyzeResumes } = require('../services/mlService');

// Multer memory storage configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are supported!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit per file
  }
});

// @route   POST /api/candidates/upload
// @desc    Upload multiple resume PDFs, analyze them, and store results in DB
router.post('/upload', upload.array('resumes', 100), async (req, res) => {
  const { jobId } = req.body;

  if (!jobId) {
    return res.status(400).json({ error: 'Job ID is required.' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Please upload at least one PDF resume.' });
  }

  try {
    // 1. Find the Job Description
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job description not found.' });
    }

    // 2. Call ML Service with job description and its specific required skills
    const mlResults = await analyzeResumes(req.files, job.description, job.requiredSkills);

    // 3. Save to MongoDB
    const savedCandidates = [];
    for (const result of mlResults) {
      const candidate = new Candidate({
        jobId,
        name: result.name,
        email: result.email,
        phone: result.phone,
        filename: result.filename,
        matchScore: result.matchScore,
        rawSimilarity: result.rawSimilarity || 0.0,
        recommendationStatus: result.recommendationStatus || 'Not Recommended',
        skills: result.skills,
        missingSkills: result.missingSkills,
        coveragePercentage: result.coveragePercentage,
        summary: result.summary,
        explanation: result.explanation,
        rawText: result.rawText
      });

      const saved = await candidate.save();
      savedCandidates.push(saved);
    }

    res.status(201).json(savedCandidates);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Server error occurred during analysis.' });
  }
});

// @route   GET /api/candidates/job/:jobId
// @desc    Get all candidates for a specific job, sorted by rank (score descending)
router.get('/job/:jobId', async (req, res) => {
  try {
    const candidates = await Candidate.find({ jobId: req.params.jobId })
      .sort({ matchScore: -1 });

    // Ensure backwards compatibility and consistency for legacy records
    const enrichedCandidates = candidates.map((c) => {
      const doc = c.toObject();

      // Recalculate or synchronize recommendationStatus if missing or mismatched
      if (!doc.recommendationStatus || doc.recommendationStatus === 'Not Recommended') {
        if (doc.explanation && doc.explanation.startsWith('Strong Match')) {
          doc.recommendationStatus = 'Recommended (Shortlist)';
        } else if (doc.explanation && doc.explanation.startsWith('Moderate Match')) {
          doc.recommendationStatus = 'Screening Suggested';
        } else if (doc.coveragePercentage >= 75 || doc.matchScore >= 70) {
          doc.recommendationStatus = 'Recommended (Shortlist)';
        } else if (doc.coveragePercentage >= 50 || doc.matchScore >= 45) {
          doc.recommendationStatus = 'Screening Suggested';
        }
      }

      // If legacy candidate had raw similarity stored as matchScore (e.g. 17% with 100% coverage)
      if (doc.matchScore < 40 && doc.coveragePercentage >= 50) {
        const rawSim = doc.rawSimilarity || doc.matchScore;
        const normalizedSim = Math.min(rawSim * 2.5, 100.0);
        const composite = Math.round(((0.65 * doc.coveragePercentage) + (0.35 * normalizedSim)) * 10) / 10;
        doc.matchScore = composite;
      }

      return doc;
    }).sort((a, b) => b.matchScore - a.matchScore);

    res.json(enrichedCandidates);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// @route   DELETE /api/candidates/:id
// @desc    Delete a candidate record
router.delete('/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found.' });
    }
    res.json({ message: 'Candidate deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

module.exports = router;
