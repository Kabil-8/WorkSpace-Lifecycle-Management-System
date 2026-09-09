import dotenv from 'dotenv'
dotenv.config()

import dns from 'dns'
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1'])
} catch (e) {}

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import Course from '../models/Course.js'
import Assignment from '../models/Assignment.js'
import Job from '../models/Job.js'
import EventModel from '../models/Event.js'
import ForumPost from '../models/ForumPost.js'
import Gamification from '../models/Gamification.js'
import Department from '../models/Department.js'
import AuditLog from '../models/AuditLog.js'
import Notification from '../models/Notification.js'
import { Exam } from '../models/proctor/Exam.js'
import { StudentAttendance } from '../models/attendance/StudentAttendance.js'

// ── Data Generators ─────────────────────────────────────────────────────────
const FIRST_NAMES = ['Arjun', 'Priya', 'Rahul', 'Sneha', 'Vikram', 'Neha', 'Karan', 'Ananya', 'Rohit', 'Pooja',
  'Aditya', 'Riya', 'Siddharth', 'Kavya', 'Nikhil', 'Shruti', 'Amit', 'Divya', 'Kunal', 'Meera',
  'Akash', 'Simran', 'Harsh', 'Anika', 'Rajesh', 'Poonam', 'Deepak', 'Sanya', 'Manish', 'Naina',
  'Alex', 'Emily', 'James', 'Sophie', 'Daniel', 'Olivia', 'Mohammed', 'Fatima', 'Chen', 'Lin',
  'Varun', 'Ishita', 'Ankit', 'Pallavi', 'Gaurav', 'Ritika', 'Sumit', 'Ankita', 'Shubham', 'Komal',
  'Abhishek', 'Preeti', 'Kartik', 'Monika', 'Himanshu', 'Swati', 'Mayank', 'Aarti', 'Pranav', 'Tanvi',
  'Aryan', 'Shreya', 'Raunak', 'Sonali', 'Rishabh', 'Kajal', 'Chirag', 'Bhavna', 'Dhruv', 'Rashmi']

const LAST_NAMES = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Joshi', 'Malhotra', 'Kapoor', 'Verma', 'Shah',
  'Reddy', 'Nair', 'Pillai', 'Iyer', 'Menon', 'Chatterjee', 'Banerjee', 'Das', 'Bose', 'Roy',
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Moore', 'Taylor',
  'Mehta', 'Agarwal', 'Saxena', 'Mishra', 'Tiwari', 'Pandey', 'Yadav', 'Chaudhary', 'Srivastava', 'Dwivedi']

const DEPARTMENTS = [
  { name: 'Computer Science & Engineering', code: 'CSE' },
  { name: 'Electronics & Communication Engineering', code: 'ECE' },
  { name: 'Mechanical Engineering', code: 'ME' },
  { name: 'Civil Engineering', code: 'CE' },
  { name: 'Information Technology', code: 'IT' },
  { name: 'Electrical Engineering', code: 'EE' },
  { name: 'Data Science & AI', code: 'DSAI' },
  { name: 'Business Administration', code: 'MBA' },
  { name: 'Applied Mathematics', code: 'MATH' },
  { name: 'Physics & Quantum Computing', code: 'PHY' },
]

const SUBJECTS = {
  CSE: ['Data Structures & Algorithms', 'Operating Systems', 'Database Management', 'Computer Networks', 'Software Engineering', 'Cloud Computing', 'Machine Learning', 'Web Development', 'System Design', 'Compiler Design'],
  ECE: ['Digital Electronics', 'Signals & Systems', 'VLSI Design', 'Embedded Systems', 'Communication Systems', 'Microprocessors', 'Antenna Theory', 'Control Systems'],
  ME: ['Engineering Mechanics', 'Thermodynamics', 'Fluid Mechanics', 'Manufacturing Processes', 'CAD/CAM', 'Heat Transfer'],
  IT: ['Web Technologies', 'Cybersecurity', 'Blockchain', 'IoT', 'Big Data Analytics', 'DevOps'],
  DSAI: ['Machine Learning', 'Deep Learning', 'Natural Language Processing', 'Computer Vision', 'Data Analytics', 'Statistics'],
}

const COMPANIES = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Tesla', 'Infosys', 'TCS', 'Wipro',
  'Cognizant', 'Accenture', 'IBM', 'Oracle', 'Salesforce', 'Adobe', 'Uber', 'Swiggy', 'Zomato',
  'Flipkart', 'Razorpay', 'PhonePe', 'Zepto', 'Meesho', 'CRED', 'Groww', 'Zerodha', 'Paytm']

function randomName(): string {
  return `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`
}

function randomDept(): string {
  return DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)].name
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number, decimals = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function randomDate(daysBack = 180, daysForward = 0): Date {
  const now = Date.now()
  return new Date(now - daysBack * 24 * 60 * 60 * 1000 + Math.random() * (daysBack + daysForward) * 24 * 60 * 60 * 1000)
}

