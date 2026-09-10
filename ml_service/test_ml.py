from utils.nlp_utils import (
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

def run_test():
    print("--- NLP UTILS TEST RUN ---")
    
    jd = """
    We are looking for a Senior Full Stack Developer.
    Required Skills: Python, React, Node.js, SQL, AWS, and Docker.
    You will design machine learning pipelines and build clean user interfaces.
    Knowledge of Git, MongoDB, and Linux is a plus.
    """
    
    resume = """
    JOHNY 
    johnY@email.com | (123) 4567890 | PUNJAB
    
    PROFESSIONAL SUMMARY
    Dynamic Software Engineer with 5+ years of experience building applications.
    Specialized in Python and React. Experience with Docker, Git, SQL, and Linux.
    Developed machine learning models using Scikit-learn.
    
    EXPERIENCE
    Software Engineer - Tech Corp (2022 - Present)
    - Developed web interfaces using React and state management.
    - Wrote backend scripts in Python for data processing.
    - Managed deployments with Docker and hosted services on AWS.
    
    EDUCATION
    BS in Computer Science - University of Washington
    """
    
    # Test Name Extraction
    name = extract_name(resume)
    print(f"Extracted Name: {name} (Expected: John J Doe or John J. Doe)")
    
    # Test Email & Phone Extraction
    email = extract_email(resume)
    phone = extract_phone(resume)
    print(f"Extracted Email: {email} (Expected: john.doe@email.com)")
    print(f"Extracted Phone: {phone} (Expected: (123) 456-7890 or 123-456-7890)")
    
    # Test Skill Extraction
    jd_skills = extract_skills(jd)
    resume_skills = extract_skills(resume)
    print(f"JD Skills: {jd_skills}")
    print(f"Resume Skills: {resume_skills}")
    
    # Test Cosine Similarity
    raw_sim = calculate_cosine_similarity(resume, jd)
    print(f"Raw Similarity Score: {raw_sim}%")
    
    # Test Skill Gap
    gap = analyze_skill_gap(resume_skills, jd_skills)
    print(f"Skill Gap Analysis:")
    print(f"  Matching Skills: {gap['matchingSkills']}")
    print(f"  Missing Skills: {gap['missingSkills']}")
    print(f"  Coverage: {gap['coveragePercentage']}%")
    
    # Test Composite Match Score
    composite_score = calculate_composite_score(raw_sim, gap['coveragePercentage'], has_jd_skills=True)
    print(f"Composite Match Score: {composite_score}%")
    
    # Test Summarization
    summary = generate_extractive_summary(resume, jd)
    print(f"Extractive Summary:\n{summary}")
    
    # Test Explanation & Status
    status, explanation = generate_recommendation_explanation(composite_score, gap)
    print(f"Recommendation Status: {status}")
    # Test Dynamic Custom Skills Extraction
    custom_jd_skills = ["Solidity", "Tailwind CSS", "Python"]
    custom_resume_skills = extract_skills("Proficient in Python, Tailwind CSS, and building smart contracts in Solidity.", custom_skills=custom_jd_skills)
    print(f"Dynamic Custom Skills Extracted: {custom_resume_skills} (Expected: ['Python', 'Solidity', 'Tailwind CSS'])")

if __name__ == "__main__":
    run_test()
