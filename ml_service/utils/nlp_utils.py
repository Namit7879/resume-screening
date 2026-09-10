import re
import io
from pypdf import PdfReader
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Predefined skill dictionary patterns covering multiple modern domains
SKILL_PATTERNS = {
    # Programming Languages
    "Python": r"\bpython\b",
    "Java": r"\bjava\b",
    "JavaScript": r"\bjavascript\b|\bjs\b",
    "TypeScript": r"\btypescript\b|\bts\b",
    "C++": r"\bc\+\+\b",
    "C#": r"\bc#\b|\bc\s*sharp\b",
    "C": r"\b(?<!\w)c(?!\w|[+#])\b",
    "Go": r"\bgo\b|\bgolang\b",
    "Rust": r"\brust\b",
    "PHP": r"\bphp\b",
    "Ruby": r"\bruby\b",
    "Kotlin": r"\bkotlin\b",
    "Swift": r"\bswift\b",
    "Scala": r"\bscala\b",
    "Dart": r"\bdart\b",
    "R": r"\br\s+(?:language|programming|scripting)\b|\bprogramming\s+in\s+r\b",
    "SQL": r"\bsql\b",
    "HTML": r"\bhtml(?:5)?\b",
    "CSS": r"\bcss(?:3)?\b",
    "Bash": r"\bbash\b|\bshell\s+script(?:ing)?\b",
    
    # Frontend Technologies
    "React": r"\breact(?:\.js|js)?\b",
    "Next.js": r"\bnext(?:\.js|js)?\b",
    "Vue.js": r"\bvue(?:\.js|js)?\b",
    "Angular": r"\bangular(?:\.js|js)?\b",
    "Svelte": r"\bsvelte\b",
    "Redux": r"\bredux\b",
    "Tailwind CSS": r"\btailwind(?:\s*css)?\b",
    "Bootstrap": r"\bbootstrap\b",
    "Sass": r"\bsass\b|\bscss\b",
    "Webpack": r"\bwebpack\b",
    "Vite": r"\bvite(?:\.js|js)?\b",
    "jQuery": r"\bjquery\b",
    
    # Backend & Web Frameworks
    "Node.js": r"\bnode(?:\.js|js)?\b",
    "Express.js": r"\bexpress(?:\.js|js)?\b",
    "Django": r"\bdjango\b",
    "Flask": r"\bflask\b",
    "FastAPI": r"\bfastapi\b",
    "Spring Boot": r"\bspring\s*boot\b|\bspring\s+framework\b",
    "ASP.NET": r"\basp\.net\b|\b\.net(?:\s*core)?\b",
    "Ruby on Rails": r"\bruby\s+on\s+rails\b|\brails\b",
    "Laravel": r"\blaravel\b",
    "GraphQL": r"\bgraphql\b",
    "REST API": r"\brest(?:ful)?(?:\s*apis?)?\b",
    "Microservices": r"\bmicroservices?\b",
    "gRPC": r"\bgrpc\b",
    "WebSockets": r"\bwebsockets?\b",
    
    # Databases & Caching
    "MongoDB": r"\bmongo(?:db)?\b",
    "PostgreSQL": r"\bpostgres(?:ql)?\b",
    "MySQL": r"\bmysql\b",
    "Redis": r"\bredis\b",
    "SQLite": r"\bsqlite\b",
    "Oracle": r"\boracle(?:\s*db)?\b",
    "Cassandra": r"\bcassandra\b",
    "Elasticsearch": r"\belasticsearch\b",
    "DynamoDB": r"\bdynamodb\b",
    "Firebase": r"\bfirebase\b",
    "Supabase": r"\bsupabase\b",
    "Neo4j": r"\bneo4j\b",
    "Snowflake": r"\bsnowflake\b",
    "BigQuery": r"\bbigquery\b",
    
    # Cloud, DevOps & Infrastructure
    "AWS": r"\baws\b|\bamazon\s+web\s+services\b",
    "Azure": r"\bazure\b|\bmicrosoft\s+azure\b",
    "GCP": r"\bgcp\b|\bgoogle\s+cloud(?:\s+platform)?\b",
    "Docker": r"\bdocker\b",
    "Kubernetes": r"\bkubernetes\b|\bk8s\b",
    "Terraform": r"\bterraform\b",
    "Ansible": r"\bansible\b",
    "Jenkins": r"\bjenkins\b",
    "CI/CD": r"\bci[\/\-]cd\b|\bcontinuous\s+integration\b",
    "Linux": r"\blinux\b|\bubuntu\b|\bcentos\b",
    "Nginx": r"\bnginx\b",
    "Apache": r"\bapache\b",
    "Helm": r"\bhelm\b",
    "Prometheus": r"\bprometheus\b",
    "Grafana": r"\bgrafana\b",
    
    # Data Science, AI & Machine Learning
    "Machine Learning": r"\bmachine\s+learning\b|\bml\b",
    "Deep Learning": r"\bdeep\s+learning\b|\bdl\b",
    "Artificial Intelligence": r"\bartificial\s+intelligence\b|\bai\b",
    "Natural Language Processing": r"\bnatural\s+language\s+processing\b|\bnlp\b",
    "Computer Vision": r"\bcomputer\s+vision\b|\bcv\b",
    "TensorFlow": r"\btensorflow\b",
    "PyTorch": r"\bpytorch\b",
    "Keras": r"\bkeras\b",
    "Scikit-learn": r"\bscikit-learn\b|\bsklearn\b",
    "Pandas": r"\bpandas\b",
    "NumPy": r"\bnumpy\b",
    "SciPy": r"\bscipy\b",
    "Matplotlib": r"\bmatplotlib\b",
    "Seaborn": r"\bseaborn\b",
    "Tableau": r"\btableau\b",
    "Power BI": r"\bpower\s*bi\b",
    "Apache Spark": r"\b(?:apache\s+)?spark\b|\bpyspark\b",
    "Hadoop": r"\bhadoop\b",
    "Apache Kafka": r"\b(?:apache\s+)?kafka\b",
    "Airflow": r"\bairflow\b",
    "Databricks": r"\bdatabricks\b",
    "LLMs": r"\bllms?\b|\blarge\s+language\s+models?\b",
    "LangChain": r"\blangchain\b",
    "Hugging Face": r"\bhugging\s*face\b",
    "Generative AI": r"\bgenerative\s+ai\b|\bgenai\b",
    "Data Analytics": r"\bdata\s+analytics?\b|\bdata\s+analysis\b",
    
    # Mobile Development
    "Android": r"\bandroid\b",
    "iOS": r"\bios\b",
    "Flutter": r"\bflutter\b",
    "React Native": r"\breact\s+native\b",
    
    # Testing & QA
    "Unit Testing": r"\bunit\s+testing\b|\bunittest\b",
    "Jest": r"\bjest\b",
    "Cypress": r"\bcypress\b",
    "Selenium": r"\bselenium\b",
    "PyTest": r"\bpytest\b",
    "JUnit": r"\bjunit\b",
    
    # Cybersecurity
    "Cyber Security": r"\bcyber\s*security\b|\binformation\s+security\b",
    "Penetration Testing": r"\bpenetration\s+testing\b|\bpen\s+test(?:ing)?\b",
    "OWASP": r"\bowasp\b",
    "Cryptography": r"\bcryptography\b",
    
    # Tools, Methodologies & Management
    "Git": r"\bgit\b",
    "GitHub": r"\bgithub\b",
    "GitLab": r"\bgitlab\b",
    "Jira": r"\bjira\b",
    "Agile": r"\bagile\b",
    "Scrum": r"\bscrum\b",
    "Figma": r"\bfigma\b",
    "Postman": r"\bpostman\b"
}

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extracts raw text from PDF file bytes using pypdf."""
    text = ""
    try:
        pdf_file = io.BytesIO(pdf_bytes)
        reader = PdfReader(pdf_file)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    except Exception as e:
        print(f"Error extracting text: {e}")
    return text

def extract_email(text: str) -> str:
    """Extracts the first email address found in the text."""
    email_regex = r"[\w\.-]+@[\w\.-]+\.\w+"
    match = re.search(email_regex, text)
    return match.group(0) if match else "N/A"

def extract_phone(text: str) -> str:
    """Extracts a phone number using regex heuristics."""
    phone_regex = r"\+?\d[\d\-\(\) ]{8,15}\d"
    match = re.search(phone_regex, text)
    return match.group(0).strip() if match else "N/A"

def extract_name(text: str) -> str:
    """Heuristic to extract the candidate's name from the first few lines of the text."""
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    ignore_words = {
        "resume", "cv", "curriculum", "vitae", "contact", "email", "phone", 
        "address", "page", "summary", "profile", "portfolio", "experience",
        "education", "work", "skills", "about", "me", "hobbies", "languages"
    }
    
    for line in lines[:10]:
        # Clean special chars, numbers, and multiple spaces
        clean_line = re.sub(r"[^a-zA-Z\s\.]", "", line).strip()
        words = clean_line.split()
        
        # Heuristic: Candidate name is usually 2 to 3 words, each capitalized
        if 2 <= len(words) <= 3:
            # Check capitalization of each word (ignoring initials like A.)
            is_valid_name = True
            for w in words:
                if not w:
                    continue
                if len(w) == 1 and w.endswith('.'):
                    continue
                if not w[0].isupper():
                    is_valid_name = False
                    break
            
            if is_valid_name:
                # Ensure no common resume headers are in the name
                if not any(w.lower() in ignore_words for w in words):
                    return clean_line
                    
    # Fallback to first line or default
    if lines:
        fallback = re.sub(r"[^a-zA-Z\s]", "", lines[0]).strip()
        if fallback and len(fallback.split()) <= 4:
            return fallback
    return "Unknown Candidate"