// ── Main Seed Function ──────────────────────────────────────────────────────
async function seed() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://projectalphateam308_db_user:6dUMWkCu3MYsGcis@cluster0.cuqbzoa.mongodb.net/edusphere?retryWrites=true&w=majority'

  console.log('\n🌱 EduSphere Seed Script v2.0 — Starting...\n')
  console.log('🔗 Connecting to MongoDB Atlas...')

  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 })
  console.log('✅ MongoDB Connected\n')

  // ── Clear All Collections ─────────────────────────────────────────────────
  console.log('🗑️  Clearing existing data...')
  await Promise.all([
    User.deleteMany({}), Course.deleteMany({}), Assignment.deleteMany({}),
    Job.deleteMany({}), EventModel.deleteMany({}), ForumPost.deleteMany({}),
    Gamification.deleteMany({}), Department.deleteMany({}), AuditLog.deleteMany({}),
    Notification.deleteMany({}), Exam.deleteMany({}),
    StudentAttendance.deleteMany({}),
  ])
  console.log('✅ All collections cleared\n')

  const PASSWORD_HASH = await bcrypt.hash('EduSphere@2026', 12)

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: DEPARTMENTS (10)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📚 Seeding 10 Departments...')
  const deptDocs = await Department.insertMany(DEPARTMENTS.map((d, i) => ({
    ...d,
    description: `${d.name} department — offering cutting-edge programs since 2005.`,
    established: 2005 + i,
    building: `Block ${String.fromCharCode(65 + i)}`,
    email: `${d.code.toLowerCase()}@edusphere.ai`,
    phone: `+91-${8000000000 + i * 1000}`,
    facultyCount: randomInt(8, 20),
    studentCount: randomInt(120, 250),
    courseCount: randomInt(15, 35),
  })))
  console.log(`   ✅ ${deptDocs.length} departments created`)

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: NAMED ACCOUNTS (12 fixed)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n👤 Seeding named accounts...')
  const namedAccounts = [
    { name: 'Alex Johnson', email: 'student@edusphere.ai', role: 'student', department: 'Computer Science & Engineering', rollNumber: 'CS2021001', semester: 6, batch: '2021-25', cgpa: 8.6, xp: 4250, level: 9, streak: 12 },
    { name: 'Dr. Sarah Mitchell', email: 'faculty@edusphere.ai', role: 'faculty', department: 'Computer Science & Engineering', employeeId: 'FAC001', cgpa: 0, xp: 8500, level: 18 },
    { name: 'Marcus Rivera', email: 'mentor@edusphere.ai', role: 'mentor', department: 'Computer Science & Engineering', xp: 6200, level: 13 },
    { name: 'Diana Chen', email: 'admin@edusphere.ai', role: 'admin', department: 'Computer Science & Engineering', xp: 9500, level: 19 },
    { name: 'James Walker', email: 'recruiter@edusphere.ai', role: 'recruiter', department: 'Business Administration', xp: 3200, level: 7 },
    { name: 'Patricia Johnson', email: 'parent@edusphere.ai', role: 'parent', department: 'Computer Science & Engineering', xp: 500, level: 2 },
    { name: 'Samuel Osei', email: 'placement@edusphere.ai', role: 'placement_officer', department: 'Computer Science & Engineering', xp: 5100, level: 11 },
    { name: 'Dr. Robert Lee', email: 'hod@edusphere.ai', role: 'hod', department: 'Computer Science & Engineering', xp: 11200, level: 23 },
    { name: 'Dr. Elena Vasquez', email: 'researcher@edusphere.ai', role: 'researcher', department: 'Data Science & AI', xp: 7800, level: 16 },
    { name: 'Kevin Zhang', email: 'alumni@edusphere.ai', role: 'alumni', department: 'Computer Science & Engineering', xp: 5800, level: 12 },
    { name: 'Priya Sharma', email: 'industry@edusphere.ai', role: 'industry_partner', department: 'Business Administration', xp: 4100, level: 9 },
    { name: 'SuperAdmin', email: 'superadmin@edusphere.ai', role: 'super_admin', department: 'Computer Science & Engineering', xp: 99999, level: 50 },
  ]

  const namedUsers = await User.insertMany(namedAccounts.map(u => ({
    ...u,
    passwordHash: PASSWORD_HASH,
    isVerified: true,
    isActive: true,
    skills: ['JavaScript', 'Python', 'React', 'Node.js', 'MongoDB'],
    edenStage: u.xp > 8000 ? 'nexus' : u.xp > 4000 ? 'guardian' : 'assistant',
    placementReadiness: randomInt(60, 95),
    careerGoal: 'SDE at Top Tech Company',
    lastLoginAt: new Date(),
    bio: `${u.role.charAt(0).toUpperCase() + u.role.slice(1)} at EduSphere AI Platform`,
  })))
  console.log(`   ✅ ${namedUsers.length} named accounts created`)

  // Link parent to student (Alex Johnson <-> Patricia Johnson)
  const alexStudent = namedUsers.find(u => u.email === 'student@edusphere.ai')
  const parentUser = namedUsers.find(u => u.email === 'parent@edusphere.ai')
  if (alexStudent && parentUser) {
    await User.findByIdAndUpdate(parentUser._id, {
      linkedStudentId: alexStudent._id,
      linkedStudentIds: [alexStudent._id],
    })
    await User.findByIdAndUpdate(alexStudent._id, { parentId: parentUser._id })
  }

  // Update department HoD
  const hodUser = namedUsers.find(u => u.role === 'hod')
  if (hodUser) {
    await Department.findOneAndUpdate(
      { code: 'CSE' },
      { hodId: hodUser._id, hodName: hodUser.name }
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3: BULK USERS — 500 Students + 80 Faculty + 15 Mentors + 10 Recruiters + 20 Parents
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n👥 Seeding bulk users (625 users)...')

  const studentBatch: any[] = []
  for (let i = 0; i < 500; i++) {
    const name = randomName()
    const dept = randomDept()
    const semester = randomInt(1, 8)
    const batch = `${2020 + Math.floor(semester / 2)}-${2024 + Math.floor(semester / 2)}`
    const xp = randomInt(100, 8000)
    studentBatch.push({
      name,
      email: `student${1000 + i}@edusphere.ai`,
      passwordHash: PASSWORD_HASH,
      role: 'student',
      department: dept,
      rollNumber: `S${2021000 + i}`,
      semester,
      batch,
      cgpa: randomFloat(5.5, 9.9),
      xp,
      level: Math.max(1, Math.floor(xp / 500)),
      streak: randomInt(0, 30),
      maxStreak: randomInt(0, 60),
      isVerified: true,
      isActive: true,
      placementReadiness: randomInt(30, 95),
      careerGoal: randomPick(['SDE at FAANG', 'Data Scientist', 'Product Manager', 'DevOps Engineer', 'AI Researcher', 'Entrepreneur']),
      weakSubjects: [randomPick(['Mathematics', 'Networks', 'OS', 'Cloud', 'Theory of Computation'])],
      strongSubjects: [randomPick(['DSA', 'Web Dev', 'ML', 'Python', 'System Design'])],
      skills: ['JavaScript', 'Python', 'React'].slice(0, randomInt(1, 3)),
      edenStage: xp > 4000 ? 'guardian' : 'assistant',
      lastLoginAt: randomDate(30),
    })
  }
  await User.insertMany(studentBatch, { ordered: false })
  console.log('   ✅ 500 students created')

  const facultyBatch: any[] = []
  for (let i = 0; i < 80; i++) {
    const name = randomName()
    const dept = randomDept()
    facultyBatch.push({
      name: `Dr. ${name}`,
      email: `faculty${1000 + i}@edusphere.ai`,
      passwordHash: PASSWORD_HASH,
      role: 'faculty',
      department: dept,
      employeeId: `FAC${1000 + i}`,
      xp: randomInt(2000, 15000),
      level: randomInt(5, 25),
      isVerified: true,
      isActive: true,
      skills: ['Research', 'Teaching', 'Publication'],
      lastLoginAt: randomDate(14),
    })
  }
  await User.insertMany(facultyBatch, { ordered: false })
  console.log('   ✅ 80 faculty created')

  const otherBatch: any[] = []
  for (let i = 0; i < 15; i++) {
    otherBatch.push({ name: randomName(), email: `mentor${i}@edusphere.ai`, passwordHash: PASSWORD_HASH, role: 'mentor', department: randomDept(), xp: randomInt(3000, 12000), level: randomInt(7, 20), isVerified: true, isActive: true })
  }
  for (let i = 0; i < 10; i++) {
    otherBatch.push({ name: randomName(), email: `recruiter${i}@edusphere.ai`, passwordHash: PASSWORD_HASH, role: 'recruiter', department: 'Business Administration', xp: randomInt(1000, 5000), level: randomInt(2, 10), isVerified: true, isActive: true })
  }
  for (let i = 0; i < 20; i++) {
    otherBatch.push({ name: randomName(), email: `parent${i}@edusphere.ai`, passwordHash: PASSWORD_HASH, role: 'parent', xp: 0, level: 1, isVerified: true, isActive: true })
  }
  await User.insertMany(otherBatch, { ordered: false })
  console.log('   ✅ 45 other role users created')

  // Fetch all users for later references
  const allStudents = await User.find({ role: 'student' }).select('_id name department').lean()
  const allFaculty = await User.find({ role: 'faculty' }).select('_id name department').lean()

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 4: COURSES (200 REAL JAVA, PYTHON, C, JAVASCRIPT COURSES)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n📖 Seeding 200 Real Java, Python, C & JavaScript courses...')

  const realTechCoursesList = [
    // Java
    { title: 'Java Programming Masterclass: From Zero to Hero', level: 'beginner', tags: ['Java', 'Core Java', 'OOP', 'Basics'] },
    { title: 'Enterprise Java & Spring Boot 3 Microservices Architecture', level: 'advanced', tags: ['Java', 'Spring Boot', 'Microservices', 'Backend'] },
    { title: 'Data Structures & Algorithms (DSA) in Java for Interviews', level: 'intermediate', tags: ['Java', 'DSA', 'Algorithms', 'LeetCode'] },
    { title: 'Advanced Multithreading, Concurrency & Parallel Programming in Java', level: 'advanced', tags: ['Java', 'Concurrency', 'Multithreading', 'JVM'] },
    { title: 'Java Web Development: Servlets, JSP, Hibernate & JPA', level: 'intermediate', tags: ['Java', 'Hibernate', 'JPA', 'SQL'] },
    { title: 'Object-Oriented Programming (OOP) & Design Patterns in Java', level: 'intermediate', tags: ['Java', 'OOP', 'Design Patterns', 'Architecture'] },
    { title: 'Java Performance Tuning, JVM Memory Management & Garbage Collection', level: 'advanced', tags: ['Java', 'JVM', 'Performance', 'Memory'] },
    { title: 'Building Reactive Applications with Spring WebFlux & Java 21', level: 'advanced', tags: ['Java', 'Spring WebFlux', 'Reactive', 'Java 21'] },
    { title: 'Android App Development with Java & XML Architecture', level: 'intermediate', tags: ['Java', 'Android', 'Mobile', 'XML'] },
    { title: 'Test-Driven Development (TDD) in Java with JUnit 5 & Mockito', level: 'intermediate', tags: ['Java', 'Testing', 'JUnit5', 'Mockito'] },
    // Python
    { title: 'Complete Python Bootcamp: Go from Zero to Hero in Python 3', level: 'beginner', tags: ['Python', 'Basics', 'Scripting', 'Core Python'] },
    { title: 'Python for Data Science, Machine Learning & AI Masterclass', level: 'advanced', tags: ['Python', 'Machine Learning', 'AI', 'Data Science'] },
    { title: 'Full-Stack Web Development with Python, Django & REST Framework', level: 'intermediate', tags: ['Python', 'Django', 'REST API', 'Web'] },
    { title: 'FastAPI & Python Async Microservices Development', level: 'intermediate', tags: ['Python', 'FastAPI', 'Async', 'API'] },
    { title: 'Automate the Boring Stuff with Python Scripting & Automation', level: 'beginner', tags: ['Python', 'Automation', 'Scripting', 'OS'] },
    { title: 'Data Analysis & Visualization with Python Pandas, NumPy & Matplotlib', level: 'intermediate', tags: ['Python', 'Pandas', 'NumPy', 'Visualization'] },
    { title: 'Deep Learning & Computer Vision with PyTorch & OpenCV in Python', level: 'advanced', tags: ['Python', 'Deep Learning', 'PyTorch', 'OpenCV'] },
    { title: 'Web Scraping, Automation & Crawling with Python & Selenium', level: 'intermediate', tags: ['Python', 'Web Scraping', 'Selenium', 'BeautifulSoup'] },
    { title: 'Cybersecurity & Ethical Hacking Scripts in Python', level: 'advanced', tags: ['Python', 'Cybersecurity', 'Ethical Hacking', 'Networking'] },
    { title: 'Natural Language Processing (NLP) & LLM Applications with Python', level: 'advanced', tags: ['Python', 'NLP', 'LLM', 'LangChain'] },
    // C
    { title: 'C Programming Masterclass: Pointers, Memory & Data Structures', level: 'beginner', tags: ['C', 'Pointers', 'Memory', 'Core C'] },
    { title: 'Systems Programming & POSIX Operating Systems in C', level: 'advanced', tags: ['C', 'Systems', 'POSIX', 'Linux'] },
    { title: 'C Language Memory Management, Dynamic Allocation & Valgrind', level: 'intermediate', tags: ['C', 'Memory Allocation', 'Valgrind', 'Debugging'] },
    { title: 'Embedded Systems Programming in C for Microcontrollers (STM32/ARM)', level: 'advanced', tags: ['C', 'Embedded', 'STM32', 'Microcontrollers'] },
    { title: 'Building a Custom Mini Operating System Kernel in C & Assembly', level: 'advanced', tags: ['C', 'OS Kernel', 'Assembly', 'Low Level'] },
    { title: 'Network Programming & Socket Communication in C', level: 'intermediate', tags: ['C', 'Sockets', 'Networking', 'TCP/IP'] },
    { title: 'Game Engine Physics & Graphics Programming in C with Raylib', level: 'intermediate', tags: ['C', 'Game Engine', 'Raylib', 'Graphics'] },
    { title: 'Advanced Data Structures & Graph Algorithms Implemented in C', level: 'intermediate', tags: ['C', 'DSA', 'Graphs', 'Trees'] },
    { title: 'Compiler Design & Building a Language Interpreter in C', level: 'advanced', tags: ['C', 'Compilers', 'Parser', 'Lexer'] },
    { title: 'Linux Device Driver Development & Linux Kernel Hacking in C', level: 'advanced', tags: ['C', 'Linux Kernel', 'Device Drivers', 'Modules'] },
    // JavaScript
    { title: 'The Complete JavaScript Course 2026: From Beginner to Modern JS', level: 'beginner', tags: ['JavaScript', 'ES6+', 'DOM', 'Basics'] },
    { title: 'Full-Stack JavaScript: React 19, Node.js, Express & MongoDB', level: 'advanced', tags: ['JavaScript', 'React', 'Node.js', 'MERN'] },
    { title: 'Asynchronous JavaScript, Promises, Event Loop & V8 Engine Internals', level: 'intermediate', tags: ['JavaScript', 'Event Loop', 'Async', 'V8 Engine'] },
    { title: 'TypeScript & Modern JavaScript Architecture for Enterprise Apps', level: 'intermediate', tags: ['JavaScript', 'TypeScript', 'Architecture', 'OOP'] },
    { title: 'Next.js 15 & Server Components: Building Production Web Apps', level: 'advanced', tags: ['JavaScript', 'Next.js', 'React', 'Full-Stack'] },
    { title: 'Node.js, Express & Microservices with Event-Driven Architecture', level: 'advanced', tags: ['JavaScript', 'Node.js', 'Microservices', 'Express'] },
    { title: 'JavaScript Data Structures, Algorithms & LeetCode Solution Guide', level: 'intermediate', tags: ['JavaScript', 'DSA', 'LeetCode', 'Interview'] },
    { title: 'Modern Frontend Testing with Jest, Vitest, Cypress & Playwright', level: 'intermediate', tags: ['JavaScript', 'Testing', 'Jest', 'Cypress'] },
    { title: 'Building Real-Time Web Applications with WebSockets & Socket.IO', level: 'intermediate', tags: ['JavaScript', 'Socket.IO', 'WebSockets', 'Real-Time'] },
    { title: 'React Native & Mobile App Development with JavaScript', level: 'intermediate', tags: ['JavaScript', 'React Native', 'Mobile', 'iOS/Android'] },
  ]

  const coursesBatch: any[] = []
  for (let i = 0; i < 200; i++) {
    const base = realTechCoursesList[i % realTechCoursesList.length]
    const isVariant = i >= realTechCoursesList.length
    const title = isVariant ? `${base.title} — Part ${Math.floor(i / realTechCoursesList.length) + 1}` : base.title
    const instructor = randomPick(allFaculty)
    const dept = instructor.department || randomDept()
    coursesBatch.push({
      title,
      description: `Master ${base.tags[0]} with this comprehensive, industry-aligned course. Learn ${base.title} step-by-step through real-world hands-on projects, code reviews, and live coding exercises.`,
      instructor: instructor._id,
      instructorName: instructor.name,
      department: dept,
      level: base.level,
      status: 'published',
      tags: base.tags,
      duration: randomInt(25, 75),
      enrolledCount: randomInt(120, 850),
      rating: randomFloat(4.2, 5.0),
      reviewCount: randomInt(35, 450),
      prerequisites: [`${base.tags[0]} Fundamentals`],
      objectives: [
        `Master production-level ${base.tags[0]} development`,
        `Build real-world applications in ${base.tags[1] || base.tags[0]}`,
        `Pass top tech company coding interviews`,
      ],
      language: 'English',
      credits: randomInt(3, 4),
      semester: randomInt(1, 8),
    })
  }
  await Course.insertMany(coursesBatch, { ordered: false })
  const allCourses = await Course.find({}).select('_id title department').lean()
  console.log(`   ✅ ${allCourses.length} real Java, Python, C & JavaScript courses created`)


  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 5: ASSIGNMENTS (300)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n📝 Seeding 300 assignments...')

  const assignmentBatch: any[] = []
  const assignmentTitles = ['Build a REST API', 'ML Model for Classification', 'System Design Document', 'Database Schema Design',
    'Docker Compose Project', 'Penetration Testing Report', 'React Component Library', 'Data Analysis with Pandas',
    'Algorithm Optimization Challenge', 'Cloud Deployment Project', 'Security Audit Report', 'Mobile App Prototype',
    'Blockchain Smart Contract', 'NLP Sentiment Analysis', 'Computer Vision Application', 'Microservices Demo',
    'CI/CD Pipeline Setup', 'GraphQL API Implementation', 'IoT Sensor Dashboard', 'Full-Stack E-Commerce App']

  for (let i = 0; i < 300; i++) {
    const course = randomPick(allCourses)
    const instructor = randomPick(allFaculty)
    const dueDate = new Date(Date.now() + randomInt(-7, 30) * 24 * 60 * 60 * 1000)
    const title = `${assignmentTitles[i % assignmentTitles.length]} — ${course.title.split(' ')[0]} Edition`
    assignmentBatch.push({
      title,
      description: `Complete ${title} following the provided guidelines and submit via the portal. Evaluation criteria: code quality, documentation, and demo.`,
      courseId: course._id,
      courseName: course.title,
      instructorId: instructor._id,
      instructorName: instructor.name,
      dueDate,
      maxMarks: randomPick([50, 75, 100]),
      allowedFileTypes: ['.pdf', '.zip', '.md', '.py', '.ipynb'],
      priority: randomPick(['low', 'medium', 'high', 'urgent']),
      status: dueDate < new Date() ? 'overdue' : randomPick(['todo', 'in_progress', 'todo']),
      department: course.department || 'Computer Science & Engineering',
      semester: randomInt(1, 8),
    })
  }
  await Assignment.insertMany(assignmentBatch, { ordered: false })
  console.log('   ✅ 300 assignments created')

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 6: JOBS (150)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n💼 Seeding 150 jobs...')

  const jobTitles = ['Software Engineer', 'Data Scientist', 'ML Engineer', 'DevOps Engineer', 'Product Manager',
    'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Cloud Architect', 'Security Engineer',
    'Blockchain Developer', 'Mobile Developer (Android)', 'iOS Developer', 'QA Engineer', 'Site Reliability Engineer',
    'Data Engineer', 'AI Research Intern', 'Business Analyst', 'UI/UX Designer', 'Technical Program Manager']

  const recruiterUser = namedUsers.find(u => u.role === 'recruiter')!
  const jobBatch: any[] = []
  for (let i = 0; i < 150; i++) {
    const company = randomPick(COMPANIES)
    const title = jobTitles[i % jobTitles.length]
    const salaryMin = randomInt(4, 25) * 100000
    const isInternship = i % 5 === 0
    jobBatch.push({
      title: isInternship ? `${title} Intern` : title,
      company,
      location: randomPick(['Bangalore', 'Mumbai', 'Hyderabad', 'Pune', 'Delhi NCR', 'Chennai', 'Remote']),
      locationType: randomPick(['on-site', 'remote', 'hybrid']),
      type: isInternship ? 'internship' : randomPick(['full-time', 'full-time', 'contract']),
      salary: isInternship ? `₹${randomInt(15, 60)}k/month stipend` : `₹${Math.round(salaryMin / 100000)}L - ₹${Math.round(salaryMin / 100000 + randomInt(3, 8))}L PA`,
      salaryMin,
      salaryMax: salaryMin + randomInt(300000, 800000),
      description: `Join ${company} as a ${title}. Work on cutting-edge ${title.toLowerCase().includes('ai') || title.toLowerCase().includes('ml') ? 'AI/ML' : 'software'} products that serve millions of users worldwide.`,
      requirements: ['B.Tech/BE degree', `Strong ${title.split(' ')[0]} fundamentals`, '1+ years experience preferred', 'Good communication skills'],
      skills: [title.split(' ')[0], 'Problem Solving', randomPick(['React', 'Python', 'Go', 'Rust', 'Java', 'Cloud'])],
      postedById: recruiterUser._id,
      postedByName: recruiterUser.name,
      deadline: new Date(Date.now() + randomInt(7, 60) * 24 * 60 * 60 * 1000),
      isActive: true,
      experienceLevel: isInternship ? 'fresher' : randomPick(['fresher', 'junior', 'mid', 'senior']),
      domain: randomPick(['Technology', 'AI/ML', 'Cloud', 'Security', 'Product', 'Data']),
      tags: [company, title.split(' ')[0], isInternship ? 'Internship' : 'Full-Time'],
    })
  }
  await Job.insertMany(jobBatch, { ordered: false })
  console.log('   ✅ 150 jobs created')

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 7: EVENTS (50)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n🎪 Seeding 50 events...')

  const eventNames = ['National AI Hackathon 2026', 'Cloud & DevOps Summit', 'Google I/O Watch Party', 'Placement Drive — TCS', 'Campus Coding Championship',
    'Research Paper Presentation Day', 'Entrepreneurship Bootcamp', 'Open Source Contribution Drive', 'Cybersecurity CTF Challenge', 'Data Science Workshop',
    'Career Guidance Seminar', 'Alumni Networking Mixer', 'Industry Talk: Future of AI', 'Tech Fest 2026', 'Science Exhibition']
  const adminUser = namedUsers.find(u => u.role === 'admin')!

  const eventBatch: any[] = []
  for (let i = 0; i < 50; i++) {
    const title = i < eventNames.length ? eventNames[i] : `${eventNames[i % eventNames.length]} — Session ${Math.floor(i / eventNames.length) + 2}`
    eventBatch.push({
      title,
      description: `Join us for ${title}. An unmissable experience for all EduSphere students and faculty.`,
      eventType: randomPick(['hackathon', 'workshop', 'seminar', 'placement_drive', 'cultural', 'tech_talk']),
      date: new Date(Date.now() + randomInt(-30, 90) * 24 * 60 * 60 * 1000),
      location: randomPick(['Main Auditorium', 'Lab 3A', 'Seminar Hall B', 'Online (Google Meet)', 'Sports Complex', 'Library Hall']),
      isOnline: Math.random() > 0.7,
      organizerId: adminUser._id,
      organizerName: adminUser.name,
      isPublished: true,
      maxAttendees: randomInt(50, 500),
      tags: ['EduSphere', 'Tech', '2026'],
    })
  }
  await EventModel.insertMany(eventBatch, { ordered: false })
  console.log('   ✅ 50 events created')

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 8: FORUM POSTS (300)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n💬 Seeding 300 forum posts...')

  const forumTitles = [
    'How to prepare for FAANG interviews?', 'Best resources for Machine Learning beginners',
    'Tips for maintaining 75% attendance while working on projects', 'How to get started with competitive programming?',
    'Resume review — Software Engineer position at Google', 'Study group for OS exam?',
    'Open source projects for beginners', 'DBMS normalization doubts — 3NF vs BCNF',
    'Career path: Data Science vs Software Engineering', 'How to crack GSoC?',
    'Best way to learn System Design?', 'Cloud certifications — AWS vs Azure vs GCP',
    'Project team forming for Hackathon', 'Tips for technical interviews',
    'Struggling with Dynamic Programming — need help', 'How to use EDEN AI effectively?',
  ]

  const forumBatch: any[] = []
  for (let i = 0; i < 300; i++) {
    const author = randomPick(allStudents)
    const title = i < forumTitles.length ? forumTitles[i] : `${forumTitles[i % forumTitles.length]} — Discussion ${Math.floor(i / forumTitles.length) + 2}`
    forumBatch.push({
      title,
      content: `This is a detailed discussion about ${title}. I have been struggling with this concept and would love input from seniors and faculty. Please share your insights and resources!`,
      authorId: author._id,
      authorName: author.name,
      authorRole: 'student',
      authorDepartment: author.department,
      tags: ['discussion', title.split(' ').slice(0, 2).join('-').toLowerCase()],
      category: randomPick(['doubt', 'discussion', 'resource', 'project', 'placement', 'general']),
      views: randomInt(10, 500),
      isPinned: i < 3,
      isResolved: Math.random() > 0.7,
      department: author.department,
    })
  }
  await ForumPost.insertMany(forumBatch, { ordered: false })
  console.log('   ✅ 300 forum posts created')

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 9: ATTENDANCE (1000 records)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n📋 Seeding 1000 attendance records...')

  const attendanceBatch: any[] = []
  const namedStudentList = namedUsers.filter(u => u.role === 'student')
  const sampleStudents = [...namedStudentList, ...allStudents.slice(0, 50)] // includes demo accounts + bulk students
  const subjects = ['Data Structures & Algorithms', 'Operating Systems', 'Database Management', 'Computer Networks', 'Software Engineering']

  for (const student of sampleStudents) {
    for (let j = 0; j < 20; j++) {
      attendanceBatch.push({
        studentId: student._id,
        studentName: student.name,
        rollNo: `S${Math.floor(Math.random() * 999999)}`,
        subject: randomPick(subjects),
        status: Math.random() > 0.15 ? 'Present' : randomPick(['Absent', 'Late', 'Medical Leave']),
        date: randomDate(90),
        method: randomPick(['Manual', 'QR Code', 'Biometric']),
      })
    }
  }
  await StudentAttendance.insertMany(attendanceBatch, { ordered: false })
  console.log('   ✅ 1000 attendance records created')

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 10: GAMIFICATION PROFILES (637 users)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n🎮 Seeding gamification profiles...')

  const allUsers = await User.find({}).select('_id xp level streak maxStreak cgpa placementReadiness').lean()
  const gamiBatch = allUsers.map(u => ({
    userId: u._id,
    xp: u.xp || 0,
    level: u.level || 1,
    streak: u.streak || randomInt(0, 15),
    maxStreak: u.maxStreak || randomInt(0, 30),
    lastActiveDate: randomDate(3),
    cgpa: u.cgpa || randomFloat(5.5, 9.5),
    placementReadinessPct: u.placementReadiness || randomInt(30, 95),
    weeklyXp: randomInt(0, 500),
    monthlyXp: randomInt(0, 2000),
    totalCoursesCompleted: randomInt(0, 10),
    totalAssignmentsSubmitted: randomInt(0, 30),
    totalQuizzesTaken: randomInt(0, 20),
    badges: [],
    dailyMissions: [
      { id: 'm1', title: 'Complete one lecture', xpReward: 50, isCompleted: Math.random() > 0.5 },
      { id: 'm2', title: 'Submit an assignment', xpReward: 100, isCompleted: Math.random() > 0.7 },
      { id: 'm3', title: 'Post in Discussion Forum', xpReward: 30, isCompleted: Math.random() > 0.6 },
      { id: 'm4', title: 'Practice coding for 30 min', xpReward: 75, isCompleted: Math.random() > 0.5 },
      { id: 'm5', title: 'Review study notes', xpReward: 40, isCompleted: Math.random() > 0.4 },
    ],
  }))

  // Insert in batches of 100 to avoid write concern issues
  for (let i = 0; i < gamiBatch.length; i += 100) {
    await Gamification.insertMany(gamiBatch.slice(i, i + 100), { ordered: false })
  }
  console.log(`   ✅ ${gamiBatch.length} gamification profiles created`)

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 11: NOTIFICATIONS (10,000)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n🔔 Seeding 10,000 notifications...')

  const notifTypes: any[] = ['assignment', 'attendance', 'exam', 'placement', 'gamification', 'system', 'forum', 'event', 'general']
  const notifTemplates = [
    { title: 'Assignment Due Tomorrow', message: 'Your assignment is due tomorrow. Submit it via the portal.', type: 'assignment' },
    { title: 'Attendance Alert', message: 'Your attendance dropped below 75%. Please attend upcoming classes.', type: 'attendance' },
    { title: 'Exam Scheduled', message: 'Your midterm exam has been scheduled for next week.', type: 'exam' },
    { title: 'New Job Posted', message: 'Google is hiring! Check out the Software Engineer position.', type: 'placement' },
    { title: 'XP Earned!', message: 'You earned 100 XP for completing your daily mission!', type: 'gamification' },
    { title: 'New Forum Reply', message: 'Someone replied to your forum post.', type: 'forum' },
    { title: 'Event Reminder', message: 'The National AI Hackathon is tomorrow. Register now!', type: 'event' },
    { title: 'System Update', message: 'EduSphere has been updated with new features. Check out what\'s new!', type: 'system' },
  ]

  // Distribute 10000 notifications across all users
  const NOTIF_TOTAL = 10000
  const usersForNotif = await User.find({ role: { $in: ['student', 'faculty', 'admin'] } }).select('_id').lean()
  const notifsPerUser = Math.ceil(NOTIF_TOTAL / usersForNotif.length)

  const notifBatch: any[] = []
  for (const user of usersForNotif) {
    const count = Math.min(notifsPerUser, randomInt(5, 30))
    for (let j = 0; j < count; j++) {
      const template = randomPick(notifTemplates)
      notifBatch.push({
        userId: user._id,
        title: template.title,
        message: template.message,
        type: template.type,
        isRead: Math.random() > 0.3,
        priority: randomPick(['low', 'medium', 'high']),
        createdAt: randomDate(30),
      })
    }
  }

  // Insert in batches of 500
  let notifTotal = 0
  for (let i = 0; i < notifBatch.length; i += 500) {
    const batch = notifBatch.slice(i, i + 500)
    await Notification.insertMany(batch, { ordered: false })
    notifTotal += batch.length
  }
  console.log(`   ✅ ${notifTotal} notifications created`)

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 12: EXAMS (20 proctored exams)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n📊 Seeding 20 proctored exams...')

  const facultyUser = namedUsers.find(u => u.role === 'faculty')!
  const examBatch = [
    { title: 'CS401: Advanced Data Structures & Algorithms', subject: 'Computer Science', durationMinutes: 60, questions: 4 },
    { title: 'CS502: Cloud Architecture & DevOps', subject: 'Cloud Computing', durationMinutes: 45, questions: 3 },
    { title: 'CS303: Machine Learning Fundamentals', subject: 'AI/ML', durationMinutes: 90, questions: 5 },
    { title: 'CS201: Database Management Systems', subject: 'Databases', durationMinutes: 60, questions: 4 },
    { title: 'CS601: System Design & Scalability', subject: 'System Design', durationMinutes: 75, questions: 4 },
    { title: 'IT401: Cybersecurity & Ethical Hacking', subject: 'Security', durationMinutes: 45, questions: 3 },
    { title: 'CS102: Operating Systems', subject: 'Systems', durationMinutes: 60, questions: 4 },
    { title: 'DS301: Deep Learning & Neural Networks', subject: 'Deep Learning', durationMinutes: 90, questions: 5 },
    { title: 'CS501: Computer Networks', subject: 'Networking', durationMinutes: 60, questions: 4 },
    { title: 'CS701: Compiler Design', subject: 'Compilers', durationMinutes: 75, questions: 3 },
  ]

  const examDocs = examBatch.flatMap(e => [
    {
      ...e,
      department: 'Computer Science & Engineering',
      description: `Proctored AI assessment covering core concepts of ${e.subject}.`,
      passingScore: 70,
      totalPoints: e.questions * 25,
      createdBy: facultyUser._id,
      createdByName: facultyUser.name,
      scheduledAt: new Date(Date.now() + randomInt(1, 20) * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
      proctorConfig: { eyeTrackingSensitivity: 8, maxWarningsAllowed: 3, allowedTabSwitches: 0, requireFacialVerification: true, requireAudioMonitoring: false, headPoseRotationLimit: 25 },
      questions: Array.from({ length: e.questions }, (_, i) => ({
        id: `q${i + 1}`,
        text: `Question ${i + 1}: Core concept from ${e.subject}`,
        type: randomPick(['multiple_choice', 'true_false', 'short_answer']),
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A',
        points: 25,
      })),
    },
    {
      ...e,
      title: `${e.title} — Mid-Term`,
      department: 'Computer Science & Engineering',
      description: `Mid-term proctored exam for ${e.subject}.`,
      passingScore: 60,
      totalPoints: e.questions * 25,
      createdBy: facultyUser._id,
      createdByName: facultyUser.name,
      scheduledAt: new Date(Date.now() + randomInt(21, 45) * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      isActive: true,
      proctorConfig: { eyeTrackingSensitivity: 9, maxWarningsAllowed: 2, allowedTabSwitches: 0, requireFacialVerification: true, requireAudioMonitoring: true, headPoseRotationLimit: 20 },
      questions: Array.from({ length: e.questions }, (_, i) => ({
        id: `q${i + 1}`,
        text: `Mid-term question ${i + 1} from ${e.subject}`,
        type: 'multiple_choice',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option B',
        points: 25,
      })),
    },
  ])
  await Exam.insertMany(examDocs, { ordered: false })
  console.log(`   ✅ ${examDocs.length} exams created`)

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 13: AUDIT LOGS (500)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n📜 Seeding 500 audit logs...')

  const auditActions = ['USER_LOGIN', 'USER_LOGOUT', 'COURSE_CREATED', 'ASSIGNMENT_SUBMITTED', 'EXAM_STARTED',
    'ATTENDANCE_MARKED', 'JOB_APPLIED', 'REPORT_GENERATED', 'NOTIFICATION_SENT', 'EDEN_CHAT', 'SYSTEM_CONFIG_CHANGED']

  const auditBatch = Array.from({ length: 500 }, () => {
    const actor = randomPick([...allStudents, ...allFaculty])
    const action = randomPick(auditActions)
    return {
      action,
      actorId: actor._id,
      actorName: actor.name,
      actorRole: randomPick(['student', 'faculty', 'admin']),
      description: `${action.replace(/_/g, ' ').toLowerCase()} performed`,
      severity: randomPick(['info', 'info', 'info', 'warning', 'error']),
      ipAddress: `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`,
      resourceType: randomPick(['User', 'Course', 'Assignment', 'Exam', 'Attendance']),
      createdAt: randomDate(60),
    }
  })
  await AuditLog.insertMany(auditBatch, { ordered: false })
  console.log('   ✅ 500 audit logs created')

  // ═══════════════════════════════════════════════════════════════════════════
  // FINAL SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  const finalCounts = await Promise.all([
    User.countDocuments({}),
    Course.countDocuments({}),
    Assignment.countDocuments({}),
    Job.countDocuments({}),
    EventModel.countDocuments({}),
    ForumPost.countDocuments({}),
    Gamification.countDocuments({}),
    Notification.countDocuments({}),
    Exam.countDocuments({}),
    StudentAttendance.countDocuments({}),
    AuditLog.countDocuments({}),
    Department.countDocuments({}),
  ])

  console.log(`
  ══════════════════════════════════════════════════
  ✅ EduSphere Seed Complete!
  ══════════════════════════════════════════════════
  👤 Users:          ${finalCounts[0]}
  📚 Courses:        ${finalCounts[1]}
  📝 Assignments:    ${finalCounts[2]}
  💼 Jobs:           ${finalCounts[3]}
  🎪 Events:         ${finalCounts[4]}
  💬 Forum Posts:    ${finalCounts[5]}
  🎮 Gamification:   ${finalCounts[6]}
  🔔 Notifications:  ${finalCounts[7]}
  📊 Exams:          ${finalCounts[8]}
  📋 Attendance:     ${finalCounts[9]}
  📜 Audit Logs:     ${finalCounts[10]}
  🏛️  Departments:   ${finalCounts[11]}
  ══════════════════════════════════════════════════

  🔐 All accounts use password: EduSphere@2026
  📧 Named accounts:
     student@edusphere.ai     (Student)
     faculty@edusphere.ai     (Faculty)
     admin@edusphere.ai       (Admin)
     mentor@edusphere.ai      (Mentor)
     hod@edusphere.ai         (HoD)
     recruiter@edusphere.ai   (Recruiter)
     placement@edusphere.ai   (Placement Officer)
     superadmin@edusphere.ai  (Super Admin)
  ══════════════════════════════════════════════════
  `)

  await mongoose.disconnect()
  console.log('🔌 MongoDB disconnected. Seed complete!')
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
