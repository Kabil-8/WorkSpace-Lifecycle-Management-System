export class MultiAgentRouter {
    static determineAgent(query, role) {
        const q = query.toLowerCase();
        // Inspect ONLY the active query to prevent context bleed from previous session topics
        if (q.includes('code') || q.includes('debug') || q.includes('java') || q.includes('python') || q.includes('compiler') || q.includes('algorithm') || q.includes('function') || q.includes('syntax') || q.includes('script'))
            return 'coding';
        if (q.includes('job') || q.includes('placement') || q.includes('resume') || q.includes('ats') || q.includes('interview'))
            return 'placement';
        if (q.includes('attendance') || q.includes('shortage') || q.includes('eligible'))
            return 'attendance';
        if (q.includes('quiz') || q.includes('exam') || q.includes('test') || q.includes('question paper'))
            return 'quiz';
        if (q.includes('assignment') || q.includes('homework') || q.includes('submission'))
            return 'assignment';
        if (q.includes('schedule') || q.includes('timetable') || q.includes('calendar') || q.includes('event'))
            return 'scheduling';
        if (q.includes('research') || q.includes('paper') || q.includes('thesis') || q.includes('citation'))
            return 'research';
        if (q.includes('document') || q.includes('pdf') || q.includes('docx') || q.includes('notes'))
            return 'document';
        if (q.includes('analytics') || q.includes('report') || q.includes('metrics') || q.includes('gpa'))
            return 'analytics';
        if (q.includes('notify') || q.includes('announcement') || q.includes('alert'))
            return 'notification';
        if (q.includes('plan') || q.includes('roadmap') || q.includes('strategy') || q.includes('workflow'))
            return 'planner';
        if (role === 'admin' || role === 'super_admin' || role === 'hod')
            return 'administration';
        if (role === 'faculty' || role === 'teacher')
            return 'faculty';
        if (role === 'parent')
            return 'parent';
        return 'academic';
    }
    static getAgentPrompt(agent) {
        const personaPrompts = {
            planner: `\n[SPECIALIST CONTEXT: Workflow Planner] Help structure multi-step tasks when requested.`,
            academic: `\n[SPECIALIST CONTEXT: Academic OS] Assist with student performance and platform modules.`,
            attendance: `\n[SPECIALIST CONTEXT: Attendance Diagnostic] Provide exact attendance metrics from live data.`,
            placement: `\n[SPECIALIST CONTEXT: Career Advisor] Assist with resume building, ATS matching, and interviews.`,
            analytics: `\n[SPECIALIST CONTEXT: Data Analytics] Surface data trends and performance metrics.`,
            memory: `\n[SPECIALIST CONTEXT: Memory Recall] Reference relevant past context when helpful.`,
            research: `\n[SPECIALIST CONTEXT: Academic Research] Assist with thesis writing, citations, and literature.`,
            scheduling: `\n[SPECIALIST CONTEXT: Schedule Specialist] Assist with calendar events and timetable planning.`,
            recommendation: `\n[SPECIALIST CONTEXT: Learning Recommender] Recommend study materials and courses.`,
            document: `\n[SPECIALIST CONTEXT: Document Intelligence] Answer queries regarding ingested documents.`,
            notification: `\n[SPECIALIST CONTEXT: Campus Dispatch] Draft campus announcements and notifications.`,
            security: `\n[SPECIALIST CONTEXT: Security Guardian] Enforce role permissions and compliance.`,
            coding: `\n[SPECIALIST CONTEXT: Senior Software Engineer & Code Mentor] Provide production code with fenced blocks, complexity analysis, and debugging tips. Answer coding requests directly.`,
            quiz: `\n[SPECIALIST CONTEXT: Assessment Creator] Assist with drafting quiz questions and rubrics.`,
            assignment: `\n[SPECIALIST CONTEXT: Assignment Manager] Assist with assignment deadlines and grading.`,
            administration: `\n[SPECIALIST CONTEXT: Platform Governor] Provide administrative metrics and department stats.`,
            faculty: `\n[SPECIALIST CONTEXT: Educator Co-Pilot] Assist faculty with course management.`,
            student: `\n[SPECIALIST CONTEXT: Student Companion] Assist students with study goals.`,
            parent: `\n[SPECIALIST CONTEXT: Parent Portal Assistant] Provide clear academic summaries for parents.`,
        };
        return personaPrompts[agent] || personaPrompts.academic;
    }
}
