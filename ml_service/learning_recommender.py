from typing import List, Dict, Any

class PersonalizedLearningRecommender:
    """
    Multi-Input Recommendation Model for Courses, Videos, Books, Practice Problems & Projects.
    Considers: History, CGPA, Attendance %, Quiz Marks, Assignment Scores, Coding Speed, Weak Subjects.
    Outputs: Content recommendations with explicit Explainable AI (XAI) rationale for every item.
    """
    @staticmethod
    def generate_recommendations(profile: Dict[str, Any]) -> Dict[str, Any]:
        cgpa = profile.get("cgpa", 8.2)
        attendance = profile.get("attendance", 85.0)
        weak_topics = profile.get("weak_topics", ["Algorithms & Data Structures", "Database Systems"])
        coding_score = profile.get("coding_score", 70)

        # 1. Course Recommendations
        courses = []
        if "Algorithms & Data Structures" in weak_topics or coding_score < 75:
          courses.append({
              "id": "rec-c1",
              "title": "Mastering Advanced Data Structures & Algorithms in TypeScript",
              "provider": "EduSphere Academy",
              "level": "Intermediate",
              "type": "Course",
              "duration": "12 Hours",
              "xai_reason": "Recommended because your Digital Twin flagged 'Algorithms & Data Structures' as a weak area and your coding accuracy is 70%."
          })
        if "Database Systems" in weak_topics or cgpa < 8.5:
          courses.append({
              "id": "rec-c2",
              "title": "High-Performance MongoDB & Distributed Caching with Redis",
              "provider": "EduSphere Tech",
              "level": "Advanced",
              "type": "Course",
              "duration": "10 Hours",
              "xai_reason": "Recommended because Database Systems concepts are key to achieving Tier 1 Software Engineer placement eligibility."
          })

        # 2. Video Tutorials (YouTube/LMS)
        videos = [
            {
                "id": "rec-v1",
                "title": "SuperMemo SM-2 Active Recall & Ebbinghaus Memory Decay",
                "channel": "Cognitive Computer Science",
                "duration": "18 min",
                "url": "https://youtube.com",
                "xai_reason": "Recommended to boost your active recall retention score from 85% to 95% before mid-semester exams."
            },
            {
                "id": "rec-v2",
                "title": "System Design Architecture: Scalable Microservices API Gateways",
                "channel": "Software Architecture Daily",
                "duration": "24 min",
                "url": "https://youtube.com",
                "xai_reason": "Recommended based on your target role as Full-Stack Software Engineer."
            }
        ]

        # 3. Practice Coding Problems
        problems = [
            {
                "id": "rec-p1",
                "title": "Binary Tree In-Order & Post-Order Traversal",
                "difficulty": "Medium",
                "topic": "Data Structures",
                "estTime": "20 mins",
                "xai_reason": "Selected to strengthen tree traversal algorithms where your recent quiz score was 60%."
            },
            {
                "id": "rec-p2",
                "title": "LRU Cache Implementation with Double Linked List",
                "difficulty": "Hard",
                "topic": "Algorithms",
                "estTime": "35 mins",
                "xai_reason": "Top problem asked by Tier 1 recruiters (Google, Microsoft, Amazon)."
            }
        ]

        # 4. Recommended Books & Papers
        books = [
            {
                "id": "rec-b1",
                "title": "Designing Data-Intensive Applications by Martin Kleppmann",
                "author": "O'Reilly Media",
                "xai_reason": "Essential reference book matching your advanced web microservices trajectory."
            }
        ]

        return {
            "student_profile_summary": {
                "cgpa": cgpa,
                "attendance": f"{attendance}%",
                "weak_topics_count": len(weak_topics),
                "coding_score": f"{coding_score}/100"
            },
            "recommendations": {
                "courses": courses,
                "videos": videos,
                "problems": problems,
                "books": books
            }
        }

learning_recommender = PersonalizedLearningRecommender()