def extract_skills(text: str, custom_skills: list = None) -> list:
    """
    Extracts skills from text based on predefined skill dictionary 
    PLUS any custom/dynamic skills specified for the role.
    """
    text_lower = text.lower()
    extracted = set()

    # 1. Match from predefined dictionary
    for skill, pattern in SKILL_PATTERNS.items():
        if re.search(pattern, text_lower):
            extracted.add(skill)

    # 2. Match from custom / dynamic skills
    if custom_skills:
        for raw_skill in custom_skills:
            skill = raw_skill.strip()
            if not skill:
                continue
            # Build dynamic word-boundary pattern for arbitrary skill
            escaped = re.escape(skill.lower())
            dynamic_pattern = r"(?:\b|_)" + escaped + r"(?:\b|_)"
            try:
                if re.search(dynamic_pattern, text_lower):
                    extracted.add(skill)
            except Exception:
                if skill.lower() in text_lower:
                    extracted.add(skill)

    return sorted(list(extracted))

def calculate_cosine_similarity(resume_text: str, jd_text: str) -> float:
    """Computes TF-IDF vectorization and cosine similarity between resume and job description."""
    if not resume_text.strip() or not jd_text.strip():
        return 0.0
        
    try:
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf = vectorizer.fit_transform([jd_text, resume_text])
        sim = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
        return round(float(sim) * 100, 1)
    except Exception as e:
        print(f"Error in similarity calculation: {e}")
        return 0.0

