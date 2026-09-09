const ROLE_BENCHMARKS = {
    'Frontend Developer': ['React', 'TypeScript', 'Next.js', 'Redux', 'TailwindCSS', 'HTML5', 'CSS3', 'Web Performance', 'REST API', 'Jest', 'Vite', 'Webpack'],
    'Backend Developer': ['Node.js', 'Express', 'Python', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'System Design', 'Microservices', 'REST API', 'GraphQL', 'Kafka'],
    'Fullstack Developer': ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'AWS', 'CI/CD', 'TailwindCSS', 'GraphQL', 'REST API'],
    'AI / ML Engineer': ['Python', 'PyTorch', 'TensorFlow', 'Scikit-Learn', 'Pandas', 'NumPy', 'FastAPI', 'NLP', 'Transformers', 'Computer Vision', 'Deep Learning', 'MLOps'],
    'Data Engineer': ['Python', 'SQL', 'Spark', 'Airflow', 'Snowflake', 'Kafka', 'PostgreSQL', 'ETL', 'Data Warehousing', 'AWS', 'Docker', 'Databricks'],
    'DevOps / Cloud Engineer': ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Linux', 'Bash', 'Prometheus', 'Grafana', 'Python', 'Git', 'Ansible', 'CloudFormation'],
};
const POWER_ACTION_VERBS = [
    'Architected', 'Engineered', 'Optimized', 'Scaled', 'Spearheaded',
    'Automated', 'Implemented', 'Reduced', 'Accelerated', 'Deployed',
    'Refactored', 'Designed', 'Pioneered', 'Streamlined', 'Delivered'
];
export class MLService {
    static calculateATSScore(data) {
        const skills = data.skills || [];
        const summary = data.summary || '';
        const experience = data.experience || [];
        const projects = data.projects || [];
        const education = data.education || [];
        const targetRole = data.targetRole || 'Fullstack Developer';
        const targetKeywords = ROLE_BENCHMARKS[targetRole] || ROLE_BENCHMARKS['Fullstack Developer'];
        const fullText = `${summary} ${skills.join(' ')} ${experience.map(e => e.description).join(' ')} ${projects.map(p => p.description + ' ' + p.technologies.join(' ')).join(' ')}`;
        // 1. Keyword Matching for Target Role (Max 30)
        const matchedTech = targetKeywords.filter(kw => fullText.toLowerCase().includes(kw.toLowerCase()));
        const keywordScore = Math.min(30, Math.round((matchedTech.length / Math.max(1, targetKeywords.length)) * 35));
        // 2. Impact & Action Verbs (Max 25)
        const matchedVerbs = POWER_ACTION_VERBS.filter(verb => fullText.toLowerCase().includes(verb.toLowerCase()));
        const hasNumbers = /\d+%|\d+x|\$\d+|\d+ms|\d+users/i.test(fullText);
        let impactScore = Math.min(15, matchedVerbs.length * 3);
        if (hasNumbers)
            impactScore += 10;
        impactScore = Math.min(25, impactScore);
        // 3. Completeness & PDF Section Structure (Max 20)
        const hasContact = Boolean((data.name && data.email) || /[\w\.-]+@[\w\.-]+\.\w+|\+?\d[\d\s\-\(\)]{8,}\d/.test(fullText));
        const hasSummary = Boolean(summary.length > 20 || /summary|profile|about|objective/i.test(fullText));
        const hasExperience = Boolean(experience.length > 0 || projects.length > 0 || /experience|work|employment|history|projects/i.test(fullText));
        const hasEducation = Boolean(education.length > 0 || /education|university|degree|college|bachelor|master|b\.tech|m\.tech|bca|mca/i.test(fullText));
        let completenessScore = 0;
        if (hasContact)
            completenessScore += 5;
        if (hasSummary || fullText.length > 100)
            completenessScore += 5;
        if (hasExperience)
            completenessScore += 5;
        if (hasEducation)
            completenessScore += 5;
        completenessScore = Math.min(20, Math.max(12, completenessScore));
        // 4. Formatting & Length (Max 15)
        let formatScore = 15;
        if (fullText.length < 150)
            formatScore = 5;
        else if (fullText.length < 300)
            formatScore = 10;
        // 5. Skill Relevance (Max 10)
        const skillRelevanceScore = Math.min(10, Math.round((skills.length / 6) * 10));
        const totalScore = Math.min(100, keywordScore + impactScore + completenessScore + formatScore + skillRelevanceScore);
        const missingKeywords = targetKeywords.filter(kw => !matchedTech.includes(kw));
        const suggestedActionVerbs = POWER_ACTION_VERBS.filter(v => !matchedVerbs.includes(v)).slice(0, 5);
        let rating = 'Needs Improvement';
        if (totalScore >= 90)
            rating = 'Top Tier';
        else if (totalScore >= 80)
            rating = 'Excellent';
        else if (totalScore >= 70)
            rating = 'Good';
        else if (totalScore < 50)
            rating = 'Poor';
        const strengths = [];
        if (matchedTech.length >= 5)
            strengths.push(`Strong technical stack detected (${matchedTech.slice(0, 4).join(', ')})`);
        if (hasNumbers)
            strengths.push('Quantified achievements present (percentages/metrics)');
        if (completenessScore === 20)
            strengths.push('Complete structural breakdown across contact, summary, education, and projects');
        const improvements = [];
        if (!matchedTech.includes('Docker') || !matchedTech.includes('Kubernetes')) {
            improvements.push({ category: 'Cloud & DevOps', tip: 'Add Docker & Kubernetes containerization skills', impact: '+12 pts' });
        }
        if (!hasNumbers) {
            improvements.push({ category: 'Metrics', tip: 'Quantify impact (e.g. "Reduced API latency by 35%")', impact: '+8 pts' });
        }
        if (matchedVerbs.length < 3) {
            improvements.push({ category: 'Action Verbs', tip: 'Use strong verbs like Architected, Optimized, Spearheaded', impact: '+5 pts' });
        }
        const issues = [];
        if (missingKeywords.length > 0) {
            issues.push({
                id: 'iss-kw',
                severity: missingKeywords.length > 3 ? 'high' : 'medium',
                title: `Missing Core ${targetRole} Keywords (${missingKeywords.length})`,
                description: `Your resume lacks essential keywords for ${targetRole}: ${missingKeywords.slice(0, 4).join(', ')}.`,
                solution: `Add missing skills to your resume: ${missingKeywords.join(', ')}.`
            });
        }
        if (!hasNumbers) {
            issues.push({
                id: 'iss-metrics',
                severity: 'high',
                title: 'No Measurable Impact Metrics Found',
                description: 'Resumes with quantitative metrics (e.g. %, latency reductions, scale) get higher ATS pass rates.',
                solution: 'Include numbers in bullet points (e.g., "Reduced latency by 35%").'
            });
        }
        if (matchedVerbs.length < 3) {
            issues.push({
                id: 'iss-verbs',
                severity: 'medium',
                title: 'Weak Action Verbs in Experience',
                description: 'Bullet points should start with strong power action verbs.',
                solution: 'Use action verbs like Architected, Spearheaded, Optimized.'
            });
        }
        return {
            score: totalScore,
            rating,
            breakdown: {
                keywordScore,
                impactScore,
                completenessScore,
                formatScore,
                skillRelevanceScore,
            },
            missingKeywords,
            suggestedActionVerbs,
            formattingTips: [
                'Use clean single-column structure',
                'Use standard section headings (Experience, Education, Skills)',
                'Avoid text inside graphics or tables',
            ],
            strengths,
            improvements,
            issues,
        };
    }
    static getInterviewQuestions(company, role) {
        return [
            {
                id: 'q1',
                company,
                role,
                category: 'HR',
                difficulty: 'Easy',
                question: `Tell me about yourself, your technical background, and why you want to work at ${company} as a ${role}.`,
                expectedKeywords: ['background', 'experience', 'motivation', 'company'],
                modelAnswerOutline: 'Summarize education/experience, highlight key technical accomplishments, and align with company values.',
            },
            {
                id: 'q2',
                company,
                role,
                category: 'Technical',
                difficulty: 'Medium',
                question: `How do you handle state management, performance optimization, and API error handling in a production application?`,
                expectedKeywords: ['state', 'performance', 'error handling', 'caching', 'optimization'],
                modelAnswerOutline: 'Discuss Redux/Context, memoization, lazy loading, try-catch blocks, and global error boundaries.',
            },
            {
                id: 'q3',
                company,
                role,
                category: 'System Design',
                difficulty: 'Hard',
                question: `How would you architect a high-concurrency microservices system for ${company} to handle 100,000 requests/sec with low latency?`,
                expectedKeywords: ['microservices', 'load balancer', 'caching', 'redis', 'database sharding', 'message queue'],
                modelAnswerOutline: 'Explain API Gateway, Redis caching tier, event-driven Architecture (Kafka/RabbitMQ), and DB read replicas.',
            },
            {
                id: 'q4',
                company,
                role,
                category: 'Behavioral',
                difficulty: 'Medium',
                question: `Describe a challenging bug or architecture dispute you faced. How did you resolve it using the STAR format?`,
                expectedKeywords: ['situation', 'task', 'action', 'result', 'collaboration'],
                modelAnswerOutline: 'Use STAR: Situation context, Task responsibility, Action steps taken, and Result with metrics.',
            },
        ];
    }
    static evaluateAnswer(question, answer) {
        const wordCount = answer.split(/\s+/).filter(Boolean).length;
        const lowerAns = answer.toLowerCase();
        const matchedKeywords = question.expectedKeywords.filter(kw => lowerAns.includes(kw.toLowerCase()));
        const missingKeywords = question.expectedKeywords.filter(kw => !lowerAns.includes(kw.toLowerCase()));
        const relevanceScore = Math.min(100, Math.round((matchedKeywords.length / question.expectedKeywords.length) * 100));
        const technicalClarityScore = Math.min(100, wordCount > 30 ? 85 + Math.min(15, Math.floor(wordCount / 10)) : Math.max(30, wordCount * 2));
        const starIndicators = ['situation', 'task', 'action', 'result', 'because', 'resolved', 'metrics', '%'];
        const starCount = starIndicators.filter(ind => lowerAns.includes(ind)).length;
        const starFormatScore = Math.min(100, Math.max(40, starCount * 20));
        const overallScore = Math.round(relevanceScore * 0.4 + technicalClarityScore * 0.3 + starFormatScore * 0.3);
        let feedback = 'Good effort! ';
        if (overallScore >= 85)
            feedback += 'Excellent answer with deep technical terminology and STAR format structure.';
        else if (overallScore >= 70)
            feedback += `Solid response. Try adding more specific keywords like: ${missingKeywords.join(', ')}.`;
        else
            feedback += 'Answer was brief. Expand using the STAR method (Situation, Task, Action, Result).';
        return {
            overallScore,
            relevanceScore,
            technicalClarityScore,
            starFormatScore,
            matchedKeywords,
            missingKeywords,
            feedback,
            improvementTip: missingKeywords.length > 0 ? `Include key concepts: ${missingKeywords.join(', ')}` : 'Quantify your results with percentage or performance metrics.',
            modelAnswer: question.modelAnswerOutline,
        };
    }
}
