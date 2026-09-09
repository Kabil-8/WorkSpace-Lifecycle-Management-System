import User from '../models/User.js';
import Course from '../models/Course.js';
import Assignment from '../models/Assignment.js';
import { logger } from '../config/logger.js';
// Computer Science Core Concept Dependency Ontology
export const CS_KNOWLEDGE_GRAPH = {
    'Operating Systems': {
        prerequisites: ['Computer Architecture', 'C Programming'],
        children: ['Process', 'Threads', 'Memory Management', 'File Systems'],
    },
    'Process': {
        prerequisites: ['Operating Systems'],
        children: ['Threads', 'Process Scheduling', 'Inter-Process Communication'],
    },
    'Threads': {
        prerequisites: ['Process'],
        children: ['Synchronization', 'Concurrency', 'Race Conditions'],
    },
    'Synchronization': {
        prerequisites: ['Threads'],
        children: ['Deadlocks', 'Semaphores', 'Mutex Locks', 'Monitors'],
    },
    'Deadlocks': {
        prerequisites: ['Synchronization'],
        children: ["Banker's Algorithm", 'Resource Allocation Graph'],
    },
    'Data Structures': {
        prerequisites: ['Programming Basics'],
        children: ['Arrays', 'Linked Lists', 'Stacks & Queues', 'Trees', 'Graphs'],
    },
    'Trees': {
        prerequisites: ['Data Structures', 'Recursion'],
        children: ['Binary Search Trees', 'AVL Trees', 'Heaps', 'Tries'],
    },
    'Binary Search Trees': {
        prerequisites: ['Trees', 'Recursion'],
        children: ['AVL Trees', 'Red-Black Trees', 'Tree Rotations'],
    },
    'Graphs': {
        prerequisites: ['Trees', 'Recursion'],
        children: ['BFS & DFS', 'Shortest Path (Dijkstra)', 'Minimum Spanning Tree'],
    },
    'Dynamic Programming': {
        prerequisites: ['Recursion', 'Divide & Conquer', 'Arrays'],
        children: ['Knapsack Problem', 'Longest Common Subsequence', 'Matrix Chain Multiplication'],
    },
    'Database Systems': {
        prerequisites: ['Data Structures'],
        children: ['Relational Model', 'SQL', 'Normalization', 'Transactions & ACID', 'Indexing'],
    },
    'SQL': {
        prerequisites: ['Relational Model', 'Database Systems'],
        children: ['Joins & Subqueries', 'Aggregations', 'Indexes & Performance Tuning'],
    },
};
export class KnowledgeGraphService {
    /**
     * Infers prerequisite weaknesses and foundational gaps from weak topics.
     * Example: Struggling with 'Dynamic Programming' ➜ Infer weakness in 'Recursion' and 'Divide & Conquer'.
     */
    static inferPrerequisites(weakTopics) {
        const inferredPrereqs = new Set();
        const recommendedPath = [];
        for (const topic of weakTopics) {
            const match = Object.keys(CS_KNOWLEDGE_GRAPH).find(k => k.toLowerCase() === topic.toLowerCase() || topic.toLowerCase().includes(k.toLowerCase()));
            if (match && CS_KNOWLEDGE_GRAPH[match]) {
                const entry = CS_KNOWLEDGE_GRAPH[match];
                entry.prerequisites.forEach(p => inferredPrereqs.add(p));
                recommendedPath.push({
                    topic: match,
                    requires: entry.prerequisites,
                    leadsTo: entry.children,
                });
            }
            else {
                recommendedPath.push({
                    topic,
                    requires: ['Core Fundamentals'],
                    leadsTo: [`Advanced ${topic}`],
                });
            }
        }
        return {
            flaggedTopics: weakTopics,
            inferredPrerequisites: Array.from(inferredPrereqs),
            recommendedPath,
        };
    }
    /**
     * Constructs an in-memory knowledge graph representation of campus entities
     */
    static async buildGraph(department) {
        try {
            const filter = department ? { department } : {};
            const [users, courses, assignments] = await Promise.all([
                User.find(filter).select('_id name role department').limit(20).lean(),
                Course.find(filter).select('_id title department').limit(10).lean(),
                Assignment.find(filter).select('_id title courseName').limit(15).lean(),
            ]);
            const nodes = [];
            const edges = [];
            for (const u of users) {
                nodes.push({ id: u._id.toString(), label: u.name, type: u.role === 'student' ? 'student' : 'faculty' });
            }
            for (const c of courses) {
                nodes.push({ id: c._id.toString(), label: c.title, type: 'course' });
            }
            for (const a of assignments) {
                nodes.push({ id: a._id.toString(), label: a.title, type: 'assignment' });
            }
            logger.info({ nodeCount: nodes.length, edgeCount: edges.length }, '[KnowledgeGraphService] Knowledge Graph built');
            return { nodes, edges };
        }
        catch (err) {
            logger.error({ err: err.message }, '[KnowledgeGraphService] Graph building failed');
            return { nodes: [], edges: [] };
        }
    }
}
