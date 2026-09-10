const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BACKEND_URL = 'http://localhost:5000';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runVerification() {
  console.log('=== STARTING END-TO-END SYSTEM VERIFICATION ===');

  try {
    // 1. Create a job description
    console.log('\n[1/4] Creating job description on backend...');
    const jobPayload = {
      title: 'Senior Software Engineer (Python & React)',
      description: `
        We are seeking a Senior Software Engineer to build scalable web applications.
        Required Skills: Python, React, MongoDB, Docker, SQL, and Git.
        You will write clean API routes using Node.js or Python, design database models in MongoDB, 
        and build user interfaces using React. Docker and Git are required for our development workflows.
      `
    };

    const jobResponse = await axios.post(`${BACKEND_URL}/api/jobs`, jobPayload);
    const job = jobResponse.data;
    console.log(`Successfully created Job! ID: ${job._id}`);
    console.log(`Auto-Extracted Job Required Skills: ${JSON.stringify(job.requiredSkills)}`);

    // 2. Prepare candidate resumes for upload
    console.log('\n[2/4] Loading PDF resumes from sample_resumes/ folder...');
    const sampleDir = path.join(__dirname, 'sample_resumes');
    const files = [
      'alice_smith_resume.pdf',
      'bob_johnson_resume.pdf',
      'charlie_brown_resume.pdf'
    ];

    const form = new FormData();
    form.append('jobId', job._id);

    files.forEach(filename => {
      const filePath = path.join(sampleDir, filename);
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}. Run generate_test_resumes.py first.`);
      }
      form.append('resumes', fs.createReadStream(filePath), filename);
      console.log(`  Added: ${filename}`);
    });

    // 3. Upload and trigger AI analysis
    console.log('\n[3/4] Uploading resumes and running ML matching (TF-IDF + Cosine Similarity)...');
    const uploadResponse = await axios.post(`${BACKEND_URL}/api/candidates/upload`, form, {
      headers: {
        ...form.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log(`Successfully analyzed and saved ${uploadResponse.data.length} candidates in MongoDB!`);

    // 4. Retrieve candidate rankings
    console.log('\n[4/4] Retrieving candidate ranking report sorted by Match Score...');
    const rankingsResponse = await axios.get(`${BACKEND_URL}/api/candidates/job/${job._id}`);
    const candidates = rankingsResponse.data;

    console.log('\n=====================================================================');
    console.log(`                     CANDIDATE RANKING REPORT                        `);
    console.log(` Job Title: ${job.title}                                             `);
    console.log(` Required Skills: ${job.requiredSkills.join(', ')}                     `);
    console.log('=====================================================================');

    candidates.forEach((cand, idx) => {
      console.log(`\nRank #${idx + 1}: ${cand.name}`);
      console.log(`  Filename:           ${cand.filename}`);
      console.log(`  Email/Phone:        ${cand.email} / ${cand.phone}`);
      console.log(`  Similarity Score:   ${cand.matchScore}%`);
      console.log(`  Skill Coverage:     ${cand.coveragePercentage}%`);
      console.log(`  Matching Skills:    [${cand.skills.filter(s => job.requiredSkills.includes(s)).join(', ')}]`);
      console.log(`  Missing Skills:     [${cand.missingSkills.join(', ')}]`);
      console.log(`  Extractive Summary: "${cand.summary}"`);
      console.log(`  AI Recommendation:  ${cand.explanation}`);
      console.log('---------------------------------------------------------------------');
    });

    console.log('\n=== VERIFICATION SUCCESSFULLY COMPLETED ===');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Verification Failed:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

// Allow servers to be fully listening
setTimeout(runVerification, 1000);
