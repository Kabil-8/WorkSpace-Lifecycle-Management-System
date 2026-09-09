import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import Course from '../models/Course.js';
import User from '../models/User.js';
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://projectalphateam308_db_user:6dUMWkCu3MYsGcis@cluster0.cuqbzoa.mongodb.net/edusphere?retryWrites=true&w=majority';
// ── 60 DISTINCT REAL COURSES (JAVA, PYTHON, C, JAVASCRIPT) ─────────────────
const JAVA_DISTINCT_COURSES = [
    { title: 'Java Programming Masterclass: From Zero to Hero', level: 'beginner', duration: 45, tags: ['Java', 'Core Java', 'OOP'] },
    { title: 'Enterprise Java & Spring Boot 3 Microservices Architecture', level: 'advanced', duration: 60, tags: ['Java', 'Spring Boot', 'Microservices'] },
    { title: 'Data Structures & Algorithms (DSA) in Java for Technical Interviews', level: 'intermediate', duration: 50, tags: ['Java', 'DSA', 'Algorithms'] },
    { title: 'Advanced Multithreading, Concurrency & Parallel Programming in Java', level: 'advanced', duration: 40, tags: ['Java', 'Concurrency', 'JVM'] },
    { title: 'Java Web Development: Servlets, JSP, Hibernate & JPA Persistence', level: 'intermediate', duration: 48, tags: ['Java', 'Hibernate', 'JPA'] },
    { title: 'Object-Oriented Programming (OOP) & Design Patterns in Java', level: 'intermediate', duration: 35, tags: ['Java', 'OOP', 'Design Patterns'] },
    { title: 'Java Performance Tuning, JVM Memory Management & Garbage Collection', level: 'advanced', duration: 30, tags: ['Java', 'JVM', 'Performance'] },
    { title: 'Building Reactive Applications with Spring WebFlux & Java 21', level: 'advanced', duration: 42, tags: ['Java', 'Spring WebFlux', 'Reactive'] },
    { title: 'Android Native App Development with Java & XML Architecture', level: 'intermediate', duration: 55, tags: ['Java', 'Android', 'Mobile'] },
    { title: 'Test-Driven Development (TDD) in Java with JUnit 5 & Mockito', level: 'intermediate', duration: 28, tags: ['Java', 'Testing', 'JUnit5'] },
    { title: 'Java Network Programming & Socket Communication Protocols', level: 'intermediate', duration: 32, tags: ['Java', 'Networking', 'Sockets'] },
    { title: 'Building Secure RESTful APIs with Java, Spring Security & JWT Auth', level: 'advanced', duration: 44, tags: ['Java', 'Spring Security', 'JWT'] },
    { title: 'Kafka Event-Driven Architecture with Java & Spring Cloud Stream', level: 'advanced', duration: 50, tags: ['Java', 'Kafka', 'Event-Driven'] },
    { title: 'Java Functional Programming: Streams API, Lambdas & Optional', level: 'beginner', duration: 25, tags: ['Java', 'Functional', 'Streams'] },
    { title: 'Building Scalable Cloud Microservices with Java & Docker', level: 'advanced', duration: 65, tags: ['Java', 'Cloud', 'Microservices'] },
];
const PYTHON_DISTINCT_COURSES = [
    { title: 'Complete Python Bootcamp: Go from Zero to Hero in Python 3', level: 'beginner', duration: 40, tags: ['Python', 'Core Python', 'Scripting'] },
    { title: 'Python for Data Science, Machine Learning & AI Masterclass', level: 'advanced', duration: 65, tags: ['Python', 'Machine Learning', 'AI'] },
    { title: 'Full-Stack Web Development with Python, Django & REST Framework', level: 'intermediate', duration: 55, tags: ['Python', 'Django', 'REST API'] },
    { title: 'FastAPI & Async Microservices Development in Python', level: 'intermediate', duration: 38, tags: ['Python', 'FastAPI', 'Async'] },
    { title: 'Automate the Boring Stuff with Python Scripting & OS Automation', level: 'beginner', duration: 30, tags: ['Python', 'Automation', 'Scripting'] },
    { title: 'Data Analysis & Visualization with Python Pandas, NumPy & Seaborn', level: 'intermediate', duration: 42, tags: ['Python', 'Pandas', 'NumPy'] },
    { title: 'Deep Learning & Computer Vision with PyTorch & OpenCV in Python', level: 'advanced', duration: 60, tags: ['Python', 'Deep Learning', 'PyTorch'] },
    { title: 'Web Scraping, Automation & Crawling with Python & Selenium', level: 'intermediate', duration: 28, tags: ['Python', 'Web Scraping', 'Selenium'] },
    { title: 'Cybersecurity & Ethical Hacking Network Scripts in Python', level: 'advanced', duration: 48, tags: ['Python', 'Cybersecurity', 'Networking'] },
    { title: 'Natural Language Processing (NLP) & LLM Applications with Python', level: 'advanced', duration: 52, tags: ['Python', 'NLP', 'LLM'] },
    { title: 'Python GUI Desktop Application Development with PyQt6', level: 'beginner', duration: 32, tags: ['Python', 'PyQt6', 'Desktop'] },
    { title: 'Building Async Web Crawlers & Scrapers with Scrapy & Asyncio', level: 'intermediate', duration: 26, tags: ['Python', 'Scrapy', 'Asyncio'] },
    { title: 'Python Algorithmic Trading & Quantitative Financial Data Analytics', level: 'advanced', duration: 45, tags: ['Python', 'Finance', 'Trading'] },
    { title: 'TensorFlow 2.0 & Neural Networks Masterclass in Python', level: 'advanced', duration: 58, tags: ['Python', 'TensorFlow', 'AI'] },
    { title: 'Python Clean Code, Refactoring & Architectural Design Patterns', level: 'intermediate', duration: 34, tags: ['Python', 'Clean Code', 'Design Patterns'] },
];
const C_DISTINCT_COURSES = [
    { title: 'C Programming Masterclass: Pointers, Memory & Data Structures', level: 'beginner', duration: 42, tags: ['C', 'Pointers', 'Memory'] },
    { title: 'Systems Programming & POSIX Operating System Engineering in C', level: 'advanced', duration: 55, tags: ['C', 'Systems', 'POSIX'] },
    { title: 'C Language Dynamic Memory Allocation, Heaps & Valgrind Debugging', level: 'intermediate', duration: 32, tags: ['C', 'Memory Allocation', 'Valgrind'] },
    { title: 'Embedded Systems Programming in C for Microcontrollers (STM32/ARM)', level: 'advanced', duration: 60, tags: ['C', 'Embedded', 'STM32'] },
    { title: 'Building a Custom Operating System Kernel from Scratch in C & Assembly', level: 'advanced', duration: 70, tags: ['C', 'OS Kernel', 'Assembly'] },
    { title: 'Network Socket Programming & TCP/IP Protocols in C', level: 'intermediate', duration: 38, tags: ['C', 'Sockets', 'Networking'] },
    { title: 'Game Engine Physics & Graphics Programming in C with Raylib', level: 'intermediate', duration: 46, tags: ['C', 'Game Engine', 'Raylib'] },
    { title: 'Advanced Data Structures & Graph Algorithms Implemented in C', level: 'intermediate', duration: 48, tags: ['C', 'DSA', 'Graphs'] },
    { title: 'Compiler Design & Building a Language Lexer & Parser in C', level: 'advanced', duration: 62, tags: ['C', 'Compilers', 'Parser'] },
    { title: 'Linux Device Driver Development & Kernel Module Hacking in C', level: 'advanced', duration: 65, tags: ['C', 'Linux Kernel', 'Device Drivers'] },
    { title: 'C Multi-threading, Synchronization & POSIX Pthreads Deep Dive', level: 'intermediate', duration: 36, tags: ['C', 'Pthreads', 'Concurrency'] },
    { title: 'Bitwise Manipulation, Hardware Registers & Low-Level C Controls', level: 'beginner', duration: 28, tags: ['C', 'Bitwise', 'Hardware'] },
    { title: 'Building a Fast Relational Database Engine from Scratch in C', level: 'advanced', duration: 58, tags: ['C', 'Database Engine', 'B-Tree'] },
    { title: 'Secure C Coding Practices & Buffer Overflow Vulnerability Auditing', level: 'intermediate', duration: 30, tags: ['C', 'Security', 'Buffer Overflow'] },
    { title: 'C Preprocessor Magic, Macro Engineering & Metaprogramming Patterns', level: 'intermediate', duration: 25, tags: ['C', 'Macros', 'Metaprogramming'] },
];
const JAVASCRIPT_DISTINCT_COURSES = [
    { title: 'The Complete JavaScript Course 2026: From Beginner to Advanced JS', level: 'beginner', duration: 50, tags: ['JavaScript', 'ES6+', 'DOM'] },
    { title: 'Full-Stack JavaScript: React 19, Node.js, Express & MongoDB (MERN)', level: 'advanced', duration: 65, tags: ['JavaScript', 'React', 'Node.js'] },
    { title: 'Asynchronous JavaScript, Promises, Event Loop & V8 Engine Architecture', level: 'intermediate', duration: 35, tags: ['JavaScript', 'Event Loop', 'V8 Engine'] },
    { title: 'TypeScript & Enterprise Application Architecture with Modern JS', level: 'intermediate', duration: 42, tags: ['JavaScript', 'TypeScript', 'Architecture'] },
    { title: 'Next.js 15 & Server Components: Production Full-Stack Web Development', level: 'advanced', duration: 52, tags: ['JavaScript', 'Next.js', 'React'] },
    { title: 'Node.js Microservices Architecture & Event-Driven Systems in JavaScript', level: 'advanced', duration: 58, tags: ['JavaScript', 'Node.js', 'Microservices'] },
    { title: 'JavaScript Data Structures, Algorithms & LeetCode Solution Guide', level: 'intermediate', duration: 45, tags: ['JavaScript', 'DSA', 'LeetCode'] },
    { title: 'Modern Frontend Testing Suite: Jest, Vitest, Cypress & Playwright', level: 'intermediate', duration: 38, tags: ['JavaScript', 'Testing', 'Jest'] },
    { title: 'Building Real-Time Web Applications with WebSockets & Socket.IO', level: 'intermediate', duration: 32, tags: ['JavaScript', 'Socket.IO', 'WebSockets'] },
    { title: 'React Native & Cross-Platform Mobile App Development with JavaScript', level: 'intermediate', duration: 48, tags: ['JavaScript', 'React Native', 'Mobile'] },
    { title: 'JavaScript Design Patterns, SOLID Principles & Clean Code Architecture', level: 'intermediate', duration: 30, tags: ['JavaScript', 'Design Patterns', 'Clean Code'] },
    { title: 'GraphQL, Apollo Client & Node.js API Masterclass in JavaScript', level: 'advanced', duration: 40, tags: ['JavaScript', 'GraphQL', 'Apollo'] },
    { title: 'Web Performance Optimization & Browser Rendering Pipeline in JS', level: 'advanced', duration: 28, tags: ['JavaScript', 'Performance', 'Web Vitals'] },
    { title: 'Electron.js: Building Cross-Platform Desktop Apps with Modern JS', level: 'intermediate', duration: 36, tags: ['JavaScript', 'Electron', 'Desktop App'] },
    { title: 'Modern Web Animation & 3D Web Development with Three.js & Framer Motion', level: 'intermediate', duration: 42, tags: ['JavaScript', 'Three.js', '3D Web'] },
];
async function reseedDistinctRealCourses() {
    try {
        console.log('🔗 Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB Atlas\n');
        console.log('🗑️ Clearing old course entries...');
        await Course.deleteMany({});
        console.log('✅ Old courses cleared successfully!\n');
        const facultyUsers = await User.find({ role: { $in: ['faculty', 'hod', 'admin'] } }).select('_id name department').lean();
        const defaultFaculty = facultyUsers[0] || { _id: new mongoose.Types.ObjectId(), name: 'Dr. Sarah Mitchell', department: 'Computer Science & Engineering' };
        const allDistinctCourses = [
            ...JAVA_DISTINCT_COURSES,
            ...PYTHON_DISTINCT_COURSES,
            ...C_DISTINCT_COURSES,
            ...JAVASCRIPT_DISTINCT_COURSES,
        ];
        const coursesToInsert = [];
        allDistinctCourses.forEach((c, idx) => {
            const faculty = facultyUsers[idx % facultyUsers.length] || defaultFaculty;
            coursesToInsert.push({
                title: c.title,
                description: `Comprehensive, practical course on ${c.tags[0]}. Learn ${c.title} step-by-step through real-world projects, live coding exercises, and industry best practices.`,
                instructor: faculty._id,
                instructorName: faculty.name,
                department: faculty.department || 'Computer Science & Engineering',
                level: c.level,
                status: 'published',
                tags: c.tags,
                duration: c.duration,
                enrolledCount: Math.floor(Math.random() * 650) + 200,
                rating: Number((Math.random() * 0.7 + 4.3).toFixed(1)),
                reviewCount: Math.floor(Math.random() * 250) + 50,
                prerequisites: [`${c.tags[0]} Basics`],
                objectives: [
                    `Master production-ready ${c.tags[0]} development`,
                    `Build 4+ real-world projects in ${c.tags[1] || c.tags[0]}`,
                    `Pass top tech company coding interviews`,
                ],
                language: 'English',
                credits: 4,
                semester: (idx % 8) + 1,
            });
        });
        console.log(`🚀 Inserting ${coursesToInsert.length} DISTINCT Java, Python, C, and JavaScript courses into MongoDB Atlas...`);
        const result = await Course.insertMany(coursesToInsert);
        console.log(`✅ SUCCESS! Seeded ${result.length} unique, distinct real courses. No duplicate Part titles!`);
        process.exit(0);
    }
    catch (err) {
        console.error('❌ Error reseeding courses:', err);
        process.exit(1);
    }
}
reseedDistinctRealCourses();
