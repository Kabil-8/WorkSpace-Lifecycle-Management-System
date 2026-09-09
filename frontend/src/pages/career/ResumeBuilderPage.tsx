import { useState, useMemo, useEffect, useRef } from 'react'
import MagicBento from '../../components/reactbits/MagicBento'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download, Sparkles, Plus, Trash2, Award, User,
  Layers, Upload, Target, AlertTriangle, Check,
  FileUp, Edit3, FileText, CheckCircle2,
  RefreshCw, Printer,
  ChevronDown, Zap, CheckCheck, X,
  ShieldCheck, Info
} from 'lucide-react'
import { useAppSelector, useAppDispatch } from '../../hooks/useStore'
import { setPageContextData } from '../../store/edenSlice'
import { addToast } from '../../store/uiSlice'
import { api } from '../../services/api'

// Role benchmarks & keywords
export const ROLE_BENCHMARKS: Record<string, { targetScore: number; keywords: string[]; actionVerbs: string[]; description: string }> = {
  'Fullstack Developer': {
    targetScore: 92,
    keywords: ['React', 'TypeScript', 'Node.js', 'Express', 'MongoDB', 'Redis', 'Docker', 'REST APIs', 'PostgreSQL', 'Git', 'CI/CD', 'TailwindCSS', 'Microservices'],
    actionVerbs: ['Architected', 'Engineered', 'Optimized', 'Deployed', 'Refactored', 'Streamlined', 'Integrated'],
    description: 'Focuses on frontend responsiveness, backend throughput, caching strategies, and REST/GraphQL APIs.'
  },
  'Frontend Engineer': {
    targetScore: 90,
    keywords: ['React', 'TypeScript', 'Next.js', 'Redux Toolkit', 'TailwindCSS', 'Webpack', 'Vite', 'HTML5/CSS3', 'Jest', 'Responsive Design', 'Web Performance'],
    actionVerbs: ['Designed', 'Implemented', 'Standardized', 'Accelerated', 'Enhanced', 'Transformed'],
    description: 'Emphasizes component state, client-side rendering speed, accessible UI/UX, and bundle optimization.'
  },
  'Backend & Cloud Engineer': {
    targetScore: 94,
    keywords: ['Node.js', 'Python', 'Go', 'Docker', 'Kubernetes', 'AWS', 'PostgreSQL', 'Redis', 'Kafka', 'System Design', 'Microservices', 'gRPC', 'CI/CD'],
    actionVerbs: ['Engineered', 'Scaled', 'Automated', 'Migrated', 'Partitioned', 'Orchestrated'],
    description: 'Highlights high concurrency, fault tolerance, distributed message queues, and cloud infrastructure.'
  },
  'AI / ML Engineer': {
    targetScore: 95,
    keywords: ['Python', 'PyTorch', 'TensorFlow', 'Scikit-Learn', 'FastAPI', 'NLP', 'Vector Databases', 'RAG', 'Embeddings', 'Transformers', 'Pandas', 'NumPy', 'MLOps'],
    actionVerbs: ['Trained', 'Fine-tuned', 'Evaluated', 'Deployed', 'Benchmarked', 'Synthesized'],
    description: 'Focuses on deep learning architectures, feature engineering, mathematical metrics, and production inference.'
  },
  'Data Engineer / Analyst': {
    targetScore: 90,
    keywords: ['SQL', 'Python', 'Spark', 'Airflow', 'Snowflake', 'ETL Pipelines', 'PowerBI', 'Tableau', 'Data Warehousing', 'PostgreSQL', 'Pandas'],
    actionVerbs: ['Aggregated', 'Pipeline-engineered', 'Visualized', 'Extracted', 'Modeled', 'Validated'],
    description: 'Emphasizes schema modeling, ETL pipeline reliability, query performance tuning, and business dashboards.'
  }
}

// 6+ ATS-Engineered Templates
export interface TemplateDef {
  id: string
  name: string
  subtitle: string
  badge: string
  color: string
  fontFamily: string
  layout: '1-col' | '2-col' | 'minimal' | 'academic'
  sampleData: {
    summary: string
    skills: string[]
    experience: Array<{ id: string; title: string; company: string; duration: string; description: string }>
    projects: Array<{ id: string; name: string; technologies: string[]; description: string }>
    education: Array<{ id: string; institution: string; degree: string; year: string; cgpa: string }>
    certifications: string[]
  }
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: 'ModernTech',
    name: 'Silicon Valley Modern',
    subtitle: 'High-contrast header, tech stack tags, and metric-driven STAR bullet points.',
    badge: 'Top Tech',
    color: '#3B82F6',
    fontFamily: 'Inter, sans-serif',
    layout: '1-col',
    sampleData: {
      summary: 'Results-driven Fullstack Software Engineer & CS Scholar specializing in React 19, TypeScript, Node.js microservices, and distributed cloud systems.',
      skills: ['React 19', 'TypeScript', 'Node.js', 'Express', 'MongoDB', 'Redis', 'Docker', 'Python', 'TailwindCSS', 'REST APIs', 'Git', 'CI/CD'],
      experience: [
        {
          id: 'exp-1',
          title: 'Fullstack Software Engineering Intern',
          company: 'TechCorp Cloud Systems',
          duration: 'Jun 2025 - Present',
          description: 'Architected scalable REST APIs handling 50k daily active requests. Reduced frontend bundle load latency by 42% using dynamic code splitting and tree-shaking.',
        },
        {
          id: 'exp-2',
          title: 'Web Engineering Lead',
          company: 'Campus OpenSource Lab',
          duration: 'Jan 2025 - May 2025',
          description: 'Led a team of 4 developers building interactive dashboard analytics with React and Redux Toolkit, improving user retention by 28%.',
        }
      ],
      projects: [
        {
          id: 'proj-1',
          name: 'EduSphere AI Ecosystem',
          technologies: ['React 19', 'TypeScript', 'Node.js', 'Socket.IO', 'MongoDB'],
          description: 'Engineered an AI-powered student lifecycle management app with live code compilation, cognitive digital twin predictions, and proctored assessment engine.',
        },
        {
          id: 'proj-2',
          name: 'Distributed ATS Parser & Comparator',
          technologies: ['Python', 'FastAPI', 'Scikit-Learn', 'TF-IDF'],
          description: 'Built a TF-IDF cosine similarity engine comparing resume text against job description vectors with real-time keyword scoring and ATS feedback.',
        }
      ],
      education: [
        {
          id: 'edu-1',
          institution: 'B.E. Computer Science & Engineering',
          degree: 'Bachelor of Engineering in CSE',
          year: '2023 - 2027',
          cgpa: '8.8 / 10.0 CGPA',
        }
      ],
      certifications: ['AWS Certified Cloud Practitioner', 'MongoDB Certified Developer Associate']
    }
  },
  {
    id: 'HarvardClassic',
    name: 'Harvard / Ivy League Classic',
    subtitle: 'Timeless serif typography, structured experience blocks, 100% strict ATS parser compliant.',
    badge: 'ATS 100%',
    color: '#10B981',
    fontFamily: 'Georgia, "Times New Roman", serif',
    layout: '1-col',
    sampleData: {
      summary: 'Computer Science candidate with strong mathematical foundation in Data Structures, Algorithms, and Enterprise Systems Engineering.',
      skills: ['Java', 'C++', 'Python', 'SQL', 'PostgreSQL', 'System Design', 'Git', 'Linux', 'Unit Testing', 'CI/CD Pipelines'],
      experience: [
        {
          id: 'exp-1',
          title: 'Software Development Associate',
          company: 'Global Financial Technologies',
          duration: 'Jul 2024 - Dec 2024',
          description: 'Optimized SQL database query performance, reducing query execution time by 30%. Implemented automated unit test suites with 94% coverage.',
        }
      ],
      projects: [
        {
          id: 'proj-1',
          name: 'High-Frequency Order Book Matching Engine',
          technologies: ['C++', 'Multithreading', 'Memory Management'],
          description: 'Developed a low-latency C++ order book matching engine capable of processing 12,000 transactions per second with zero packet loss.',
        }
      ],
      education: [
        {
          id: 'edu-1',
          institution: 'Department of Computer Science & Engineering',
          degree: 'Bachelor of Engineering',
          year: '2023 - 2027',
          cgpa: '8.8 / 10.0',
        }
      ],
      certifications: ['Oracle Certified Professional: Java SE 17']
    }
  },
  {
    id: 'MinimalistPure',
    name: 'Minimalist Pure ATS',
    subtitle: 'Zero graphical clutter, clear semantic HTML/Word structure, highest machine parsing score.',
    badge: 'Max Readability',
    color: '#6366F1',
    fontFamily: 'Calibri, Arial, sans-serif',
    layout: 'minimal',
    sampleData: {
      summary: 'Dedicated Software Engineer with proven ability to develop, test, and deploy robust web microservices and maintain high API availability.',
      skills: ['TypeScript', 'JavaScript', 'Node.js', 'Express', 'React', 'MongoDB', 'Docker', 'Git'],
      experience: [
        {
          id: 'exp-1',
          title: 'Junior Backend Developer',
          company: 'Nexus Software Labs',
          duration: 'Feb 2025 - Present',
          description: 'Designed and deployed 14 secure REST endpoints with JWT role-based access control and rate-limiting middleware.',
        }
      ],
      projects: [
        {
          id: 'proj-1',
          name: 'Real-Time Collaboration Canvas',
          technologies: ['React', 'WebSocket', 'Node.js'],
          description: 'Built a shared interactive canvas allowing 20+ simultaneous users to co-author diagrams with sub-50ms sync latency.',
        }
      ],
      education: [
        {
          id: 'edu-1',
          institution: 'Engineering University',
          degree: 'B.E. Computer Science',
          year: '2023 - 2027',
          cgpa: '8.6 CGPA',
        }
      ],
      certifications: ['Postman API Fundamentals Student Expert']
    }
  },
  {
    id: 'Executive2Col',
    name: 'Executive Two-Column',
    subtitle: 'Modern sidebar for core competencies and contact links, wide column for experience achievements.',
    badge: 'Executive',
    color: '#8B5CF6',
    fontFamily: 'Inter, sans-serif',
    layout: '2-col',
    sampleData: {
      summary: 'Technical Team Lead & Product Engineer bridging high-level architectural design with rigorous full-stack execution.',
      skills: ['System Architecture', 'React 19', 'TypeScript', 'Node.js', 'Kubernetes', 'Docker', 'Cloud Infrastructure', 'Team Leadership'],
      experience: [
        {
          id: 'exp-1',
          title: 'Lead Student Architect',
          company: 'EduSphere Project Lab',
          duration: 'Jan 2025 - Present',
          description: 'Directed end-to-end architecture across 12 microservices, coordinating authentication, ML scoring, and real-time Socket.IO telemetry.',
        }
      ],
      projects: [
        {
          id: 'proj-1',
          name: 'Microservices API Gateway',
          technologies: ['Node.js', 'FastAPI', 'Redis Caching'],
          description: 'Implemented unified API reverse proxy with circuit-breaker resilience and automated telemetry logging.',
        }
      ],
      education: [
        {
          id: 'edu-1',
          institution: 'College of Engineering and Technology',
          degree: 'B.E. Computer Science & Engineering',
          year: '2023 - 2027',
          cgpa: '8.9 / 10.0',
        }
      ],
      certifications: ['Certified Kubernetes Application Developer (CKAD)']
    }
  },
  {
    id: 'AcademicCV',
    name: 'Academic & Research CV',
    subtitle: 'Specialized layout for publications, undergraduate research, coursework, and lab demonstrations.',
    badge: 'Research',
    color: '#EC4899',
    fontFamily: '"Times New Roman", Times, serif',
    layout: 'academic',
    sampleData: {
      summary: 'Undergraduate Researcher focusing on Applied Machine Learning, Cognitive Digital Twin Modeling, and Natural Language Processing.',
      skills: ['Python', 'PyTorch', 'Scikit-Learn', 'Statistical Analysis', 'Mathematical Modeling', 'LaTeX', 'Research Methodologies'],
      experience: [
        {
          id: 'exp-1',
          title: 'Undergraduate Research Assistant',
          company: 'AI & Cognitive Computing Lab',
          duration: 'Aug 2024 - Present',
          description: 'Co-authored research paper on Spaced Repetition algorithms and Ebbinghaus memory decay modeling in intelligent tutoring systems.',
        }
      ],
      projects: [
        {
          id: 'proj-1',
          name: 'Cognitive Digital Twin Mathematical Engine',
          technologies: ['Python', 'FastAPI', 'NumPy', 'SciPy'],
          description: 'Implemented 6-dimensional student cognitive telemetry analyzing academic trajectory, coding mastery, and burnout risk.',
        }
      ],
      education: [
        {
          id: 'edu-1',
          institution: 'School of Computing Sciences',
          degree: 'Bachelor of Engineering in CSE (Honors)',
          year: '2023 - 2027',
          cgpa: '9.1 / 10.0',
        }
      ],
      certifications: ['DeepLearning.AI: Deep Learning Specialization']
    }
  },
  {
    id: 'CloudDevOps',
    name: 'Cloud Infrastructure & DevOps',
    subtitle: 'Structured around CI/CD pipelines, container orchestration, monitoring, and cloud security.',
    badge: 'DevOps',
    color: '#F59E0B',
    fontFamily: 'JetBrains Mono, Menlo, monospace',
    layout: '1-col',
    sampleData: {
      summary: 'DevOps Engineer dedicated to building robust automated CI/CD deployment pipelines, zero-downtime microservices, and observable infrastructure.',
      skills: ['Docker', 'Kubernetes', 'Terraform', 'AWS', 'GitHub Actions', 'Prometheus', 'Grafana', 'Linux Bash', 'Python', 'Nginx'],
      experience: [
        {
          id: 'exp-1',
          title: 'Cloud DevOps Intern',
          company: 'InfraScale Systems',
          duration: 'May 2025 - Present',
          description: 'Automated container build and test pipelines using GitHub Actions, reducing deployment cycle times by 65%.',
        }
      ],
      projects: [
        {
          id: 'proj-1',
          name: 'Kubernetes Multi-Cluster GitOps Pipeline',
          technologies: ['Kubernetes', 'ArgoCD', 'Helm', 'Docker'],
          description: 'Designed declarative GitOps deployment workflows managing 8 microservice containers with automated rollback on healthcheck failure.',
        }
      ],
      education: [
        {
          id: 'edu-1',
          institution: 'Institute of Technology',
          degree: 'B.E. Computer Science',
          year: '2023 - 2027',
          cgpa: '8.7 CGPA',
        }
      ],
      certifications: ['AWS Certified Solutions Architect – Associate', 'HashiCorp Certified: Terraform Associate']
    }
  }
]

