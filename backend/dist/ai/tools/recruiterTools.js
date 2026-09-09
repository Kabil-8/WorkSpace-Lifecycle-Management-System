import User from '../../models/User.js';
import { logger } from '../../config/logger.js';
export const recruiterTools = [
    {
        name: 'search_eligible_students',
        description: 'Search for students matching job eligibility criteria: minimum CGPA, branch/department, skills, and graduation year.',
        requiresAuth: true,
        allowedRoles: ['recruiter', 'placement_officer', 'admin', 'super_admin'],
        parameters: {
            type: 'object',
            properties: {
                minCGPA: { type: 'number', description: 'Minimum CGPA required (e.g., 7.5)' },
                department: { type: 'string', description: 'Branch/department filter (e.g., "Computer Science")' },
                skills: { type: 'string', description: 'Comma-separated required skills (e.g., "React, Node.js, MongoDB")' },
                batch: { type: 'string', description: 'Graduation batch/year (e.g., "2025")' },
                limit: { type: 'number', description: 'Max results to return (default: 20)' },
            },
        },
        execute: async (args, _userContext) => {
            try {
                const filter = { role: 'student', isActive: true };
                if (args?.minCGPA)
                    filter.cgpa = { $gte: Number(args.minCGPA) };
                if (args?.department)
                    filter.department = new RegExp(args.department, 'i');
                if (args?.batch)
                    filter.batch = args.batch;
                // Skills filter: check if any of the required skills appear in user.skills array
                const requiredSkills = args?.skills
                    ? args.skills.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
                    : [];
                let students = await User.find(filter)
                    .select('name email department semester cgpa skills batch rollNumber placementReadiness')
                    .limit(args?.limit || 20)
                    .lean();
                // Post-filter by skills (case-insensitive substring match)
                if (requiredSkills.length > 0) {
                    students = students.filter(s => {
                        const studentSkills = (s.skills || []).map(sk => sk.toLowerCase());
                        return requiredSkills.some((rs) => studentSkills.some(ss => ss.includes(rs) || rs.includes(ss)));
                    });
                }
                if (students.length === 0) {
                    return {
                        hasData: false,
                        message: `No students found matching the criteria: CGPA ≥ ${args?.minCGPA || 'any'}, Department: ${args?.department || 'any'}, Skills: ${args?.skills || 'any'}`,
                    };
                }
                return {
                    hasData: true,
                    count: students.length,
                    criteria: {
                        minCGPA: args?.minCGPA,
                        department: args?.department,
                        skills: requiredSkills,
                        batch: args?.batch,
                    },
                    students: students.map(s => ({
                        name: s.name,
                        department: s.department,
                        cgpa: s.cgpa,
                        skills: s.skills,
                        batch: s.batch,
                        rollNumber: s.rollNumber,
                        placementReadiness: s.placementReadiness,
                    })),
                };
            }
            catch (err) {
                logger.error({ err: err.message }, '[recruiterTools] search_eligible_students error');
                return { hasData: false, message: 'Could not search students.' };
            }
        },
    },
];
