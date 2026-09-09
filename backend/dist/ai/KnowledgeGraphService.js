import User from '../models/User.js';
import Course from '../models/Course.js';
import Assignment from '../models/Assignment.js';
import { logger } from '../config/logger.js';
export class KnowledgeGraphService {
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
