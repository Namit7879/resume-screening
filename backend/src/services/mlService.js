const axios = require('axios');
const FormData = require('form-data');

/**
 * Sends PDF files and job description to the FastAPI ML service for analysis.
 * Uses form-data to construct multipart request using in-memory file buffers.
 */
const analyzeResumes = async (files, jobDescription, requiredSkills = []) => {
  const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
  const url = `${mlServiceUrl}/analyze`;
  
  const form = new FormData();
  form.append('job_description', jobDescription);
  if (requiredSkills && requiredSkills.length > 0) {
    form.append('required_skills', JSON.stringify(requiredSkills));
  }
  
  files.forEach((file) => {
    form.append('files', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
  });

  try {
    const response = await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error contacting ML Service:', error.message);
    if (error.response) {
      throw new Error(`ML Service Error: ${error.response.data.detail || error.response.statusText}`);
    }
    throw new Error('ML Service is currently unreachable. Please make sure the Python service is running.');
  }
};

module.exports = {
  analyzeResumes,
};
