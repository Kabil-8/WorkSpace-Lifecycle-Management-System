import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../models/User.js'
import {
  CollegeCourse,
  CollegeCourseEnrollment,
  CollegeAssignment,
  CollegeQuiz,
  CollegeExam
} from '../models/CollegeCourse.js'
import {
  VideoCourse,
  VideoQuiz
} from '../models/VideoCourse.js'

dotenv.config()

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edusphere'

export async function seedCourseEcosystems() {
  console.log('🌱 Seeding EduSphere Dual Course Ecosystems...')

  // Find a faculty user to set as instructor
  let faculty = await User.findOne({ role: 'faculty' })
  if (!faculty) {
    faculty = await User.findOne({})
  }
  const instructorId = faculty?._id || new mongoose.Types.ObjectId()
  const instructorName = faculty?.name || 'Dr. Sarah Mitchell'

  // Find students to enroll
  const students = await User.find({ role: 'student' }).limit(10)

  // ── 1. SEED TYPE 1 — COLLEGE ACADEMIC COURSES ─────────────────────────────────
  const collegeCoursesData = [
    {
      courseCode: 'CS-401',
      title: 'Compiler Design',
      department: 'Computer Science',
      semester: 7,
      credits: 4,
      academicYear: '2025-2026',
      instructorId,
      instructorName,
      description: 'Lexical analysis, parsing algorithms, syntax-directed translation, code generation, and optimization.',
      syllabus: 'Module 1: Lexical Analysis & Lex. Module 2: Context Free Grammars & Parsing (LL, LR, LALR). Module 3: Intermediate Code Generation. Module 4: Code Optimization.',
      units: [
        {
          unitNumber: 1,
          title: 'Lexical Analysis & Finite Automata',
          description: 'Regular expressions, NFA to DFA conversion, lexer generator concepts.',
          topics: [
            { id: 'cd-1-1', title: 'Role of Lexical Analyzer', contentType: 'lecture', description: 'Tokenization, lexemes, and pattern matching.' },
            { id: 'cd-1-2', title: 'NFA to DFA Construction', contentType: 'pdf', description: 'Thompson construction & subset construction.' }
          ]
        },
        {
          unitNumber: 2,
          title: 'Syntax Analysis & Parsing Algorithms',
          description: 'Top-down & bottom-up parsing techniques.',
          topics: [
            { id: 'cd-2-1', title: 'LL(1) Recursive Descent Parsing', contentType: 'lecture', description: 'FIRST and FOLLOW sets calculation.' },
            { id: 'cd-2-2', title: 'LR(1) and LALR Parser Generators', contentType: 'lab', description: 'Yacc/Bison parser construction.' }
          ]
        }
      ],
      prerequisites: ['Data Structures & Algorithms', 'Theory of Computation'],
      status: 'active' as const
    },
    {
      courseCode: 'CS-402',
      title: 'Cloud Computing & Distributed Architecture',
      department: 'Computer Science',
      semester: 7,
      credits: 4,
      academicYear: '2025-2026',
      instructorId,
      instructorName: 'Prof. Vance Packard',
      description: 'IaaS, PaaS, SaaS, virtualization, microservices, container orchestration, and serverless computing.',
      syllabus: 'Unit 1: Cloud Architecture Fundamentals. Unit 2: Virtualization & KVM. Unit 3: Distributed Consensus & Raft. Unit 4: Microservices & Service Mesh.',
      units: [
        {
          unitNumber: 1,
          title: 'Cloud Architecture & Service Models',
          description: 'Core concepts of cloud deployment and service delivery models.',
          topics: [
            { id: 'cc-1-1', title: 'NIST Cloud Computing Model', contentType: 'lecture', description: 'On-demand self-service, elasticity, measured service.' },
            { id: 'cc-1-2', title: 'Distributed Systems CAP Theorem', contentType: 'pdf', description: 'Consistency, Availability, and Partition Tolerance.' }
          ]
        }
      ],
      prerequisites: ['Operating Systems', 'Computer Networks'],
      status: 'active' as const
    },
    {
      courseCode: 'CS-301',
      title: 'Software Engineering & Agile Methodologies',
      department: 'Computer Science',
      semester: 5,
      credits: 3,
      academicYear: '2025-2026',
      instructorId,
      instructorName: 'Dr. Robert Chen',
      description: 'SDLC models, requirement engineering, UML modeling, CI/CD pipelines, and software testing.',
      syllabus: 'Unit 1: SDLC & Agile Scrum. Unit 2: Requirements & Use Case Diagrams. Unit 3: CI/CD & Automated Testing. Unit 4: Software Metrics & Reliability.',
      units: [
        {
          unitNumber: 1,
          title: 'Agile Software Development & Scrum',
          description: 'Sprints, daily standups, backlog refinement, user stories.',
          topics: [
            { id: 'se-1-1', title: 'Scrum Framework & Roles', contentType: 'lecture', description: 'Product Owner, Scrum Master, Development Team.' }
          ]
        }
      ],
      prerequisites: ['Object Oriented Programming'],
      status: 'active' as const
    }
  ]

  for (const cData of collegeCoursesData) {
    const existing = await CollegeCourse.findOne({ courseCode: cData.courseCode })
    let courseObj = existing
    if (!existing) {
      courseObj = await CollegeCourse.create(cData)
      console.log(`  ✓ Created College Course: ${cData.courseCode} — ${cData.title}`)
    } else {
      courseObj = existing
    }

    if (courseObj && students.length > 0) {
      for (const st of students) {
        await CollegeCourseEnrollment.findOneAndUpdate(
          { userId: st._id, collegeCourseId: courseObj._id },
          {
            userId: st._id,
            collegeCourseId: courseObj._id,
            courseCode: courseObj.courseCode,
            department: st.department || 'Computer Science',
            section: 'A',
            semester: courseObj.semester,
            status: 'active'
          },
          { upsert: true }
        )
      }
    }

    // Seed 1 assignment per college course
    if (courseObj) {
      await CollegeAssignment.findOneAndUpdate(
        { collegeCourseId: courseObj._id, title: `Assignment 1: ${courseObj.title} Fundamentals` },
        {
          collegeCourseId: courseObj._id,
          title: `Assignment 1: ${courseObj.title} Fundamentals`,
          description: `Analyze core principles of ${courseObj.title} and submit your solution documentation.`,
          dueDate: new Date(Date.now() + 7 * 86400000),
          maxMarks: 100,
          department: courseObj.department,
          semester: courseObj.semester,
          createdByName: courseObj.instructorName
        },
        { upsert: true }
      )

      // Seed 1 quiz per college course
      await CollegeQuiz.findOneAndUpdate(
        { collegeCourseId: courseObj._id, title: `${courseObj.courseCode} Unit 1 Assessment` },
        {
          collegeCourseId: courseObj._id,
          title: `${courseObj.courseCode} Unit 1 Assessment`,
          durationMinutes: 20,
          totalPoints: 50,
          passingScorePct: 70,
          questions: [
            { id: 'q1', question: `What is the primary objective of ${courseObj.title}?`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 0 },
            { id: 'q2', question: 'Which architectural layer handles fundamental state transformation?', options: ['Presentation', 'Business Logic', 'Data Layer', 'Network Protocol'], correctAnswer: 1 }
          ]
        },
        { upsert: true }
      )

      // Seed 1 internal exam per college course
      await CollegeExam.findOneAndUpdate(
        { collegeCourseId: courseObj._id, title: `Midterm Examination 1 — ${courseObj.courseCode}` },
        {
          collegeCourseId: courseObj._id,
          title: `Midterm Examination 1 — ${courseObj.courseCode}`,
          examType: 'Midterm 1',
          date: new Date(Date.now() + 14 * 86400000),
          maxMarks: 100,
          weightagePct: 30
        },
        { upsert: true }
      )
    }
  }

  // ── 2. SEED TYPE 2 — PUBLIC VIDEO COURSES ─────────────────────────────────────
  const videoCoursesData = [
    {
      slug: 'aws-cloud-practitioner-masterclass',
      title: 'AWS Certified Cloud Practitioner Masterclass',
      description: 'Comprehensive video training for AWS core services, VPC networking, IAM security, S3 storage, EC2 compute, and cloud cost management.',
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
      instructorName: 'Stephane Maarek',
      category: 'Cloud Computing',
      level: 'Beginner' as const,
      durationHours: 14.5,
      skills: ['AWS', 'EC2', 'S3', 'IAM', 'VPC', 'Cloud Architecture'],
      published: true,
      rating: 4.9,
      reviewCount: 1420,
      enrolledCount: 8900,
      sections: [
        {
          sectionId: 'sec-aws-1',
          title: 'Section 1: AWS Cloud Essentials & Global Infrastructure',
          lessons: [
            {
              lessonId: 'aws-les-1',
              title: 'Welcome & AWS Global Regions and Availability Zones',
              durationMinutes: 12,
              videoUrl: 'https://static.edusphere.ai/videos/aws-intro.mp4',
              description: 'Understanding AWS data centers, edge locations, and fault tolerance across AZs.',
              isFreePreview: true
            },
            {
              lessonId: 'aws-les-2',
              title: 'AWS Identity and Access Management (IAM) Deep Dive',
              durationMinutes: 18,
              videoUrl: 'https://static.edusphere.ai/videos/aws-iam.mp4',
              description: 'Configuring IAM Users, Groups, Roles, Policies, and Multi-Factor Authentication.'
            }
          ]
        },
        {
          sectionId: 'sec-aws-2',
          title: 'Section 2: AWS Compute & Networking — EC2 & VPC',
          lessons: [
            {
              lessonId: 'aws-les-3',
              title: 'EC2 Instance Types, Security Groups & Key Pairs',
              durationMinutes: 22,
              videoUrl: 'https://static.edusphere.ai/videos/aws-ec2.mp4',
              description: 'Launching Linux EC2 instances, configuring security groups, and SSH key management.'
            },
            {
              lessonId: 'aws-les-4',
              title: 'Virtual Private Cloud (VPC) Subnets & Route Tables',
              durationMinutes: 25,
              videoUrl: 'https://static.edusphere.ai/videos/aws-vpc.mp4',
              description: 'Building custom VPCs, public and private subnets, Internet Gateways, and NAT Gateways.'
            }
          ]
        }
      ]
    },
    {
      slug: 'react-typescript-architecture',
      title: 'React & TypeScript Enterprise Architecture',
      description: 'Master production React 19, custom hooks, state management with Redux Toolkit & React Query, component design systems, and TypeScript generics.',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80',
      instructorName: 'Dan Abramov & Kent C. Dodds',
      category: 'Web Development',
      level: 'Intermediate' as const,
      durationHours: 18.0,
      skills: ['React', 'TypeScript', 'Redux Toolkit', 'React Query', 'TailwindCSS'],
      published: true,
      rating: 4.9,
      reviewCount: 2310,
      enrolledCount: 14200,
      sections: [
        {
          sectionId: 'sec-react-1',
          title: 'Section 1: Advanced TypeScript Generics & Component Props',
          lessons: [
            {
              lessonId: 'react-les-1',
              title: 'Polymorphic React Components with TypeScript',
              durationMinutes: 15,
              videoUrl: 'https://static.edusphere.ai/videos/react-polymorphic.mp4',
              description: 'Designing strongly typed reusable UI primitive components.',
              isFreePreview: true
            },
            {
              lessonId: 'react-les-2',
              title: 'Custom Hooks Architecture & Memory Leak Prevention',
              durationMinutes: 20,
              videoUrl: 'https://static.edusphere.ai/videos/react-hooks.mp4',
              description: 'Encapsulating side-effects cleanly with useEffect, useRef, and custom hooks.'
            }
          ]
        }
      ]
    },
    {
      slug: 'docker-kubernetes-devops-mastery',
      title: 'Docker & Kubernetes DevOps Engineering',
      description: 'Containerize microservices, build multi-stage Dockerfiles, configure Helm charts, ingress controllers, and deploy Kubernetes clusters on cloud infrastructure.',
      thumbnail: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&auto=format&fit=crop&q=80',
      instructorName: 'Kelsey Hightower',
      category: 'DevOps & Containers',
      level: 'Advanced' as const,
      durationHours: 21.0,
      skills: ['Docker', 'Kubernetes', 'Helm', 'DevOps', 'CI/CD'],
      published: true,
      rating: 4.95,
      reviewCount: 1890,
      enrolledCount: 11500,
      sections: [
        {
          sectionId: 'sec-docker-1',
          title: 'Section 1: Docker Containers & Image Optimization',
          lessons: [
            {
              lessonId: 'dock-les-1',
              title: 'Multi-Stage Docker Builds for Node & Python',
              durationMinutes: 16,
              videoUrl: 'https://static.edusphere.ai/videos/docker-multistage.mp4',
              description: 'Optimizing container image sizes down to minimal distroless base images.',
              isFreePreview: true
            }
          ]
        }
      ]
    }
  ]

  for (const vData of videoCoursesData) {
    const existing = await VideoCourse.findOne({ slug: vData.slug })
    let vObj = existing
    if (!existing) {
      vObj = await VideoCourse.create(vData)
      console.log(`  ✓ Created Public Video Course: ${vData.slug} — ${vData.title}`)
    }

    if (vObj) {
      // Seed practice quiz for video course
      await VideoQuiz.findOneAndUpdate(
        { videoCourseId: vObj._id, lessonId: vObj.sections[0]?.lessons[0]?.lessonId || 'l1' },
        {
          videoCourseId: vObj._id,
          lessonId: vObj.sections[0]?.lessons[0]?.lessonId || 'l1',
          title: `Practice Knowledge Check: ${vObj.title}`,
          questions: [
            { id: 'vq1', question: `Which key capability does ${vObj.category} provide?`, options: ['High Scalability', 'Static Allocation', 'Legacy Compatibility', 'Manual Provisioning'], correctAnswer: 0 }
          ]
        },
        { upsert: true }
      )
    }
  }

  console.log('✅ Dual Course Ecosystems Successfully Seeded!')
}

// Execute if run directly
if (process.argv[1] && process.argv[1].endsWith('seed_course_ecosystems.ts')) {
  mongoose.connect(MONGO_URI).then(async () => {
    await seedCourseEcosystems()
    await mongoose.disconnect()
    process.exit(0)
  }).catch(err => {
    console.error('Seeding failed:', err)
    process.exit(1)
  })
}
