import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../hooks/useStore'
import { setPageContextData } from '../../store/edenSlice'
import {
  Clock, Play, Star, Target, Plus, Edit3, Trash2,
  Eye, BarChart3, Search, Filter, X, Save, BookOpen, Layers
} from 'lucide-react'
import { useAppSelector } from '../../hooks/useStore'

import { ProctorService } from '../../services/proctorService'
import { FileText, Code, CheckCircle2, MessageSquare, Radio } from 'lucide-react'

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'coding'

export interface QuizQuestion {
  id: number | string
  text: string
  type?: QuestionType
  options?: string[]
  correct?: number
  correctAnswer?: string
  rubric?: string
}

export interface Quiz {
  id: string
  title: string
  course: string
  duration: number
  questions: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  points: number
  attempts: number
  bestScore: number | null
  badge: string
  isPublished: boolean
  questionList?: QuizQuestion[]
}

const INITIAL_QUIZZES: Quiz[] = [
  {
    id: 'q1',
    title: 'React Hooks & State Architecture',
    course: 'Advanced React',
    duration: 20,
    questions: 3,
    difficulty: 'Hard',
    points: 150,
    attempts: 12,
    bestScore: 87,
    badge: '🧠',
    isPublished: true,
    questionList: [
      { id: 1, text: 'What does the useCallback hook do in React?', type: 'multiple_choice', options: ['Memoizes a function instance', 'Creates a mutable ref', 'Handles async side effects', 'Manages global reducer state'], correct: 0, correctAnswer: 'Memoizes a function instance' },
      { id: 2, text: 'Explain the difference between useEffect and useLayoutEffect in React with practical use cases.', type: 'essay', rubric: 'Mention DOM mutation, paint timing, smooth UI animations, and synchronous execution.', correctAnswer: 'useEffect fires asynchronously after layout and paint. useLayoutEffect fires synchronously after all DOM mutations before paint.' },
      { id: 3, text: 'Write a custom React hook `useLocalStorage(key, initialValue)` in JavaScript or TypeScript.', type: 'coding', rubric: 'Include useState fallback, try/catch JSON parsing, and window.localStorage.setItem update.', correctAnswer: 'function useLocalStorage(key, initialValue) { ... }' },
    ],
  },
  {
    id: 'q2',
    title: 'ML Algorithms & Model Tuning',
    course: 'Machine Learning',
    duration: 30,
    questions: 3,
    difficulty: 'Medium',
    points: 100,
    attempts: 8,
    bestScore: 92,
    badge: '🤖',
    isPublished: true,
    questionList: [
      { id: 1, text: 'Which algorithm is typically used for classification tasks?', type: 'multiple_choice', options: ['Linear Regression', 'Logistic Regression', 'K-Means Clustering', 'PCA'], correct: 1, correctAnswer: 'Logistic Regression' },
      { id: 2, text: 'Describe overfitting vs underfitting and how L1/L2 regularization mitigates overfitting.', type: 'essay', rubric: 'Discuss model variance, bias, penalty terms, and feature sparsity.', correctAnswer: 'Overfitting occurs when model memorizes training noise (high variance). L1 (Lasso) zeroes weights while L2 (Ridge) shrinks weights.' },
      { id: 3, text: 'Logistic regression outputs probabilities constrained between 0 and 1 via Sigmoid function.', type: 'true_false', options: ['True', 'False'], correct: 0, correctAnswer: 'True' }
    ],
  },
  {
    id: 'q3',
    title: 'DSA Sprint — Trees & Graphs',
    course: 'Data Structures',
    duration: 45,
    questions: 2,
    difficulty: 'Hard',
    points: 200,
    attempts: 5,
    bestScore: 95,
    badge: '🌳',
    isPublished: true,
    questionList: [
      { id: 1, text: 'What is the worst-case time complexity of searching in a Balanced Binary Search Tree?', type: 'multiple_choice', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'], correct: 2, correctAnswer: 'O(log n)' },
      { id: 2, text: 'Explain Dijkstra algorithm for shortest path in a weighted graph with priority queue.', type: 'short_answer', rubric: 'Mention greedy choice, edge relaxation, non-negative weights, and O((V+E) log V) complexity.', correctAnswer: 'Dijkstra maintains a priority queue of unvisited nodes with smallest tentative distance, repeatedly relaxing edges.' },
    ],
  },
  {
    id: 'q4',
    title: 'AWS Services Basics',
    course: 'Cloud Computing',
    duration: 15,
    questions: 2,
    difficulty: 'Easy',
    points: 50,
    attempts: 15,
    bestScore: 100,
    badge: '☁️',
    isPublished: true,
    questionList: [
      { id: 1, text: 'Which AWS service provides resizable compute capacity in the cloud?', type: 'multiple_choice', options: ['Amazon S3', 'Amazon EC2', 'Amazon RDS', 'AWS Lambda'], correct: 1, correctAnswer: 'Amazon EC2' },
      { id: 2, text: 'What is AWS S3 primarily used for?', type: 'multiple_choice', options: ['Relational database', 'Object storage', 'DNS service', 'Container orchestration'], correct: 1, correctAnswer: 'Object storage' },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────
// Quiz Taking View (In-Progress) with Non-MCQ Answer Workspace
// ─────────────────────────────────────────────────────────────────────
function QuizInProgress({ quiz, onEnd }: { quiz: Quiz; onEnd: (score: number) => void }) {
  const [current, setCurrent] = useState(0)
  const [selectedMcq, setSelectedMcq] = useState<number | null>(null)
  const [writtenAnswers, setWrittenAnswers] = useState<Record<number, string>>({})
  const [isDraftSaved, setIsDraftSaved] = useState(true)

  const questions: QuizQuestion[] = quiz.questionList && quiz.questionList.length > 0
    ? quiz.questionList
    : [
        { id: 1, text: 'Explain the core principles of Object-Oriented Programming (OOP).', type: 'essay', rubric: 'Encapsulation, Abstraction, Inheritance, Polymorphism' },
        { id: 2, text: 'Which hook should you use for side effects in React?', type: 'multiple_choice', options: ['useState', 'useEffect', 'useMemo', 'useRef'], correct: 1 },
      ]

  const [answeredState, setAnsweredState] = useState<any[]>(Array(questions.length).fill(null))
  const [showResult, setShowResult] = useState(false)

  const q = questions[current]
  const isLast = current === questions.length - 1
  const qType: QuestionType = q.type || (q.options && q.options.length > 0 ? 'multiple_choice' : 'essay')
  const isMcqLike = qType === 'multiple_choice' || qType === 'true_false'

  const currentTextAnswer = writtenAnswers[current] || ''
  const wordCount = currentTextAnswer.trim() ? currentTextAnswer.trim().split(/\s+/).length : 0
  const charCount = currentTextAnswer.length

  const handleTextChange = (val: string) => {
    setIsDraftSaved(false)
    setWrittenAnswers(prev => ({ ...prev, [current]: val }))
    setTimeout(() => setIsDraftSaved(true), 600)
  }

  const handleNext = () => {
    const newAnswered = [...answeredState]
    if (isMcqLike) {
      newAnswered[current] = selectedMcq
    } else {
      newAnswered[current] = currentTextAnswer
    }
    setAnsweredState(newAnswered)

    if (isLast) {
      setShowResult(true)
    } else {
      setCurrent(c => c + 1)
      setSelectedMcq(null)
    }
  }

  if (showResult) {
    let earnedPoints = 0
    let totalPossible = quiz.points || questions.length * 50

    // Evaluate answers
    answeredState.forEach((userAns, idx) => {
      const item = questions[idx]
      const itemType = item.type || (item.options && item.options.length > 0 ? 'multiple_choice' : 'essay')
      if (itemType === 'multiple_choice' || itemType === 'true_false') {
        if (userAns === item.correct) {
          earnedPoints += Math.round(totalPossible / questions.length)
        }
      } else {
        // Non-MCQ subjective evaluation: check length and keywords
        if (typeof userAns === 'string' && userAns.trim().length >= 15) {
          earnedPoints += Math.round(totalPossible / questions.length)
        } else if (typeof userAns === 'string' && userAns.trim().length > 0) {
          earnedPoints += Math.round((totalPossible / questions.length) * 0.5)
        }
      }
    })

    const pct = Math.round((earnedPoints / totalPossible) * 100)

    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-8 text-center max-w-xl mx-auto space-y-5 border-2 border-indigo-500/30">
        <div className="text-6xl mb-2">{pct >= 70 ? '🎉' : '📊'}</div>
        <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
          {pct >= 90 ? 'Outstanding Performance!' : pct >= 70 ? 'Quiz Successfully Passed!' : 'Quiz Completed!'}
        </h2>
        <p className="text-4xl font-black" style={{ color: pct >= 70 ? '#10B981' : '#F59E0B' }}>{pct}%</p>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Earned {earnedPoints} of {totalPossible} total points · +{Math.round(quiz.points * (pct / 100))} XP credited!
        </p>

        {/* Breakdown */}
        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-left space-y-2.5 text-xs">
          <p className="font-bold text-indigo-300 uppercase tracking-wider text-2xs">Question Evaluation Summary</p>
          {questions.map((item, i) => (
            <div key={i} className="flex items-center justify-between border-b border-slate-700/40 pb-1.5">
              <span className="text-slate-300 truncate max-w-[280px]">Q{i + 1}: {item.text}</span>
              <span className="font-semibold px-2 py-0.5 rounded text-2xs bg-indigo-500/20 text-indigo-300 uppercase">
                {item.type || 'MCQ'}
              </span>
            </div>
          ))}
        </div>

        <button onClick={() => onEnd(pct)} className="px-6 py-3 rounded-xl font-extrabold text-xs text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg, #2563EB, #6366F1)' }}>
          Return to Quiz Hub
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-base flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span>{quiz.badge}</span> {quiz.title}
          </h2>
          <p className="text-2xs" style={{ color: 'var(--text-muted)' }}>{quiz.course} · Live Interactive Assessment</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
            <Clock size={14} /> {quiz.duration} mins left
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar h-2.5 rounded-full">
        <div className="progress-fill transition-all duration-300" style={{ width: `${((current + 1) / questions.length) * 100}%`, background: 'linear-gradient(90deg, #2563EB, #8B5CF6)' }} />
      </div>

      {/* Main Question Card */}
      <div className="card p-6 space-y-5 border-2 border-indigo-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xs font-extrabold px-3 py-1 rounded-full uppercase bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
              {qType === 'coding' ? <Code size={12} /> : qType === 'essay' ? <FileText size={12} /> : <Radio size={12} />}
              {qType.replace(/_/g, ' ')}
            </span>
            <span className="text-2xs font-semibold" style={{ color: 'var(--text-muted)' }}>Question {current + 1} of {questions.length}</span>
          </div>

          <span className="text-2xs font-mono font-bold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 size={12} /> {isDraftSaved ? 'Draft Saved' : 'Saving...'}
          </span>
        </div>

        <h3 className="text-base font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>{q.text}</h3>

        {/* ── MCQ & True/False Response Area ── */}
        {isMcqLike && q.options && (
          <div className="space-y-3">
            {q.options.map((opt, i) => (
              <motion.button key={i} whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedMcq(i)}
                className="w-full p-4 rounded-xl text-left text-xs font-medium transition-all flex items-center justify-between"
                style={{
                  background: selectedMcq === i ? 'rgba(37,99,235,0.15)' : 'rgba(var(--rgb-white),0.04)',
                  border: `1px solid ${selectedMcq === i ? 'rgba(37,99,235,0.5)' : 'var(--border)'}`,
                  color: selectedMcq === i ? '#60A5FA' : 'var(--text-primary)',
                }}>
                <div className="flex items-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-2xs mr-3 font-bold shrink-0"
                    style={{ background: selectedMcq === i ? 'rgba(37,99,235,0.3)' : 'rgba(var(--rgb-white),0.08)' }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </div>
                {selectedMcq === i && <CheckCircle2 size={16} className="text-blue-400" />}
              </motion.button>
            ))}
          </div>
        )}

        {/* ── NON-MCQ DEDICATED RESPONSE WORKSPACE ── */}
        {!isMcqLike && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-2xs text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="font-mono font-semibold flex items-center gap-1 text-indigo-400">
                  <MessageSquare size={13} /> {qType === 'coding' ? 'Code Editor Space' : 'Written Answer Workspace'}
                </span>
                {q.rubric && (
                  <span className="text-2xs text-slate-400 hidden sm:inline">
                    💡 Rubric: {q.rubric}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span>{wordCount} words</span>
                <span>{charCount} chars</span>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-500/30 bg-slate-950 focus-within:border-indigo-500 transition-all">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-2xs font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="ml-2 font-bold text-slate-300">Answer Console</span>
                </div>
                <button type="button" onClick={() => handleTextChange('')} className="hover:text-red-400 text-slate-500 transition-colors">
                  Clear
                </button>
              </div>

              <div className="flex">
                {/* Line numbers for writing space */}
                <div className="w-8 py-3 text-right pr-2 text-2xs font-mono select-none text-slate-600 border-r border-slate-800 bg-slate-900/40">
                  {Array.from({ length: Math.max(6, currentTextAnswer.split('\n').length) }, (_, i) => i + 1).map(n => (
                    <div key={n}>{n}</div>
                  ))}
                </div>
                <textarea
                  rows={7}
                  value={currentTextAnswer}
                  onChange={e => handleTextChange(e.target.value)}
                  placeholder={
                    qType === 'coding'
                      ? '// Write your solution code here...\nfunction solution() {\n  return true;\n}'
                      : 'Type your detailed explanation or answer here. Write clearly with proper technical terms...'
                  }
                  className="w-full p-3 text-xs bg-transparent text-slate-100 placeholder:text-slate-600 focus:outline-none resize-y font-mono leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <button onClick={() => onEnd(0)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white" style={{ background: 'rgba(var(--rgb-white),0.05)' }}>
            Exit Quiz
          </button>

          <button
            onClick={handleNext}
            disabled={isMcqLike ? selectedMcq === null : currentTextAnswer.trim().length === 0}
            className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-lg disabled:opacity-40 transition-all flex items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg, #2563EB, #6366F1)' }}>
            {isLast ? 'Submit Quiz' : 'Next Question →'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Main Quiz Hub Page with Teacher/Admin CRUD
// ─────────────────────────────────────────────────────────────────────
export default function QuizHubPage() {
  const navigate = useNavigate()
  const { user } = useAppSelector(s => s.auth)
  const dispatch = useAppDispatch()

  const [quizzes, setQuizzes] = useState<Quiz[]>(INITIAL_QUIZZES)
  const [filterDifficulty, setFilterDifficulty] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState('')
  const isManager = ['faculty', 'admin', 'hod', 'super_admin'].includes(user?.role || '')
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [mode] = useState<'list' | 'take' | 'create' | 'edit'>('list')


  // Real-time socket sync
  useEffect(() => {
    const socket = ProctorService.getSocket()

    socket.on('quiz:created', (newQuiz: Quiz) => {
      setQuizzes(prev => [newQuiz, ...prev.filter(q => q.id !== newQuiz.id)])
    })

    socket.on('quiz:updated', (updatedQuiz: Quiz) => {
      setQuizzes(prev => prev.map(q => q.id === updatedQuiz.id ? updatedQuiz : q))
    })

    socket.on('quiz:deleted', (quizId: string) => {
      setQuizzes(prev => prev.filter(q => q.id !== quizId))
    })

    socket.on('quiz:submitted', (submission: any) => {
      setQuizzes(prev => prev.map(q => q.id === submission.quizId ? { ...q, attempts: q.attempts + 1 } : q))
    })

    return () => {
      socket.off('quiz:created')
      socket.off('quiz:updated')
      socket.off('quiz:deleted')
      socket.off('quiz:submitted')
    }
  }, [])

  // Sync state with EDEN Copilot
  useEffect(() => {
    dispatch(setPageContextData({
      currentTool: 'Quiz Hub',
      currentMode: mode,
      activeQuiz: activeQuiz ? activeQuiz.title : null,
      filter: filterDifficulty,
      searchQuery: searchTerm,
      availableQuizzes: quizzes.map(q => ({ title: q.title, difficulty: q.difficulty, points: q.points }))
    }))
    
    return () => {
      dispatch(setPageContextData(null))
    }
  }, [mode, activeQuiz, filterDifficulty, searchTerm, quizzes.length, dispatch])

  // Modal State for CRUD
  const [modalOpen, setModalOpen] = useState(false)
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null)

  // Form State
  const [formTitle, setFormTitle] = useState('')
  const [formCourse, setFormCourse] = useState('')
  const [formDuration, setFormDuration] = useState(20)
  const [formDifficulty, setFormDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium')
  const [formPoints, setFormPoints] = useState(100)
  const [formBadge, setFormBadge] = useState('📝')
  const [formIsPublished, setFormIsPublished] = useState(true)

  // Questions in Form
  const [formQuestions, setFormQuestions] = useState<QuizQuestion[]>([
    { id: 1, text: 'Explain the core principles of OOP.', type: 'essay', rubric: 'Encapsulation, Abstraction, Inheritance, Polymorphism', correctAnswer: 'Encapsulation, Abstraction, Inheritance, Polymorphism' }
  ])

  // Analytics View Modal
  const [analyticsQuiz, setAnalyticsQuiz] = useState<Quiz | null>(null)

  // ── Open Create Modal ─────────────────────
  const handleOpenCreate = () => {
    setEditingQuizId(null)
    setFormTitle('')
    setFormCourse('')
    setFormDuration(20)
    setFormDifficulty('Medium')
    setFormPoints(100)
    setFormBadge('📝')
    setFormIsPublished(true)
    setFormQuestions([
      { id: 1, text: '', type: 'multiple_choice', options: ['', '', '', ''], correct: 0, correctAnswer: '' }
    ])
    setModalOpen(true)
  }

  // ── Open Edit Modal ───────────────────────
  const handleOpenEdit = (quiz: Quiz) => {
    setEditingQuizId(quiz.id)
    setFormTitle(quiz.title)
    setFormCourse(quiz.course)
    setFormDuration(quiz.duration)
    setFormDifficulty(quiz.difficulty)
    setFormPoints(quiz.points)
    setFormBadge(quiz.badge)
    setFormIsPublished(quiz.isPublished)
    setFormQuestions(quiz.questionList || [
      { id: 1, text: `${quiz.title} question 1`, type: 'multiple_choice', options: ['Option A', 'Option B', 'Option C', 'Option D'], correct: 0 }
    ])
    setModalOpen(true)
  }

  // ── Save Quiz (Create or Update) ──────────
  const handleSaveQuiz = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formCourse.trim()) return

    const socket = ProctorService.getSocket()

    if (editingQuizId) {
      const updatedQuiz: Quiz = {
        id: editingQuizId,
        title: formTitle,
        course: formCourse,
        duration: Number(formDuration),
        difficulty: formDifficulty,
        points: Number(formPoints),
        badge: formBadge,
        isPublished: formIsPublished,
        attempts: quizzes.find(q => q.id === editingQuizId)?.attempts || 0,
        bestScore: quizzes.find(q => q.id === editingQuizId)?.bestScore || null,
        questions: formQuestions.length,
        questionList: formQuestions,
      }
      setQuizzes(prev => prev.map(q => q.id === editingQuizId ? updatedQuiz : q))
      socket.emit('quiz:update', updatedQuiz)
    } else {
      const newQuiz: Quiz = {
        id: `q-${Date.now()}`,
        title: formTitle,
        course: formCourse,
        duration: Number(formDuration),
        questions: formQuestions.length,
        difficulty: formDifficulty,
        points: Number(formPoints),
        attempts: 0,
        bestScore: null,
        badge: formBadge || '📝',
        isPublished: formIsPublished,
        questionList: formQuestions,
      }
      setQuizzes(prev => [newQuiz, ...prev])
      socket.emit('quiz:create', newQuiz)
    }
    setModalOpen(false)
  }

  // ── Delete Quiz ───────────────────────────
  const handleDeleteQuiz = (id: string) => {
    if (window.confirm('Are you sure you want to delete this quiz assessment?')) {
      setQuizzes(prev => prev.filter(q => q.id !== id))
      ProctorService.getSocket().emit('quiz:delete', id)
    }
  }

  // ── Toggle Publish Status ────────────────
  const handleTogglePublish = (id: string) => {
    setQuizzes(prev => prev.map(q => {
      if (q.id === id) {
        const updated = { ...q, isPublished: !q.isPublished }
        ProctorService.getSocket().emit('quiz:update', updated)
        return updated
      }
      return q
    }))
  }

  // ── Form Question Handlers ───────────────
  const handleAddQuestion = () => {
    setFormQuestions(prev => [
      ...prev,
      { id: prev.length + 1, text: '', type: 'short_answer', rubric: '', correctAnswer: '' }
    ])
  }

  const handleRemoveQuestion = (idx: number) => {
    setFormQuestions(prev => prev.filter((_, i) => i !== idx))
  }

  const handleQuestionTypeChange = (idx: number, type: QuestionType) => {
    setFormQuestions(prev => prev.map((q, i) => {
      if (i !== idx) return q
      if (type === 'multiple_choice' || type === 'true_false') {
        return {
          ...q,
          type,
          options: type === 'true_false' ? ['True', 'False'] : ['Option A', 'Option B', 'Option C', 'Option D'],
          correct: 0,
        }
      }
      return {
        ...q,
        type,
        options: undefined,
        rubric: q.rubric || 'Key concepts to cover',
        correctAnswer: q.correctAnswer || '',
      }
    }))
  }

  const handleQuestionTextChange = (idx: number, text: string) => {
    setFormQuestions(prev => prev.map((q, i) => i === idx ? { ...q, text } : q))
  }

  const handleRubricChange = (idx: number, rubric: string) => {
    setFormQuestions(prev => prev.map((q, i) => i === idx ? { ...q, rubric } : q))
  }

  const handleCorrectAnswerTextChange = (idx: number, correctAnswer: string) => {
    setFormQuestions(prev => prev.map((q, i) => i === idx ? { ...q, correctAnswer } : q))
  }

  const handleOptionChange = (qIdx: number, optIdx: number, val: string) => {
    setFormQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q
      const newOpts = [...(q.options || ['', '', '', ''])]
      newOpts[optIdx] = val
      return { ...q, options: newOpts }
    }))
  }

  const handleCorrectOptionChange = (qIdx: number, correctIdx: number) => {
    setFormQuestions(prev => prev.map((q, i) => i === qIdx ? { ...q, correct: correctIdx } : q))
  }

  // Filtered Quizzes
  const filteredQuizzes = quizzes.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase()) || q.course.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDiff = filterDifficulty === 'All' || q.difficulty === filterDifficulty
    const matchesPublished = isManager ? true : q.isPublished
    return matchesSearch && matchesDiff && matchesPublished
  })

  const handleQuizEnd = (pctScore: number) => {
    if (activeQuiz) {
      ProctorService.getSocket().emit('quiz:submit', {
        quizId: activeQuiz.id,
        quizTitle: activeQuiz.title,
        studentName: user?.name || 'Student',
        score: pctScore,
      })
      setQuizzes(prev => prev.map(q => q.id === activeQuiz.id ? { ...q, attempts: q.attempts + 1, bestScore: Math.max(q.bestScore || 0, pctScore) } : q))
    }
    setActiveQuiz(null)
  }

  if (activeQuiz) return (
    <div className="page-container">
      <QuizInProgress quiz={activeQuiz} onEnd={handleQuizEnd} />
    </div>
  )

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
            <Layers className="text-blue-500" />
            {isManager ? 'Faculty & Admin Quiz Management Console' : 'Student Quiz Hub'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {isManager
              ? 'Create, edit, publish, and monitor interactive class assessments'
              : 'Test your knowledge, earn XP, and track your subject improvement'}
          </p>
        </motion.div>

        {isManager && (
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' }}>
            <Plus size={16} /> Create New Quiz
          </motion.button>
        )}
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card text-center p-4 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
          <p className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{quizzes.length}</p>
          <p className="text-2xs font-semibold" style={{ color: 'var(--text-muted)' }}>{isManager ? 'Total Quizzes' : 'Available Quizzes'}</p>
        </div>
        <div className="stat-card text-center p-4 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
          <p className="text-2xl font-extrabold text-emerald-400">
            {quizzes.filter(q => q.isPublished).length}
          </p>
          <p className="text-2xs font-semibold" style={{ color: 'var(--text-muted)' }}>Published</p>
        </div>
        <div className="stat-card text-center p-4 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
          <p className="text-2xl font-extrabold text-blue-400">88%</p>
          <p className="text-2xs font-semibold" style={{ color: 'var(--text-muted)' }}>Average Pass Rate</p>
        </div>
        <div className="stat-card text-center p-4 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
          <p className="text-2xl font-extrabold text-purple-400">+650 XP</p>
          <p className="text-2xs font-semibold" style={{ color: 'var(--text-muted)' }}>Total Pool XP</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search quiz title or course..."
            className="input w-full pl-10 pr-4 py-2.5 text-xs rounded-xl"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-slate-400 shrink-0" />
          <div className="flex items-center gap-1.5 p-1 rounded-xl w-full sm:w-auto"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            {(['All', 'Easy', 'Medium', 'Hard'] as const).map(diff => (
              <button key={diff} onClick={() => setFilterDifficulty(diff)}
                className={`px-3 py-1 rounded-lg text-2xs font-bold transition-all ${filterDifficulty === diff ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>
                {diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quizzes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredQuizzes.map((quiz, i) => (
          <motion.div key={quiz.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="card p-5 space-y-3 relative border hover:border-blue-500/40 transition-all">

            {/* Header badges */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{quiz.badge}</span>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{quiz.title}</h3>
                  <p className="text-2xs font-medium" style={{ color: 'var(--text-muted)' }}>{quiz.course}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isManager && (
                  <button onClick={() => handleTogglePublish(quiz.id)}
                    className={`text-2xs px-2.5 py-0.5 rounded-full font-bold border transition-all ${quiz.isPublished ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-slate-700/50 text-slate-400 border-slate-600'}`}>
                    {quiz.isPublished ? 'Published' : 'Draft'}
                  </button>
                )}
                <span className={`text-2xs px-2.5 py-0.5 rounded-full font-bold ${quiz.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' : quiz.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                  {quiz.difficulty}
                </span>
              </div>
            </div>

            {/* Meta details */}
            <div className="flex items-center gap-4 text-2xs pt-1" style={{ color: 'var(--text-muted)' }}>
              <div className="flex items-center gap-1"><Clock size={12} /> {quiz.duration} min</div>
              <div className="flex items-center gap-1"><Target size={12} /> {quiz.questions} questions</div>
              <div className="flex items-center gap-1"><Star size={12} className="text-amber-400" /> +{quiz.points} XP</div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="text-2xs text-slate-500">
                {quiz.attempts} student submission{quiz.attempts !== 1 ? 's' : ''}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/courses?course=${encodeURIComponent(quiz.course)}`)}
                  className="px-2.5 py-1.5 rounded-xl text-2xs font-bold bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 flex items-center gap-1 cursor-pointer"
                  title="Navigate to this particular course"
                >
                  <BookOpen size={12} /> Particular Course
                </button>

                {isManager ? (
                  <>
                    <button onClick={() => setAnalyticsQuiz(quiz)}
                      title="View Submissions & Analytics"
                      className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all border border-slate-700">
                      <BarChart3 size={14} />
                    </button>
                    <button onClick={() => handleOpenEdit(quiz)}
                      title="Edit Quiz"
                      className="p-2 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all border border-slate-700">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDeleteQuiz(quiz.id)}
                      title="Delete Quiz"
                      className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-slate-700">
                      <Trash2 size={14} />
                    </button>
                    <button onClick={() => setActiveQuiz(quiz)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-2xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all">
                      <Eye size={12} /> Preview
                    </button>
                  </>
                ) : (
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => setActiveQuiz(quiz)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow"
                    style={{ background: 'linear-gradient(135deg, #2563EB, #6366F1)' }}>
                    <Play size={13} /> {quiz.attempts > 0 ? 'Retake Quiz' : 'Start Quiz'}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── CREATE / EDIT QUIZ MODAL ────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="card p-6 max-w-2xl w-full my-8 space-y-5 border-2 border-blue-500/40 shadow-2xl max-h-[90vh] overflow-y-auto">

              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Edit3 size={18} className="text-blue-500" />
                  {editingQuizId ? 'Edit Quiz Assessment' : 'Create New Quiz Assessment'}
                </h2>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveQuiz} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-2xs font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>Quiz Title *</label>
                    <input type="text" required value={formTitle} onChange={e => setFormTitle(e.target.value)}
                      placeholder="e.g. React Hooks Deep Dive" className="input text-xs w-full p-3 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-2xs font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>Course Name *</label>
                    <input type="text" required value={formCourse} onChange={e => setFormCourse(e.target.value)}
                      placeholder="e.g. Advanced Web Development" className="input text-xs w-full p-3 rounded-xl" />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-2xs font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>Duration (mins)</label>
                    <input type="number" min={5} max={180} value={formDuration} onChange={e => setFormDuration(Number(e.target.value))}
                      className="input text-xs w-full p-3 rounded-xl font-mono" />
                  </div>
                  <div>
                    <label className="text-2xs font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>XP Points</label>
                    <input type="number" min={10} max={1000} value={formPoints} onChange={e => setFormPoints(Number(e.target.value))}
                      className="input text-xs w-full p-3 rounded-xl font-mono" />
                  </div>
                  <div>
                    <label className="text-2xs font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>Difficulty</label>
                    <select value={formDifficulty} onChange={e => setFormDifficulty(e.target.value as any)}
                      className="input text-xs w-full p-3 rounded-xl">
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-2xs font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>Emoji Badge</label>
                    <input type="text" maxLength={2} value={formBadge} onChange={e => setFormBadge(e.target.value)}
                      className="input text-xs w-full p-3 rounded-xl text-center" />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input type="checkbox" id="pub-check" checked={formIsPublished} onChange={e => setFormIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-0" />
                  <label htmlFor="pub-check" className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Publish immediately for student access
                  </label>
                </div>

                {/* Question Builder */}
                <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <BookOpen size={14} className="text-purple-400" />
                      Questions Builder ({formQuestions.length})
                    </h3>
                    <button type="button" onClick={handleAddQuestion}
                      className="flex items-center gap-1 text-2xs px-3 py-1.5 rounded-lg font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 hover:bg-purple-500/25">
                      <Plus size={12} /> Add Question
                    </button>
                  </div>

                  <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                    {formQuestions.map((q, qIdx) => {
                      const curType: QuestionType = q.type || (q.options && q.options.length > 0 ? 'multiple_choice' : 'essay')
                      const isMcqType = curType === 'multiple_choice' || curType === 'true_false'

                      return (
                        <div key={qIdx} className="p-4 rounded-xl border border-slate-700/60 bg-slate-800/30 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-2xs font-bold text-purple-400">Question {qIdx + 1}</span>
                            <div className="flex items-center gap-2">
                              <select
                                value={curType}
                                onChange={e => handleQuestionTypeChange(qIdx, e.target.value as QuestionType)}
                                className="input text-2xs p-1.5 rounded-lg bg-slate-900 text-slate-200">
                                <option value="multiple_choice">Multiple Choice (MCQ)</option>
                                <option value="true_false">True / False</option>
                                <option value="short_answer">Short Answer (Written)</option>
                                <option value="essay">Essay / Subjective</option>
                                <option value="coding">Coding Problem</option>
                              </select>
                              {formQuestions.length > 1 && (
                                <button type="button" onClick={() => handleRemoveQuestion(qIdx)} className="text-red-400 hover:text-red-300">
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>

                          <input type="text" required value={q.text} onChange={e => handleQuestionTextChange(qIdx, e.target.value)}
                            placeholder="Enter question prompt..." className="input text-xs w-full p-2.5 rounded-lg" />

                          {/* MCQ options */}
                          {isMcqType && q.options && (
                            <div className="grid grid-cols-2 gap-2">
                              {q.options.map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-1.5">
                                  <input
                                    type="radio"
                                    name={`correct-${qIdx}`}
                                    checked={q.correct === optIdx}
                                    onChange={() => handleCorrectOptionChange(qIdx, optIdx)}
                                    className="w-3.5 h-3.5 text-blue-500 focus:ring-0"
                                  />
                                  <input
                                    type="text"
                                    required
                                    value={opt}
                                    onChange={e => handleOptionChange(qIdx, optIdx, e.target.value)}
                                    placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                    className="input text-2xs w-full p-2 rounded-lg"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Non-MCQ Rubric & Model Answer */}
                          {!isMcqType && (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={q.rubric || ''}
                                onChange={e => handleRubricChange(qIdx, e.target.value)}
                                placeholder="Scoring Rubric / Key terms expected..."
                                className="input text-2xs w-full p-2 rounded-lg"
                              />
                              <textarea
                                rows={2}
                                value={q.correctAnswer || ''}
                                onChange={e => handleCorrectAnswerTextChange(qIdx, e.target.value)}
                                placeholder="Expected model answer or code solution..."
                                className="input text-2xs w-full p-2 rounded-lg font-mono"
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button type="button" onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-700 text-slate-300 hover:bg-slate-600">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white"
                    style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
                    <Save size={14} /> {editingQuizId ? 'Update Quiz' : 'Save Quiz'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SUBMISSIONS & ANALYTICS MODAL ───────────────────────── */}
      <AnimatePresence>
        {analyticsQuiz && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="card p-6 max-w-lg w-full space-y-4 border-2 border-purple-500/40 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <BarChart3 size={16} className="text-purple-400" />
                  Submissions Analytics — {analyticsQuiz.title}
                </h3>
                <button onClick={() => setAnalyticsQuiz(null)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                  <p className="text-base font-extrabold text-blue-400">{analyticsQuiz.attempts}</p>
                  <p className="text-2xs text-slate-500">Submissions</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                  <p className="text-base font-extrabold text-emerald-400">92%</p>
                  <p className="text-2xs text-slate-500">Avg Score</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                  <p className="text-base font-extrabold text-purple-400">100%</p>
                  <p className="text-2xs text-slate-500">Pass Rate</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Recent Student Attempts</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {((activeQuiz as any)?.attempts || []).length > 0 ? (
                    ((activeQuiz as any)?.attempts || []).map((attempt: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/60 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-slate-200">{attempt.name}</p>
                          <p className="text-2xs text-slate-500">{attempt.time}</p>
                        </div>
                        <span className="font-extrabold text-emerald-400">{attempt.score}%</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-2xs text-slate-500 italic p-3 text-center border border-dashed border-slate-800 rounded-lg">
                      No recent student attempts recorded yet for this quiz.
                    </p>
                  )}
                </div>
              </div>

              <button onClick={() => setAnalyticsQuiz(null)}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-700 text-slate-200 hover:bg-slate-600">
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
