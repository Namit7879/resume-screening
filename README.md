# AI Resume Screening & Candidate Ranking System

A modern, full-stack Talent Intelligence platform that matches, parses, and ranks candidate resumes against job descriptions using Natural Language Processing (NLP). 

The application utilizes **FastAPI** for core ML tasks (text extraction, keyword analysis, TF-IDF cosine similarity, and extractive summarization), an **Express & MongoDB** backend for persistence, and a modern **React (Vite)** dashboard.

---

## Features

1. **Job Description Configuration**: Define job roles and auto-extract required technical skills.
2. **Resume Batch Upload**: Upload multiple PDF resumes simultaneously.
3. **AI Candidate Matching**: Compute exact similarity scores between 0% and 100% using TF-IDF vectorization and cosine similarity.
4. **Skill Gap Analysis**: Visual highlights of matching vs. missing skills, plus coverage percentages.
5. **Extractive Resume Summaries**: AI-driven context extraction highlighting the most relevant parts of the candidate's resume relative to the job description.
6. **Detailed Candidate Profiles**: Drill-down view with radial match gauges, candidate details, recommendation explanations, and raw extracted text.
7. **Hiring Insights Dashboard**: Metrics charts illustrating total candidates, average match score, top candidate, score spreads, and skill distribution frequencies.
8. **Filtering & Sourcing Tools**: Filter candidate rankings dynamically by match score and required skills, and download CSV reports.

---

## Folder Structure

```
resume_screening/
├── backend/                  # Node.js + Express.js REST API
│   ├── src/
│   │   ├── config/db.js      # MongoDB Mongoose connector
│   │   ├── models/           # Mongoose schemas (Job, Candidate)
│   │   ├── routes/           # REST endpoints
│   │   ├── services/         # ML Service integration bridge
│   │   └── server.js         # Entry point
│   ├── .env                  # Configuration variables
│   └── package.json
├── ml_service/               # Python ML API (FastAPI)
│   ├── utils/
│   │   └── nlp_utils.py      # PDF parsing, TF-IDF, skill dictionary matching, summarization
│   ├── app.py                # FastAPI endpoints
│   ├── test_ml.py            # Local NLP tester
│   └── requirements.txt
└── frontend/                 # React.js Client (Vite)
    ├── src/
    │   ├── components/       # UI (Dashboard, JobManager, Analytics, CandidateDetail)
    │   ├── App.jsx           # State coordinator
    │   ├── main.jsx          # React renderer
    │   └── index.css         # Custom SaaS Dark styling
    ├── package.json
    └── vite.config.js
```

---

## Prerequisites

Ensure you have the following installed on your system:
- **Node.js** (v18 or higher) & **npm**
- **Python** (v3.10 or higher) & **pip**
- **MongoDB** (Running locally on default port `27017`)

---

## Setup Instructions

### 1. Start the MongoDB Server
Ensure MongoDB is running on your system. If running as a Windows service:
```powershell
Get-Service -Name MongoDB
# If stopped, start it:
Start-Service -Name MongoDB
```

### 2. Run the ML Service (Python)
Navigate to the `ml_service` folder, set up a virtual environment, and install dependencies:
```bash
cd ml_service
python -m venv venv

# Activate on Windows:
.\venv\Scripts\activate

# Install requirements:
pip install -r requirements.txt

# Start the FastAPI server:
python app.py
```
The ML service will run at `http://localhost:8000`.

### 3. Run the Backend API (Node.js)
Navigate to the `backend` folder, install dependencies, and start the development server:
```bash
cd backend
npm install
npm run dev
```
The backend server will run at `http://localhost:5000` and connect to the local MongoDB database `mongodb://localhost:27017/resume_screener`.

### 4. Run the Frontend Client (React)
Navigate to the `frontend` folder, install dependencies, and start the Vite dev server:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Verification & Testing

### Test the ML Engine Independently
Before running the full suite, you can verify that PDF parsing, text extraction, skill matching, similarity, and summarizations work correctly by running the verification script inside `ml_service`:
```bash
cd ml_service
.\venv\Scripts\python test_ml.py
```
This script will mock a candidate resume and matching job description to verify that NLP computations succeed and return high-fidelity results.