def generate_extractive_summary(resume_text: str, jd_text: str, num_sentences: int = 3) -> str:
    """Generates an extractive summary of the resume by selecting sentences most similar to the Job Description."""
    # Split resume into sentences
    sentences = re.split(r"(?<=[.!?])\s+|\n+", resume_text)
    # Filter sentences
    sentences = [s.strip() for s in sentences if len(s.strip().split()) >= 6 and len(s.strip()) > 30]
    
    if not sentences or not jd_text.strip():
        return "No summary available."
        
    try:
        # Create vectors for JD + all sentences
        vectorizer = TfidfVectorizer(stop_words='english')
        corpus = [jd_text] + sentences
        tfidf = vectorizer.fit_transform(corpus)
        
        # Calculate similarity of each sentence with JD (index 0)
        jd_vector = tfidf[0:1]
        sentence_vectors = tfidf[1:]
        
        sims = cosine_similarity(jd_vector, sentence_vectors)[0]
        
        # Get indices of top sentences
        top_indices = np.argsort(sims)[-num_sentences:][::-1]
        
        # Sort indices to maintain original reading flow
        top_indices = sorted(top_indices)
        
        summary_sentences = [sentences[idx] for idx in top_indices]
        summary = " ".join(summary_sentences)
        return summary
    except Exception as e:
        print(f"Error generating summary: {e}")
        # Simple fallback to first 3 sentences
        return " ".join(sentences[:num_sentences])

