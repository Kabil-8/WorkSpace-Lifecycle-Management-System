from typing import Dict, Any, List
from embedding_engine import vector_engine
from memory_engine import memory_engine

class RAGPromptEngine:
    """
    RAG (Retrieval-Augmented Generation) Pipeline combining:
    1. Institutional Vector Knowledge Base
    2. Persistent EDEN User Memory
    3. User Context & Role-Based Prompt Adaptation
    """
    @staticmethod
    def generate_rag_context(user_id: str, query: str, role: str = "student", name: str = "Candidate") -> Dict[str, Any]:
        # 1. Retrieve relevant Knowledge Base snippets
        kb_matches = vector_engine.retrieve(query, top_k=2)

        # 2. Retrieve user memory & preferences
        user_mem = memory_engine.get_or_create_memory(user_id, role, name)

        # 3. Construct context payload
        context_str = (
            f"User: {user_mem['name']} ({user_mem['role'].upper()})\n"
            f"Career Goal: {user_mem['career_goal']}\n"
            f"Top Skills: {', '.join(user_mem['skill_progression'].keys())}\n"
            f"Relevant Knowledge Base Articles:\n" +
            "\n".join([f"- {kb['title']}: {kb['content']}" for kb in kb_matches])
        )

        return {
            "query": query,
            "role": role,
            "userName": name,
            "rag_context": context_str,
            "kb_sources": [kb["title"] for kb in kb_matches],
            "user_memory": {
                "career_goal": user_mem["career_goal"],
                "learning_preferences": user_mem["learning_preferences"]
            }
        }

rag_prompt_engine = RAGPromptEngine()