export default function ResumeBuilderPage() {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector(s => s.auth)

  // Active studio mode
  const [studioMode, setStudioMode] = useState<'builder' | 'comparator' | 'templates'>('builder')

  // Target role selection
  const [targetRole, setTargetRole] = useState<string>(user?.careerGoal || 'Fullstack Developer')

  // Selected Template
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('ModernTech')

  // Word-style formatting options
  const [wordFont, setWordFont] = useState<string>('Calibri')
  const [wordFontSize, setWordFontSize] = useState<string>('11pt')
  const [wordLineHeight, setWordLineHeight] = useState<string>('1.3')

  // Candidate Data State (initialized with template or user profile)
  const [candidateName, setCandidateName] = useState(user?.name || 'Alex Johnson')
  const [candidateEmail, setCandidateEmail] = useState(user?.email || 'alex.johnson@edusphere.edu')
  const [candidatePhone, setCandidatePhone] = useState('+91 98765 43210')
  const [candidateLocation, setCandidateLocation] = useState('Bangalore, India')
  const [candidateGithub, setCandidateGithub] = useState('github.com/alex-dev')
  const [candidateLinkedin, setCandidateLinkedin] = useState('linkedin.com/in/alex-johnson')

  const [summary, setSummary] = useState(TEMPLATES[0].sampleData.summary)
  const [skills, setSkills] = useState<string[]>(user?.skills && user.skills.length > 0 ? user.skills : TEMPLATES[0].sampleData.skills)
  const [skillInput, setSkillInput] = useState('')

  const [experience, setExperience] = useState(TEMPLATES[0].sampleData.experience)
  const [projects, setProjects] = useState(TEMPLATES[0].sampleData.projects)
  const [education, setEducation] = useState(TEMPLATES[0].sampleData.education)
  const [certifications, setCertifications] = useState(TEMPLATES[0].sampleData.certifications)

  // Uploaded resume comparison state
  const [uploadedResumeFile, setUploadedResumeFile] = useState<File | null>(null)
  const [uploadedResumeText, setUploadedResumeText] = useState<string | null>(null)
  const [uploadedAtsResult, setUploadedAtsResult] = useState<{
    score: number
    rating: string
    matchedKeywords: string[]
    missingKeywords: string[]
    suggestedActionVerbs: string[]
    breakdown: {
      tfidfSimilarityScore: number
      keywordScore: number
      impactScore: number
      completenessScore: number
    }
    issues?: Array<{ id: string; severity: string; title: string; description: string; solution: string }>
  } | null>(null)
  const [isParsingResume, setIsParsingResume] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{
    success: boolean
    message: string
    updatedFields?: string[]
    profileVersion?: string
    digitalTwinStatus?: string
  } | null>(null)

  // Custom Benchmark Dropdown Menu State
  const [isBenchmarkMenuOpen, setIsBenchmarkMenuOpen] = useState(false)
  const benchmarkDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (benchmarkDropdownRef.current && !benchmarkDropdownRef.current.contains(e.target as Node)) {
        setIsBenchmarkMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Skill Confirmation Dialog State (Safety against auto-inventing skills)
  const [showSkillConfirmModal, setShowSkillConfirmModal] = useState(false)
  const [selectedMissingSkills, setSelectedMissingSkills] = useState<Record<string, boolean>>({})

  const activeBenchmark = ROLE_BENCHMARKS[targetRole] || ROLE_BENCHMARKS['Fullstack Developer']
  const activeTemplate = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0]

  // Calculate real-time ATS Score & Keyword Match
  const atsAnalysis = useMemo(() => {
    const combinedResumeText = [
      candidateName,
      summary,
      skills.join(' '),
      experience.map(e => `${e.title} ${e.company} ${e.description}`).join(' '),
      projects.map(p => `${p.name} ${p.technologies?.join(' ')} ${p.description}`).join(' '),
      certifications.join(' ')
    ].join(' ').toLowerCase()

    const matchedKeywords = activeBenchmark.keywords.filter(kw => combinedResumeText.includes(kw.toLowerCase()))
    const missingKeywords = activeBenchmark.keywords.filter(kw => !combinedResumeText.includes(kw.toLowerCase()))

    const matchedVerbs = activeBenchmark.actionVerbs.filter(v => combinedResumeText.includes(v.toLowerCase()))

    // Keyword Score (0 - 45)
    const kwScore = Math.round((matchedKeywords.length / activeBenchmark.keywords.length) * 45)
    // Structure & Sections Score (0 - 25)
    const structScore = (summary.length > 50 ? 8 : 4) + (experience.length > 0 ? 9 : 0) + (projects.length > 0 ? 8 : 0)
    // Metrics & Verbs Score (0 - 20)
    const hasNumbers = (combinedResumeText.match(/\d+%/g) || []).length + (combinedResumeText.match(/\d+k/g) || []).length
    const verbScore = Math.min(20, (matchedVerbs.length * 3) + (hasNumbers > 0 ? 8 : 0))
    // Contact & Cleanliness Score (0 - 10)
    const contactScore = (candidateEmail ? 3 : 0) + (candidatePhone ? 3 : 0) + (candidateGithub || candidateLinkedin ? 4 : 0)

    const totalATSScore = Math.min(99, Math.max(25, kwScore + structScore + verbScore + contactScore))

    return {
      totalATSScore,
      matchedKeywords,
      missingKeywords,
      matchedVerbs,
      kwScore,
      structScore,
      verbScore,
      contactScore
    }
  }, [candidateName, summary, skills, experience, projects, certifications, activeBenchmark])

  // Active ATS Analysis: Uses ML service evaluation when a file is uploaded, or live builder evaluation
  const handleSyncFromProfile = () => {
    if (!user) return
    const userSlug = (user.name || 'user').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const gh = user.externalProfiles?.github?.username || userSlug
    const li = user.externalProfiles?.linkedin?.username || userSlug

    setCandidateName(user.name)
    setCandidateEmail(user.email)
    setCandidateLocation('Bangalore, India')
    setCandidateGithub(`github.com/${gh}`)
    setCandidateLinkedin(`linkedin.com/in/${li}`)

    if (user.skills && user.skills.length > 0) {
      setSkills(user.skills)
    }

    if (user.department || user.cgpa) {
      setEducation([
        {
          id: 'edu-profile',
          institution: `Department of ${user.department || 'Computer Science & Engineering'}`,
          degree: 'Bachelor of Engineering (B.E.)',
          year: '2023 - 2027',
          cgpa: `${user.cgpa || '8.8'} / 10.0 CGPA`,
        }
      ])
    }

    dispatch(addToast({
      type: 'success',
      title: 'Profile Synced to Resume! 🚀',
      description: `Loaded personal details, verified skills, and academic data from your profile.`,
    }))
  }
  const activeAtsAnalysis = useMemo(() => {
    if (uploadedAtsResult && uploadedResumeFile) {
      const b = uploadedAtsResult.breakdown || ({} as any)
      return {
        totalATSScore: uploadedAtsResult.score,
        rating: uploadedAtsResult.rating || 'Evaluated',
        matchedKeywords: uploadedAtsResult.matchedKeywords || [],
        missingKeywords: uploadedAtsResult.missingKeywords || [],
        matchedVerbs: uploadedAtsResult.suggestedActionVerbs || [],
        kwScore: b.keywordScore ?? Math.min(45, (uploadedAtsResult.matchedKeywords?.length || 0) * 4),
        structScore: b.completenessScore ?? 15,
        verbScore: b.impactScore ?? 10,
        contactScore: b.tfidfSimilarityScore ? Math.min(10, Math.round(b.tfidfSimilarityScore * 0.28)) : 8,
        issues: uploadedAtsResult.issues || [],
        isUploaded: true,
      }
    }

    return {
      ...atsAnalysis,
      rating: atsAnalysis.totalATSScore >= 85 ? 'Top Tier' : 'Good',
      issues: [],
      isUploaded: false,
    }
  }, [uploadedAtsResult, uploadedResumeFile, atsAnalysis])

  useEffect(() => {
    dispatch(setPageContextData({
      currentTool: 'ATS Resume Studio & Word Builder',
      atsScore: activeAtsAnalysis.totalATSScore,
      targetRole,
      missingKeywordsCount: activeAtsAnalysis.missingKeywords.length
    }))
    return () => { dispatch(setPageContextData(null)) }
  }, [activeAtsAnalysis, targetRole, dispatch])

  // Handle uploading and parsing external resume
  const handleResumeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadedResumeFile(file)
    setIsParsingResume(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('targetRole', targetRole)

      const res = await fetch('http://localhost:8001/api/ml/resume/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const json = await res.json()
        const text = json.extractedText || ''
        setUploadedResumeText(text)
        if (json.data) {
          setUploadedAtsResult(json.data)
        }

        // If extracted skills found in uploaded file, prompt user confirmation rather than blind mutation
        if (json.data?.matchedKeywords && Array.isArray(json.data.matchedKeywords) && json.data.matchedKeywords.length > 0) {
          const map: Record<string, boolean> = {}
          json.data.matchedKeywords.forEach((k: string) => { map[k] = true })
          setSelectedMissingSkills(map)
          setShowSkillConfirmModal(true)
        }
        setStudioMode('comparator')
      }
    } catch (err) {
      console.error('Resume parse error:', err)
    } finally {
      setIsParsingResume(false)
    }
  }

  const handleClearUploadedFile = () => {
    setUploadedResumeFile(null)
    setUploadedResumeText(null)
    setUploadedAtsResult(null)
  }

  const handleTargetRoleChange = async (newRole: string) => {
    setTargetRole(newRole)
    if (uploadedResumeFile) {
      setIsParsingResume(true)
      try {
        const formData = new FormData()
        formData.append('file', uploadedResumeFile)
        formData.append('targetRole', newRole)
        const res = await fetch('http://localhost:8001/api/ml/resume/upload', {
          method: 'POST',
          body: formData,
        })
        if (res.ok) {
          const json = await res.json()
          if (json.data) setUploadedAtsResult(json.data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsParsingResume(false)
      }
    }
  }

  // Handle adding verified skill
  const handleAddSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim()
    if (!trimmed || skills.includes(trimmed)) return
    setSkills([...skills, trimmed])
    setSkillInput('')
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove))
  }

  // Open skill confirmation modal for missing keywords
  const handlePromptSkillConfirmation = () => {
    const map: Record<string, boolean> = {}
    atsAnalysis.missingKeywords.forEach(k => { map[k] = false })
    setSelectedMissingSkills(map)
    setShowSkillConfirmModal(true)
  }

  const handleConfirmAddSelectedSkills = () => {
    const toAdd = Object.keys(selectedMissingSkills).filter(k => selectedMissingSkills[k])
    if (toAdd.length > 0) {
      setSkills(Array.from(new Set([...skills, ...toAdd])))
    }
    setShowSkillConfirmModal(false)
  }

  // Import uploaded resume into Word Studio editor
  const handleImportUploadedToEditor = () => {
    if (uploadedAtsResult?.matchedKeywords && uploadedAtsResult.matchedKeywords.length > 0) {
      setSkills(Array.from(new Set([...skills, ...uploadedAtsResult.matchedKeywords])))
    }

    if (uploadedResumeText) {
      const emailMatch = uploadedResumeText.match(/[\w.-]+@[\w.-]+\.\w+/)
      if (emailMatch) setCandidateEmail(emailMatch[0])

      const phoneMatch = uploadedResumeText.match(/\+?\d[\d\s-()]{8,}\d/)
      if (phoneMatch) setCandidatePhone(phoneMatch[0])

      const lines = uploadedResumeText.split('\n').map(l => l.trim()).filter(Boolean)
      if (lines.length > 0 && lines[0].length < 40 && !lines[0].includes('@')) {
        setCandidateName(lines[0])
      }

      if (uploadedResumeText.length > 40) {
        setSummary(uploadedResumeText.slice(0, 320).replace(/\n+/g, ' ') + (uploadedResumeText.length > 320 ? '...' : ''))
      }
    }

    setStudioMode('builder')
    setSyncStatus({
      success: true,
      message: `Successfully loaded ${uploadedResumeFile?.name || 'uploaded document'} into the Word Studio editor! You can now edit and customize all sections.`
    })
    setTimeout(() => setSyncStatus(null), 6000)
  }

  // Auto-fill from student profile
  const handleAutoFillFromProfile = () => {
    if (user?.name) setCandidateName(user.name)
    if (user?.email) setCandidateEmail(user.email)
    if (user?.skills && user.skills.length > 0) setSkills(user.skills)
    if (user?.bio) setSummary(user.bio)
    if (user?.department) {
      setEducation([
        {
          id: 'edu-1',
          institution: 'School of Engineering & Computing',
          degree: `Bachelor of Engineering in ${user.department}`,
          year: `${user.batch || '2023 - 2027'}`,
          cgpa: `${user.cgpa ? `${user.cgpa} / 10.0 CGPA` : '9.15 / 10.0 CGPA'}`,
        }
      ])
    }
    setSyncStatus({
      success: true,
      message: 'Populated Word Studio fields from your official student record & verified skills.'
    })
    setTimeout(() => setSyncStatus(null), 5000)
  }

  // Reset to template sample
  const handleResetToTemplate = () => {
    setSummary(activeTemplate.sampleData.summary)
    setSkills(activeTemplate.sampleData.skills)
    setExperience(activeTemplate.sampleData.experience)
    setProjects(activeTemplate.sampleData.projects)
    setEducation(activeTemplate.sampleData.education)
    setCertifications(activeTemplate.sampleData.certifications)
    setSyncStatus({
      success: true,
      message: `Reset Word Studio content to ${activeTemplate.name} sample template.`
    })
    setTimeout(() => setSyncStatus(null), 4000)
  }

  // Apply AI corrections & Sync directly to user's MongoDB profile
  const handleSyncToProfile = async () => {
    try {
      setSyncStatus(null)
      const res: any = await api.put('/profile/sync-ats', {
        confirmedSkills: skills,
        suggestedSkills: activeAtsAnalysis.missingKeywords,
        atsScore: activeAtsAnalysis.totalATSScore,
        atsBreakdown: {
          keywordCoverage: activeAtsAnalysis.kwScore,
          sectionHealth: activeAtsAnalysis.structScore,
          actionVerbsAndMetrics: activeAtsAnalysis.verbScore,
          contactLinks: activeAtsAnalysis.contactScore,
        },
        targetRole,
        summary,
      })

      if (res?.success) {
        setSyncStatus({
          success: true,
          message: 'Profile synchronized with official student record.',
          updatedFields: res.updatedFields,
          profileVersion: res.profileVersion,
          digitalTwinStatus: res.digitalTwinSync?.status,
        })
        setTimeout(() => setSyncStatus(null), 7000)
      }
    } catch (err: any) {
      console.error(err)
      setSyncStatus({
        success: false,
        message: err?.response?.data?.message || 'Failed to synchronize profile. Please check credentials and try again.'
      })
    }
  }

  // Template switch handler
  const handleSelectTemplate = (template: TemplateDef) => {
    setSelectedTemplateId(template.id)
  }

  // Word Document (.DOC / .DOCX) Export with 100% accurate alignment
  const handleExportWordDocx = () => {
    const contactList = [
      candidateEmail,
      candidatePhone,
      candidateLocation,
      candidateGithub ? candidateGithub.replace(/^https?:\/\//, '') : '',
      candidateLinkedin ? candidateLinkedin.replace(/^https?:\/\//, '') : '',
    ].filter(Boolean)

    const resumeHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 8.5in 11.0in;
            margin: 0.55in 0.65in 0.55in 0.65in;
            mso-header-margin: 0.3in;
            mso-footer-margin: 0.3in;
          }
          body {
            font-family: ${wordFont || 'Calibri'}, 'Arial', sans-serif;
            font-size: ${wordFontSize || '10.5pt'};
            line-height: ${wordLineHeight || '1.25'};
            color: #0F172A;
            margin: 0;
            padding: 0;
          }
          h1 {
            font-family: ${wordFont || 'Calibri'}, 'Arial', sans-serif;
            font-size: 20pt;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
            margin: 0 0 3pt 0;
            color: #0F172A;
          }
          .contact-bar {
            text-align: center;
            font-size: 9pt;
            color: #475569;
            margin: 0 0 10pt 0;
            padding-bottom: 6pt;
            border-bottom: 1.5pt solid #CBD5E1;
            line-height: 1.3;
          }
          .section-heading {
            font-family: ${wordFont || 'Calibri'}, 'Arial', sans-serif;
            font-size: 11pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
            color: #1E293B;
            border-bottom: 1.5pt solid #334155;
            padding-bottom: 2pt;
            margin-top: 10pt;
            margin-bottom: 4pt;
          }
          table.row-table {
            width: 100%;
            border-collapse: collapse;
            border: none;
            margin-top: 3pt;
            margin-bottom: 1pt;
          }
          table.row-table td {
            padding: 0;
            border: none;
            vertical-align: top;
          }
          .bullet-item {
            margin-left: 14pt;
            text-indent: -10pt;
            margin-top: 2pt;
            margin-bottom: 3pt;
            font-size: 10pt;
            line-height: 1.35;
            color: #1E293B;
            text-align: justify;
          }
          .bullet-dot {
            font-size: 10pt;
            color: #334155;
            margin-right: 4pt;
          }
          .summary-text {
            font-size: 10pt;
            line-height: 1.35;
            color: #1E293B;
            text-align: justify;
            margin: 2pt 0 6pt 0;
          }
        </style>
      </head>
      <body>
        <h1>${candidateName}</h1>
        <div class="contact-bar">
          ${contactList.join(' &nbsp;|&nbsp; ')}
        </div>

        <div class="section-heading">Professional Summary</div>
        <div class="summary-text">${summary}</div>

        <div class="section-heading">Technical Skills &amp; Core Competencies</div>
        <div style="font-size: 10pt; line-height: 1.35; margin: 3pt 0 6pt 0; color: #1E293B;">
          <strong>Key Technologies:</strong> ${skills.join(', ')}
        </div>

        <div class="section-heading">Work Experience</div>
        ${experience.map(exp => `
          <div style="margin-bottom: 6pt;">
            <table class="row-table" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="left" style="font-size: 10.5pt; font-weight: bold; color: #0F172A;">
                  ${exp.title} <span style="font-weight: normal; font-style: italic; color: #334155;">&mdash; ${exp.company}</span>
                </td>
                <td align="right" style="font-size: 9.5pt; color: #64748B; font-weight: normal; white-space: nowrap; text-align: right;">
                  ${exp.duration}
                </td>
              </tr>
            </table>
            <div class="bullet-item">
              <span class="bullet-dot">&#8226;</span>${exp.description}
            </div>
          </div>
        `).join('')}

        <div class="section-heading">Key Projects &amp; Architectures</div>
        ${projects.map(proj => `
          <div style="margin-bottom: 6pt;">
            <table class="row-table" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="left" style="font-size: 10.5pt; font-weight: bold; color: #0F172A;">
                  ${proj.name}
                </td>
                <td align="right" style="font-size: 9pt; color: #475569; font-style: italic; text-align: right;">
                  ${proj.technologies?.join(', ') || ''}
                </td>
              </tr>
            </table>
            <div class="bullet-item">
              <span class="bullet-dot">&#8226;</span>${proj.description}
            </div>
          </div>
        `).join('')}

        <div class="section-heading">Education</div>
        ${education.map(edu => `
          <div style="margin-bottom: 4pt;">
            <table class="row-table" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="left" style="font-size: 10.5pt; font-weight: bold; color: #0F172A;">
                  ${edu.institution}
                </td>
                <td align="right" style="font-size: 9.5pt; color: #64748B; font-weight: normal; text-align: right;">
                  ${edu.year}
                </td>
              </tr>
              <tr>
                <td colspan="2" style="font-size: 10pt; color: #334155; padding-top: 1pt;">
                  ${edu.degree} &mdash; <strong>${edu.cgpa}</strong>
                </td>
              </tr>
            </table>
          </div>
        `).join('')}

        ${certifications.length > 0 ? `
          <div class="section-heading">Certifications &amp; Honors</div>
          <div style="margin-top: 3pt;">
            ${certifications.map(c => `
              <div class="bullet-item">
                <span class="bullet-dot">&#8226;</span>${c}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </body>
      </html>
    `

    const blob = new Blob(['\ufeff', resumeHtml], {
      type: 'application/msword'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${candidateName.replace(/\s+/g, '_')}_Resume_ATS.doc`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Print PDF Export
  const handlePrintPDF = () => {
    window.print()
  }

  return (
    <div className="page-container space-y-6 pb-16">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-resume-canvas, #printable-resume-canvas * {
            visibility: visible;
          }
          #printable-resume-canvas {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            min-height: auto !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* ── Top Hero Banner ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="hero-banner shadow-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0A0F1E 0%, #0F172A 35%, #1A1040 70%, #2E1065 100%)',
          border: '1px solid rgba(168,85,247,0.3)',
        }}
      >
        <div
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)' }}
        />

        <div className="space-y-3">
          <span className="hero-badge"><Sparkles size={10} /> AI Career Intelligence &amp; Word Resume Studio</span>
          <h1 className="text-2xl sm:text-3xl font-black leading-tight text-white">
            ATS Resume Studio &amp; Word Document Builder
          </h1>
          <p className="text-sm max-w-2xl text-white/70">
            Compare profile resume vs target role benchmarks, evaluate keyword gap differentials, edit in Microsoft Word layout, and export clean DOCX &amp; PDF files.
          </p>

          <div className="flex items-center gap-3 flex-wrap pt-1">
            {/* Custom Glassmorphic Target Benchmark Dropdown */}
            <div className="relative" ref={benchmarkDropdownRef}>
              <button
                type="button"
                onClick={() => setIsBenchmarkMenuOpen(!isBenchmarkMenuOpen)}
                className="flex items-center gap-2 bg-black/50 hover:bg-black/70 px-3.5 py-1.5 rounded-xl backdrop-blur-md border border-white/20 hover:border-purple-400/50 text-white transition-all cursor-pointer shadow-md"
                aria-haspopup="listbox"
                aria-expanded={isBenchmarkMenuOpen}
              >
                <Target size={14} className="text-purple-300 shrink-0" />
                <span className="text-2xs font-medium text-white/80 shrink-0">Target Benchmark:</span>
                <span className="text-xs font-bold text-purple-200">{targetRole}</span>
                <ChevronDown size={14} className={`text-white/60 transition-transform ${isBenchmarkMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isBenchmarkMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-2 w-72 p-1.5 rounded-2xl shadow-2xl z-50 border backdrop-blur-xl"
                    style={{
                      backgroundColor: '#0A0F1E',
                      borderColor: 'rgba(168, 85, 247, 0.35)',
                      boxShadow: '0 20px 40px -10px rgba(0,0,0,0.8), 0 0 20px rgba(168,85,247,0.15)',
                    }}
                    role="listbox"
                  >
                    <div className="px-2.5 py-1.5 mb-1 border-b border-white/10">
                      <span className="text-3xs font-mono uppercase tracking-wider text-purple-300 font-bold">Select Role Benchmark</span>
                    </div>
                    <div className="space-y-1">
                      {Object.keys(ROLE_BENCHMARKS).map(role => {
                        const isSelected = role === targetRole
                        const info = ROLE_BENCHMARKS[role]
                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => {
                              handleTargetRoleChange(role)
                              setIsBenchmarkMenuOpen(false)
                            }}
                            className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-purple-600/30 text-white border border-purple-500/40'
                                : 'hover:bg-white/10 text-white/90'
                            }`}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold flex items-center gap-1.5 text-white">
                                {role}
                                {isSelected && <Check size={13} className="text-emerald-400" />}
                              </p>
                              <p className="text-3xs text-white/60 line-clamp-1 leading-tight">{info.description}</p>
                            </div>
                            <span className="text-3xs font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-purple-200 shrink-0">
                              {info.targetScore} ATS
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono font-bold text-xs" style={{
              background: activeAtsAnalysis.totalATSScore >= 85 ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
              border: `1px solid ${activeAtsAnalysis.totalATSScore >= 85 ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'}`,
              color: activeAtsAnalysis.totalATSScore >= 85 ? '#34D399' : '#FBBF24'
            }}>
              <Award size={14} /> ATS Match Score: {activeAtsAnalysis.totalATSScore}/100
            </div>
          </div>
        </div>

        {/* Action Controls & Navigation Pills */}
        <div className="flex flex-col gap-2 items-start sm:items-end flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setStudioMode('builder')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                studioMode === 'builder'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40 border border-purple-400/40'
                  : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}
            >
              <FileText size={14} /> Word Studio
            </button>
            <button
              onClick={() => setStudioMode('comparator')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                studioMode === 'comparator'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40 border border-purple-400/40'
                  : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}
            >
              <Zap size={14} /> ATS Compare &amp; Sync
            </button>
            <button
              onClick={() => setStudioMode('templates')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                studioMode === 'templates'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40 border border-purple-400/40'
                  : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}
            >
              <Layers size={14} /> 6+ Templates
            </button>
          </div>

          <div className="flex items-center gap-2 pt-2 flex-wrap">
            <button
              onClick={handleSyncFromProfile}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 border border-purple-400/30 flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
              title="Import Name, Verified Skills, CGPA, and Social Links from your EduSphere Profile"
            >
              <RefreshCw size={13} className="text-purple-300" /> Sync from Profile
            </button>
            <button
              onClick={handleExportWordDocx}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
              title="Download Microsoft Word .doc Document"
            >
              <Download size={13} /> Export Word (.docx)
            </button>
            <button
              onClick={handlePrintPDF}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
              title="Print or Save as ATS PDF"
            >
              <Printer size={13} /> Export PDF
            </button>
          </div>
        </div>
      </motion.div>

      {/* Sync Status Feedback Banner */}
      {syncStatus && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border"
          style={{
            background: syncStatus.success ? 'var(--success-muted)' : 'var(--destructive-muted)',
            borderColor: syncStatus.success ? 'var(--success)' : 'var(--destructive)',
            color: syncStatus.success ? 'var(--success)' : 'var(--destructive)'
          }}
        >
          <div className="space-y-1">
            <span className="flex items-center gap-2 font-bold">
              {syncStatus.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              {syncStatus.message}
            </span>
            {syncStatus.success && (
              <div className="text-2xs font-mono opacity-90 flex items-center gap-3 flex-wrap">
                <span>Updated: {syncStatus.updatedFields?.join(', ')}</span>
                <span>•</span>
                <span>Profile Version: {syncStatus.profileVersion}</span>
                <span>•</span>
                <span>6D Digital Twin: {syncStatus.digitalTwinStatus}</span>
              </div>
            )}
          </div>
          <button onClick={() => setSyncStatus(null)} className="cursor-pointer opacity-75 hover:opacity-100 p-1">
            <X size={15} />
          </button>
        </motion.div>
      )}

      {/* ── ReactBits MagicBento — Feature Showcase Grid ───────────────── */}
      <MagicBento
        textAutoHide={true}
        enableStars
        enableSpotlight
        enableBorderGlow={true}
        enableTilt={false}
        enableMagnetism={false}
        clickEffect
        spotlightRadius={400}
        particleCount={12}
        glowColor="132, 0, 255"
        disableAnimations={false}
      />

      {/* ── MODE 1: ATS COMPARATOR & PROFILE SYNC ────────────────────────── */}
      {studioMode === 'comparator' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Top Quick Action Comparison Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Upload Resume / Profile Extractor */}
            <div className="lg:col-span-5 card p-5 rounded-2xl space-y-4 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                  <FileUp size={16} className="text-purple-400" /> Upload Existing Resume to Compare
                </h3>
                <span className="text-3xs font-mono px-2 py-0.5 rounded bg-muted">PDF / DOCX / TXT</span>
              </div>

              <div className="p-4 rounded-xl border border-dashed text-center space-y-2" style={{ borderColor: 'var(--border)' }}>
                <Upload size={24} className="mx-auto text-purple-400" />
                <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                  {uploadedResumeFile ? uploadedResumeFile.name : 'Upload your current resume file'}
                </p>
                <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                  {uploadedResumeFile
                    ? 'Evaluated via Python Scikit-Learn TF-IDF vectorizer & keyword algorithm.'
                    : `Extracts text, compares with ${targetRole} benchmark, and identifies gaps.`}
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <label className="btn btn-primary text-xs inline-flex items-center gap-1.5 cursor-pointer py-1.5 px-3">
                    <FileUp size={13} /> {uploadedResumeFile ? 'Change File' : 'Select Resume File'}
                    <input type="file" accept=".pdf,.docx,.doc,.txt" onChange={handleResumeFileUpload} className="hidden" />
                  </label>
                  {uploadedResumeFile && (
                    <button
                      type="button"
                      onClick={handleClearUploadedFile}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-destructive/30 text-destructive hover:bg-destructive-muted transition-colors cursor-pointer"
                    >
                      Clear &amp; Revert
                    </button>
                  )}
                </div>

                {uploadedResumeFile && (
                  <button
                    type="button"
                    onClick={handleImportUploadedToEditor}
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all mt-1"
                  >
                    <Edit3 size={14} /> Open &amp; Edit Uploaded Resume in Word Studio
                  </button>
                )}
              </div>

              {isParsingResume && (
                <div className="flex items-center justify-center gap-2 text-xs py-2 text-purple-400">
                  <RefreshCw size={14} className="animate-spin" /> ML Service evaluating keyword vectors...
                </div>
              )}

              {/* Profile Sync Button */}
              <div className="p-4 rounded-xl space-y-2.5" style={{ background: 'var(--primary-muted)', border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>Official Student Profile Sync:</span>
                  <ShieldCheck size={16} className="text-purple-400" />
                </div>
                <p className="text-2xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                  Applies the verified skills ({skills.length}), {activeAtsAnalysis.totalATSScore}% ATS score, and summary to your student profile, and triggers 6D Cognitive Digital Twin recalculation.
                </p>
                <button
                  onClick={handleSyncToProfile}
                  className="btn btn-primary w-full text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <CheckCheck size={14} /> Apply Confirmed Corrections to Profile
                </button>
              </div>
            </div>

            {/* Right: ATS Keyword Gap Differential */}
            <div className="lg:col-span-7 card p-5 rounded-2xl space-y-4 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                    <Target size={16} className="text-emerald-400" /> {targetRole} ATS Keyword Differential
                  </h3>
                  <span className="text-3xs font-mono text-muted-foreground">
                    {activeAtsAnalysis.isUploaded ? `Evaluated from: ${uploadedResumeFile?.name}` : 'Live Builder Content Evaluation'}
                  </span>
                </div>
                {activeAtsAnalysis.missingKeywords.length > 0 && (
                  <button
                    onClick={handlePromptSkillConfirmation}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles size={12} /> Review Recommendations ({activeAtsAnalysis.missingKeywords.length})
                  </button>
                )}
              </div>

              {/* Matched vs Missing Pills */}
              <div className="space-y-3">
                <div>
                  <p className="text-2xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 size={12} /> Verified &amp; Matched Keywords ({activeAtsAnalysis.matchedKeywords.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeAtsAnalysis.matchedKeywords.length > 0 ? (
                      activeAtsAnalysis.matchedKeywords.map(kw => (
                        <span key={kw} className="px-2.5 py-1 rounded-lg text-2xs font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          ✓ {kw}
                        </span>
                      ))
                    ) : (
                      <span className="text-2xs text-muted-foreground italic">No matching role keywords detected in document.</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-2xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1 text-amber-400">
                    <AlertTriangle size={12} /> Recommended Target Keywords ({activeAtsAnalysis.missingKeywords.length}) — Click to Verify &amp; Add
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeAtsAnalysis.missingKeywords.length > 0 ? (
                      activeAtsAnalysis.missingKeywords.map(kw => (
                        <button
                          key={kw}
                          onClick={() => {
                            setSelectedMissingSkills({ [kw]: true })
                            setShowSkillConfirmModal(true)
                          }}
                          className="px-2.5 py-1 rounded-lg text-2xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer flex items-center gap-1"
                        >
                          + {kw}
                        </button>
                      ))
                    ) : (
                      <span className="text-2xs text-emerald-400 font-bold">🎉 Perfect match! All benchmark keywords present in your resume.</span>
                    )}
                  </div>
                </div>

                {/* Score Diagnostic Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="p-2.5 rounded-xl bg-muted text-center">
                    <span className="text-3xs text-muted-foreground block">Keyword Coverage</span>
                    <strong className="text-xs font-mono text-foreground">{activeAtsAnalysis.kwScore} / 45</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted text-center">
                    <span className="text-3xs text-muted-foreground block">Section Health</span>
                    <strong className="text-xs font-mono text-foreground">{activeAtsAnalysis.structScore} / 25</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted text-center">
                    <span className="text-3xs text-muted-foreground block">Action Verbs &amp; Metrics</span>
                    <strong className="text-xs font-mono text-foreground">{activeAtsAnalysis.verbScore} / 20</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted text-center">
                    <span className="text-3xs text-muted-foreground block">Contact Links</span>
                    <strong className="text-xs font-mono text-foreground">{activeAtsAnalysis.contactScore} / 10</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── MODE 2: 6+ TEMPLATES GALLERY ─────────────────────────────────── */}
      {studioMode === 'templates' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
                ATS-Optimized Resume Templates Gallery (6 Curated Styles)
              </h2>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Every template is rigorously engineered for applicant tracking system parsers and human recruiters.
              </p>
            </div>
            <button
              onClick={() => setStudioMode('builder')}
              className="btn btn-primary text-xs flex items-center gap-1.5"
            >
              <Edit3 size={13} /> Open Active Builder
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TEMPLATES.map(tmpl => {
              const isSelected = selectedTemplateId === tmpl.id
              return (
                <motion.div
                  key={tmpl.id}
                  whileHover={{ y: -4 }}
                  onClick={() => handleSelectTemplate(tmpl)}
                  className="card p-5 rounded-2xl space-y-3 cursor-pointer border transition-all relative flex flex-col justify-between"
                  style={{
                    borderColor: isSelected ? tmpl.color : 'var(--border)',
                    boxShadow: isSelected ? `0 8px 24px color-mix(in srgb, ${tmpl.color} 25%, transparent)` : 'var(--shadow-sm)',
                    background: 'var(--card)'
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-3xs font-black uppercase px-2.5 py-0.5 rounded-full font-mono"
                        style={{ background: `color-mix(in srgb, ${tmpl.color} 15%, transparent)`, color: tmpl.color }}
                      >
                        {tmpl.badge}
                      </span>
                      {isSelected && (
                        <span className="text-2xs font-bold flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 size={13} /> Active
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{tmpl.name}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{tmpl.subtitle}</p>

                    {/* Preview wireframe */}
                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1.5">
                      <div className="h-2 w-2/3 bg-slate-700 rounded mx-auto" />
                      <div className="h-1.5 w-1/2 bg-slate-800 rounded mx-auto" />
                      <div className="h-px w-full bg-slate-800 my-1" />
                      <div className="h-1.5 w-full bg-slate-800 rounded" />
                      <div className="h-1.5 w-4/5 bg-slate-800 rounded" />
                    </div>
                  </div>

                  <button
                    onClick={() => { setSelectedTemplateId(tmpl.id); setStudioMode('builder') }}
                    className="w-full py-2 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1"
                    style={{ background: isSelected ? tmpl.color : 'var(--muted)', color: isSelected ? '#fff' : 'var(--foreground)' }}
                  >
                    {isSelected ? 'Editing in Studio' : 'Use This Template'}
                  </button>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* ── MODE 3: WORD DOCUMENT STUDIO / BUILDER ───────────────────────── */}
      {studioMode === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form Controls Editor */}
          <div className="lg:col-span-5 space-y-4">
            <div className="card p-5 rounded-2xl space-y-4 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                    <Edit3 size={16} className="text-purple-400" /> Resume Content Editor
                  </h3>
                  <p className="text-3xs" style={{ color: 'var(--muted-foreground)' }}>
                    Active Style: <strong style={{ color: 'var(--primary)' }}>{activeTemplate.name}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {uploadedResumeFile && (
                    <button
                      type="button"
                      onClick={handleImportUploadedToEditor}
                      className="px-2.5 py-1 rounded-lg text-2xs font-bold bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600/30 transition-all cursor-pointer flex items-center gap-1"
                      title="Load text & skills from your uploaded resume into editor"
                    >
                      <FileUp size={11} /> Load Uploaded ({uploadedResumeFile.name.slice(0, 10)}...)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAutoFillFromProfile}
                    className="px-2.5 py-1 rounded-lg text-2xs font-bold bg-primary-muted text-primary border border-primary/30 hover:bg-primary/20 transition-all cursor-pointer flex items-center gap-1"
                    title="Populate from your student profile & verified skills"
                  >
                    <User size={11} /> Profile Auto-Fill
                  </button>
                  <button
                    type="button"
                    onClick={handleResetToTemplate}
                    className="px-2.5 py-1 rounded-lg text-2xs font-bold bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer flex items-center gap-1"
                    title="Reset fields to template sample"
                  >
                    <RefreshCw size={11} /> Reset Sample
                  </button>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2.5">
                <label className="text-2xs font-bold uppercase tracking-wider block text-muted-foreground">Candidate Identity &amp; Links</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={candidateName}
                    onChange={e => setCandidateName(e.target.value)}
                    placeholder="Full Name"
                    className="input text-xs"
                  />
                  <input
                    type="text"
                    value={candidateEmail}
                    onChange={e => setCandidateEmail(e.target.value)}
                    placeholder="Email Address"
                    className="input text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={candidatePhone}
                    onChange={e => setCandidatePhone(e.target.value)}
                    placeholder="Phone Number"
                    className="input text-xs"
                  />
                  <input
                    type="text"
                    value={candidateLocation}
                    onChange={e => setCandidateLocation(e.target.value)}
                    placeholder="Location (City, Country)"
                    className="input text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={candidateGithub}
                    onChange={e => setCandidateGithub(e.target.value)}
                    placeholder="GitHub Link"
                    className="input text-xs"
                  />
                  <input
                    type="text"
                    value={candidateLinkedin}
                    onChange={e => setCandidateLinkedin(e.target.value)}
                    placeholder="LinkedIn Profile"
                    className="input text-xs"
                  />
                </div>
              </div>

              {/* Professional Summary */}
              <div className="space-y-1.5 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <label className="text-2xs font-bold uppercase tracking-wider block text-muted-foreground">Professional Summary</label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  className="input w-full text-xs resize-none leading-relaxed"
                  placeholder="Summarize your engineering expertise and core systems..."
                />
              </div>

              {/* Technical Skills */}
              <div className="space-y-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <label className="text-2xs font-bold uppercase tracking-wider block text-muted-foreground">Verified Skills ({skills.length})</label>
                  <button
                    onClick={handlePromptSkillConfirmation}
                    className="text-2xs font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={11} /> AI Suggestions ({atsAnalysis.missingKeywords.length})
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(skillInput) } }}
                    placeholder="Type skill & press Enter (e.g. Docker, Redis)..."
                    className="input text-xs flex-1"
                  />
                  <button onClick={() => handleAddSkill(skillInput)} className="btn btn-primary text-xs px-3">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
                  {skills.map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-lg text-2xs font-semibold bg-muted flex items-center gap-1 border border-border">
                      {s}
                      <button onClick={() => handleRemoveSkill(s)} className="cursor-pointer hover:text-red-400"><X size={11} /></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Work Experience */}
              <div className="space-y-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <label className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">Work Experience</label>
                  <button
                    onClick={() => setExperience([...experience, { id: `exp-${Date.now()}`, title: 'Software Engineer', company: 'Company Name', duration: '2025 - Present', description: 'Engineered backend microservices and improved API throughput.' }])}
                    className="text-2xs font-bold text-primary flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> Add Experience
                  </button>
                </div>
                {experience.map((exp, idx) => (
                  <div key={exp.id} className="p-3 rounded-xl bg-muted/60 border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={exp.title}
                        onChange={e => {
                          const copy = [...experience]
                          copy[idx].title = e.target.value
                          setExperience(copy)
                        }}
                        placeholder="Job Title"
                        className="input text-xs py-1 font-bold flex-1 mr-2"
                      />
                      <button onClick={() => setExperience(experience.filter((_, i) => i !== idx))} className="text-destructive cursor-pointer">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={exp.company}
                        onChange={e => {
                          const copy = [...experience]
                          copy[idx].company = e.target.value
                          setExperience(copy)
                        }}
                        placeholder="Company Name"
                        className="input text-xs py-1"
                      />
                      <input
                        type="text"
                        value={exp.duration}
                        onChange={e => {
                          const copy = [...experience]
                          copy[idx].duration = e.target.value
                          setExperience(copy)
                        }}
                        placeholder="Duration (e.g. Jun 2025 - Present)"
                        className="input text-xs py-1"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={exp.description}
                      onChange={e => {
                        const copy = [...experience]
                        copy[idx].description = e.target.value
                        setExperience(copy)
                      }}
                      placeholder="Bullet point accomplishment with metrics (STAR method)..."
                      className="input w-full text-xs py-1 resize-none"
                    />
                  </div>
                ))}
              </div>

              {/* Projects */}
              <div className="space-y-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <label className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">Key Projects</label>
                  <button
                    onClick={() => setProjects([...projects, { id: `proj-${Date.now()}`, name: 'New Project', technologies: ['React', 'TypeScript', 'Node.js'], description: 'Built an architectural application with high availability.' }])}
                    className="text-2xs font-bold text-primary flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> Add Project
                  </button>
                </div>
                {projects.map((proj, idx) => (
                  <div key={proj.id} className="p-3 rounded-xl bg-muted/60 border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={proj.name}
                        onChange={e => {
                          const copy = [...projects]
                          copy[idx].name = e.target.value
                          setProjects(copy)
                        }}
                        placeholder="Project Name"
                        className="input text-xs py-1 font-bold flex-1 mr-2"
                      />
                      <button onClick={() => setProjects(projects.filter((_, i) => i !== idx))} className="text-destructive cursor-pointer">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={proj.technologies?.join(', ')}
                      onChange={e => {
                        const copy = [...projects]
                        copy[idx].technologies = e.target.value.split(',').map(t => t.trim())
                        setProjects(copy)
                      }}
                      placeholder="Technologies (comma separated)"
                      className="input text-xs py-1"
                    />
                    <textarea
                      rows={2}
                      value={proj.description}
                      onChange={e => {
                        const copy = [...projects]
                        copy[idx].description = e.target.value
                        setProjects(copy)
                      }}
                      placeholder="Project description, architecture and outcomes..."
                      className="input w-full text-xs py-1 resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Live Word Document Canvas */}
          <div className="lg:col-span-7 space-y-3">
            {/* Word Formatting Ribbon */}
            <div className="card p-3 rounded-2xl border flex items-center justify-between gap-3 flex-wrap" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <FileText size={13} /> Word Layout:
                </span>
                <select
                  value={wordFont}
                  onChange={e => setWordFont(e.target.value)}
                  className="input text-2xs py-1 px-2 font-semibold"
                >
                  <option value="Calibri">Calibri</option>
                  <option value="Arial">Arial</option>
                  <option value="Georgia">Georgia (Serif)</option>
                  <option value="Inter">Inter (Modern)</option>
                  <option value="Times New Roman">Times New Roman</option>
                </select>

                <select
                  value={wordFontSize}
                  onChange={e => setWordFontSize(e.target.value)}
                  className="input text-2xs py-1 px-2 font-semibold"
                >
                  <option value="10pt">10 pt (Compact)</option>
                  <option value="11pt">11 pt (Standard)</option>
                  <option value="12pt">12 pt (Large)</option>
                </select>

                <select
                  value={wordLineHeight}
                  onChange={e => setWordLineHeight(e.target.value)}
                  className="input text-2xs py-1 px-2 font-semibold"
                >
                  <option value="1.15">1.15 (Tight)</option>
                  <option value="1.3">1.3 (Standard)</option>
                  <option value="1.5">1.5 (Relaxed)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportWordDocx}
                  className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Download size={13} /> Download .DOCX
                </button>
              </div>
            </div>

            {/* A4 Realistic Page Canvas with 6 Distinct Template Layouts */}
            <div
              id="printable-resume-canvas"
              className="w-full min-h-[900px] p-8 sm:p-12 rounded-xl shadow-2xl transition-all border text-slate-900 overflow-hidden"
              style={{
                background: '#FFFFFF',
                fontFamily: `${wordFont}, ${activeTemplate.fontFamily}`,
                fontSize: wordFontSize,
                lineHeight: wordLineHeight,
                borderColor: '#E2E8F0',
                boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
              }}
            >
              {/* ── TEMPLATE 1: Modern Tech & Fullstack Engineer ── */}
              {selectedTemplateId === 'ModernTech' && (
                <div className="space-y-4">
                  {/* Top Accent Band Header */}
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h1 className="text-2xl font-black tracking-wide text-white uppercase m-0">{candidateName}</h1>
                        <p className="text-xs font-mono text-purple-300 font-bold mt-0.5">{targetRole}</p>
                      </div>
                      <div className="text-right text-2xs space-y-0.5 text-purple-200">
                        <p>{candidateEmail} • {candidatePhone}</p>
                        <p>{candidateLocation}</p>
                        <p className="text-purple-300 font-mono font-semibold">{candidateGithub} • {candidateLinkedin}</p>
                      </div>
                    </div>
                  </div>

                  {summary && (
                    <div className="space-y-1">
                      <h2 className="text-xs font-extrabold uppercase tracking-wider text-purple-900 border-b-2 border-purple-200 pb-1">
                        Professional Summary
                      </h2>
                      <p className="text-xs text-slate-700 leading-relaxed text-justify">{summary}</p>
                    </div>
                  )}

                  {skills.length > 0 && (
                    <div className="space-y-1.5">
                      <h2 className="text-xs font-extrabold uppercase tracking-wider text-purple-900 border-b-2 border-purple-200 pb-1">
                        Verified Technical Stack
                      </h2>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {skills.map(s => (
                          <span key={s} className="px-2 py-0.5 rounded-md text-2xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {experience.length > 0 && (
                    <div className="space-y-2">
                      <h2 className="text-xs font-extrabold uppercase tracking-wider text-purple-900 border-b-2 border-purple-200 pb-1">
                        Work Experience &amp; Leadership
                      </h2>
                      {experience.map(exp => (
                        <div key={exp.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <div className="flex justify-between items-baseline text-xs">
                            <span className="font-bold text-slate-950">{exp.title} <span className="font-semibold text-purple-700">— {exp.company}</span></span>
                            <span className="text-2xs text-slate-500 font-mono font-bold">{exp.duration}</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed text-justify">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {projects.length > 0 && (
                    <div className="space-y-2">
                      <h2 className="text-xs font-extrabold uppercase tracking-wider text-purple-900 border-b-2 border-purple-200 pb-1">
                        Featured Systems &amp; Architectures
                      </h2>
                      {projects.map(proj => (
                        <div key={proj.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <div className="flex justify-between items-baseline text-xs">
                            <span className="font-bold text-slate-950">{proj.name}</span>
                            <span className="text-2xs text-purple-700 font-mono font-bold">{proj.technologies?.join(', ')}</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed text-justify">{proj.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {education.length > 0 && (
                    <div className="space-y-1">
                      <h2 className="text-xs font-extrabold uppercase tracking-wider text-purple-900 border-b-2 border-purple-200 pb-1">
                        Academic Qualifications
                      </h2>
                      {education.map(edu => (
                        <div key={edu.id} className="flex justify-between items-baseline text-xs pt-1">
                          <div>
                            <strong className="text-slate-950">{edu.institution}</strong>
                            <span className="text-slate-700 block text-2xs">{edu.degree} — <strong className="text-purple-700">{edu.cgpa}</strong></span>
                          </div>
                          <span className="text-2xs text-slate-500 font-mono font-bold">{edu.year}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {certifications.length > 0 && (
                    <div className="space-y-1">
                      <h2 className="text-xs font-extrabold uppercase tracking-wider text-purple-900 border-b-2 border-purple-200 pb-1">
                        Credentials &amp; Certifications
                      </h2>
                      <p className="text-xs text-slate-700 pt-1">{certifications.join(' • ')}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── TEMPLATE 2: Executive Two-Column Sidebar ── */}
              {selectedTemplateId === 'Executive2Col' && (
                <div className="grid grid-cols-12 gap-6">
                  {/* Left Column (Sidebar: 4 cols) */}
                  <div className="col-span-12 sm:col-span-4 p-5 rounded-2xl bg-slate-900 text-white space-y-5 shadow-md">
                    <div>
                      <h1 className="text-lg font-black uppercase text-white leading-tight">{candidateName}</h1>
                      <p className="text-2xs font-mono text-indigo-400 font-bold mt-1">{targetRole}</p>
                    </div>

                    <div className="space-y-1.5 text-2xs text-slate-300 border-t border-slate-700 pt-3">
                      <p className="font-bold text-white uppercase tracking-wider text-3xs">Contact</p>
                      <p className="break-all">{candidateEmail}</p>
                      <p>{candidatePhone}</p>
                      <p>{candidateLocation}</p>
                      <p className="text-indigo-300 font-mono break-all">{candidateGithub}</p>
                      <p className="text-indigo-300 font-mono break-all">{candidateLinkedin}</p>
                    </div>

                    {skills.length > 0 && (
                      <div className="space-y-2 border-t border-slate-700 pt-3">
                        <p className="font-bold text-white uppercase tracking-wider text-3xs">Core Competencies</p>
                        <div className="flex flex-wrap gap-1">
                          {skills.map(s => (
                            <span key={s} className="px-2 py-0.5 rounded text-3xs font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {education.length > 0 && (
                      <div className="space-y-2 border-t border-slate-700 pt-3 text-2xs">
                        <p className="font-bold text-white uppercase tracking-wider text-3xs">Education</p>
                        {education.map(edu => (
                          <div key={edu.id} className="space-y-0.5">
                            <strong className="text-white block">{edu.institution}</strong>
                            <span className="text-slate-300 block">{edu.degree}</span>
                            <span className="text-indigo-300 font-mono font-bold">{edu.cgpa} ({edu.year})</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {certifications.length > 0 && (
                      <div className="space-y-1 border-t border-slate-700 pt-3 text-2xs">
                        <p className="font-bold text-white uppercase tracking-wider text-3xs">Certifications</p>
                        {certifications.map(c => (
                          <p key={c} className="text-slate-300 leading-snug">• {c}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column (Content: 8 cols) */}
                  <div className="col-span-12 sm:col-span-8 space-y-4 py-2">
                    {summary && (
                      <div className="space-y-1">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1">
                          Executive Profile
                        </h2>
                        <p className="text-xs text-slate-700 leading-relaxed text-justify">{summary}</p>
                      </div>
                    )}

                    {experience.length > 0 && (
                      <div className="space-y-2.5">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1">
                          Professional Experience
                        </h2>
                        {experience.map(exp => (
                          <div key={exp.id} className="space-y-1">
                            <div className="flex justify-between items-baseline text-xs">
                              <strong className="text-slate-950">{exp.title} — <span className="font-normal italic text-slate-700">{exp.company}</span></strong>
                              <span className="text-2xs text-slate-600 font-mono">{exp.duration}</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed text-justify pl-3" style={{ textIndent: '-12px' }}>
                              • {exp.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {projects.length > 0 && (
                      <div className="space-y-2.5">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1">
                          Major Projects &amp; Architectures
                        </h2>
                        {projects.map(proj => (
                          <div key={proj.id} className="space-y-1">
                            <div className="flex justify-between items-baseline text-xs">
                              <strong className="text-slate-950">{proj.name}</strong>
                              <span className="text-2xs text-indigo-700 font-mono">{proj.technologies?.join(', ')}</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed text-justify pl-3" style={{ textIndent: '-12px' }}>
                              • {proj.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── TEMPLATE 3: Silicon Valley Tech Lead ── */}
              {selectedTemplateId === 'SiliconValleyLead' && (
                <div className="border-l-4 border-purple-600 pl-6 space-y-4">
                  <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950 m-0">{candidateName}</h1>
                    <p className="text-xs font-bold text-purple-700 uppercase tracking-widest">{targetRole}</p>
                    <div className="text-2xs text-slate-600 flex items-center gap-2 flex-wrap pt-1 font-mono">
                      <span>{candidateEmail}</span> • <span>{candidatePhone}</span> • <span>{candidateLocation}</span> • <span className="text-purple-700 font-bold">{candidateGithub}</span>
                    </div>
                  </div>

                  {/* Impact Metrics Scorecard Banner */}
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 grid grid-cols-3 gap-2 text-center text-slate-800">
                    <div><span className="text-3xs uppercase text-purple-900 font-bold block">ATS Benchmark</span><strong className="text-xs text-purple-700">{atsAnalysis.totalATSScore}/100 Match</strong></div>
                    <div><span className="text-3xs uppercase text-purple-900 font-bold block">Engineering Stack</span><strong className="text-xs text-purple-700">{skills.length} Technologies</strong></div>
                    <div><span className="text-3xs uppercase text-purple-900 font-bold block">Academic GPA</span><strong className="text-xs text-purple-700">{education[0]?.cgpa || '8.8 CGPA'}</strong></div>
                  </div>

                  {summary && (
                    <div className="space-y-1">
                      <h2 className="text-xs font-black uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-600"></span> Summary &amp; Impact
                      </h2>
                      <p className="text-xs text-slate-700 leading-relaxed text-justify">{summary}</p>
                    </div>
                  )}

                  {skills.length > 0 && (
                    <div className="space-y-1">
                      <h2 className="text-xs font-black uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-600"></span> Technical Proficiencies
                      </h2>
                      <p className="text-xs text-slate-800 font-semibold">{skills.join(' • ')}</p>
                    </div>
                  )}

                  {experience.length > 0 && (
                    <div className="space-y-2">
                      <h2 className="text-xs font-black uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-600"></span> Experience &amp; High-Impact Outcomes
                      </h2>
                      {experience.map(exp => (
                        <div key={exp.id} className="space-y-1">
                          <div className="flex justify-between items-baseline text-xs">
                            <span className="font-black text-slate-950">{exp.title} <span className="font-bold text-purple-700">@ {exp.company}</span></span>
                            <span className="text-2xs font-mono font-bold text-slate-600">{exp.duration}</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed text-justify pl-3" style={{ textIndent: '-12px' }}>
                            • {exp.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {projects.length > 0 && (
                    <div className="space-y-2">
                      <h2 className="text-xs font-black uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-600"></span> Flagship Architectures
                      </h2>
                      {projects.map(proj => (
                        <div key={proj.id} className="space-y-1">
                          <div className="flex justify-between items-baseline text-xs">
                            <span className="font-black text-slate-950">{proj.name}</span>
                            <span className="text-2xs text-purple-700 font-mono font-bold">{proj.technologies?.join(', ')}</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed text-justify pl-3" style={{ textIndent: '-12px' }}>
                            • {proj.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {education.length > 0 && (
                    <div className="space-y-1">
                      <h2 className="text-xs font-black uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-600"></span> Education
                      </h2>
                      {education.map(edu => (
                        <div key={edu.id} className="flex justify-between items-baseline text-xs">
                          <div>
                            <strong className="text-slate-950">{edu.institution}</strong>
                            <span className="text-slate-700 block text-2xs">{edu.degree} — <strong>{edu.cgpa}</strong></span>
                          </div>
                          <span className="text-2xs text-slate-600 font-mono">{edu.year}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── TEMPLATE 4: Academic & Research CV ── */}
              {selectedTemplateId === 'AcademicCV' && (
                <div className="space-y-4 text-center">
                  <div className="space-y-1 border-b-2 border-double border-slate-900 pb-3">
                    <h1 className="text-2xl font-serif font-black uppercase tracking-widest text-slate-950 m-0">{candidateName}</h1>
                    <p className="text-xs font-serif italic text-slate-700">Curriculum Vitae &amp; Research Portfolio</p>
                    <p className="text-2xs font-serif text-slate-600">
                      {candidateEmail} &nbsp;•&nbsp; {candidatePhone} &nbsp;•&nbsp; {candidateLocation} &nbsp;•&nbsp; {candidateLinkedin}
                    </p>
                  </div>

                  <div className="text-left space-y-4">
                    {summary && (
                      <div className="space-y-1">
                        <h2 className="text-xs font-serif font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-0.5">
                          I. Research Statement &amp; Objectives
                        </h2>
                        <p className="text-xs font-serif text-slate-800 leading-relaxed text-justify">{summary}</p>
                      </div>
                    )}

                    {education.length > 0 && (
                      <div className="space-y-2">
                        <h2 className="text-xs font-serif font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-0.5">
                          II. Academic Background
                        </h2>
                        {education.map(edu => (
                          <div key={edu.id} className="flex justify-between items-baseline text-xs font-serif">
                            <div>
                              <strong className="text-slate-950 font-bold">{edu.institution}</strong>
                              <span className="text-slate-800 block text-2xs italic">{edu.degree} (Honor Cumulative: <strong>{edu.cgpa}</strong>)</span>
                            </div>
                            <span className="text-2xs text-slate-700 font-serif">{edu.year}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {experience.length > 0 && (
                      <div className="space-y-2">
                        <h2 className="text-xs font-serif font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-0.5">
                          III. Research &amp; Engineering Appointments
                        </h2>
                        {experience.map(exp => (
                          <div key={exp.id} className="space-y-1 font-serif">
                            <div className="flex justify-between items-baseline text-xs">
                              <span className="font-bold text-slate-950">{exp.title}, <span className="italic font-normal">{exp.company}</span></span>
                              <span className="text-2xs text-slate-700">{exp.duration}</span>
                            </div>
                            <p className="text-xs text-slate-800 leading-relaxed text-justify pl-3" style={{ textIndent: '-12px' }}>
                              • {exp.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {projects.length > 0 && (
                      <div className="space-y-2">
                        <h2 className="text-xs font-serif font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-0.5">
                          IV. Selected Systems &amp; Scientific Implementations
                        </h2>
                        {projects.map(proj => (
                          <div key={proj.id} className="space-y-1 font-serif">
                            <div className="flex justify-between items-baseline text-xs">
                              <span className="font-bold text-slate-950">{proj.name}</span>
                              <span className="text-2xs text-slate-600 italic">[{proj.technologies?.join(', ')}]</span>
                            </div>
                            <p className="text-xs text-slate-800 leading-relaxed text-justify pl-3" style={{ textIndent: '-12px' }}>
                              • {proj.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {skills.length > 0 && (
                      <div className="space-y-1">
                        <h2 className="text-xs font-serif font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-0.5">
                          V. Technical Proficiencies &amp; Tooling
                        </h2>
                        <p className="text-xs font-serif text-slate-800">{skills.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── TEMPLATE 5 & 6: Minimalist Pure ATS / Harvard Classic (Default Strict ATS) ── */}
              {(selectedTemplateId === 'MinimalistPure' || selectedTemplateId === 'HarvardClassic') && (
                <div className="space-y-4">
                  {/* Classical Centered Header */}
                  <div className="text-center space-y-1 pb-3 mb-4" style={{ borderBottom: selectedTemplateId === 'HarvardClassic' ? '2px solid #0F172A' : '1px solid #CBD5E1' }}>
                    <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-widest text-slate-950 m-0">
                      {candidateName}
                    </h1>
                    <div className="text-xs text-slate-600 flex items-center justify-center gap-2 flex-wrap font-medium">
                      <span>{candidateEmail}</span>
                      <span>•</span>
                      <span>{candidatePhone}</span>
                      <span>•</span>
                      <span>{candidateLocation}</span>
                    </div>
                    <div className="text-xs text-slate-800 flex items-center justify-center gap-3 flex-wrap font-semibold pt-0.5">
                      {candidateGithub && <span>{candidateGithub}</span>}
                      {candidateLinkedin && <span>{candidateLinkedin}</span>}
                    </div>
                  </div>

                  {/* Professional Summary */}
                  {summary && (
                    <div className="mb-4">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-2">
                        Professional Summary
                      </h2>
                      <p className="text-xs text-slate-700 leading-relaxed text-justify">{summary}</p>
                    </div>
                  )}

                  {/* Technical Skills */}
                  {skills.length > 0 && (
                    <div className="mb-4">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-2">
                        Technical Skills &amp; Core Competencies
                      </h2>
                      <p className="text-xs text-slate-800 leading-relaxed">
                        <strong>Technologies:</strong> {skills.join(' • ')}
                      </p>
                    </div>
                  )}

                  {/* Work Experience */}
                  {experience.length > 0 && (
                    <div className="mb-4">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-2.5">
                        Professional Experience
                      </h2>
                      <div className="space-y-3">
                        {experience.map(exp => (
                          <div key={exp.id} className="space-y-1">
                            <div className="flex justify-between items-baseline text-xs">
                              <span className="font-bold text-slate-950">{exp.title} <span className="font-semibold text-slate-700">— {exp.company}</span></span>
                              <span className="text-2xs text-slate-600 font-mono">{exp.duration}</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed text-justify pl-3" style={{ textIndent: '-12px' }}>
                              • {exp.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {projects.length > 0 && (
                    <div className="mb-4">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-2.5">
                        Engineering Projects &amp; Architectures
                      </h2>
                      <div className="space-y-3">
                        {projects.map(proj => (
                          <div key={proj.id} className="space-y-1">
                            <div className="flex justify-between items-baseline text-xs">
                              <span className="font-bold text-slate-950">{proj.name}</span>
                              <span className="text-2xs text-indigo-700 font-mono font-semibold">{proj.technologies?.join(', ')}</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed text-justify pl-3" style={{ textIndent: '-12px' }}>
                              • {proj.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {education.length > 0 && (
                    <div className="mb-4">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-2">
                        Education &amp; Academic Honors
                      </h2>
                      <div className="space-y-2">
                        {education.map(edu => (
                          <div key={edu.id} className="flex justify-between items-baseline text-xs">
                            <div>
                              <strong className="text-slate-950">{edu.institution}</strong>
                              <span className="text-slate-700 block text-2xs">{edu.degree} — <strong>{edu.cgpa}</strong></span>
                            </div>
                            <span className="text-2xs text-slate-600 font-mono">{edu.year}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {certifications.length > 0 && (
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-1.5">
                        Certifications &amp; Credentials
                      </h2>
                      <p className="text-xs text-slate-800">{certifications.join(' • ')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SKILL CONFIRMATION MODAL (SAFETY GATE) ───────────────────────── */}
      <AnimatePresence>
        {showSkillConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="card max-w-lg w-full p-6 rounded-2xl space-y-4 shadow-2xl border"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-purple-400" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Confirm Experience Before Adding</h3>
                    <p className="text-2xs text-muted-foreground">AI recommends skills based on {targetRole} benchmark.</p>
                  </div>
                </div>
                <button onClick={() => setShowSkillConfirmModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-start gap-2.5 text-2xs text-purple-200">
                <Info size={16} className="shrink-0 text-purple-400 mt-0.5" />
                <p>
                  <strong>Data Integrity Rule:</strong> Only select technologies you have genuine academic, project, or internship experience with. Unchecked skills will remain recommendations and will not be added to your profile.
                </p>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                {Object.keys(selectedMissingSkills).map(skillName => (
                  <label
                    key={skillName}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-semibold text-foreground">{skillName}</span>
                    <input
                      type="checkbox"
                      checked={!!selectedMissingSkills[skillName]}
                      onChange={e => setSelectedMissingSkills({
                        ...selectedMissingSkills,
                        [skillName]: e.target.checked
                      })}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setShowSkillConfirmModal(false)}
                  className="btn btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddSelectedSkills}
                  className="btn btn-primary text-xs flex items-center gap-1.5"
                >
                  <Check size={14} /> Add Confirmed Skills to Resume
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
