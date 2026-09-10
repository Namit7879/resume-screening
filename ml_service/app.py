import json
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uvicorn
import os
# Import NLP helpers
from utils.nlp_utils import (
    extract_text_from_pdf,
    extract_name,
    extract_email,
    extract_phone,
    extract_skills,
    calculate_cosine_similarity,
    calculate_composite_score,
    analyze_skill_gap,
    generate_extractive_summary,
    generate_recommendation_explanation
)

app = FastAPI(title="AI Resume Screener ML Service", version="1.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "running", "service": "AI Resume Screener ML Service"}

@app.post("/analyze")
async def analyze_resumes(
    job_description: str = Form(...),
    required_skills: str = Form(None),
    files: List[UploadFile] = File(...)
):
    """
    Analyzes multiple resume PDFs against a job description.
    Extracts candidate metadata, skills, computes similarity scores,
    and runs skill-gap and summarization analyses.
    Supports any dynamic job description and arbitrary custom required skills.
    """
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty.")
    if not files:
        raise HTTPException(status_code=400, detail="At least one resume PDF must be uploaded.")

    # Determine job required skills: from explicit parameter or auto-extracted
    jd_skills = []
    if required_skills and required_skills.strip():
        try:
            parsed = json.loads(required_skills)
            if isinstance(parsed, list):
                jd_skills = [str(s).strip() for s in parsed if str(s).strip()]
        except Exception:
            jd_skills = [s.strip() for s in required_skills.split(",") if s.strip()]

    # If no explicit skills provided, dynamically extract from job description
    if not jd_skills:
        jd_skills = extract_skills(job_description)
    
    results = []
    
    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            # Skip non-PDF files
            continue
            
        try:
            # Read PDF bytes
            pdf_bytes = await file.read()
            
            # Extract text
            text = extract_text_from_pdf(pdf_bytes)
            if not text.strip():
                # Text extraction failed or PDF is empty
                results.append({
                    "filename": file.filename,
                    "name": file.filename.replace(".pdf", "").replace("_", " ").title(),
                    "email": "N/A",
                    "phone": "N/A",
                    "matchScore": 0.0,
                    "rawSimilarity": 0.0,
                    "recommendationStatus": "Not Recommended",
                    "skills": [],
                    "missingSkills": jd_skills,
                    "coveragePercentage": 0.0,
                    "summary": "Could not extract text from this PDF file.",
                    "explanation": "No text extracted. PDF might be scanned or corrupt.",
                    "rawText": ""
                })
                continue
            
            # Extract metadata
            name = extract_name(text)
            email = extract_email(text)
            phone = extract_phone(text)
            
            # Extract candidate skills (testing against both universal dictionary and job-specific custom skills)
            candidate_skills = extract_skills(text, custom_skills=jd_skills)
            
            # Calculate raw semantic similarity
            raw_similarity = calculate_cosine_similarity(text, job_description)
            
            # Analyze skill gap
            gap_analysis = analyze_skill_gap(candidate_skills, jd_skills)
            
            # Calculate balanced composite match score
            composite_score = calculate_composite_score(
                raw_similarity,
                gap_analysis["coveragePercentage"],
                has_jd_skills=len(jd_skills) > 0
            )
            
            # Generate summary
            summary = generate_extractive_summary(text, job_description)
            
            # Generate recommendation explanation & unified status
            status, explanation = generate_recommendation_explanation(composite_score, gap_analysis)
            
            results.append({
                "filename": file.filename,
                "name": name if name != "Unknown Candidate" else file.filename.replace(".pdf", "").replace("_", " ").title(),
                "email": email,
                "phone": phone,
                "matchScore": composite_score,
                "rawSimilarity": raw_similarity,
                "recommendationStatus": status,
                "skills": candidate_skills,
                "missingSkills": gap_analysis["missingSkills"],
                "coveragePercentage": gap_analysis["coveragePercentage"],
                "summary": summary,
                "explanation": explanation,
                "rawText": text
            })
            
        except Exception as e:
            print(f"Error processing file {file.filename}: {e}")
            results.append({
                "filename": file.filename,
                "name": file.filename,
                "email": "Error",
                "phone": "Error",
                "matchScore": 0.0,
                "rawSimilarity": 0.0,
                "recommendationStatus": "Not Recommended",
                "skills": [],
                "missingSkills": jd_skills,
                "coveragePercentage": 0.0,
                "summary": f"Failed to process file: {str(e)}",
                "explanation": f"An error occurred during resume parsing: {str(e)}",
                "rawText": ""
            })
            
    return results

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))