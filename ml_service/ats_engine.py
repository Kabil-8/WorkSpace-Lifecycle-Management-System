import re
from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

ROLE_BENCHMARKS: Dict[str, List[str]] = {
    "Frontend Developer": ["React", "TypeScript", "Next.js", "Redux", "TailwindCSS", "HTML5", "CSS3", "Web Performance", "REST API", "Jest", "Vite", "Webpack"],
    "Backend Developer": ["Node.js", "Express", "Python", "PostgreSQL", "MongoDB", "Redis", "Docker", "System Design", "Microservices", "REST API", "GraphQL", "Kafka"],
    "Fullstack Developer": ["React", "Node.js", "TypeScript", "PostgreSQL", "MongoDB", "Redis", "Docker", "AWS", "CI/CD", "TailwindCSS", "GraphQL", "REST API"],
    "AI / ML Engineer": ["Python", "PyTorch", "TensorFlow", "Scikit-Learn", "Pandas", "NumPy", "FastAPI", "NLP", "Transformers", "Computer Vision", "Deep Learning", "MLOps"],
    "Data Engineer": ["Python", "SQL", "Spark", "Airflow", "Snowflake", "Kafka", "PostgreSQL", "ETL", "Data Warehousing", "AWS", "Docker", "Databricks"],
    "DevOps / Cloud Engineer": ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD", "Linux", "Bash", "Prometheus", "Grafana", "Python", "Git", "Ansible", "CloudFormation"],
}

POWER_ACTION_VERBS = [
    "architected", "engineered", "optimized", "scaled", "spearheaded",
    "automated", "implemented", "reduced", "accelerated", "deployed",
    "refactored", "designed", "pioneered", "streamlined", "delivered"
]

class ATSEngine:
    @staticmethod
    def evaluate_resume_raw(raw_text: str, target_role: str = "Fullstack Developer") -> Dict[str, Any]:
        """
        Calculates ATS compatibility score from raw uploaded resume text against a specific target role
        with intelligent PDF section detection and fair structure scoring.
        """
        role_keywords = ROLE_BENCHMARKS.get(target_role, ROLE_BENCHMARKS["Fullstack Developer"])
        text_lower = raw_text.lower()

        # 1. TF-IDF Cosine Similarity against target role benchmark
        benchmark_text = f"seeking experienced {target_role} proficient in {' '.join(role_keywords)}. " \
                         f"proven track record of building production systems, optimizing metrics, and implementing scalable solutions."
        
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform([text_lower, benchmark_text.lower()])
        cos_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        tfidf_score = min(35, int(cos_sim * 100 * 0.85) + 15)

        # 2. Role-specific Keyword Matching
        matched_keywords = [kw for kw in role_keywords if kw.lower() in text_lower]
        missing_keywords = [kw for kw in role_keywords if kw not in matched_keywords]
        keyword_score = min(30, int((len(matched_keywords) / max(1, len(role_keywords))) * 35))

        # 3. Action Verbs & Quantified Metrics
        matched_verbs = [verb for verb in POWER_ACTION_VERBS if verb in text_lower]
        has_quantified_metrics = bool(re.search(r'\d+%|\d+x|\$\d+|\d+ms|\d+\s*users|\d+\s*k', text_lower))
        
        impact_score = min(15, len(matched_verbs) * 3)
        if has_quantified_metrics:
            impact_score += 10
        impact_score = min(25, impact_score)

        # 4. Intelligent PDF Section & Structure Detection (Max 20 pts)
        has_contact = bool(re.search(r'[\w\.-]+@[\w\.-]+\.\w+|\+?\d[\d\s\-\(\)]{8,}\d', raw_text))
        has_summary = bool(re.search(r'summary|profile|about|objective', text_lower))
        has_experience = bool(re.search(r'experience|work|employment|history|projects', text_lower))
        has_education = bool(re.search(r'education|university|degree|college|bachelor|master|b\.tech|m\.tech|bca|mca', text_lower))

        completeness_score = 0
        if has_contact: completeness_score += 5
        if has_summary or len(raw_text) > 100: completeness_score += 5
        if has_experience: completeness_score += 5
        if has_education: completeness_score += 5

        completeness_score = min(20, max(12, completeness_score))

        total_score = min(100, tfidf_score + keyword_score + impact_score + completeness_score)

        rating = "Top Tier" if total_score >= 88 else "Excellent" if total_score >= 75 else "Good" if total_score >= 60 else "Needs Improvement"

        # Structured ATS Diagnostic Issues & Solutions List
        issues = []

        if missing_keywords:
            issues.append({
                "id": "iss-kw",
                "severity": "high" if len(missing_keywords) > 3 else "medium",
                "title": f"Missing Core {target_role} Keywords ({len(missing_keywords)})",
                "description": f"Your resume lacks core technical keywords expected by ATS screeners for {target_role}: {', '.join(missing_keywords[:4])}.",
                "solution": f"Add missing skills to your Technical Skills section: {', '.join(missing_keywords)}."
            })

        if not has_quantified_metrics:
            issues.append({
                "id": "iss-metrics",
                "severity": "high",
                "title": "No Quantified Impact Metrics Found",
                "description": "ATS screeners prioritize resumes with measurable results (e.g. percentages, latency reductions, user scale).",
                "solution": "Add numbers to bullet points (e.g. 'Optimized query latency by 45%', 'Scaled API to handle 50,000 requests/sec')."
            })

        if len(matched_verbs) < 3:
            issues.append({
                "id": "iss-verbs",
                "severity": "medium",
                "title": "Weak Action Verbs & Bullet Point Openings",
                "description": "Starting experience bullet points with strong power action verbs increases parser impact scores.",
                "solution": f"Use strong verbs: {', '.join([v.capitalize() for v in POWER_ACTION_VERBS[:4]])}."
            })

        if not has_education:
            issues.append({
                "id": "iss-edu",
                "severity": "medium",
                "title": "Education Section Not Explicitly Heading-Tagged",
                "description": "ATS parsers look for explicit section headers like 'Education' or 'Degrees'.",
                "solution": "Add a clear 'Education' section heading to your PDF layout."
            })

        return {
            "score": total_score,
            "rating": rating,
            "targetRole": target_role,
            "breakdown": {
                "tfidfSimilarityScore": int(tfidf_score),
                "keywordScore": int(keyword_score),
                "impactScore": int(impact_score),
                "completenessScore": int(completeness_score)
            },
            "matchedKeywords": matched_keywords,
            "missingKeywords": missing_keywords,
            "suggestedActionVerbs": [v.capitalize() for v in POWER_ACTION_VERBS if v not in matched_verbs][:5],
            "issues": issues
        }

    @staticmethod
    def evaluate_resume(
        summary: str,
        skills: List[str],
        experience_desc: List[str],
        projects_desc: List[str],
        target_role: str = "Fullstack Developer"
    ) -> Dict[str, Any]:
        full_text = f"{summary} {' '.join(skills)} {' '.join(experience_desc)} {' '.join(projects_desc)}"
        return ATSEngine.evaluate_resume_raw(full_text, target_role)
