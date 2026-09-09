from typing import Dict, Any, List

# Computer Science Core Concept Dependency Graph
CS_KNOWLEDGE_GRAPH = {
    "Operating Systems": {
        "prerequisites": ["Computer Architecture", "C Programming"],
        "children": ["Process", "Threads", "Memory Management", "File Systems"],
    },
    "Process": {
        "prerequisites": ["Operating Systems"],
        "children": ["Threads", "Process Scheduling", "Inter-Process Communication"],
    },
    "Threads": {
        "prerequisites": ["Process"],
        "children": ["Synchronization", "Concurrency", "Race Conditions"],
    },
    "Synchronization": {
        "prerequisites": ["Threads"],
        "children": ["Deadlocks", "Semaphores", "Mutex Locks", "Monitors"],
    },
    "Deadlocks": {
        "prerequisites": ["Synchronization"],
        "children": ["Banker's Algorithm", "Resource Allocation Graph"],
    },
    "Data Structures": {
        "prerequisites": ["Programming Basics"],
        "children": ["Arrays", "Linked Lists", "Stacks & Queues", "Trees", "Graphs"],
    },
    "Trees": {
        "prerequisites": ["Data Structures", "Recursion"],
        "children": ["Binary Search Trees", "AVL Trees", "Heaps", "Tries"],
    },
    "Graphs": {
        "prerequisites": ["Trees", "Recursion"],
        "children": ["BFS & DFS", "Shortest Path (Dijkstra)", "Minimum Spanning Tree"],
    },
    "Database Systems": {
        "prerequisites": ["Data Structures"],
        "children": ["Relational Model", "SQL", "Normalization", "Transactions & ACID", "Indexing"],
    },
}

class KnowledgeGraphEngine:
    """
    Infers prerequisite weaknesses and dependent vulnerable topics based on student mistakes.
    Example: Struggling in 'Synchronization' -> Infer vulnerability in 'Threads' (prerequisite) and 'Deadlocks' (dependent).
    """
    @staticmethod
    def infer_topic_dependencies(weak_topics: List[str]) -> Dict[str, Any]:
        inferred_prerequisites = set()
        inferred_dependents = set()
        hierarchy_path = []

        for topic in weak_topics:
            graph_entry = CS_KNOWLEDGE_GRAPH.get(topic)
            if graph_entry:
                inferred_prerequisites.update(graph_entry.get("prerequisites", []))
                inferred_dependents.update(graph_entry.get("children", []))
                hierarchy_path.append({
                    "topic": topic,
                    "requires": graph_entry.get("prerequisites", []),
                    "leadsTo": graph_entry.get("children", [])
                })
            else:
                # Fallback for generic topics
                hierarchy_path.append({
                    "topic": topic,
                    "requires": ["Core Fundamentals"],
                    "leadsTo": [f"Advanced {topic}"]
                })

        return {
            "flaggedTopics": weak_topics,
            "inferredPrerequisiteWeaknesses": list(inferred_prerequisites),
            "inferredDependentVulnerabilities": list(inferred_dependents),
            "hierarchyPath": hierarchy_path
        }
