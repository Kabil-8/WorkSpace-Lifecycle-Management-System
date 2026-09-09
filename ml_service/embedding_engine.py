import math
import re
from typing import List, Dict, Any

class VectorEmbeddingEngine:
    """
    Lightweight TF-IDF & Cosine Vector Embedding Engine for RAG Retrieval
    and Semantic Search across EduSphere Academic Knowledge Base.
    """
    def __init__(self):
        self.corpus: List[Dict[str, Any]] = []
        self.vocabulary: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self._initialize_knowledge_base()

    def _tokenize(self, text: str) -> List[str]:
        text = text.lower()
        tokens = re.findall(r'\b[a-z0-9_]+\b', text)
        return [t for t in tokens if len(t) > 2]

    def _initialize_knowledge_base(self):
        # Academic & Institutional Knowledge Base Corpus
        self.corpus = [
            {
                "id": "kb-001",
                "title": "EduSphere Academic Grading & CGPA Calculation Policy",
                "content": "CGPA is calculated on a 10-point scale. Courses are weighted by credits. Attendance below 75% results in exam debasement and automated risk flagging.",
                "category": "policy"
            },
            {
                "id": "kb-002",
                "title": "Campus Placement Eligibility & Tier 1 Criteria",
                "content": "Tier 1 product companies require CGPA > 8.0, 3+ full-stack projects, ATS resume score > 80%, and zero active academic backlogs.",
                "category": "placement"
            },
            {
                "id": "kb-003",
                "title": "Data Structures & Algorithms Roadmap",
                "content": "Topics include Binary Search Trees, Graph Traversal BFS/DFS, Dynamic Programming, SuperMemo SM-2 spaced repetition, and Big-O space-time complexity optimization.",
                "category": "course"
            },
            {
                "id": "kb-004",
                "title": "EduShield AI Proctoring & Examination Honor Code",
                "content": "EduShield AI enforces 25 live rules including continuous face visibility, eye gaze tracking, WebRTC VAD voice activity detection, and lockdown of copy-paste/DevTools.",
                "category": "proctor"
            },
            {
                "id": "kb-005",
                "title": "Full-Stack Web Development & Microservices Architecture",
                "content": "Modern web stack includes React, TypeScript, Node.js Express API Gateway, Python FastAPI ML Services, MongoDB Atlas, and Docker containerization.",
                "category": "tech"
            }
        ]
        self._build_index()

    def _build_index(self):
        doc_count = len(self.corpus)
        df: Dict[str, int] = {}

        for doc in self.corpus:
            tokens = set(self._tokenize(doc["content"] + " " + doc["title"]))
            for t in tokens:
                df[t] = df.get(t, 0) + 1

        for term, count in df.items():
            self.idf[term] = math.log((doc_count + 1) / (count + 1)) + 1.0

    def get_vector(self, text: str) -> Dict[str, float]:
        tokens = self._tokenize(text)
        tf: Dict[str, int] = {}
        for t in tokens:
            tf[t] = tf.get(t, 0) + 1
        
        total = max(1, len(tokens))
        tfidf = {}
        for t, count in tf.items():
            tfidf[t] = (count / total) * self.idf.get(t, 1.0)
        return tfidf

    def cosine_similarity(self, vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
        intersection = set(vec1.keys()) & set(vec2.keys())
        numerator = sum([vec1[x] * vec2[x] for x in intersection])

        sum1 = sum([val ** 2 for val in vec1.values()])
        sum2 = sum([val ** 2 for val in vec2.values()])
        denominator = math.sqrt(sum1) * math.sqrt(sum2)

        if not denominator:
            return 0.0
        return float(numerator / denominator)

    def retrieve(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        query_vec = self.get_vector(query)
        results = []

        for doc in self.corpus:
            doc_vec = self.get_vector(doc["content"] + " " + doc["title"])
            sim = self.cosine_similarity(query_vec, doc_vec)
            results.append({
                "id": doc["id"],
                "title": doc["title"],
                "content": doc["content"],
                "category": doc["category"],
                "similarity_score": round(sim, 4)
            })

        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return results[:top_k]

vector_engine = VectorEmbeddingEngine()
