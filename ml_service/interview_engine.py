import re
from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class InterviewEngine:
    @staticmethod
    def extract_resume_skills(resume_text: str) -> List[str]:
        tech_dictionary = [
            "React", "Node.js", "TypeScript", "JavaScript", "Python", "Docker", "Kubernetes",
            "AWS", "MongoDB", "PostgreSQL", "Redis", "GraphQL", "System Design", "Microservices",
            "CI/CD", "Kafka", "REST API", "Git", "Agile", "TailwindCSS", "Next.js", "Express",
            "Machine Learning", "PyTorch", "TensorFlow", "FastAPI", "WebSockets", "Redux", "SQL"
        ]
        found = [tech for tech in tech_dictionary if tech.lower() in resume_text.lower()]
        return found if found else ["React", "Node.js", "TypeScript", "REST API", "MongoDB"]

    @staticmethod
    def get_resume_questions(resume_text: str, target_role: str = "Fullstack Developer") -> List[Dict[str, Any]]:
        """
        Generates 20 Proctored Questions (10 Technical HR + 10 General HR)
        strictly derived from the candidate's actual uploaded resume content and target role.
        """
        extracted_skills = InterviewEngine.extract_resume_skills(resume_text)
        s1 = extracted_skills[0] if len(extracted_skills) > 0 else "React"
        s2 = extracted_skills[1] if len(extracted_skills) > 1 else "Node.js"
        s3 = extracted_skills[2] if len(extracted_skills) > 2 else "MongoDB"
        s4 = extracted_skills[3] if len(extracted_skills) > 3 else "Docker"
        s5 = extracted_skills[4] if len(extracted_skills) > 4 else "REST API"

        # 10 Technical HR Questions (Resume-Specific)
        tech_hr_questions = [
            {
                "id": "tech-1",
                "category": "Technical HR",
                "difficulty": "Medium",
                "question": f"In your uploaded resume for {target_role}, you listed experience with {s1}. How did you structure components and optimize rendering performance in your project?",
                "expected_keywords": [s1.lower(), "performance", "rendering", "state", "optimization"],
                "model_answer": f"Explain component hierarchy, state isolation, and caching strategies used in {s1}."
            },
            {
                "id": "tech-2",
                "category": "Technical HR",
                "difficulty": "Hard",
                "question": f"Your resume highlights backend development using {s2}. Walk me through how you designed your API endpoints, authentication middleware, and database connections.",
                "expected_keywords": [s2.lower(), "api", "middleware", "authentication", "database"],
                "model_answer": f"Detail endpoint routing, JWT bearer tokens, connection pooling, and error handling in {s2}."
            },
            {
                "id": "tech-3",
                "category": "Technical HR",
                "difficulty": "Hard",
                "question": f"How did you implement data persistence and indexing in {s3} as mentioned in your resume achievements?",
                "expected_keywords": [s3.lower(), "database", "indexing", "queries", "schema"],
                "model_answer": f"Discuss schema design, query optimization, compound indexes, and ACID compliance/eventual consistency."
            },
            {
                "id": "tech-4",
                "category": "Technical HR",
                "difficulty": "Medium",
                "question": f"You mentioned {s4} on your resume. How did you containerize your application services and manage environment variables across development vs production?",
                "expected_keywords": [s4.lower(), "container", "dockerfile", "environment", "deployment"],
                "model_answer": f"Explain multi-stage Docker builds, image size optimization, and docker-compose configurations."
            },
            {
                "id": "tech-5",
                "category": "Technical HR",
                "difficulty": "Medium",
                "question": f"Walk me through your design for scalable {s5} communication between frontend clients and server microservices.",
                "expected_keywords": [s5.lower(), "http", "status codes", "payload", "rest"],
                "model_answer": f"Detail HTTP method conventions (GET, POST, PUT, DELETE), status codes, and JSON response contracts."
            },
            {
                "id": "tech-6",
                "category": "Technical HR",
                "difficulty": "Hard",
                "question": f"Based on your projects in {target_role}: How did you manage asynchronous state, promise rejections, and background task queues?",
                "expected_keywords": ["async", "await", "promises", "queue", "event loop"],
                "model_answer": "Cover async/await syntax, try-catch error handling, and task scheduling libraries."
            },
            {
                "id": "tech-7",
                "category": "Technical HR",
                "difficulty": "Hard",
                "question": f"In your resume projects using {s1} and {s2}: What security measures did you implement to prevent XSS, CSRF, and SQL/NoSQL injection vulnerabilities?",
                "expected_keywords": ["xss", "csrf", "sanitization", "cors", "helmets", "injection"],
                "model_answer": "Detail input sanitization, HTTP-only cookies, CORS policy configuration, and parameterized queries."
            },
            {
                "id": "tech-8",
                "category": "Technical HR",
                "difficulty": "Medium",
                "question": f"How did you handle version control, feature branching, and pull request code reviews during your development projects?",
                "expected_keywords": ["git", "branching", "pull request", "merge", "code review"],
                "model_answer": "Explain Git-flow workflow, feature branches, rebase vs merge, and automated PR checks."
            },
            {
                "id": "tech-9",
                "category": "Technical HR",
                "difficulty": "Hard",
                "question": f"What automated unit testing or integration testing frameworks did you utilize to ensure code quality before deployment?",
                "expected_keywords": ["unit testing", "integration", "jest", "cypress", "coverage"],
                "model_answer": "Discuss test-driven development, mocking dependencies, and achieving high code coverage."
            },
            {
                "id": "tech-10",
                "category": "Technical HR",
                "difficulty": "Hard",
                "question": f"Looking at your overall resume technical stack for {target_role}: If you had to scale your primary project to 100,000 active users, what bottleneck would fail first and how would you fix it?",
                "expected_keywords": ["scaling", "bottleneck", "caching", "load balancer", "sharding"],
                "model_answer": "Identify database connection or CPU bottlenecks, introduce Redis caching, and implement horizontal scaling."
            }
        ]

        # 10 General HR Questions (Resume & Behavioral)
        general_hr_questions = [
            {
                "id": "hr-1",
                "category": "General HR",
                "difficulty": "Easy",
                "question": f"Walk me through your resume summary: What inspired you to pursue a career in {target_role}?",
                "expected_keywords": ["background", "passion", "projects", target_role.lower()],
                "model_answer": "Summarize technical background, key milestone projects, and long-term career ambition."
            },
            {
                "id": "hr-2",
                "category": "General HR",
                "difficulty": "Medium",
                "question": "Tell me about the most technically challenging project listed on your resume. What was your individual role and contribution?",
                "expected_keywords": ["project", "challenges", "contribution", "ownership"],
                "model_answer": "Describe project scope, personal technical responsibilities, and specific features built."
            },
            {
                "id": "hr-3",
                "category": "General HR",
                "difficulty": "Medium",
                "question": "Describe a situation where a project deadline was at risk or requirements changed unexpectedly. How did you prioritize and deliver?",
                "expected_keywords": ["deadline", "priority", "adaptation", "communication", "result"],
                "model_answer": "Use STAR format: Describe deadline pressure, scope adjustment, transparent team communication, and on-time delivery."
            },
            {
                "id": "hr-4",
                "category": "General HR",
                "difficulty": "Medium",
                "question": "Give an example of a difficult technical bug in production that took significant effort to diagnose. How did you debug and fix it?",
                "expected_keywords": ["bug", "debugging", "root cause", "testing", "resolution"],
                "model_answer": "Detail debugging tools (logs, breakpoints), identifying root cause, writing test cases, and deploying hotfix."
            },
            {
                "id": "hr-5",
                "category": "General HR",
                "difficulty": "Medium",
                "question": "Tell me about a time when you disagreed with a teammate or lead on a technical approach. How did you resolve the conflict?",
                "expected_keywords": ["conflict", "collaboration", "trade-offs", "consensus", "respect"],
                "model_answer": "Explain listening to alternative views, evaluating pros/cons objectively with data, and committing to team decision."
            },
            {
                "id": "hr-6",
                "category": "General HR",
                "difficulty": "Easy",
                "question": "How do you stay updated with emerging industry technologies and tools relevant to your technical stack?",
                "expected_keywords": ["learning", "documentation", "blogs", "side projects", "courses"],
                "model_answer": "Mention reading official docs, participating in open source, building side projects, and tech communities."
            },
            {
                "id": "hr-7",
                "category": "General HR",
                "difficulty": "Medium",
                "question": "What is your process for receiving constructve feedback during code reviews or performance evaluations?",
                "expected_keywords": ["feedback", "growth mindset", "improvement", "learning"],
                "model_answer": "Demonstrate growth mindset, viewing feedback as learning opportunity, and quickly implementing refactoring."
            },
            {
                "id": "hr-8",
                "category": "General HR",
                "difficulty": "Medium",
                "question": "How do you balance writing clean, maintainable code with strict project delivery deadlines?",
                "expected_keywords": ["quality", "clean code", "deadlines", "refactoring", "technical debt"],
                "model_answer": "Discuss modular coding practices, documentation, automated tests, and managing technical debt responsibly."
            },
            {
                "id": "hr-9",
                "category": "General HR",
                "difficulty": "Medium",
                "question": "Describe a project where you took leadership or ownership beyond your assigned tasks to improve team productivity.",
                "expected_keywords": ["leadership", "ownership", "initiative", "productivity"],
                "model_answer": "Highlight taking initiative (e.g. setting up CI/CD pipeline, writing dev docs, mentoring peer)."
            },
            {
                "id": "hr-10",
                "category": "General HR",
                "difficulty": "Easy",
                "question": f"Where do you see your technical expertise evolving in 2-3 years within the field of {target_role}?",
                "expected_keywords": ["goals", "growth", "architecture", "mastery", "impact"],
                "model_answer": f"Outline technical mastery goals, interest in system architecture, and contributing to engineering scale in {target_role}."
            }
        ]

        return tech_hr_questions + general_hr_questions

    @staticmethod
    def evaluate_answer(question: Dict[str, Any], answer_text: str) -> Dict[str, Any]:
        answer_clean = answer_text.strip()
        words = answer_clean.split()
        word_count = len(words)

        expected_kws = question.get("expected_keywords", ["tech", "solution", "result"])
        matched_kws = [kw for kw in expected_kws if kw.lower() in answer_clean.lower()]
        missing_kws = [kw for kw in expected_kws if kw.lower() not in matched_kws]

        model_ans = question.get("model_answer", "State clear technical steps, algorithms, and quantitative outcomes.")
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform([answer_clean, model_ans])
        cos_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        relevance_score = min(100, int(cos_sim * 100 * 1.4) + (len(matched_kws) * 12))

        star_indicators = ["situation", "task", "action", "result", "because", "resolved", "led to", "percent"]
        star_found = [ind for ind in star_indicators if ind in answer_clean.lower()]
        star_score = min(100, len(star_found) * 20 + 40)

        clarity_score = min(100, int(word_count * 1.1)) if word_count > 15 else 45
        overall_score = int(relevance_score * 0.45 + star_score * 0.35 + clarity_score * 0.20)

        feedback = (
            f"Outstanding response! You effectively addressed technical trade-offs and covered key concepts: {', '.join(matched_kws)}."
            if overall_score >= 80
            else f"Good attempt. Consider structuring with explicit metrics and incorporating terms like {', '.join(missing_kws[:2])}."
        )

        return {
            "overallScore": overall_score,
            "relevanceScore": min(100, relevance_score),
            "technicalClarityScore": min(100, clarity_score),
            "starFormatScore": min(100, star_score),
            "matchedKeywords": matched_kws,
            "missingKeywords": missing_kws,
            "feedback": feedback,
            "modelAnswer": model_ans
        }