def analyze_skill_gap(candidate_skills: list, jd_skills: list) -> dict:
    """Performs skill gap analysis between required job description skills and candidate skills."""
    if not jd_skills:
        # If no skills are defined in JD, treat all predefined skills as candidate's portfolio
        return {
            "matchingSkills": candidate_skills,
            "missingSkills": [],
            "coveragePercentage": 100.0
        }
        
    cand_set = set(candidate_skills)
    jd_set = set(jd_skills)
    
    matching_skills = list(jd_set.intersection(cand_set))
    missing_skills = list(jd_set.difference(cand_set))
    
    coverage = (len(matching_skills) / len(jd_set)) * 100 if jd_set else 100.0
    
    return {
        "matchingSkills": sorted(matching_skills),
        "missingSkills": sorted(missing_skills),
        "coveragePercentage": round(coverage, 1)
    }

def calculate_composite_score(raw_similarity: float, coverage_percentage: float, has_jd_skills: bool = True) -> float:
    """
    Computes a balanced holistic match score (0.0 to 100.0) combining hard skill coverage
    and normalized semantic TF-IDF text similarity.
    TF-IDF unigram cosine similarity over entire unstructured documents typically ranges
    from 10% to 35% for good matches, so it is scaled appropriately (up to 2.5x, capped at 100).
    """
    normalized_similarity = min(raw_similarity * 2.5, 100.0)
    
    if has_jd_skills:
        # 65% weight on verified skill coverage + 35% weight on contextual resume text relevance
        composite = (0.65 * coverage_percentage) + (0.35 * normalized_similarity)
    else:
        # If no specific required skills are extracted, rely on contextual semantic text relevance
        composite = normalized_similarity
        
    return round(min(max(float(composite), 0.0), 100.0), 1)

def generate_recommendation_explanation(match_score: float, gap_analysis: dict) -> tuple:
    """
    Generates a unified recommendation status and detailed justification of the ranking.
    Returns (status: str, explanation: str).
    status is one of: 'Recommended (Shortlist)', 'Screening Suggested', 'Not Recommended'
    """
    matching = gap_analysis["matchingSkills"]
    missing = gap_analysis["missingSkills"]
    coverage = gap_analysis["coveragePercentage"]
    
    matching_str = ", ".join(matching) if matching else "None"
    missing_str = ", ".join(missing) if missing else "None"
    
    # Unified tiers based on composite match score and coverage
    if match_score >= 70 or (coverage >= 75 and match_score >= 60):
        status = "Recommended (Shortlist)"
        explanation = (
            f"Strong Match (Score: {match_score}%). The candidate shows high technical alignment "
            f"with {coverage}% skill coverage. Key matching skills include [{matching_str}]. "
            f"Missing skills: [{missing_str}]. Highly recommended to fast-track to technical interview."
        )
    elif match_score >= 45 or (coverage >= 50 and match_score >= 40):
        status = "Screening Suggested"
        explanation = (
            f"Moderate Match (Score: {match_score}%). The candidate possesses standard foundational skills "
            f"({coverage}% coverage) matching [{matching_str}]. However, they are missing critical skills: [{missing_str}]. "
            f"Recommended for an initial screening call to assess adaptability."
        )
    else:
        status = "Not Recommended"
        explanation = (
            f"Low Match (Score: {match_score}%). Significant skill gap identified (only {coverage}% coverage). "
            f"Candidate matches [{matching_str}] but lacks crucial skills like [{missing_str}]. "
            f"Not recommended for this position, but may be retained in the talent pool for other roles."
        )
    return status, explanation


