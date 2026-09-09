export class IntentClassifier {
    /**
     * Classifies user prompt into precise intent before generating response.
     * Prevents assuming every prompt containing a language name is a code request.
     */
    static classify(userQuery, pageContext) {
        const q = (userQuery || '').toLowerCase().trim();
        // Detect language if mentioned
        let language = undefined;
        if (/\b(java)\b/i.test(q))
            language = 'java';
        else if (/\b(python|py)\b/i.test(q))
            language = 'python';
        else if (/\b(javascript|js|node|nodejs)\b/i.test(q))
            language = 'javascript';
        else if (/\b(typescript|ts)\b/i.test(q))
            language = 'typescript';
        else if (/\b(c\+\+|cpp)\b/i.test(q))
            language = 'cpp';
        else if (/\b(c)\b/i.test(q) && !/\b(css)\b/i.test(q))
            language = 'c';
        else if (/\b(html|css)\b/i.test(q))
            language = 'html';
        else if (/\b(sql|postgres|mongo|mongodb)\b/i.test(q))
            language = 'sql';
        // 1. Personal Data Telemetry (Attendance, Assignments, Digital Twin, Recall)
        if (q.includes('my attendance') || q.includes('attendance status') || q.includes('what is my attendance') ||
            q.includes('my assignments') || q.includes('pending assignment') ||
            q.includes('learning pace') || q.includes('my twin') || q.includes('my cgpa') ||
            q.includes('recall today') || q.includes('my score') || q.includes('my profile')) {
            return {
                intent: 'PERSONAL_DATA_QUERY',
                agentRole: 'telemetry',
                requiresCode: false,
                requiresUserData: true,
            };
        }
        // 2. Error Explanation & Debugging
        if (q.includes('nullpointerexception') || q.includes('error') || q.includes('exception') ||
            q.includes('stacktrace') || q.includes('typeerror') || q.includes('bug') ||
            q.includes('why am i getting') || q.includes('debug') || q.includes('fix this')) {
            return {
                intent: q.includes('error') || q.includes('exception') || q.includes('nullpointerexception') || q.includes('why am i getting')
                    ? 'ERROR_EXPLANATION'
                    : 'CODE_DEBUGGING',
                agentRole: 'debugging',
                requiresCode: true,
                requiresUserData: false,
                language,
            };
        }
        // 3. Code Review & Code Explanation
        if (q.includes('review this code') || q.includes('optimize this code')) {
            return {
                intent: 'CODE_REVIEW',
                agentRole: 'coding',
                requiresCode: true,
                requiresUserData: false,
                language,
            };
        }
        if (q.includes('explain this code') || q.includes('explain this java code') || q.includes('how does this code work')) {
            return {
                intent: 'CODE_EXPLANATION',
                agentRole: 'coding',
                requiresCode: false,
                requiresUserData: false,
                language,
            };
        }
        // 4. Explicit Code Generation Requests
        if (q.includes('write a') || q.includes('write java') || q.includes('give java program') ||
            q.includes('python code for') || q.includes('write python') || q.includes('implement') ||
            q.includes('create a react') || q.includes('give me code') || q.includes('code for login page') ||
            q.includes('code to reverse') || q.includes('program to reverse') || q.includes('reverse a number')) {
            return {
                intent: 'CODE_GENERATION',
                agentRole: 'coding',
                requiresCode: true,
                requiresUserData: false,
                language,
            };
        }
        // 5. Comparison
        if (q.includes('difference between') || q.includes('versus') || q.includes('vs') || q.includes('compare')) {
            return {
                intent: 'COMPARISON',
                agentRole: 'general',
                requiresCode: false,
                requiresUserData: false,
                language,
            };
        }
        // 6. OOP / Specific Concept Explanation
        if (q.includes('inheritance') || q.includes('polymorphism') || q.includes('encapsulation') || q.includes('abstraction') || q.includes('oop')) {
            return {
                intent: 'CONCEPT_EXPLANATION',
                agentRole: 'general',
                requiresCode: false,
                requiresUserData: false,
                language,
            };
        }
        // 7. General Explanation & Definition
        if (q.startsWith('describe') || q.startsWith('what is') || q.startsWith('explain') ||
            q.includes('overview of') || q.includes('advantages of') || q.includes('definition of') ||
            q.includes('features of')) {
            return {
                intent: 'GENERAL_EXPLANATION',
                agentRole: 'general',
                requiresCode: false,
                requiresUserData: false,
                language,
            };
        }
        // 8. Course & Assignment Help
        if (q.includes('assignment') || q.includes('homework') || q.includes('hint')) {
            return {
                intent: 'ASSIGNMENT_HELP',
                agentRole: 'assignment',
                requiresCode: false,
                requiresUserData: true,
            };
        }
        if (q.includes('course') || q.includes('syllabus') || q.includes('unit')) {
            return {
                intent: 'COURSE_HELP',
                agentRole: 'course',
                requiresCode: false,
                requiresUserData: false,
            };
        }
        // 9. Career & Interview Preparation
        if (q.includes('interview') || q.includes('resume') || q.includes('career') || q.includes('job')) {
            return {
                intent: q.includes('interview') ? 'INTERVIEW_PREPARATION' : q.includes('resume') ? 'RESUME_HELP' : 'CAREER_GUIDANCE',
                agentRole: 'career',
                requiresCode: false,
                requiresUserData: true,
            };
        }
        // Default to GENERAL_EXPLANATION
        return {
            intent: 'GENERAL_EXPLANATION',
            agentRole: 'general',
            requiresCode: false,
            requiresUserData: false,
            language,
        };
    }
}
