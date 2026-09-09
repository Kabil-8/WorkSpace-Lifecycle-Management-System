import time
from typing import Dict, Any, List, Optional

class EdenUserMemoryEngine:
    """
    Persistent Long-Term Memory Engine for EDEN AI.
    Tracks student learning preferences, skill progression, completed courses,
    and historical query interactions for context-aware personalized responses.
    """
    def __init__(self):
        self.memories: Dict[str, Dict[str, Any]] = {}

    def get_or_create_memory(self, user_id: str, role: str = "student", name: str = "Student") -> Dict[str, Any]:
        if user_id not in self.memories:
            self.memories[user_id] = {
                "user_id": user_id,
                "name": name,
                "role": role,
                "learning_preferences": ["Visual Learning", "Hands-on Coding", "Interactive Quizzes"],
                "frequently_studied_topics": ["Data Structures", "Web Microservices", "Machine Learning"],
                "completed_courses": ["CS-101 Introduction to CS", "CS-201 Data Structures"],
                "skill_progression": {
                    "Python": 85,
                    "TypeScript": 80,
                    "React": 82,
                    "Algorithms": 75,
                    "SQL": 70
                },
                "career_goal": "Full-Stack AI Software Engineer",
                "chat_history": [],
                "last_updated": time.time()
            }
        return self.memories[user_id]

    def update_user_memory(self, user_id: str, new_skills: Optional[List[str]] = None, topic: Optional[str] = None) -> Dict[str, Any]:
        mem = self.get_or_create_memory(user_id)
        if topic and topic not in mem["frequently_studied_topics"]:
            mem["frequently_studied_topics"].append(topic)
        if new_skills:
            for s in new_skills:
                mem["skill_progression"][s] = mem["skill_progression"].get(s, 60) + 5
        mem["last_updated"] = time.time()
        return mem

    def add_chat_interaction(self, user_id: str, query: str, response: str):
        mem = self.get_or_create_memory(user_id)
        mem["chat_history"].append({
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "query": query,
            "response": response[:120] + "..." if len(response) > 120 else response
        })
        if len(mem["chat_history"]) > 10:
            mem["chat_history"] = mem["chat_history"][-10:]

memory_engine = EdenUserMemoryEngine()
